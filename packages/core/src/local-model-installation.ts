/** Transactional local model install policy. A native installer must enforce file isolation,
 * streaming SHA-256 verification, atomic promotion and cleanup of partial files. */
import {validateLocalModelPackage,type LocalModelPackage} from './local-model-package.js';
export type LocalInstallPhase='absent'|'staging'|'verified'|'installed'|'failed';
export type LocalInstallEvent='begin'|'verify'|'commit'|'abort';
export interface LocalInstallState {modelId:string;phase:LocalInstallPhase;expectedSha256:string;verifiedSha256?:string}
export type LocalInstallResult={status:'ok';state:LocalInstallState}|{status:'rejected';reason:'invalid-manifest'|'wrong-model'|'invalid-transition'|'checksum-mismatch'};
export function beginLocalModelInstall(pkg:LocalModelPackage):LocalInstallResult {
 if(validateLocalModelPackage(pkg).status!=='valid')return {status:'rejected',reason:'invalid-manifest'};
 return {status:'ok',state:{modelId:pkg.id,phase:'staging',expectedSha256:pkg.sha256.toLowerCase()}};
}
export function advanceLocalModelInstall(state:LocalInstallState,event:Exclude<LocalInstallEvent,'begin'>,actualSha256?:string):LocalInstallResult {
 if(!state||typeof state.modelId!=='string'||!(/^[a-zA-Z0-9._-]{1,100}$/).test(state.modelId)||typeof state.expectedSha256!=='string'||!(/^[a-f0-9]{64}$/).test(state.expectedSha256))return {status:'rejected',reason:'invalid-transition'};
 if(event==='abort'&&state.phase!=='installed')return {status:'ok',state:{...state,phase:'failed',verifiedSha256:undefined}};
 if(event==='verify'&&state.phase==='staging'){
  if(typeof actualSha256!=='string'||!(/^[a-fA-F0-9]{64}$/).test(actualSha256)||actualSha256.toLowerCase()!==state.expectedSha256)return {status:'rejected',reason:'checksum-mismatch'};
  return {status:'ok',state:{...state,phase:'verified',verifiedSha256:actualSha256.toLowerCase()}};
 }
 if(event==='commit'&&state.phase==='verified'&&state.verifiedSha256===state.expectedSha256)return {status:'ok',state:{...state,phase:'installed'}};
 return {status:'rejected',reason:'invalid-transition'};
}
