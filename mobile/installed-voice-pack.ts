/** Read-only, locally installed voice packs. No downloads and no API calls.
 * Device path: Documents/voicefirst-voices/<language>/pack.json and clips/*.wav.
 * A future installer must verify and atomically copy a pack here first.
 */
import {File,Directory,Paths} from 'expo-file-system';
import {inspectVoicePack,inspectPcmWav,sha256Bytes,type VoiceCue,type VoicePack,type RecordedCue,type TargetLanguage} from '@voicefirst/core';

export type LocalCueResult={kind:'not-installed'|'not-in-pack'}|{kind:'invalid';reason:string}|
  {kind:'verified';uri:string;durationMs:number;cue:RecordedCue};

export async function findVerifiedRecordedCue(line:VoiceCue):Promise<LocalCueResult>{
  try{
    const manifestFile=new File(Paths.document,'voicefirst-voices',line.language,'pack.json');
    if(!manifestFile.exists)return {kind:'not-installed'};
    // A failed or tampered pack never falls back silently to a system voice.
    if(manifestFile.size>1024*1024)return{kind:'invalid',reason:'Manifiesto demasiado grande'};
    const pack=JSON.parse(await manifestFile.text()) as VoicePack;
    const check=inspectVoicePack(pack);
    if(!check.valid||pack.language!==line.language||pack.id!==`voicefirst-${line.language}-v1`)
      return{kind:'invalid',reason:'Metadatos de audio incorrectos'};
    const entry=check.recordings.find(x=>x.cueId===line.id);
    if(!entry)return{kind:'not-in-pack'};
    const recording=new File(Paths.document,'voicefirst-voices',line.language,...entry.path.split('/'));
    if(!recording.exists||recording.size!==entry.bytes)
      return{kind:'invalid',reason:'Falta la grabación o cambió su tamaño'};
    const bytes=await recording.bytes();
    if(bytes.byteLength!==entry.bytes||!inspectPcmWav(bytes,entry.durationMs).valid||sha256Bytes(bytes).toLowerCase()!==entry.sha256.toLowerCase())
      return{kind:'invalid',reason:'El audio no superó la comprobación SHA-256'};
    return{kind:'verified',uri:recording.uri,durationMs:entry.durationMs,cue:entry};
  }catch{return{kind:'invalid',reason:'El paquete de voz no se pudo verificar'};}
}

/** The inventory reads every clip, not just a self-declared count in pack.json.
 * Run on demand; on-device WAV validation and hashing can consume time/energy.
 */
export type InstalledNarrationStatus=
  |{kind:'not-installed';language:TargetLanguage}
  |{kind:'valid';language:TargetLanguage;verified:number;missing:number;sampleCueId:string}
  |{kind:'invalid';language:TargetLanguage;reason:string;verified:number};
export async function inspectInstalledNarrations(language:TargetLanguage):Promise<InstalledNarrationStatus>{
 let verified=0;
 try{
  const root=new Directory(Paths.document,'voicefirst-voices',language);
  const manifest=new File(root,'pack.json');
  if(!manifest.exists)return{kind:'not-installed',language};
  if(manifest.size>1024*1024)return{kind:'invalid',language,verified,reason:'El manifiesto es demasiado grande.'};
  const value:unknown=JSON.parse(await manifest.text());
  const checked=inspectVoicePack(value);
  if(!checked.valid)return{kind:'invalid',language,verified,reason:'Metadatos o permisos no válidos.'};
  const p=value as VoicePack;
  if(p.language!==language||p.id!==`voicefirst-${language}-v1`)
    return{kind:'invalid',language,verified,reason:'Paquete asignado a otro idioma.'};
  for(const cue of checked.recordings){
   if(cue.format!=='wav'||!/^clips\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,80}\.wav$/.test(cue.path))
    return{kind:'invalid',language,verified,reason:'Ruta o formato incompatible con el importador actual.'};
   const file=new File(root,...cue.path.split('/'));
   if(!file.exists||file.size!==cue.bytes)return{kind:'invalid',language,verified,reason:'Clip ausente o truncado.'};
   const bytes=await file.bytes();
   if(bytes.byteLength!==cue.bytes||!inspectPcmWav(bytes,cue.durationMs).valid||
       sha256Bytes(bytes).toLowerCase()!==cue.sha256.toLowerCase())
    return{kind:'invalid',language,verified,reason:'Un audio no coincide con el manifiesto.'};
   verified++;
  }
  return{kind:'valid',language,verified,missing:checked.missingCueIds.length,sampleCueId:checked.recordings[0]!.cueId};
 }catch{return{kind:'invalid',language,verified,reason:'No se pudo revisar el almacenamiento local.'};}
}
