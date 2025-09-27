#!/bin/bash

# Multi-Agent 舆论模拟系统前端安装脚本

echo "🚀 开始安装前端依赖..."

# 检查Node.js版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 16+"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 检查npm版本
npm_version=$(npm -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未找到npm"
    exit 1
fi

echo "✅ npm版本: $npm_version"

# 安装依赖
echo "📦 安装依赖包..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功！"
    echo ""
    echo "🎉 安装完成！"
    echo ""
    echo "运行以下命令启动开发服务器："
    echo "  npm run dev"
    echo ""
    echo "访问 http://localhost:3000 查看应用"
else
    echo "❌ 依赖安装失败，请检查网络连接和Node.js版本"
    exit 1
fi
