/** Explicit local-file installer for small optional resources (<=8 MiB).
 * No network access, no model downloads, no replacement of installed packs.
 * Caller must have started a journal session with the trusted manifest.
 */
import {Directory,File,Paths} from 'expo-file-system';
import {commitPackSessionIfUnchanged,retryPackSession,sha256Bytes,PackOperationGate,type LanguagePack} from '@voicefirst/core';
import {packJournalStore,verifySmallStagedPack,loadPackJournal} from './language-pack-journal-storage';
import {hashSmallStagedPack} from './staged-small-pack-hash';
import {inspectSmallPackRecovery} from './small-pack-recovery';
const LIMIT=8*1024*1024;
const valid=(id:string)=>/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id);
export type SmallPackInstallResult={status:'installed'}|{status:'blocked';reason:string};
const operationGate=new PackOperationGate();
export async function installSmallPackFromLocalFile(id:string,source:File):Promise<SmallPackInstallResult>{
 const guarded=await operationGate.run(id,()=>installSmallPackUnlocked(id,source));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function installSmallPackUnlocked(id:string,source:File):Promise<SmallPackInstallResult>{
 if(!valid(id))return {status:'blocked',reason:'invalid-id'};
 const journal=await loadPackJournal(id);
 if(journal.status!=='ok'||journal.result.state.phase!=='staging')return {status:'blocked',reason:'journal-not-staging'};
 if(!Number.isSafeInteger(journal.result.state.expectedBytes)||!journal.result.state.expectedBytes||journal.result.state.expectedBytes>LIMIT)return {status:'blocked',reason:'invalid-expected-size'};
 const root=new Directory(Paths.document,'voicefirst-pack-staging');
 const stage=new Directory(root,id);
 const destRoot=new Directory(Paths.document,'voicefirst-installed-packs');
 const dest=new Directory(destRoot,id);
 if(dest.exists||stage.exists)return {status:'blocked',reason:'destination-or-staging-exists'};
 let created=false;
 try{
  if(!source.exists||!Number.isSafeInteger(source.size)||source.size<=0||source.size>LIMIT||source.size!==journal.result.state.expectedBytes)return {status:'blocked',reason:'source-size'};
  if(!root.exists)root.create({intermediates:true,idempotent:true});
  stage.create({intermediates:true});created=true;
  await source.copy(new File(stage,'payload.bin'),{overwrite:false});
  if(new File(stage,'payload.bin').size!==journal.result.state.expectedBytes)return {status:'blocked',reason:'staging-size'};
  const verified=await verifySmallStagedPack(id);
  if(verified.status!=='ok')return {status:'blocked',reason:'checksum-or-journal'};
  const pinnedVerified={...verified.state};
  // Check the staged bytes again immediately before promotion.
  if(await hashSmallStagedPack(id)!==pinnedVerified.expectedSha256)return {status:'blocked',reason:'staging-changed'};
  if(!destRoot.exists)destRoot.create({intermediates:true,idempotent:true});
  if(dest.exists)return {status:'blocked',reason:'destination-exists'};
  await stage.move(dest,{overwrite:false});created=false;
  const promoted=new File(dest,'payload.bin');
  if(!promoted.exists||!Number.isSafeInteger(promoted.size)||promoted.size<=0||promoted.size>LIMIT||promoted.size!==journal.result.state.expectedBytes)return {status:'blocked',reason:'promoted-file-invalid'};
  const promotedBytes=await promoted.bytes();
  if(promotedBytes.byteLength!==promoted.size||sha256Bytes(promotedBytes).toLowerCase()!==pinnedVerified.expectedSha256)return {status:'blocked',reason:'promoted-checksum'};
  // Mark installed only after successful promotion. Interrupted promotions
  // require an explicit recovery procedure, never an automatic overwrite.
  const committed=await commitPackSessionIfUnchanged(id,packJournalStore,pinnedVerified);
  if(committed.status!=='ok')return {status:'blocked',reason:'promotion-needs-recovery'};
  return {status:'installed'};
 }catch{return {status:'blocked',reason:'file-operation'};}
 finally{
  if(created&&stage.exists){
   const latest=await loadPackJournal(id);
   if(latest.status==='ok'&&latest.result.state.phase==='staging'){
    try{stage.delete();}catch{/* leave for inspection */}
   }
   // Preserve verified staging on failure for explicit recovery.
  }
 }
}

/** Recovery only finalizes an already promoted, fully rehashed file. */
export async function finalizeInterruptedSmallPack(id:string):Promise<SmallPackInstallResult>{
 const guarded=await operationGate.run(id,()=>finalizeInterruptedUnlocked(id));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function finalizeInterruptedUnlocked(id:string):Promise<SmallPackInstallResult>{
 const before=await loadPackJournal(id);
 if(before.status!=='ok'||before.result.state.phase!=='verified')return {status:'blocked',reason:'journal-not-verified'};
 const pinned={...before.result.state};
 const inspection=await inspectSmallPackRecovery(id);
 if(inspection.status!=='promotion-interrupted')return {status:'blocked',reason:inspection.status};
 const committed=await commitPackSessionIfUnchanged(id,packJournalStore,pinned);
 return committed.status==='ok'?{status:'installed'}:{status:'blocked',reason:committed.reason};
}

/** Explicit, opt-in recovery of a verified staging directory after an interruption.
 * Never repairs an unverified journal, overwrites a destination or deletes data.
 */
export async function resumeVerifiedSmallPack(id:string):Promise<SmallPackInstallResult>{
 const guarded=await operationGate.run(id,()=>resumeVerifiedUnlocked(id));
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
async function resumeVerifiedUnlocked(id:string):Promise<SmallPackInstallResult>{
 try{
  const journal=await loadPackJournal(id);
  if(journal.status!=='ok'||journal.result.state.phase!=='verified')return {status:'blocked',reason:'journal-not-verified'};
  const pinned={...journal.result.state};
  const inspected=await inspectSmallPackRecovery(id);
  if(inspected.status!=='staging-interrupted')return {status:'blocked',reason:inspected.status};
  const stage=new Directory(Paths.document,'voicefirst-pack-staging',id);
  const destRoot=new Directory(Paths.document,'voicefirst-installed-packs');
  const dest=new Directory(destRoot,id);
  // Hash again immediately before moving; preserve both folders on failure.
  if(!stage.exists||dest.exists||await hashSmallStagedPack(id)!==pinned.expectedSha256)
   return {status:'blocked',reason:'staging-changed-or-destination-exists'};
  if(!destRoot.exists)destRoot.create({intermediates:true,idempotent:true});
  if(dest.exists)return {status:'blocked',reason:'destination-exists'};
  await stage.move(dest,{overwrite:false});
  // A second full hash of the promoted bytes is required before journal commit.
  const promoted=await inspectSmallPackRecovery(id);
  if(promoted.status!=='promotion-interrupted')return {status:'blocked',reason:'promoted-file-invalid'};
  const committed=await commitPackSessionIfUnchanged(id,packJournalStore,pinned);
  return committed.status==='ok'?{status:'installed'}:{status:'blocked',reason:'promotion-needs-recovery'};
 }catch{return {status:'blocked',reason:'file-operation'};}
}

/** Requires no staging or installed folder. Never deletes ambiguous files. */
export async function restartFailedSmallPack(pack:LanguagePack):Promise<{status:'staging'}|{status:'blocked';reason:string}>{
 if(!pack||!valid(pack.id))return {status:'blocked',reason:'invalid-id'};
 const gated=await operationGate.run(pack.id,async()=>{
  try{
   const journal=await loadPackJournal(pack.id);
   if(journal.status!=='ok'||journal.result.state.phase!=='failed')return {status:'blocked' as const,reason:'journal-not-failed'};
   const stage=new Directory(Paths.document,'voicefirst-pack-staging',pack.id);
   const dest=new Directory(Paths.document,'voicefirst-installed-packs',pack.id);
   if(stage.exists||dest.exists)return {status:'blocked' as const,reason:'existing-pack-files'};
   const restarted=await retryPackSession(pack,packJournalStore);
   return restarted.status==='ok'?{status:'staging' as const}:{status:'blocked' as const,reason:restarted.reason};
  }catch{return {status:'blocked' as const,reason:'file-operation'};}
 });
 return gated.status==='busy'?{status:'blocked',reason:'operation-busy'}:gated.value;
}

export async function resumeUnverifiedSmallPack(id:string):Promise<SmallPackInstallResult>{
 const guarded=await operationGate.run(id,async()=>{
  const state=await loadPackJournal(id);
  if(state.status!=='ok'||state.result.state.phase!=='staging')return {status:'blocked' as const,reason:'journal-not-staging'};
  const files=await inspectSmallPackRecovery(id);
  if(files.status!=='staging-interrupted')return {status:'blocked' as const,reason:files.status};
  const verified=await verifySmallStagedPack(id);
  if(verified.status!=='ok')return {status:'blocked' as const,reason:'verification-failed'};
  return resumeVerifiedUnlocked(id);
 });
 return guarded.status==='busy'?{status:'blocked',reason:'operation-busy'}:guarded.value;
}
