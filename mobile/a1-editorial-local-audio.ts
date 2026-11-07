/** Manual, development-only audit of app-owned A1 six-turn narration.
 * No download, file import, microphone, upload, playback or persistent trust.
 * These paths are distinct from both public voice packs and C1/C2 review.
 */
import {File,Paths} from 'expo-file-system';
import {
 expandedA1GreetingPilots,expandedA1SituationalPilots,
 inspectA1SixTurnAudioManifest,auditA1SixTurnAudio,
 sha256Bytes,inspectPcmWav
} from '@voicefirst/core';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const audioIds=new Set(scenes.flatMap(scene=>scene.turns.map(turn=>turn.audioId)));
const maxClipBytes=8*1024*1024;
const manifestLimit=16384;
const folder='voicefirst-a1-review';

export function privateA1EditorialAudioUri(audioId:string):string|null {
 if(!audioIds.has(audioId))return null;
 const pieces=audioId.split('/');
 if(pieces.length!==4||pieces[1]!=='a1')return null;
 const turn=pieces.pop()!;
 return new File(Paths.document,folder,...pieces,turn+'.wav').uri;
}
export type A1LocalAudioStatus=
 |{kind:'missing'|'rejected';reason:string;verified:0;ready:false;publicAvailable:false}
 |{kind:'checked';reason:string;verified:number;ready:boolean;publicAvailable:false};
/** Re-reads the raw WAV file, validates PCM format and compares SHA-256
 * against the strict six-turn editorial manifest on each request.
 */
export async function reviewA1LocalAudio(sceneId:string):Promise<A1LocalAudioStatus> {
 const scene=scenes.find(s=>s.sceneId===sceneId);
 if(!scene)return{kind:'rejected',reason:'Situación A1 desconocida.',verified:0,ready:false,publicAvailable:false};
 try{
  const manifest=new File(Paths.document,folder,scene.targetLanguage,'a1',scene.unitId,'manifest.json');
  if(!manifest.exists)return{kind:'missing',reason:'No hay grabaciones originales instaladas para este diálogo.',verified:0,ready:false,publicAvailable:false};
  if(!Number.isSafeInteger(manifest.size)||manifest.size<=0||manifest.size>manifestLimit)
   return{kind:'rejected',reason:'Tamaño de manifiesto inválido.',verified:0,ready:false,publicAvailable:false};
  const raw=await manifest.text();
  if(raw.length>manifestLimit)return{kind:'rejected',reason:'Manifiesto demasiado grande.',verified:0,ready:false,publicAvailable:false};
  const candidate:unknown=JSON.parse(raw);
  if(inspectA1SixTurnAudioManifest(sceneId,candidate).kind!=='candidate')
   return{kind:'rejected',reason:'Identidad, procedencia o metadatos inválidos.',verified:0,ready:false,publicAvailable:false};
  const checked=await auditA1SixTurnAudio(sceneId,candidate,{
   async checkOwnedClip(audioId,durationMs){
    const uri=privateA1EditorialAudioUri(audioId);
    if(!uri)throw Error('Unapproved A1 audio ID');
    const file=new File(uri);
    if(!file.exists||!Number.isSafeInteger(file.size)||file.size<=0||file.size>maxClipBytes)
     throw Error('Missing or oversized private audio');
    const bytes=await file.bytes();
    if(bytes.byteLength!==file.size)throw Error('File changed during verification');
    return {bytes:bytes.byteLength,sha256:sha256Bytes(bytes),
     validPcmWav:inspectPcmWav(bytes,durationMs).valid};
   }
  });
  return {kind:'checked',verified:checked.verified,
   ready:checked.readyForEditorialPlayback,publicAvailable:false,
   reason:checked.readyForEditorialPlayback?
    'Se verificaron seis archivos locales. Derechos, calidad y publicación aún pendientes.':
    'Auditoría incompleta o fallida; ningún audio está aprobado para publicación.'};
 }catch{
  return{kind:'rejected',reason:'No se pudo verificar el audio privado.',verified:0,ready:false,publicAvailable:false};
 }
}
