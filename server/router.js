//
// ======================================
// ARTHA AI — SMART ROUTER v2
// ======================================

const ROUTING_RULES = {

  TEJAS: [

    'gst',
    'tax',
    'filing',
    'return',
    'gstr',
    'notice',
    'itc',
    'gstin',
    'cgst',
    'sgst',
    'igst',
    'compliance',
    'deadline',
    'penalty',
    'refund',
    'tds',
    'gstr-1',
    'gstr-3b',
    'input credit',
    'tax rate',
    'gst rate',
    'gst calculate',
    'invoice gst'

  ],

  VIVEK: [

    'profit',
    'loss',
    'p&l',
    'report',
    'forecast',
    'cashflow',
    'cash flow',
    'balance sheet',
    'revenue',
    'margin',
    'loan',
    'funding',
    'runway',
    'projection',
    'financial',
    'scorecard',
    'income statement',
    'cash position',
    'kitna kamaya',
    'kitna bacha'

  ],

  LEKHAK: [

    'bill',
    'diya',
    'aaya',
    'kharida',
    'expense',
    'kharch',
    'income',
    'sale',
    'entry',
    'payment',
    'received',
    'paid',
    'salary',
    'rent',
    'bijli',
    'paani',
    'purchase',
    'sold',
    'bought',
    'petrol',
    'diesel',
    'repair',
    'maintenance',
    'subscription',
    'insurance',
    'interest',
    'commission',
    'discount',
    'advance',
    'deposit',
    'withdrawal'

  ],

  DHAN: [

    'help',
    'samjhao',
    'kya hai',
    'how',
    'what is',
    'explain',
    'onboard',
    'start',
    'begin',
    'new',
    'setup',
    'problem',
    'issue',
    'support',
    'namaste',
    'hello',
    'hi',
    'hey',
    'tutorial',
    'guide',
    'feature',
    'plan',
    'pricing',
    'kaise use'

  ]

};

// ======================================
// CONFIRMATION DETECTION
// ======================================

function isConfirmation(message) {

  if (!message) {

    return null;

  }

  const msg =
    message
      .toLowerCase()
      .trim();

  const yesWords = [

    'haan',
    'han',
    'ha',
    'haa',
    'yes',
    'y',
    'ok',
    'okay',
    'confirm',
    'save',
    'done',
    'हाँ',
    'हां'

  ];

  const noWords = [

    'nahi',
    'nah',
    'no',
    'n',
    'cancel',
    'stop',
    'mat karo',
    'band karo',
    'नहीं'

  ];

  if (
    yesWords.includes(msg)
  ) {

    return 'yes';

  }

  if (
    noWords.includes(msg)
  ) {

    return 'no';

  }

  return null;

}

// ======================================
// SCORE MESSAGE
// ======================================

function scoreMessage(

  message,

  keywords

) {

  let score = 0;

  const matched = [];

  const msg =
    message.toLowerCase();

  for (const keyword of keywords) {

    if (msg.includes(keyword)) {

      score++;

      matched.push(keyword);

    }

  }

  return {

    score,

    matched

  };

}

// ======================================
// MAIN ROUTER
// ======================================

function routeMessage(message) {

  const msg =
    message
      .toLowerCase()
      .trim();

  console.log(
    `→ Routing: "${msg.substring(0, 80)}"`
  );

  // ==================================
  // EMPTY
  // ==================================

  if (!msg) {

    return {

      agent: 'DHAN',

      confidence: 'empty',

      matched: []

    };

  }

  // ==================================
  // SCORING
  // ==================================

  let bestAgent = 'ARTHA';

  let bestScore = 0;

  let bestMatched = [];

  for (

    const [agent, keywords]

    of Object.entries(
      ROUTING_RULES
    )

  ) {

    const result =
      scoreMessage(
        msg,
        keywords
      );

    if (
      result.score > bestScore
    ) {

      bestAgent = agent;

      bestScore = result.score;

      bestMatched =
        result.matched;

    }

  }

  // ==================================
  // CONFIDENCE
  // ==================================

  let confidence =
    'fallback';

  if (bestScore >= 3) {

    confidence = 'high';

  }

  else if (bestScore >= 1) {

    confidence = 'medium';

  }

  // ==================================
  // DEBUG
  // ==================================

  console.log(

    `✓ Routed → ${bestAgent}`

  );

  console.log(

    `✓ Score → ${bestScore}`

  );

  console.log(

    `✓ Matched → ${bestMatched.join(', ')}`

  );

  return {

    agent: bestAgent,

    confidence,

    score: bestScore,

    matched: bestMatched

  };

}

// ======================================
// INTENT DETECTION
// ======================================

function detectIntent(message) {

  const msg =
    message.toLowerCase();

  // ==================================
  // OCR / IMAGE
  // ==================================

  if (

    msg.includes('image') ||

    msg.includes('photo') ||

    msg.includes('scan') ||

    msg.includes('invoice') ||

    msg.includes('receipt') ||

    msg.includes('bill pic')

  ) {

    return 'ocr';

  }

  // ==================================
  // REPORTS
  // ==================================

  if (

    msg.includes('report') ||

    msg.includes('summary') ||

    msg.includes('statement') ||

    msg.includes('dikhao')

  ) {

    return 'report';

  }

  // ==================================
  // REMINDERS
  // ==================================

  if (

    msg.includes('remind') ||

    msg.includes('deadline') ||

    msg.includes('due') ||

    msg.includes('kab hai')

  ) {

    return 'reminder';

  }

  // ==================================
  // CALCULATIONS
  // ==================================

  if (

    msg.includes('calculate') ||

    msg.includes('kitna gst') ||

    msg.includes('kitna tax')

  ) {

    return 'calculate';

  }

  // ==================================
  // ENTRY
  // ==================================

  if (

    msg.includes('diya') ||

    msg.includes('aaya') ||

    msg.includes('paid') ||

    msg.includes('received')

  ) {

    return 'entry';

  }

  return 'message';

}

// ======================================
// MEDIA DETECTION
// ======================================

function detectMediaIntent(

  mimeType = ''

) {

  if (
    mimeType.startsWith('image/')
  ) {

    return 'image';

  }

  if (
    mimeType.startsWith('audio/')
  ) {

    return 'voice';

  }

  if (
    mimeType.includes('pdf')
  ) {

    return 'document';

  }

  return 'unknown';

}

// ======================================
// EXPORTS
// ======================================

module.exports = {

  routeMessage,

  detectIntent,

  detectMediaIntent,

  isConfirmation,

  scoreMessage

};
