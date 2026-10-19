import Storage from 'expo-sqlite/kv-store';
import {readLanguagePackJournal, type PackInstallState} from '@voicefirst/core';
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
