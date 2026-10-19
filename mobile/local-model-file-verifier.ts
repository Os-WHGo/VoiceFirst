/** Expo-backed verification of a user-provided local model file.
 * Bounded to 64 MiB until a streaming native SHA-256 implementation is integrated.
 * This module neither downloads nor installs model files. */
import {File} from 'expo-file-system';
import {sha256Bytes,type NativeLocalFileVerifier} from '@voicefirst/core';
const MAX_IN_MEMORY_BYTES=64*1024*1024;
export const expoLocalModelFileVerifier:NativeLocalFileVerifier={
 async fileSizeBytes(uri:string):Promise<number>{
  if(!uri.startsWith('file:///')||uri.includes('..')||uri.includes('%')||uri.includes('?')||uri.includes('#')||uri.includes('\\'))throw new Error('Only local file URIs are accepted');
  const file=new File(uri);
  if(!file.exists)throw new Error('Model file not found');
  const size=file.size;
  if(!Number.isSafeInteger(size)||size<=0||size>MAX_IN_MEMORY_BYTES)throw new Error('Model requires streaming native verification');
  return size;
 },
 async sha256File(uri:string):Promise<string>{
  const size=await this.fileSizeBytes(uri);
  const bytes=await new File(uri).bytes();
  if(bytes.byteLength!==size)throw new Error('Model changed while reading');
  return sha256Bytes(bytes);
 }
};
