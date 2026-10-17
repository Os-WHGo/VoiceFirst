/** Read-only, locally installed voice packs. No downloads and no API calls.
 * Device path: Documents/voicefirst-voices/<language>/pack.json and clips/*.wav.
 * A future installer must verify and atomically copy a pack here first.
 */
import {File,Paths} from 'expo-file-system';
import {inspectVoicePack,sha256Bytes,type VoiceCue,type VoicePack,type RecordedCue} from '@voicefirst/core';

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
    if(bytes.byteLength!==entry.bytes||sha256Bytes(bytes).toLowerCase()!==entry.sha256.toLowerCase())
      return{kind:'invalid',reason:'El audio no superó la comprobación SHA-256'};
    return{kind:'verified',uri:recording.uri,durationMs:entry.durationMs,cue:entry};
  }catch{return{kind:'invalid',reason:'El paquete de voz no se pudo verificar'};}
}
