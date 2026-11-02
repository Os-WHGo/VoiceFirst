/** Native recognition events have no turn identifiers.
 * Final result, error and abort never release the native turn. Only the OS
 * terminal 'end' is authoritative. Missing 'end' fails closed.
 */
export class NativeSpeechSessionGate {
 private sessionOpen=false;
 private readonly onTerminal=new Set<()=>void>();
 canStart():boolean{return !this.sessionOpen;}
 begin():boolean {
  if(this.sessionOpen)return false;
  this.sessionOpen=true;
  return true;
 }
 /** Wait for a currently open native session to finish; cancellation is
  * mandatory when the caller leaves foreground, changes lesson or stops.
  * Not a start request and never captures audio by itself.
  */
 onEnd(listener:()=>void):()=>void {
  if(!this.sessionOpen){listener();return ()=>{};}
  this.onTerminal.add(listener);
  return ()=>{this.onTerminal.delete(listener);};
 }
 /** Notifies once; a callback still must acquire begin() independently. */
 end():void {
  if(!this.sessionOpen)return;
  this.sessionOpen=false;
  const callbacks=[...this.onTerminal];
  this.onTerminal.clear();
  for(const callback of callbacks){
   try{callback();}catch{/* A failed listener must not strand other waiters. */}
  }
 }
}
