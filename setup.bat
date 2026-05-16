@echo off
echo 🚀 Starting OptiRH Professional Installation...

if not exist .env (
  echo 🔧 Creating default .env file...
  echo DATABASE_URL="file:./prisma/dev.db" > .env
)

echo 📦 Installing root dependencies...
call npm install

echo 🗄️ Setting up database...
call npx prisma migrate dev --name init
call npx prisma db seed

echo 🎨 Installing renderer dependencies...
call npm install --workspace=renderer

echo ⚡ Installing electron dependencies...
call npm install --workspace=electron

echo ✅ Installation complete! Run run.bat to start the app.
pause
