/** Expo file-reader adapter for the pure chunked hashing protocol.
 * The caller supplies a separately vetted incremental SHA-256 implementation.
 * This adapter alone does NOT verify a large model or make a file immutable.
 */
import {File,FileMode} from 'expo-file-system';
import type {ChunkedFileSource} from '@voicefirst/core';
export async function openExpoChunkedFileSource(file:File):Promise<ChunkedFileSource>{
 if(!file.exists||!Number.isSafeInteger(file.size)||file.size<=0)throw Error('invalid-file');
 const handle=file.open(FileMode.ReadOnly);
 return {
  get size(){return handle.size??-1;},
  async read(offset:number,length:number){
   if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(length)||length<=0||length>1024*1024)throw Error('invalid-read');
   handle.offset=offset;
   return await handle.readBytes(length);
  },
  close(){handle.close();}
 };
}
