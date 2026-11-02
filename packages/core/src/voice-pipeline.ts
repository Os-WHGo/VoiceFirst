/** Pure audio-turn logic for offline voice lessons: PCM helpers, a pluggable frame VAD, an endpointer and a turn
 * controller with barge-in, plus the bridge from transcripts to session events. No microphone, model, file or
 * network access: native adapters (ChatGPT's scope) feed frames and execute the returned commands.
 * Endpointing rules come from the 2026-10-23 PoC (docs/VOICE_ENGINE_RESEARCH_2026_10_23.md): keep ORIGINAL audio
 * around speech (pre/post-roll), accept one-word answers (0.1 s), never cut a learner who pauses to think.
 */
import {parseVoiceCommand,type VoiceCommand} from './commands.js';
import type {LearningSessionEvent,ResponseWindow} from './learning-session.js';
import {classifyVoiceConfidence} from './voice-turn-policy.js';

export const pipelineSampleRate=16000;
export function int16ToFloat32(samples:Int16Array):Float32Array{
 return Float32Array.from(samples,v=>v/32768);
}
/** Linear resampling, enough for speech-band capture (44.1/48 kHz to 16 kHz). */
export function resampleLinear(samples:Float32Array,from:number,to:number):Float32Array{
 if(!(from>0)||!(to>0))throw new Error('Invalid sample rate');
 if(from===to)return samples.slice();
 const out=new Float32Array(Math.floor(samples.length*to/from));
 for(let i=0;i<out.length;i++){
  const x=i*from/to,j=Math.floor(x),f=x-j;
  out[i]=(samples[j]??0)*(1-f)+(samples[Math.min(j+1,samples.length-1)]??0)*f;
 }
 return out;
}
/** RMS level in dBFS; -120 for digital silence. */
export function frameEnergyDb(frame:Float32Array):number{
 let sum=0;for(const v of frame)sum+=v*v;
 const rms=Math.sqrt(sum/Math.max(1,frame.length));
 return rms>0?Math.max(-120,20*Math.log10(rms)):-120;
}

export interface VadDecision {speech:boolean;probability?:number}
/** A frame classifier. Silero (via a native engine) or the energy fallback below can implement it. */
export interface FrameVad {readonly frameSamples:number;classify(frame:Float32Array):VadDecision;reset():void}
/** Dependency-free fallback: speech when the level clearly exceeds a noise floor estimated by minimum statistics
 * (the lowest level over a sliding window). Real speech has gaps between syllables, so its minimum stays near the
 * background; steady background noise sets the floor even when it is louder than the absolute speech minimum.
 */
export class EnergyVad implements FrameVad{
 readonly frameSamples:number;
 private history:number[]=[];
 private noiseDb:number;
 private readonly windowFrames:number;
 private readonly risePerFrame:number;
 constructor(private readonly options:{sampleRate?:number;frameMs?:number;marginDb?:number;minSpeechDb?:number;windowMs?:number;riseDbPerSecond?:number;initialNoiseDb?:number;maxNoiseDb?:number}={}){
  const frameMs=options.frameMs??30;
  this.frameSamples=Math.round((options.sampleRate??pipelineSampleRate)*frameMs/1000);
  this.windowFrames=Math.max(5,Math.round((options.windowMs??1000)/frameMs));
  this.risePerFrame=(options.riseDbPerSecond??15)*frameMs/1000;
  this.noiseDb=options.initialNoiseDb??-60;
 }
 classify(frame:Float32Array):VadDecision{
  const db=frameEnergyDb(frame);
  this.history.push(db);if(this.history.length>this.windowFrames)this.history.shift();
  const floor=Math.min(...this.history),cap=this.options.maxNoiseDb??-25;
  // Warm-up: the floor is what has been observed so far, so background noise is never taken for speech at the start.
  // Afterwards it falls at once, rises at a limited rate, and never rises to the level of loud speech.
  this.noiseDb=Math.min(cap,this.history.length<this.windowFrames?floor:floor<this.noiseDb?floor:Math.min(floor,this.noiseDb+this.risePerFrame));
  const threshold=Math.max(this.noiseDb+(this.options.marginDb??12),this.options.minSpeechDb??-45);
  return {speech:db>threshold,probability:Math.max(0,Math.min(1,(db-threshold+6)/12))};
 }
 reset():void{this.history=[];this.noiseDb=this.options.initialNoiseDb??-60;}
 get noiseFloorDb():number{return this.noiseDb;}
}

export interface EndpointPolicy {
 preRollMs:number;
 postRollMs:number;
 /** Shorter speech is treated as a noise burst. 0.1 s keeps one-word A0 answers. */
 minSpeechMs:number;
 /** Silence that ends a turn. Learners pause to think, so this is longer than conversational defaults. */
 endSilenceMs:number;
 maxUtteranceMs:number;
 /** Only in timed mode; null means wait indefinitely. */
 noSpeechTimeoutMs:number|null;
}
export const defaultEndpointPolicy:EndpointPolicy=Object.freeze({preRollMs:200,postRollMs:400,minSpeechMs:100,endSilenceMs:1200,maxUtteranceMs:15000,noSpeechTimeoutMs:null});
/** Endpointing derived from the session's response window. More time never shortens the end-of-turn pause. */
export function endpointPolicyFor(window:ResponseWindow,options:{endSilenceMs?:number}={}):EndpointPolicy{
 const end=Math.max(600,Math.min(4000,options.endSilenceMs??defaultEndpointPolicy.endSilenceMs));
 return {...defaultEndpointPolicy,endSilenceMs:end,noSpeechTimeoutMs:window.mode==='timed'?window.seconds*1000:null};
}
export type EndpointEvent=
 |{type:'speech-start';atMs:number}
 |{type:'utterance';samples:Float32Array;startMs:number;endMs:number;speechMs:number;truncated:boolean}
 |{type:'discarded-short';atMs:number;speechMs:number}
 |{type:'no-speech-timeout';atMs:number};
/** Turns a stream of mono frames into utterances. Feed any chunk size; frames are cut internally. */
export class Endpointer{
 private pending:number[]=[];
 private preRoll:Float32Array[]=[];
 private utterance:Float32Array[]=[];
 private state:'waiting'|'speech'='waiting';
 private elapsedMs=0;
 private speechMs=0;
 private silenceMs=0;
 private startMs=0;
 private timedOut=false;
 private readonly frameMs:number;
 constructor(private readonly vad:FrameVad,private readonly policy:EndpointPolicy=defaultEndpointPolicy,private readonly sampleRate=pipelineSampleRate){
  if(!(vad.frameSamples>0))throw new Error('Invalid VAD frame size');
  this.frameMs=vad.frameSamples*1000/sampleRate;
 }
 push(samples:Float32Array):EndpointEvent[]{
  const events:EndpointEvent[]=[];
  for(const v of samples)this.pending.push(v);
  const n=this.vad.frameSamples;
  while(this.pending.length>=n){events.push(...this.frame(Float32Array.from(this.pending.splice(0,n))));}
  return events;
 }
 /** End of input (the learner tapped "done", or capture stopped). */
 finish():EndpointEvent[]{
  const events:EndpointEvent[]=[];
  if(this.pending.length){const f=new Float32Array(this.vad.frameSamples);f.set(this.pending);this.pending=[];events.push(...this.frame(f));}
  if(this.state==='speech')events.push(this.close(false));
  return events;
 }
 reset():void{this.pending=[];this.preRoll=[];this.utterance=[];this.state='waiting';this.elapsedMs=0;this.speechMs=0;this.silenceMs=0;this.timedOut=false;this.vad.reset();}
 private frame(frame:Float32Array):EndpointEvent[]{
  const events:EndpointEvent[]=[];
  const {speech}=this.vad.classify(frame);
  const at=this.elapsedMs;this.elapsedMs+=this.frameMs;
  if(this.state==='waiting'){
   if(speech){
    this.state='speech';this.startMs=Math.max(0,at-this.preRoll.length*this.frameMs);
    this.utterance=[...this.preRoll,frame];this.preRoll=[];this.speechMs=this.frameMs;this.silenceMs=0;
    events.push({type:'speech-start',atMs:at});
   }else{
    this.preRoll.push(frame);
    while(this.preRoll.length*this.frameMs>this.policy.preRollMs)this.preRoll.shift();
    const limit=this.policy.noSpeechTimeoutMs;
    if(limit!==null&&!this.timedOut&&this.elapsedMs>=limit){this.timedOut=true;events.push({type:'no-speech-timeout',atMs:this.elapsedMs});}
   }
   return events;
  }
  this.utterance.push(frame);
  if(speech){this.speechMs+=this.frameMs;this.silenceMs=0;}else this.silenceMs+=this.frameMs;
  if(this.silenceMs>=this.policy.endSilenceMs)events.push(this.close(false));
  else if(this.utterance.length*this.frameMs>=this.policy.maxUtteranceMs)events.push(this.close(true));
  return events;
 }
 private close(truncated:boolean):EndpointEvent{
  const keepTail=Math.ceil(this.policy.postRollMs/this.frameMs);
  const trailing=Math.floor(this.silenceMs/this.frameMs);
  const frames=this.utterance.slice(0,this.utterance.length-Math.max(0,trailing-keepTail));
  const speechMs=this.speechMs,startMs=this.startMs;
  this.state='waiting';this.utterance=[];this.preRoll=[];this.speechMs=0;this.silenceMs=0;
  if(speechMs<this.policy.minSpeechMs)return {type:'discarded-short',atMs:startMs,speechMs};
  const total=frames.reduce((n,f)=>n+f.length,0),samples=new Float32Array(total);
  let o=0;for(const f of frames){samples.set(f,o);o+=f.length;}
  return {type:'utterance',samples,startMs,endMs:startMs+total*1000/this.sampleRate,speechMs,truncated};
 }
}

/** Barge-in is safe only where the lesson voice cannot leak back into the microphone. */
export type OutputRoute='speaker'|'wired-headset'|'bluetooth'|'unknown';
export function bargeInAllowed(route:OutputRoute,echoCancellation:boolean):boolean{
 return route==='wired-headset'||route==='bluetooth'||(route==='speaker'&&echoCancellation);
}
export type TurnPhase='idle'|'speaking'|'listening'|'transcribing'|'paused';
export interface TurnState {turnId:number;phase:TurnPhase;activityId:string|null;route:OutputRoute;echoCancellation:boolean;bargeInMs:number;speechSinceMs:number|null}
export type TurnInput=
 |{type:'prompt';activityId:string;hasSpeech:boolean}
 |{type:'tts-finished';turnId:number}
 |{type:'vad';speech:boolean;atMs:number}
 |{type:'utterance';turnId:number}
 |{type:'transcript';turnId:number;text:string;confidence:unknown}
 |{type:'asr-failed';turnId:number}
 |{type:'route';route:OutputRoute;echoCancellation:boolean}
 |{type:'pause'}|{type:'resume'};
export type TurnCommand=
 |{type:'speak';turnId:number}|{type:'stop-speaking'}
 |{type:'start-listening';turnId:number}|{type:'stop-listening'}
 |{type:'transcribe';turnId:number}
 |{type:'session-event';event:LearningSessionEvent}
 |{type:'app-command';command:VoiceCommand}
 |{type:'discarded';reason:'stale-turn'|'not-listening'|'empty'};
export function newTurnState(route:OutputRoute='unknown',echoCancellation=false):TurnState{
 return {turnId:0,phase:'idle',activityId:null,route,echoCancellation,bargeInMs:200,speechSinceMs:null};
}
/** Learner speech is checked against the current answer FIRST, so an expected phrase is never taken as a command. */
export function transcriptToSessionEvent(text:string,confidence:unknown,isExpectedAnswer:(text:string)=>boolean):{type:'session-event';event:LearningSessionEvent}|{type:'app-command';command:VoiceCommand}|null{
 if(typeof text!=='string'||!text.trim())return null;
 const level=classifyVoiceConfidence(confidence);
 const answer={type:'session-event' as const,event:{type:'answer' as const,response:text,source:{kind:'speech' as const,confidence:level}}};
 if(isExpectedAnswer(text))return answer;
 const command=parseVoiceCommand(text);
 if(!command)return answer;
 const map:Partial<Record<VoiceCommand['type'],LearningSessionEvent>>={REPEAT:{type:'replay'},SLOWER:{type:'slower'},HELP:{type:'hint'},NEXT:{type:'skip'},PAUSE:{type:'pause'},SUMMARY:{type:'where-am-i'}};
 const event=map[command.type];
 return event?{type:'session-event',event}:{type:'app-command',command};
}
/** Pure turn controller: who speaks, when to listen, and which results still belong to the current turn. */
export function stepTurn(state:TurnState,input:TurnInput,isExpectedAnswer:(text:string)=>boolean=()=>false):{state:TurnState;commands:TurnCommand[]}{
 const s={...state};
 switch(input.type){
  case 'prompt':{
   s.turnId+=1;s.activityId=input.activityId;s.speechSinceMs=null;
   if(s.phase==='paused')return {state:s,commands:[]};
   if(input.hasSpeech){s.phase='speaking';return {state:s,commands:[{type:'stop-listening'},{type:'speak',turnId:s.turnId}]};}
   s.phase='listening';return {state:s,commands:[{type:'start-listening',turnId:s.turnId}]};
  }
  case 'tts-finished':
   if(input.turnId!==s.turnId||s.phase!=='speaking')return {state,commands:[{type:'discarded',reason:'stale-turn'}]};
   s.phase='listening';return {state:s,commands:[{type:'start-listening',turnId:s.turnId}]};
  case 'vad':{
   if(s.phase!=='speaking'||!bargeInAllowed(s.route,s.echoCancellation))return {state:s,commands:[]};
   if(!input.speech){s.speechSinceMs=null;return {state:s,commands:[]};}
   if(s.speechSinceMs===null){s.speechSinceMs=input.atMs;return {state:s,commands:[]};}
   if(input.atMs-s.speechSinceMs<s.bargeInMs)return {state:s,commands:[]};
   s.phase='listening';s.speechSinceMs=null;
   return {state:s,commands:[{type:'stop-speaking'},{type:'start-listening',turnId:s.turnId}]};
  }
  case 'utterance':
   if(input.turnId!==s.turnId||s.phase!=='listening')return {state,commands:[{type:'discarded',reason:input.turnId!==s.turnId?'stale-turn':'not-listening'}]};
   s.phase='transcribing';return {state:s,commands:[{type:'stop-listening'},{type:'transcribe',turnId:s.turnId}]};
  case 'transcript':{
   if(input.turnId!==s.turnId||s.phase!=='transcribing')return {state,commands:[{type:'discarded',reason:'stale-turn'}]};
   const mapped=transcriptToSessionEvent(input.text,input.confidence,isExpectedAnswer);
   s.phase='idle';
   return {state:s,commands:mapped?[mapped]:[{type:'discarded',reason:'empty'},{type:'start-listening',turnId:s.turnId}]};
  }
  case 'asr-failed':
   if(input.turnId!==s.turnId)return {state,commands:[{type:'discarded',reason:'stale-turn'}]};
   // A failed recognition is never the learner's fault: listen again, nothing is scored.
   s.phase='listening';return {state:s,commands:[{type:'start-listening',turnId:s.turnId}]};
  case 'route':s.route=input.route;s.echoCancellation=input.echoCancellation;return {state:s,commands:[]};
  case 'pause':{const was=s.phase;s.phase='paused';s.turnId+=1;return {state:s,commands:was==='speaking'?[{type:'stop-speaking'}]:was==='listening'||was==='transcribing'?[{type:'stop-listening'}]:[]};}
  case 'resume':if(s.phase!=='paused')return {state:s,commands:[]};s.phase='idle';return {state:s,commands:[]};
 }
}
