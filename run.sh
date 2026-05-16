#!/bin/bash
echo "🏁 Launching OptiRH Development Environment..."

# Use concurrently to run everything in one terminal window
npm run dev &
echo "⏳ Waiting for dev servers to warm up (10s)..."
sleep 10
npm start
