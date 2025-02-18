const express = require('express')
const cors = require('cors')
const pool = require('./db')
const { sendAccountInfo } = require('./utils/mailer')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// 获取客户端真实IP地址
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress;
}

// 检查IP和邮箱发送次数限制
async function checkIPAndEmailLimit(connection, ip, email) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 检查IP和邮箱组合的使用次数
  const [rows] = await connection.execute(
    'SELECT COUNT(*) as count FROM ip_logs WHERE (ip_address = ? OR email = ?) AND created_at >= ?',
    [ip, email, today]
  );
  
  return rows[0].count < 2; // 允许每天最多获取2个账号
}

// 记录IP发送日志
async function logIPUsage(connection, ip, email) {
  await connection.execute(
    'INSERT INTO ip_logs (ip_address, email) VALUES (?, ?)',
    [ip, email]
  );
}

// 验证账号格式
function validateAccount(account) {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(account.email)) {
    return { isValid: false, error: '邮箱格式不正确' };
  }

  // 验证密码
  if (!account.password || account.password.length < 6) {
    return { isValid: false, error: '密码长度不能小于6位' };
  }

  // 验证额度
  if (typeof account.credits !== 'number' || account.credits <= 0) {
    return { isValid: false, error: '额度必须为正数' };
  }

  return { isValid: true };
}

// 添加账号接口
app.post('/api/accounts', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { accounts } = req.body;
    
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ error: '请提供要添加的账号列表' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const account of accounts) {
      // 验证账号格式
      const validation = validateAccount(account);
      if (!validation.isValid) {
        results.failed.push({
          account: account.email,
          reason: validation.error
        });
        continue;
      }

      try {
        console.log('正在添加账号:', account.email);
        
        // 检查账号是否已存在
        const [existing] = await connection.execute(
          'SELECT id FROM accounts WHERE email = ?',
          [account.email]
        );

        if (existing.length > 0) {
          console.log('账号已存在:', account.email);
          results.failed.push({
            account: account.email,
            reason: '账号已存在'
          });
          continue;
        }

        // 添加账号，使用默认值处理可选字段
        const [result] = await connection.execute(
          'INSERT INTO accounts (email, password, credits, user_id, access_token, refresh_token, is_used, expiry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NOW(), NOW())',
          [
            account.email, 
            account.password, 
            account.credits,
            account.user_id || null,
            account.access_token || null,
            account.refresh_token || null
          ]
        );

        console.log('添加账号成功:', account.email, '插入ID:', result.insertId);
        results.success.push(account.email);
      } catch (error) {
        console.error('添加账号失败:', error);
        console.error('账号信息:', account);
        console.error('SQL错误码:', error.code);
        console.error('SQL错误状态:', error.sqlState);
        console.error('SQL错误消息:', error.sqlMessage);
        
        results.failed.push({
          account: account.email,
          reason: `数据库操作失败: ${error.message || error.sqlMessage || '未知错误'}`
        });
      }
    }

    res.json({
      message: `成功添加 ${results.success.length} 个账号，失败 ${results.failed.length} 个`,
      results
    });
  } catch (error) {
    console.error('添加账号整体失败:', error);
    res.status(500).json({ 
      error: '添加账号失败',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 获取未使用账号列表接口
app.get('/api/accounts/available', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // 获取分页参数并确保是数字类型
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = parseInt((page - 1) * pageSize);
    
    // 验证分页参数
    if (isNaN(offset) || isNaN(pageSize) || offset < 0 || pageSize <= 0) {
      return res.status(400).json({ error: '分页参数无效' });
    }
    
    // 获取并处理邮箱后缀参数
    let emailSuffixes = [];
    try {
      emailSuffixes = req.query.emailSuffixes ? JSON.parse(req.query.emailSuffixes) : [];
      if (!Array.isArray(emailSuffixes)) {
        return res.status(400).json({ error: 'emailSuffixes必须是字符串数组' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'emailSuffixes参数格式不正确' });
    }
    
    console.log('开始查询可用账号列表...');
    console.log('查询参数:', { page, pageSize, offset, emailSuffixes });
    
    // 获取账号状态统计
    let statsResult, countResult, rows;
    
    if (emailSuffixes.length === 0) {
      // 无过滤条件时的查询
      [statsResult] = await connection.execute(
        'SELECT is_used, COUNT(*) as count FROM accounts GROUP BY is_used'
      );
      
      [countResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM accounts WHERE is_used = 0'
      );
      
      const query = `
        SELECT id, email, password, credits, created_at, is_used, expiry, access_token, refresh_token, user_id 
        FROM accounts 
        WHERE is_used = 0 
        ORDER BY created_at DESC 
        LIMIT ?, ?
      `;
      
      [rows] = await connection.query(query, [offset, pageSize]);
    } else {
      // 有过滤条件时的查询
      const suffixConditions = emailSuffixes.map(() => 'email LIKE ?').join(' OR ');
      const suffixParams = emailSuffixes.map(suffix => `%${suffix}`);
      
      // 统计查询
      [statsResult] = await connection.execute(
        `SELECT is_used, COUNT(*) as count 
         FROM accounts 
         WHERE (${suffixConditions})
         GROUP BY is_used`,
        suffixParams
      );
      
      // 总数查询
      [countResult] = await connection.execute(
        `SELECT COUNT(*) as total 
         FROM accounts 
         WHERE is_used = 0 AND (${suffixConditions})`,
        suffixParams
      );
      
      // 数据查询
      const query = `
        SELECT id, email, password, credits, created_at, is_used, expiry, access_token, refresh_token, user_id 
        FROM accounts 
        WHERE is_used = 0 AND (${suffixConditions})
        ORDER BY created_at DESC 
        LIMIT ?, ?
      `;
      
      const queryParams = [...suffixParams, offset, pageSize];
      console.log('SQL参数:', queryParams);
      console.log('参数类型:', queryParams.map(param => typeof param));
      
      [rows] = await connection.query(query, queryParams);
    }
    
    const total = countResult[0].total;
    
    // 格式化数据
    const formattedRows = rows.map(row => ({
      id: row.id,
      email: row.email,
      password: row.password,
      credits: row.credits,
      uploadTime: row.created_at,
      expiry: row.expiry,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      user_id: row.user_id
    }));
    
    res.json({
      accounts: formattedRows,
      total,
      page,
      pageSize,
      stats: statsResult,
      filters: {
        emailSuffixes
      }
    });
  } catch (error) {
    console.error('获取可用账号列表失败:', error);
    res.status(500).json({ 
      error: '获取可用账号列表失败',
      details: error.message || error.sqlMessage
    });
  } finally {
    connection.release();
  }
});

// 使用账号并发送邮件
app.post('/api/accounts/:id/use', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { email } = req.body;
    const clientIP = getClientIP(req);

    if (!email) {
      return res.status(400).json({ error: '请提供接收账号信息的邮箱' });
    }

    // 检查IP和邮箱限制
    const canSend = await checkIPAndEmailLimit(connection, clientIP, email);
    if (!canSend) {
      return res.status(429).json({ 
        error: '为了让更多人能享用便利，同一邮箱或IP每天只能获取两个账号，请明天再来' 
      });
    }
    
    // 先获取账号信息
    const [accounts] = await connection.execute(
      'SELECT id, email, password, credits FROM accounts WHERE id = ? AND is_used = 0',
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: '账号不存在或已被使用' });
    }

    const account = accounts[0];

    // 发送邮件
    const emailSent = await sendAccountInfo(email, account);
    if (!emailSent) {
      return res.status(500).json({ error: '发送邮件失败' });
    }

    // 记录IP使用
    await logIPUsage(connection, clientIP, email);

    // 标记账号为已使用
    await connection.execute(
      'UPDATE accounts SET is_used = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({ message: '账号信息已发送到您的邮箱' });
  } catch (error) {
    console.error('使用账号失败:', error);
    res.status(500).json({ 
      error: '使用账号失败',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 检查账号是否可用
app.get('/api/accounts/:id/check', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    // 检查账号状态
    const [accounts] = await connection.execute(
      'SELECT id, is_used FROM accounts WHERE id = ?',
      [id]
    );

    if (accounts.length === 0) {
      return res.json({ 
        available: false,
        error: '账号不存在'
      });
    }

    const account = accounts[0];
    
    res.json({
      available: !account.is_used,
      error: account.is_used ? '该账号已被使用，请选择其他账号' : null
    });
  } catch (error) {
    console.error('检查账号状态失败:', error);
    res.status(500).json({ 
      available: false,
      error: '检查账号状态失败'
    });
  } finally {
    connection.release();
  }
});

// 添加一个测试接口来检查连接
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [rows] = await connection.execute('SELECT 1 as test')
    connection.release()
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    res.status(500).json({ error: '数据库连接测试失败' })
  }
})

// 更新账号数据接口
app.put('/api/accounts/:id/update', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const email = req.params.id; // 使用邮箱作为查询条件
    const { access_token, refresh_token, credits, user_id } = req.body;
    
    // 验证请求数据并确保类型正确
    if (!access_token || !refresh_token || !credits || !user_id) {
      return res.status(400).json({ 
        error: '缺少必要的更新数据',
        details: '请提供 access_token, refresh_token, credits 和 user_id'
      });
    }

    // 确保 credits 是数字类型
    const creditsNumber = Number(credits);
    if (isNaN(creditsNumber)) {
      return res.status(400).json({ 
        error: '数据格式不正确',
        details: 'credits 必须是有效的数字'
      });
    }

    // 更新账号数据
    const [result] = await connection.execute(
      'UPDATE accounts SET access_token = ?, refresh_token = ?, credits = ?, user_id = ?, updated_at = NOW() WHERE email = ?',
      [access_token, refresh_token, creditsNumber, user_id, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到指定账号' });
    }

    res.json({ 
      message: '账号数据更新成功',
      updatedEmail: email
    });
  } catch (error) {
    console.error('更新账号数据失败:', error);
    res.status(500).json({ 
      error: '更新账号数据失败',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 更新账号使用状态接口
app.put('/api/accounts/:email/mark-used', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { email } = req.params;
    
    // 验证email参数
    if (!email) {
      return res.status(400).json({ 
        error: '缺少email参数'
      });
    }

    // 更新账号使用状态
    const [result] = await connection.execute(
      'UPDATE accounts SET is_used = 1, updated_at = NOW() WHERE email = ?',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到指定账号' });
    }

    res.json({ 
      message: '账号使用状态更新成功',
      updatedEmail: email
    });
  } catch (error) {
    console.error('更新账号使用状态失败:', error);
    res.status(500).json({ 
      error: '更新账号使用状态失败',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'
app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`)
})