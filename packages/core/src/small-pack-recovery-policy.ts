/** Pure decisions from already verified file presence; never performs IO. */
import type {PackInstallState} from './language-pack-install-state.js';
export type SmallPackPresence='both'|'destination-valid'|'destination-invalid'|'staging-valid'|'staging-invalid'|'none';
export type SmallPackRecoveryDecision='installed-verified'|'promotion-interrupted'|'staging-interrupted'|'missing-files'|'blocked';
export function decideSmallPackRecovery(state:PackInstallState,presence:SmallPackPresence):SmallPackRecoveryDecision{
 if(presence==='both'||presence==='destination-invalid'||presence==='staging-invalid')return 'blocked';
 if(presence==='destination-valid'){
  if(state.phase==='installed'&&state.verifiedSha256===state.expectedSha256)return 'installed-verified';
  if(state.phase==='verified'&&state.verifiedSha256===state.expectedSha256)return 'promotion-interrupted';
  return 'blocked';
 }
 if(presence==='staging-valid'&&(state.phase==='staging'||state.phase==='verified'))return 'staging-interrupted';
 return presence==='none'?'missing-files':'blocked';
}
