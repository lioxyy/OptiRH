#!/bin/bash
echo "🏁 Launching OptiRH Development Environment..."

# Start compilers (Vite + TSC watch) in background
npm run dev &
DEV_PID=$!

# Kill background compilers when this script exits
trap "kill $DEV_PID 2>/dev/null" EXIT

echo "⏳ Waiting for dev servers to warm up (10s)..."
sleep 10
npm start
