/** User-initiated, local only. Scan installed bytes on demand, not self-declared claims. */
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {selectAndInstallVoicePack} from './install-voice-pack';
import {inspectInstalledNarrations,type InstalledNarrationStatus} from './installed-voice-pack';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';
import {voiceCueById,type TargetLanguage} from '@voicefirst/core';
export function VoicePackImporter({target}:{target:TargetLanguage}){
 const [working,setWorking]=useState(false);
 const [scanning,setScanning]=useState(false);
 const [status,setStatus]=useState('');
 const [installed,setInstalled]=useState<InstalledNarrationStatus|null>(null);
 const generation=useRef(0);
 const lock=useRef(false);
 const refresh=async(language:TargetLanguage)=>{
  const token=++generation.current;
  setScanning(true);
  const result=await inspectInstalledNarrations(language);
  if(token===generation.current){setInstalled(result);setScanning(false);}
 };
 useEffect(()=>{
  void refresh(target);
  return()=>{generation.current++;void stopCuratedVoice();};
 },[target]);
 const select=async()=>{
  if(lock.current)return;
  lock.current=true;setWorking(true);setStatus('');
  try{
   const r=await selectAndInstallVoicePack();
   if(r.kind==='installed'){
    setStatus(`Se importaron ${r.clips} grabaciones para ${r.language}, faltan ${r.missing} del catálogo. Se revisarán para usarlas.`);
    await refresh(target);
   }else if(r.kind==='rejected')setStatus(`Importación detenida: ${r.reason}`);
   else setStatus('No se importó ninguna carpeta.');
  }catch{setStatus('La importación no pudo terminar. No se modificó un paquete anterior.');}
  finally{lock.current=false;setWorking(false);}
 };
 const play=()=>{
  if(installed?.kind!=='valid'||installed.language!==target)return;
  const cue=voiceCueById(installed.sampleCueId);
  if(cue)void playCuratedVoice(cue,0.88,()=>setStatus('Prueba de narración completada.'),
    message=>setStatus('No se pudo reproducir el clip: '+message));
 };
 const summary=scanning?'Revisando los clips grabados…':
   installed?.kind==='valid'
     ?`Verificados: ${installed.verified} clips WAV de ${target}. Faltan ${installed.missing} por producir. Revisión del autor y acento todavía pendiente.`
     :installed?.kind==='invalid'
     ?`Paquete instalado no confiable: ${installed.reason} Clips revisados antes del problema: ${installed.verified}. No se reproducirá automáticamente.`
     :installed?.kind==='not-installed'
     ?`No hay narraciones grabadas instaladas para ${target}. El teléfono puede ofrecer voz de sistema, pero no garantizamos su funcionamiento sin conexión.`
     :'';
 return <View style={s.wrap}>
  <Text style={s.title}>Narraciones originales · almacenamiento local</Text>
  <Text style={s.info}>Elige una carpeta con pack.json y clips WAV originales o autorizados. Se valida la estructura real del audio, la duración, SHA-256, las rutas y los datos de derechos. No se reemplazan paquetes instalados.</Text>
  {!!summary&&<Text accessibilityLiveRegion="polite" style={installed?.kind==='invalid'?s.warning:s.info}>{summary}</Text>}
  <Pressable accessibilityRole="button" disabled={working} style={s.button} onPress={()=>void select()}><Text style={s.action}>{working?'Validando archivos…':'Importar narraciones desde carpeta'}</Text></Pressable>
  <Pressable accessibilityRole="button" disabled={scanning||working} style={s.button} onPress={()=>void refresh(target)}><Text style={s.action}>{scanning?'Revisando audios…':'Verificar narraciones instaladas'}</Text></Pressable>
  {installed?.kind==='valid'&&<Pressable accessibilityRole="button" style={s.button} onPress={play}><Text style={s.action}>Escuchar un clip grabado de prueba</Text></Pressable>}
  {!!status&&<Text accessibilityLiveRegion="polite" style={s.info}>{status}</Text>}
  <Text style={s.note}>Las 194 grabaciones planificadas aún no existen como colección oficial. Hash íntegro no equivale a firma del autor ni certificación de acento. El selector, Bluetooth y salida de audio requieren pruebas físicas iOS/Android.</Text>
 </View>;
}
const s=StyleSheet.create({wrap:{borderRadius:18,borderColor:'#2B435A',borderWidth:1,padding:17,backgroundColor:'#142339',gap:11,marginTop:12},title:{fontSize:17,fontWeight:'700',color:'#F2F7FC'},info:{fontSize:12,lineHeight:19,color:'#A6BBD0'},warning:{fontSize:12,lineHeight:19,color:'#FFE19C'},note:{fontSize:11,lineHeight:17,color:'#A6BBD0'},button:{borderColor:'#89D4C5',borderWidth:1,backgroundColor:'#22414A',borderRadius:12,padding:13,minHeight:45},action:{color:'#F2F7FC',fontWeight:'700'}});
