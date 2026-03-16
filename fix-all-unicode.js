/**
 * fix-all-unicode.js
 * Final comprehensive pass: replace every non-ASCII character that can render as ??
 * Covers: arrows, bullets, box-drawing, geometric shapes, dashes, special symbols.
 */
const fs = require('fs');
const path = require('path');

// Each entry: char → { icon?: string, text: string }
// icon = react-icons/fa component name for JSX replacements
// text = plain ASCII fallback for string literals / non-JSX contexts
const REPLACEMENTS = [
  // ── Arrows ──────────────────────────────────────
  { ch: '←', icon: 'FaArrowLeft',        text: '<-'   },
  { ch: '→', icon: 'FaArrowRight',       text: '->'   },
  { ch: '↑', icon: 'FaArrowUp',          text: '^'    },
  { ch: '↓', icon: 'FaArrowDown',        text: 'v'    },
  { ch: '↗', icon: 'FaExternalLinkAlt',  text: '->'   },
  { ch: '↩', icon: 'FaUndo',             text: '<-'   },
  { ch: '‹', icon: 'FaChevronLeft',      text: '<'    },
  { ch: '›', icon: 'FaChevronRight',     text: '>'    },
  // ── Geometric / Shapes ─────────────────────────
  { ch: '▼', icon: 'FaCaretDown',        text: 'v'    },
  { ch: '▾', icon: 'FaCaretDown',        text: 'v'    },
  { ch: '▲', icon: 'FaCaretUp',          text: '^'    },
  { ch: '●', icon: 'FaCircle',           text: '*'    },
  { ch: '○', icon: 'FaRegCircle',        text: 'o'    },
  { ch: '◆', icon: 'FaSquare',           text: '*'    },
  { ch: '◇', icon: 'FaRegSquare',        text: 'o'    },
  // ── Box Drawing ────────────────────────────────
  { ch: '─', icon: null,                 text: '-'    },
  { ch: '━', icon: null,                 text: '-'    },
  // ── Letterlike / Math ──────────────────────────
  { ch: 'ℹ', icon: 'FaInfoCircle',       text: 'i'    },
  { ch: '∞', icon: null,                 text: 'Unlimited' },
  { ch: '≈', icon: null,                 text: '~'    },
  // ── Punctuation / Typography ──────────────────
  { ch: '—', icon: null,                 text: ' - '  },
  { ch: '–', icon: null,                 text: '-'    },
  { ch: '‑', icon: null,                 text: '-'    },   // non-breaking hyphen
  { ch: '…', icon: null,                 text: '...'  },
  { ch: '•', icon: null,                 text: '-'    },
  { ch: '\u200D', icon: null,            text: ''     },   // zero-width joiner
  { ch: '\u200B', icon: null,            text: ''     },   // zero-width space
  { ch: '\u00A0', icon: null,            text: ' '    },   // nbsp
  // ── Curly quotes → straight quotes ───────────
  { ch: '\u201C', icon: null,            text: '"'    },   // "
  { ch: '\u201D', icon: null,            text: '"'    },   // "
  { ch: '\u2018', icon: null,            text: "'"    },   // '
  { ch: '\u2019', icon: null,            text: "'"    },   // '
  // ── Misc symbols ──────────────────────────────
  { ch: '†', icon: null,                 text: ''     },   // dagger
  { ch: '‰', icon: null,                 text: '%'   },
  { ch: '€', icon: null,                 text: 'EUR'  },
];

// Sort longest first to avoid partial replacements
REPLACEMENTS.sort((a, b) => b.ch.length - a.ch.length);

function escapeRegex(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const iconsUsed = new Set();

  for (const { ch, icon, text } of REPLACEMENTS) {
    if (!content.includes(ch)) continue;

    if (icon) {
      // Replace in JSX text node position: >...X...< → ><Icon />....<
      content = content.replace(
        new RegExp(`(>[^<]*?)${escapeRegex(ch)}([^<]*)(?=<)`, 'g'),
        (m, before, after) => {
          iconsUsed.add(icon);
          return `${before}<${icon} style={{marginRight:4}} />${after}`;
        }
      );
      // Replace bare JSX expression {'X'}
      content = content.replace(
        new RegExp(`\\{['"\`]${escapeRegex(ch)}['"\`]\\}`, 'g'),
        () => { iconsUsed.add(icon); return `<${icon} />`; }
      );
    }

    // Strip/replace anything remaining (strings, attributes, code)
    content = content.split(ch).join(text !== undefined ? text : '');
  }

  if (content !== original) {
    // Merge icons into existing react-icons/fa import or add new one
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
    return true;
  }
  return false;
}

function walk(dir) {
  const fixedFiles = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) fixedFiles.push(...walk(fp));
    else if (f.endsWith('.tsx')) {
      if (processFile(fp)) fixedFiles.push(fp);
    }
  }
  return fixedFiles;
}

console.log('Running full Unicode cleanup on all TSX files...');
const fixed = walk(path.join(__dirname, 'src'));
console.log(`\nFixed ${fixed.length} files:`);
fixed.forEach(f => console.log(' ', path.relative(process.cwd(), f)));
console.log('\nDone!');
