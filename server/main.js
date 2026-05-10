require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { v4: uuidv4 } = require('uuid');

const Database = require('better-sqlite3');

const {
  routeMessage,
  detectIntent
} = require('./router');

const {
  callAgent,
  getAllAgents
} = require('./agents');

const app = express();

const PORT =
  process.env.PORT || 3000;

// ======================================
// MIDDLEWARE
// ======================================

app.use(helmet());

app.use(cors());

app.use(morgan('dev'));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// ======================================
// DATABASE
// ======================================

const DB_PATH =
  process.env.DB_PATH ||
  './database/artha.db';

let db;

try {

  db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');

  db.pragma('foreign_keys = ON');

  console.log(
    '✓ Database connected:',
    DB_PATH
  );

} catch (err) {

  console.error(
    '✗ Database error:',
    err.message
  );

  process.exit(1);

}

// ======================================
// CREATE TABLES
// ======================================

db.exec(`

CREATE TABLE IF NOT EXISTS users (

  id TEXT PRIMARY KEY,

  phone TEXT UNIQUE,

  name TEXT,

  role TEXT,

  company_id TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS audit_logs (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  agent_id TEXT,

  action TEXT,

  details TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS journal_entries (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  type TEXT,

  amount REAL,

  description TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

`);

console.log('✓ Tables ready');

// ======================================
// HELPERS
// ======================================

function auditLog(
  companyId,
  agentId,
  action,
  details
) {

  try {

    db.prepare(`

      INSERT INTO audit_logs
      (
        id,
        company_id,
        agent_id,
        action,
        details
      )

      VALUES (?, ?, ?, ?, ?)

    `).run(

      uuidv4(),

      companyId || 'system',

      agentId,

      action,

      JSON.stringify(details)

    );

  } catch (err) {

    console.error(
      'Audit log error:',
      err.message
    );

  }

}

// ======================================

function getOrCreateUser(phone) {

  let user = db.prepare(

    'SELECT * FROM users WHERE phone = ?'

  ).get(phone);

  // ============================
  // CREATE USER
  // ============================

  if (!user) {

    const userId = uuidv4();

    db.prepare(`

      INSERT INTO users
      (
        id,
        phone,
        name,
        role
      )

      VALUES (?, ?, ?, ?)

    `).run(

      userId,

      phone,

      'New User',

      'owner'

    );

    user = db.prepare(

      'SELECT * FROM users WHERE id = ?'

    ).get(userId);

    console.log(
      '✓ New user created:',
      phone
    );

  }

  return user;

}

// ======================================
// HEALTH CHECK
// ======================================

app.get('/health', (req, res) => {

  res.json({

    status: 'ok',

    service: 'ARTHA AI',

    version: '1.0.0',

    timestamp:
      new Date().toISOString(),

    database: 'connected',

    agents: [
      'ARTHA',
      'TEJAS',
      'VIVEK',
      'LEKHAK',
      'DHAN'
    ]

  });

});

// ======================================
// MESSAGE ROUTE
// ======================================

app.post('/message', async (req, res) => {

  const {
    message,
    phone,
    platform
  } = req.body;

  // ==================================
  // INPUT VALIDATION
  // ==================================

  if (
    !message ||
    !message.trim()
  ) {

    return res.status(400).json({

      success: false,

      error: 'Message required'

    });

  }

  if (
    !phone ||
    !phone.trim()
  ) {

    return res.status(400).json({

      success: false,

      error: 'Phone required'

    });

  }

  console.log(
    `\n→ [${platform}] ${phone}: "${message}"`
  );

  try {

    // ================================
    // USER
    // ================================

    const user =
      getOrCreateUser(phone);

    // ================================
    // ROUTING
    // ================================

    const routing =
      routeMessage(message);

    const intent =
      detectIntent(message);

    console.log(

      `→ Agent: ${routing.agent}` +
      ` | Intent: ${intent}`

    );

    // ================================
    // AGENT CALL
    // ================================

    const agentResponse =
      await callAgent(

        routing.agent,

        message,

        {
          user,
          platform
        }

      );

    // ================================
    // AUDIT LOG
    // ================================

    auditLog(

      user.company_id,

      routing.agent,

      'message_processed',

      {

        message:
          message.substring(0, 100),

        routing,

        platform

      }

    );

    // ================================
    // RESPONSE
    // ================================

    res.json({

      success: true,

      agent:
        routing.agent,

      reply:
        agentResponse.reply,

      routing

    });

  } catch (err) {

    console.error(
      '✗ Handler error:',
      err.message
    );

    auditLog(

      null,

      'system',

      'error',

      {

        error: err.message,

        message

      }

    );

    res.status(500).json({

      success: false,

      error: 'Processing failed',

      reply:
        'Maafi chahta hoon, ' +
        'kuch technical issue aa gaya. ' +
        'Dobara try karein.'

    });

  }

});

// ======================================
// GET JOURNAL ENTRIES
// ======================================

app.get('/entries/:phone', (req, res) => {

  try {

    const user = db.prepare(

      'SELECT * FROM users WHERE phone = ?'

    ).get(req.params.phone);

    if (
      !user ||
      !user.company_id
    ) {

      return res.json({
        entries: []
      });

    }

    const entries = db.prepare(`

      SELECT * FROM journal_entries

      WHERE company_id = ?

      ORDER BY created_at DESC

      LIMIT 50

    `).all(user.company_id);

    res.json({ entries });

  } catch (err) {

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// AUDIT LOGS
// ======================================

app.get('/audit', (req, res) => {

  try {

    const logs = db.prepare(`

      SELECT * FROM audit_logs

      ORDER BY created_at DESC

      LIMIT 100

    `).all();

    res.json({ logs });

  } catch (err) {

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// AGENTS
// ======================================

app.get('/agents', (req, res) => {

  res.json({

    agents:
      getAllAgents()

  });

});

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {

  console.log(
    `\n✓ ARTHA AI server running on port ${PORT}`
  );

  console.log(
    `✓ Health: http://localhost:${PORT}/health`
  );

  console.log(
    `✓ Messages: POST http://localhost:${PORT}/message`
  );

  console.log(
    `✓ Agents: http://localhost:${PORT}/agents`
  );

  console.log(
    '\n→ Waiting for messages...\n'
  );

});

// ======================================

module.exports = app;
