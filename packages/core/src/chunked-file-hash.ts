/** Bounded-memory file-hashing protocol, independent of React Native/Node.
 * The caller MUST provide a truly incremental SHA-256 implementation.
 * The file reader and hasher must not retain every chunk in memory.
 * This does not guarantee file immutability or cross-process locking.
 */
export interface ChunkedFileSource {
 readonly size:number;
 read(offset:number,length:number):Promise<Uint8Array>;
 close():Promise<void>|void;
}
export interface IncrementalSha256 {
 update(bytes:Uint8Array):Promise<void>|void;
 digestHex():Promise<string>|string;
}
export type ChunkedHashResult=
 |{status:'ok';sha256:string;bytes:number}
 |{status:'blocked';reason:'open'|'source-size'|'too-large'|'chunk-size'|'read'|'short-read'|'size-changed'|'hash'|'cancelled'|'close'};
const DEFAULT_CHUNK=256*1024;
const MAX_CHUNK=1024*1024;
const DEFAULT_MAX_BYTES=16*1024*1024*1024;

/** The size is captured before reading and checked again after hashing.
 * For integrity, validate this digest against an independently trusted manifest.
 */
export async function hashFileByChunks(
 openFile:()=>Promise<ChunkedFileSource>,
 createHasher:()=>IncrementalSha256,
 options:{chunkBytes?:number;maxBytes?:number;isCancelled?:()=>boolean}={}
):Promise<ChunkedHashResult>{
 const chunkSize=options.chunkBytes??DEFAULT_CHUNK;
 const maxBytes=options.maxBytes??DEFAULT_MAX_BYTES;
 if(!Number.isSafeInteger(chunkSize)||chunkSize<1||chunkSize>MAX_CHUNK)return {status:'blocked',reason:'chunk-size'};
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)return {status:'blocked',reason:'too-large'};
 let source:ChunkedFileSource;
 try{source=await openFile();}catch{return {status:'blocked',reason:'open'};}
 let result:ChunkedHashResult;
 try{
  const size=source.size;
  if(!Number.isSafeInteger(size)||size<=0)result={status:'blocked',reason:'source-size'};
  else if(size>maxBytes)result={status:'blocked',reason:'too-large'};
  else{
   try{
    const hasher=createHasher();
    let offset=0;
    while(offset<size){
     if(options.isCancelled?.())throw new ChunkReadError('cancelled');
     const length=Math.min(chunkSize,size-offset);
     let chunk:Uint8Array;
     try{chunk=await source.read(offset,length);}catch{throw new ChunkReadError('read');}
     if(!(chunk instanceof Uint8Array)||chunk.byteLength!==length)throw new ChunkReadError('short-read');
     await hasher.update(chunk);
     offset+=length;
    }
    if(options.isCancelled?.())throw new ChunkReadError('cancelled');
    if(source.size!==size)throw new ChunkReadError('size-changed');
    const digest=await hasher.digestHex();
    if(typeof digest!=='string'||!/^[a-f0-9]{64}$/i.test(digest))throw new ChunkReadError('hash');
    result={status:'ok',sha256:digest.toLowerCase(),bytes:size};
   }catch(e){
    result={status:'blocked',reason:e instanceof ChunkReadError?e.reason:'hash'};
   }
  }
 }catch{result={status:'blocked',reason:'read'};}
 try{await source.close();}catch{return {status:'blocked',reason:'close'};}
 return result;
}
class ChunkReadError extends Error {
 constructor(readonly reason:'read'|'short-read'|'size-changed'|'hash'|'cancelled'){super(reason);}
}
