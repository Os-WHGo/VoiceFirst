import Storage from 'expo-sqlite/kv-store';
import {File,Paths} from 'expo-file-system';
import {readLanguagePackJournal,verifyStagedPackSession,type PackInstallState} from '@voicefirst/core';
import {hashSmallStagedPack} from './staged-small-pack-hash';
const key=(id:string)=>'voicefirst.pack-journal.v1.'+id;
export async function loadPackJournal(id:string){
 if(!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id))return {status:'blocked'} as const;
 try{
  const raw=await Storage.getItem(key(id));
  if(raw===null)return {status:'empty'} as const;
  const result=readLanguagePackJournal(raw);
  if(result.status!=='ok'||result.state.id!==id)return {status:'blocked'} as const;
  return {status:'ok',result} as const;
 }catch{return {status:'blocked'} as const;}
}
/** Optimistic CAS using expo-sqlite SDK57's functional setItem updater.
 * SDK57 runs that synchronous updater in withExclusiveTransactionAsync.
 * Throwing from the callback aborts the transaction instead of overwriting
 * a concurrently committed journal. Existing KV keys and schemas stay intact.
 */
export async function savePackJournal(state:PackInstallState,expected:PackInstallState|null):Promise<boolean>{
 try{
  const raw=JSON.stringify(state);
  if(!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(state.id)||readLanguagePackJournal(raw).status!=='ok')return false;
  if(expected===null){
   if(state.revision!==0)return false;
  }else{
   const prior=readLanguagePackJournal(JSON.stringify(expected));
   const priorRevision=expected.revision??0;
   if(prior.status!=='ok'||prior.state.id!==state.id||
      !Number.isSafeInteger(priorRevision)||priorRevision<0||
      priorRevision>=Number.MAX_SAFE_INTEGER||state.revision!==priorRevision+1)return false;
  }
  await Storage.setItem(key(state.id),(previous:string|null):string=>{
   if(expected===null){
    if(previous!==null)throw new Error('PACK_JOURNAL_CONFLICT');
   }else{
    if(previous===null)throw new Error('PACK_JOURNAL_CONFLICT');
    const read=readLanguagePackJournal(previous);
    if(read.status!=='ok'||read.state.id!==state.id||
       read.state.version!==expected.version||
       read.state.phase!==expected.phase||
       read.state.expectedSha256!==expected.expectedSha256||
       read.state.expectedBytes!==expected.expectedBytes||
       read.state.verifiedSha256!==expected.verifiedSha256||
       (read.state.revision??0)!==(expected.revision??0))
      throw new Error('PACK_JOURNAL_CONFLICT');
   }
   return raw;
  });
  return true;
 }catch{return false;}
}

/** Adapter for the shared session coordinator. */
export const packJournalStore={
 async load(id:string){
  const entry=await loadPackJournal(id);
  if(entry.status==='ok')return {status:'ok' as const,state:entry.result.state};
  return {status:entry.status};
 },
 save:savePackJournal,
};

/** Explicit small-pack verification. Caller must first stage payload.bin on disk. */
export async function verifySmallStagedPack(id:string){
 return verifyStagedPackSession(id,packJournalStore,async(packId,expectedBytes)=>{
  const file=new File(Paths.document,'voicefirst-pack-staging',packId,'payload.bin');
  if(!Number.isSafeInteger(expectedBytes)||!expectedBytes||!file.exists||file.size!==expectedBytes)return null;
  return hashSmallStagedPack(packId);
 });
}
