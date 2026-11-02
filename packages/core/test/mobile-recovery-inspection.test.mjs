import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {sha256Bytes,decideSmallPackRecovery} from '../dist/index.js';

const id='en-ca-core';
const payload=new Uint8Array([12,4,8,16,23,42]);
const checksum=createHash('sha256').update(payload).digest('hex');
function harness(phase='verified',where='stage',overrides={}){
 const bytes=overrides.bytes ?? payload;
 const savedHash=overrides.hash ?? checksum;
 const journal={id,version:'1.0.0',expectedSha256:savedHash,expectedBytes:overrides.expectedBytes??payload.length,
   phase,...((phase==='verified'||phase==='installed')?{verifiedSha256:savedHash}:{})};
 const stagePath='voicefirst-pack-staging/'+id;
 const destPath='voicefirst-installed-packs/'+id;
 const dirs=new Set(where==='both'?[stagePath,destPath]:where==='stage'?[stagePath]:where==='dest'?[destPath]:[]);
 const files=new Map();
 for(const d of dirs)files.set(d+'/payload.bin',bytes);
 const pathOf=parts=>parts.map(p=>typeof p==='object'?p.path:p).filter(p=>p!=='doc').join('/');
 let byteReads=0;
 class Directory{
  constructor(...parts){this.path=pathOf(parts);}
  get exists(){return dirs.has(this.path);}
 }
 class File{
  constructor(...parts){this.path=pathOf(parts);}
  get exists(){return files.has(this.path);}
  get size(){return this.exists?files.get(this.path).byteLength:0;}
  async bytes(){
   byteReads++;
   if(overrides.readFails)throw Error('simulated read fault');
   return new Uint8Array(files.get(this.path));
  }
 }
 const modules={
  'expo-file-system':{Directory,File,Paths:{document:'doc'}},
  '@voicefirst/core':{sha256Bytes,decideSmallPackRecovery},
  './language-pack-journal-storage':{loadPackJournal:async()=>overrides.corruptJournal
    ?{status:'blocked'}
    :{status:'ok',result:{state:journal}}}
 };
 const path=new URL('../../../mobile/small-pack-recovery.ts',import.meta.url);
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>modules[name],module,module.exports);
 return {api:module.exports,dirs,files,readCount:()=>byteReads};
}

test('recovery inspector hashes genuine bytes of an interrupted promotion',async()=>{
 const pending=harness('verified','dest');
 assert.deepEqual(await pending.api.inspectSmallPackRecovery(id),{status:'promotion-interrupted'});
 assert.equal(pending.readCount(),1);
 const installed=harness('installed','dest');
 assert.deepEqual(await installed.api.inspectSmallPackRecovery(id),{status:'installed-verified'});
 assert.equal(installed.readCount(),1);
});

test('staging is visible for verified and unverified journals, never an installed destination',async()=>{
 for(const phase of ['verified','staging']){
  const h=harness(phase,'stage');
  assert.deepEqual(await h.api.inspectSmallPackRecovery(id),{status:'staging-interrupted'});
 }
 const wrong=harness('staging','dest');
 assert.deepEqual(await wrong.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'unexpected-destination'});
});

test('same-size corruption fails full SHA-256 and never authorizes promotion',async()=>{
 const tampered=new Uint8Array(payload);tampered[2]^=0x01;
 const h=harness('verified','dest',{bytes:tampered});
 assert.deepEqual(await h.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'installed-file-invalid'});
 assert.equal(h.readCount(),1);
});

test('oversized, truncated and missing files fail closed before promotion',async()=>{
 const over=harness('verified','dest',{bytes:new Uint8Array(8*1024*1024+1)});
 assert.deepEqual(await over.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'installed-file-invalid'});
 assert.equal(over.readCount(),0);
 const short=harness('verified','stage',{bytes:new Uint8Array([12,4])});
 assert.deepEqual(await short.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'staged-file-invalid'});
 assert.equal(short.readCount(),0);
 const absent=harness('verified','none');
 assert.deepEqual(await absent.api.inspectSmallPackRecovery(id),{status:'missing-files'});
});

test('ambiguous directories do not read or alter either file',async()=>{
 const h=harness('verified','both');
 assert.deepEqual(await h.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'ambiguous-folders'});
 assert.equal(h.readCount(),0);
 assert.equal(h.dirs.size,2);
 assert.equal(h.files.size,2);
});

test('I/O failures, corrupt journal and invalid ID never install content',async()=>{
 const readFault=harness('verified','dest',{readFails:true});
 assert.deepEqual(await readFault.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'file-read'});
 const invalidJournal=harness('verified','dest',{corruptJournal:true});
 assert.deepEqual(await invalidJournal.api.inspectSmallPackRecovery(id),{status:'blocked',reason:'missing-or-corrupt-journal'});
 assert.deepEqual(await readFault.api.inspectSmallPackRecovery('../escape'),{status:'blocked',reason:'invalid-id'});
});
