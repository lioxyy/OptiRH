@echo off
echo 🚀 Starting OptiRH Professional Installation...

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
