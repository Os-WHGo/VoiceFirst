/** Link-only directory: third-party audio/video is NEVER bundled into VoiceFirst. */
import React,{useState} from 'react';
import{View,Text,TextInput,Pressable,StyleSheet,Linking}from 'react-native';
import{findFreeResources,type TargetLanguage}from '@voicefirst/core';
export function FreeResources({target}:{target:TargetLanguage}){
  const [query,setQuery]=useState('');
  const results=findFreeResources(target,query);
  return <View style={s.wrap}>
    <Text style={s.title}>Recursos gratuitos para continuar</Text>
    <Text style={s.note}>Catálogo curado: abre siempre el sitio original, necesita Internet y puede requerir inscripción. No descargamos videos ajenos.</Text>
    <TextInput value={query} onChangeText={setQuery} style={s.input} placeholder="Buscar por nombre, institución o tema" placeholderTextColor="#899FB0"/>
    {results.map(r=><Pressable key={r.id} accessibilityRole="link" onPress={()=>void Linking.openURL(r.url)} style={s.item}>
      <Text style={s.link}>{r.title} ↗</Text><Text style={s.note}>{r.publisher}{r.access==='free-course-enrollment-varies'?' · Inscripción y disponibilidad variables':''}</Text>
    </Pressable>)}
    {!results.length&&<Text style={s.note}>Sin coincidencias en el catálogo local. Añadiremos más fuentes verificadas.</Text>}
    <Text style={s.note}>La búsqueda de YouTube dentro de la app requiere su API oficial, cuotas y revisión de políticas; todavía no está activa.</Text>
  </View>;
}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:18,gap:10,marginTop:12},title:{color:'#F2F7FC',fontSize:18,fontWeight:'700'},note:{color:'#A6BBD0',fontSize:12,lineHeight:18},input:{borderRadius:11,borderColor:'#567284',borderWidth:1,padding:12,color:'#F2F7FC',minHeight:44},item:{paddingVertical:10,borderBottomColor:'#2B435A',borderBottomWidth:1},link:{color:'#89D4C5',fontSize:14,fontWeight:'700'}});
