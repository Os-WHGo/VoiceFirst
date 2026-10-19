/** Read-only crash recovery inspection. Never trust journal alone or delete data. */
import {Directory,File,Paths} from 'expo-file-system';
import {sha256Bytes,decideSmallPackRecovery} from '@voicefirst/core';
import {loadPackJournal} from './language-pack-journal-storage';
const LIMIT=8*1024*1024;
const valid=(id:string)=>/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id);
export type SmallPackRecovery=
 |{status:'installed-verified'}
 |{status:'promotion-interrupted'}
 |{status:'staging-interrupted'}
 |{status:'missing-files'}
 |{status:'blocked';reason:string};
async function matches(file:File,hash:string){
 if(!file.exists||!Number.isSafeInteger(file.size)||file.size<=0||file.size>LIMIT)return false;
 const bytes=await file.bytes();
 return bytes.byteLength===file.size&&sha256Bytes(bytes).toLowerCase()===hash;
}
export async function inspectSmallPackRecovery(id:string):Promise<SmallPackRecovery>{
 if(!valid(id))return {status:'blocked',reason:'invalid-id'};
 const journal=await loadPackJournal(id);
 if(journal.status!=='ok')return {status:'blocked',reason:'missing-or-corrupt-journal'};
 const {state}=journal.result;
 const stage=new Directory(Paths.document,'voicefirst-pack-staging',id);
 const dest=new Directory(Paths.document,'voicefirst-installed-packs',id);
 try{
  // Ambiguous double presence must never be automatically resolved.
  if(stage.exists&&dest.exists)return {status:'blocked',reason:'ambiguous-folders'};
  if(dest.exists){
   const ok=await matches(new File(dest,'payload.bin'),state.expectedSha256);
   if(!ok)return {status:'blocked',reason:'installed-file-invalid'};
   const decision=decideSmallPackRecovery(state,'destination-valid');
   return decision==='blocked'?{status:'blocked',reason:'unexpected-destination'}:{status:decision};
  }
  if(stage.exists){
   const ok=await matches(new File(stage,'payload.bin'),state.expectedSha256);
   if(!ok)return {status:'blocked',reason:'staged-file-invalid'};
   const decision=decideSmallPackRecovery(state,'staging-valid');
   return decision==='blocked'?{status:'blocked',reason:'unexpected-staging'}:{status:decision};
  }
  return {status:'missing-files'};
 }catch{return {status:'blocked',reason:'file-read'};}
}
