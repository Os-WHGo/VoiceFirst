/** Text-only A0 orientation lab. This is not a scored lesson or a voice assessment. */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet,AppState} from 'react-native';
import {SessionNarrator,type TargetLanguage} from '@voicefirst/core';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
const examples:Record<TargetLanguage,readonly {word:string;translations:Partial<Record<TargetLanguage,string>>}[]>={
 'en-CA':[{word:'hello',translations:{es:'hola','fr-CA':'bonjour','pt-BR':'olá',de:'hallo',it:'ciao'}},{word:'hi',translations:{es:'hola','fr-CA':'salut','pt-BR':'oi',de:'hi',it:'ciao'}},{word:'language',translations:{es:'idioma','fr-CA':'langue','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 'fr-CA':[{word:'bonjour',translations:{es:'buenos días/hola','en-CA':'hello/good morning','pt-BR':'bom dia/olá',de:'guten Tag/hallo',it:'buongiorno/ciao'}},{word:'salut',translations:{es:'hola','en-CA':'hi','pt-BR':'oi',de:'hi',it:'ciao'}},{word:'langue',translations:{es:'idioma','en-CA':'language','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 es:[{word:'hola',translations:{'en-CA':'hello','fr-CA':'bonjour/salut','pt-BR':'olá',de:'hallo',it:'ciao'}},{word:'idioma',translations:{'en-CA':'language','fr-CA':'langue','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 'pt-BR':[{word:'olá',translations:{es:'hola','en-CA':'hello','fr-CA':'bonjour/salut',de:'hallo',it:'ciao'}},{word:'oi',translations:{es:'hola','en-CA':'hi','fr-CA':'salut',de:'hi',it:'ciao'}}],
 de:[{word:'hallo',translations:{es:'hola','en-CA':'hello','fr-CA':'bonjour/salut','pt-BR':'olá',it:'ciao'}},{word:'hi',translations:{es:'hola','en-CA':'hi','fr-CA':'salut','pt-BR':'oi',it:'ciao'}}],
 it:[{word:'ciao',translations:{es:'hola','en-CA':'hello/hi','fr-CA':'salut/bonjour','pt-BR':'oi',de:'hallo/hi'}},{word:'buongiorno',translations:{es:'buenos días','en-CA':'good morning/hello','fr-CA':'bonjour','pt-BR':'bom dia',de:'guten Morgen/Tag'}}]
};
const explanations:Record<TargetLanguage,string>={
 'en-CA':'Listen to the first words with a device voice when available. Offline audio depends on installed voices; this is not a pronunciation assessment.',
 'fr-CA':'Écoutez les premiers mots avec une voix du téléphone si disponible. L’écoute hors ligne dépend des voix installées; aucune évaluation de prononciation.',
 'es':'Escucha las primeras palabras con una voz del dispositivo si está disponible. El audio sin Internet depende de las voces instaladas; no se evalúa la pronunciación.',
 'pt-BR':'Ouça as primeiras palavras com uma voz do aparelho, se disponível. O áudio offline depende das vozes instaladas; não há avaliação da pronúncia.',
 'de':'Hör dir die ersten Wörter mit einer verfügbaren Gerätestimme an. Offline-Audio hängt von installierten Stimmen ab; keine Aussprachebewertung.',
 'it':'Ascolta le prime parole con una voce del dispositivo, se disponibile. L’audio offline dipende dalle voci installate; nessuna valutazione della pronuncia.'
};
const labels:Record<TargetLanguage,{heading:string;disclaimer:string;show:string;hide:string;listen:string;stop:string;unavailable:string}>={
 'en-CA':{heading:'A0 · First contact · Listening preview',disclaimer:'Draft material. No score or progress is recorded.',show:'Show words',hide:'Hide words',listen:'Listen to',stop:'Stop audio',unavailable:'The device voice is unavailable. Read the word or try again later.'},
 'fr-CA':{heading:'A0 · Premier contact · Aperçu audio',disclaimer:'Contenu provisoire. Aucun score ni progrès enregistré.',show:'Voir les mots',hide:'Masquer les mots',listen:'Écouter',stop:'Arrêter le son',unavailable:'La voix du téléphone n’est pas disponible. Vous pouvez lire le mot.'},
 es:{heading:'A0 · Primer contacto · Escucha',disclaimer:'Material en revisión. No se registra puntuación ni progreso.',show:'Ver palabras',hide:'Ocultar palabras',listen:'Escuchar',stop:'Detener audio',unavailable:'No hay una voz compatible disponible. Puedes leer la palabra y volver a intentarlo.'},
 'pt-BR':{heading:'A0 · Primeiro contato · Escuta',disclaimer:'Material em revisão. Nenhuma pontuação ou progresso é registrado.',show:'Ver palavras',hide:'Ocultar palavras',listen:'Ouvir',stop:'Parar áudio',unavailable:'A voz do dispositivo não está disponível. Você pode ler a palavra.'},
 de:{heading:'A0 · Erster Kontakt · Hörbeispiele',disclaimer:'Entwurf. Keine Punkte oder Fortschritte werden gespeichert.',show:'Wörter anzeigen',hide:'Wörter ausblenden',listen:'Anhören',stop:'Audio stoppen',unavailable:'Keine passende Gerätestimme verfügbar. Du kannst das Wort lesen.'},
 it:{heading:'A0 · Primo contatto · Ascolto',disclaimer:'Materiale in revisione. Nessun punteggio o progresso viene registrato.',show:'Mostra parole',hide:'Nascondi parole',listen:'Ascolta',stop:'Ferma audio',unavailable:'Nessuna voce compatibile disponibile. Puoi leggere la parola.'}
};
export function A0TextOrientation({target,nativeLanguage,rate=0.88}:{target:TargetLanguage;nativeLanguage:TargetLanguage;rate?:number}){
 const [visible,setVisible]=useState(false);
 const [playing,setPlaying]=useState<number|null>(null);
 const [audioIssue,setAudioIssue]=useState('');
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 const epoch=useRef(0),live=useRef(false);
 // Reuse VoiceFirst's serialized TTS/local verified voice playback instead of
 // adding a second player or requesting microphone permissions.
 const narrator=useMemo(()=>new SessionNarrator({play:playCuratedVoice,stop:stopCuratedVoice}),[]);
 const ui=labels[nativeLanguage];
 const stop=()=>{
  epoch.current++;
  narrator.cancel();
  setPlaying(null);
 };
 useEffect(()=>{
  live.current=true;
  const subscription=AppState.addEventListener('change',state=>{
   const active=state==='active';
   setForeground(active);
   if(!active){epoch.current++;narrator.cancel();setPlaying(null);}
  });
  return()=>{
   live.current=false;
   epoch.current++;
   narrator.cancel();
   subscription.remove();
  };
 },[narrator,target]);
 const listen=(word:string,index:number)=>{
  if(!visible||!foreground)return;
  if(playing===index){stop();return;}
  stop();
  setAudioIssue('');
  const token=epoch.current;
  setPlaying(index);
  // An authored word is spoken without creating an answer, score or lesson
  // completion. System speech may require an installed compatible voice.
  void narrator.run([{text:word,language:target,purpose:'target-cue'}],rate).then(result=>{
   if(!live.current||token!==epoch.current)return;
   setPlaying(null);
   if(result.kind==='failed')setAudioIssue(ui.unavailable);
  });
 };
 return <View style={styles.card}>
  <Text style={styles.heading}>{ui.heading}</Text>
  <Text style={styles.note}>{ui.disclaimer}</Text>
  <Text style={styles.note}>{explanations[nativeLanguage]}</Text>
  <Pressable accessibilityRole="button" accessibilityState={{expanded:visible}} style={styles.action}
   onPress={()=>{if(visible)stop();setAudioIssue('');setVisible(v=>!v);}}><Text style={styles.text}>{visible?ui.hide:ui.show}</Text></Pressable>
  {visible?examples[target].map((entry,i)=><View key={entry.word}>
   <Text style={styles.word}>{entry.word}</Text>
   {nativeLanguage!==target&&entry.translations[nativeLanguage]?<Text style={styles.note}>{entry.translations[nativeLanguage]}</Text>:null}
   <Pressable accessibilityRole="button" accessibilityLabel={`${playing===i?ui.stop:ui.listen}: ${entry.word}`}
    accessibilityState={{disabled:!foreground}} disabled={!foreground} style={styles.action}
    onPress={()=>listen(entry.word,i)}>
    <Text style={styles.text}>{playing===i?ui.stop:`${ui.listen}: ${entry.word}`}</Text>
   </Pressable>
  </View>):null}
  {!!audioIssue&&<Text accessibilityRole="alert" style={styles.note}>{audioIssue}</Text>}
 </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:'#142339',padding:18,borderRadius:16,gap:10},heading:{color:'#F2F7FC',fontWeight:'700',fontSize:17},note:{color:'#A6BBD0',fontSize:13},action:{padding:12,borderWidth:1,borderColor:'#89D4C5',borderRadius:8},text:{color:'#F2F7FC'},word:{color:'#F2F7FC',fontSize:20}});
