import fs from 'node:fs';
import path from 'node:path';
const root = 'packages/blockly/src';
const files = [];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(/\.(ts|tsx)$/.test(e.name)) files.push(p);}})(root);
const exts=['.ts','.tsx','.d.ts','/index.ts','/index.tsx'];
function resolves(base,spec){
  const p=path.resolve(path.dirname(base),spec);
  for(const e of exts){ if(fs.existsSync(p+e)) return p+e; }
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory()){for(const e of exts) if(fs.existsSync(p+e)) return p+e;}
  return null;
}
const unresolved=new Map();
for(const f of files){
  const src=fs.readFileSync(f,'utf8');
  const re=/from\s+['"]([^'"]+)['"]/g; let m;
  while((m=re.exec(src))){
    const spec=m[1];
    if(!spec.startsWith('.')) continue;
    if(!resolves(f,spec)){ if(!unresolved.has(spec)) unresolved.set(spec,[]); unresolved.get(spec).push(f); }
  }
}
console.log('Blockly: unresolved relative imports');
for(const [spec,fs2] of unresolved) console.log('  '+spec+'  ('+fs2.length+' files) e.g. '+fs2.slice(0,3).join(', '));

// Also list all relative specs that DO resolve but point outside package root
console.log('\nBlockly: relative imports target existence check (packages)');
const suspects=['../../../types/vm/vm','../../../vm','../plugins/fieldDropdown'];
for(const s of suspects){ console.log(s, '=>', path.resolve(root,'blocks',s)); }
