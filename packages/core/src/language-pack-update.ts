/** Pure update planner: preserves the currently installed pack until replacement is verified. */
import {planLanguagePacks,type LanguagePack} from './language-packs.js';
export type PackUpdateDecision=
 |{status:'download';id:string;fromVersion:string|null;toVersion:string;bytes:number}
 |{status:'current';id:string;version:string}
 |{status:'rejected';reason:'manifest'|'installed-version'|'downgrade'|'dependencies'};
const semver=(v:string):number[]|null=>/^\d+\.\d+\.\d+$/.test(v)?v.split('.').map(Number):null;
export function planLanguagePackUpdate(pack:LanguagePack,installedVersion:string|null,installedDependencies:readonly string[]=[]):PackUpdateDecision{
 if(!pack||!Array.isArray(installedDependencies)||pack.dependencies.some(id=>!installedDependencies.includes(id)))return {status:'rejected',reason:'dependencies'};
 const valid=planLanguagePacks([pack],[]);
 if(valid.status!=='ready')return {status:'rejected',reason:'manifest'};
 if(installedVersion===null)return {status:'download',id:pack.id,fromVersion:null,toVersion:pack.version,bytes:pack.bytes};
 const old=semver(installedVersion),next=semver(pack.version);
 if(!old||!next||old.some(n=>!Number.isSafeInteger(n))||next.some(n=>!Number.isSafeInteger(n)))return {status:'rejected',reason:'installed-version'};
 for(let i=0;i<3;i++){
  if(next[i]!>old[i]!)return {status:'download',id:pack.id,fromVersion:installedVersion,toVersion:pack.version,bytes:pack.bytes};
  if(next[i]!<old[i]!)return {status:'rejected',reason:'downgrade'};
 }
 return {status:'current',id:pack.id,version:installedVersion};
}
