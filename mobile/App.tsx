import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, SafeAreaView, StatusBar, StyleSheet, View, Text, Pressable, AppState } from 'react-native';
import * as Speech from 'expo-speech';
import { VoicePractice } from './VoicePractice';
import { OfflineCourse } from './OfflineCourse';
import { A0CandidatePreview } from './A0CandidatePreview';
import { A0TextOrientation } from './A0TextOrientation';
import {readA0CatalogSource} from './a0-catalog-source';
import a0CandidateJson from './assets/VoiceFirst_A0_Functional_6Langs_v0.2.json';
import { GuidedDialoguePractice } from './GuidedDialoguePractice';
import { FreeResources } from './FreeResources';
import { RegionalComparisons } from './RegionalComparisons';
import { LearningAdjustments } from './LearningAdjustments';
import { PragmaticsPractice } from './PragmaticsPractice';
import { VoicePackImporter } from './VoicePackImporter';
import {stopCuratedVoice} from './curated-voice-output';
import { useLearningPreferences } from './use-learning-preferences';
import { missionsFor, languageNames, targetLanguages, courseReadingLocale, type LanguageVariant, type CefrBand, type TargetLanguage, type LearningFocus, type A0LessonCandidate } from '@voicefirst/core';

const C = { bg:'#0B1421', surface:'#142339', border:'#2B435A', text:'#F2F7FC', secondary:'#A6BBD0', mint:'#89D4C5', gold:'#E1BD83' };
const a0Catalog=readA0CatalogSource({id:'VoiceFirst_A0_Functional_6Langs_v0.2',read:()=>a0CandidateJson});
const pendingA0Lessons: readonly A0LessonCandidate[] = a0Catalog.kind==='candidate'?a0Catalog.catalog.lessons:[];
const bands: CefrBand[] = ['A0','A1','A2','B1','B2','C1','C2'];
export default function App() {
  const [nativeLanguage, setNativeLanguage] = useState<TargetLanguage>('es');
  const [target, setTarget] = useState<TargetLanguage>('en-CA');
  const [primaryRegion,setPrimaryRegion]=useState<{target:TargetLanguage;locale:LanguageVariant}|null>(null);
  const onPrimaryRegion=useCallback((locale:LanguageVariant|null)=>{
    setPrimaryRegion(locale?{target,locale}:null);
  },[target]);
  const guideLocale=courseReadingLocale(target,primaryRegion?.target===target?primaryRegion.locale:null);
  const [level, setLevel] = useState<CefrBand>('A1');
  const learning=useLearningPreferences();
  const experience=learning.settings;
  const rate=experience.speechRate;
  const lowStim=experience.sensoryPresentation==='calm';
  const [focus,setFocus]=useState<LearningFocus>('balanced');
  const [speaking, setSpeaking] = useState(false);
  const mission = missionsFor(target, level)[0];
  const stop = useCallback(() => {void stopCuratedVoice().finally(()=>setSpeaking(false));},[]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{
      if(state!=='active')stop();
    });
    return()=>{subscription.remove();void stopCuratedVoice();};
  },[stop]);
  const preview = () => {
    if (!mission) return;
    stop();
    setSpeaking(true);
    Speech.speak(mission.prompt, {
      language: target, rate,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.eyebrow}>VOICEFIRST / LAB 0.1</Text>
        <Text accessibilityRole="header" style={styles.title}>Aprende con tu voz.</Text>
        <Text style={styles.sub}>Un profesor que se adapta a tu ritmo. Diseñado para escuchar y hablar.</Text>
        <View style={styles.card}>
          <View style={styles.orbitOuter}><View style={styles.orbitMid}><View style={styles.orbitInner}><Text style={styles.orbitIcon}>{speaking ? '♫' : '◦'}</Text></View></View></View>
          <Text style={styles.centerHeading}>{speaking ? 'Reproduciendo ejemplo' : 'Tu espacio de aprendizaje'}</Text>
          <Text style={styles.centerSub}>Seis idiomas combinables. Los diálogos pueden usar reconocimiento local en primer plano si el dispositivo lo admite; falta validar pantalla bloqueada.</Text>
          <Pressable accessibilityRole="button" style={styles.primary} onPress={speaking ? stop : preview}>
            <Text style={styles.primaryText}>{speaking ? 'Detener audio' : 'Escuchar ejemplo'}</Text>
          </Pressable>
        </View>
        <Text style={styles.section}>Idioma que hablas</Text>
        <View style={styles.row}>{targetLanguages.map(lang=><Chip key={lang} active={nativeLanguage===lang} label={languageNames[lang]} onPress={()=>{stop();setNativeLanguage(lang);if(lang===target){setTarget(targetLanguages.find(v=>v!==lang)!);}}}/>)}</View>
        <Text style={styles.section}>Idioma que quieres aprender</Text>
        <View style={styles.row}>{targetLanguages.filter(lang=>lang!==nativeLanguage).map(lang=><Chip key={lang} active={target===lang} label={languageNames[lang]} onPress={()=>{stop();setTarget(lang);}}/>)}</View>
        <Text style={styles.section}>Dificultad de la situación</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {bands.map(b=><Chip key={b} label={b} active={level===b} onPress={()=>{stop();setLevel(b);}} />)}
        </ScrollView>
        <View style={styles.mission}>
          <Text style={styles.eyebrow}>SITUACIÓN ORIGINAL · EJEMPLO</Text>
          <Text style={styles.missionName}>{mission?.title}</Text>
          <Text style={styles.sub}>{mission?.situation}</Text>
          <Text style={styles.prompt}>“{mission?.prompt}”</Text>
        </View>
        <Text style={styles.section}>En qué quieres enfocarte</Text>
        <View style={styles.row}>
          {([['balanced','Curso completo'],['work','Trabajo'],['daily-life','Vida cotidiana'],['travel','Viajes']] as const).map(([code,label])=><Chip key={code} active={focus===code} label={label} onPress={()=>setFocus(code)}/>)}
        </View>
        {learning.phase==='blocked' && <Text style={styles.note}>{learning.error}</Text>}
        {learning.phase==='loading' && <Text style={styles.note}>Recuperando ajustes antes de iniciar las clases…</Text>}
        {learning.phase==='ready' && <>
        <LearningAdjustments settings={experience} onChange={learning.change}/>
        <PragmaticsPractice/>
        {!!learning.error && <Text style={styles.note}>{learning.error}</Text>}
        <RegionalComparisons key={'regional-'+target} target={target} rate={rate} onPrimaryChange={onPrimaryRegion}/>
        <VoicePackImporter target={target}/>
        <GuidedDialoguePractice key={target} nativeLanguage={nativeLanguage} target={target} focus={focus} rate={rate} experience={experience}/>
        {level==='A0' && <A0TextOrientation key={'orientation-'+target} target={target} nativeLanguage={nativeLanguage} />}
        {level==='A0' && a0Catalog.kind==='blocked' && <Text style={styles.note}>Catálogo A0 bloqueado por validación. No se cargaron ejercicios.</Text>}
        {level==='A0' && a0Catalog.kind==='candidate' && <A0CandidatePreview key={'a0-'+target} target={target} nativeLanguage={nativeLanguage} lessons={pendingA0Lessons} />}
        <OfflineCourse key={target} nativeLanguage={nativeLanguage} target={target} guideLocale={guideLocale} rate={rate} experience={experience} />
        <FreeResources target={target}/>
        <VoicePractice nativeLanguage={nativeLanguage} target={target} level={level} rate={rate} lowStim={lowStim} experience={experience} />
        </>}
        <Text style={styles.note}>Seis idiomas combinables y lecciones preparadas de muestra, no un curso completo C2. La práctica guiada tiene una ruta de reconocimiento local que requiere compilación nativa y modelos compatibles; el laboratorio generativo es opcional y separado. No calificamos pronunciación ni certificamos niveles. No se ha probado la captura con pantalla bloqueada ni con lentes Bluetooth. Los ajustes de accesibilidad no requieren diagnósticos y no se almacena audio de las clases preparadas.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}) {return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipActiveText]}>{label}</Text></Pressable>}
const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},screen:{padding:22,paddingBottom:55,gap:12},
  eyebrow:{color:C.mint,fontSize:11,fontWeight:'700',letterSpacing:1.6},title:{color:C.text,fontSize:31,fontWeight:'700',marginTop:12},
  sub:{color:C.secondary,fontSize:14,lineHeight:21},card:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:28,alignItems:'center',padding:25,marginTop:20,gap:12},
  orbitOuter:{width:210,height:210,borderRadius:110,borderWidth:2,borderColor:'#305869',alignItems:'center',justifyContent:'center',marginTop:5},
  orbitMid:{width:165,height:165,borderRadius:85,borderWidth:2,borderColor:'#4C928C',alignItems:'center',justifyContent:'center'},
  orbitInner:{width:116,height:116,borderRadius:70,backgroundColor:'#2A6262',alignItems:'center',justifyContent:'center'},
  orbitIcon:{color:C.text,fontSize:59,fontWeight:'300'},centerHeading:{color:C.text,fontSize:19,fontWeight:'700',textAlign:'center'},
  centerSub:{color:C.secondary,fontSize:12,lineHeight:18,textAlign:'center'},primary:{backgroundColor:C.mint,minHeight:49,paddingHorizontal:30,paddingVertical:13,borderRadius:16,justifyContent:'center',marginTop:10},
  primaryText:{color:'#0B2631',fontWeight:'800',textAlign:'center'},section:{color:C.text,fontSize:17,fontWeight:'700',marginTop:15},row:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  chip:{borderColor:C.border,borderWidth:1,paddingHorizontal:14,paddingVertical:11,borderRadius:40,backgroundColor:C.surface,minHeight:43},
  chipActive:{borderColor:C.mint,backgroundColor:'#203B40'},chipText:{color:C.secondary,fontSize:13},chipActiveText:{color:C.text,fontWeight:'700'},
  mission:{borderWidth:1,borderColor:C.border,borderRadius:18,padding:20,backgroundColor:C.surface,gap:11,marginTop:8},
  missionName:{color:C.text,fontSize:20,fontWeight:'700'},prompt:{color:C.gold,fontSize:17,lineHeight:25,marginTop:4},
  note:{color:'#95A6B6',fontSize:12,lineHeight:19,marginTop:20}
});
