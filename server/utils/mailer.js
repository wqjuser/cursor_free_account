const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

async function sendAccountInfo(toEmail, account) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: 'Cursor Pro Trail 账号信息',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Cursor Pro Trail 账号信息</h1>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
            <div style="color: #6b7280; font-size: 14px;">账号</div>
            <div style="color: #111827; font-weight: bold; margin-top: 4px;">${account.email}</div>
          </div>
          
          <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
            <div style="color: #6b7280; font-size: 14px;">密码</div>
            <div style="color: #111827; font-weight: bold; margin-top: 4px;">${account.password}</div>
          </div>
          
          <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
            <div style="color: #6b7280; font-size: 14px;">可用额度</div>
            <div style="color: #111827; font-weight: bold; margin-top: 4px;">${account.credits}</div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #ef4444; font-weight: bold;">⚠️ 请注意：</p>
            <ul style="color: #6b7280; font-size: 14px;">
              <li>请尽快使用账号，避免被他人占用</li>
              <li>请勿将账号信息分享给他人</li>
              <li>如遇登录问题，请及时反馈</li>
            </ul>
            <p style="color: #6b7280; font-size: 14px;">祝您使用愉快！</p>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('发送邮件失败:', error)
    return false
  }
}

module.exports = { sendAccountInfo } 