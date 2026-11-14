/** Explicit private A1 six-WAV editorial folder import. Never public voice
 * packs, downloadable media, student progress, licensed content approval or AI.
 * Transfer uses the existing Expo FileSystem Directory picker; physical iOS/
 * Android sandbox behavior still requires B1 device verification.
 */
import {Directory,File,Paths} from 'expo-file-system';
import {
 expandedA1GreetingPilots,expandedA1SituationalPilots,
 inspectA1SixTurnAudioManifest,auditA1SixTurnAudio,
 inspectPcmWav,sha256Bytes,type A1SixTurnNativeAudioVerifier
} from '@voicefirst/core';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const rootName='voicefirst-a1-review';
const maxManifestBytes=16384;
const maxClipBytes=8*1024*1024;
export type A1PrivateImportResult=
 |{kind:'installed';sceneId:string;verified:6;publicAvailable:false;rightsCleared:false}
 |{kind:'cancelled'}
 |{kind:'rejected';reason:string};

type A1Scene=(typeof scenes)[number];
function getScene(sceneId:string):A1Scene|undefined{
 return scenes.find(scene=>scene.sceneId===sceneId);
}
function filePort(source:Directory,scene:A1Scene):A1SixTurnNativeAudioVerifier {
 return {
  async checkOwnedClip(audioId,durationMs){
   const turn=scene.turns.find(t=>t.audioId===audioId);
   if(!turn)throw Error('ID de audio ajeno a la escena.');
   const clip=new File(source,turn.id+'.wav');
   if(!clip.exists||!Number.isSafeInteger(clip.size)||
     clip.size<=0||clip.size>maxClipBytes)
    throw Error('Falta un WAV o excede el límite de tamaño.');
   const size=clip.size;
   const bytes=await clip.bytes();
   if(bytes.byteLength!==size)
    throw Error('El WAV cambió durante su lectura.');
   return {bytes:bytes.byteLength,sha256:sha256Bytes(bytes),
    validPcmWav:inspectPcmWav(bytes,durationMs).valid};
  }
 };
}
async function verifyFolder(source:Directory,scene:A1Scene){
 if(!source.exists)throw Error('No existe la carpeta seleccionada.');
 const expected=['manifest.json',...scene.turns.map(turn=>turn.id+'.wav')].sort();
 const contents=source.list().map(item=>item.name).sort();
 if(contents.length!==expected.length||
   contents.some((name,i)=>name!==expected[i]))
  throw Error('La carpeta debe contener exactamente un manifiesto y seis WAV de la situación seleccionada.');
 const manifest=new File(source,'manifest.json');
 if(!manifest.exists||!Number.isSafeInteger(manifest.size)||
    manifest.size<=0||manifest.size>maxManifestBytes)
  throw Error('Manifiesto A1 ausente o demasiado grande.');
 const raw=await manifest.text();
 if(raw.length>maxManifestBytes)throw Error('Manifiesto A1 demasiado grande.');
 let value:unknown;
 try{value=JSON.parse(raw);}catch{throw Error('El manifiesto A1 no es JSON válido.');}
 if(inspectA1SixTurnAudioManifest(scene.sceneId,value).kind!=='candidate')
  throw Error('Identidad, texto, acento, procedencia o permisos del paquete inválidos.');
 const report=await auditA1SixTurnAudio(scene.sceneId,value,filePort(source,scene));
 if(!report.readyForEditorialPlayback||report.verified!==6)
  throw Error('Algún WAV no superó la verificación de PCM, duración y SHA-256.');
 return{value,raw};
}
/** User must explicitly pick a folder prepared with plan/build/verify on their
 * own device. Fail closed on existing destinations, untrusted IDs and all
 * six-source-file integrity errors. No server, network or automatic recording.
 */
export async function installA1EditorialAudioFromFolder(
 sceneId:string,source:Directory
):Promise<A1PrivateImportResult>{
 if(!__DEV__)return{kind:'rejected',reason:'Solo revisión interna de desarrollo.'};
 const scene=getScene(sceneId);
 if(!scene)return{kind:'rejected',reason:'Situación editorial A1 desconocida.'};
 let incoming:Directory|null=null;
 try{
  const original=await verifyFolder(source,scene);
  const root=new Directory(Paths.document,rootName);
  if(!root.exists)root.create({intermediates:true,idempotent:true});
  const language=new Directory(root,scene.targetLanguage);
  if(!language.exists)language.create({intermediates:true,idempotent:true});
  const level=new Directory(language,'a1');
  if(!level.exists)level.create({intermediates:true,idempotent:true});
  const destination=new Directory(level,scene.unitId);
  if(destination.exists)
   throw Error('Ya existe este ensayo local A1. No se sobrescribirá ni eliminará.');
  const staging=new Directory(level,'.incoming-'+scene.unitId);
  if(staging.exists)
   throw Error('Existe una importación incompleta. No se borrará sin revisión.');
  staging.create({intermediates:true});
  incoming=staging;
  // Copy only known source filenames, never manifest-controlled paths.
  for(const turn of scene.turns){
   const src=new File(source,turn.id+'.wav');
   const dst=new File(staging,turn.id+'.wav');
   await src.copy(dst,{overwrite:false});
  }
  const originalManifest=new File(source,'manifest.json');
  await originalManifest.copy(new File(staging,'manifest.json'),{overwrite:false});
  // Recheck ALL copied WAV bytes, plus the copied exact manifest, before
  // making the folder visible to the player. No trusted check is cached.
  const copied=await verifyFolder(staging,scene);
  if(copied.raw!==original.raw)
   throw Error('El manifiesto cambió durante la copia.');
  if(destination.exists)
   throw Error('La carpeta de destino apareció durante la importación.');
  await staging.move(destination,{overwrite:false});
  incoming=null;
  return{kind:'installed',sceneId,verified:6,
   publicAvailable:false,rightsCleared:false};
 }catch(error){
  // Delete only staging created in THIS invocation. Never delete existing
  // packages, prior failed staging or the user's source originals.
  if(incoming?.exists){try{incoming.delete();}catch{/* preserve for manual inspection */}}
  return{kind:'rejected',reason:error instanceof Error?error.message:
   'No se pudo verificar/copiar el ensayo A1.'};
 }
}
/** A manual Files/Document picker. Not a background import or release UI. */
export async function selectAndInstallA1EditorialAudio(sceneId:string):Promise<A1PrivateImportResult>{
 if(!__DEV__)return{kind:'rejected',reason:'Solo revisión interna de desarrollo.'};
 if(!getScene(sceneId))return{kind:'rejected',reason:'Situación A1 no autorizada.'};
 try{
  const directory=await Directory.pickDirectoryAsync();
  return await installA1EditorialAudioFromFolder(sceneId,directory);
 }catch(error){
  const reason=error instanceof Error?error.message:'Selector de carpetas no disponible.';
  if(/cancel/i.test(reason))return{kind:'cancelled'};
  return{kind:'rejected',reason:'No se pudo abrir el selector local. '+reason};
 }
}
