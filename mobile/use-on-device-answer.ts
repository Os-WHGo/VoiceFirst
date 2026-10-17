/** One mic owner for all curated learning screens. On-device only, foreground only.
 * No recording persistence, remote recognition, transcript storage or cloud fallback.
 * Expo native module requires a development build and available language models.
 */
import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import type {TargetLanguage} from '@voicefirst/core';
type Subscription={remove:()=>void};
type NativeRecognition={
 isRecognitionAvailable:()=>boolean; supportsOnDeviceRecognition:()=>boolean;
 requestMicrophonePermissionsAsync:()=>Promise<{granted:boolean}>;
 addListener:(event:string,callback:(event:any)=>void)=>Subscription;
 start:(opts:{lang:string;requiresOnDeviceRecognition:true;interimResults:boolean;continuous:false;maxAlternatives:1;recordingOptions:{persist:false}})=>void;
 abort:()=>void;
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

export function useOnDeviceAnswer(language:TargetLanguage,
 onFinal:(r:DictationResult,exerciseId:string)=>void,
 onPartial?:(text:string,exerciseId:string)=>void){
 const [native,setNative]=useState<NativeRecognition|null>(null);
 const [listening,setListening]=useState(false);
 const [issue,setIssue]=useState('');
 const active=useRef<{id:string;token:number}|null>(null);
 const epoch=useRef(0);
 const requesting=useRef(false);
 const mounted=useRef(true);
 const owner=useRef<Owner|null>(null);
 const callbacks=useRef({onFinal,onPartial});
 callbacks.current={onFinal,onPartial};
 useEffect(()=>{setNative(getRecognizer());},[]);
 const stop=useCallback(()=>{
  epoch.current++;
  active.current=null;
  requesting.current=false;
  if(microphoneOwner===owner.current){
   microphoneOwner=null;
   try{native?.abort();}catch{/* A closed recognizer can throw. */}
  }
  owner.current=null;
  if(mounted.current)setListening(false);
 },[native]);
 useEffect(()=>{
  mounted.current=true;
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')stop();});
  return()=>{mounted.current=false;stop();sub.remove();};
 },[stop]);
 useEffect(()=>{
  if(!native)return;
  const subs:Subscription[]=[
   native.addListener('result',event=>{
    const captured=active.current;
    if(!captured || microphoneOwner!==owner.current)return;
    const spoken=event.results?.[0]?.transcript;
    if(typeof spoken!=='string'||!spoken.trim())return;
    if(!event.isFinal){callbacks.current.onPartial?.(spoken.trim(),captured.id);return;}
    active.current=null;owner.current=null;microphoneOwner=null;setListening(false);
    const confidence=event.results?.[0]?.confidence;
    callbacks.current.onFinal({text:spoken.trim(),confidence:typeof confidence==='number'&&Number.isFinite(confidence)&&confidence>=0.75?'high':'unknown'},captured.id);
   }),
   native.addListener('error',()=>{
    if(!active.current||microphoneOwner!==owner.current)return;
    active.current=null;owner.current=null;microphoneOwner=null;setListening(false);
    setIssue('No se pudo reconocer la voz localmente. Continúa por texto o vuelve a intentarlo.');
   }),
   native.addListener('end',()=>{
    if(!active.current||microphoneOwner!==owner.current)return;
    active.current=null;owner.current=null;microphoneOwner=null;setListening(false);
   }),
  ];
  return()=>subs.forEach(sub=>sub.remove());
 },[native,language]);
 const start=useCallback(async(exerciseId:string):Promise<boolean>=>{
  if(!native){setIssue('Este dispositivo no dispone de reconocimiento local compatible.');return false;}
  if(requesting.current||active.current)return false;
  setIssue('');
  const token=++epoch.current;requesting.current=true;
  try{
   const permission=await native.requestMicrophonePermissionsAsync();
   if(epoch.current!==token||AppState.currentState!=='active')return false;
   if(!permission.granted){setIssue('Autoriza el micrófono para practicar hablando.');return false;}
   if(microphoneOwner && microphoneOwner!==owner.current)microphoneOwner.stop();
   const ours:Owner={stop};owner.current=ours;microphoneOwner=ours;
   active.current={id:exerciseId,token};setListening(true);
   native.start({lang:locale[language],requiresOnDeviceRecognition:true,interimResults:true,continuous:false,maxAlternatives:1,recordingOptions:{persist:false}});
   return true;
  }catch{
   if(epoch.current===token){
    if(microphoneOwner===owner.current)microphoneOwner=null;
    owner.current=null;active.current=null;setListening(false);
    setIssue('Este idioma necesita un modelo local compatible. Ningún audio se envió a nuestros servidores.');
   }
   return false;
  }finally{if(epoch.current===token)requesting.current=false;}
 },[native,language,stop]);
 const downloadModel=useCallback(async()=>{
  if(Platform.OS!=='android'||!native?.androidTriggerOfflineModelDownload)return;
  try{
   const response=await native.androidTriggerOfflineModelDownload({locale:locale[language]});
   setIssue('Modelo local: '+response.status+'. Comprueba disponibilidad antes de iniciar.');
  }catch{setIssue('No se pudo solicitar el modelo local para este idioma.');}
 },[native,language]);
 return {available:!!native,listening,issue,start,stop,downloadModel,
  canDownload:!!native&&Platform.OS==='android'&&!!native.androidTriggerOfflineModelDownload};
}
