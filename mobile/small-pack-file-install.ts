/** Explicit local-file installer for small optional resources (<=8 MiB).
 * No network access, no model downloads, no replacement of installed packs.
 * Caller must have started a journal session with the trusted manifest.
 */
import {Directory,File,Paths} from 'expo-file-system';
import {transitionPackSession,sha256Bytes,PackOperationGate} from '@voicefirst/core';
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
 const root=new Directory(Paths.document,'voicefirst-pack-staging');
 const stage=new Directory(root,id);
 const destRoot=new Directory(Paths.document,'voicefirst-installed-packs');
 const dest=new Directory(destRoot,id);
 if(dest.exists||stage.exists)return {status:'blocked',reason:'destination-or-staging-exists'};
 let created=false;
 try{
  if(!source.exists||!Number.isSafeInteger(source.size)||source.size<=0||source.size>LIMIT)return {status:'blocked',reason:'source-size'};
  if(!root.exists)root.create({intermediates:true,idempotent:true});
  stage.create({intermediates:true});created=true;
  await source.copy(new File(stage,'payload.bin'),{overwrite:false});
  const verified=await verifySmallStagedPack(id);
  if(verified.status!=='ok')return {status:'blocked',reason:'checksum-or-journal'};
  // Check the staged bytes again immediately before promotion.
  if(await hashSmallStagedPack(id)!==verified.state.expectedSha256)return {status:'blocked',reason:'staging-changed'};
  if(!destRoot.exists)destRoot.create({intermediates:true,idempotent:true});
  if(dest.exists)return {status:'blocked',reason:'destination-exists'};
  await stage.move(dest,{overwrite:false});created=false;
  const promoted=new File(dest,'payload.bin');
  if(!promoted.exists||promoted.size!==source.size||promoted.size>LIMIT)return {status:'blocked',reason:'promoted-file-invalid'};
  const promotedBytes=await promoted.bytes();
  if(promotedBytes.byteLength!==promoted.size||sha256Bytes(promotedBytes).toLowerCase()!==verified.state.expectedSha256)return {status:'blocked',reason:'promoted-checksum'};
  // Mark installed only after successful promotion. Interrupted promotions
  // require an explicit recovery procedure, never an automatic overwrite.
  const committed=await transitionPackSession(id,'commit',packJournalStore);
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
 const inspection=await inspectSmallPackRecovery(id);
 if(inspection.status!=='promotion-interrupted')return {status:'blocked',reason:inspection.status};
 const committed=await transitionPackSession(id,'commit',packJournalStore);
 return committed.status==='ok'?{status:'installed'}:{status:'blocked',reason:'journal-write'};
}
