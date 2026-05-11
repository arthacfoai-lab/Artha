require('dotenv').config();

const Database = require('better-sqlite3');

const path = require('path');

// =====================================
// DATABASE
// =====================================

const DB_PATH = path.join(
  __dirname,
  '../../database/artha.db'
);

// =====================================
// GET P&L DATA
// =====================================

function getPLData(

  companyId,

  month = null

) {

  const db = new Database(DB_PATH);

  try {

    const period = month ||

      new Date()
        .toISOString()
        .substring(0, 7);

    const startDate =
      `${period}-01`;

    const endDate =
      `${period}-31`;

    // ==================================
    // REVENUE
    // ==================================

    const revenue = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total
      FROM journal_entries
      WHERE company_id = ?
      AND credit_account = 'Sales'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      endDate

    );

    // ==================================
    // OTHER INCOME
    // ==================================

    const otherIncome = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total
      FROM journal_entries
      WHERE company_id = ?
      AND credit_account LIKE '%Income%'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      endDate

    );

    // ==================================
    // EXPENSE BREAKDOWN
    // ==================================

    const expenses = db.prepare(`
      SELECT

        debit_account,

        SUM(amount) as total

      FROM journal_entries

      WHERE company_id = ?

      AND debit_account LIKE '%Expense%'

      AND date BETWEEN ? AND ?

      GROUP BY debit_account

      ORDER BY total DESC
    `).all(

      companyId,

      startDate,

      endDate

    );

    const totalExpenses =
      expenses.reduce(

        (sum, e) =>
          sum + e.total,

        0

      );

    // ==================================
    // CASH POSITION
    // ==================================

    const cashIn = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total
      FROM journal_entries
      WHERE company_id = ?
      AND debit_account = 'Bank'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      endDate

    );

    const cashOut = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total
      FROM journal_entries
      WHERE company_id = ?
      AND credit_account = 'Bank'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      endDate

    );

    const totalRevenue =
      revenue.total +
      otherIncome.total;

    const netProfit =
      totalRevenue -
      totalExpenses;

    const margin =
      totalRevenue > 0

      ? Number(
          (
            (netProfit / totalRevenue)
            * 100
          ).toFixed(1)
        )

      : 0;

    return {

      period,

      revenue:
        totalRevenue,

      expenses:
        totalExpenses,

      expenseBreakdown:
        expenses,

      netProfit,

      margin,

      cashIn:
        cashIn.total,

      cashOut:
        cashOut.total,

      cashPosition:
        cashIn.total -
        cashOut.total

    };

  } finally {

    db.close();

  }

}

// =====================================
// CASH FLOW FORECAST
// =====================================

function getCashFlowForecast(

  companyId

) {

  const db = new Database(DB_PATH);

  try {

    const thirtyDaysAgo =
      new Date();

    thirtyDaysAgo.setDate(

      thirtyDaysAgo.getDate() - 30

    );

    const startDate =
      thirtyDaysAgo
        .toISOString()
        .split('T')[0];

    const today =
      new Date()
        .toISOString()
        .split('T')[0];

    // ==================================
    // DAILY AVG CASH IN
    // ==================================

    const avgIn = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) / 30.0
        as daily
      FROM journal_entries
      WHERE company_id = ?
      AND debit_account = 'Bank'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      today

    );

    // ==================================
    // DAILY AVG CASH OUT
    // ==================================

    const avgOut = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) / 30.0
        as daily
      FROM journal_entries
      WHERE company_id = ?
      AND credit_account = 'Bank'
      AND date BETWEEN ? AND ?
    `).get(

      companyId,

      startDate,

      today

    );

    // ==================================
    // CURRENT BALANCE
    // ==================================

    const currentBalance = db.prepare(`
      SELECT

        COALESCE(
          SUM(
            CASE
              WHEN debit_account='Bank'
              THEN amount
              ELSE 0
            END
          ),
          0
        )

        -

        COALESCE(
          SUM(
            CASE
              WHEN credit_account='Bank'
              THEN amount
              ELSE 0
            END
          ),
          0
        )

        as balance

      FROM journal_entries

      WHERE company_id = ?
    `).get(companyId);

    const balance =
      currentBalance.balance;

    const netDaily =
      avgIn.daily -
      avgOut.daily;

    return {

      current:
        Math.round(balance),

      day30:
        Math.round(
          balance + (netDaily * 30)
        ),

      day60:
        Math.round(
          balance + (netDaily * 60)
        ),

      day90:
        Math.round(
          balance + (netDaily * 90)
        ),

      dailyAvgIn:
        Math.round(avgIn.daily),

      dailyAvgOut:
        Math.round(avgOut.daily),

      runwayDays:

        avgOut.daily > 0

        ? Math.round(
            balance / avgOut.daily
          )

        : 999

    };

  } finally {

    db.close();

  }

}

// =====================================
// HEALTH SCORE
// =====================================

function getHealthScore(data) {

  if (
    data.margin >= 30
  ) {

    return '🟢 HEALTHY';

  }

  if (
    data.margin >= 10
  ) {

    return '🟡 AVERAGE';

  }

  return '🔴 ATTENTION';

}

// =====================================
// FORMAT P&L REPORT
// =====================================

function formatPLReport(data) {

  const health =
    getHealthScore(data);

  let report = '';

  report +=
    `📊 P&L Report — ${data.period}\n\n`;

  report +=
    `💰 Revenue: ₹${data.revenue
      .toLocaleString('en-IN')}\n`;

  report +=
    `💸 Expenses: ₹${data.expenses
      .toLocaleString('en-IN')}\n`;

  report +=
    `─────────────────\n`;

  const sign =
    data.netProfit >= 0
      ? '+'
      : '';

  report +=
    `📈 Net Profit: ${sign}₹${data.netProfit
      .toLocaleString('en-IN')}\n`;

  report +=
    `📉 Margin: ${data.margin}%\n`;

  report +=
    `💵 Cash Position: ₹${data.cashPosition
      .toLocaleString('en-IN')}\n\n`;

  // ==================================
  // TOP EXPENSES
  // ==================================

  if (
    data.expenseBreakdown.length > 0
  ) {

    report +=
      'Top Expenses:\n';

    data.expenseBreakdown
      .slice(0, 3)
      .forEach(e => {

        report +=
          `• ${e.debit_account}: ₹${e.total
            .toLocaleString('en-IN')}\n`;

      });

    report += '\n';

  }

  // ==================================
  // HEALTH
  // ==================================

  report +=
    `Health: ${health}\n\n`;

  // ==================================
  // BUSINESS ALERTS
  // ==================================

  if (
    data.netProfit < 0
  ) {

    report +=
      '⚠️ Business loss me hai.\nExpenses review karein.';

  }

  else if (
    data.margin >= 30
  ) {

    report +=
      '✅ Business accha perform kar raha hai.';

  }

  else {

    report +=
      '📌 Margins improve karne ki zarurat hai.';

  }

  // Expense warning

  if (
    data.revenue > 0 &&
    data.expenses / data.revenue > 0.7
  ) {

    report +=
      '\n\n⚠️ Expenses revenue ke 70% se zyada hain.';

  }

  return report;

}

// =====================================
// FORMAT CASH FLOW REPORT
// =====================================

function formatCashFlowReport(data) {

  let report = '';

  report +=
    '💵 Cash Flow Forecast\n\n';

  report +=
    `Current: ₹${data.current
      .toLocaleString('en-IN')}\n`;

  report +=
    `30 Days: ₹${data.day30
      .toLocaleString('en-IN')}\n`;

  report +=
    `60 Days: ₹${data.day60
      .toLocaleString('en-IN')}\n`;

  report +=
    `90 Days: ₹${data.day90
      .toLocaleString('en-IN')}\n\n`;

  report +=
    `Daily Inflow: ₹${data.dailyAvgIn
      .toLocaleString('en-IN')}\n`;

  report +=
    `Daily Outflow: ₹${data.dailyAvgOut
      .toLocaleString('en-IN')}\n`;

  // ==================================
  // RUNWAY ALERT
  // ==================================

  if (
    data.runwayDays < 30
  ) {

    report +=
      `\n⚠️ WARNING:\nCash runway sirf ${data.runwayDays} days ka hai.`;

  }

  else {

    report +=
      `\n✅ Cash runway: ${data.runwayDays}+ days`;

  }

  return report;

}

// =====================================
// MAIN SKILL
// =====================================

function runPLSkill(

  companyId,

  action = 'pl',

  month = null

) {

  try {

    // ==================================
    // CASHFLOW
    // ==================================

    if (
      action === 'cashflow'
    ) {

      const forecast =
        getCashFlowForecast(companyId);

      return formatCashFlowReport(
        forecast
      );

    }

    // ==================================
    // P&L
    // ==================================

    const data =
      getPLData(
        companyId,
        month
      );

    if (
      data.revenue === 0 &&
      data.expenses === 0
    ) {

      return (
        `📊 P&L Report — ${data.period}\n\n` +

        `Abhi tak koi accounting entries nahi hain.\n\n` +

        `Example entries:\n` +

        `"bijli 3500 diya"\n` +

        `"Sharma ji se 15000 aaya"`

      );

    }

    return formatPLReport(data);

  } catch (err) {

    console.error(
      'P&L skill error:',
      err.message
    );

    return (
      'Report generate nahi hua.\nDobara try karein.'
    );

  }

}

// =====================================
// EXPORTS
// =====================================

module.exports = {

  runPLSkill,

  getPLData,

  getCashFlowForecast,

  formatPLReport,

  formatCashFlowReport,

  getHealthScore

};
