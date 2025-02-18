#!/bin/bash

echo "正在启动 Cursor Pro Trail 账号分享系统..."

# 检查 pm2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 pm2..."
    npm install -g pm2
fi

# 启动后端服务
echo "正在启动后端服务..."
cd server
npm install
pm2 delete cursor-backend > /dev/null 2>&1
pm2 start index.js --name cursor-backend

# 返回根目录
cd ..

# 启动前端服务
echo "正在启动前端服务..."
npm install
pm2 delete cursor-frontend > /dev/null 2>&1
pm2 start "npm run dev" --name cursor-frontend

# 显示服务状态
echo "正在检查服务状态..."
sleep 2
pm2 status

echo "系统启动完成！"
echo "前端访问地址: http://你的ip:3089"
echo "后端服务端口: 3521" 