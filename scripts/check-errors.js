const fs = require('fs'), path = require('path');
const useClientBad = [], arrowBad = [];

function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(fp, 'utf8');
      const lines = content.split('\n');
      const ucLine = lines.findIndex(l => {
        const t = l.trim();
        return t === '"use client";' || t === "'use client';";
      });
      if (ucLine > 0 && lines.slice(0, ucLine).some(l => l.startsWith('import '))) {
        useClientBad.push(fp);
      }
      // Check for -> in JSX text (not in comments, not in type annotations, not in strings used as types)
      lines.forEach((l, i) => {
        const t = l.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        // Only flag -> that appears in JSX text content (inside > ... <)
        // A rough heuristic: if the line has JSX-like content (starts with < or is inside JSX)
        // and has -> that's not part of a TypeScript arrow type or comment
        if (/->/.test(l) && /<[A-Za-z]/.test(l) && !t.startsWith('const ') && !t.startsWith('let ') && !t.startsWith('function')) {
          arrowBad.push(`${fp}:${i+1} ${t.substring(0, 100)}`);
        }
      });
    }
  }
}

walk('src');

console.log('=== Import-before-use-client ===');
if (useClientBad.length) useClientBad.forEach(b => console.log(b));
else console.log('ALL GOOD');

console.log('\n=== Lines with -> in JSX-like content ===');
if (arrowBad.length) arrowBad.forEach(b => console.log(b));
else console.log('NONE FOUND');
