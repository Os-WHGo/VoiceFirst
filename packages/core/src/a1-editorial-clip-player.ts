/** Foreground-only ORIGINAL A1 audio playback for an internal editorial reviewer.
 * Revalidate source metadata and SIX app-owned WAV files on EVERY request.
 * Never issue lesson credit, recording permission, rights clearance or CEFR claims.
 */
import {
 auditA1SixTurnAudio,inspectA1SixTurnAudioManifest,
 type A1SixTurnNativeAudioVerifier
} from './a1-editorial-six-turn-audio.js';
import {PlaybackRequestOwnership,effectivePlaybackRate,curatedPlaybackTimeoutMs}
 from './playback-request-ownership.js';
import type {AdvancedReviewClipHandle} from './advanced-editorial-clip-player.js';

export type A1EditorialClipOutcome=
 |{status:'completed';audioId:string}
 |{status:'unavailable'|'failed'|'timeout'|'cancelled'};
export interface A1EditorialPlaybackPort {
 /** Stop existing narration and use foreground/non-background audio only. */
 prepareForeground():Promise<void>;
 /** Implementations must map the approved authored ID to their OWN file, not
  * trust a URI, path or URL supplied by the manifest. */
 createLocalClip(audioId:string,rate:number):AdvancedReviewClipHandle;
}
export class A1EditorialClipPlayer {
 private readonly owner=new PlaybackRequestOwnership();
 constructor(
  private readonly nativeVerifier:A1SixTurnNativeAudioVerifier,
  private readonly port:A1EditorialPlaybackPort
 ){}
 stop():void{this.owner.stop();}
 play(sceneId:string,audioId:string,manifest:unknown,rate=0.9):Promise<A1EditorialClipOutcome>{
  const token=this.owner.claim();
  return new Promise(resolve=>{
   let settled=false,player:AdvancedReviewClipHandle|null=null;
   let timer:ReturnType<typeof setTimeout>|null=null;
   const settle=(out:A1EditorialClipOutcome)=>{
    if(settled)return;
    settled=true;
    if(timer!==null)clearTimeout(timer);
    if(out.status!=='cancelled')this.owner.finish(token);
    resolve(out);
   };
   if(!this.owner.attach(token,()=>{
    try{player?.stop();}catch{/* Native cleanup must not publish a false result. */}
    settle({status:'cancelled'});
   }))return;
   void (async()=>{
    const checked=inspectA1SixTurnAudioManifest(sceneId,manifest);
    if(checked.kind!=='candidate'||typeof audioId!=='string'||
       !checked.clips.some(x=>x.audioId===audioId)){
     settle({status:'unavailable'});return;
    }
    try{
     await this.port.prepareForeground();
     if(!this.owner.isCurrent(token))return;
     // Do not trust a previous review; inspect every byte, duration and SHA
     // after foreground readiness and immediately before player allocation.
     const report=await auditA1SixTurnAudio(sceneId,manifest,this.nativeVerifier);
     if(!this.owner.isCurrent(token))return;
     if(!report.readyForEditorialPlayback||!report.verifiedIds.includes(audioId)){
      settle({status:'unavailable'});return;
     }
     const clip=checked.clips.find(x=>x.audioId===audioId)!;
     player=this.port.createLocalClip(audioId,effectivePlaybackRate(rate));
     if(!this.owner.isCurrent(token)){
      try{player.stop();}catch{}
      return;
     }
     const wait=Math.min(120000,curatedPlaybackTimeoutMs(clip.durationMs,rate));
     timer=setTimeout(()=>{if(this.owner.isCurrent(token))settle({status:'timeout'});},wait);
     player.start(
      ()=>{if(this.owner.isCurrent(token))settle({status:'completed',audioId});},
      ()=>{if(this.owner.isCurrent(token))settle({status:'failed'});}
     );
    }catch{
     if(this.owner.isCurrent(token))settle({status:'failed'});
    }
   })();
  });
 }
}
