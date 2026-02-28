#!/usr/bin/env node
/**
 * Fix double-encoded emoji/symbols in source files.
 *
 * Problem: Some files have emoji/symbols stored as "Windows-1252 bytes re-encoded as UTF-8".
 * e.g. 📊 (bytes: F0 9F 93 8A) was wrongly read as 4 CP1252 chars (ðŸ"Š),
 * and those 4 chars were then saved back as valid UTF-8. So the file has valid UTF-8
 * but wrong content.
 *
 * Fix:
 *   1. Read file as UTF-8  → get mojibake string
 *   2. Map each char back to its CP1252 byte (full 256-entry reverse table)
 *   3. Decode resulting raw bytes as UTF-8 → get correct emoji/text
 *   4. Write back as UTF-8
 */

const fs = require('fs');
const path = require('path');

// Full CP1252 → Unicode mapping for the 0x80–0x9F range (the rest is identical to Latin-1).
// Maps Unicode codepoint → CP1252 byte value.
const CP1252_REVERSE = new Map([
  [0x20AC, 0x80], // €
  [0x201A, 0x82], // ‚
  [0x0192, 0x83], // ƒ
  [0x201E, 0x84], // „
  [0x2026, 0x85], // …
  [0x2020, 0x86], // †
  [0x2021, 0x87], // ‡
  [0x02C6, 0x88], // ˆ
  [0x2030, 0x89], // ‰
  [0x0160, 0x8A], // Š
  [0x2039, 0x8B], // ‹
  [0x0152, 0x8C], // Œ
  [0x017D, 0x8E], // Ž
  [0x2018, 0x91], // '
  [0x2019, 0x92], // '
  [0x201C, 0x93], // "
  [0x201D, 0x94], // "
  [0x2022, 0x95], // •
  [0x2013, 0x96], // –
  [0x2014, 0x97], // —
  [0x02DC, 0x98], // ˜
  [0x2122, 0x99], // ™
  [0x0161, 0x9A], // š
  [0x203A, 0x9B], // ›
  [0x0153, 0x9C], // œ
  [0x017E, 0x9E], // ž
  [0x0178, 0x9F], // Ÿ
]);

function charToCP1252Byte(cp) {
  if (cp <= 0xFF) return cp; // Latin-1 range maps directly
  const mapped = CP1252_REVERSE.get(cp);
  return mapped !== undefined ? mapped : null;
}

function fixDoubleEncoding(text) {
  const resultBytes = [];
  let i = 0;

  while (i < text.length) {
    const cp = text.codePointAt(i);
    const byte = charToCP1252Byte(cp);

    if (byte === null) {
      // Character can't be mapped to a single CP1252 byte — keep original UTF-8 bytes
      const slice = String.fromCodePoint(cp);
      const encoded = Buffer.from(slice, 'utf8');
      for (const b of encoded) resultBytes.push(b);
    } else {
      resultBytes.push(byte);
    }
    // Advance by the right number of JS code units (surrogate pairs = 2)
    i += cp > 0xFFFF ? 2 : 1;
  }

  // Decode the reconstructed bytes as UTF-8 to get the correct text
  let fixed;
  try {
    fixed = Buffer.from(resultBytes).toString('utf8');
  } catch (e) {
    return null; // Invalid UTF-8 result — skip
  }

  // Compare re-encoded result to original: if they're the same bytes, file was clean
  const originalBytes = Buffer.from(text, 'utf8');
  const fixedBytes = Buffer.from(fixed, 'utf8');
  if (fixedBytes.equals(originalBytes)) return null;

  return fixed;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node fix-encoding.js <file1> [file2] ...');
  process.exit(1);
}

for (const file of files) {
  const abs = path.resolve(file);
  try {
    const wrongText = fs.readFileSync(abs, 'utf8');
    const fixed = fixDoubleEncoding(wrongText);

    if (fixed !== null) {
      // Sanity check: result should be valid and not too different in size
      if (fixed.length > 0 && Math.abs(fixed.length - wrongText.length) / wrongText.length < 0.5) {
        fs.writeFileSync(abs, fixed, 'utf8');
        const emojiCount = (fixed.match(/[\u{10000}-\u{10FFFF}]/gu) || []).length;
        console.log(`✓ Fixed: ${path.relative(process.cwd(), abs)} (${emojiCount} emoji restored)`);
      } else {
        console.log(`⚠ Skipped (size sanity fail): ${path.relative(process.cwd(), abs)}`);
      }
    } else {
      console.log(`- Already clean: ${path.relative(process.cwd(), abs)}`);
    }
  } catch (e) {
    console.error(`✗ Error: ${path.relative(process.cwd(), abs)}: ${e.message}`);
  }
}
