import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {readLanguagePackJournal} from '../dist/index.js';

const valid={id:'en-ca',version:'1.0.0',phase:'staging',expectedSha256:'a'.repeat(64),expectedBytes:3};
function harness(initial=null){
 let raw=initial===null?null:JSON.stringify(initial);
 const storage={
  async getItem(){return raw;},
  async setItem(_key,updater){
   assert.equal(typeof updater,'function','must use atomic updater');
   // Models native transaction: callback throw means rollback, no update.
   const next=updater(raw);raw=next;
  }
 };
 const modules={
  'expo-sqlite/kv-store':{default:storage},
  'expo-file-system':{File:class{},Paths:{}},
  '@voicefirst/core':{readLanguagePackJournal,verifyStagedPackSession:async()=>({status:'blocked'})},
  './staged-small-pack-hash':{hashSmallStagedPack:async()=>null}
 };
 const source=readFileSync(new URL('../../../mobile/language-pack-journal-storage.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',compiled)(name=>modules[name],module,module.exports);
 return {api:module.exports,read:()=>raw===null?null:JSON.parse(raw),setRaw:(next)=>{raw=next;}};
}
test('fresh journal is inserted once, incompatible second start cannot overwrite',async()=>{
 const h=harness();
 assert.equal(await h.api.savePackJournal(valid,null),true);
 assert.equal(await h.api.savePackJournal({...valid,version:'2.0.0'},null),false);
 assert.deepEqual(h.read(),valid);
});
test('stale abort cannot revert a committed verified package',async()=>{
 const verified={...valid,phase:'verified',verifiedSha256:valid.expectedSha256};
 const installed={...verified,phase:'installed'};
 const failed={...valid,phase:'failed'};
 const h=harness(verified);
 assert.equal(await h.api.savePackJournal(installed,verified),true);
 assert.equal(await h.api.savePackJournal(failed,verified),false);
 assert.deepEqual(h.read(),installed);
});
test('failed session restart requires the exact stored snapshot',async()=>{
 const failed={...valid,phase:'failed'};
 const h=harness(failed);
 assert.equal(await h.api.savePackJournal(valid,failed),true);
 assert.equal(await h.api.savePackJournal(valid,failed),false);
 assert.deepEqual(h.read(),valid);
});
test('invalid persisted journal is preserved and never repaired by blind write',async()=>{
 const h=harness();
 h.setRaw('{"id":"../outside"}');
 assert.equal((await h.api.loadPackJournal(valid.id)).status,'blocked');
 assert.equal(await h.api.savePackJournal(valid,null),false);
 assert.equal(h.read().id,'../outside');
});
test('manifest identity changes and malformed snapshot fail closed',async()=>{
 const h=harness(valid);
 assert.equal(await h.api.savePackJournal({...valid,phase:'failed'}, {...valid,id:'fr-ca'}),false);
 assert.equal(await h.api.savePackJournal({...valid,phase:'failed'}, {...valid,expectedSha256:'invalid'}),false);
 assert.deepEqual(h.read(),valid);
});
