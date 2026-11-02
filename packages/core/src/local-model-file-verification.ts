/** Verify a local file using an injected native SHA-256 implementation. Never trust
 * caller-provided digest metadata as proof of hashing the actual file. */
import {validateLocalModelPackage,type LocalModelPackage} from './local-model-package.js';
import {beginLocalModelInstall,advanceLocalModelInstall,type LocalInstallState} from './local-model-installation.js';
export interface NativeLocalFileVerifier {fileSizeBytes(localUri:string):Promise<number>;sha256File(localUri:string):Promise<string>}
export type FileVerificationResult={status:'verified';state:LocalInstallState}|{status:'rejected';reason:'invalid-manifest'|'invalid-uri'|'size-mismatch'|'checksum-mismatch'|'native-verification-failed'};
export async function verifyLocalModelFile(pkg:LocalModelPackage,localUri:string,native:NativeLocalFileVerifier):Promise<FileVerificationResult>{
 if(validateLocalModelPackage(pkg).status!=='valid')return {status:'rejected',reason:'invalid-manifest'};
 if(typeof localUri!=='string'||!localUri.startsWith('file:///')||localUri.includes('..')||localUri.includes('%')||localUri.includes('?')||localUri.includes('#')||localUri.includes('\\'))return {status:'rejected',reason:'invalid-uri'};
 const begin=beginLocalModelInstall(pkg);
 if(begin.status!=='ok')return {status:'rejected',reason:'invalid-manifest'};
 try{
  const bytes=await native.fileSizeBytes(localUri);
  if(!Number.isSafeInteger(bytes)||bytes!==pkg.bytes)return {status:'rejected',reason:'size-mismatch'};
  const actual=await native.sha256File(localUri);
  const verified=advanceLocalModelInstall(begin.state,'verify',actual);
  if(verified.status!=='ok')return {status:'rejected',reason:'checksum-mismatch'};
  return {status:'verified',state:verified.state};
 }catch{return {status:'rejected',reason:'native-verification-failed'};}
}
