require('dotenv').config();

const Database = require('better-sqlite3');

const db = new Database('./database/artha.db');

console.log('✓ Database connected');

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

console.log('✓ Tables created');

db.close();

console.log('✓ Migration complete');
