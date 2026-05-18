@echo off
echo Starting OptiRH Professional Installation...

if not exist .env (
  echo Creating default .env file...
  echo DATABASE_URL="file:./dev.db" > .env
)

echo Installing root dependencies...
call npm install

echo Initializing database...
call npx prisma migrate dev --name init --skip-seed --skip-generate
call npx prisma generate
call npx prisma db seed

echo Creating default admin account...
call node -e "const bcrypt=require('bcryptjs');const {PrismaClient}=require('@prisma/client');process.env.DATABASE_URL='file:'+require('path').resolve('prisma/dev.db');const p=new PrismaClient();bcrypt.hash('admin123',10).then(h=>p.employee.upsert({where:{email:'admin@optirh.com'},update:{},create:{name:'Admin',email:'admin@optirh.com',password_hash:h,role:'Admin',date_employment:new Date(),date_birth:new Date('1990-01-01')}})).then(()=>console.log('Admin account ready.')).finally(()=>p.$disconnect())"

echo Installation complete! Run run.bat to start the app.
pause

