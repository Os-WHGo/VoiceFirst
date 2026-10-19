import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { defaultPreferences, validatePreferences, type CefrBand, type TargetLanguage,type ExperiencePreferences,defaultExperiencePreferences } from '@voicefirst/core';

/** Experimental turn-by-turn microphone route. NOT hands-free/background yet. */
const DEV_URL = process.env.EXPO_PUBLIC_VOICEFIRST_DEV_URL ?? '';
const colors = { bg:'#142339', border:'#37536A', ink:'#F2F7FC', muted:'#A6BBD0', accent:'#89D4C5' };
interface HistoryTurn {role:'user'|'assistant';text:string}
interface VoicePracticeProps { nativeLanguage: TargetLanguage; target: TargetLanguage; level: CefrBand; rate: number; lowStim: boolean; experience?:ExperiencePreferences }
export function VoicePractice({nativeLanguage,target,level,rate,lowStim,experience=defaultExperiencePreferences}:VoicePracticeProps) {
  const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [devToken,setDevToken]=useState('');
  const [phase,setPhase]=useState<'ready'|'recording'|'sending'|'speaking'>('ready');
  const [transcript,setTranscript]=useState('');
  const [answer,setAnswer]=useState('');
  const [error,setError]=useState('');
  const [onlineConsent,setOnlineConsent]=useState(false);
  const history=useRef<HistoryTurn[]>([]);
  const abort=useRef<AbortController|null>(null);
  useEffect(()=>()=>{abort.current?.abort();void Speech.stop();},[]);
  useEffect(()=>{history.current=[];setTranscript('');setAnswer('');setOnlineConsent(false);abort.current?.abort();},[nativeLanguage,target]);
  const stopSpeaking=useCallback(async()=>{await Speech.stop();setPhase('ready');},[]);
  const startRecording=async()=>{
    if(phase!=='ready')return;
    setError('');
    if(!DEV_URL) {setError('Configura EXPO_PUBLIC_VOICEFIRST_DEV_URL para utilizar el laboratorio de voz.');return;}
    if(devToken.trim().length<20){setError('Introduce la clave de desarrollo local (no la clave de OpenAI).');return;}
    const permission=await AudioModule.requestRecordingPermissionsAsync();
    if(!permission.granted){Alert.alert('Micrófono desactivado','Habilita el micrófono en Ajustes para practicar.');return;}
    try {
      await Speech.stop();
      await setAudioModeAsync({playsInSilentMode:true,allowsRecording:true});
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch {setPhase('ready');setError('No se pudo iniciar el micrófono.');}
  };
  const finishRecording=async()=>{
    if(phase!=='recording')return;
    setPhase('sending');
    let uri: string|null=null;
    try {
      await recorder.stop();
      uri=recorder.uri;
      await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false});
      if(!uri) throw new Error('NO_AUDIO');
      const form=new FormData();
      form.append('audio', {uri,name:'utterance.m4a',type:'audio/mp4'} as unknown as Blob);
      form.append('preferences',JSON.stringify(validatePreferences({...defaultPreferences,nativeLanguage,target,speechRate:rate,lowStimulation:lowStim,answerWaitMode:'automatic'})));
      form.append('level',level);
      form.append('history',JSON.stringify(history.current.slice(-6)));
      const controller=new AbortController();abort.current=controller;
      const response=await fetch(`${DEV_URL.replace(/\/$/,'')}/v1/voice/turn`, {
        method:'POST',headers:{Authorization:`Bearer ${devToken.trim()}`},body:form,signal:controller.signal,
      });
      if(!response.ok) throw new Error(`ERROR_${response.status}`);
      const reply:unknown=await response.json();
      const data=reply as {transcript?:string;answer?:string};
      if(typeof data.transcript!=='string'||typeof data.answer!=='string')throw new Error('INVALID_REPLY');
      setTranscript(data.transcript);setAnswer(data.answer);
      history.current=[...history.current,{role:'user' as const,text:data.transcript},{role:'assistant' as const,text:data.answer}].slice(-6);
      setPhase('speaking');
      Speech.speak(data.answer,{language:target,rate,
        onDone:()=>setPhase('ready'),onStopped:()=>setPhase('ready'),onError:()=>setPhase('ready')});
    } catch(e) {
      if(e instanceof Error && e.name!=='AbortError')setError('No se pudo completar la práctica de voz. Comprueba la conexión y el servidor de desarrollo.');
      setPhase('ready');
    } finally {
      abort.current=null;
      // Recordings are temporary, not stored in our pedagogy history by default.
      if(uri) {try {new File(uri).delete();}catch { /* Device may have cleared its cache already. */ }}
    }
  };
  const clear=()=>{history.current=[];setTranscript('');setAnswer('');setError('');};
  return <View style={styles.container}>
    <Text style={styles.header}>Laboratorio de conversación con IA</Text>
    {experience.instructionFormat==='full-context'&&<Text style={styles.description}>Grabación breve por turnos. El audio se envía para transcribirlo y obtener una respuesta contextual de OpenAI. No es aún el modo manos libres definitivo.</Text>}
    {!DEV_URL && <Text style={styles.warning}>Sin servidor de desarrollo configurado. El micrófono de esta función permanece inactivo.</Text>}
    {!!DEV_URL && <TextInput accessibilityLabel="Token de desarrollo local" secureTextEntry placeholder="Token de desarrollo local" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" value={devToken} onChangeText={setDevToken}/>}
    <Pressable accessibilityRole="button" disabled={phase==='sending'||(!DEV_URL)} onPress={phase==='recording'?finishRecording:phase==='speaking'?stopSpeaking:startRecording} style={[styles.cta,phase==='sending'&&{opacity:0.5}]}>
      <Text style={styles.ctaText}>{phase==='recording'?'Terminar de hablar':phase==='sending'?'Procesando voz…':phase==='speaking'?'Detener respuesta':'Hablar con el profesor'}</Text>
    </Pressable>
    {phase==='recording' && <Text accessibilityLiveRegion="polite" style={styles.note}>Grabando. Pulsa para enviar tu respuesta.</Text>}
    {experience.subtitles&&!!transcript && <Text style={styles.result}><Text style={styles.strong}>Dijiste: </Text>{transcript}</Text>}
    {!!answer && <Text style={styles.result}><Text style={styles.strong}>Profesor: </Text>{answer}</Text>}
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.warning}>{error}</Text>}
    {(!!transcript||!!answer)&&<Pressable accessibilityRole="button" onPress={clear} style={styles.secondary}><Text style={styles.secondaryText}>Borrar texto de esta práctica</Text></Pressable>}
    <Text style={styles.note}>Solo para pruebas en simulador/local. No guardamos grabaciones de forma intencional; si falla la eliminación, pueden permanecer temporalmente en la caché del dispositivo. No uses datos personales en las pruebas.</Text>
  </View>;
}
const styles=StyleSheet.create({
  container:{backgroundColor:colors.bg,borderWidth:1,borderColor:colors.border,borderRadius:18,padding:18,gap:12,marginTop:18},
  header:{fontSize:18,fontWeight:'700',color:colors.ink},description:{color:colors.muted,fontSize:13,lineHeight:20},
  warning:{color:'#FFCAAA',fontSize:13,lineHeight:20},input:{color:colors.ink,borderColor:colors.border,borderWidth:1,borderRadius:10,padding:12,minHeight:48},
  cta:{borderRadius:13,backgroundColor:colors.accent,padding:14,minHeight:48,alignItems:'center',justifyContent:'center'},
  ctaText:{fontWeight:'700',color:'#0B2631'},result:{fontSize:14,lineHeight:21,color:colors.ink},strong:{fontWeight:'700',color:colors.accent},
  secondary:{minHeight:40,justifyContent:'center'},secondaryText:{color:colors.accent,fontSize:13},note:{fontSize:12,lineHeight:18,color:colors.muted},
});
