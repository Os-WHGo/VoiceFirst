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
export async function savePackJournal(state:PackInstallState){
 const current=await loadPackJournal(state.id);
 if(current.status==='blocked')return false;
 if(readLanguagePackJournal(JSON.stringify(state)).status!=='ok')return false;
 try{await Storage.setItem(key(state.id),JSON.stringify(state));return true;}
 catch{return false;}
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
