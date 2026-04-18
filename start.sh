#!/bin/bash
set -e

echo "启动后端..."
cd /workspace/backend
export $(cat .env | grep -v '^#' | xargs)
./channer-server &
BACKEND_PID=$!

echo "后端 PID: $BACKEND_PID"
echo "启动前端..."
cd /workspace/frontend
npm run dev &
FRONTEND_PID=$!

echo "前端 PID: $FRONTEND_PID"
echo ""
echo "=== 启动完成 ==="
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8080"
echo "登录: admin / admin123"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
