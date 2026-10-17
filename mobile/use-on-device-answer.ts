/** Foreground-only, strictly on-device speech input for curated learning tasks.
 * Never requests a cloud fallback. Unsupported devices show an honest disabled state.
 * No storage of audio or transcript. This is NOT a pronunciation assessor.
 */
import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import type {TargetLanguage} from '@voicefirst/core';

type Subscription={remove:()=>void};
type NativeRecognition={
  isRecognitionAvailable:()=>boolean;supportsOnDeviceRecognition:()=>boolean;
  requestMicrophonePermissionsAsync:()=>Promise<{granted:boolean}>;
  addListener:(event:string,callback:(event:any)=>void)=>Subscription;
  start:(opts:{lang:string;requiresOnDeviceRecognition:true;interimResults:boolean;continuous:false;maxAlternatives:1})=>void;
  abort:()=>void;
  androidTriggerOfflineModelDownload?:(opts:{locale:string})=>Promise<{status:string}>;
};
const locale:Readonly<Record<TargetLanguage,string>>={
  'en-CA':'en-CA','fr-CA':'fr-CA',es:'es-ES','pt-BR':'pt-BR',de:'de-DE',it:'it-IT'
};
function getRecognizer():NativeRecognition|null{
  try{
    const native=require('expo-speech-recognition').ExpoSpeechRecognitionModule as NativeRecognition;
    if(native?.isRecognitionAvailable() && native.supportsOnDeviceRecognition())return native;
  }catch{}
  return null;
}
export type DictationResult={text:string;confidence:'high'|'unknown'};
export function useOnDeviceAnswer(language:TargetLanguage,onFinal:(r:DictationResult,exerciseId:string)=>void){
  const [native,setNative]=useState<NativeRecognition|null>(null);
  const [listening,setListening]=useState(false);
  const [issue,setIssue]=useState('');
  const current=useRef<string|null>(null);
  const callback=useRef(onFinal);callback.current=onFinal;
  useEffect(()=>{setNative(getRecognizer());},[]);
  const stop=useCallback(()=>{
    current.current=null;setListening(false);
    try{native?.abort();}catch{}
  },[native]);
  useEffect(()=>{
    const state=AppState.addEventListener('change',value=>{if(value!=='active')stop();});
    return()=>state.remove();
  },[stop]);
  useEffect(()=>{
    if(!native)return;
    const subs=[
      native.addListener('result',e=>{
        if(!current.current||!e.isFinal)return;
        const id=current.current;current.current=null;setListening(false);
        const transcript=e.results?.[0]?.transcript;
        if(typeof transcript!=='string'||!transcript.trim()){setIssue('No se entendió ninguna palabra. Prueba nuevamente.');return;}
        const confidence=e.results?.[0]?.confidence;
        const level=typeof confidence==='number'&&Number.isFinite(confidence)&&confidence>=0.75?'high':'unknown';
        callback.current({text:transcript.trim(),confidence:level},id);
      }),
      native.addListener('error',()=>{
        if(!current.current)return;
        current.current=null;setListening(false);
        setIssue('No se pudo reconocer la voz localmente. El ejercicio sigue disponible por texto.');
      }),
      native.addListener('end',()=>{current.current=null;setListening(false);}),
    ];
    return()=>subs.forEach(x=>x.remove());
  },[native,language]);
  const start=useCallback(async(exerciseId:string)=>{
    if(!native){setIssue('Este teléfono no dispone de reconocimiento totalmente local para la clase.');return false;}
    if(current.current)return false;
    setIssue('');
    try{
      const permission=await native.requestMicrophonePermissionsAsync();
      if(!permission.granted){setIssue('Autoriza el micrófono para responder hablando.');return false;}
      current.current=exerciseId;setListening(true);
      native.start({lang:locale[language],requiresOnDeviceRecognition:true,interimResults:false,continuous:false,maxAlternatives:1});
      return true;
    }catch{
      current.current=null;setListening(false);
      setIssue('No existe modelo de reconocimiento local compatible con este idioma. No se envió audio a Internet.');
      return false;
    }
  },[native,language]);
  const downloadModel=useCallback(async()=>{
    if(Platform.OS!=='android'||!native?.androidTriggerOfflineModelDownload)return;
    try{const r=await native.androidTriggerOfflineModelDownload({locale:locale[language]});setIssue('Modelo local: '+r.status+'; verifica su disponibilidad antes de comenzar.');}
    catch{setIssue('No fue posible iniciar la descarga del modelo de voz local.');}
  },[native,language]);
  return {available:!!native,listening,issue,start,stop,downloadModel,
    canDownload:!!native&&Platform.OS==='android'&&!!native.androidTriggerOfflineModelDownload};
}
