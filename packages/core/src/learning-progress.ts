/** Pure, versioned, local-only progress for authored dialogue lessons.
 * Do not store audio, transcripts, names, diagnoses or full dates of birth.
 * A completed dialogue is practice evidence, NEVER a CEFR proficiency score.
 */
import {newDialogueRun, type GuidedDialogue, type DialogueRun, type DialogueAttempt} from './guided-dialogues.js';
import {recordDialogueResponse} from './guided-dialogues.js';
import {targetLanguages, type TargetLanguage} from './types.js';

export const progressSchemaVersion = 1 as const;
export interface DialogueMemory {
  run: DialogueRun;
  completions: number;
  lastCompletedOn?: string;
  reviewDueOn?: string;
}
export interface LocalLearningProgress {
  schemaVersion: typeof progressSchemaVersion;
  target: TargetLanguage;
  revision: number;
  lastDialogueId?: string;
  dialogues: Readonly<Record<string, DialogueMemory>>;
}
export type ProgressLoad = {kind:'ok'; progress:LocalLearningProgress} | {kind:'corrupt'|'unsupported-version'; reason:string};
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const intervals=[1,3,7,14,30,60] as const;
const validId=(s:string)=>s.length>0 && s.length<130 && /^[\w-]+$/.test(s);
const own=(obj:object,k:string)=>Object.prototype.hasOwnProperty.call(obj,k);
function validDay(day:string): boolean {
  if(!datePattern.test(day)) return false;
  const t=Date.parse(`${day}T12:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0,10)===day;
}
function laterDay(day:string,days:number):string {
  if(!validDay(day))throw new Error('Invalid local day');
  return new Date(Date.parse(`${day}T12:00:00Z`)+days*86400000).toISOString().slice(0,10);
}
export function newLearningProgress(target:TargetLanguage):LocalLearningProgress {
  if(!targetLanguages.includes(target))throw new Error('Unsupported target');
  return {schemaVersion:1,target,revision:0,dialogues:{}};
}
export function getSavedDialogueRun(progress:LocalLearningProgress,dialogue:GuidedDialogue):DialogueRun {
  if(progress.target!==dialogue.target)throw new Error('Language mismatch');
  return progress.dialogues[dialogue.id]?.run ?? newDialogueRun(dialogue);
}
/** Only a complete set of authored replies unlocks a review. Uncertain ASR is not a failure. */
export function saveDialogueAttempt(progress:LocalLearningProgress,dialogue:GuidedDialogue,attempt:DialogueAttempt,today:string):LocalLearningProgress {
  if(!validDay(today))throw new Error('Invalid local day');
  const previous=progress.dialogues[dialogue.id];
  const run=getSavedDialogueRun(progress,dialogue);
  const next=recordDialogueResponse(run,dialogue,attempt);
  if(next===run)return progress;
  const alreadyCompleted=run.completed;
  const completedNow=next.completed && !alreadyCompleted;
  const completions=(previous?.completions??0)+(completedNow?1:0);
  const entry:DialogueMemory={run:next,completions};
  if(completedNow){
    entry.lastCompletedOn=today;
    entry.reviewDueOn=laterDay(today,intervals[Math.min(completions-1,intervals.length-1)]!);
  }else{
    if(previous?.lastCompletedOn)entry.lastCompletedOn=previous.lastCompletedOn;
    if(previous?.reviewDueOn)entry.reviewDueOn=previous.reviewDueOn;
  }
  return {...progress, revision:progress.revision+1,lastDialogueId:dialogue.id,
    dialogues:{...progress.dialogues,[dialogue.id]:entry}};
}
/** Rehearse a completed dialogue without erasing historical completions. */
export function startDialogueReview(progress:LocalLearningProgress,dialogue:GuidedDialogue):LocalLearningProgress {
  const old=progress.dialogues[dialogue.id];
  if(progress.target!==dialogue.target)throw new Error('Language mismatch');
  if(!old || !old.run.completed)return progress;
  return {...progress,revision:progress.revision+1,lastDialogueId:dialogue.id,dialogues:{...progress.dialogues,
    [dialogue.id]:{...old,run:newDialogueRun(dialogue)}}};
}
/** Review priority is explicit. User interest controls the *remaining* learning order. */
export function chooseDialogue(progress:LocalLearningProgress, ordered:readonly GuidedDialogue[],today:string):GuidedDialogue|null {
  if(!validDay(today))throw new Error('Invalid local day');
  if(ordered.some(d=>d.target!==progress.target))throw new Error('Language mismatch');
  const due=ordered.find(d=>{const saved=progress.dialogues[d.id];return !!saved?.run.completed && !!saved.reviewDueOn && saved.reviewDueOn<=today;});
  if(due)return due;
  const ongoing=ordered.find(d=>!progress.dialogues[d.id]?.run.completed);
  return ongoing??ordered[0]??null;
}
function object(value:unknown):value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value);
}
/** Reject corrupted or future-schema snapshots rather than silently discarding their data. */
export function deserializeLearningProgress(raw:string,expectedTarget:TargetLanguage,validDialogues:readonly GuidedDialogue[]):ProgressLoad {
  if(raw.length>200000)return {kind:'corrupt',reason:'Snapshot too large'};
  let value:unknown;try {value=JSON.parse(raw);}catch{return {kind:'corrupt',reason:'Invalid JSON'};}
  if(!object(value))return {kind:'corrupt',reason:'Invalid snapshot'};
  if(value.schemaVersion!==1)return {kind:'unsupported-version',reason:'Schema is not supported'};
  if(value.target!==expectedTarget || !Number.isSafeInteger(value.revision) || (value.revision as number)<0 || !object(value.dialogues))
    return {kind:'corrupt',reason:'Unexpected progress header'};
  const catalog=new Map(validDialogues.filter(x=>x.target===expectedTarget).map(x=>[x.id,x]));
  const entries=Object.entries(value.dialogues);
  if(entries.length>5000)return {kind:'corrupt',reason:'Too many progress records'};
  const dialogues:Record<string,DialogueMemory>=Object.create(null) as Record<string,DialogueMemory>;
  for(const [id,v] of entries){
    if(!validId(id)||!catalog.has(id)||!object(v)||!object(v.run))return {kind:'corrupt',reason:'Unknown or malformed dialogue'};
    const d=catalog.get(id)!;const r=v.run;
    if(r.dialogueId!==id || !Number.isInteger(r.turnIndex) || (r.turnIndex as number)<0 || (r.turnIndex as number)>d.turns.length || typeof r.completed!=='boolean'||!Array.isArray(r.acceptedTurnIds)||!object(r.attempts)||!Number.isSafeInteger(v.completions)||(v.completions as number)<0)
      return {kind:'corrupt',reason:'Invalid dialogue state'};
    const count=r.turnIndex as number;
    if(r.acceptedTurnIds.length!==count || r.completed!==(count===d.turns.length) || r.acceptedTurnIds.some((x,i)=>x!==d.turns[i]?.id))
      return {kind:'corrupt',reason:'Inconsistent checkpoint'};
    const attempts:Record<string,number>=Object.create(null) as Record<string,number>;
    for(const [tid,n] of Object.entries(r.attempts)){
      if(!d.turns.some(x=>x.id===tid)||!Number.isSafeInteger(n)||(n as number)<0||(n as number)>100000) return {kind:'corrupt',reason:'Invalid attempts'};
      attempts[tid]=n as number;
    }
    if((v.completions as number)>0 && (!validDay(v.lastCompletedOn as string)||!validDay(v.reviewDueOn as string)))return {kind:'corrupt',reason:'Invalid review schedule'};
    if(v.lastCompletedOn!==undefined && (typeof v.lastCompletedOn!=='string'||!validDay(v.lastCompletedOn)))return {kind:'corrupt',reason:'Invalid completed date'};
    if(v.reviewDueOn!==undefined && (typeof v.reviewDueOn!=='string'||!validDay(v.reviewDueOn)))return {kind:'corrupt',reason:'Invalid review date'};
    dialogues[id]={run:{dialogueId:id,turnIndex:count,acceptedTurnIds:[...r.acceptedTurnIds],attempts,completed:r.completed},completions:v.completions as number,
      ...(typeof v.lastCompletedOn==='string'?{lastCompletedOn:v.lastCompletedOn}:{}),...(typeof v.reviewDueOn==='string'?{reviewDueOn:v.reviewDueOn}:{})};
  }
  if(value.lastDialogueId!==undefined && (typeof value.lastDialogueId!=='string'||!catalog.has(value.lastDialogueId)))return {kind:'corrupt',reason:'Invalid last lesson'};
  return {kind:'ok',progress:{schemaVersion:1,target:expectedTarget,revision:value.revision as number,
    ...(typeof value.lastDialogueId==='string'?{lastDialogueId:value.lastDialogueId}:{}),dialogues}};
}
export function serializeLearningProgress(p:LocalLearningProgress):string {
  if(p.schemaVersion!==1 || !targetLanguages.includes(p.target))throw new Error('Invalid progress version');
  return JSON.stringify(p);
}
/** Async serialized writes protect against an old response overwriting a newer revision. */
export function makeProgressWriter(write:(value:string)=>Promise<void>) {
  let previous=Promise.resolve();let latest=0;
  return (snapshot:LocalLearningProgress):Promise<void>=>{
    if(snapshot.revision<latest)return previous;
    latest=snapshot.revision;
    const raw=serializeLearningProgress(snapshot);
    const next=previous.catch(()=>undefined).then(()=>write(raw));
    previous=next;
    return next;
  };
}
