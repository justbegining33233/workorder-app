const fs = require('fs'), path = require('path');
const issues = [];

function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory() && !f.startsWith('.') && f !== 'node_modules') walk(fp);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const lines = fs.readFileSync(fp, 'utf8').split('\n');
      lines.forEach((l, i) => {
        const t = l.trim();
        if (t.startsWith('//') || t.startsWith('*')) return;
        // Icon inside string-typed HTML attributes
        if (/(title|placeholder|aria-label|alt)=\{.*<Fa[A-Z]/.test(l))
          issues.push('ATTR: ' + fp + ':' + (i+1) + '\n  ' + t.substring(0, 120));
        // Icon in string that's probably displayed as [object Object]
        // Look for lines where a Fa icon is assigned to something expecting string
        // like: value={<FaIcon/>} or defaultValue={<FaIcon/>}
        if (/(value|defaultValue|name|id)=\{<Fa[A-Z]/.test(l))
          issues.push('VALUE: ' + fp + ':' + (i+1) + '\n  ' + t.substring(0, 120));
        // String template with icon (will render as [object Object])
        if (/`[^`]*\$\{.*<Fa[A-Z]/.test(l) || /<Fa[A-Z][^`]*`/.test(l))
          issues.push('TMPL: ' + fp + ':' + (i+1) + '\n  ' + t.substring(0, 120));
        // Icon tag inside another component's string prop (like icon="<FaIcon>")
        if (/'[^']*<Fa[A-Z]|"[^"]*<Fa[A-Z]/.test(l))
          issues.push('STRPROP: ' + fp + ':' + (i+1) + '\n  ' + t.substring(0, 120));
      });
    }
  }
}

walk('src');
if (issues.length) {
  issues.forEach(x => console.log(x));
  console.log('\nTotal issues: ' + issues.length);
} else {
  console.log('No issues found');
}
