const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('from "next"') && c.includes('NextResponse')) {
        fs.writeFileSync(p, c.replace(/from "next"/g, 'from "next/server"'));
        console.log('Fixed', p);
      }
    }
  });
}
walk('app/api');
