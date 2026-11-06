/** Internal A1 editorial-only review, never included in public course navigation. */
import React,{useEffect,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {a1EditorialSceneTopics,startA1EditorialReview,currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,type A1EditorialReviewState,type TargetLanguage} from '@voicefirst/core';
export function A1EditorialPractice({known,target}:{known:TargetLanguage;target:TargetLanguage}){
 const [topic,setTopic]=useState(a1EditorialSceneTopics[0]!);
 const [state,setState]=useState<A1EditorialReviewState|null>(null);
 const [answerText,setAnswerText]=useState('');
 const [feedback,setFeedback]=useState('');
 useEffect(()=>{setState(startA1EditorialReview(known,target,topic));setAnswerText('');setFeedback('');},[known,target,topic]);
 const step=currentA1EditorialReview(state);
 const submit=(response:{kind:'choice';optionId:string}|{kind:'typed';text:string}|{kind:'skip'})=>{
  const out=submitA1EditorialReview(state,response);
  if(out){setState(out.state);setFeedback(out.feedback);setAnswerText('');}
 };
 return <View>
  <Text>Ensayo editorial A1. Sin audio, puntuación ni progreso.</Text>
  {a1EditorialSceneTopics.map(id=><Pressable key={id} onPress={()=>setTopic(id)}><Text>{id}</Text></Pressable>)}
  {step?.kind==='question'&&<View>
   <Text>{step.question}</Text>
   {step.options.map(o=><Pressable key={o.id} accessibilityRole="button" onPress={()=>submit({kind:'choice',optionId:o.id})}><Text>{o.text}</Text></Pressable>)}
   <TextInput value={answerText} onChangeText={setAnswerText} placeholder="Respuesta opcional" maxLength={240} accessibilityLabel="Respuesta escrita para ensayo A1"/>
   <Pressable onPress={()=>submit({kind:'typed',text:answerText})}><Text>Revisar texto</Text></Pressable>
   <Pressable onPress={()=>submit({kind:'skip'})}><Text>Omitir</Text></Pressable>
   <Text>{feedback}</Text>
   {step.revealedEvidence&&<Text>{step.revealedEvidence}</Text>}
   <Pressable onPress={()=>setState(s=>advanceA1EditorialReview(s,'reveal'))}><Text>Mostrar evidencia</Text></Pressable>
   <Pressable onPress={()=>{setState(s=>advanceA1EditorialReview(s,'next'));setFeedback('');}}><Text>Siguiente</Text></Pressable>
  </View>}
  {step?.kind==='complete'&&<Text>Fin. No se guardaron respuestas.</Text>}
 </View>;
}
