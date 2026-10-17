import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, SafeAreaView, StatusBar, StyleSheet, View, Text, Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import { VoicePractice } from './VoicePractice';
import { OfflineCourse } from './OfflineCourse';
import { GuidedDialoguePractice } from './GuidedDialoguePractice';
import { FreeResources } from './FreeResources';
import { RegionalComparisons } from './RegionalComparisons';
import { LearningAdjustments } from './LearningAdjustments';
import { defaultPreferences, missionsFor, languageNames, targetLanguages, type CefrBand, type TargetLanguage, type LearningFocus, defaultExperiencePreferences, type ExperiencePreferences } from '@voicefirst/core';

const C = { bg:'#0B1421', surface:'#142339', border:'#2B435A', text:'#F2F7FC', secondary:'#A6BBD0', mint:'#89D4C5', gold:'#E1BD83' };
const bands: CefrBand[] = ['A0','A1','A2','B1','B2','C1','C2'];
export default function App() {
  const [nativeLanguage, setNativeLanguage] = useState<TargetLanguage>('es');
  const [target, setTarget] = useState<TargetLanguage>('en-CA');
  const [level, setLevel] = useState<CefrBand>('A1');
  const [rate, setRate] = useState(defaultPreferences.speechRate);
  const [lowStim, setLowStim] = useState(true);
  const [focus,setFocus]=useState<LearningFocus>('balanced');
  const [experience,setExperience]=useState<ExperiencePreferences>(defaultExperiencePreferences);
  const [speaking, setSpeaking] = useState(false);
  const mission = missionsFor(target, level)[0];
  const stop = useCallback(() => { void Speech.stop().finally(()=>setSpeaking(false)); },[]);
  useEffect(() => () => { void Speech.stop(); }, []);
  const preview = () => {
    if (!mission) return;
    void Speech.stop();
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
        <Text style={styles.title}>Aprende con tu voz.</Text>
        <Text style={styles.sub}>Un profesor que se adapta a tu ritmo. Diseñado para escuchar y hablar.</Text>
        <View style={styles.card}>
          <View style={styles.orbitOuter}><View style={styles.orbitMid}><View style={styles.orbitInner}><Text style={styles.orbitIcon}>{speaking ? '♫' : '◦'}</Text></View></View></View>
          <Text style={styles.centerHeading}>{speaking ? 'Reproduciendo ejemplo' : 'Tu espacio de aprendizaje'}</Text>
          <Text style={styles.centerSub}>Ejemplo de 30 rutas de estudio. La captura de micrófono y el control por comandos aún no están conectados.</Text>
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
        <LearningAdjustments settings={experience} onChange={next=>{setExperience(next);setLowStim(next.sensoryPresentation==='calm');}}/>
        <RegionalComparisons key={'regional-'+target} target={target} rate={rate}/>
        <GuidedDialoguePractice key={target} nativeLanguage={nativeLanguage} target={target} focus={focus} rate={rate} correctionTiming={experience.correctionTiming} instructionFormat={experience.instructionFormat}/>
        <OfflineCourse key={target} nativeLanguage={nativeLanguage} target={target} rate={rate} />
        <FreeResources target={target}/>
        <VoicePractice nativeLanguage={nativeLanguage} target={target} level={level} rate={rate} lowStim={lowStim} />
        <Text style={styles.section}>Preferencias de atención</Text>
        <View style={styles.row}>
          <Chip label={lowStim ? 'Baja estimulación ✓' : 'Estimulación normal'} active={lowStim} onPress={()=>setLowStim(!lowStim)} />
          <Chip label={rate<0.95?'Voz pausada':'Voz normal'} active={rate<0.95} onPress={()=>setRate(rate<0.95?1.0:0.85)} />
        </View>
        <Text style={styles.note}>Seis idiomas seleccionables, con una muestra por nivel. Ahora hay un laboratorio de práctica por turnos mediante micrófono, que requiere servidor local y cuenta API. Aún no funciona manos libres ni con pantalla bloqueada. La sección de diálogos usa texto de prueba y no puntúa pronunciación. Sin registro ni anuncios ni grabaciones en este prototipo. No se está realizando una evaluación de nivel. El micrófono solo se solicita al iniciar una grabación.</Text>
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
