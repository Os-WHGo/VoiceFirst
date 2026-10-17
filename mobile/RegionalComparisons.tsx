/** Original comparisons of written usage. The OS voice may not be regional or offline.
 * No child-facing product is enabled by this display and no external data is sent.
 */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import * as Speech from 'expo-speech';
import Storage from 'expo-sqlite/kv-store';
import {defaultRegionalPreferences,regionalExamplesFor,validateRegionalPreferences,variantsFor,
  type LanguageVariant,type RegionalPreferences,type TargetLanguage} from '@voicefirst/core';

const key=(target:TargetLanguage)=>`voicefirst.regional.settings.v1.${target}`;
const label:Record<LanguageVariant,string>={
  'en-CA':'🇨🇦 Canadá','en-US':'🇺🇸 Estados Unidos','en-GB':'🇬🇧 Reino Unido',
  'fr-CA':'🇨🇦 Québec','fr-FR':'🇫🇷 Francia',
};
const styles=StyleSheet.create({wrap:{backgroundColor:'#142339',borderRadius:18,borderColor:'#2B435A',borderWidth:1,padding:17,gap:11,marginTop:12},
  title:{color:'#F2F7FC',fontSize:18,fontWeight:'700'},sub:{color:'#A6BBD0',fontSize:12,lineHeight:19},
  cue:{color:'#F3DFC1',fontSize:16,lineHeight:23,fontWeight:'600'},region:{color:'#89D4C5',fontSize:12,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8},
  item:{padding:12,borderWidth:1,borderColor:'#2B435A',borderRadius:12,gap:5},button:{borderWidth:1,borderColor:'#89D4C5',borderRadius:12,padding:10,minHeight:44,justifyContent:'center'},buttonOn:{backgroundColor:'#22414A'},btnText:{color:'#F2F7FC',fontSize:12,fontWeight:'600'},warn:{color:'#FFD99A',fontSize:12}});
function Action({text,onPress,chosen=false}:{text:string;onPress:()=>void;chosen?:boolean}){
  return <Pressable accessibilityRole="button" accessibilityState={{selected:chosen}} onPress={onPress} style={[styles.button,chosen&&styles.buttonOn]}><Text style={styles.btnText}>{text}</Text></Pressable>;
}
export function RegionalComparisons({target,rate=0.88}:{target:TargetLanguage;rate?:number}){
  const initial=useMemo(()=>defaultRegionalPreferences(target),[target]);
  const [pref,setPref]=useState<RegionalPreferences|null>(initial);
  const [compareNow,setCompareNow]=useState(false);
  const [error,setError]=useState('');
  const [pending,setPending]=useState(true);
  const pendingWrites=useRef(Promise.resolve());
  useEffect(()=>{
    let live=true;setPref(initial);setCompareNow(false);setPending(true);setError('');void Speech.stop();
    if(!initial){setPending(false);return()=>{live=false;};}
    void Storage.getItem(key(target)).then(raw=>{
      if(!live)return;
      if(raw!==null){try{setPref(validateRegionalPreferences(target,JSON.parse(raw)));}catch{setError('Se conservaron las opciones por defecto; la configuración anterior era inválida.');}}
    }).catch(()=>{if(live)setError('No fue posible leer tus preferencias regionales.');}).finally(()=>{if(live)setPending(false);});
    return()=>{live=false;void Speech.stop();};
  },[target,initial]);
  const save=(next:RegionalPreferences)=>{
    setPref(next);setError('');
    pendingWrites.current=pendingWrites.current.catch(()=>undefined).then(()=>Storage.setItem(key(target),JSON.stringify(next)));
    void pendingWrites.current.catch(()=>setError('No se pudo guardar esta preferencia regional.'));
  };
  if(!initial)return null;
  const selected=pref??initial;
  const examples=regionalExamplesFor(target,selected,compareNow);
  return <View style={styles.wrap}>
    <Text style={styles.title}>🌍 Una situación, distintas regiones</Text>
    <Text style={styles.sub}>Elige la variedad principal; los ejemplos de otras regiones son opcionales. No cambiamos tu nivel ni tu progreso.</Text>
    {pending?<Text style={styles.sub}>Cargando preferencias…</Text>:<>
      <Text style={styles.region}>Variedad para los ejemplos (todavía no cambia el reconocimiento del curso)</Text>
      <View style={styles.row}>{variantsFor(target).map(v=><Action key={v} text={label[v]} chosen={selected.primary===v} onPress={()=>save({...selected,primary:v,compare:variantsFor(target).filter(x=>x!==v)})}/>)}</View>
      <Text style={styles.region}>Regiones que quieres comparar</Text>
      <View style={styles.row}>{variantsFor(target).filter(v=>v!==selected.primary).map(v=><Action key={v} text={label[v]} chosen={selected.compare.includes(v)} onPress={()=>save({...selected,compare:selected.compare.includes(v)?selected.compare.filter(x=>x!==v):[...selected.compare,v]})}/>)}</View>
      <View style={styles.row}>
        <Action text={compareNow?'Ocultar comparaciones':'Comparar otras regiones'} onPress={()=>{void Speech.stop();setCompareNow(x=>!x);}}/>
        <Action text={selected.display==='always'?'Comparación automática: sí':'Comparación automática: no'} onPress={()=>save({...selected,display:selected.display==='always'?'on-demand':'always'})} chosen={selected.display==='always'}/>
      </View>
      {examples.map(s=><View key={s.id} style={styles.item}>
        <Text style={styles.sub}>{s.cefr} · {s.intentEs} · {s.topic==='work'?'Trabajo':'Vida cotidiana'}</Text>
        {s.examples.map(e=><View key={e.locale} style={{gap:5,marginTop:5}}>
          <Text style={styles.region}>{label[e.locale]} · {e.register==='polite'?'Cortés':e.register==='informal'?'Informal':'Neutro'}</Text>
          <Text selectable style={styles.cue}>{e.sentence}</Text>
          <Text style={styles.sub}>{e.usageNote}</Text>
          <View style={styles.row}><Action text={`Escuchar ${label[e.locale]}`} onPress={()=>{
            void Speech.stop();Speech.speak(e.sentence,{language:e.locale,rate,onError:()=>setError('No hay una voz compatible disponible para reproducir esta frase.')});
          }}/></View>
        </View>)}
      </View>)}
    </>}
    {!!error&&<Text style={styles.warn}>{error}</Text>}
    <Text style={styles.sub}>Frases originales. La voz sintetizada puede tener otro acento y puede depender de una voz por descargar. Estas preferencias todavía no cambian el reconocedor de las lecciones principales ni certifican pronunciación regional; no hay grabaciones propias de estos acentos todavía.</Text>
  </View>;
}
