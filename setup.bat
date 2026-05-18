@echo off
echo 🚀 Starting OptiRH Professional Installation...

if not exist .env (
  echo 🔧 Creating default .env file...
  echo DATABASE_URL="file:../prisma/dev.db" > .env
)

echo 📦 Installing root dependencies...
call npm install

echo 🗄️ Initializing database...
call npx prisma migrate dev --name init --skip-seed --skip-generate
call npx prisma generate
call npx tsx create-agent.ts

echo ✅ Installation complete! Run run.bat to start the app.
pause
