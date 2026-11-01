/** Pure voice-navigation decisions for the mobile course.
 * No speech transcript is treated as a pronunciation grade.
 * Unsupported or inapplicable commands MUST NOT silently become skip/continue.
 */
import type {VoiceCommand} from './commands.js';
import type {LearningSessionEvent,LearningSessionState} from './learning-session.js';
import {effectivePlaybackRate} from './playback-request-ownership.js';

export type SessionVoiceDecision =
 |{kind:'event';event:LearningSessionEvent}
 |{kind:'play-current'}
 |{kind:'play-summary'}
 |{kind:'speed-up'}
 |{kind:'unsupported'};

/** Resolve only explicit navigation actions. The caller must confirm the
 * command with the learner before executing it, and re-check session state.
 */
export function resolveSessionVoiceCommand(
 command:VoiceCommand,status:LearningSessionState['status'],day:string
):SessionVoiceDecision{
 switch(command.type){
  case 'STOP':return status==='finished'?{kind:'unsupported'}:{kind:'event',event:{type:'finish'}};
  case 'PAUSE':return status==='active'?{kind:'event',event:{type:'pause'}}:{kind:'unsupported'};
  case 'RESUME':return status==='paused'?{kind:'event',event:{type:'resume',day}}:{kind:'unsupported'};
  case 'REPEAT':return status==='active'?{kind:'event',event:{type:'replay'}}:{kind:'unsupported'};
  case 'SLOWER':return status==='active'?{kind:'event',event:{type:'slower'}}:{kind:'unsupported'};
  case 'HELP':return status==='active'?{kind:'event',event:{type:'hint'}}:{kind:'unsupported'};
  case 'NEXT':return status==='active'?{kind:'event',event:{type:'skip'}}:{kind:'unsupported'};
  case 'SUMMARY':return status==='finished'?{kind:'unsupported'}:{kind:'play-summary'};
  case 'FASTER':return status==='active'?{kind:'speed-up'}:{kind:'unsupported'};
  case 'ONLY_LISTEN':return status==='active'?{kind:'play-current'}:{kind:'unsupported'};
  default:return {kind:'unsupported'};
 }
}
/** Consistent on-device rate for local recordings and system TTS.
 * The player already bounds rate to [0.65,1.2]; do not exceed that range.
 */
export function fasterSessionPlaybackRate(current:number):number{
 return effectivePlaybackRate(Math.round((effectivePlaybackRate(current)+0.1)*100)/100);
}
