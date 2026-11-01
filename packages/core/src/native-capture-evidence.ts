/** Evidence from the installed expo-speech-recognition v57.1.1 events.
 * "audiostart" confirms that the service reported opening capture, NOT PCM
 * samples or which physical microphone (Bluetooth/Meta/phone) supplied them.
 * "audioend" is NOT the terminal recognizer event; "end" is terminal.
 * No audio, transcripts, device IDs or identifying data are stored here.
 */
export type NativeCaptureSignal='audiostart'|'audioend'|'end';
export interface NativeCaptureEvidence{
 readonly phase:'requested'|'capturing'|'processing'|'terminal';
 readonly startedAtMs:number|null;
 readonly endedAtMs:number|null;
 readonly audioStarts:number;
 readonly audioEnds:number;
 /** A second start for a single non-continuous turn is a route/reset risk. */
 readonly discontinuity:boolean;
}
export function newNativeCaptureEvidence():NativeCaptureEvidence{
 return {phase:'requested',startedAtMs:null,endedAtMs:null,audioStarts:0,audioEnds:0,discontinuity:false};
}
const time=(stamp:unknown):number|null=>
 typeof stamp==='number'&&Number.isFinite(stamp)&&stamp>0?stamp:null;

/** A pure, conservative record of what the recognizer actually signalled.
 * Never infer that an output Bluetooth device was also the input.
 */
export function recordNativeCaptureSignal(
 previous:NativeCaptureEvidence,signal:NativeCaptureSignal,timestamp?:unknown
):NativeCaptureEvidence{
 if(previous.phase==='terminal')return previous;
 if(signal==='end')return {...previous,phase:'terminal'};
 const ts=time(timestamp);
 if(signal==='audiostart'){
  const discontinuity=previous.discontinuity||previous.audioStarts>0||previous.phase==='processing'||
   (ts!==null&&previous.endedAtMs!==null&&ts<previous.endedAtMs);
  return {...previous,phase:'capturing',audioStarts:previous.audioStarts+1,
   startedAtMs:previous.startedAtMs??ts,discontinuity};
 }
 const discontinuity=previous.discontinuity||previous.audioEnds>0||
  (ts!==null&&previous.startedAtMs!==null&&ts<previous.startedAtMs);
 return {...previous,phase:'processing',audioEnds:previous.audioEnds+1,
  endedAtMs:previous.endedAtMs??ts,discontinuity};
}
/** Only the explicit end signal terminates a native turn, not audioend or
 * a final transcript. This is a supplementary invariant to session gate.
 */
export function nativeCaptureCanReleaseGate(e:NativeCaptureEvidence):boolean{
 return e.phase==='terminal';
}
