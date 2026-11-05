/** Development-only internal C1/C2 content and optional local-audio reviewer. */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Pressable,Text,View,StyleSheet} from 'react-native';
import {advanceAdvancedRehearsal,advancedRehearsalCurrent,startAdvancedRehearsal,advancedStoryboardTopics,type AdvancedLevel,type AdvancedRehearsalState,type TargetLanguage} from '@voicefirst/core';
import {createAdvancedEditorialExpoPlayer} from './advanced-editorial-review-audio';
import {loadReviewAssets,type ReviewAssets} from './advanced-editorial-review-manifest';

const missing:ReviewAssets={kind:'missing',reason:'Sin audios locales.',verified:false};
export function AdvancedEditorialReview({known,target,onClose}:{
 known:TargetLanguage;target:TargetLanguage;onClose:()=>void
}){
 const player=useMemo(createAdvancedEditorialExpoPlayer,[]);
 const [level,setLevel]=useState<AdvancedLevel>('C1');
 const [topic,setTopic]=useState<string>('nuance-and-register');
 const [state,setState]=useState<AdvancedRehearsalState|null>(null);
 const [assets,setAssets]=useState<ReviewAssets>(missing);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const request=useRef(0);
 const step=advancedRehearsalCurrent(state);
 useEffect(()=>{
  let active=true;request.current++;player.stop();
  setStatus('');setBusy(false);setAssets(missing);
  const next=startAdvancedRehearsal(known,target,level,topic);
  setState(next);
  if(next)void loadReviewAssets(next.sceneId).then(data=>{if(active)setAssets(data);});
  return()=>{active=false;request.current++;player.stop();};
 },[known,target,level,topic,player]);
 useEffect(()=>{
  const sub=AppState.addEventListener('change',s=>{
   if(s!=='active'){request.current++;player.stop();setBusy(false);setStatus('Audio detenido al salir de la aplicación.');}
  });
  return()=>sub.remove();
 },[player]);
 const move=(command:'next'|'restart'|'reveal')=>{
  request.current++;player.stop();setBusy(false);setStatus('');
  setState(old=>advanceAdvancedRehearsal(old,command));
 };
 const play=async()=>{
  if(!state||assets.kind!=='candidate'||step?.kind!=='script-turn')return;
  const id=++request.current;setBusy(true);setStatus('');
  const outcome=await player.play(state,assets.clips);
  if(id!==request.current)return;
  setBusy(false);
  setStatus(outcome.status==='completed'?'Clip local escuchado; sin evaluación.':
   outcome.status==='unavailable'?'Audio no disponible o verificación fallida.':
   outcome.status==='cancelled'?'Reproducción detenida.':'La reproducción no pudo completarse.');
 };
 return <View style={styles.card}>
  <Text accessibilityRole="header" style={styles.title}>Laboratorio editorial C1–C2</Text>
  <Text style={styles.note}>SOLO DESARROLLO. Borradores sin revisión humana. No calificamos ni guardamos respuestas. Micrófono desactivado.</Text>
  <View style={styles.row}>{(['C1','C2'] as const).map(v=><Pressable key={v} accessibilityRole="button" onPress={()=>{setLevel(v);setTopic(advancedStoryboardTopics[v][0]);}} style={styles.button}><Text style={styles.buttonText}>{v}</Text></Pressable>)}</View>
  <View style={styles.row}>{advancedStoryboardTopics[level].map(t=><Pressable key={t} accessibilityRole="button" onPress={()=>setTopic(t)} style={styles.button}><Text style={styles.buttonText}>{t}</Text></Pressable>)}</View>
  <Text style={styles.note}>Idioma de ayuda: {known} · objetivo: {target}. Avance editorial: {state?.cursor??0}/10. Nivel {level}.</Text>
  {step?.kind==='script-turn'&&<><Text style={styles.line}>Interlocutor: {step.speaker==='speaker-a'?'A':'B'}</Text><Text style={styles.line}>{step.text}</Text></>}
  {step?.kind==='evidence-question'&&<><Text style={styles.line}>{step.question}</Text>{step.evidenceRevealed?<Text style={styles.note}>Evidencia: {step.evidence}. Interpretación: {step.supportedInterpretation}. No respaldada: {step.unsupportedInterpretation}</Text>:<Pressable accessibilityRole="button" onPress={()=>move('reveal')} style={styles.button}><Text style={styles.buttonText}>Mostrar evidencia</Text></Pressable>}</>}
  {step?.kind==='follow-up'&&<><Text style={styles.line}>{step.spokenPrompt}</Text><Text style={styles.note}>Sin micrófono: {step.withoutMicrophone}</Text></>}
  {step?.kind==='complete'&&<Text style={styles.note}>Revisión terminada. No se registró progreso del alumno.</Text>}
  <Text style={styles.note}>{assets.kind==='candidate'?'Manifiesto local encontrado. Los bytes se verifican al reproducir.':assets.reason}</Text>
  {step?.kind==='script-turn'&&assets.kind==='candidate'&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>{void play();}} style={styles.button}><Text style={styles.buttonText}>{busy?'Comprobando audio…':'Verificar y escuchar clip'}</Text></Pressable>}
  {!!status&&<Text accessibilityRole="alert" style={styles.note}>{status}</Text>}
  <View style={styles.row}>
   <Pressable accessibilityRole="button" onPress={()=>move('next')} style={styles.button}><Text style={styles.buttonText}>Siguiente</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>move('restart')} style={styles.button}><Text style={styles.buttonText}>Reiniciar</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{request.current++;player.stop();onClose();}} style={styles.button}><Text style={styles.buttonText}>Cerrar revisión</Text></Pressable>
  </View>
 </View>;
}
const styles=StyleSheet.create({
 card:{padding:16,gap:10,borderRadius:18,backgroundColor:'#28273B',borderWidth:1,borderColor:'#B0A5DD'},
 title:{color:'#E9DFFC',fontSize:19,fontWeight:'700'},note:{color:'#D2CCE6',fontSize:13,lineHeight:19},
 line:{color:'#FFFFFF',fontSize:16,lineHeight:23},row:{flexDirection:'row',gap:8,flexWrap:'wrap'},
 button:{padding:11,borderRadius:12,borderWidth:1,borderColor:'#D6BFEE',minHeight:44,justifyContent:'center'},
 buttonText:{color:'#F0E0FF',fontSize:14,fontWeight:'600'}
});
