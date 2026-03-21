/**
 * fix-special-chars.js
 * Replace Unicode symbols that render as ?? in browsers:
 * clock/timer emoji, arrows in specific contexts, geometric shape icons, etc.
 * Only processes .tsx files (visual components).
 */
const fs = require('fs');
const path = require('path');

// Map of char → { icon: react-icon name, text: plain-text fallback }
// icon=null means use text fallback only
const MAP = {
  '⏳': { icon: 'FaHourglassHalf', text: '' },
  '⏰': { icon: 'FaClock', text: '' },
  '⏱': { icon: 'FaStopwatch', text: '' },
  '⌛': { icon: 'FaHourglassHalf', text: '' },
  '⏭': { icon: 'FaStepForward', text: '' },
  '⟳': { icon: 'FaSyncAlt', text: '' },
  '↻': { icon: 'FaSyncAlt', text: '' },
  '↺': { icon: 'FaSyncAlt', text: '' },
  '⊘': { icon: 'FaBan', text: '' },
  '⃣': { icon: null, text: '' },         // combining keycap - just strip
  '⬜': { icon: 'FaRegSquare', text: '' },
  '⬛': { icon: 'FaSquare', text: '' },
  '▶': { icon: 'FaCaretRight', text: '' },
  '⏸': { icon: 'FaPause', text: '' },
  '⏹': { icon: 'FaStop', text: '' },
  '⏺': { icon: 'FaCircle', text: '' },
  '◼': { icon: 'FaSquare', text: '' },
  // admin/command-center geometric shapes
  '◉': { icon: 'FaDotCircle', text: '' },
  '▣': { icon: 'FaCheckSquare', text: '' },
  '◎': { icon: 'FaRegCircle', text: '' },
  '◈': { icon: 'FaRegSquare', text: '' },
  // Command key - no good icon, use text
  '⌘': { icon: null, text: 'Cmd' },
};

const sortedChars = Object.keys(MAP).sort((a, b) => b.length - a.length);

function escapeRegex(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const iconsUsed = new Set();

  for (const ch of sortedChars) {
    if (!content.includes(ch)) continue;
    const { icon, text } = MAP[ch];

    if (icon) {
      // In JSX text nodes: >...char...< → icon component
      content = content.replace(
        new RegExp(`(>[^<]*?)${escapeRegex(ch)}([^<]*)(?=<)`, 'g'),
        (match, before, after) => {
          iconsUsed.add(icon);
          return `${before}<${icon} style={{marginRight:4}} />${after}`;
        }
      );
      // In JSX expressions like {'⏳'} → <Icon />
      content = content.replace(
        new RegExp(`\\{['"\`]${escapeRegex(ch)}['"\`]\\}`, 'g'),
        () => { iconsUsed.add(icon); return `<${icon} />`; }
      );
    }

    // Strip/replace remaining occurrences (string literals, attributes, etc.)
    content = content.split(ch).join(text || '');
  }

  if (content !== original) {
    // Merge icons into existing react-icons/fa import, or add new one
    if (iconsUsed.size > 0) {
      const existingMatch = content.match(/^import \{([^}]+)\} from ['"]react-icons\/fa['"]/m);
      if (existingMatch) {
        const existing = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...existing, ...iconsUsed])].sort();
        content = content.replace(
          existingMatch[0],
          `import { ${merged.join(', ')} } from 'react-icons/fa'`
        );
      } else {
        // Insert after 'use client' or at top
        const clientMatch = content.match(/^'use client';\r?\n/);
        if (clientMatch) {
          content = content.replace(
            clientMatch[0],
            `${clientMatch[0]}import { ${[...iconsUsed].sort().join(', ')} } from 'react-icons/fa';\n`
          );
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
    else if (f.endsWith('.tsx')) processFile(fp);
  }
}

console.log('Fixing clock/timer/shape symbols that render as ?? ...');
walk(path.join(__dirname, 'src'));
console.log('Done!');
