/** Verify A1 audio against actual local file bytes using an injected native verifier.
 * Metadata-only checks are not evidence that audio exists on a device.
 */
import {auditA1AudioAssets,type A1AudioAsset} from './a1-audio-readiness.js';
import type {NativeLocalFileVerifier} from './local-model-file-verification.js';
export type A1AudioFileResult={status:'verified';id:string}|{status:'rejected';id:string;reason:'invalid-manifest'|'invalid-uri'|'size-mismatch'|'checksum-mismatch'|'native-verification-failed'};
const fileUri=/^file:\/\/\/[a-zA-Z0-9_./-]+$/;
export async function verifyA1AudioFile(asset:A1AudioAsset,localUri:string,native:NativeLocalFileVerifier):Promise<A1AudioFileResult>{
 const id=typeof asset?.id==='string'?asset.id:'unknown';
 const gate=auditA1AudioAssets([asset]);
 if(gate.verified!==1||gate.errors.length)return {status:'rejected',id,reason:'invalid-manifest'};
 if(typeof localUri!=='string'||!fileUri.test(localUri)||localUri.includes('..')||localUri.includes('\\'))return {status:'rejected',id,reason:'invalid-uri'};
 try{
  const bytes=await native.fileSizeBytes(localUri);
  if(!Number.isSafeInteger(bytes)||bytes!==asset.bytes)return {status:'rejected',id,reason:'size-mismatch'};
  const digest=await native.sha256File(localUri);
  if(typeof digest!=='string'||digest.toLowerCase()!==asset.sha256)return {status:'rejected',id,reason:'checksum-mismatch'};
  return {status:'verified',id};
 }catch{return {status:'rejected',id,reason:'native-verification-failed'};}
}
