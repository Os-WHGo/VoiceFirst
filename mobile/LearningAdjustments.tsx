/** Adult-friendly learning preferences, controlled from App's single persisted store. */
import React from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {type ExperiencePreferences,type CorrectionTiming,type InstructionFormat} from '@voicefirst/core';
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderWidth:1,borderColor:'#2B435A',borderRadius:18,padding:17,gap:12,marginTop:12},title:{color:'#F2F7FC',fontSize:18,fontWeight:'700'},text:{color:'#A6BBD0',fontSize:12,lineHeight:19},heading:{color:'#89D4C5',fontSize:13,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8},action:{minHeight:44,borderRadius:10,padding:11,borderColor:'#89D4C5',borderWidth:1,justifyContent:'center'},active:{backgroundColor:'#22414A'},label:{color:'#F2F7FC',fontWeight:'600',fontSize:12}});
function Toggle({label,chosen,onPress}:{label:string;chosen:boolean;onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected:chosen}} style={[s.action,chosen&&s.active]} onPress={onPress}><Text style={s.label}>{label}</Text></Pressable>;
}
export function LearningAdjustments({settings,onChange}:{settings:ExperiencePreferences;onChange:(next:ExperiencePreferences)=>void}){
 const change=(patch:Partial<ExperiencePreferences>)=>onChange({...settings,...patch});
 return <View style={s.wrap}>
  <Text style={s.title}>Preferencias de aprendizaje</Text>
  <Text style={s.text}>Una sola configuración para clases y diálogos, elegida por ti sin diagnóstico. Sin límites artificiales de nivel por edad.</Text>
  <Text style={s.heading}>Cuándo mostrar correcciones</Text>
  <View style={s.row}>{([['after-each-answer','En cada respuesta'],['after-exercise','Al finalizar el ejercicio'],['on-request','Cuando las pida']] as [CorrectionTiming,string][]).map(([value,label])=><Toggle key={value} label={label} chosen={settings.correctionTiming===value} onPress={()=>change({correctionTiming:value})}/>)}</View>
  <Text style={s.heading}>Cómo presentar las instrucciones</Text>
  <View style={s.row}>{([['one-step','Un paso a la vez'],['full-context','Contexto completo']] as [InstructionFormat,string][]).map(([value,label])=><Toggle key={value} label={label} chosen={settings.instructionFormat===value} onPress={()=>change({instructionFormat:value})}/>)}</View>
  <Text style={s.heading}>Presentación visual</Text>
  <View style={s.row}><Toggle label="Baja estimulación" chosen={settings.sensoryPresentation==='calm'} onPress={()=>change({sensoryPresentation:'calm'})}/><Toggle label="Vista estándar" chosen={settings.sensoryPresentation==='standard'} onPress={()=>change({sensoryPresentation:'standard'})}/></View>
  <Text style={s.heading}>Ritmo y control de turnos</Text>
  <View style={s.row}><Toggle label="Voz pausada" chosen={settings.speechRate<0.95} onPress={()=>change({speechRate:0.8})}/><Toggle label="Voz normal" chosen={settings.speechRate>=0.95} onPress={()=>change({speechRate:1})}/><Toggle label="Responder cuando yo decida" chosen={settings.answerControl==='wait-for-me'} onPress={()=>change({answerControl:'wait-for-me'})}/><Toggle label="Continuar tras mi respuesta" chosen={settings.answerControl==='auto-after-silence'} onPress={()=>change({answerControl:'auto-after-silence'})}/></View>
  <Text style={s.heading}>Lectura y continuidad</Text>
  <View style={s.row}><Toggle label="Mostrar transcripción" chosen={settings.subtitles} onPress={()=>change({subtitles:!settings.subtitles})}/><Toggle label="Retomar último paso" chosen={settings.returnToLastStep} onPress={()=>change({returnToLastStep:!settings.returnToLastStep})}/></View>
  <Text style={s.text}>La continuación por voz exige un modelo local compatible y no habilita escucha con pantalla bloqueada. No se almacenan diagnósticos ni grabaciones en estas preferencias.</Text>
 </View>;
}
