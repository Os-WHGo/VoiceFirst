/** One source of truth for adult learning preferences across every lesson screen.
 * No diagnoses, voice data or transcripts. Preserve unreadable data rather than overwriting it.
 */
import {useEffect,useRef,useState} from 'react';
import Storage from 'expo-sqlite/kv-store';
import {defaultExperiencePreferences,launchEligibility,validateExperiencePreferences,type ExperiencePreferences} from '@voicefirst/core';
export const LEARNING_PREFERENCES_KEY='voicefirst.learning-experience.v1';
export function useLearningPreferences(){
 const [settings,setSettings]=useState<ExperiencePreferences>(defaultExperiencePreferences);
 const [phase,setPhase]=useState<'loading'|'ready'|'blocked'>('loading');
 const [error,setError]=useState('');
 const writer=useRef(Promise.resolve());
 useEffect(()=>{
  let live=true;
  void Storage.getItem(LEARNING_PREFERENCES_KEY).then(raw=>{
   if(!live)return;
   if(raw!==null){
    let parsed:unknown;
    try{parsed=JSON.parse(raw);}catch{setError('Las preferencias guardadas están dañadas. No las sobrescribiremos.');setPhase('blocked');return;}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)){setError('Preferencias almacenadas incompatibles. No se han sobrescrito.');setPhase('blocked');return;}
    const next=validateExperiencePreferences(parsed);
    if(launchEligibility(next)!=='adult-preview'){setError('El perfil menor de edad exige revisión de privacidad antes de usar el curso.');setPhase('blocked');return;}
    setSettings(next);
   }
   setPhase('ready');
  }).catch(()=>{if(live){setError('No se pudo leer la configuración local. No se modificaron los datos.');setPhase('blocked');}});
  return()=>{live=false;};
 },[]);
 const change=(next:ExperiencePreferences)=>{
  if(phase!=='ready')return;
  const safe=validateExperiencePreferences(next);
  if(launchEligibility(safe)!=='adult-preview'){setError('Los perfiles infantiles y adolescentes no están habilitados en esta beta.');return;}
  setSettings(safe);
  writer.current=writer.current.catch(()=>undefined).then(()=>Storage.setItem(LEARNING_PREFERENCES_KEY,JSON.stringify(safe)));
  void writer.current.catch(()=>{setError('Falló el guardado. Detuvimos la edición para proteger los ajustes anteriores.');setPhase('blocked');});
 };
 return {settings,phase,error,change};
}
