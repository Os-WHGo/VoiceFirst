/** Preview of curated question -> meaningful answer dialogues.
 * Uses a typed transcript for verification until a local ASR provider is installed and tested.
 * This IS NOT a voice controlled, persistent or CEFR-accredited learning experience yet.
 */
import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,TextInput,StyleSheet} from 'react-native';
import * as Speech from 'expo-speech';
import {selectGuidedDialogues,newDialogueRun,dialogueAudioCue,evaluateDialogueTurn,recordDialogueResponse,
  type TargetLanguage,type LearningFocus} from '@voicefirst/core';

export function GuidedDialoguePractice({nativeLanguage,target,focus,rate=0.88}:{
  nativeLanguage:TargetLanguage;target:TargetLanguage;focus:LearningFocus;rate?:number;
}){
  const selection=useMemo(()=>selectGuidedDialogues(target,focus,'adult'),[target,focus]);
  const dialogues=selection.dialogues;
  const [dialogueIndex,setDialogueIndex]=useState(0);
  const dialogue=dialogues[dialogueIndex]??dialogues[0];
  const [run,setRun]=useState(()=>dialogue?newDialogueRun(dialogue):null);
  const [draft,setDraft]=useState('');
  const [feedback,setFeedback]=useState('');
  const [showExamples,setShowExamples]=useState(false);
  useEffect(()=>{setDialogueIndex(0);setRun(dialogues[0]?newDialogueRun(dialogues[0]):null);setDraft('');setFeedback('');setShowExamples(false);void Speech.stop();},[dialogues]);
  useEffect(()=>()=>{void Speech.stop();},[]);
  if(!dialogue||!run)return null;
  const turn=dialogue.turns[run.turnIndex];
  const speak=(hint:boolean)=>{
    const cue=dialogueAudioCue(dialogue,run.turnIndex,nativeLanguage,hint);
    if(!cue)return;
    void Speech.stop();Speech.speak(cue.text,{language:cue.language,rate});
  };
  const verify=()=>{
    if(!turn)return;
    const result=evaluateDialogueTurn(turn,draft,target,'high'); // typed transcript, not ASR
    const next=recordDialogueResponse(run,dialogue,result);
    setRun(next);
    if(result.verdict==='accepted'){
      setFeedback(next.completed?'Situación completada. Aún no prueba dominio del nivel.':'Respuesta válida. Ahora contesta la siguiente pregunta.');
      setDraft('');setShowExamples(false);
    } else {setFeedback('Esta frase no coincide con las respuestas de ejemplo. Puedes escuchar una pista o probar otra forma.');}
  };
  const next=()=>{
    void Speech.stop();const index=(dialogueIndex+1)%dialogues.length;
    setDialogueIndex(index);setRun(newDialogueRun(dialogues[index]!));setDraft('');setFeedback('');setShowExamples(false);
  };
  return <View style={s.wrap}>
    <Text style={s.kicker}>PRÁCTICA CONTEXTUAL PREPARADA · SIN IA</Text>
    <Text style={s.title}>Responde en el idioma que aprendes</Text>
    <Text style={s.sub}>{dialogue.label[nativeLanguage]} · {dialogue.level} · Escena {dialogueIndex+1}/{dialogues.length}</Text>
    {run.completed?<>
      <Text style={s.success}>¡Situación completada! Practicaste respuestas con significado, no traducciones literales.</Text>
      <Action label="Otra situación" onPress={next}/>
    </>:<>
      <Text style={s.step}>Pregunta {run.turnIndex+1}/{dialogue.turns.length}</Text>
      <Text style={s.question}>{turn?.teacherCue}</Text>
      <Text style={s.sub}>{turn?.support[nativeLanguage]}</Text>
      <View style={s.row}>
        <Action label="Escuchar pregunta" onPress={()=>speak(false)}/>
        <Action label="Ayuda en mi idioma" onPress={()=>speak(true)}/>
      </View>
      <TextInput style={s.input} multiline value={draft} onChangeText={setDraft} placeholder="Escribe una respuesta de prueba en el idioma que aprendes" placeholderTextColor="#899FB0" autoCorrect={false}/>
      <View style={s.row}>
        <Action label="Comprobar respuesta escrita" onPress={verify}/>
        <Action label={showExamples?'Ocultar ejemplos':'Ver ejemplos posibles'} onPress={()=>setShowExamples(v=>!v)}/>
      </View>
      {showExamples&&<Text style={s.hint}>{turn?.acceptedReplies.join(' · ')}</Text>}
      {!!feedback&&<Text style={s.sub}>{feedback}</Text>}
      <Text style={s.sub}>No reconocemos todavía respuestas habladas en este panel. Variaciones distintas de los ejemplos pueden ser igualmente correctas; el evaluador local es deliberadamente conservador.</Text>
    </>}
    <Text style={s.note}>Vista de validación del contenido para adultos. La versión definitiva utilizará ASR local y controles hablados, incluso con pantalla bloqueada cuando las APIs de cada sistema lo permitan. Las opciones infantiles siguen en revisión.</Text>
  </View>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" style={s.button} onPress={onPress}><Text style={s.buttonText}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{borderColor:'#2B435A',borderWidth:1,borderRadius:18,backgroundColor:'#142339',padding:18,gap:11,marginTop:12},
  kicker:{fontSize:11,color:'#89D4C5',fontWeight:'700'},title:{fontSize:19,fontWeight:'700',color:'#F2F7FC'},sub:{fontSize:13,color:'#A6BBD0',lineHeight:19},step:{color:'#89D4C5',fontWeight:'700'},question:{color:'#F3DFC1',fontSize:18,lineHeight:25,fontWeight:'700'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:9},button:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,padding:11,minHeight:44},buttonText:{color:'#F2F7FC',fontWeight:'700',fontSize:12},
  input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:63,color:'#F2F7FC',fontSize:15},hint:{color:'#F3DFC1',fontSize:12,lineHeight:21},success:{color:'#89D4C5',fontSize:16},note:{fontSize:11,color:'#A6BBD0',lineHeight:17}});
