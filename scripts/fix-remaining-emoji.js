/**
 * fix-remaining-emoji.js
 * Second pass: strip/replace all remaining emoji characters not caught by the first script.
 */
const fs = require('fs');
const path = require('path');

// Additional emoji → icon mappings missed in first pass
const EXTRA_MAP = {
  '✓': 'FaCheck',
  '✕': 'FaTimes',
  '✗': 'FaTimes',
  '✱': null,           // just strip
  '⚡': 'FaBolt',
  '★': 'FaStar',
  '☆': 'FaRegStar',
  '👷': 'FaHardHat',
  '👑': 'FaCrown',
  '🔬': 'FaMicroscope',
  '👔': 'FaUserTie',
  '🚙': 'FaCar',
  '✍': 'FaPencilAlt',
  '☁': 'FaCloud',
  '🎛': 'FaSlidersH',
  '🎟': 'FaTicketAlt',
  '✨': 'FaStar',
  '📖': 'FaBook',
  '🩺': 'FaStethoscope',
  '❤': 'FaHeart',
  '💸': 'FaDollarSign',
  '🔴': null,           // color dot - strip
  '🔁': 'FaSyncAlt',
  '🛣': 'FaRoad',
  '👨': 'FaUser',
  '👈': 'FaHandPointLeft',
  '💥': 'FaBolt',
  '🟢': null,           // color dot - strip
  '⚫': null,           // color dot - strip
  '🗂': 'FaFolder',
  '🟡': null,           // color dot - strip
  '🛢': 'FaOilCan',
  '❄': 'FaSnowflake',
  '🔋': 'FaBatteryFull',
  '💧': 'FaTint',
  '🔌': 'FaPlug',
  '🌴': null,           // strip
  '💹': 'FaChartLine',
  '🏭': 'FaIndustry',
  '🔖': 'FaBookmark',
  '🪪': 'FaIdCard',
  '🔵': null,           // color dot - strip
  '🟠': null,           // color dot - strip
  '📐': 'FaRulerCombined',
  '📘': 'FaBook',
  '🏛': 'FaUniversity',
  '🎥': 'FaVideo',
  '😕': 'FaFrown',
  '☕': 'FaCoffee',
  '☰': null,            // hamburger icon - strip (likely in non-JSX context)
  '🥈': 'FaMedal',
  '🥉': 'FaMedal',
  '💾': 'FaSave',
  '\uFE0F': '',         // variation selector - always strip
};

// Full unicode emoji range — anything remaining that's not in the map
const BROAD_EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F004}\u{1F0CF}]/gu;

const sortedEmoji = Object.keys(EXTRA_MAP).sort((a, b) => b.length - a.length);

function escapeRegex(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const iconsUsed = new Set();

  for (const emoji of sortedEmoji) {
    if (!content.includes(emoji)) continue;
    const icon = EXTRA_MAP[emoji];

    if (icon) {
      // Replace in JSX text nodes: >emoji< or > emoji text<
      content = content.replace(
        new RegExp(`(>[^<]*?)${escapeRegex(emoji)}([^<]*?)(?=<)`, 'g'),
        (match, before, after) => {
          iconsUsed.add(icon);
          return `${before}<${icon} style={{marginRight:4}} />${after}`;
        }
      );
    }

    // Strip any remaining (in strings, attributes, etc.)
    content = content.split(emoji).join('');
  }

  // Strip everything else still in the broad emoji range (unmapped)
  content = content.replace(BROAD_EMOJI_RE, '');

  if (content !== original) {
    // Add react-icons import if needed
    if (iconsUsed.size > 0) {
      const existingMatch = content.match(/^import \{([^}]+)\} from ['"]react-icons\/fa['"]/m);
      if (existingMatch) {
        const existing = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...existing, ...iconsUsed])].sort();
        content = content.replace(existingMatch[0], `import { ${merged.join(', ')} } from 'react-icons/fa'`);
      } else {
        const insertAfter = content.match(/^'use client';\r?\n/);
        if (insertAfter) {
          content = content.replace(insertAfter[0], `${insertAfter[0]}import { ${[...iconsUsed].sort().join(', ')} } from 'react-icons/fa';\n`);
        } else {
          content = `import { ${[...iconsUsed].sort().join(', ')} } from 'react-icons/fa';\n` + content;
        }
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) processFile(fp);
  }
}

console.log('Running second-pass emoji cleanup...');
walk(path.join(__dirname, 'src'));
console.log('Done!');
