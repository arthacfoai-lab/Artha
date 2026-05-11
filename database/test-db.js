require('dotenv').config();

const Database = require('better-sqlite3');

const { v4: uuidv4 } = require('uuid');

// ======================================
// DATABASE
// ======================================

const path = require('path');

const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, 'artha.db');

const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

console.log('================================');

console.log(
  '  ARTHA AI — Database Tests'
);

console.log('================================\n');

console.log('→ Database:', DB_PATH);

let passed = 0;

let failed = 0;

// ======================================
// TEST HELPER
// ======================================

function test(name, fn) {

  try {

    fn();

    console.log(`✓ ${name}`);

    passed++;

  } catch (err) {

    console.log(
      `✗ ${name} → ${err.message}`
    );

    failed++;

  }

}

// ======================================
// LOAD TEST COMPANY
// ======================================

const company = db.prepare(`
  SELECT *
  FROM companies
  LIMIT 1
`).get();

// ======================================
// TEST 1
// ======================================

test('All required tables exist', () => {

  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type='table'
  `).all();

  const names = tables.map(
    t => t.name
  );

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

  required.forEach(table => {

    if (!names.includes(table)) {

      throw new Error(
        `Missing table: ${table}`
      );

    }

  });

});

// ======================================
// TEST 2
// ======================================

test('Test company exists', () => {

  if (!company) {

    throw new Error(
      'No company found'
    );

  }

  if (!company.gstin) {

    throw new Error(
      'GSTIN missing'
    );

  }

});

// ======================================
// TEST 3
// ======================================

test('Insert journal entry', () => {

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
      agent_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(

    uuidv4(),

    company.id,

    new Date()
      .toISOString()
      .split('T')[0],

    'Office Supplies',

    'Bank',

    1500,

    'Stationery purchase',

    'LEKHAK'

  );

});

// ======================================
// TEST 4
// ======================================

test('Read journal entries', () => {

  const entries = db.prepare(`
    SELECT *
    FROM journal_entries
    WHERE company_id = ?
  `).all(company.id);

  if (entries.length < 1) {

    throw new Error(
      'No journal entries found'
    );

  }

  console.log(
    `  Entries: ${entries.length}`
  );

});

// ======================================
// TEST 5
// ======================================

test('P&L calculation query', () => {

  const revenue = db.prepare(`
    SELECT
      COALESCE(SUM(amount),0) as total
    FROM journal_entries
    WHERE company_id = ?
    AND credit_account = 'Sales'
  `).get(company.id);

  const expenses = db.prepare(`
    SELECT
      COALESCE(SUM(amount),0) as total
    FROM journal_entries
    WHERE company_id = ?
    AND debit_account LIKE '%Expense%'
  `).get(company.id);

  const profit =
    revenue.total - expenses.total;

  console.log(
    `  Revenue : ₹${revenue.total}`
  );

  console.log(
    `  Expenses: ₹${expenses.total}`
  );

  console.log(
    `  Profit  : ₹${profit}`
  );

});

// ======================================
// TEST 6
// ======================================

test('GST transaction query', () => {

  const gst = db.prepare(`
    SELECT *
    FROM gst_transactions
    WHERE company_id = ?
  `).all(company.id);

  if (gst.length < 1) {

    throw new Error(
      'No GST records found'
    );

  }

  console.log(
    `  GST records: ${gst.length}`
  );

});

// ======================================
// TEST 7
// ======================================

test('Compliance calendar query', () => {

  const compliance = db.prepare(`
    SELECT *
    FROM compliance_calendar
    WHERE company_id = ?
  `).all(company.id);

  if (compliance.length < 1) {

    throw new Error(
      'No compliance entries'
    );

  }

  console.log(
    `  Compliance entries: ${compliance.length}`
  );

});

// ======================================
// TEST 8
// ======================================

test('Audit log insert', () => {

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

    company.id,

    'LEKHAK',

    'test_action',

    JSON.stringify({
      success: true
    })

  );

});

// ======================================
// TEST 9
// ======================================

test('Debtors table working', () => {

  db.prepare(`
    INSERT INTO debtors
    (
      id,
      company_id,
      party_name,
      phone,
      amount,
      due_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(

    uuidv4(),

    company.id,

    'Ramesh Ji',

    '+919876543210',

    45000,

    '2026-04-30'

  );

  const debtors = db.prepare(`
    SELECT *
    FROM debtors
    WHERE company_id = ?
  `).all(company.id);

  console.log(
    `  Debtors: ${debtors.length}`
  );

});

// ======================================
// TEST 10
// ======================================

test('Reminders table working', () => {

  db.prepare(`
    INSERT INTO reminders
    (
      id,
      company_id,
      type,
      message,
      scheduled_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(

    uuidv4(),

    company.id,

    'gst_reminder',

    'GSTR-1 filing tomorrow',

    '2026-06-10T09:00:00'

  );

});

// ======================================
// FINAL RESULTS
// ======================================

console.log('\n================================');

console.log(`✓ Passed: ${passed}`);

console.log(`✗ Failed: ${failed}`);

console.log('================================');

if (failed === 0) {

  console.log(
    '\n✓ ALL DATABASE TESTS PASSED!'
  );

  console.log(
    '→ System ready for next phase.\n'
  );

} else {

  console.log(
    '\n✗ Some tests failed.\n'
  );

}

db.close();
