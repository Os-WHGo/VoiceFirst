/** Synchronous ownership for asynchronous audio requests.
 * Claim a token BEFORE the first await. A newer request or stop revokes
 * every older token and releases the resource it owned.
 */
export class PlaybackRequestOwnership {
 private generation=0;
 private cleanup:(()=>void)|null=null;

 claim():number{
  this.stop();
  return this.generation;
 }
 isCurrent(token:number):boolean{return token===this.generation;}
 attach(token:number,dispose:()=>void):boolean{
  if(!this.isCurrent(token)){dispose();return false;}
  const old=this.cleanup;
  this.cleanup=dispose;
  try{old?.();}catch{/* Never block ownership transfer. */}
  return true;
 }
 finish(token:number):boolean{
  if(!this.isCurrent(token))return false;
  this.stop();
  return true;
 }
 stop():void{
  this.generation++;
  const dispose=this.cleanup;
  this.cleanup=null;
  try{dispose?.();}catch{/* Cleanup best-effort; never retain a stale owner. */}
 }
}

export function effectivePlaybackRate(rate:number):number{
 return Number.isFinite(rate)?Math.min(1.2,Math.max(0.65,rate)):1;
}
/** Duration is source duration, not duration after applying playbackRate. */
export function curatedPlaybackTimeoutMs(durationMs:number,rate:number):number{
 if(!Number.isFinite(durationMs)||durationMs<=0)return 10000;
 return Math.max(5000,Math.ceil(durationMs/effectivePlaybackRate(rate)+10000));
}
