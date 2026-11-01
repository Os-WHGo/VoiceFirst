/** Spoken rendering of the existing session outputs; never invents lesson text or evaluates audio. */
import type {LearningSessionOutput} from './learning-session.js';
import {PlaybackRequestOwnership,effectivePlaybackRate} from './playback-request-ownership.js';
import {authoredVoiceCues,cueFingerprint,voiceLocales,type VoiceCue} from './voice-library.js';
import type {TargetLanguage} from './types.js';
import {voiceChoiceLabel,voiceChoiceCommandHint} from './voice-choice.js';

export interface SessionNarrationLine {
 text:string;
 language:TargetLanguage;
 purpose:'instruction'|'target-cue'|'feedback'|'summary';
 activityId?:string;
 slower?:boolean;
}
/** Order is significant: goal/feedback, localized instruction, then target-language audio. */
export function sessionNarration(outputs:readonly LearningSessionOutput[],known:TargetLanguage,target:TargetLanguage):SessionNarrationLine[]{
 const lines:SessionNarrationLine[]=[];
 const add=(line:SessionNarrationLine)=>{
  if(!line.text.trim())return;
  const previous=lines[lines.length-1];
  if(previous?.text===line.text&&previous.language===line.language&&previous.purpose===line.purpose)return;
  lines.push(line);
 };
 for(const output of outputs){
  switch(output.kind){
   case 'prompt':
    add({text:output.instruction,language:known,purpose:'instruction',activityId:output.activityId});
    if(output.speech)add({...output.speech,purpose:'target-cue',activityId:output.activityId});
    for(const [index,option] of (output.options??[]).entries()){
     if(output.activityKind==='choice')add({text:voiceChoiceLabel(known,index),language:known,purpose:'instruction',activityId:output.activityId});
     add({text:option.text,language:option.language,purpose:'instruction',activityId:output.activityId});
    }
    if(output.activityKind==='choice'&&output.options?.length)add({text:voiceChoiceCommandHint(known),language:known,purpose:'instruction',activityId:output.activityId});
    break;
   case 'replay':
    add({text:output.instruction,language:known,purpose:'instruction',slower:output.rate==='slower'});
    if(output.speech)add({...output.speech,purpose:'target-cue',slower:output.rate==='slower'});
    break;
   case 'model':
    add({text:output.text,language:known,purpose:'feedback'});
    add({...output.speech,purpose:'target-cue'});
    break;
   case 'confirm-request':
    add({text:output.text,language:known,purpose:'feedback'});
    add({text:output.closestAnswer,language:target,purpose:'feedback'});
    break;
   case 'corrections':
    for(const text of output.items)add({text,language:known,purpose:'feedback'});
    break;
   case 'summary':
    for(const text of output.summary.statements)add({text,language:known,purpose:'summary'});
    break;
   default:add({text:output.text,language:known,purpose:'feedback'});
  }
 }
 return lines;
}
export function narrationVoiceCue(line:SessionNarrationLine):VoiceCue{
 // Reuse verified pack IDs whenever the text and target locale match exactly.
 return authoredVoiceCues.find(c=>c.language===line.language&&c.text===line.text)??{
  id:`session/${line.language}/${cueFingerprint(line.text)}`,text:line.text,language:line.language,
  locale:voiceLocales[line.language],kind:'dialogue-help',source:'voicefirst-original',
 };
}
export type NarrationResult={kind:'completed'}|{kind:'cancelled'}|{kind:'failed';reason:'playback'|'timeout'};
export interface SessionNarrationPort {
 play(cue:VoiceCue,rate:number,onDone:()=>void,onError:()=>void):void|Promise<void>;
 stop():void|Promise<void>;
}
type Deadline=(callback:()=>void,ms:number)=>()=>void;
const deadline:Deadline=(callback,ms)=>{const timer=setTimeout(callback,ms);return ()=>clearTimeout(timer);};
/** Serializes native callbacks. Cancellation resolves promptly even if the OS never sends onDone.
 * Only the current queue can acknowledge a heard cue or request the microphone afterwards.
 */
export class SessionNarrator {
 private readonly owner=new PlaybackRequestOwnership();
 constructor(private readonly port:SessionNarrationPort,private readonly setDeadline:Deadline=deadline){}
 cancel():void{
  this.owner.stop();
  try{void Promise.resolve(this.port.stop()).catch(()=>{});}catch{/* Ownership is already revoked. */}
 }
 async run(lines:readonly SessionNarrationLine[],rate:number,onHeard?:(line:SessionNarrationLine)=>void):Promise<NarrationResult>{
  if(!lines.length){this.cancel();return {kind:'completed'};}
  const token=this.owner.claim();
  for(const line of lines){
   if(!this.owner.isCurrent(token))return {kind:'cancelled'};
   const outcome=await new Promise<'done'|'cancelled'|'playback'|'timeout'>(resolve=>{
    let settled=false;
    let clear=()=>{};
    const finish=(value:'done'|'cancelled'|'playback'|'timeout')=>{
     if(settled)return;settled=true;clear();resolve(value);
    };
    if(!this.owner.attach(token,()=>finish('cancelled')))return;
    // Bound missing TTS terminal callbacks, without penalizing or advancing the learner.
    clear=this.setDeadline(()=>finish('timeout'),Math.min(120000,Math.max(15000,line.text.length*180)));
    if(settled){clear();return;}
    try{
     const playing=this.port.play(narrationVoiceCue(line),effectivePlaybackRate(line.slower?rate-0.15:rate),()=>finish('done'),()=>finish('playback'));
     void Promise.resolve(playing).catch(()=>finish('playback'));
    }catch{finish('playback');}
   });
   if(!this.owner.isCurrent(token)||outcome==='cancelled')return {kind:'cancelled'};
   if(outcome!=='done'){
    this.cancel();return {kind:'failed',reason:outcome};
   }
   try{onHeard?.(line);}catch{this.cancel();return {kind:'failed',reason:'playback'};}
  }
  return this.owner.finish(token)?{kind:'completed'}:{kind:'cancelled'};
 }
}
