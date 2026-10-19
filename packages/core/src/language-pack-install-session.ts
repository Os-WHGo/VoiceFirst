/** Persisted state transitions. Callers must verify actual bytes before providing a digest. */
import {beginLanguagePackInstall,advanceLanguagePackInstall,type PackInstallState} from './language-pack-install-state.js';
import {planLanguagePacks,type LanguagePack} from './language-packs.js';
import {PackOperationGate} from './pack-operation-gate.js';
export interface PackJournalStore {
 load(id:string):Promise<{status:'empty'}|{status:'ok';state:PackInstallState}|{status:'blocked'}>;
 save(state:PackInstallState):Promise<boolean>;
}
const sessionGate=new PackOperationGate();
export type SessionResult={status:'ok';state:PackInstallState}|{status:'blocked';reason:string};
export async function startPackSession(pack:LanguagePack,store:PackJournalStore):Promise<SessionResult>{
 if(!pack||typeof pack.id!=='string')return {status:'blocked',reason:'manifest'};
 const guarded=await sessionGate.run(pack.id,()=>startPackSessionUnlocked(pack,store));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function startPackSessionUnlocked(pack:LanguagePack,store:PackJournalStore):Promise<SessionResult>{
 if(planLanguagePacks([pack],[]).status!=='ready')return {status:'blocked',reason:'manifest'};
 for(const dependency of pack.dependencies){
  const existing=await store.load(dependency);
  if(existing.status!=='ok'||existing.state.id!==dependency||existing.state.phase!=='installed'||existing.state.verifiedSha256!==existing.state.expectedSha256)return {status:'blocked',reason:'dependencies'};
 }
 const begin=beginLanguagePackInstall(pack,pack.dependencies);
 if(begin.status!=='ok')return {status:'blocked',reason:'manifest'};
 const current=await store.load(begin.state.id);
 if(current.status!=='empty')return {status:'blocked',reason:current.status==='ok'?'existing-journal':'unreadable-journal'};
 if(!await store.save(begin.state))return {status:'blocked',reason:'write'};
 return {status:'ok',state:begin.state};
}
export async function transitionPackSession(id:string,event:'verify'|'commit'|'abort',store:PackJournalStore,digest?:string):Promise<SessionResult>{
 const guarded=await sessionGate.run(id,()=>transitionPackSessionUnlocked(id,event,store,digest));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function transitionPackSessionUnlocked(id:string,event:'verify'|'commit'|'abort',store:PackJournalStore,digest?:string):Promise<SessionResult>{
 const current=await store.load(id);
 if(current.status!=='ok')return {status:'blocked',reason:'missing-or-unreadable-journal'};
 const outcome=advanceLanguagePackInstall(current.state,event,digest);
 if(outcome.status!=='ok')return {status:'blocked',reason:outcome.reason};
 if(!await store.save(outcome.state))return {status:'blocked',reason:'write'};
 return {status:'ok',state:outcome.state};
}

/** Verification must be backed by an actual byte reader, never by a manifest digest alone.
 * The native adapter must hash the complete staged file and report missing files as null.
 */
export async function verifyStagedPackSession(id:string,store:PackJournalStore,hashStagedBytes:(id:string)=>Promise<string|null>):Promise<SessionResult>{
 const current=await store.load(id);
 if(current.status!=='ok'||current.state.id!==id||current.state.phase!=='staging')return {status:'blocked',reason:'missing-or-invalid-staging'};
 let digest:string|null;
 try{digest=await hashStagedBytes(id);}catch{return {status:'blocked',reason:'staged-file-read'};}
 if(typeof digest!=='string'||!/^[a-f0-9]{64}$/i.test(digest))return {status:'blocked',reason:'staged-file-read'};
 const guarded=await sessionGate.run(id,()=>transitionPackSessionUnlocked(id,'verify',store,digest));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
