import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PackOperationGate} from '../dist/index.js';

function harness(phase='staging',withStage=true,faults={}){
 let moveAttempts=0,commitAttempts=0;
 const id='en-ca',hash='a'.repeat(64),data=new Uint8Array([1,2,3]);
 let journal={id,version:'1.0.0',phase,expectedSha256:hash,expectedBytes:3,
  ...(phase==='verified'||phase==='installed'?{verifiedSha256:hash}:{})};
 const dirs=new Set(withStage?['voicefirst-pack-staging/en-ca']:[]);
 if(faults.bothFolders)dirs.add('voicefirst-installed-packs/en-ca');
 const pathOf=parts=>parts.map(x=>typeof x==='object'?x.path:x).filter(x=>x!=='doc').join('/');
 class Directory{
  constructor(...parts){this.path=pathOf(parts);}
  get exists(){return dirs.has(this.path);}
  create(){dirs.add(this.path);}
  async move(to,options){
   if(options.overwrite!==false||dirs.has(to.path))throw Error('overwrite');
   if(faults.failFirstMove&&moveAttempts++===0)throw Error('interrupted-move');
   dirs.delete(this.path);dirs.add(to.path);
  }
 }
 class File{
  constructor(...parts){this.path=pathOf(parts);}
  get exists(){return dirs.has(this.path.split('/').slice(0,-1).join('/'));}
  get size(){return this.exists?data.length:0;}
  async bytes(){return data;}
 }
 const modules={
  'expo-file-system':{Directory,File,Paths:{document:'doc'}},
  '@voicefirst/core':{
   PackOperationGate,sha256Bytes:()=>hash,
   commitPackSessionIfUnchanged:async(_id,_store,expected)=>{
    if(journal.phase!=='verified'||journal.id!==expected.id||journal.version!==expected.version||
       journal.expectedSha256!==expected.expectedSha256||journal.expectedBytes!==expected.expectedBytes||
       journal.verifiedSha256!==expected.verifiedSha256||journal.revision!==expected.revision)
      return {status:'blocked',reason:'journal-changed'};
    if(faults.failFirstCommit&&commitAttempts++===0)return {status:'blocked',reason:'injected-commit-failure'};
    journal={...journal,phase:'installed',revision:(journal.revision??0)+1};
    return {status:'ok',state:journal};
   },
   retryPackSession:async()=>{
    if(journal.phase!=='failed')return {status:'blocked',reason:'phase'};
    journal={...journal,phase:'staging',verifiedSha256:undefined};
    return {status:'ok',state:journal};
   }
  },
  './language-pack-journal-storage':{
   packJournalStore:{},
   loadPackJournal:async()=>({status:'ok',result:{state:journal}}),
   verifySmallStagedPack:async()=>{
    if(journal.phase!=='staging')return {status:'blocked'};
    journal={...journal,phase:'verified',verifiedSha256:hash};
    return {status:'ok',state:journal};
   }
  },
  './staged-small-pack-hash':{hashSmallStagedPack:async()=>hash},
  './small-pack-recovery':{inspectSmallPackRecovery:async()=>{
   if(dirs.has('voicefirst-pack-staging/en-ca')&&dirs.has('voicefirst-installed-packs/en-ca'))return {status:'blocked',reason:'ambiguous-folders'};
   if(dirs.has('voicefirst-pack-staging/en-ca'))return {status:'staging-interrupted'};
   if(dirs.has('voicefirst-installed-packs/en-ca')&&journal.phase==='verified'){
    if(faults.changeJournalAtDestinationInspection)
      journal={...journal,revision:(journal.revision??0)+1,version:'2.0.0'};
    return {status:'promotion-interrupted'};
   }
   return {status:'blocked',reason:'missing'};
  }}
 };
 const source=readFileSync(new URL('../../../mobile/small-pack-file-install.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',compiled)(name=>modules[name],module,module.exports);
 return {api:module.exports,dirs,state:()=>journal};
}

test('interrupted copied staging can be verified and promoted without overwrite',async()=>{
 const h=harness();
 assert.deepEqual(await h.api.resumeUnverifiedSmallPack('en-ca'),{status:'installed'});
 assert.equal(h.state().phase,'installed');
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),false);
 assert.equal((await h.api.resumeUnverifiedSmallPack('en-ca')).status,'blocked');
});
test('explicit restart refuses failed sessions while residual files remain',async()=>{
 const h=harness('failed');
 const result=await h.api.restartFailedSmallPack({id:'en-ca'});
 assert.equal(result.status,'blocked');
 assert.equal(h.state().phase,'failed');
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),true);
});
test('failed journal without files permits explicit staging restart',async()=>{
 const h=harness('failed',false);
 assert.equal((await h.api.restartFailedSmallPack({id:'en-ca'})).status,'staging');
 assert.equal(h.state().phase,'staging');
});

// Fault-injection tests exercise the real mobile control flow with doubles for
// Expo FileSystem and SQLite. They are not hardware filesystem guarantees.
test('a failed move preserves verified staged bytes and permits explicit retry',async()=>{
 const h=harness('verified',true,{failFirstMove:true});
 assert.deepEqual(await h.api.resumeVerifiedSmallPack('en-ca'),{status:'blocked',reason:'file-operation'});
 assert.equal(h.state().phase,'verified');
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),true);
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),false);
 assert.deepEqual(await h.api.resumeVerifiedSmallPack('en-ca'),{status:'installed'});
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),false);
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
});
test('commit failure after promotion is explicitly recoverable without replacing files',async()=>{
 const h=harness('verified',true,{failFirstCommit:true});
 assert.deepEqual(await h.api.resumeVerifiedSmallPack('en-ca'),{status:'blocked',reason:'promotion-needs-recovery'});
 assert.equal(h.state().phase,'verified');
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),false);
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
 assert.deepEqual(await h.api.finalizeInterruptedSmallPack('en-ca'),{status:'installed'});
 assert.equal(h.state().phase,'installed');
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
 assert.equal((await h.api.finalizeInterruptedSmallPack('en-ca')).status,'blocked');
});
test('ambiguous staging and destination are not resolved destructively',async()=>{
 const h=harness('verified',true,{bothFolders:true});
 const result=await h.api.resumeVerifiedSmallPack('en-ca');
 assert.equal(result.status,'blocked');
 assert.equal(h.state().phase,'verified');
 assert.equal(h.dirs.has('voicefirst-pack-staging/en-ca'),true);
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
});
test('missing staging cannot be promoted and journal remains unchanged',async()=>{
 const h=harness('verified',false);
 const result=await h.api.resumeVerifiedSmallPack('en-ca');
 assert.equal(result.status,'blocked');
 assert.equal(h.state().phase,'verified');
 assert.equal(h.dirs.size,0);
});
test('installed journal is not reopened for accidental repeated promotion',async()=>{
 const h=harness('installed',false);
 assert.equal((await h.api.resumeVerifiedSmallPack('en-ca')).status,'blocked');
 assert.equal((await h.api.restartFailedSmallPack({id:'en-ca'})).status,'blocked');
 assert.equal(h.state().phase,'installed');
});

test('recovery cannot finalize an old inspected journal after version changes',async()=>{
 const h=harness('verified',false,{bothFolders:true,changeJournalAtDestinationInspection:true});
 h.dirs.delete('voicefirst-pack-staging/en-ca');
 assert.deepEqual(await h.api.finalizeInterruptedSmallPack('en-ca'),{status:'blocked',reason:'journal-changed'});
 assert.equal(h.state().phase,'verified');
 assert.equal(h.state().version,'2.0.0');
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
});
test('resumed staging cannot commit a journal mutated during final promotion inspection',async()=>{
 const h=harness('verified',true,{changeJournalAtDestinationInspection:true});
 assert.deepEqual(await h.api.resumeVerifiedSmallPack('en-ca'),{status:'blocked',reason:'promotion-needs-recovery'});
 assert.equal(h.state().phase,'verified');
 assert.equal(h.state().version,'2.0.0');
 assert.equal(h.dirs.has('voicefirst-installed-packs/en-ca'),true);
});
