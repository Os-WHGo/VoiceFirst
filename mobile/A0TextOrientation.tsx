/** Text-only A0 orientation lab. This is not a scored lesson or a voice assessment. */
import React,{useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import type {TargetLanguage} from '@voicefirst/core';
const examples:Record<TargetLanguage,readonly {word:string;translations:Partial<Record<TargetLanguage,string>>}[]>={
 'en-CA':[{word:'hello',translations:{es:'hola','fr-CA':'bonjour','pt-BR':'olá',de:'hallo',it:'ciao'}},{word:'hi',translations:{es:'hola','fr-CA':'salut','pt-BR':'oi',de:'hi',it:'ciao'}},{word:'language',translations:{es:'idioma','fr-CA':'langue','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 'fr-CA':[{word:'bonjour',translations:{es:'buenos días/hola','en-CA':'hello/good morning','pt-BR':'bom dia/olá',de:'guten Tag/hallo',it:'buongiorno/ciao'}},{word:'salut',translations:{es:'hola','en-CA':'hi','pt-BR':'oi',de:'hi',it:'ciao'}},{word:'langue',translations:{es:'idioma','en-CA':'language','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 es:[{word:'hola',translations:{'en-CA':'hello','fr-CA':'bonjour/salut','pt-BR':'olá',de:'hallo',it:'ciao'}},{word:'idioma',translations:{'en-CA':'language','fr-CA':'langue','pt-BR':'idioma',de:'Sprache',it:'lingua'}}],
 'pt-BR':[{word:'olá',translations:{es:'hola','en-CA':'hello','fr-CA':'bonjour/salut',de:'hallo',it:'ciao'}},{word:'oi',translations:{es:'hola','en-CA':'hi','fr-CA':'salut',de:'hi',it:'ciao'}}],
 de:[{word:'hallo',translations:{es:'hola','en-CA':'hello','fr-CA':'bonjour/salut','pt-BR':'olá',it:'ciao'}},{word:'hi',translations:{es:'hola','en-CA':'hi','fr-CA':'salut','pt-BR':'oi',it:'ciao'}}],
 it:[{word:'ciao',translations:{es:'hola','en-CA':'hello/hi','fr-CA':'salut/bonjour','pt-BR':'oi',de:'hallo/hi'}},{word:'buongiorno',translations:{es:'buenos días','en-CA':'good morning/hello','fr-CA':'bonjour','pt-BR':'bom dia',de:'guten Morgen/Tag'}}]
};
const explanations:Record<TargetLanguage,string>={
 'en-CA':'Read the first words. No audio or pronunciation assessment is available in this preview.',
 'fr-CA':'Lisez les premiers mots. Aucun audio ni évaluation de prononciation dans cet aperçu.',
 'es':'Lee las primeras palabras. Esta vista no incluye audio ni evaluación de pronunciación.',
 'pt-BR':'Leia as primeiras palavras. Esta prévia não inclui áudio nem avaliação de pronúncia.',
 'de':'Lies die ersten Wörter. Diese Vorschau bietet weder Audio noch Aussprachebewertung.',
 'it':'Leggi le prime parole. Questa anteprima non include audio né valutazione della pronuncia.'
};
export function A0TextOrientation({target,nativeLanguage}:{target:TargetLanguage;nativeLanguage:TargetLanguage}){
 const [visible,setVisible]=useState(false);
 return <View style={styles.card}>
  <Text style={styles.heading}>A0 · Primer contacto · Vista de texto</Text>
  <Text style={styles.note}>Material de orientación en revisión. No guarda puntuaciones ni acredita progreso.</Text>
  <Text style={styles.note}>{explanations[nativeLanguage]}</Text>
  <Pressable accessibilityRole="button" accessibilityState={{expanded:visible}} style={styles.action} onPress={()=>setVisible(v=>!v)}><Text style={styles.text}>{visible?'Ocultar ejemplos':'Ver ejemplos de palabras'}</Text></Pressable>
  {visible?examples[target].map((entry,i)=><View key={i}><Text style={styles.word}>{entry.word}</Text>{nativeLanguage!==target&&entry.translations[nativeLanguage]?<Text style={styles.note}>{entry.translations[nativeLanguage]}</Text>:null}</View>):null}
 </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:'#142339',padding:18,borderRadius:16,gap:10},heading:{color:'#F2F7FC',fontWeight:'700',fontSize:17},note:{color:'#A6BBD0',fontSize:13},action:{padding:12,borderWidth:1,borderColor:'#89D4C5',borderRadius:8},text:{color:'#F2F7FC'},word:{color:'#F2F7FC',fontSize:20}});
