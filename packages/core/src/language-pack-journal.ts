/** Validation boundary for a persisted install journal. Storage is supplied by native adapters. */
import type {PackInstallState} from './language-pack-install-state.js';
import {planLanguagePackRecovery,type RecoveryDecision} from './language-pack-recovery.js';
export type JournalRead={status:'ok';state:PackInstallState;recovery:RecoveryDecision}|{status:'rejected';reason:'invalid-json'|'invalid-state'|'too-large'};
export function readLanguagePackJournal(raw:string):JournalRead{
 if(typeof raw!=='string'||raw.length>4096)return {status:'rejected',reason:'too-large'};
 let value:unknown;
 try{value=JSON.parse(raw);}catch{return {status:'rejected',reason:'invalid-json'};}
 if(!value||typeof value!=='object'||Array.isArray(value))return {status:'rejected',reason:'invalid-state'};
 const item=value as Record<string,unknown>;
 if(Object.keys(item).some(key=>!['id','version','phase','expectedSha256','verifiedSha256'].includes(key)))return {status:'rejected',reason:'invalid-state'};
 const state=item as unknown as PackInstallState;
 const recovery=planLanguagePackRecovery(state);
 if(recovery.action==='reject')return {status:'rejected',reason:'invalid-state'};
 return {status:'ok',state,recovery};
}
