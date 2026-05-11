//
// ======================================
// ARTHA AI — SESSION MANAGER
// ======================================
//
// Handles:
// - pending confirmations
// - temporary user state
// - confirmation expiry
// - session cleanup
//
// ======================================

// ======================================
// MEMORY STORE
// ======================================

const sessions = new Map();

// ======================================
// CONFIG
// ======================================

const SESSION_TIMEOUT =
  5 * 60 * 1000; // 5 mins

// ======================================
// CLEAN EXPIRED SESSIONS
// ======================================

function cleanExpiredSessions() {

  const now = Date.now();

  let cleaned = 0;

  for (const [phone, session] of sessions) {

    const age =
      now - session.timestamp;

    if (age > SESSION_TIMEOUT) {

      sessions.delete(phone);

      cleaned++;

    }

  }

  if (cleaned > 0) {

    console.log(
      `🧹 Cleaned ${cleaned} expired sessions`
    );

  }

}

// ======================================
// AUTO CLEANUP
// ======================================

setInterval(

  cleanExpiredSessions,

  60 * 1000 // every minute

);

// ======================================
// SET PENDING
// ======================================

function setPending(

  phone,

  data

) {

  if (!phone) {

    throw new Error(
      'Phone required'
    );

  }

  sessions.set(phone, {

    ...data,

    timestamp: Date.now()

  });

  console.log(
    `📝 Pending session set: ${phone}`
  );

}

// ======================================
// GET PENDING
// ======================================

function getPending(phone) {

  if (!phone) {

    return null;

  }

  const session =
    sessions.get(phone);

  if (!session) {

    return null;

  }

  const age =
    Date.now() - session.timestamp;

  // ==================================
  // EXPIRED
  // ==================================

  if (age > SESSION_TIMEOUT) {

    sessions.delete(phone);

    console.log(
      `⌛ Session expired: ${phone}`
    );

    return null;

  }

  return session;

}

// ======================================
// CLEAR PENDING
// ======================================

function clearPending(phone) {

  if (!phone) {

    return false;

  }

  const existed =
    sessions.has(phone);

  sessions.delete(phone);

  if (existed) {

    console.log(
      `🗑 Session cleared: ${phone}`
    );

  }

  return existed;

}

// ======================================
// HAS PENDING
// ======================================

function hasPending(phone) {

  return getPending(phone) !== null;

}

// ======================================
// GET SESSION COUNT
// ======================================

function getSessionCount() {

  cleanExpiredSessions();

  return sessions.size;

}

// ======================================
// DEBUG ALL SESSIONS
// ======================================

function getAllSessions() {

  cleanExpiredSessions();

  return Array.from(
    sessions.entries()
  ).map(([phone, data]) => ({

    phone,

    ...data

  }));

}

// ======================================
// EXPORTS
// ======================================

module.exports = {

  setPending,

  getPending,

  clearPending,

  hasPending,

  getSessionCount,

  getAllSessions,

  cleanExpiredSessions

};
