require('dotenv').config();

const axios = require('axios');

const { loadSoul } =
  require('../souls/load-soul');

const soul =
  loadSoul('./souls/SOUL.md');

// ======================================
// AGENT SYSTEM PROMPTS
// ======================================

const AGENTS = {

  ARTHA:
`You are ARTHA.
CEO AI CA assistant.
Speak in Hinglish.
Guide users simply.`,

  TEJAS:
`You are TEJAS.
GST and tax expert.
Explain GST simply in Hinglish.`,

  VIVEK:
`You are VIVEK.
CFO and profit analyst.
Explain business finance clearly.`,

  LEKHAK:
`You are LEKHAK.
Bookkeeping expert.
Record expenses and income carefully.`,

  DHAN:
`You are DHAN.
Customer support assistant.
Help users politely.`

};

// ======================================
// CALL AGENT
// ======================================

async function callAgent(
  agentName,
  userMessage
) {

  const systemPrompt = `

${soul}

${AGENTS[agentName] || AGENTS.ARTHA}

`;

  const response = await axios.post(

    'https://api.groq.com/openai/v1/chat/completions',

    {
      model: process.env.GROQ_MODEL,

      max_tokens: 200,

      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    },

    {
      headers: {
        'Authorization':
          'Bearer ' +
          process.env.GROQ_API_KEY_1,

        'Content-Type':
          'application/json'
      }
    }

  );

  return {

    agent: agentName,

    reply:
      response.data
      .choices[0]
      .message
      .content

  };

}

// ======================================

module.exports = {
  callAgent
};
