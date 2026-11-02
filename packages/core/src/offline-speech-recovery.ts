/** Conservative user-facing recovery for native on-device ASR failures.
 * A recognizer error is NEVER a wrong answer, a pronunciation score, or
 * permission to send audio/transcripts to the network.
 */
export type OfflineSpeechRecovery='none'|'retry'|'check-model'|'permission'|'wait'|'text';
export interface OfflineSpeechFailure {
 readonly recovery:OfflineSpeechRecovery;
 readonly message:string;
}
const fallback:OfflineSpeechFailure=Object.freeze({
 recovery:'text',
 message:'No se pudo reconocer la voz localmente. Puedes continuar por texto o volver a intentarlo.',
});
/** Maps documented expo-speech-recognition error codes, never native free-text.
 * A retry still requires a fresh explicit start after the terminal native end.
 */
export function offlineSpeechFailure(event:unknown):OfflineSpeechFailure {
 const code=event&&typeof event==='object'&&!Array.isArray(event)
  ?(event as {error?:unknown}).error:undefined;
 switch(code){
  case 'aborted':return {recovery:'none',message:''};
  case 'no-speech':case 'speech-timeout':return {
   recovery:'retry',message:'No se detectó una respuesta. Puedes intentarlo de nuevo o escribirla.'
  };
  case 'language-not-supported':return {
   recovery:'check-model',message:'El idioma no está disponible para reconocimiento local. Comprueba o prepara su modelo y continúa por texto mientras tanto.'
  };
  case 'not-allowed':return {
   recovery:'permission',message:'El sistema no autorizó el micrófono o el reconocimiento. Revisa los permisos y continúa por texto si lo prefieres.'
  };
  case 'busy':case 'too-many-requests':case 'interrupted':case 'audio-capture':
   return {recovery:'wait',message:'El micrófono está ocupado o se interrumpió. Espera a que termine el turno anterior y vuelve a intentarlo.'};
  case 'network':case 'service-not-allowed':
   return {recovery:'text',message:'El servicio de reconocimiento local no está disponible. VoiceFirst no enviará tu voz a Internet; continúa por texto.'};
  default:return fallback;
 }
}
