#!/bin/bash
echo "🚀 Starting OptiRH Professional Installation..."

# Create .env if missing
if [ ! -f .env ]; then
  echo "🔧 Creating default .env file..."
  echo 'DATABASE_URL="file:./dev.db"' > .env
fi

# Install Root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup Prisma and SQLite
echo "🗄️ Initializing database..."
npx prisma migrate dev --name init --skip-seed --skip-generate
npx prisma generate
npx prisma db seed

# Create default admin account (upsert = idempotent)
echo "👤 Creating default admin account..."
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = 'file:' + require('path').resolve('prisma/dev.db');
const p = new PrismaClient();
bcrypt.hash('admin123', 10)
  .then(h => p.employee.upsert({
    where: { email: 'admin@optirh.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@optirh.com',
      password_hash: h,
      role: 'Admin',
      date_employment: new Date(),
      date_birth: new Date('1990-01-01')
    }
  }))
  .then(() => console.log('✅ Admin account ready: admin@optirh.com / admin123'))
  .finally(() => p.\$disconnect())
"

echo "✅ Installation complete! Run ./run.sh to start the app."
