/** Choosing and managing offline speech models on a given device. Builds on the existing LanguagePack catalog,
 * install journal and recovery (language-pack-*.ts); this module adds device fit, stack selection, safe removal
 * and cleanup of temporary files. Pure decisions: no download, file or native call happens here.
 */
import {planLanguagePacks,type LanguagePack} from './language-packs.js';
import type {PackInstallState} from './language-pack-install-state.js';
import {targetLanguages,type TargetLanguage} from './types.js';

export type SpeechEngine='sherpa-onnx'|'whisper.cpp'|'vosk'|'os-on-device';
export type DevicePlatform='android'|'ios';
export interface SpeechModelEntry {
 /** Download, digest, license and dependency data, as for any optional pack. */
 pack:LanguagePack;
 role:'asr'|'tts'|'vad';
 engine:SpeechEngine;
 platforms:readonly DevicePlatform[];
 /** Size on disk once extracted. The archive (pack.bytes) is also needed temporarily during installation. */
 installedBytes:number;
 /** Peak resident memory while loaded, measured or estimated. */
 peakRamMb:number;
 /** Whether the engine reports a calibrated confidence. Without it every spoken answer must be confirmed. */
 calibratedConfidence:boolean;
 /** Whether the recognition language can be fixed (models without it drift on one-word answers). */
 languageLock:boolean;
 evidence:{kind:'none'|'desktop-poc'|'device-test';date?:string;note?:string};
}
export interface DeviceProfile {
 platform:DevicePlatform;
 totalRamMb:number;
 freeDiskBytes:number;
 /** Locales the operating system can recognize on-device (from the native inventory). */
 osOnDeviceAsrLocales:readonly string[];
 /** Locales of installed system voices. */
 osVoiceLocales:readonly string[];
}
export type FitProblem='platform'|'memory'|'storage'|'license'|'not-device-tested';
export interface ModelFit {usable:boolean;problems:readonly FitProblem[];requiredDiskBytes:number}
/** A model may use at most this share of device RAM by default. */
export const defaultRamShare=0.25;
export function assessModelFit(entry:SpeechModelEntry,device:DeviceProfile,options:{ramShare?:number}={}):ModelFit{
 const problems:FitProblem[]=[];
 if(!entry.platforms.includes(device.platform))problems.push('platform');
 if(entry.peakRamMb>device.totalRamMb*(options.ramShare??defaultRamShare))problems.push('memory');
 // Archive and extracted files coexist until promotion, plus a 5% margin.
 const requiredDiskBytes=Math.ceil((entry.pack.bytes+entry.installedBytes)*1.05);
 if(requiredDiskBytes>device.freeDiskBytes)problems.push('storage');
 if(!entry.pack.licenseReviewed)problems.push('license');
 if(entry.evidence.kind!=='device-test')problems.push('not-device-tested');
 // Missing device evidence is reported but does not block a learner-chosen, licensed install.
 return {usable:!problems.some(p=>p!=='not-device-tested'),problems,requiredDiskBytes};
}
export type ConfidencePolicy='use-reported-confidence'|'confirm-every-answer';
export interface SpeechStackPlan {
 locale:string;
 asr:{source:'installed-model'|'os-on-device'|'none';modelId?:string;confidencePolicy:ConfidencePolicy;languageLock:boolean};
 tts:{source:'installed-model'|'os-voice'|'recorded-audio-only';modelId?:string};
 /** The energy VAD in voice-pipeline.ts is always available; a Silero model is used when installed. */
 vad:{source:'installed-model'|'energy';modelId?:string};
 /** Optional downloads that would add offline recognition here, smallest first. */
 suggestedDownloads:readonly {id:string;bytes:number;requiredDiskBytes:number}[];
 /** Typing or choosing is always possible, so a missing engine never blocks a lesson. */
 nonSpeechFallback:true;
}
const exact=(list:readonly string[],locale:string)=>list.some(l=>l.toLowerCase()===locale.toLowerCase());
export function planSpeechStack(input:{target:TargetLanguage;locale?:string;device:DeviceProfile;catalog:readonly SpeechModelEntry[];installedIds:readonly string[]}):SpeechStackPlan{
 if(!targetLanguages.includes(input.target))throw new Error('Unsupported target');
 const locale=input.locale??input.target;
 const forLocale=(role:SpeechModelEntry['role'])=>input.catalog.filter(e=>e.role===role&&e.pack.locales.includes(input.target));
 const installedFit=(role:SpeechModelEntry['role'])=>forLocale(role).filter(e=>input.installedIds.includes(e.pack.id)&&assessModelFit(e,input.device).usable)
  .sort((a,b)=>Number(b.evidence.kind==='device-test')-Number(a.evidence.kind==='device-test')||a.peakRamMb-b.peakRamMb);
 const asrModel=installedFit('asr')[0];
 const asr:SpeechStackPlan['asr']=asrModel?{source:'installed-model',modelId:asrModel.pack.id,confidencePolicy:asrModel.calibratedConfidence?'use-reported-confidence':'confirm-every-answer',languageLock:asrModel.languageLock}
  :exact(input.device.osOnDeviceAsrLocales,locale)?{source:'os-on-device',confidencePolicy:'use-reported-confidence',languageLock:true}
  :{source:'none',confidencePolicy:'confirm-every-answer',languageLock:false};
 const ttsModel=installedFit('tts')[0];
 const tts:SpeechStackPlan['tts']=ttsModel?{source:'installed-model',modelId:ttsModel.pack.id}:exact(input.device.osVoiceLocales,locale)?{source:'os-voice'}:{source:'recorded-audio-only'};
 const vadModel=input.catalog.find(e=>e.role==='vad'&&input.installedIds.includes(e.pack.id)&&assessModelFit(e,input.device).usable);
 const suggestedDownloads=asr.source==='installed-model'?[]:forLocale('asr').filter(e=>!input.installedIds.includes(e.pack.id))
  .map(e=>({e,fit:assessModelFit(e,input.device)})).filter(x=>x.fit.usable).sort((a,b)=>a.e.pack.bytes-b.e.pack.bytes)
  .map(x=>({id:x.e.pack.id,bytes:x.e.pack.bytes,requiredDiskBytes:x.fit.requiredDiskBytes}));
 return {locale,asr,tts,vad:vadModel?{source:'installed-model',modelId:vadModel.pack.id}:{source:'energy'},suggestedDownloads,nonSpeechFallback:true};
}
export type RemovalPlan={status:'ok';remove:readonly string[];freedBytes:number}|{status:'blocked';reason:'in-use'|'required-by-installed'|'unknown-pack';ids:readonly string[]};
/** Removing a pack never breaks another installed pack or the model the current session is using. */
export function planPackRemoval(catalog:readonly LanguagePack[],installedIds:readonly string[],remove:readonly string[],inUse:readonly string[]):RemovalPlan{
 const byId=new Map(catalog.map(p=>[p.id,p]));
 const unknown=remove.filter(id=>!byId.has(id)||!installedIds.includes(id));
 if(unknown.length)return {status:'blocked',reason:'unknown-pack',ids:unknown};
 const busy=remove.filter(id=>inUse.includes(id));
 if(busy.length)return {status:'blocked',reason:'in-use',ids:busy};
 const keep=installedIds.filter(id=>!remove.includes(id));
 const dependents=keep.filter(id=>byId.get(id)?.dependencies.some(d=>remove.includes(d)));
 if(dependents.length)return {status:'blocked',reason:'required-by-installed',ids:dependents};
 return {status:'ok',remove:[...remove],freedBytes:remove.reduce((n,id)=>n+(byId.get(id)?.bytes??0),0)};
}
export interface PackFile {path:string;packId:string;kind:'download'|'staging'|'installed'}
/** Temporary files that are safe to delete: downloads and staging areas of packs no install is still working on.
 * Only paths inside `root` are ever returned; installed files are never returned. */
export function temporaryFilesToDelete(files:readonly PackFile[],journal:Readonly<Record<string,PackInstallState|undefined>>,root:string):string[]{
 if(!root.endsWith('/')||root.length<2)throw new Error('Root must be an absolute directory ending in /');
 return files.filter(f=>f.kind!=='installed'&&f.path.startsWith(root)&&!f.path.includes('/../')&&!f.path.endsWith('/..'))
  .filter(f=>{const phase=journal[f.packId]?.phase;return phase!=='staging'&&phase!=='verified';}).map(f=>f.path);
}
/** Consistency check for a speech catalog, reusing the pack planner for identities and dependencies. */
export function validateSpeechCatalog(entries:readonly SpeechModelEntry[]):{valid:boolean;problems:readonly string[];licensesPending:readonly string[]}{
 const problems:string[]=[];
 // Structure is checked as if licenses were reviewed; pending licenses are reported apart and block use (assessModelFit).
 const plan=planLanguagePacks(entries.map(e=>({...e.pack,licenseReviewed:true})),entries.map(e=>e.pack.id));
 if(plan.status!=='ready')problems.push(`packs: ${plan.reason}`);
 for(const e of entries){
  const id=e.pack.id;
  if(!['asr','tts','vad'].includes(e.role)||!['sherpa-onnx','whisper.cpp','vosk','os-on-device'].includes(e.engine))problems.push(`${id}: role or engine`);
  if(e.role==='asr'&&e.pack.kind!=='asr'||e.role==='tts'&&e.pack.kind!=='tts')problems.push(`${id}: pack kind does not match role`);
  if(!e.platforms.length||e.platforms.some(p=>p!=='android'&&p!=='ios'))problems.push(`${id}: platforms`);
  if(!Number.isSafeInteger(e.installedBytes)||e.installedBytes<=0||!(e.peakRamMb>0))problems.push(`${id}: size or memory`);
  if(e.evidence.kind!=='none'&&!/^\d{4}-\d{2}-\d{2}$/.test(e.evidence.date??''))problems.push(`${id}: evidence date`);
 }
 return {valid:problems.length===0,problems,licensesPending:entries.filter(e=>!e.pack.licenseReviewed).map(e=>e.pack.id)};
}
