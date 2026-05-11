require('dotenv').config();

const axios = require('axios');

const Database = require('better-sqlite3');

const {
  clearPending
} = require('../server/sessions');

// ==================================
// CONFIG
// ==================================

const SERVER =
  `http://localhost:${process.env.PORT || 4000}`;

const db = new Database('./database/artha.db');

const TEST_COMPANY_ID =
  'f72f8844-ac5b-4b06-8cd7-4c3fb742897d';

const TEST_PHONE =
  '+919999999999';

let passed = 0;
let failed = 0;

const errors = [];

// ==================================
// TEST HELPER
// ==================================

async function test(name, fn) {

  try {

    await fn();

    console.log(`✓ ${name}`);

    passed++;

  } catch (err) {

    console.log(`✗ ${name}`);

    console.log(`  → ${err.message}`);

    failed++;

    errors.push({
      name,
      error: err.message
    });

  }

}

function assert(condition, msg) {

  if (!condition) {

    throw new Error(msg);

  }

}

async function post(
  message,
  phone = '+910000000001'
) {

  const res = await axios.post(

    `${SERVER}/message`,

    {
      message,
      phone,
      platform: 'test'
    },

    {
      timeout: 30000
    }

  );

  return res.data;

}

// ==================================
// RUN TESTS
// ==================================

async function runTests() {

  console.log('================================');

  console.log(
    '  ARTHA AI v2.0 — SYSTEM TESTS'
  );

  console.log('================================\n');

  // ==================================
  // BOOTSTRAP TEST DATA
  // ==================================

  db.prepare(`
    INSERT OR IGNORE INTO companies
    (id, name, phone)
    VALUES (?, ?, ?)
  `).run(
    TEST_COMPANY_ID,
    'Sharma General Store',
    TEST_PHONE
  );

  console.log(
    '✓ Test company ready\n'
  );

  // ==================================
  // LAYER 1 — SERVER
  // ==================================

  console.log(
    '--- LAYER 1: SERVER ---\n'
  );

  await test(
    'Health check ok',
    async () => {

      const res =
        await axios.get(
          `${SERVER}/health`
        );

      assert(
        res.data.status === 'ok',
        'Health failed'
      );

      assert(
        res.data.database ===
          'connected',
        'DB disconnected'
      );

    }
  );

  await test(
    'Server version 2.0',
    async () => {

      const res =
        await axios.get(
          `${SERVER}/health`
        );

      assert(
        res.data.version ===
          '2.0.0',
        'Wrong version'
      );

    }
  );

  await test(
    'Agents endpoint returns 5',
    async () => {

      const res =
        await axios.get(
          `${SERVER}/agents`
        );

      assert(
        res.data.agents.length === 5,
        'Wrong agents count'
      );

    }
  );

  await test(
    'Compliance endpoint works',
    async () => {

      const res =
        await axios.get(
          `${SERVER}/compliance`
        );

      assert(
        res.data.deadlines.length > 0,
        'No deadlines'
      );

    }
  );

  // ==================================
  // LAYER 2 — ROUTING
  // ==================================

  console.log(
    '\n--- LAYER 2: ROUTING ---\n'
  );

  await test(
    'Expense → LEKHAK',
    async () => {

      const r =
        await post(
          'bijli bill 3500 diya'
        );

      assert(
        r.agent === 'LEKHAK',
        `Got ${r.agent}`
      );

    }
  );

  await test(
    'GST → TEJAS',
    async () => {

      const r =
        await post(
          'GST calculate karo'
        );

      assert(
        r.agent === 'TEJAS',
        `Got ${r.agent}`
      );

    }
  );

  await test(
    'Profit → VIVEK',
    async () => {

      const r =
        await post(
          'profit report dikhao'
        );

      assert(
        r.agent === 'VIVEK',
        `Got ${r.agent}`
      );

    }
  );

  await test(
    'Help → DHAN',
    async () => {

      const r =
        await post(
          'help chahiye'
        );

      assert(
        r.agent === 'DHAN',
        `Got ${r.agent}`
      );

    }
  );

  await test(
    'Fallback → ARTHA',
    async () => {

      const r =
        await post(
          'random xyz text'
        );

      assert(
        r.agent === 'ARTHA',
        `Got ${r.agent}`
      );

    }
  );

  // ==================================
  // LAYER 3 — SKILLS
  // ==================================

  console.log(
    '\n--- LAYER 3: SKILLS ---\n'
  );

  await test(
    'LEKHAK parses entry',
    async () => {

      const r = await post(
        'rent 20000 diya',
        '+910000000002'
      );

      assert(
        r.success === true,
        'Parse failed'
      );

      assert(
        r.reply.includes('₹'),
        'No amount found'
      );

    }
  );

  await test(
    'LEKHAK confirmation flow',
    async () => {

      clearPending(
        '+910000000003'
      );

      // Step 1

      const r1 = await post(
        'petrol 500 diya',
        '+910000000003'
      );

      assert(
        r1.agent === 'LEKHAK',
        'Wrong agent'
      );

      // Step 2

      const r2 = await post(
        'haan',
        '+910000000003'
      );

      assert(

        r2.reply.includes('✅') ||

        r2.reply.includes('save') ||

        r2.reply.includes('recorded'),

        `Confirm failed:
         ${r2.reply}`

      );

    }
  );

  await test(
    'LEKHAK cancel flow',
    async () => {

      clearPending(
        '+910000000004'
      );

      await post(
        'salary 50000 diya',
        '+910000000004'
      );

      const r =
        await post(
          'nahi',
          '+910000000004'
        );

      assert(
        r.reply.includes('cancel') ||
        r.reply.includes('Cancel'),
        'Cancel failed'
      );

    }
  );

  await test(
    'Duplicate detection works',
    async () => {

      clearPending(
        '+910000000010'
      );

      await post(
        'rent 20000 diya',
        '+910000000010'
      );

      await post(
        'haan',
        '+910000000010'
      );

      const r = await post(
        'rent 20000 diya',
        '+910000000010'
      );

      assert(

        r.reply.includes('duplicate') ||

        r.reply.includes('already') ||

        r.reply.includes('exists'),

        'Duplicate not detected'

      );

    }
  );

  await test(
    'GST calculation works',
    async () => {

      const r =
        await post(
          '10000 pe 18% GST kitna'
        );

      assert(
        r.reply.includes('900') ||
        r.reply.includes('1800'),
        'GST failed'
      );

    }
  );

  // ==================================
  // LAYER 4 — DATABASE
  // ==================================

  console.log(
    '\n--- LAYER 4: DATABASE ---\n'
  );

  await test(
    'All 8 tables exist',
    () => {

      const tables =
        db.prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type='table'
        `)
        .all()
        .map(t => t.name);

      const required = [

        'companies',
        'users',
        'journal_entries',
        'gst_transactions',
        'compliance_calendar',
        'audit_logs',
        'debtors',
        'reminders'

      ];

      required.forEach(t => {

        assert(
          tables.includes(t),
          `Missing: ${t}`
        );

      });

    }
  );

  await test(
    'Journal entries saved',
    () => {

      const entries =
        db.prepare(`
          SELECT COUNT(*) as n
          FROM journal_entries
        `).get();

      assert(
        entries.n > 0,
        'No entries'
      );

      console.log(
        `  → ${entries.n} entries`
      );

    }
  );

  await test(
    'Audit logs writing',
    () => {

      const logs =
        db.prepare(`
          SELECT COUNT(*) as n
          FROM audit_logs
        `).get();

      assert(
        logs.n > 0,
        'No audit logs'
      );

    }
  );

  await test(
    'Company mapping works',
    () => {

      const company =
        db.prepare(`
          SELECT * FROM companies
          WHERE id = ?
        `).get(
          TEST_COMPANY_ID
        );

      assert(
        company !== undefined,
        'Company missing'
      );

    }
  );

  // ==================================
  // LAYER 5 — MULTILINGUAL
  // ==================================

  console.log(
    '\n--- LAYER 5: MULTILINGUAL ---\n'
  );

  await test(
    'Hindi input works',
    async () => {

      const r =
        await post(
          'बिजली बिल तीन हजार',
          '+910000000005'
        );

      assert(
        r.success === true,
        'Hindi failed'
      );

    }
  );

  await test(
    'English input works',
    async () => {

      const r =
        await post(
          'paid electricity bill',
          '+910000000005'
        );

      assert(
        r.success === true,
        'English failed'
      );

    }
  );

  await test(
    'Hinglish input works',
    async () => {

      const r =
        await post(
          'office ka rent pay kiya',
          '+910000000005'
        );

      assert(
        r.success === true,
        'Hinglish failed'
      );

    }
  );

  // ==================================
  // LAYER 6 — EDGE CASES
  // ==================================

  console.log(
    '\n--- LAYER 6: EDGE CASES ---\n'
  );

  await test(
    'SQL injection safe',
    async () => {

      const r = await post(
        "'; DROP TABLE users; --",
        '+910000000007'
      );

      assert(
        r.success === true,
        'Injection crashed'
      );

    }
  );

  await test(
    'Special chars handled',
    async () => {

      const r = await post(
        'bill ₹3,500 @sharma',
        '+910000000006'
      );

      assert(
        r.success === true,
        'Special chars failed'
      );

    }
  );

  await test(
    'Long message handled',
    async () => {

      const r = await post(
        'bijli '.repeat(50),
        '+910000000006'
      );

      assert(
        r.success === true,
        'Long message failed'
      );

    }
  );

  await test(
    'Concurrent requests handled',
    async () => {

      const results =
        await Promise.all([

          post(
            'rent 1000 diya',
            '+910000000011'
          ),

          post(
            'rent 2000 diya',
            '+910000000012'
          ),

          post(
            'rent 3000 diya',
            '+910000000013'
          )

        ]);

      assert(
        results.length === 3,
        'Concurrency failed'
      );

    }
  );

  await test(
    'Response under 5 sec',
    async () => {

      const start = Date.now();

      await post(
        'bijli bill 3000 diya',
        '+910000000014'
      );

      const ms =
        Date.now() - start;

      console.log(
        `  → ${ms}ms`
      );

      assert(
        ms < 5000,
        `Too slow: ${ms}ms`
      );

    }
  );

  // ==================================
  // RESULTS
  // ==================================

  console.log('\n================================');

  console.log(
    '  FINAL RESULTS'
  );

  console.log('================================');

  console.log(`✓ Passed: ${passed}`);

  console.log(`✗ Failed: ${failed}`);

  console.log(
    `  Total: ${passed + failed}`
  );

  console.log('================================\n');

  if (failed === 0) {

    console.log(
      '🎉 ALL TESTS PASSED!'
    );

    console.log(
      '✓ ARTHA AI v2.0 complete.'
    );

    console.log(
      '✓ Ready for GitHub commit.\n'
    );

  } else {

    console.log(
      '⚠ Some tests failed:\n'
    );

    errors.forEach(e => {

      console.log(
        `  ✗ ${e.name}`
      );

      console.log(
        `    ${e.error}`
      );

    });

  }

  db.close();

}

runTests().catch(err => {

  console.error(
    'Suite crashed:',
    err.message
  );

  db.close();

  process.exit(1);

});
