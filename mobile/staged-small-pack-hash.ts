/** Bounded file-backed SHA-256 adapter for small staged resources only.
 * Never use for large GGUF/ASR models: those require streaming native hashing.
 */
import {File,Paths} from 'expo-file-system';
import {sha256Bytes} from '@voicefirst/core';
const MAX_BYTES=8*1024*1024;
const validId=(id:string)=>/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id);
export async function hashSmallStagedPack(id:string):Promise<string|null>{
 if(!validId(id))return null;
 try{
  const file=new File(Paths.document,'voicefirst-pack-staging',id,'payload.bin');
  if(!file.exists||!Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_BYTES)return null;
  const bytes=await file.bytes();
  if(bytes.byteLength!==file.size||bytes.byteLength>MAX_BYTES)return null;
  return sha256Bytes(bytes).toLowerCase();
 }catch{return null;}
}
