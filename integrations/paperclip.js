const axios = require('axios');

// ======================================
// PAPERCLIP API
// ======================================

const PAPERCLIP =
  'http://localhost:3001/api';

let alive = false;

// ======================================
// CHECK PAPERCLIP
// ======================================

async function checkPaperclip() {

  try {

    await axios.get(

      `${PAPERCLIP}/health`,

      { timeout: 2000 }

    );

    alive = true;

    console.log(
      '✓ Paperclip connected'
    );

  } catch {

    alive = false;

    console.log(
      '→ Paperclip offline. Skipping dashboard.'
    );

  }

  return alive;

}

// ======================================
// REPORT TASK
// ======================================

async function reportTask(
  agent,
  task,
  status,
  result
) {

  if (!alive) return;

  try {

    await axios.post(

      `${PAPERCLIP}/tasks`,

      {

        agent,

        task:
          task?.substring(0, 100),

        status,

        result:
          result?.substring(0, 100),

        timestamp:
          new Date().toISOString()

      }

    );

  } catch {

    // Ignore dashboard errors

  }

}

// ======================================
// HEARTBEAT
// ======================================

async function heartbeat(agent) {

  if (!alive) return;

  try {

    await axios.post(

      `${PAPERCLIP}/agents/${agent}/heartbeat`,

      {

        timestamp:
          new Date().toISOString()

      }

    );

  } catch {

    // Ignore dashboard errors

  }

}

// ======================================

module.exports = {

  checkPaperclip,

  reportTask,

  heartbeat

};
