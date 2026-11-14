/** DEV-only A2–B2 six-turn editorial voice rehearsals. Human authoring
 * candidates, no scored lesson/progress, microphone, online service or
 * publication. System TTS does not prove offline or pronunciation quality.
 */
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import {
 a2B2EditorialRehearsalScenes,planA2B2EditorialVoiceRehearsal,
 type A2B2EditorialListeningTurn,type TargetLanguage
} from '@voicefirst/core';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';

export function A2B2EditorialPractice({known,target,rate}:{
 known:TargetLanguage;target:TargetLanguage;rate:number
}){
 const choices=a2B2EditorialRehearsalScenes.filter(scene=>scene.targetLanguage===target);
 const [selected,setSelected]=useState('');
 const [playing,setPlaying]=useState<string|null>(null);
 const [status,setStatus]=useState('');
 const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 const request=useRef(0);
 const stop=useCallback(()=>{
  request.current++;
  setPlaying(null);
  void stopCuratedVoice();
 },[]);
 const active=choices.find(scene=>scene.sceneId===selected)??choices[0];
 const plan=active?planA2B2EditorialVoiceRehearsal(known,target,active.sceneId):null;
 useEffect(()=>{
  stop();
  setRevealed({});
  setStatus('');
 },[target,known,active?.sceneId,rate,stop]);
 useEffect(()=>{
  const sub=AppState.addEventListener('change',next=>{
   if(next!=='active'){
    stop();
    setStatus('Ensayo de voz detenido al salir de primer plano.');
   }
  });
  return()=>{
   sub.remove();
   request.current++;
   void stopCuratedVoice();
  };
 },[stop]);
 const playTurn=(turn:A2B2EditorialListeningTurn)=>{
  stop();
  if(!__DEV__||AppState.currentState!=='active'){
   setStatus('El ensayo de voz solo funciona en primer plano de desarrollo.');
   return;
  }
  const token=++request.current;
  setPlaying(turn.audioId);
  setStatus('Voz del sistema para ensayo editorial; no se ha comprobado funcionamiento sin red.');
  void playCuratedVoice(turn.cue,rate,
   ()=>{if(token===request.current){
    setPlaying(null);setStatus('Turno reproducido con TTS. Sin evaluación ni progreso.');
   }},
   error=>{if(token===request.current){setPlaying(null);setStatus(error);}});
 };
 if(!__DEV__)return null;
 return <View style={styles.card}>
  <Text accessibilityRole="header" style={styles.header}>Ensayo de escucha A2–B2 · solo editorial</Text>
  <Text style={styles.note}>18 diálogos autorados y sin grabaciones originales. La voz del sistema es una prueba opcional, no un audio aprobado. No evalúa pronunciación ni guarda respuestas.</Text>
  {choices.length>0&&<View style={styles.buttons}>{choices.map(scene=>
   <Pressable key={scene.sceneId} accessibilityRole="button"
    accessibilityState={{selected:scene.sceneId===active?.sceneId}}
    onPress={()=>{
     stop();setSelected(scene.sceneId);setRevealed({});
     setStatus('Escena editorial cambiada; la reproducción anterior se detuvo.');
    }} style={styles.button}>
    <Text style={styles.buttonText}>{scene.level}: {scene.unitId}</Text>
   </Pressable>
  )}</View>}
  {!plan&&<Text style={styles.note}>Revisión disponible únicamente entre los tres idiomas de la primera selección, cuando idioma de ayuda y objetivo son distintos.</Text>}
  {plan&&<>
   <Text style={styles.note}>Idioma de ayuda: {known} · aprendizaje: {target}. Tema: {plan.unitId}. Estado: borrador, sin audio original.</Text>
   {plan.turns.map(turn=>{
    const after='turn-'+(turn.index+1);
    const check=plan.checks.find(item=>item.afterTurnId===after);
    return <View key={turn.audioId} style={styles.turn}>
     <Text style={styles.line}>Persona {turn.index%2===0?'A':'B'}: {turn.cue.text}</Text>
     <Pressable accessibilityRole="button" style={styles.button} onPress={()=>playTurn(turn)}>
      <Text style={styles.buttonText}>{playing===turn.audioId?'Reproduciendo TTS…':'Escuchar este turno con TTS'}</Text>
     </Pressable>
     {check&&<View>
      <Text style={styles.question}>{check.question}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={()=>{
       stop();setRevealed(current=>({...current,[after]:!current[after]}));
      }}>
       <Text style={styles.buttonText}>{revealed[after]?'Ocultar evidencia':'Mostrar evidencia exacta'}</Text>
      </Pressable>
      {revealed[after]&&<>
       <Text style={styles.note}>Fragmento respaldado: {check.verbatimEvidence}</Text>
       <Text style={styles.note}>Interpretación no respaldada: {check.unsupportedInterpretation}</Text>
      </>}
     </View>}
    </View>;
   })}
   <Text style={styles.note}>Práctica oral propuesta: {plan.spokenFollowUp}</Text>
   <Text style={styles.note}>Sin micrófono: {plan.noMicAlternative}</Text>
   <Pressable accessibilityRole="button" onPress={()=>{
    stop();setStatus('Voz detenida por el revisor.');
   }} style={styles.button}><Text style={styles.buttonText}>Detener voz</Text></Pressable>
   {!!status&&<Text accessibilityRole="alert" style={styles.note}>{status}</Text>}
  </>}
 </View>;
}
const styles=StyleSheet.create({
 card:{borderRadius:16,borderWidth:1,borderColor:'#8C82C3',backgroundColor:'#23243A',padding:14,gap:10},
 header:{color:'#F1E9FF',fontSize:18,fontWeight:'700'},
 note:{color:'#D4CEEC',fontSize:13,lineHeight:20},
 buttons:{flexDirection:'row',flexWrap:'wrap',gap:8},
 button:{borderWidth:1,borderColor:'#C9B8F8',borderRadius:12,paddingHorizontal:12,paddingVertical:11,minHeight:44,justifyContent:'center'},
 buttonText:{color:'#F2EAFD',fontWeight:'600',fontSize:13},
 turn:{paddingVertical:10,gap:8,borderBottomWidth:1,borderBottomColor:'#4A4763'},
 line:{color:'#FFFFFF',fontSize:15,lineHeight:23},
 question:{color:'#EAD7A9',fontSize:14,lineHeight:21,fontWeight:'600'}
});
