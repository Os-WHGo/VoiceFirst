/** Conservatively decide whether on-device speech recognition may affect course
 * progress. A transcript is not evidence of pronunciation or global CEFR ability.
 */
import type {AnswerControl} from './experience.js';
export type VoiceConfidence='high'|'unknown';
export type VoiceDisposition='ignore'|'confirm'|'evaluate';
export function voiceTranscriptDisposition(args:{
 text:unknown; confidence:VoiceConfidence; answerControl:AnswerControl; final:boolean;
}):VoiceDisposition{
 if(!args.final || typeof args.text!=='string' || !args.text.trim())return 'ignore';
 if(args.confidence!=='high')return 'confirm';
 return args.answerControl==='auto-after-silence'?'evaluate':'confirm';
}
/** A response from an obsolete exercise must never advance progress. */
export function currentVoiceTurn(expectedId:string|null,heardId:string,enabled:boolean):boolean{
 return enabled && !!expectedId && expectedId===heardId;
}
