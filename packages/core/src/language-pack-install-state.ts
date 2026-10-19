/** Pure transactional policy for optional language packs. Native storage/download is not implemented here. */
import {planLanguagePacks,type LanguagePack} from './language-packs.js';
export type PackInstallPhase='absent'|'staging'|'verified'|'installed'|'failed';
export interface PackInstallState {id:string;version:string;phase:PackInstallPhase;expectedSha256:string;expectedBytes?:number;verifiedSha256?:string;revision?:number}
/** Monotonic revision prevents an earlier journal snapshot from matching an
 * identical phase after abort/retry cycles (the ABA case).
 * Missing revision is legacy revision zero; overflow is fail-closed.
 */
export function nextPackRevision(state:Pick<PackInstallState,'revision'>):number|null {
 const previous=state.revision??0;
 return Number.isSafeInteger(previous)&&previous>=0&&previous<Number.MAX_SAFE_INTEGER?previous+1:null;
}
export type PackInstallOutcome={status:'ok';state:PackInstallState}|{status:'rejected';reason:'manifest'|'transition'|'checksum'};
export function beginLanguagePackInstall(pack:LanguagePack,installedDependencies:readonly string[]=[]):PackInstallOutcome {
 const plan=planLanguagePacks([pack],[]);
 if(plan.status!=='ready'||!pack||!Array.isArray(installedDependencies)||pack.dependencies.some(id=>!installedDependencies.includes(id)))return {status:'rejected',reason:'manifest'};
 return {status:'ok',state:{id:pack.id,version:pack.version,phase:'staging',expectedSha256:pack.sha256.toLowerCase(),expectedBytes:pack.bytes,revision:0}};
}
export function advanceLanguagePackInstall(state:PackInstallState,event:'verify'|'commit'|'abort',sha256?:string):PackInstallOutcome {
 const revision=state?nextPackRevision(state):null;
 if(revision===null||!state||!(/^[a-z0-9][a-z0-9._-]{0,99}$/).test(state.id)||!/^\d+\.\d+\.\d+$/.test(state.version)||!(/^[a-f0-9]{64}$/).test(state.expectedSha256)||(state.expectedBytes!==undefined&&(!Number.isSafeInteger(state.expectedBytes)||state.expectedBytes<=0))||!['staging','verified','installed','failed','absent'].includes(state.phase)||((state.phase==='staging'||state.phase==='absent'||state.phase==='failed')&&state.verifiedSha256!==undefined)||((state.phase==='verified'||state.phase==='installed')&&state.verifiedSha256!==state.expectedSha256))return {status:'rejected',reason:'transition'};
 if(event==='abort'&&(state.phase==='staging'||state.phase==='verified'))return {status:'ok',state:{...state,phase:'failed',verifiedSha256:undefined,revision}};
 if(event==='verify'&&state.phase==='staging'){
  if(typeof sha256!=='string'||!(/^[a-f0-9]{64}$/i).test(sha256)||sha256.toLowerCase()!==state.expectedSha256)return {status:'rejected',reason:'checksum'};
  return {status:'ok',state:{...state,phase:'verified',verifiedSha256:sha256.toLowerCase(),revision}};
 }
 if(event==='commit'&&state.phase==='verified'&&state.verifiedSha256===state.expectedSha256)return {status:'ok',state:{...state,phase:'installed',revision}};
 return {status:'rejected',reason:'transition'};
}
