require('dotenv').config();

const axios = require('axios');

const Database = require('better-sqlite3');

const path = require('path');

const { v4: uuidv4 } = require('uuid');

// =====================================
// DATABASE
// =====================================

const DB_PATH = path.join(
  __dirname,
  '../../database/artha.db'
);

// =====================================
// PARSE ENTRY WITH GROQ
// =====================================

async function parseEntry(userInput) {

  const prompt = `
You are an Indian accounting expert.

Convert natural language accounting
messages into journal entries.

Input:
"${userInput}"

Return ONLY valid JSON.

{
  "debit_account": "account name",
  "credit_account": "account name",
  "amount": number,
  "narration": "short narration",
  "entry_type": "expense/income/purchase/other",
  "gst_amount": number,
  "confidence": "high/medium/low"
}

Rules:

- Expense paid:
  Debit Expense
  Credit Bank

- Income received:
  Debit Bank
  Credit Sales

- Purchases:
  Debit Purchases/Inventory
  Credit Bank or Payable

Common mappings:

bijli/electricity →
Electricity Expense

rent →
Rent Expense

salary →
Salary Expense

petrol/fuel →
Fuel Expense

internet/mobile →
Communication Expense

purchase/kharida →
Purchases

received/aaya →
Sales

Return JSON only.
`;

  const response = await axios.post(

    'https://api.groq.com/openai/v1/chat/completions',

    {

      model: 'llama-3.1-8b-instant',

      temperature: 0.1,

      max_tokens: 300,

      messages: [

        {
          role: 'user',
          content: prompt
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

      timeout: 20000

    }

  );

  const text = response.data
    ?.choices?.[0]
    ?.message?.content
    ?.trim();

  if (!text) {

    throw new Error(
      'Empty model response'
    );

  }

  const jsonMatch =
    text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {

    throw new Error(
      'JSON not found'
    );

  }

  try {

    return JSON.parse(jsonMatch[0]);

  } catch {

    throw new Error(
      'Invalid JSON response'
    );

  }

}

// =====================================
// SAVE ENTRY
// =====================================

function saveEntry(
  companyId,
  entryData,
  agentId = 'LEKHAK'
) {

  const db = new Database(DB_PATH);

  try {

    const entryId = uuidv4();

    const today = new Date()
      .toISOString()
      .split('T')[0];

    db.prepare(`
      INSERT INTO journal_entries
      (
        id,
        company_id,
        date,
        debit_account,
        credit_account,
        amount,
        narration,
        entry_type,
        agent_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(

      entryId,

      companyId,

      today,

      entryData.debit_account,

      entryData.credit_account,

      entryData.amount,

      entryData.narration,

      entryData.entry_type || 'manual',

      agentId

    );

    // Audit log

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

      companyId,

      agentId,

      'journal_entry_saved',

      JSON.stringify({

        amount:
          entryData.amount,

        narration:
          entryData.narration

      })

    );

    return {

      success: true,

      entryId

    };

  } finally {

    db.close();

  }

}

// =====================================
// DUPLICATE CHECK
// =====================================

function checkDuplicate(
  companyId,
  amount,
  narration
) {

  const db = new Database(DB_PATH);

  try {

    const today = new Date()
      .toISOString()
      .split('T')[0];

    const existing = db.prepare(`
      SELECT id
      FROM journal_entries
      WHERE company_id = ?
      AND amount = ?
      AND date = ?
      AND narration LIKE ?
    `).get(

      companyId,

      amount,

      today,

      `%${narration.substring(0, 20)}%`

    );

    return !!existing;

  } finally {

    db.close();

  }

}

// =====================================
// FORMAT CONFIRMATION
// =====================================

function formatConfirmation(entry) {

  return `
Samajh gaya! ✓

📝 Entry Details

Debit:
${entry.debit_account}

Credit:
${entry.credit_account}

Amount:
₹${Number(entry.amount)
  .toLocaleString('en-IN')}

Narration:
${entry.narration}

${entry.gst_amount > 0
? `GST: ₹${entry.gst_amount}\n`
: ''}

Save karoon?

Reply:
Haan / Nahi
`;

}

// =====================================
// MAIN SKILL
// =====================================

async function runVoiceEntrySkill(

  userInput,

  companyId,

  pendingConfirmation = null

) {

  // ==================================
  // CONFIRMATION FLOW
  // ==================================

  if (pendingConfirmation) {

    const response =
      userInput.toLowerCase().trim();

    const yesWords = [

      'haan',

      'han',

      'ha',

      'yes',

      'ok',

      'okay',

      'हाँ',

      'हां'

    ];

    if (yesWords.includes(response)) {

      const isDuplicate =
        checkDuplicate(

          companyId,

          pendingConfirmation.amount,

          pendingConfirmation.narration

        );

      if (isDuplicate) {

        return {

          saved: false,

          message:
            '⚠️ Ye entry already exist karti hai.\nDuplicate save nahi kiya.'

        };

      }

      const result = saveEntry(

        companyId,

        pendingConfirmation,

        'LEKHAK'

      );

      return {

        saved: true,

        entryId: result.entryId,

        message:
          `✅ Entry save ho gayi!\n\n` +

          `📝 ${pendingConfirmation.narration}\n` +

          `₹${pendingConfirmation.amount
            .toLocaleString('en-IN')} recorded.\n\n` +

          `Aur kuch entry karni hai? 😊`

      };

    }

    return {

      saved: false,

      message:
        '❌ Entry cancel kar di.\nDobara batana ho toh batao 😊'

    };

  }

  // ==================================
  // NEW ENTRY PARSE
  // ==================================

  try {

    const entry =
      await parseEntry(userInput);

    // Validation

    if (
      !entry.amount ||
      Number(entry.amount) <= 0
    ) {

      return {

        saved: false,

        needsConfirmation: false,

        message:
          'Amount samajh nahi aaya.\nExample:\n"bijli 3500 diya"'

      };

    }

    if (
      entry.confidence === 'low'
    ) {

      return {

        saved: false,

        needsConfirmation: false,

        message:
          'Thoda aur clearly batao 😊\n\nExample:\n"rent 20000 diya"'

      };

    }

    return {

      saved: false,

      needsConfirmation: true,

      pendingEntry: entry,

      message:
        formatConfirmation(entry)

    };

  } catch (err) {

    console.error(
      'Voice skill error:',
      err.message
    );

    return {

      saved: false,

      needsConfirmation: false,

      message:
        'Entry samajh nahi aayi.\n\nExample:\n"bijli bill 3500 diya"'

    };

  }

}

// =====================================
// EXPORTS
// =====================================

module.exports = {

  runVoiceEntrySkill,

  parseEntry,

  saveEntry,

  checkDuplicate,

  formatConfirmation

};
