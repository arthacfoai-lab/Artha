PRAGMA foreign_keys = ON;

-- =====================================
-- TABLE: COMPANIES
-- =====================================

CREATE TABLE IF NOT EXISTS companies (

  id            TEXT PRIMARY KEY,

  name          TEXT NOT NULL,

  gstin         TEXT UNIQUE,

  phone         TEXT UNIQUE NOT NULL,

  business_type TEXT,

  address       TEXT,

  state_code    TEXT,

  plan          TEXT DEFAULT 'free',

  active        INTEGER DEFAULT 1,

  created_at    TEXT DEFAULT (
    datetime('now')
  )

);

-- =====================================
-- TABLE: USERS
-- =====================================

CREATE TABLE IF NOT EXISTS users (

  id          TEXT PRIMARY KEY,

  company_id  TEXT,

  phone       TEXT UNIQUE NOT NULL,

  name        TEXT,

  role        TEXT DEFAULT 'owner',

  language    TEXT DEFAULT 'hinglish',

  created_at  TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- TABLE: JOURNAL ENTRIES
-- =====================================

CREATE TABLE IF NOT EXISTS journal_entries (

  id              TEXT PRIMARY KEY,

  company_id      TEXT NOT NULL,

  date            TEXT NOT NULL,

  debit_account   TEXT NOT NULL,

  credit_account  TEXT NOT NULL,

  amount          REAL NOT NULL,

  narration       TEXT,

  entry_type      TEXT DEFAULT 'manual',

  agent_id        TEXT,

  verified        INTEGER DEFAULT 0,

  created_at      TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- TABLE: GST TRANSACTIONS
-- =====================================

CREATE TABLE IF NOT EXISTS gst_transactions (

  id              TEXT PRIMARY KEY,

  company_id      TEXT NOT NULL,

  invoice_no      TEXT,

  invoice_date    TEXT NOT NULL,

  party_name      TEXT,

  party_gstin     TEXT,

  taxable_value   REAL NOT NULL,

  gst_rate        REAL DEFAULT 18,

  cgst            REAL DEFAULT 0,

  sgst            REAL DEFAULT 0,

  igst            REAL DEFAULT 0,

  total_amount    REAL,

  is_interstate   INTEGER DEFAULT 0,

  return_period   TEXT,

  filed           INTEGER DEFAULT 0,

  created_at      TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- TABLE: COMPLIANCE CALENDAR
-- =====================================

CREATE TABLE IF NOT EXISTS compliance_calendar (

  id                TEXT PRIMARY KEY,

  company_id        TEXT NOT NULL,

  compliance_type   TEXT NOT NULL,

  due_date          TEXT NOT NULL,

  description       TEXT,

  status            TEXT DEFAULT 'pending',

  reminder_sent     INTEGER DEFAULT 0,

  completed_at      TEXT,

  created_at        TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- TABLE: AUDIT LOGS
-- =====================================

CREATE TABLE IF NOT EXISTS audit_logs (

  id           TEXT PRIMARY KEY,

  company_id   TEXT,

  agent_id     TEXT,

  action       TEXT NOT NULL,

  details      TEXT,

  platform     TEXT,

  created_at   TEXT DEFAULT (
    datetime('now')
  )

);

-- =====================================
-- TABLE: DEBTORS
-- =====================================

CREATE TABLE IF NOT EXISTS debtors (

  id               TEXT PRIMARY KEY,

  company_id       TEXT NOT NULL,

  party_name       TEXT NOT NULL,

  phone            TEXT,

  amount           REAL NOT NULL,

  due_date         TEXT,

  days_overdue     INTEGER DEFAULT 0,

  status           TEXT DEFAULT 'pending',

  reminder_count   INTEGER DEFAULT 0,

  created_at       TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- TABLE: REMINDERS
-- =====================================

CREATE TABLE IF NOT EXISTS reminders (

  id             TEXT PRIMARY KEY,

  company_id     TEXT NOT NULL,

  type           TEXT NOT NULL,

  message        TEXT NOT NULL,

  scheduled_at   TEXT NOT NULL,

  sent           INTEGER DEFAULT 0,

  sent_at        TEXT,

  created_at     TEXT DEFAULT (
    datetime('now')
  ),

  FOREIGN KEY (company_id)
    REFERENCES companies(id)

);

-- =====================================
-- INDEXES
-- =====================================

CREATE INDEX IF NOT EXISTS idx_users_phone
ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_company
ON users(company_id);

CREATE INDEX IF NOT EXISTS idx_journal_company
ON journal_entries(company_id);

CREATE INDEX IF NOT EXISTS idx_gst_company
ON gst_transactions(company_id);

CREATE INDEX IF NOT EXISTS idx_compliance_company
ON compliance_calendar(company_id);

CREATE INDEX IF NOT EXISTS idx_audit_company
ON audit_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_debtors_company
ON debtors(company_id);

CREATE INDEX IF NOT EXISTS idx_reminders_company
ON reminders(company_id);
