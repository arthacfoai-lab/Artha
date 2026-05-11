require('dotenv').config();

const fs = require('fs');

const path = require('path');

const axios = require('axios');

const {
  MODELS
} = require('../config/constants');

// ======================================
// AGENT DEFINITIONS
// ======================================

const AGENTS = {

  ARTHA: {

    name: 'ARTHA',

    role: 'CEO — Orchestrator',

    model: MODELS.SMART,

    soulPath: path.join(
      __dirname,
      '../souls/artha-ceo/SOUL.md'
    ),

    budget: 50,

    emoji: '🏢',

    handles: [
      'complex',
      'unknown',
      'escalation'
    ]

  },

  TEJAS: {

    name: 'TEJAS',

    role: 'CA — GST + Compliance',

    model: MODELS.FAST,

    soulPath: path.join(
      __dirname,
      '../souls/tejas-ca/SOUL.md'
    ),

    budget: 30,

    emoji: '📋',

    handles: [
      'gst',
      'tax',
      'compliance',
      'filing'
    ]

  },

  VIVEK: {

    name: 'VIVEK',

    role: 'CFO — P&L + Cash Flow',

    model: MODELS.FAST,

    soulPath: path.join(
      __dirname,
      '../souls/vivek-cfo/SOUL.md'
    ),

    budget: 30,

    emoji: '📊',

    handles: [
      'profit',
      'loss',
      'report',
      'cashflow'
    ]

  },

  LEKHAK: {

    name: 'LEKHAK',

    role: 'Bookkeeper — Daily Entries',

    model: MODELS.FAST,

    soulPath: path.join(
      __dirname,
      '../souls/lekhak-books/SOUL.md'
    ),

    budget: 20,

    emoji: '📝',

    handles: [
      'entry',
      'expense',
      'income',
      'bill'
    ]

  },

  DHAN: {

    name: 'DHAN',

    role: 'Support — Owner Queries',

    model: MODELS.FAST,

    soulPath: path.join(
      __dirname,
      '../souls/dhan-support/SOUL.md'
    ),

    budget: 20,

    emoji: '💬',

    handles: [
      'help',
      'support',
      'onboard'
    ]

  }

};

// ======================================
// DEFAULT SOUL
// ======================================

function defaultSoul(agentKey) {

  return `
You are ${agentKey},
an AI accounting assistant
for Indian businesses.

Always reply in Hinglish.

Be:
- professional
- concise
- helpful
- accurate
`;

}

// ======================================
// LOAD SOUL
// ======================================

function loadSoul(agentKey) {

  const agent = AGENTS[agentKey];

  if (!agent) {

    return defaultSoul(agentKey);

  }

  try {

    if (!fs.existsSync(agent.soulPath)) {

      console.warn(
        `⚠ Missing soul: ${agent.soulPath}`
      );

      return defaultSoul(agentKey);

    }

    const soul = fs.readFileSync(
      agent.soulPath,
      'utf8'
    );

    console.log(
      `✓ Soul loaded: ${agent.name}`
    );

    return soul;

  } catch (err) {

    console.error(
      `✗ Soul error [${agentKey}]`,
      err.message
    );

    return defaultSoul(agentKey);

  }

}

// ======================================
// BUILD CONTEXT
// ======================================

function buildContext(context = {}) {

  let ctx = '';

  if (context.user) {

    ctx += `\nUser: ${
      context.user.name || 'Owner'
    }`;

  }

  if (context.platform) {

    ctx += `\nPlatform: ${context.platform}`;

  }

  if (context.company) {

    ctx += `\nCompany: ${context.company}`;

  }

  return ctx;

}

// ======================================
// CALL AGENT
// ======================================

async function callAgent(
  agentKey,
  userMessage,
  context = {}
) {

  const agent = AGENTS[agentKey];

  if (!agent) {

    throw new Error(
      `Unknown agent: ${agentKey}`
    );

  }

  const soul = loadSoul(agentKey);

  const contextStr = buildContext(context);

  console.log(
    `\n→ ${agent.emoji} ${agent.name} thinking...`
  );

  try {

    const response = await axios.post(

      'https://api.groq.com/openai/v1/chat/completions',

      {

        model: agent.model,

        temperature: 0.7,

        max_tokens: 500,

        messages: [

          {
            role: 'system',
            content: soul + contextStr
          },

          {
            role: 'user',
            content: userMessage
          }

        ]

      },

      {

        headers: {

          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`,

          'Content-Type':
            'application/json'

        },

        timeout: 30000

      }

    );

    const reply = response.data
      ?.choices?.[0]
      ?.message
      ?.content
      ?.trim();

    if (!reply) {

      throw new Error(
        'Empty response from model'
      );

    }

    console.log(
      `✓ ${agent.name} replied`
    );

    return {

      agent: agent.name,

      role: agent.role,

      emoji: agent.emoji,

      model: agent.model,

      reply

    };

  } catch (err) {

    const status =
      err.response?.status;

    const errMsg =
      err.response?.data?.error?.message
      || err.message;

    console.error(
      `✗ ${agent.name} error:`,
      errMsg
    );

    // ==================================
    // FRIENDLY ERRORS
    // ==================================

    if (status === 401) {

      throw new Error(
        'Invalid GROQ API key'
      );

    }

    if (status === 429) {

      throw new Error(
        'Rate limit hit. Thoda wait karein.'
      );

    }

    if (status >= 500) {

      throw new Error(
        'AI service temporarily unavailable'
      );

    }

    throw new Error(
      `${agent.name} unavailable: ${errMsg}`
    );

  }

}

// ======================================
// HELPERS
// ======================================

function getAgent(agentKey) {

  return AGENTS[agentKey] || null;

}

function getAllAgents() {

  return Object.values(AGENTS);

}

function getAgentSoul(agentKey) {

  return loadSoul(agentKey);

}

// ======================================
// EXPORTS
// ======================================

module.exports = {

  AGENTS,

  callAgent,

  getAgent,

  getAllAgents,

  getAgentSoul,

  loadSoul

};
