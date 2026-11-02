/** Strict validation for VoiceFirst locally installed narrated cue packs.
 * Authored content only. SHA-256 of the BYTES must be checked by the host before playback.
 * Metadata-only validation is never evidence that an audio file is actually present.
 */
import {authoredVoiceCues,cueFingerprint,voiceLocales,type VoiceAsset} from './voice-library.js';
import {targetLanguages,type TargetLanguage} from './types.js';

export interface RecordedCue extends VoiceAsset {
  bytes:number;
  durationMs:number;
  rightsOwner:string;
  rightsReference:string;
  reviewer:string;
}
export interface VoicePack {
  schema:1;
  id:string;
  language:TargetLanguage;
  locale:string;
  /** A pack can be partial; VoiceFirst uses system TTS for missing cues when permitted. */
  complete:boolean;
  recordings:readonly RecordedCue[];
}
export type PackInspection={valid:true;recordings:readonly RecordedCue[];missingCueIds:readonly string[]}
  |{valid:false;errors:readonly string[]};
const safePart=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const safePath=/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.(wav|m4a|mp3)$/;
const assetByCue=new Map(authoredVoiceCues.map(x=>[x.id,x]));
const MAX_BYTES=8*1024*1024;

export function inspectVoicePack(value:unknown):PackInspection {
  if(!value||typeof value!=='object'||Array.isArray(value))return{valid:false,errors:['Invalid pack document']};
  const p=value as Partial<VoicePack>;
  const errors:string[]=[];
  if(p.schema!==1)errors.push('Unsupported pack schema');
  if(typeof p.id!=='string'||!safePart.test(p.id))errors.push('Invalid pack id');
  if(!targetLanguages.includes(p.language as TargetLanguage)||p.locale!==voiceLocales[p.language as TargetLanguage])errors.push('Invalid language or locale');
  if(typeof p.complete!=='boolean')errors.push('Missing completeness declaration');
  if(!Array.isArray(p.recordings)||p.recordings.length===0||p.recordings.length>authoredVoiceCues.length){errors.push('Invalid recordings list');return{valid:false,errors};}
  const seenId=new Set<string>();const seenPath=new Set<string>();
  for(const [index,r] of p.recordings.entries()){
    if(!r||typeof r!=='object'){errors.push(`Recording ${index}: invalid object`);continue;}
    const row=r as RecordedCue;
    const c=assetByCue.get(row.cueId);
    if(!c||c.language!==p.language)errors.push(`Recording ${index}: unknown or foreign-language cue`);
    else if(row.fingerprint!==cueFingerprint(c.text)||row.language!==c.language||row.locale!==c.locale)
      errors.push(`Recording ${index}: authored content or locale has changed`);
    if(seenId.has(row.cueId))errors.push(`Recording ${index}: duplicate cue`);seenId.add(row.cueId);
    if(typeof row.path!=='string'||!safePath.test(row.path)||row.path.includes('..')||row.path.includes('//')||row.path.startsWith('/')||row.path.split('/').some(x=>x==='.'||x==='..'))
      errors.push(`Recording ${index}: unsafe path`);
    if(seenPath.has(row.path))errors.push(`Recording ${index}: duplicate audio file`);seenPath.add(row.path);
    if(!['wav','mp3','m4a'].includes(row.format)||typeof row.path!=='string'||!row.path.endsWith(`.${row.format}`))errors.push(`Recording ${index}: format mismatch`);
    if(typeof row.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(row.sha256))errors.push(`Recording ${index}: invalid hash`);
    if(!Number.isSafeInteger(row.bytes)||row.bytes<44||row.bytes>MAX_BYTES)errors.push(`Recording ${index}: invalid size`);
    if(!Number.isFinite(row.durationMs)||row.durationMs<150||row.durationMs>60_000)errors.push(`Recording ${index}: invalid duration`);
    if(row.license!=='voicefirst-original'&&row.license!=='licensed-third-party')errors.push(`Recording ${index}: license missing`);
    for(const key of ['rightsOwner','rightsReference','reviewer'] as const){
      if(typeof row[key]!=='string'||row[key].trim().length<3||row[key].length>200)errors.push(`Recording ${index}: missing ${key}`);
    }
    if(row.license==='licensed-third-party' && (!row.permissionReference?.trim() || row.permissionReference.length>200))
      errors.push(`Recording ${index}: third-party permission missing`);
  }
  if(errors.length)return{valid:false,errors};
  const missing=authoredVoiceCues.filter(c=>c.language===p.language&&!seenId.has(c.id)).map(c=>c.id);
  if(p.complete&&missing.length)return{valid:false,errors:['Pack marked complete but cues are missing']};
  return{valid:true,recordings:p.recordings as readonly RecordedCue[],missingCueIds:missing};
}
export function voicePackInventory(pack:VoicePack){
  const result=inspectVoicePack(pack);
  if(!result.valid)return {valid:false,errors:result.errors};
  return {valid:true,language:pack.language,recorded:result.recordings.length,missing:result.missingCueIds.length};
}
