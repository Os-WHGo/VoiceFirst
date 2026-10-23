/** Local learner model: evidence per learning objective and per skill, mastery states that differ from
 * "lesson completed", and FSRS review schedules. Stores ids, counters and dates only: no audio, no transcripts.
 * States are internal and indicative. They are NEVER a CEFR level, an exam score or a pronunciation grade.
 */
import {addLocalDays,isLocalDay,localDaysBetween} from './local-day.js';
import {defaultSchedulerSettings,recallProbabilityOn,recallScheduleFromUnknown,scheduleRecall,type RecallGrade,type RecallSchedule,type SchedulerSettings} from './spaced-repetition.js';
import {targetLanguages,type CefrBand,type TargetLanguage} from './types.js';

export const masterySkills=['listening-comprehension','reading-comprehension','spoken-production','spoken-interaction','pronunciation','written-production'] as const;
export type MasterySkill=(typeof masterySkills)[number];
export type LearningActivityKind='listen'|'repeat'|'recall'|'checkpoint'|'dialogue-turn'|'choice';
export type ResponseModality='speech'|'typed'|'choice'|'none';
/** How an activity ended, derived from evaluated attempts. */
export type ActivityAchievement=
 |'independent'       // first decisive attempt correct, no hint or model
 |'learner-confirmed' // the learner confirmed an uncertain recognition
 |'after-retry'       // correct after a form or meaning error, without help
 |'assisted'          // correct after a hint or a model answer
 |'not-achieved'      // errors and no correct answer before moving on
 |'no-evidence';      // skipped, uncertain or exposure only
export interface ActivityResult {
 activityId:string;
 objectiveId:string;
 kind:LearningActivityKind;
 modality:ResponseModality;
 achievement:ActivityAchievement;
 minorErrors:number;
 meaningErrors:number;
 /** Replays and slower repetitions are counted for orientation only and never lower a result. */
 replays:number;
 hints:number;
 modelShown:boolean;
 day:string;
 /** Explicit skill when the activity defines it (e.g. written recognition is reading, not listening). */
 skill?:MasterySkill;
}
export type MasteryState='not-started'|'introduced'|'practicing'|'consolidating'|'secure'|'needs-review';
export interface ObjectiveSkillRecord {
 objectiveId:string;
 skill:MasterySkill;
 results:number;
 independent:number;
 confirmed:number;
 assisted:number;
 notAchieved:number;
 minorErrors:number;
 meaningErrors:number;
 /** Distinct days with an independent or learner-confirmed success (latest 16). */
 successDays:readonly string[];
 /** Distinct days with an independent success that did not rely on learner confirmation (latest 16). */
 verifiedDays:readonly string[];
 maxRetrievalGapDays:number;
 lastAchievement:ActivityAchievement;
 lastPracticedOn:string;
 schedule:RecallSchedule|null;
}
export interface LearnerModel {
 version:1;
 target:TargetLanguage;
 revision:number;
 records:Readonly<Record<string,ObjectiveSkillRecord>>;
 exposures:Readonly<Record<string,number>>;
 /** Sessions already folded into this model, so a resumed or replayed session is never counted twice. */
 appliedSessions:readonly string[];
}
export const masteryThresholds=Object.freeze({consolidatingDays:2,secureGapDays:7,secureRecall:0.85,reviewRecall:0.7});
const idPattern=/^[\w.:-]{1,160}$/;
const keepDays=16,keepSessions=50;
const achievements:readonly ActivityAchievement[]=['independent','learner-confirmed','after-retry','assisted','not-achieved','no-evidence'];
const kinds:readonly LearningActivityKind[]=['listen','repeat','recall','checkpoint','dialogue-turn','choice'];
const modalities:readonly ResponseModality[]=['speech','typed','choice','none'];
export const recordKey=(objectiveId:string,skill:MasterySkill)=>`${objectiveId}::${skill}`;

/** The skill a result is evidence for, from what the learner actually did. Typing a spoken task is written evidence. */
export function evidenceSkill(kind:LearningActivityKind,modality:ResponseModality):MasterySkill|null{
 if(modality==='none')return null;
 if(kind==='choice'||(kind==='listen'&&modality==='choice'))return 'listening-comprehension';
 if(kind==='repeat')return modality==='speech'?'pronunciation':null;
 if(kind==='listen')return null;
 if(modality==='typed')return 'written-production';
 if(modality==='choice')return 'listening-comprehension';
 return kind==='dialogue-turn'?'spoken-interaction':'spoken-production';
}
export function gradeForAchievement(a:ActivityAchievement):RecallGrade|null{
 return a==='independent'||a==='learner-confirmed'?3:a==='after-retry'||a==='assisted'?2:a==='not-achieved'?1:null;
}
export function newLearnerModel(target:TargetLanguage):LearnerModel{
 if(!targetLanguages.includes(target))throw new Error('Unsupported target');
 return {version:1,target,revision:0,records:{},exposures:{},appliedSessions:[]};
}
const nonNegative=(n:unknown)=>Number.isSafeInteger(n)&&(n as number)>=0;
export function validateActivityResult(r:ActivityResult):ActivityResult{
 if(!r||!idPattern.test(r.activityId)||!idPattern.test(r.objectiveId)||!kinds.includes(r.kind)||!modalities.includes(r.modality)||!achievements.includes(r.achievement)||!isLocalDay(r.day))throw new Error('Invalid activity result');
 if(![r.minorErrors,r.meaningErrors,r.replays,r.hints].every(nonNegative)||typeof r.modelShown!=='boolean')throw new Error('Invalid activity counters');
 if(r.skill!==undefined&&!masterySkills.includes(r.skill))throw new Error('Invalid activity skill');
 return r;
}
const addDay=(days:readonly string[],day:string)=>[...new Set([...days,day])].sort().slice(-keepDays);
function updateRecord(previous:ObjectiveSkillRecord|undefined,objectiveId:string,skill:MasterySkill,result:ActivityResult,settings:SchedulerSettings):ObjectiveSkillRecord{
 // A session resumed after another one was applied can carry older days: fold them in at the latest known day.
 const r=previous&&localDaysBetween(previous.lastPracticedOn,result.day)<0?{...result,day:previous.lastPracticedOn}:result;
 const base:ObjectiveSkillRecord=previous??{objectiveId,skill,results:0,independent:0,confirmed:0,assisted:0,notAchieved:0,minorErrors:0,meaningErrors:0,successDays:[],verifiedDays:[],maxRetrievalGapDays:0,lastAchievement:'no-evidence',lastPracticedOn:r.day,schedule:null};
 const success=r.achievement==='independent'||r.achievement==='learner-confirmed';
 const lastSuccess=base.successDays[base.successDays.length-1];
 const gap=success&&lastSuccess?localDaysBetween(lastSuccess,r.day):0;
 const grade=skill==='pronunciation'?null:gradeForAchievement(r.achievement);
 return {...base,results:base.results+1,
  independent:base.independent+(r.achievement==='independent'?1:0),confirmed:base.confirmed+(r.achievement==='learner-confirmed'?1:0),
  assisted:base.assisted+(r.achievement==='assisted'||r.achievement==='after-retry'?1:0),notAchieved:base.notAchieved+(r.achievement==='not-achieved'?1:0),
  minorErrors:base.minorErrors+r.minorErrors,meaningErrors:base.meaningErrors+r.meaningErrors,
  successDays:success?addDay(base.successDays,r.day):base.successDays,
  verifiedDays:r.achievement==='independent'?addDay(base.verifiedDays,r.day):base.verifiedDays,
  maxRetrievalGapDays:Math.max(base.maxRetrievalGapDays,gap),lastAchievement:r.achievement,lastPracticedOn:r.day,
  schedule:grade?scheduleRecall(base.schedule,grade,r.day,settings):base.schedule};
}
/** Fold one activity result into the model. Results without evidence only count as exposure. */
export function recordActivityResult(model:LearnerModel,result:ActivityResult,settings:SchedulerSettings=defaultSchedulerSettings):LearnerModel{
 const r=validateActivityResult(result);
 const exposures={...model.exposures,[r.objectiveId]:(model.exposures[r.objectiveId]??0)+1};
 const skill=r.modality==='none'?null:r.skill??evidenceSkill(r.kind,r.modality);
 if(!skill||r.achievement==='no-evidence')return {...model,revision:model.revision+1,exposures};
 const key=recordKey(r.objectiveId,skill);
 return {...model,revision:model.revision+1,exposures,records:{...model.records,[key]:updateRecord(model.records[key],r.objectiveId,skill,r,settings)}};
}
/** Idempotent: a session id already applied is ignored. */
export function applySessionResults(model:LearnerModel,sessionId:string,results:readonly ActivityResult[],settings:SchedulerSettings=defaultSchedulerSettings):LearnerModel{
 if(!idPattern.test(sessionId))throw new Error('Invalid session id');
 if(model.appliedSessions.includes(sessionId))return model;
 const ordered=[...results].sort((a,b)=>a.day.localeCompare(b.day));
 const folded=ordered.reduce((m,r)=>recordActivityResult(m,r,settings),model);
 return {...folded,revision:model.revision+1,appliedSessions:[...model.appliedSessions,sessionId].slice(-keepSessions)};
}
export interface MasteryAssessment {
 state:MasteryState;
 recallProbability:number|null;
 dueOn:string|null;
 /** Why a state cannot rise further, when relevant. */
 capReason?:'acoustic-assessment-unavailable'|'needs-verified-success'|'needs-spaced-retrieval'|'needs-second-day';
}
export function assessRecord(record:ObjectiveSkillRecord|undefined,today:string):MasteryAssessment{
 if(!isLocalDay(today))throw new Error('Invalid local day');
 if(!record||record.results===0)return {state:'not-started',recallProbability:null,dueOn:null};
 const recall=record.schedule?recallProbabilityOn(record.schedule,today):null;
 const dueOn=record.schedule?.dueOn??null;
 if(record.skill==='pronunciation')return {state:'practicing',recallProbability:null,dueOn:null,capReason:'acoustic-assessment-unavailable'};
 const successes=record.independent+record.confirmed+record.assisted;
 if(successes===0)return {state:'introduced',recallProbability:recall,dueOn};
 const t=masteryThresholds;
 if(record.successDays.length<t.consolidatingDays)return {state:'practicing',recallProbability:recall,dueOn,capReason:'needs-second-day'};
 if(record.lastAchievement==='not-achieved'||(recall!==null&&recall<t.reviewRecall))return {state:'needs-review',recallProbability:recall,dueOn};
 if(record.maxRetrievalGapDays<t.secureGapDays)return {state:'consolidating',recallProbability:recall,dueOn,capReason:'needs-spaced-retrieval'};
 if(!record.verifiedDays.length)return {state:'consolidating',recallProbability:recall,dueOn,capReason:'needs-verified-success'};
 return {state:recall!==null&&recall>=t.secureRecall?'secure':'consolidating',recallProbability:recall,dueOn};
}
export function assessObjective(model:LearnerModel,objectiveId:string,today:string):Record<MasterySkill,MasteryAssessment>&{exposed:boolean}{
 const out=Object.fromEntries(masterySkills.map(s=>[s,assessRecord(model.records[recordKey(objectiveId,s)],today)])) as Record<MasterySkill,MasteryAssessment>;
 return Object.assign(out,{exposed:(model.exposures[objectiveId]??0)>0});
}
export interface DueReview {objectiveId:string;skill:MasterySkill;dueOn:string;recallProbability:number}
/** Due review items, most forgotten first. Pronunciation practice is never scheduled from text. */
export function dueObjectiveReviews(model:LearnerModel,today:string):DueReview[]{
 if(!isLocalDay(today))throw new Error('Invalid local day');
 return Object.values(model.records).filter(r=>r.schedule&&r.schedule.dueOn<=today&&r.skill!=='pronunciation')
  .map(r=>({objectiveId:r.objectiveId,skill:r.skill,dueOn:r.schedule!.dueOn,recallProbability:recallProbabilityOn(r.schedule!,today)}))
  .sort((a,b)=>a.recallProbability-b.recallProbability||a.dueOn.localeCompare(b.dueOn)||a.objectiveId.localeCompare(b.objectiveId));
}
export interface LevelEvidence {
 band:CefrBand;
 objectives:number;
 /** Objectives whose spoken production or interaction is currently `secure`. */
 secureObjectives:number;
 practicedObjectives:number;
 /** Always null: internal practice evidence is not a validated CEFR assessment. */
 cefrClaim:null;
 note:'internal-indicative-evidence-only';
}
export function levelEvidence(model:LearnerModel,objectivesByBand:Readonly<Partial<Record<CefrBand,readonly string[]>>>,today:string):LevelEvidence[]{
 return (Object.entries(objectivesByBand) as [CefrBand,readonly string[]][]).map(([band,ids])=>{
  let secure=0,practiced=0;
  for(const id of new Set(ids)){
   const a=assessObjective(model,id,today);
   if(a['spoken-production'].state==='secure'||a['spoken-interaction'].state==='secure')secure++;
   if(masterySkills.some(s=>a[s].state!=='not-started'))practiced++;
  }
  return {band,objectives:new Set(ids).size,secureObjectives:secure,practicedObjectives:practiced,cefrClaim:null,note:'internal-indicative-evidence-only'};
 });
}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const dayList=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=keepDays&&v.every(isLocalDay)&&v.every((d,i)=>i===0||d>v[i-1]!);
/** Strict restore: anything malformed is rejected instead of being silently repaired. */
export function learnerModelFromJSON(raw:string,target:TargetLanguage):LearnerModel|null{
 if(typeof raw!=='string'||raw.length>500000||!targetLanguages.includes(target))return null;
 let v:unknown;try{v=JSON.parse(raw);}catch{return null;}
 if(!record(v)||v.version!==1||v.target!==target||!nonNegative(v.revision)||!record(v.records)||!record(v.exposures)||!Array.isArray(v.appliedSessions))return null;
 if(v.appliedSessions.length>keepSessions||!v.appliedSessions.every(s=>typeof s==='string'&&idPattern.test(s)))return null;
 const exposures:Record<string,number>={};
 for(const [id,n] of Object.entries(v.exposures)){if(!idPattern.test(id)||!nonNegative(n))return null;exposures[id]=n as number;}
 const records:Record<string,ObjectiveSkillRecord>={};
 const entries=Object.entries(v.records);
 if(entries.length>20000)return null;
 for(const [key,x] of entries){
  if(!record(x)||typeof x.objectiveId!=='string'||!idPattern.test(x.objectiveId)||!masterySkills.includes(x.skill as MasterySkill)||key!==recordKey(x.objectiveId,x.skill as MasterySkill))return null;
  const counters=['results','independent','confirmed','assisted','notAchieved','minorErrors','meaningErrors','maxRetrievalGapDays'] as const;
  if(!counters.every(c=>nonNegative(x[c]))||!dayList(x.successDays)||!dayList(x.verifiedDays)||!achievements.includes(x.lastAchievement as ActivityAchievement)||!isLocalDay(x.lastPracticedOn))return null;
  const n=(c:typeof counters[number])=>x[c] as number;
  if(n('independent')+n('confirmed')+n('assisted')+n('notAchieved')>n('results')||x.verifiedDays.length>x.successDays.length)return null;
  const schedule=x.schedule===null?null:recallScheduleFromUnknown(x.schedule);
  if(x.schedule!==null&&!schedule)return null;
  records[key]={objectiveId:x.objectiveId,skill:x.skill as MasterySkill,results:n('results'),independent:n('independent'),confirmed:n('confirmed'),assisted:n('assisted'),notAchieved:n('notAchieved'),
   minorErrors:n('minorErrors'),meaningErrors:n('meaningErrors'),successDays:[...x.successDays],verifiedDays:[...x.verifiedDays],maxRetrievalGapDays:n('maxRetrievalGapDays'),
   lastAchievement:x.lastAchievement as ActivityAchievement,lastPracticedOn:x.lastPracticedOn,schedule};
 }
 return {version:1,target,revision:v.revision as number,records,exposures,appliedSessions:[...v.appliedSessions as string[]]};
}
export function learnerModelToJSON(model:LearnerModel):string{
 if(model.version!==1||!targetLanguages.includes(model.target))throw new Error('Invalid learner model');
 return JSON.stringify(model);
}
/** Earliest day a learner could reach `secure` for a record, given the spacing rule; for orientation only. */
export function earliestSecureDay(record:ObjectiveSkillRecord):string|null{
 const first=record.successDays[0];
 return first?addLocalDays(first,masteryThresholds.secureGapDays):null;
}
