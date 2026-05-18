@echo off
echo ðŸš€ Starting OptiRH Professional Installation...

if not exist .env (
  echo ðŸ"§ Creating default .env file...
  echo DATABASE_URL="file:./prisma/dev.db" > .env
)

echo ðŸ"¦ Installing root dependencies...
call npm install

echo ðŸ—„ï¸ Initializing database...
call npx prisma migrate dev --name init --skip-seed --skip-generate
call npx prisma generate
call npx prisma db seed

echo âœ… Installation complete! Run run.bat to start the app.
pause
