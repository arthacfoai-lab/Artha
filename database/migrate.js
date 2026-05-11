require('dotenv').config();

const Database = require('better-sqlite3');

const fs = require('fs');

const path = require('path');

// =====================================
// DATABASE PATHS
// =====================================

const DB_PATH = path.join(
  __dirname,
  'artha.db'
);

const SCHEMA_PATH = path.join(
  __dirname,
  'schema.sql'
);

// =====================================
// START
// =====================================

console.log('================================');

console.log(
  '  ARTHA AI — Database Migration'
);

console.log('================================\n');

console.log('→ Database:', DB_PATH);

console.log('→ Schema  :', SCHEMA_PATH);

// =====================================
// CONNECT DATABASE
// =====================================

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.pragma('foreign_keys = ON');

console.log('\n✓ Database connected');

// =====================================
// LOAD SCHEMA
// =====================================

console.log('\n→ Loading schema...\n');

const schema = fs.readFileSync(
  SCHEMA_PATH,
  'utf8'
);

console.log(
  `✓ Schema loaded (${schema.length} chars)`
);

// =====================================
// EXECUTE SCHEMA
// =====================================

db.exec(schema);

console.log('✓ Schema executed');

// =====================================
// VERIFY TABLES
// =====================================

console.log('\n→ Verifying tables...\n');

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type='table'
  ORDER BY name
`).all();

if (tables.length === 0) {

  console.log('✗ No tables found');

} else {

  console.log(
    `✓ Tables found: ${tables.length}\n`
  );

  tables.forEach(t => {

    console.log(`  → ${t.name}`);

  });

}

// =====================================
// VERIFY INDEXES
// =====================================

console.log('\n→ Verifying indexes...\n');

const indexes = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type='index'
  AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

console.log(
  `✓ Indexes found: ${indexes.length}\n`
);

indexes.forEach(i => {

  console.log(`  → ${i.name}`);

});

// =====================================
// COMPLETE
// =====================================
// =====================================
// SEED TEST DATA
// =====================================

const { v4: uuidv4 } = require('uuid');

console.log('\n→ Seeding test data...\n');

// Test company
const companyId = uuidv4();

db.prepare(`
  INSERT OR IGNORE INTO companies
  (
    id,
    name,
    gstin,
    phone,
    business_type,
    state_code,
    plan
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  companyId,
  'Sharma General Store',
  '27AAPFU0939F1ZV',
  '+919999999999',
  'Retail',
  '27',
  'free'
);

console.log('✓ Test company inserted');

// Test user
db.prepare(`
  INSERT OR IGNORE INTO users
  (
    id,
    company_id,
    phone,
    name,
    role
  )
  VALUES (?, ?, ?, ?, ?)
`).run(
  uuidv4(),
  companyId,
  '+919999999999',
  'Ramesh Sharma',
  'owner'
);

console.log('✓ Test user inserted');

// GST transaction
db.prepare(`
  INSERT INTO gst_transactions
  (
    id,
    company_id,
    invoice_date,
    party_name,
    taxable_value,
    gst_rate,
    cgst,
    sgst,
    total_amount
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  uuidv4(),
  companyId,
  '2026-05-01',
  'ABC Traders',
  10000,
  18,
  900,
  900,
  11800
);

console.log('✓ GST transaction inserted');

// Compliance entry
db.prepare(`
  INSERT INTO compliance_calendar
  (
    id,
    company_id,
    compliance_type,
    due_date,
    description
  )
  VALUES (?, ?, ?, ?, ?)
`).run(
  uuidv4(),
  companyId,
  'GSTR-3B',
  '2026-06-20',
  'Monthly GST filing'
);

console.log('✓ Compliance entry inserted');
db.close();

console.log('\n================================');

console.log(
  '✓ Migration completed successfully'
);

console.log('================================\n');
