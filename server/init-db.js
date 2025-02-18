const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
require('dotenv').config()

async function initializeDatabase() {
  let connection

  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    })

    // 确保数据库存在
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`)
    await connection.query(`USE ${process.env.DB_NAME}`)

    // 读取并执行 SQL 文件
    const migrationsDir = path.join(__dirname, 'migrations')
    const sqlFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'))

    for (const file of sqlFiles) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`执行 SQL 文件: ${file}`)
      await connection.query(sqlContent)
    }

    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行初始化
initializeDatabase().catch(console.error) 