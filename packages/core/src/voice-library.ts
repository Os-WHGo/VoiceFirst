/** Authored audio cues and deterministic offline-first delivery.
 * Speech generation (TTS) is NOT a lesson generator. This module performs no network calls.
 * Asset entries require verified local files and a recorded license before selection.
 */
import type {TargetLanguage} from './types.js';
import {targetLanguages} from './types.js';
import {guidedDialogues} from './guided-dialogues.js';
import {offlineLessons} from './course.js';

export const voiceLocales:Readonly<Record<TargetLanguage,string>> = {
  'en-CA':'en-CA','fr-CA':'fr-CA',es:'es-ES','pt-BR':'pt-BR',de:'de-DE',it:'it-IT',
};
export type VoiceCueKind='dialogue-question'|'dialogue-model-answer'|'dialogue-help'|'lesson-phrase';
export interface VoiceCue {
  id:string;
  language:TargetLanguage;
  locale:string;
  text:string;
  kind:VoiceCueKind;
  source:'voicefirst-original';
}
const cue=(id:string,language:TargetLanguage,text:string,kind:VoiceCueKind):VoiceCue=>({
  id,language,locale:voiceLocales[language],text,kind,source:'voicefirst-original',
});
/** Human-authored prompts become a reproducible audio recording/generation queue. */
export const authoredVoiceCues:readonly VoiceCue[] = [
  ...guidedDialogues.flatMap(dialogue=>dialogue.turns.flatMap(turn=>[
    cue(`dialogue/${dialogue.id}/${turn.id}/question`,dialogue.target,turn.teacherCue,'dialogue-question'),
    ...turn.acceptedReplies.map((reply,index)=>cue(`dialogue/${dialogue.id}/${turn.id}/example/${index+1}`,dialogue.target,reply,'dialogue-model-answer')),
  ])),
  ...offlineLessons.flatMap(lesson=>lesson.exercises.map(exercise=>cue(`lesson/${lesson.id}/${exercise.id}`,lesson.language,exercise.utterance,'lesson-phrase'))),
];
export function voiceCueById(id:string):VoiceCue|undefined{return authoredVoiceCues.find(x=>x.id===id);}
export function audioCueForDialogue(dialogueId:string,turnId:string):VoiceCue|undefined{
  return voiceCueById(`dialogue/${dialogueId}/${turnId}/question`);
}
export function answerAudioCuesForDialogue(dialogueId:string,turnId:string):VoiceCue[]{
  return authoredVoiceCues.filter(x=>x.id.startsWith(`dialogue/${dialogueId}/${turnId}/example/`));
}
/** Fingerprint is a content version tag, not a cryptographic authentication code. */
export function cueFingerprint(text:string):string {
  let hash=2166136261;
  for(const char of text){const cp=char.codePointAt(0)!;hash=Math.imul(hash^cp,16777619)>>>0;}
  return hash.toString(16).padStart(8,'0');
}
export interface VoiceAsset {
  cueId:string;
  fingerprint:string;
  language:TargetLanguage;
  locale:string;
  /** Relative pack path only. Never an HTTP URL or arbitrary absolute path. */
  path:string;
  format:'m4a'|'mp3'|'wav';
  sha256:string;
  license:'voicefirst-original'|'licensed-third-party';
  /** Written permission or license reference is mandatory for third-party recordings. */
  permissionReference?:string;
}
export interface InstalledVoice {
  identifier:string;
  locale:string;
  /** Host must establish offline eligibility separately; Expo voice listing alone doesn't. */
  offlineVerified:boolean;
  quality?:'Default'|'Enhanced';
}
export type VoicePlan=
  |{kind:'asset';asset:VoiceAsset;cue:VoiceCue}
  |{kind:'native-tts';voice:InstalledVoice;cue:VoiceCue;offlineGuaranteed:boolean}
  |{kind:'unavailable';cue:VoiceCue;reason:'asset-required'|'no-voice'|'no-verified-offline-voice'};

function assetValid(a:VoiceAsset,c:VoiceCue):boolean{
  if(!a||a.cueId!==c.id||a.language!==c.language||a.locale!==c.locale||a.fingerprint!==cueFingerprint(c.text))return false;
  if(!/^[a-f0-9]{64}$/i.test(a.sha256))return false;
  if(!/^[\w-]+(?:\/[\w.-]+)*\.(m4a|mp3|wav)$/.test(a.path)||a.path.includes('..')||a.path.split('/').some(x=>x==='.'||x==='..'))return false;
  if(!a.path.endsWith(`.${a.format}`))return false;
  if(a.license==='licensed-third-party'&&!a.permissionReference?.trim())return false;
  if(!['voicefirst-original','licensed-third-party'].includes(a.license))return false;
  return true;
}
/** installedAssets must be obtained from a verified local file inventory, not remote URLs. */
export function planVoiceOutput(input:{
  cue:VoiceCue; assets?:readonly VoiceAsset[]; installedAssets?:ReadonlySet<string>;
  voices?:readonly InstalledVoice[]; requireOffline?:boolean; requireRecorded?:boolean;
}):VoicePlan{
  const {cue:line}=input;
  if(!targetLanguages.includes(line.language)||line.locale!==voiceLocales[line.language]||!line.text.trim())throw new Error('Invalid voice cue');
  const asset=input.assets?.find(a=>assetValid(a,line)&&input.installedAssets?.has(a.path));
  if(asset)return{kind:'asset',asset,cue:line};
  if(input.requireRecorded)return{kind:'unavailable',cue:line,reason:'asset-required'};
  const voices=(input.voices??[]).filter(v=>v.identifier.trim()&&v.locale.trim()&&(!input.requireOffline||v.offlineVerified));
  const languagePrefix=line.locale.slice(0,2).toLowerCase();
  const best=voices.filter(v=>v.locale.toLowerCase()===line.locale.toLowerCase())
    .sort((a,b)=>Number(b.quality==='Enhanced')-Number(a.quality==='Enhanced'))[0]
    ??voices.find(v=>v.locale.toLowerCase().split('-')[0]===languagePrefix);
  if(best)return{kind:'native-tts',voice:best,cue:line,offlineGuaranteed:best.offlineVerified};
  return{kind:'unavailable',cue:line,reason:input.requireOffline?'no-verified-offline-voice':'no-voice'};
}
/** Never send authored prompts to an unapproved model, nor mistake TTS for ASR. */
export function authoringInventory(){
  return targetLanguages.map(language=>({language,locale:voiceLocales[language],
    authoredCues:authoredVoiceCues.filter(c=>c.language===language).length}));
}
