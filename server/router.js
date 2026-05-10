// ======================================
// INTENT DETECTION
// ======================================

function detectIntent(message) {

  const msg =
    message.toLowerCase();

  // ==========================
  // GST
  // ==========================

  if (
    msg.includes('gst') ||
    msg.includes('tax') ||
    msg.includes('gstr')
  ) {

    return 'gst';

  }

  // ==========================
  // PROFIT / FINANCE
  // ==========================

  if (
    msg.includes('profit') ||
    msg.includes('loss') ||
    msg.includes('revenue') ||
    msg.includes('cashflow')
  ) {

    return 'finance';

  }

  // ==========================
  // HELP
  // ==========================

  if (
    msg.includes('help') ||
    msg.includes('support') ||
    msg.includes('problem')
  ) {

    return 'support';

  }

  // ==========================
  // ACCOUNTING
  // ==========================

  if (
    msg.includes('bill') ||
    msg.includes('expense') ||
    msg.includes('paid') ||
    msg.includes('income') ||
    msg.includes('received') ||
    msg.includes('diya')
  ) {

    return 'accounting';

  }

  return 'general';

}

// ======================================
// ROUTING
// ======================================

function routeMessage(message) {

  const intent =
    detectIntent(message);

  switch (intent) {

    case 'gst':

      return {
        agent: 'TEJAS',
        confidence: 0.95
      };

    case 'finance':

      return {
        agent: 'VIVEK',
        confidence: 0.92
      };

    case 'support':

      return {
        agent: 'DHAN',
        confidence: 0.90
      };

    case 'accounting':

      return {
        agent: 'LEKHAK',
        confidence: 0.94
      };

    default:

      return {
        agent: 'ARTHA',
        confidence: 0.80
      };

  }

}

// ======================================

module.exports = {

  detectIntent,

  routeMessage

};
