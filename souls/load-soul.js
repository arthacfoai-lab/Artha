const fs = require('fs');
const path = require('path');

function loadSoul(soulPath) {
  try {
    const fullPath = path.resolve(soulPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠ SOUL not found: ${fullPath}`);
      return 'You are ARTHA, an AI CA assistant. Reply in Hinglish.';
    }

    const soul = fs.readFileSync(fullPath, 'utf8');
    console.log(`✓ SOUL loaded: ${fullPath}`);
    console.log(`  Size: ${soul.length} chars`);
    return soul;

  } catch (err) {
    console.error('SOUL load error:', err.message);
    return 'You are ARTHA, an AI CA assistant. Reply in Hinglish.';
  }
}

module.exports = { loadSoul };
