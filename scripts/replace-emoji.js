#!/usr/bin/env node
/**
 * Bulk emoji → react-icons replacement script.
 * Processes every .tsx/.ts file under src/ and:
 *  1. Replaces emoji in JSX text / expressions with <IconName /> components
 *  2. Strips any remaining emoji from string literals
 *  3. Merges / adds the react-icons/fa import in each modified file
 */
const fs = require('fs');
const path = require('path');

// ─── emoji → icon name ────────────────────────────────────────────────────────
const EMOJI_MAP = {
  '🔧': 'FaWrench',   '🛠️': 'FaTools',    '🛠': 'FaTools',
  '⚙️': 'FaCog',      '⚙': 'FaCog',        '🔩': 'FaCog',
  '🏢': 'FaBuilding', '🏬': 'FaStore',     '🏪': 'FaStore',
  '🕐': 'FaClock',    '🕑': 'FaClock',     '🕒': 'FaClock',
  '💳': 'FaCreditCard',
  '🔔': 'FaBell',     '🛎️': 'FaBell',      '🛎': 'FaBell',
  '🚪': 'FaSignOutAlt',
  '📅': 'FaCalendarAlt', '🗓️': 'FaCalendarAlt', '🗓': 'FaCalendarAlt', '📆': 'FaCalendarAlt',
  '✅': 'FaCheckCircle',
  '❌': 'FaTimesCircle',
  '⚠️': 'FaExclamationTriangle', '⚠': 'FaExclamationTriangle',
  '🚨': 'FaExclamationCircle',  '❗': 'FaExclamationCircle',
  '🔒': 'FaLock',    '🔐': 'FaLock',
  '🔓': 'FaUnlock',
  '🔑': 'FaKey',
  '📋': 'FaClipboardList', '📝': 'FaClipboardList',
  '✏️': 'FaEdit',    '✏': 'FaEdit',
  '📊': 'FaChartBar',
  '📈': 'FaChartLine', '📉': 'FaChartLine',
  '🎉': 'FaSmile',   '😊': 'FaSmile',     '😎': 'FaSmile',
  '📞': 'FaPhone',   '☎️': 'FaPhone',     '☎': 'FaPhone',
  '🎨': 'FaPalette',
  '📍': 'FaMapMarkerAlt',
  '📧': 'FaEnvelope', '✉️': 'FaEnvelope', '✉': 'FaEnvelope',
  '💬': 'FaComments',
  '📱': 'FaMobileAlt',
  '🚀': 'FaRocket',
  '📢': 'FaBullhorn',
  '♻️': 'FaRecycle',  '♻': 'FaRecycle',
  '📸': 'FaCamera',  '📷': 'FaCamera',
  '🚗': 'FaCar',     '🚘': 'FaCar',
  '🚚': 'FaTruck',   '🚛': 'FaTruck',
  '💰': 'FaDollarSign', '💵': 'FaDollarSign', '💲': 'FaDollarSign', '🪙': 'FaDollarSign',
  '👤': 'FaUser',
  '👥': 'FaUsers',
  '🔍': 'FaSearch',  '🔎': 'FaSearch',
  '🗑️': 'FaTrash',  '🗑': 'FaTrash',
  '➕': 'FaPlus',
  '➖': 'FaMinus',
  '🔗': 'FaLink',
  '📦': 'FaBox',
  '🏷️': 'FaTag',    '🏷': 'FaTag',
  '💡': 'FaLightbulb',
  '🎯': 'FaBullseye',
  '📌': 'FaThumbtack',
  '🏆': 'FaTrophy',
  '⭐': 'FaStar',    '🌟': 'FaStar',
  '🔄': 'FaSyncAlt', '🔃': 'FaSyncAlt',
  '📤': 'FaUpload',
  '📥': 'FaDownload',
  '🖨️': 'FaPrint',  '🖨': 'FaPrint',
  '🚫': 'FaBan',
  '➡️': 'FaArrowRight', '➡': 'FaArrowRight',
  '⬅️': 'FaArrowLeft',  '⬅': 'FaArrowLeft',
  '⬆️': 'FaArrowUp',    '⬆': 'FaArrowUp',
  '⬇️': 'FaArrowDown',  '⬇': 'FaArrowDown',
  '⛽': 'FaGasPump',
  '🛒': 'FaShoppingCart',
  '🏗️': 'FaBuilding',  '🏗': 'FaBuilding',
  '📃': 'FaFileAlt', '📄': 'FaFileAlt',
  '📁': 'FaFolder',  '📂': 'FaFolderOpen',
  '🎁': 'FaGift',
  '💼': 'FaBriefcase',
  '🏦': 'FaUniversity',
  '💻': 'FaLaptop',  '🖥️': 'FaDesktop',  '🖥': 'FaDesktop',
  '👍': 'FaThumbsUp',
  '👎': 'FaThumbsDown',
  '🧾': 'FaReceipt',
  '🔥': 'FaFire',
  '🛡️': 'FaShieldAlt', '🛡': 'FaShieldAlt', '🔰': 'FaShieldAlt',
  '💎': 'FaGem',
  '🏅': 'FaMedal',   '🥇': 'FaMedal',
  '📰': 'FaNewspaper',
  '📚': 'FaBook',    '📕': 'FaBook',    '📗': 'FaBook',
  '🏠': 'FaHome',    '🏡': 'FaHome',
  '🤝': 'FaHandshake',
  '🌍': 'FaGlobe',   '🌎': 'FaGlobe',   '🌏': 'FaGlobe',
  '🗺️': 'FaMap',    '🗺': 'FaMap',
  '🏁': 'FaFlagCheckered',
  '🚩': 'FaFlag',    '🏴': 'FaFlag',
  '💪': 'FaDumbbell',
  '👋': 'FaHandPointRight',
  '🔭': 'FaBinoculars',
  '📡': 'FaSatelliteDish',
  '💊': 'FaPills',
  '💉': 'FaSyringe',
};

// Sort so longer multi-char emoji are replaced first
const SORTED_EMOJI = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;
  const usedIcons = new Set();

  for (const emoji of SORTED_EMOJI) {
    if (!src.includes(emoji)) continue;
    const icon = EMOJI_MAP[emoji];
    const re = new RegExp(escapeRe(emoji), 'g');

    // Replace in JSX text between > ... <  (handles both same-line and multiline)
    // e.g.  >🔧<   or   >🔧 Title<
    src = src.replace(new RegExp(`(>[^<>]*?)${escapeRe(emoji)}([^<>]*?<)`, 'g'), (m, before, after) => {
      usedIcons.add(icon);
      return `${before}<${icon} style={{marginRight:4}} />${after}`;
    });

    // Replace in JSX expressions like {'🔧'} or {"🔧"}
    src = src.replace(new RegExp(`\\{\\s*['"]${escapeRe(emoji)}['"]\\s*\\}`, 'g'), () => {
      usedIcons.add(icon);
      return `<${icon} />`;
    });

    // All remaining occurrences → strip the emoji char from strings
    src = src.replace(re, '');
  }

  if (src === original) return;

  // ── Update / add react-icons import ─────────────────────────────────────────
  if (usedIcons.size > 0) {
    const existingMatch = src.match(/^import\s*\{([^}]+)\}\s*from\s*'react-icons\/fa';/m);
    if (existingMatch) {
      const existing = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const merged = [...new Set([...existing, ...usedIcons])].sort().join(', ');
      src = src.replace(existingMatch[0], `import { ${merged} } from 'react-icons/fa';`);
    } else {
      const sorted = [...usedIcons].sort().join(', ');
      const newImport = `import { ${sorted} } from 'react-icons/fa';\n`;
      const ucMatch = src.match(/^'use client';\n/);
      if (ucMatch) {
        src = src.replace(ucMatch[0], `${ucMatch[0]}${newImport}`);
      } else {
        // Place after the last existing import line
        const lines = src.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (/^import /.test(lines[i])) lastImportIdx = i;
        }
        if (lastImportIdx >= 0) {
          lines.splice(lastImportIdx + 1, 0, newImport.trimEnd());
          src = lines.join('\n');
        } else {
          src = newImport + src;
        }
      }
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`✔ ${path.relative(process.cwd(), filePath)}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      processFile(full);
    }
  }
}

console.log('🔍 Scanning for emoji in src/ …\n');
walk(path.join(__dirname, 'src'));
console.log('\n✅ Done!');
