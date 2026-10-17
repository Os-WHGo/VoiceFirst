/** Play only teacher-authored questions and answers, never LLM-generated text.
 * Uses installed system voices for a free prototype; no remote TTS API is called.
 * Expo does not certify offline capability of iOS/Android voices here. For an
 * offline guarantee, validated voice packs/voices must be installed separately.
 */
import * as Speech from 'expo-speech';
import {planVoiceOutput,type VoiceCue,type InstalledVoice} from '@voicefirst/core';

export async function playCuratedVoice(line:VoiceCue,rate:number,
  onDone?:()=>void,onError?:(message:string)=>void):Promise<void>{
  try{
    const list=await Speech.getAvailableVoicesAsync();
    const voices:InstalledVoice[]=list.map(v=>({identifier:v.identifier,locale:v.language,
      quality:v.quality==='Enhanced'?'Enhanced':'Default',offlineVerified:false}));
    const plan=planVoiceOutput({cue:line,voices});
    if(plan.kind!=='native-tts'){
      onError?.('Este idioma no tiene una voz disponible en el dispositivo. Puedes continuar leyendo la pregunta.');
      return;
    }
    await Speech.stop();
    Speech.speak(line.text,{language:plan.voice.locale,voice:plan.voice.identifier,rate,
      onDone,onError:()=>onError?.('No se pudo reproducir la voz disponible en este dispositivo.')});
  }catch{
    onError?.('No fue posible leer las voces del dispositivo. No se envió texto a un servicio de VoiceFirst.');
  }
}
