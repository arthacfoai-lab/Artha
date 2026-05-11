// ARTHA AI — Global Constants

module.exports = {

  // ======================================
  // AGENTS
  // ======================================

  AGENTS: {

    CEO:        'ARTHA',

    CA:         'TEJAS',

    CFO:        'VIVEK',

    BOOKKEEPER: 'LEKHAK',

    SUPPORT:    'DHAN'

  },

  // ======================================
  // MODELS
  // ======================================

  MODELS: {

    FAST:
      'llama-3.1-8b-instant',

    SMART:
      'llama-3.3-70b-versatile',

    DEFAULT:
      'llama-3.1-8b-instant'

  },

  // ======================================
  // GST RATES
  // ======================================

  GST_RATES: [

    0,
    5,
    12,
    18,
    28

  ],

  // ======================================
  // COMPLIANCE
  // ======================================

  COMPLIANCE: {

    GSTR1_DAY:  11,

    GSTR3B_DAY: 20,

    TDS_DAY:    7

  },

  // ======================================
  // TOKEN LIMITS
  // ======================================

  MAX_TOKENS: {

    SHORT:  200,

    MEDIUM: 500,

    LONG:   1000

  },

  // ======================================
  // PLATFORMS
  // ======================================

  PLATFORMS: [

    'telegram',

    'whatsapp',

    'test'

  ]

};
