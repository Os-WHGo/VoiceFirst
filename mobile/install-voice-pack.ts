/** Explicit local folder import only. This is NOT a network download or signed publisher update.
 * Import never overwrites a working pack. Validate permissions, reviewed source,
 * bounded WAV bytes and per-clip digest, then copy to a staging directory and move.
 * iOS/Android picker and storage semantics need physical device validation.
 */
import {Directory,File,Paths} from 'expo-file-system';
import {inspectVoicePack,sha256Bytes,type VoicePack,type RecordedCue} from '@voicefirst/core';

export type VoicePackImportResult=
 |{kind:'installed';language:string;clips:number;missing:number}
 |{kind:'rejected';reason:string}
 |{kind:'cancelled'};

function isWav(bytes:Uint8Array):boolean{
 return bytes.length>=44 && String.fromCharCode(...bytes.slice(0,4))==='RIFF'
  && String.fromCharCode(...bytes.slice(8,12))==='WAVE';
}
function isSafePath(path:string):boolean{
 return /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.wav$/.test(path)
  && !path.split('/').some(segment=>segment==='.'||segment==='..')
  && path.length<=180;
}
async function checkedClip(root:Directory,entry:RecordedCue):Promise<void>{
 if(!isSafePath(entry.path)||entry.format!=='wav')throw Error('Solo se admiten clips WAV preparados y verificados.');
 const audio=new File(root,...entry.path.split('/'));
 if(!audio.exists||audio.size!==entry.bytes)throw Error('Clip ausente o con tamaño incorrecto.');
 const bytes=await audio.bytes();
 if(bytes.byteLength!==entry.bytes||!isWav(bytes)||sha256Bytes(bytes).toLowerCase()!==entry.sha256.toLowerCase())
   throw Error('El clip no coincide con el manifiesto o no es un WAV válido.');
}
export async function installVoicePackFromFolder(folder:Directory):Promise<VoicePackImportResult>{
 let staging:Directory|null=null;
 try{
  const manifest=new File(folder,'pack.json');
  if(!manifest.exists||manifest.size>1024*1024)throw Error('Falta pack.json o supera el tamaño permitido.');
  let raw:unknown;
  try{raw=JSON.parse(await manifest.text());}catch{throw Error('Manifiesto ilegible.');}
  const inspection=inspectVoicePack(raw);
  if(!inspection.valid)throw Error('Licencias, permisos o datos del paquete no válidos: '+inspection.errors.slice(0,2).join('; '));
  const pack=raw as VoicePack;
  if(pack.id!==`voicefirst-${pack.language}-v1`)throw Error('Identidad del paquete no reconocida.');
  if(inspection.recordings.length>200)throw Error('Paquete demasiado grande.');
  const total=inspection.recordings.reduce((n,c)=>n+c.bytes,0);
  if(total>128*1024*1024)throw Error('El paquete supera los 128 MiB autorizados para esta importación.');
  for(const recording of inspection.recordings)await checkedClip(folder,recording);
  // The complete set of metadata and clips must be trusted by the learner.
  // SHA-256 detects changes, not who produced the original manifest.
  const root=new Directory(Paths.document,'voicefirst-voices');
  if(!root.exists)root.create({intermediates:true,idempotent:true});
  const dest=new Directory(root,pack.language);
  if(dest.exists)throw Error('Ya existe un paquete instalado: no se reemplazará ni borrará.');
  const incoming=new Directory(root,`.incoming-${pack.language}`);
  if(incoming.exists)throw Error('Quedó una importación anterior sin finalizar. No sobrescribiremos sus archivos.');
  incoming.create({intermediates:true});
  staging=incoming;
  for(const recording of inspection.recordings){
   const segments=recording.path.split('/');
   let dir=incoming;
   for(const part of segments.slice(0,-1)){
    dir=new Directory(dir,part);
    if(!dir.exists)dir.create({intermediates:true,idempotent:true});
   }
   const clip=new File(folder,...segments);
   await clip.copy(new File(incoming,...segments),{overwrite:false});
   await checkedClip(incoming,recording);
  }
  await manifest.copy(new File(incoming,'pack.json'),{overwrite:false});
  const copied=new File(incoming,'pack.json');
  if(await copied.text()!==await manifest.text())throw Error('El manifiesto cambió durante la copia.');
  await incoming.move(dest,{overwrite:false});
  staging=null;
  return {kind:'installed',language:pack.language,clips:inspection.recordings.length,missing:inspection.missingCueIds.length};
 }catch(e){
  if(staging?.exists){try{staging.delete();}catch{/* leave staging for explicit inspection; never touch installed packs */}}
  return {kind:'rejected',reason:e instanceof Error?e.message:'No se pudo validar o copiar el paquete.'};
 }
}
export async function selectAndInstallVoicePack():Promise<VoicePackImportResult>{
 try{
  const directory=await Directory.pickDirectoryAsync();
  return await installVoicePackFromFolder(directory);
 }catch(e){
  const reason=e instanceof Error?e.message:'Selector de carpetas no disponible';
  if(/cancel/i.test(reason))return {kind:'cancelled'};
  return {kind:'rejected',reason:'No se pudo seleccionar una carpeta local. '+reason};
 }
}
