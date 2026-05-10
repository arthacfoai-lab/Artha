require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// ================================
// CONFIG
// ================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const SERVER =
  `http://localhost:${process.env.PORT || 3000}`;

if (!TOKEN) {

  console.error(
    '✗ TELEGRAM_BOT_TOKEN missing in .env'
  );

  process.exit(1);
}

// ================================
// CREATE BOT
// ================================

const bot = new TelegramBot(
  TOKEN,
  { polling: true }
);

console.log('✓ ARTHA AI Telegram bot starting...');
console.log(`✓ Server: ${SERVER}`);

// ================================
// AGENT EMOJIS
// ================================

const EMOJI = {
  ARTHA:  '🏢',
  TEJAS:  '📋',
  VIVEK:  '📊',
  LEKHAK: '📝',
  DHAN:   '💬'
};

// ================================
// /start
// ================================

bot.onText(/\/start/, (msg) => {

  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,

`🙏 Namaste! Main ARTHA hoon.

Aapka AI CA assistant — 24/7 free.

Kya kar sakta hoon:

📝 Expense:
bijli 3500 diya

📋 GST:
GSTR-1 kab file karein?

📊 Profit:
is month kitna kamaya?

💬 Help:
help chahiye

Shuru karte hain! 🚀`
  );

});

// ================================
// /status
// ================================

bot.onText(/\/status/, async (msg) => {

  const chatId = msg.chat.id;

  try {

    const res = await axios.get(
      `${SERVER}/health`,
      { timeout: 5000 }
    );

    bot.sendMessage(

      chatId,

`✅ ARTHA AI Status

Server: ${res.data.status}
Database: ${res.data.database}
Agents: ${res.data.agents.join(', ')}`

    );

  } catch (e) {

    bot.sendMessage(
      chatId,
      '⚠️ Server offline.\nRun: node server/main.js'
    );

  }

});

// ================================
// /agents
// ================================

bot.onText(/\/agents/, (msg) => {

  const chatId = msg.chat.id;

  bot.sendMessage(

    chatId,

`ARTHA AI — 5 Agents

🏢 ARTHA — CEO Orchestrator
📋 TEJAS — CA + GST Expert
📊 VIVEK — CFO + P&L
📝 LEKHAK — Bookkeeper
💬 DHAN — Support

Sahi agent automatically select hoga.`

  );

});

// ================================
// /help
// ================================

bot.onText(/\/help/, (msg) => {

  const chatId = msg.chat.id;

  bot.sendMessage(

    chatId,

`Commands:

/start
/status
/agents
/help

Examples:

bijli bill 3500 diya
GST kab file karni hai?
profit report chahiye
help chahiye`

  );

});

// ================================
// ALL USER MESSAGES
// ================================

bot.on('message', async (msg) => {

  // Skip commands

  if (
    !msg.text ||
    msg.text.startsWith('/')
  ) return;

  const chatId = msg.chat.id;

  const phone = `tg_${chatId}`;

  const userMsg = msg.text;

  console.log(`\n→ [${chatId}] ${userMsg}`);

  // typing indicator

  bot.sendChatAction(chatId, 'typing');

  try {

    // ============================
    // SEND TO SERVER
    // ============================

    const response = await axios.post(

      `${SERVER}/message`,

      {
        message: userMsg,
        phone: phone,
        platform: 'telegram'
      },

      {
        timeout: 30000
      }

    );

    const data = response.data;

    const emoji =
      EMOJI[data.agent] || '🤖';

    // ============================
    // REPLY
    // ============================

    const reply =
`${emoji} ${data.agent}

${data.reply}`;

    bot.sendMessage(chatId, reply);

    console.log(
      `✓ ${data.agent} → [${chatId}]`
    );

  } catch (err) {

    console.error(
      'Bot error:',
      err.message
    );

    // ============================
    // SERVER OFFLINE
    // ============================

    if (err.code === 'ECONNREFUSED') {

      bot.sendMessage(

        chatId,

`⚠️ Server offline.

Admin ko bolo:
node server/main.js`

      );

    } else {

      bot.sendMessage(

        chatId,

'⚠️ Kuch issue aa gaya. Dobara try karein.'

      );

    }

  }

});

// ================================
// POLLING ERRORS
// ================================

bot.on('polling_error', (err) => {

  console.error(
    'Polling error:',
    err.message
  );

  if (
    err.message.includes('409')
  ) {

    console.error(
      '✗ Another bot instance running!'
    );

    console.error(
      'Fix: pkill -f "node integrations/telegram"'
    );

  }

});

console.log('✓ Bot polling active.');
console.log('→ Send /start on Telegram!\n');
