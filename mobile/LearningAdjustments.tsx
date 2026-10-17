/** Learner-directed adult accessibility controls. No diagnosis or health information. */
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import {defaultExperiencePreferences,validateExperiencePreferences,launchEligibility,
 type ExperiencePreferences,type CorrectionTiming,type InstructionFormat} from '@voicefirst/core';

const STORE_KEY='voicefirst.learning-experience.v1';
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderWidth:1,borderColor:'#2B435A',borderRadius:18,padding:17,gap:12,marginTop:12},title:{color:'#F2F7FC',fontSize:18,fontWeight:'700'},text:{color:'#A6BBD0',fontSize:12,lineHeight:19},heading:{color:'#89D4C5',fontSize:13,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8},action:{minHeight:44,borderRadius:10,padding:11,borderColor:'#89D4C5',borderWidth:1,justifyContent:'center'},active:{backgroundColor:'#22414A'},label:{color:'#F2F7FC',fontWeight:'600',fontSize:12},warn:{color:'#FFD99A',fontSize:12}});
function Toggle({label,chosen,onPress}:{label:string;chosen:boolean;onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected:chosen}} style={[s.action,chosen&&s.active]} onPress={onPress}><Text style={s.label}>{label}</Text></Pressable>;
}
export function LearningAdjustments({settings,onChange}:{settings:ExperiencePreferences;onChange:(next:ExperiencePreferences)=>void}){
  const [error,setError]=useState('');
  const saveQueue=useRef(Promise.resolve());
  useEffect(()=>{
    let active=true;
    void Storage.getItem(STORE_KEY).then(raw=>{
      if(!active)return;
      if(raw){try{onChange(validateExperiencePreferences(JSON.parse(raw)));}catch{setError('Se recuperaron opciones seguras; el archivo anterior no pudo interpretarse.');}}
    }).catch(()=>{if(active)setError('No se pudieron leer los ajustes del teléfono.');});
    return()=>{active=false;};
  },[]);
  const change=(patch:Partial<ExperiencePreferences>)=>{
    const next=validateExperiencePreferences({...settings,...patch,ageStage:'adult'});
    onChange(next);setError('');
    // Serialize writes to avoid losing a rapid change of options.
    saveQueue.current=saveQueue.current.catch(()=>undefined).then(()=>Storage.setItem(STORE_KEY,JSON.stringify(next)));
    void saveQueue.current.catch(()=>setError('No se pudo guardar la preferencia.'));
  };
  return <View style={s.wrap}>
    <Text style={s.title}>Preferencias de aprendizaje</Text>
    <Text style={s.text}>Disponibles para adultos neurodivergentes y neurotípicos, sin diagnóstico y sin modificar la dificultad del idioma.</Text>
    <Text style={s.heading}>Cuándo mostrar correcciones</Text>
    <View style={s.row}>{([['after-each-answer','En cada respuesta'],['after-exercise','Al finalizar el ejercicio'],['on-request','Cuando las pida']] as [CorrectionTiming,string][]).map(([value,label])=><Toggle key={value} label={label} chosen={settings.correctionTiming===value} onPress={()=>change({correctionTiming:value})}/>)}</View>
    <Text style={s.heading}>Cómo presentar las instrucciones</Text>
    <View style={s.row}>{([['one-step','Un paso a la vez'],['full-context','Contexto completo']] as [InstructionFormat,string][]).map(([value,label])=><Toggle key={value} label={label} chosen={settings.instructionFormat===value} onPress={()=>change({instructionFormat:value})}/>)}</View>
    <Text style={s.heading}>Ambiente visual</Text>
    <View style={s.row}><Toggle label="Baja estimulación" chosen={settings.sensoryPresentation==='calm'} onPress={()=>change({sensoryPresentation:'calm'})}/><Toggle label="Vista estándar" chosen={settings.sensoryPresentation==='standard'} onPress={()=>change({sensoryPresentation:'standard'})}/></View>
    {launchEligibility(settings)!=='adult-preview'&&<Text style={s.warn}>El perfil juvenil todavía exige controles de privacidad y validación antes de habilitarse.</Text>}
    {!!error&&<Text style={s.warn}>{error}</Text>}
    <Text style={s.text}>El formato y la corrección se aplican primero a la práctica contextual. Los adolescentes también tendrán controles individuales, pero su acceso todavía está en revisión. Sin recompensas por rachas obligatorias.</Text>
  </View>;
}
