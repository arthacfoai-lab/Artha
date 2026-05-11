#!/bin/bash

echo "================================"
echo "  ARTHA AI — Starting..."
echo "================================"

cd /workspaces/Artha || exit

# ======================================
# CHECK ENV
# ======================================

if [ ! -f .env ]; then

  echo "✗ .env missing!"
  exit 1

fi

# ======================================
# DATABASE
# ======================================

if [ ! -f database/artha.db ]; then

  echo "→ Database missing. Running migration..."

  node database/migrate.js

fi

# ======================================
# INSTALL PACKAGES
# ======================================

if [ ! -d node_modules ]; then

  echo "→ Installing packages..."

  npm install

fi

# ======================================
# START PAPERCLIP
# ======================================

echo "→ Starting Paperclip..."

PORT=3001 npx paperclipai onboard --yes &

PAPERCLIP_PID=$!

sleep 8

# ======================================
# REGISTER AGENTS
# ======================================

echo "→ Registering agents..."

node config/paperclip-setup.js

# ======================================
# START SERVER
# ======================================

echo "→ Starting server..."

node server/main.js &

SERVER_PID=$!

sleep 3

# ======================================
# START TELEGRAM BOT
# ======================================

echo "→ Starting Telegram bot..."

node integrations/telegram.js &

BOT_PID=$!

# ======================================
# DONE
# ======================================

echo ""
echo "================================"
echo "✓ ARTHA AI fully running!"
echo ""
echo "  Paperclip : http://localhost:3001"
echo "  Server    : http://localhost:4000"
echo ""
echo "  PIDs:"
echo "  Paperclip : $PAPERCLIP_PID"
echo "  Server    : $SERVER_PID"
echo "  Bot       : $BOT_PID"
echo "================================"

wait
