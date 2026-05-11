-- ======================================
-- ARTHA AI DATABASE SCHEMA
-- ======================================

CREATE TABLE IF NOT EXISTS users (

  id TEXT PRIMARY KEY,

  phone TEXT UNIQUE,

  name TEXT,

  role TEXT,

  company_id TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- ======================================

CREATE TABLE IF NOT EXISTS audit_logs (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  agent_id TEXT,

  action TEXT,

  details TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- ======================================

CREATE TABLE IF NOT EXISTS journal_entries (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  type TEXT,

  amount REAL,

  description TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- ======================================

CREATE TABLE IF NOT EXISTS gst_reports (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  month TEXT,

  output_tax REAL,

  input_tax REAL,

  payable REAL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- ======================================

CREATE TABLE IF NOT EXISTS reminders (

  id TEXT PRIMARY KEY,

  company_id TEXT,

  type TEXT,

  due_date TEXT,

  status TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);
