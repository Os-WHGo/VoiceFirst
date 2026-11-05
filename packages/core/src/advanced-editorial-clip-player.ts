/** Foreground-only, private C1/C2 audio reviewer.
 * Rechecks six actual local files immediately before every playback; never
 * stores proof, transcripts, assessment or learner progress. NOT a public player.
 */
import {auditAdvancedSceneLocalAudio,type AdvancedAudioCandidate} from './advanced-audio-integrity.js';
import {advancedEditorialAudioRequest,advancedRehearsalCurrent} from './advanced-editorial-rehearsal.js';
import {PlaybackRequestOwnership,effectivePlaybackRate} from './playback-request-ownership.js';
import type {NativeLocalFileVerifier} from './local-model-file-verification.js';

export type AdvancedReviewPlaybackResult=
 | {status:'completed';audioId:string}
 | {status:'cancelled'|'unavailable'|'failed'|'timeout'};
export interface AdvancedReviewClipHandle {
 /** Must not start playing until start() is invoked. */
 start(onDone:()=>void,onError:()=>void):void;
 stop():void;
}
export interface AdvancedReviewPlaybackPort {
 /** Stop other narration; request foreground/non-background audio mode. */
 prepareForeground():Promise<void>;
 /** Allocates but does not start a player. No remote fallback or system TTS. */
 createLocalClip(uri:string,rate:number):AdvancedReviewClipHandle;
}
const playbackDeadlineMs=120000;
/** This class is deliberately independent of mobile public navigation.
 * No caller-supplied audit snapshot is trusted. An untrusted manifest and bytes
 * are verified again on EACH request, not just at session creation.
 */
export class AdvancedEditorialClipPlayer {
 private readonly owner=new PlaybackRequestOwnership();
 constructor(
  private readonly verifier:NativeLocalFileVerifier,
  private readonly port:AdvancedReviewPlaybackPort
 ){}
 stop():void{this.owner.stop();}
 play(state:unknown,candidates:unknown,rate=0.9):Promise<AdvancedReviewPlaybackResult>{
  const token=this.owner.claim();
  return new Promise(resolve=>{
   let settled=false;
   let player:AdvancedReviewClipHandle|null=null;
   let timeout:ReturnType<typeof setTimeout>|null=null;
   const settle=(value:AdvancedReviewPlaybackResult)=>{
    if(settled)return;
    settled=true;
    if(timeout!==null)clearTimeout(timeout);
    // finish() disposes player through the ownership callback.
    if(value.status!=='cancelled')this.owner.finish(token);
    resolve(value);
   };
   const attached=this.owner.attach(token,()=>{
    try{player?.stop();}catch{/* native stop is best effort */}
    settle({status:'cancelled'});
   });
   if(!attached)return;
   void (async()=>{
    const step=advancedRehearsalCurrent(state);
    // Require exactly the six candidates of one scene: never accept extra files.
    if(step?.kind!=='script-turn'||!Array.isArray(candidates)||
       candidates.length!==6){settle({status:'unavailable'});return;}
    try{
     const report=await auditAdvancedSceneLocalAudio(candidates,this.verifier);
     if(!this.owner.isCurrent(token))return;
     const allowed=advancedEditorialAudioRequest(state,report);
     if(allowed.status!=='verified-editorial-asset'||allowed.audioId!==step.audioId){
      settle({status:'unavailable'});return;
     }
     const row=(candidates as AdvancedAudioCandidate[]).find(x=>x.audioId===step.audioId);
     if(!row){settle({status:'unavailable'});return;}
     await this.port.prepareForeground();
     if(!this.owner.isCurrent(token))return;
     // Synchronous creation and start, guarded by the previously claimed token.
     player=this.port.createLocalClip(row.localUri,effectivePlaybackRate(rate));
     if(!this.owner.isCurrent(token)){
      try{player.stop();}catch{}
      return;
     }
     timeout=setTimeout(()=>settle({status:'timeout'}),playbackDeadlineMs);
     player.start(
      ()=>{if(this.owner.isCurrent(token))settle({status:'completed',audioId:step.audioId});},
      ()=>{if(this.owner.isCurrent(token))settle({status:'failed'});}
     );
    }catch{
     if(this.owner.isCurrent(token))settle({status:'failed'});
    }
   })();
  });
 }
}
