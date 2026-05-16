#!/bin/bash
echo "🚀 Starting OptiRH Professional Installation..."

# Create .env if missing
if [ ! -f .env ]; then
  echo "🔧 Creating default .env file..."
  echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
fi

# Install Root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup Prisma and SQLite
echo "🗄️ Setting up database..."
npx prisma migrate dev --name init
npx prisma db seed

# Install workspace dependencies
echo "🎨 Installing renderer dependencies..."
npm install --workspace=renderer

# Install electron dependencies
echo "⚡ Installing electron dependencies..."
npm install --workspace=electron

echo "✅ Installation complete! Run ./run.sh to start the app."
