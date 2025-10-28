const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

const patterns = [
  { re: /import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/lib\/supabase['"];?/g, repl: "import { supabase } from '@/lib/backend';" },
  { re: /import\s*\{\s*supabase\s*\}\s*from\s*['"]\.\/supabase['"];?/g, repl: "import { supabase } from '@/lib/backend';" },
  { re: /import\s*\{\s*supabase\s*\}\s*from\s*['"]\.\.\/supabase['"];?/g, repl: "import { supabase } from '@/lib/backend';" },
];

function walk(p) {
  const s = fs.statSync(p);
  if (s.isDirectory()) {
    for (const e of fs.readdirSync(p)) walk(path.join(p, e));
  } else if (exts.has(path.extname(p))) {
    let c = fs.readFileSync(p, 'utf8');
    let u = c;
    for (const { re, repl } of patterns) u = u.replace(re, repl);
    if (u !== c) {
      fs.writeFileSync(p, u, 'utf8');
      console.log('Updated:', path.relative(root, p));
    }
  }
}

walk(root);