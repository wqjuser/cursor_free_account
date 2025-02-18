const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
  debug: process.env.NODE_ENV === 'development'
})

// 添加连接错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err)
})

// 测试连接的函数
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('数据库连接测试成功')
    return true
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return false
  }
}

// 初始化时测试连接
testConnection()

module.exports = pool 