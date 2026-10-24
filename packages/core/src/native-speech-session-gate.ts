/** A native speech-recognition event stream contains no turn identifier.
 * Never start a new turn while result/error/abort events from a previous
 * native session can still arrive. Per the module contract, "end" is terminal.
 *
 * If the platform omits "end", this deliberately fails closed rather than
 * attributing an obsolete transcript to a later lesson.
 */
export class NativeSpeechSessionGate {
 private sessionOpen=false;
 canStart():boolean{return !this.sessionOpen;}
 begin():boolean{
  if(this.sessionOpen)return false;
  this.sessionOpen=true;
  return true;
 }
 /** Final transcript and abort do NOT unlock this gate. */
 end():void{this.sessionOpen=false;}
}
