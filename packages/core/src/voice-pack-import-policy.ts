/** Offline pack import preflight. Pure policy so malformed or oversized manifests
 * are rejected before a native folder is read or created.
 */
import {inspectVoicePack,type VoicePack,type RecordedCue} from './voice-packs.js';
export type WavImportPreflight={valid:true;pack:VoicePack;recordings:readonly RecordedCue[];missing:number;totalBytes:number}
 |{valid:false;errors:readonly string[]};
export const MAX_LOCAL_AUDIO_BYTES=128*1024*1024;
export const MAX_LOCAL_AUDIO_CLIPS=200;
const importClipPath=/^clips\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,80}\.wav$/;
export function preflightLocalWavPack(value:unknown):WavImportPreflight{
 const inspected=inspectVoicePack(value);
 if(!inspected.valid)return {valid:false,errors:inspected.errors};
 const pack=value as VoicePack;
 const errors:string[]=[];
 if(pack.id!==`voicefirst-${pack.language}-v1`)errors.push('Unrecognized pack identity');
 if(inspected.recordings.length>MAX_LOCAL_AUDIO_CLIPS)errors.push('Too many narrated clips');
 let total=0;
 for(const row of inspected.recordings){
  if(row.format!=='wav'||!importClipPath.test(row.path))errors.push('Import requires clips/NAME.wav from the authored builder');
  total+=row.bytes;
  if(total>MAX_LOCAL_AUDIO_BYTES)break;
 }
 if(total>MAX_LOCAL_AUDIO_BYTES)errors.push('Local pack exceeds 128 MiB');
 return errors.length?{valid:false,errors}:{valid:true,pack,recordings:inspected.recordings,
   missing:inspected.missingCueIds.length,totalBytes:total};
}
