#!/bin/bash
echo "🚀 Starting OptiRH Professional Installation..."

# Create .env if missing
if [ ! -f .env ]; then
  echo "🔧 Creating default .env file..."
  echo 'DATABASE_URL="file:../prisma/dev.db"' > .env
fi

# Install Root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup Prisma and SQLite
echo "🗄️ Initializing database..."
npx prisma migrate dev --name init --skip-seed --skip-generate
npx prisma generate
npx prisma db seed

echo "✅ Installation complete! Run ./run.sh to start the app."
