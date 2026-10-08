import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFile(path.join(dir,name),'utf8');

test('Bash installer syntax is valid',()=>{
  const r=spawnSync('bash',['-n',path.join(dir,'install.sh')],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
});

test('public prerelease refuses unsigned installation',async()=>{
  const s=await read('install.sh');
  assert.ok(s.includes('UNCONFIGURED_RELEASE_ED25519_PUBLIC_KEY'));
  assert.ok(s.includes('Public signed releases are not yet available'));
  assert.ok(s.includes('verify(null,signed,key,sig)'));
  assert.ok(s.includes("createHash('sha256')"));
});

test('Windows remains disabled until signed and verified',async()=>{
  const s=await read('install.ps1');
  assert.ok(s.includes('not released yet'));
  assert.ok(s.includes('exit 1'));
});

test('public root contains only curated distribution files',async()=>{
  const allowed=new Set(['README.md','LICENSE','.gitignore','SECURITY.md','RELEASE_CONTRACT.md',
    'install.sh','install.ps1','docs','tests']);
  const files=await fs.readdir(dir);
  for(const file of files){
    if(file==='.git'||file==='.github')continue;
    assert.ok(allowed.has(file),'Unreviewed public path: '+file);
  }
});
