/** Offline pragmatic-language practice. No diagnosis, microphone or network. */
import React,{useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {explainPragmatics,pragmaticsScenarios,type PragmaticsDetail} from '@voicefirst/core';
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:17,gap:10,marginTop:12},title:{fontSize:18,fontWeight:'700',color:'#F2F7FC'},text:{fontSize:13,color:'#A6BBD0',lineHeight:20},phrase:{fontSize:17,color:'#F3DFC1',fontWeight:'700'},heading:{fontSize:13,color:'#89D4C5',fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{borderWidth:1,borderColor:'#89D4C5',borderRadius:12,padding:11,minHeight:44,justifyContent:'center'},active:{backgroundColor:'#22414A'},buttonText:{color:'#F2F7FC',fontWeight:'600'},item:{borderTopWidth:1,borderTopColor:'#2B435A',paddingTop:9,gap:5}});
function Choice({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} style={[s.button,active&&s.active]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></Pressable>}
export function PragmaticsPractice(){
 const [detail,setDetail]=useState<PragmaticsDetail>('step-by-step');
 const [chosen,setChosen]=useState(pragmaticsScenarios[0]?.id??'');
 const [revealed,setRevealed]=useState(false);
 const scenario=explainPragmatics(chosen,detail);
 return <View style={s.wrap}>
  <Text style={s.title}>🧩 Entender lo que se quiere decir</Text>
  <Text style={s.text}>Práctica opcional: interpreta sarcasmo y expresiones informales. No tienes que adivinar intenciones ni compartir un diagnóstico.</Text>
  <Text style={s.heading}>Elige una situación</Text>
  <View style={s.row}>{pragmaticsScenarios.map(x=><Choice key={x.id} label={x.locale==='es-CL'?'Español chileno':x.locale==='en-CA'?'Inglés canadiense':'Español general'} active={chosen===x.id} onPress={()=>{setChosen(x.id);setRevealed(false)}}/>)}</View>
  <Text style={s.phrase}>{scenario?.utterance}</Text>
  <View style={s.row}><Choice label="Explicación breve" active={detail==='brief'} onPress={()=>setDetail('brief')}/><Choice label="Paso a paso" active={detail==='step-by-step'} onPress={()=>setDetail('step-by-step')}/></View>
  <Choice label={revealed?'Ocultar explicación':'Ver posibles significados'} active={revealed} onPress={()=>setRevealed(x=>!x)}/>
  {revealed&&scenario&&<View style={s.item}>
   {'literal' in scenario&&<><Text style={s.heading}>Literalmente</Text><Text style={s.text}>{scenario.literal}</Text></>}
   <Text style={s.heading}>Qué podría significar</Text><Text style={s.text}>{scenario.possibleMeaning}</Text>
   {'observableCue' in scenario&&<><Text style={s.heading}>Pista del contexto</Text><Text style={s.text}>{scenario.observableCue}</Text></>}
   <Text style={s.heading}>Lo que no sabemos</Text><Text style={s.text}>{scenario.uncertainty}</Text>
   <Text style={s.heading}>Cómo pedir una aclaración</Text><Text style={s.text}>{scenario.clarification}</Text>
  </View>}
 </View>;
}
