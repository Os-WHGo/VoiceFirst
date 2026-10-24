/** Reused Wivra principle: verify physical audio provenance before accepting input.
 * Inspired by WivraAudioRoute.swift; no camera-mode code or brand assumptions are copied.
 * Native AVAudioSession/AudioManager bindings are NOT installed here.
 */
export type MicrophoneKind='built-in'|'bluetooth-hfp'|'wired'|'usb';
export interface AudioInput {id:string;label:string;kind:MicrophoneKind;available:boolean;}
export type AudioRouteResult=
  | {status:'active';input:AudioInput}
  | {status:'needs-permission'|'not-selected'|'disconnected'|'route-rejected'|'unsupported'};
/** Requested route != actual route. Fail closed rather than claiming a Ray-Ban microphone. */
export function verifyInputRoute(args:{permission:boolean;selectedId:string|null;activeId:string|null;available:readonly AudioInput[]}):AudioRouteResult{
  if(!args.permission)return {status:'needs-permission'};
  if(!args.selectedId)return {status:'not-selected'};
  const input=args.available.find(x=>x.id===args.selectedId);
  if(!input||!input.available)return {status:'disconnected'};
  if(!['built-in','bluetooth-hfp','wired','usb'].includes(input.kind))return {status:'unsupported'};
  if(input.id!==args.activeId)return {status:'route-rejected'};
  return{status:'active',input};
}
/** Route changes must stop capture until user reconfirms their input preference. */
export function shouldStopAudioCapture(before:AudioRouteResult,after:AudioRouteResult):boolean{
  return before.status==='active'&&(after.status!=='active'||before.input.id!==after.input.id);
}
