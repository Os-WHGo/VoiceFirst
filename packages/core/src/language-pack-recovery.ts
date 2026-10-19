/** Pure recovery decisions after interruption. Does not read or modify files. */
import type {PackInstallState} from './language-pack-install-state.js';
export type RecoveryDecision=
 |{action:'keep-installed';id:string;version:string}
 |{action:'discard-staging';id:string;version:string}
 |{action:'retry-verification';id:string;version:string}
 |{action:'reject';reason:'invalid-state'};
export function planLanguagePackRecovery(state:PackInstallState):RecoveryDecision{
 if(!state||typeof state.id!=='string'||!(/^[a-z0-9][a-z0-9._-]{0,99}$/).test(state.id)||typeof state.version!=='string'||!/^\d+\.\d+\.\d+$/.test(state.version)||typeof state.expectedSha256!=='string'||!(/^[a-f0-9]{64}$/).test(state.expectedSha256))return {action:'reject',reason:'invalid-state'};
 const {id,version}=state;
 if(state.phase==='installed'&&state.verifiedSha256===state.expectedSha256)return {action:'keep-installed',id,version};
 if(state.phase==='staging'&&state.verifiedSha256===undefined)return {action:'retry-verification',id,version};
 if(state.phase==='verified'&&state.verifiedSha256===state.expectedSha256)return {action:'retry-verification',id,version};
 if((state.phase==='failed'||state.phase==='absent')&&state.verifiedSha256===undefined)return {action:'discard-staging',id,version};
 return {action:'reject',reason:'invalid-state'};
}
