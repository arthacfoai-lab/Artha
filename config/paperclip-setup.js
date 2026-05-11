require('dotenv').config();

const axios = require('axios');

// ======================================
// PAPERCLIP API
// ======================================

const PAPERCLIP =
  'http://localhost:3001/api';

// ======================================
// COMPANY
// ======================================

const COMPANY = {

  name: 'ARTHA AI CA',

  mission:
    'AI CA for Indian MSMEs',

  currency: 'INR',

  timezone: 'Asia/Kolkata',

  industry:
    'Financial Services'

};

// ======================================
// AGENTS
// ======================================

const AGENTS = [

  {

    name: 'ARTHA',

    role:
      'CEO — Orchestrator',

    model:
      'llama-3.3-70b-versatile',

    budget_per_day: 50,

    heartbeat_minutes: 30

  },

  {

    name: 'TEJAS',

    role:
      'CA — GST + Compliance',

    model:
      'llama-3.1-8b-instant',

    budget_per_day: 30,

    heartbeat_minutes: 60

  },

  {

    name: 'VIVEK',

    role:
      'CFO — P&L + Cash Flow',

    model:
      'llama-3.1-8b-instant',

    budget_per_day: 30,

    heartbeat_minutes: 60

  },

  {

    name: 'LEKHAK',

    role:
      'Bookkeeper — Daily Entries',

    model:
      'llama-3.1-8b-instant',

    budget_per_day: 20,

    heartbeat_minutes: 0

  },

  {

    name: 'DHAN',

    role:
      'Support — Owner Queries',

    model:
      'llama-3.1-8b-instant',

    budget_per_day: 20,

    heartbeat_minutes: 0

  }

];

// ======================================
// SETUP
// ======================================

async function setup() {

  console.log(
    '→ Setting up Paperclip...\n'
  );

  // ====================================
  // HEALTH CHECK
  // ====================================

  try {

    const health =
      await axios.get(

        `${PAPERCLIP}/health`,

        { timeout: 3000 }

      );

    console.log(
      '✓ Paperclip running'
    );

    console.log(
      '✓ Health:',
      health.data.status || 'ok'
    );

  } catch (err) {

    console.log(
      '✗ Paperclip not running'
    );

    console.log(
      '→ Check port 3001'
    );

    console.log(
      err.message
    );

    process.exit(1);

  }

  // ====================================
  // CREATE COMPANY
  // ====================================

  try {

    await axios.post(

      `${PAPERCLIP}/company`,

      COMPANY

    );

    console.log(
      '✓ Company created'
    );

  } catch (err) {

    console.log(
      '→ Company exists or endpoint unavailable'
    );

  }

  // ====================================
  // CREATE AGENTS
  // ====================================

  console.log(
    '\n→ Creating agents...\n'
  );

  for (const agent of AGENTS) {

    try {

      await axios.post(

        `${PAPERCLIP}/agents`,

        agent

      );

      console.log(
        `✓ ${agent.name} — ${agent.role}`
      );

    } catch (err) {

      console.log(
        `→ ${agent.name} exists or endpoint unavailable`
      );

    }

  }

  // ====================================
  // VERIFY AGENTS
  // ====================================

  try {

    const res =
      await axios.get(

        `${PAPERCLIP}/agents`

      );

    const agents =
      res.data.agents ||
      res.data ||
      [];

    console.log(
      `\n✓ Agents in Paperclip: ${agents.length}`
    );

    agents.forEach(a => {

      console.log(
        `  → ${a.name || 'Unnamed'}`
      );

    });

  } catch (err) {

    console.log(
      '\n→ Agent verification unavailable'
    );

  }

  // ====================================
  // DONE
  // ====================================

  console.log(
    '\n✓ Paperclip setup complete!'
  );

}

// ======================================

setup();
