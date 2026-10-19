import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PackOperationGate} from '../dist/index.js';

function harness(phase='staging',withStage=true){
 const id='en-ca',hash='a'.repeat(64),data=new Uint8Array([1,2,3]);
 let journal={id,version:'1.0.0',phase,expectedSha256:hash,expectedBytes:3,
  ...(phase==='verified'||phase==='installed'?{verifiedSha256:hash}:{})};
 const dirs=new Set(withStage?['voicefirst-pack-staging/en-ca']:[]);
 const pathOf=parts=>parts.map(x=>typeof x==='object'?x.path:x).filter(x=>x!=='doc').join('/');
 class Directory{
  constructor(...parts){this.path=pathOf(parts);}
  get exists(){return dirs.has(this.path);}
  create(){dirs.add(this.path);}
  async move(to,options){
   if(options.overwrite!==false||dirs.has(to.path))throw Error('overwrite');
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
   transitionPackSession:async(_id,event)=>{
    if(event!=='commit'||journal.phase!=='verified')return {status:'blocked',reason:'phase'};
    journal={...journal,phase:'installed'};return {status:'ok',state:journal};
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
   if(dirs.has('voicefirst-pack-staging/en-ca'))return {status:'staging-interrupted'};
   if(dirs.has('voicefirst-installed-packs/en-ca')&&journal.phase==='verified')return {status:'promotion-interrupted'};
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
