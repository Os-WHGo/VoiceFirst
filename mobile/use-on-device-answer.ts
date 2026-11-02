/** One mic owner for all curated learning screens. On-device only, foreground only.
 * No recording persistence, remote recognition, transcript storage or cloud fallback.
 * Expo native module requires a development build and available language models.
 */
import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import {readNativeInputSnapshot,observeNativeInputChanges} from './native-input-route';
import {classifyVoiceConfidence,offlineSpeechFailure,queryLocalModelState,NativeSpeechSessionGate,newNativeCaptureEvidence,recordNativeCaptureSignal,shouldInterruptForInputRouteChange,type NativeInputSnapshot,type NativeCaptureEvidence,type LocalModelState,type TargetLanguage} from '@voicefirst/core';
type Subscription={remove:()=>void};
// Derive the Android locale query contract from the installed package.
type NativeLocaleOptions=Parameters<typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule']['getSupportedLocales']>[0];
type NativeLocales=Awaited<ReturnType<typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule']['getSupportedLocales']>>;
type NativeRecognition={
 isRecognitionAvailable:()=>boolean; supportsOnDeviceRecognition:()=>boolean;
 requestMicrophonePermissionsAsync:()=>Promise<{granted:boolean}>;
 addListener:(event:string,callback:(event:any)=>void)=>Subscription;
 start:(opts:{lang:string;requiresOnDeviceRecognition:true;interimResults:boolean;continuous:false;maxAlternatives:1;recordingOptions:{persist:false};iosCategory:{category:'playAndRecord';categoryOptions:string[];mode:'measurement'}})=>void;
 abort:()=>void;
 getSupportedLocales?:(options:NativeLocaleOptions)=>Promise<NativeLocales>;
 androidTriggerOfflineModelDownload?:(opts:{locale:string})=>Promise<{status:string}>;
};
const locale:Readonly<Record<TargetLanguage,string>>={
 'en-CA':'en-CA','fr-CA':'fr-CA',es:'es-ES','pt-BR':'pt-BR',de:'de-DE',it:'it-IT'
};
function getRecognizer():NativeRecognition|null{
 try{
  const api=require('expo-speech-recognition').ExpoSpeechRecognitionModule as NativeRecognition;
  if(api?.isRecognitionAvailable()&&api.supportsOnDeviceRecognition())return api;
 }catch{/* Native plugin may not exist in Expo Go. */}
 return null;
}
export type DictationResult={text:string;confidence:'high'|'unknown'};
type Owner={stop:()=>void};
let microphoneOwner:Owner|null=null;
// Native events have no request ID. Wait for the terminal `end` event before
// treating a later result as a new listening turn.
const nativeSessionGate=new NativeSpeechSessionGate();

export function useOnDeviceAnswer(language:TargetLanguage,
 onFinal:(r:DictationResult,exerciseId:string)=>void,
 onPartial?:(text:string,exerciseId:string)=>void){
 const [native,setNative]=useState<NativeRecognition|null>(null);
 const [listening,setListening]=useState(false);
 const [capturePhase,setCapturePhase]=useState<'idle'|'requested'|'capturing'|'processing'>('idle');
 const [issue,setIssue]=useState('');
 const [modelReport,setModelReport]=useState<{locale:string;value:LocalModelState}>({locale:'',value:'unknown'});
 const model=modelReport.locale===locale[language]?modelReport.value:'unknown';
 const probeEpoch=useRef(0);
 const languageRef=useRef(language);languageRef.current=language;
 const [checkingModel,setCheckingModel]=useState(false);
 const active=useRef<{id:string;token:number}|null>(null);
 const captureEvidence=useRef<NativeCaptureEvidence|null>(null);
 const observedInput=useRef<NativeInputSnapshot|null>(null);
 const routeUnsubscribe=useRef<(()=>void)|null>(null);
 const routeProbe=useRef(0);
 const epoch=useRef(0);
 const requesting=useRef(false);
 const mounted=useRef(true);
 const owner=useRef<Owner|null>(null);
 const callbacks=useRef({onFinal,onPartial});
 callbacks.current={onFinal,onPartial};
 useEffect(()=>{setNative(getRecognizer());},[]);
 const checkModel=useCallback(async()=>{
  const token=++probeEpoch.current;
  const requestedLocale=locale[language];
  if(Platform.OS!=='android'||!native?.getSupportedLocales){
   if(mounted.current){setModelReport({locale:requestedLocale,value:'unknown'});setCheckingModel(false);}
   return;
  }
  setCheckingModel(true);
  const status=await queryLocalModelState(requestedLocale,
   ()=>native.getSupportedLocales!({}),
   ()=>mounted.current&&probeEpoch.current===token&&languageRef.current===language);
  if(status!==null){
   setModelReport({locale:requestedLocale,value:status});
   setCheckingModel(false);
  }
 },[native,language]);
 useEffect(()=>{
  void checkModel();
  return()=>{probeEpoch.current++;};
 },[checkModel]);
 const releaseRouteWatch=useCallback(()=>{
  routeProbe.current++;
  const unsubscribe=routeUnsubscribe.current;
  routeUnsubscribe.current=null;
  observedInput.current=null;
  try{unsubscribe?.();}catch{/* Native cleanup must not hold a turn open. */}
 },[]);
 const stop=useCallback(()=>{
  releaseRouteWatch();
  epoch.current++;
  const wasListening=active.current!==null;
  active.current=null;
  captureEvidence.current=null;
  setCapturePhase('idle');
  requesting.current=false;
  if(owner.current&&microphoneOwner===owner.current){
   microphoneOwner=null;
   if(wasListening){
    // Keep the native gate closed until the OS signals session termination.
    try{native?.abort();}catch{/* Fail closed until an end event arrives. */}
   }
  }
  owner.current=null;
  if(mounted.current)setListening(false);
 },[native,releaseRouteWatch]);
 const startRouteWatch=useCallback(async(token:number)=>{
  // Observe AFTER audiostart so the expected HFP switch during startup
  // is not counted as a mid-turn interruption.
  const probe=++routeProbe.current;
  const initial=await readNativeInputSnapshot();
  if(!initial||routeProbe.current!==probe||!mounted.current||
     active.current?.token!==token||AppState.currentState!=='active')return;
  observedInput.current=initial;
  const unsubscribe=observeNativeInputChanges(next=>{
   if(!mounted.current||routeProbe.current!==probe||active.current?.token!==token||
      AppState.currentState!=='active')return;
   const previous=observedInput.current;
   observedInput.current=next;
   if(shouldInterruptForInputRouteChange(previous,next)){
    stop();
    setIssue('Cambió la entrada de audio durante la práctica. Se canceló esta respuesta; comprueba el micrófono y vuelve a intentarlo.');
   }
  });
  // The native emitter can invoke a callback synchronously during registration.
  // If that invalidates the turn, unsubscribe the newly returned listener
  // immediately rather than storing an orphaned observer after stop().
  if(routeProbe.current!==probe||!mounted.current||
     active.current?.token!==token||AppState.currentState!=='active'){
   try{unsubscribe();}catch{/* Native teardown is best-effort. */}
   return;
  }
  routeUnsubscribe.current=unsubscribe;
  // Close the read-to-subscribe gap: an input may disappear after the first
  // snapshot but before the native listener is installed. Resample now that
  // changes are observed. An unreadable second sample also fails closed.
  const afterSubscription=await readNativeInputSnapshot();
  if(!mounted.current||routeProbe.current!==probe||active.current?.token!==token||
     AppState.currentState!=='active')return;
  if(shouldInterruptForInputRouteChange(observedInput.current,afterSubscription)){
   stop();
   setIssue('Cambió la entrada de audio durante la práctica. Se canceló esta respuesta; comprueba el micrófono y vuelve a intentarlo.');
  }else{
   observedInput.current=afterSubscription;
  }
 },[stop]);
 useEffect(()=>{
  mounted.current=true;
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')stop();});
  return()=>{mounted.current=false;stop();sub.remove();};
 },[stop]);
 // A locale change invalidates the old mic turn before another lesson can start.
 // Otherwise a late native result could be attributed to the newly selected language.
 useEffect(()=>{stop();},[language,stop]);
 useEffect(()=>{
  if(!native)return;
  const subs:Subscription[]=[
   // Native audio start confirms only the recognizer's capture lifecycle,
   // never whether samples came from a headset, phone, or Meta glasses.
   native.addListener('audiostart',event=>{
    if(!active.current||!mounted.current||microphoneOwner!==owner.current||
       AppState.currentState!=='active'||nativeSessionGate.canStart())return;
    const previous=captureEvidence.current;
    if(!previous)return;
    const next=recordNativeCaptureSignal(previous,'audiostart',event?.timestamp);
    captureEvidence.current=next;
    if(next.discontinuity){
     stop();setIssue('La captura de audio se reinició o cambió de ruta. Comprueba el micrófono e inténtalo otra vez.');
     return;
    }
    setCapturePhase('capturing');
    void startRouteWatch(active.current.token);
   }),
   native.addListener('audioend',event=>{
    if(!active.current||!mounted.current||microphoneOwner!==owner.current||
       nativeSessionGate.canStart())return;
    const previous=captureEvidence.current;
    if(!previous)return;
    const next=recordNativeCaptureSignal(previous,'audioend',event?.timestamp);
    captureEvidence.current=next;
    if(next.discontinuity){
     stop();setIssue('Se detectó una discontinuidad del audio. No se ha registrado respuesta; puedes volver a intentarlo.');
     return;
    }
    // Capture is over; route changes during local transcription must not
    // discard already captured speech. Native 'end' still owns the gate.
    releaseRouteWatch();
    setListening(false);setCapturePhase('processing');
   }),
   native.addListener('nomatch',()=>{
    if(!active.current||!mounted.current||microphoneOwner!==owner.current||
       nativeSessionGate.canStart())return;
    releaseRouteWatch();
    active.current=null;captureEvidence.current=null;
    owner.current=null;microphoneOwner=null;
    setListening(false);setCapturePhase('idle');
    setIssue('No se reconoció una respuesta. Puedes volver a hablar o continuar por texto.');
    // Do not unlock the native gate; wait for 'end'.
   }),
   native.addListener('result',event=>{
    const captured=active.current;
    if(!captured||!mounted.current||languageRef.current!==language||
       AppState.currentState!=='active'||microphoneOwner!==owner.current||
       nativeSessionGate.canStart())return;
    const spoken=event.results?.[0]?.transcript;
    if(typeof spoken!=='string'||!spoken.trim())return;
    if(!event.isFinal){callbacks.current.onPartial?.(spoken.trim(),captured.id);return;}
    releaseRouteWatch();
    active.current=null;captureEvidence.current=null;owner.current=null;microphoneOwner=null;setListening(false);setCapturePhase('idle');
    const confidence=event.results?.[0]?.confidence;
    callbacks.current.onFinal({text:spoken.trim(),confidence:classifyVoiceConfidence(confidence)},captured.id);
   }),
   native.addListener('error',event=>{
    if(!active.current||microphoneOwner!==owner.current)return;
    releaseRouteWatch();
    active.current=null;captureEvidence.current=null;owner.current=null;microphoneOwner=null;setListening(false);setCapturePhase('idle');
    // Do not grade errors or silently retry. Keep the native gate closed
    // until the platform emits its terminal 'end' event.
    const failure=offlineSpeechFailure(event);
    if(failure.recovery!=='none')setIssue(failure.message);
   }),
   native.addListener('end',()=>{
    const hadActive=active.current!==null&&microphoneOwner===owner.current;
    const hadNativeStart=(captureEvidence.current?.audioStarts??0)>0;
    nativeSessionGate.end();
    if(!hadActive)return;
    // A terminal end with no result/error/nomatch must never be marked as
    // completed learning evidence or leave a phantom listening state.
    releaseRouteWatch();
    active.current=null;captureEvidence.current=null;owner.current=null;microphoneOwner=null;
    setListening(false);setCapturePhase('idle');
    setIssue(hadNativeStart
     ?'La escucha terminó sin respuesta reconocida. Puedes reintentar o continuar por texto.'
     :'El micrófono no llegó a iniciar la captura. Comprueba los permisos y reinténtalo.');
   }),
  ];
  return()=>subs.forEach(sub=>sub.remove());
 },[native,language,stop,startRouteWatch,releaseRouteWatch]);
 const start=useCallback(async(exerciseId:string):Promise<boolean>=>{
  if(!mounted.current||languageRef.current!==language||AppState.currentState!=='active')return false;
  if(!native){setIssue('Este dispositivo no dispone de reconocimiento local compatible.');return false;}
  if(Platform.OS==='android'&&model==='missing'){
   setIssue('El idioma elegido figura como disponible pero no instalado para reconocer voz offline. Instala el modelo y comprueba de nuevo.');
   return false;
  }
  if(requesting.current||active.current)return false;
  // Reserve ownership BEFORE a potentially long permission prompt. A second
  // learner view may cancel our pending request, which must then fail closed.
  if(microphoneOwner&&microphoneOwner!==owner.current)microphoneOwner.stop();
  if(!nativeSessionGate.canStart()){
   setIssue('El reconocimiento anterior todavía se está cerrando. Espera a que termine e inténtalo de nuevo.');
   return false;
  }
  setIssue('');
  const token=++epoch.current;
  const ours:Owner={stop};
  owner.current=ours;microphoneOwner=ours;
  requesting.current=true;
  let begun=false;
  let failurePhase:'permission'|'recognition'='permission';
  try{
   const permission=await native.requestMicrophonePermissionsAsync();
   if(epoch.current!==token||owner.current!==ours||microphoneOwner!==ours||
      !mounted.current||languageRef.current!==language||AppState.currentState!=='active')return false;
   if(!permission.granted){setIssue('Autoriza el micrófono para practicar hablando.');return false;}
   if(!nativeSessionGate.begin()){
    setIssue('La sesión nativa anterior no ha terminado. Inténtalo nuevamente.');
    return false;
   }
   begun=true;
   failurePhase='recognition';
   active.current={id:exerciseId,token};captureEvidence.current=newNativeCaptureEvidence();
   setListening(true);setCapturePhase('requested');
   native.start({lang:locale[language],requiresOnDeviceRecognition:true,interimResults:true,continuous:false,maxAlternatives:1,recordingOptions:{persist:false},
    iosCategory:{category:'playAndRecord',categoryOptions:['allowBluetooth','defaultToSpeaker'],mode:'measurement'}});
   return true;
  }catch{
   if(begun)nativeSessionGate.end(); // Only if native.start threw synchronously.
   if(epoch.current===token){
    releaseRouteWatch();
    active.current=null;captureEvidence.current=null;setListening(false);setCapturePhase('idle');
    setIssue(failurePhase==='permission'
     ?'No se pudo comprobar el permiso de micrófono. Revisa los ajustes del dispositivo y vuelve a intentarlo.'
     :'No se pudo iniciar el reconocimiento local. Comprueba que el modelo del idioma esté disponible o continúa por texto.');
   }
   return false;
  }finally{
   if(epoch.current===token)requesting.current=false;
   if(active.current?.token!==token&&microphoneOwner===ours){
    microphoneOwner=null;owner.current=null;
   }
  }
 },[native,language,stop,model]);
 const downloadModel=useCallback(async()=>{
  if(Platform.OS!=='android'||!native?.androidTriggerOfflineModelDownload)return;
  try{
   const response=await native.androidTriggerOfflineModelDownload({locale:locale[language]});
   if(!mounted.current||languageRef.current!==language)return;
   setIssue('Modelo local: '+response.status+'. Comprueba disponibilidad antes de iniciar.');
   if(response.status==='download_success')await checkModel();
  }catch{if(mounted.current&&languageRef.current===language)setIssue('No se pudo solicitar el modelo local para este idioma.');}
 },[native,language,checkModel]);
 return {available:!!native,listening,capturePhase,issue,model,checkingModel,checkModel,start,stop,downloadModel,
  // The current Expo speech-recognition adapter cannot read AVAudioSession
  // currentRoute or Android AudioManager's active input. Merely allowing
  // Bluetooth does not prove that a glasses or headset mic was selected.
  // Replace only after a tested, permission-scoped native route observer.
  audioInputEvidence:'unverified' as const,
  canDownload:!!native&&Platform.OS==='android'&&!!native.androidTriggerOfflineModelDownload};
}
