/** This is a local, user-initiated pack import. No download or API required. */
import React,{useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {selectAndInstallVoicePack} from './install-voice-pack';
export function VoicePackImporter(){
 const [working,setWorking]=useState(false);
 const [status,setStatus]=useState('');
 const select=async()=>{
  if(working)return;
  setWorking(true);setStatus('');
  try{
   const r=await selectAndInstallVoicePack();
   if(r.kind==='installed')setStatus(`Paquete local instalado: ${r.language}. Clips: ${r.clips}; pendientes: ${r.missing}. Los acentos requieren revisión en el dispositivo.`);
   else if(r.kind==='rejected')setStatus(`Importación detenida: ${r.reason}`);
  }finally{setWorking(false);}
 };
 return <View style={s.wrap}>
  <Text style={s.title}>Narraciones preparadas · importar paquete</Text>
  <Text style={s.info}>Elige una carpeta que ya contenga pack.json y clips WAV con derechos y revisión documentados. Se comprueba SHA-256 antes y después de copiarla. Nunca se descarga ni se reemplaza una voz automáticamente.</Text>
  <Pressable accessibilityRole="button" disabled={working} style={s.button} onPress={()=>void select()}><Text style={s.action}>{working?'Comprobando paquete…':'Elegir carpeta con narraciones'}</Text></Pressable>
  {!!status&&<Text accessibilityLiveRegion="polite" style={s.info}>{status}</Text>}
  <Text style={s.note}>Todavía no se incluyen 194 grabaciones: solo existe su inventario de producción. La integridad no autentica al autor; importa únicamente paquetes de procedencia confiable. Compatibilidad física pendiente de probar.</Text>
 </View>;
}
const s=StyleSheet.create({wrap:{borderRadius:18,borderColor:'#2B435A',borderWidth:1,padding:17,backgroundColor:'#142339',gap:11,marginTop:12},title:{fontSize:17,fontWeight:'700',color:'#F2F7FC'},info:{fontSize:12,lineHeight:19,color:'#A6BBD0'},note:{fontSize:11,lineHeight:17,color:'#A6BBD0'},button:{borderColor:'#89D4C5',borderWidth:1,backgroundColor:'#22414A',borderRadius:12,padding:13,minHeight:45},action:{color:'#F2F7FC',fontWeight:'700'}});
