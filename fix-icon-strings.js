/**
 * Fix all string-literal JSX icon patterns across the codebase.
 *
 * TRUE BUG patterns (strings that START with <Fa - the value begins with JSX tag):
 *   '<FaXxx style={{marginRight:N}} />'        => <FaXxx style={{marginRight:N}} />
 *   '<FaXxx style={{marginRight:N}} /> Text'   => <><FaXxx style={{marginRight:N}} /> Text</>
 *   '<FaXxx />'                                => <FaXxx />
 *   '<FaXxx style={{marginRight:N}} />'.repeat(n) => Array.from({length:n},(_,i)=><FaXxx key={i}/>)
 *
 * FALSE POSITIVE patterns (these are NOT bugs - correct JSX with style props):
 *   color:'#fbbf24'}}<FaStar  -- the ' is closing a style string value, not an icon string
 *   These are excluded because the ' is NOT immediately followed by <Fa
 */
const fs = require('fs');
const path = require('path');

const fixedFiles = [];

function fixContent(content) {
  let changed = false;
  let result = content;

  // KEY INSIGHT: Only match strings that START with <Fa immediately after the quote.
  // I.e., the regex must be:   '  <Fa    (single-quote immediately before <Fa)
  //                          or "  <Fa    (double-quote immediately before <Fa)
  // This avoids false positives like: color:'#fff'  or  href="/path" before a <Fa element.

  //--------------------------------------------------------------------------
  // PASS 1: .repeat() patterns — must come BEFORE other passes or they'll be
  //         partially fixed and break syntax.
  // '<FaXxx style={{marginRight:N}} />'.repeat(rating)
  // => Array.from({length: rating}, (_, i) => <FaXxx key={i} />)
  //--------------------------------------------------------------------------
  result = result.replace(
    /'(<Fa([A-Za-z]+)(?:\s+style=\{\{[^}]*\}\})?\s*\/>)'\.repeat\(([^)]+)\)/g,
    (match, fullJsx, iconName, countExpr) => {
      changed = true;
      return `Array.from({length: ${countExpr}}, (_, i) => <Fa${iconName} key={i} />)`;
    }
  );

  // double-quote variant
  result = result.replace(
    /"(<Fa([A-Za-z]+)(?:\s+style=\{\{[^}]*\}\})?\s*\/>)"\.repeat\(([^)]+)\)/g,
    (match, fullJsx, iconName, countExpr) => {
      changed = true;
      return `Array.from({length: ${countExpr}}, (_, i) => <Fa${iconName} key={i} />)`;
    }
  );

  //--------------------------------------------------------------------------
  // PASS 2: Icon-with-text strings: '<FaXxx .../> Some Text'
  // The content after /> must have at least one non-quote non-newline char.
  // '<FaXxx style={{marginRight:4}} /> Some Text'  => <><FaXxx style={{marginRight:4}} /> Some Text</>
  //--------------------------------------------------------------------------
  result = result.replace(
    /'(<Fa[A-Za-z]+(?:\s+style=\{\{[^}]*\}\})?\s*\/>[ \t][^'\n]+)'/g,
    (match, inner) => {
      changed = true;
      return `<>${inner}</>`;
    }
  );

  result = result.replace(
    /"(<Fa[A-Za-z]+(?:\s+style=\{\{[^}]*\}\})?\s*\/>[ \t][^"\n]+)"/g,
    (match, inner) => {
      changed = true;
      return `<>${inner}</>`;
    }
  );

  //--------------------------------------------------------------------------
  // PASS 3: Pure icon strings (no trailing text): '<FaXxx style={{...}} />'
  // '<FaXxx style={{marginRight:4}} />'  => <FaXxx style={{marginRight:4}} />
  // '<FaXxx />'                          => <FaXxx />
  //--------------------------------------------------------------------------
  result = result.replace(
    /'(<Fa[A-Za-z]+(?:\s+style=\{\{[^}]*\}\})?\s*\/>)'/g,
    (match, jsx) => {
      changed = true;
      return jsx;
    }
  );

  result = result.replace(
    /"(<Fa[A-Za-z]+(?:\s+style=\{\{[^}]*\}\})?\s*\/>)"/g,
    (match, jsx) => {
      changed = true;
      return jsx;
    }
  );

  return { result, changed };
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && !entry.startsWith('.')) walk(fullPath);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const { result, changed } = fixContent(original);
      if (changed) {
        fs.writeFileSync(fullPath, result, 'utf8');
        fixedFiles.push(fullPath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/'));
        console.log('Fixed: ' + fixedFiles[fixedFiles.length - 1]);
      }
    }
  }
}

walk('src');
console.log('\nTotal files fixed: ' + fixedFiles.length);
console.log('Done!');
