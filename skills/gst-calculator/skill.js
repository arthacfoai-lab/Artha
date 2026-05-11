require('dotenv').config();

const Database = require('better-sqlite3');

const path = require('path');

const { v4: uuidv4 } = require('uuid');

// =====================================
// DATABASE
// =====================================

const DB_PATH = path.join(
  __dirname,
  '../database/artha.db'
);

// =====================================
// CALCULATE GST
// =====================================

function calculateGST(

  amount,

  rate = 18,

  isInterstate = false

) {

  amount = Number(amount);

  rate = Number(rate);

  if (!amount || amount <= 0) {

    throw new Error(
      'Invalid taxable amount'
    );

  }

  const gstAmount =
    (amount * rate) / 100;

  // Interstate → IGST only

  if (isInterstate) {

    return {

      taxable: amount,

      rate,

      cgst: 0,

      sgst: 0,

      igst: Number(
        gstAmount.toFixed(2)
      ),

      total: Number(
        (amount + gstAmount)
        .toFixed(2)
      ),

      type: 'interstate'

    };

  }

  // Intrastate → CGST + SGST

  const half = Number(
    (gstAmount / 2).toFixed(2)
  );

  return {

    taxable: amount,

    rate,

    cgst: half,

    sgst: half,

    igst: 0,

    total: Number(
      (amount + gstAmount)
      .toFixed(2)
    ),

    type: 'intrastate'

  };

}

// =====================================
// VALIDATE GSTIN
// =====================================

function validateGSTIN(gstin) {

  if (!gstin) {

    return {

      valid: false,

      reason: 'GSTIN empty hai'

    };

  }

  gstin = gstin.trim().toUpperCase();

  const pattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!pattern.test(gstin)) {

    return {

      valid: false,

      reason:
        'Format invalid hai. Example: 27AAPFU0939F1ZV'

    };

  }

  const stateCode =
    parseInt(gstin.substring(0, 2));

  if (
    stateCode < 1 ||
    stateCode > 37
  ) {

    return {

      valid: false,

      reason: 'Invalid state code'

    };

  }

  return {

    valid: true,

    stateCode:
      gstin.substring(0, 2),

    pan:
      gstin.substring(2, 12),

    entity:
      gstin.substring(12, 13)

  };

}

// =====================================
// STATE NAME
// =====================================

function getState(code) {

  const states = {

    '01': 'Jammu & Kashmir',

    '02': 'Himachal Pradesh',

    '03': 'Punjab',

    '06': 'Haryana',

    '07': 'Delhi',

    '08': 'Rajasthan',

    '09': 'Uttar Pradesh',

    '10': 'Bihar',

    '19': 'West Bengal',

    '20': 'Jharkhand',

    '21': 'Odisha',

    '27': 'Maharashtra',

    '29': 'Karnataka',

    '32': 'Kerala',

    '33': 'Tamil Nadu',

    '36': 'Telangana',

    '37': 'Andhra Pradesh'

  };

  return states[code]
    || `State ${code}`;

}

// =====================================
// COMPLIANCE CALENDAR
// =====================================

function getComplianceCalendar() {

  const now = new Date();

  const month = now.getMonth();

  const year = now.getFullYear();

  const nextMonth =
    month === 11
      ? 0
      : month + 1;

  const nextYear =
    month === 11
      ? year + 1
      : year;

  const deadlines = [

    {

      type: 'GSTR-1',

      date:
        new Date(
          nextYear,
          nextMonth,
          11
        ),

      desc:
        'Sales invoice return'

    },

    {

      type: 'GSTR-3B',

      date:
        new Date(
          nextYear,
          nextMonth,
          20
        ),

      desc:
        'Monthly GST payment'

    },

    {

      type: 'TDS Payment',

      date:
        new Date(
          nextYear,
          nextMonth,
          7
        ),

      desc:
        'TDS deposit'

    }

  ];

  return deadlines.map(d => {

    const daysLeft = Math.ceil(

      (d.date - now)

      / (1000 * 60 * 60 * 24)

    );

    return {

      ...d,

      daysLeft,

      urgent:
        daysLeft <= 5,

      dateStr:
        d.date
          .toISOString()
          .split('T')[0]

    };

  });

}

// =====================================
// SAVE GST TRANSACTION
// =====================================

function saveGSTTransaction(

  companyId,

  gstData

) {

  const db = new Database(DB_PATH);

  try {

    const id = uuidv4();

    const today = new Date()
      .toISOString()
      .split('T')[0];

    const period = new Date()
      .toISOString()
      .substring(0, 7);

    db.prepare(`
      INSERT INTO gst_transactions
      (
        id,
        company_id,
        invoice_date,
        party_name,
        party_gstin,
        taxable_value,
        gst_rate,
        cgst,
        sgst,
        igst,
        total_amount,
        is_interstate,
        return_period
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(

      id,

      companyId,

      today,

      gstData.partyName || 'Unknown',

      gstData.partyGSTIN || null,

      gstData.taxable,

      gstData.rate,

      gstData.cgst,

      gstData.sgst,

      gstData.igst,

      gstData.total,

      gstData.type === 'interstate'
        ? 1
        : 0,

      period

    );

    return {

      success: true,

      transactionId: id

    };

  } finally {

    db.close();

  }

}

// =====================================
// FORMAT GST RESPONSE
// =====================================

function formatGSTReply(

  gst,

  gstin = null

) {

  let msg = '';

  msg += '📋 GST Calculation\n\n';

  msg +=
    `Taxable Amount: ₹${gst.taxable
      .toLocaleString('en-IN')}\n`;

  msg +=
    `GST Rate: ${gst.rate}%\n`;

  msg +=
    `Type: ${
      gst.type === 'interstate'
      ? 'Interstate (IGST)'
      : 'Intrastate (CGST + SGST)'
    }\n\n`;

  if (
    gst.type === 'interstate'
  ) {

    msg +=
      `IGST (${gst.rate}%): ₹${gst.igst
        .toLocaleString('en-IN')}\n`;

  } else {

    msg +=
      `CGST (${gst.rate / 2}%): ₹${gst.cgst
        .toLocaleString('en-IN')}\n`;

    msg +=
      `SGST (${gst.rate / 2}%): ₹${gst.sgst
        .toLocaleString('en-IN')}\n`;

  }

  msg +=
    `\nTotal Invoice: ₹${gst.total
      .toLocaleString('en-IN')}`;

  // GSTIN validation

  if (gstin) {

    const validation =
      validateGSTIN(gstin);

    msg += validation.valid

      ? '\n\n✅ GSTIN Valid'

      : `\n\n❌ GSTIN Invalid\n${validation.reason}`;

  }

  return msg;

}

// =====================================
// MAIN GST SKILL
// =====================================

function runGSTSkill(params = {}) {

  const {

    amount,

    rate = 18,

    isInterstate = false,

    gstin = null,

    action = 'calculate'

  } = params;

  // ==================================
  // GSTIN VALIDATION
  // ==================================

  if (
    action === 'validate' &&
    gstin
  ) {

    const result =
      validateGSTIN(gstin);

    if (result.valid) {

      return (

        `✅ GSTIN Valid\n\n` +

        `GSTIN: ${gstin}\n` +

        `State: ${
          getState(result.stateCode)
        }\n` +

        `PAN: ${result.pan}`

      );

    }

    return (

      `❌ GSTIN Invalid\n\n` +

      `Reason: ${result.reason}\n\n` +

      `Example:\n27AAPFU0939F1ZV`

    );

  }

  // ==================================
  // COMPLIANCE CALENDAR
  // ==================================

  if (action === 'calendar') {

    const deadlines =
      getComplianceCalendar();

    let msg =
      '📅 Compliance Calendar\n\n';

    deadlines.forEach(d => {

      msg +=
        `${d.type}`;

      if (d.urgent) {

        msg += ' ⚠️ URGENT';

      }

      msg += '\n';

      msg +=
        `Date: ${d.dateStr}\n`;

      msg +=
        `Days Left: ${d.daysLeft}\n`;

      msg +=
        `${d.desc}\n\n`;

    });

    return msg;

  }

  // ==================================
  // GST CALCULATION
  // ==================================

  if (
    action === 'calculate'
  ) {

    if (!amount) {

      return (
        'Amount bataiye GST calculate karne ke liye.'
      );

    }

    const gst =
      calculateGST(
        amount,
        rate,
        isInterstate
      );

    return formatGSTReply(
      gst,
      gstin
    );

  }

  return 'GST request samajh nahi aayi.';

}

// =====================================
// EXPORTS
// =====================================

module.exports = {

  runGSTSkill,

  calculateGST,

  validateGSTIN,

  getComplianceCalendar,

  saveGSTTransaction,

  formatGSTReply,

  getState

};
