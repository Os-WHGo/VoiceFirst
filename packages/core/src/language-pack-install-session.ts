/** Persisted state transitions. Callers must verify actual bytes before providing a digest. */
import {beginLanguagePackInstall,advanceLanguagePackInstall,nextPackRevision,type PackInstallState} from './language-pack-install-state.js';
import {planLanguagePacks,type LanguagePack} from './language-packs.js';
import {PackOperationGate} from './pack-operation-gate.js';
import {hashFileByChunks,type ChunkedFileSource,type IncrementalSha256} from './chunked-file-hash.js';
export interface PackJournalStore {
 load(id:string):Promise<{status:'empty'}|{status:'ok';state:PackInstallState}|{status:'blocked'}>;
 /** Atomic conditional update. Null denotes a key that must not exist. */
 save(state:PackInstallState,expected:PackInstallState|null):Promise<boolean>;
}
const sessionGate=new PackOperationGate();
export type SessionResult={status:'ok';state:PackInstallState}|{status:'blocked';reason:string};
export async function startPackSession(pack:LanguagePack,store:PackJournalStore):Promise<SessionResult>{
 if(!pack||typeof pack.id!=='string')return {status:'blocked',reason:'manifest'};
 const guarded=await sessionGate.run(pack.id,()=>startPackSessionUnlocked(pack,store,false));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function startPackSessionUnlocked(pack:LanguagePack,store:PackJournalStore,restartFailed:boolean):Promise<SessionResult>{
 if(planLanguagePacks([pack],[]).status!=='ready')return {status:'blocked',reason:'manifest'};
 for(const dependency of pack.dependencies){
  const existing=await store.load(dependency);
  if(existing.status!=='ok'||existing.state.id!==dependency||existing.state.phase!=='installed'||existing.state.verifiedSha256!==existing.state.expectedSha256)return {status:'blocked',reason:'dependencies'};
 }
 const begin=beginLanguagePackInstall(pack,pack.dependencies);
 if(begin.status!=='ok')return {status:'blocked',reason:'manifest'};
 const current=await store.load(begin.state.id);
 if(restartFailed){
  if(current.status!=='ok'||current.state.phase!=='failed'||current.state.id!==begin.state.id)return {status:'blocked',reason:'journal-not-failed'};
  // A retry is only a retry of the SAME artifact. A different version/hash/size
  // needs an explicit upgrade procedure, never a silent replacement of failed state.
  if(current.state.version!==begin.state.version||
     current.state.expectedSha256!==begin.state.expectedSha256||
     current.state.expectedBytes!==begin.state.expectedBytes)
   return {status:'blocked',reason:'retry-manifest-changed'};
 }else if(current.status!=='empty')return {status:'blocked',reason:current.status==='ok'?'existing-journal':'unreadable-journal'};
 const prior=restartFailed&&current.status==='ok'?current.state:null;
 const revision=prior?nextPackRevision(prior):0;
 if(revision===null)return {status:'blocked',reason:'revision-overflow'};
 const state={...begin.state,revision};
 if(!await store.save(state,prior))return {status:'blocked',reason:'write'};
 return {status:'ok',state};
}
export async function transitionPackSession(id:string,event:'verify'|'commit'|'abort',store:PackJournalStore,digest?:string):Promise<SessionResult>{
 const guarded=await sessionGate.run(id,()=>transitionPackSessionUnlocked(id,event,store,digest));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function transitionPackSessionUnlocked(id:string,event:'verify'|'commit'|'abort',store:PackJournalStore,digest?:string):Promise<SessionResult>{
 const current=await store.load(id);
 if(current.status!=='ok'||current.state.id!==id)return {status:'blocked',reason:'missing-or-unreadable-journal'};
 const outcome=advanceLanguagePackInstall(current.state,event,digest);
 if(outcome.status!=='ok')return {status:'blocked',reason:outcome.reason};
 if(!await store.save(outcome.state,current.state))return {status:'blocked',reason:'write'};
 return {status:'ok',state:outcome.state};
}

/** Verification must be backed by an actual byte reader, never by a manifest digest alone.
 * The native adapter must hash the complete staged file and report missing files as null.
 */
export async function verifyStagedPackSession(id:string,store:PackJournalStore,hashStagedBytes:(id:string,expectedBytes?:number)=>Promise<string|null>):Promise<SessionResult>{
 // Hold the same per-pack gate across journal read, hashing and write.
 // Previously a concurrent abort/commit could race with the file hash.
 const guarded=await sessionGate.run(id,async():Promise<SessionResult>=>{
  const current=await store.load(id);
  if(current.status!=='ok'||current.state.id!==id||current.state.phase!=='staging')return {status:'blocked',reason:'missing-or-invalid-staging'};
  let digest:string|null;
  try{digest=await hashStagedBytes(id,current.state.expectedBytes);}catch{return {status:'blocked',reason:'staged-file-read'};}
  if(typeof digest!=='string'||!/^[a-f0-9]{64}$/i.test(digest))return {status:'blocked',reason:'staged-file-read'};
  return transitionPackSessionUnlocked(id,'verify',store,digest);
 });
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}

/** Connects the bounded chunk reader to the persisted byte-backed verification
 * while holding the journal gate throughout hashing. Does not select a crypto
 * provider or a file path: callers must supply trusted native/JS implementations.
 */
export async function verifyChunkedPackSession(
 id:string,
 store:PackJournalStore,
 openFile:()=>Promise<ChunkedFileSource>,
 createHasher:()=>IncrementalSha256,
 options:{chunkBytes?:number;maxBytes?:number;isCancelled?:()=>boolean}={}
):Promise<SessionResult>{
 return verifyStagedPackSession(id,store,async(_id,expectedBytes)=>{
  const result=await hashFileByChunks(openFile,createHasher,options);
  return result.status==='ok'&&result.bytes===expectedBytes?result.sha256:null;
 });
}

export async function retryPackSession(pack:LanguagePack,store:PackJournalStore):Promise<SessionResult>{
 if(!pack||typeof pack.id!=='string')return {status:'blocked',reason:'manifest'};
 const gated=await sessionGate.run(pack.id,()=>startPackSessionUnlocked(pack,store,true));
 return gated.status==='busy'?{status:'blocked',reason:'operation-busy'}:gated.value;
}
