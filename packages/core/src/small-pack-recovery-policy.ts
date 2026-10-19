/** Pure decisions from already verified file presence; never performs IO. */
import type {PackInstallState} from './language-pack-install-state.js';
export type SmallPackPresence='both'|'destination-valid'|'destination-invalid'|'staging-valid'|'staging-invalid'|'none';
export type SmallPackRecoveryDecision='installed-verified'|'promotion-interrupted'|'staging-interrupted'|'missing-files'|'blocked';
export function decideSmallPackRecovery(state:PackInstallState,presence:SmallPackPresence):SmallPackRecoveryDecision{
 if(!state||typeof state.id!=='string'||!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(state.id)||typeof state.version!=='string'||!/^\d+\.\d+\.\d+$/.test(state.version)||typeof state.expectedSha256!=='string'||!/^[a-f0-9]{64}$/.test(state.expectedSha256)||!['staging','verified','installed','failed','absent'].includes(state.phase))return 'blocked';
 if(presence==='both'||presence==='destination-invalid'||presence==='staging-invalid')return 'blocked';
 if(presence==='destination-valid'){
  if(state.phase==='installed'&&state.verifiedSha256===state.expectedSha256)return 'installed-verified';
  if(state.phase==='verified'&&state.verifiedSha256===state.expectedSha256)return 'promotion-interrupted';
  return 'blocked';
 }
 if(presence==='staging-valid'&&(state.phase==='staging'||state.phase==='verified'))return 'staging-interrupted';
 return presence==='none'?'missing-files':'blocked';
}
