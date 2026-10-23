/** FSRS-6 memory model at calendar-day granularity, for scheduling REVIEW of learning objectives.
 * Formulas: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm . Reimplemented without
 * dependencies and checked against ts-fsrs 5.4.2 (MIT) as an external test oracle (docs/PEDAGOGY_ENGINE_2026_10_23.md).
 * Default weights were fitted on flashcard reviews, not on oral language practice: this schedules practice,
 * it is NEVER a grade, a CEFR level or a pronunciation score.
 */
import {addLocalDays,isLocalDay,localDaysBetween} from './local-day.js';

/** 1 again (not recalled), 2 hard (recalled with difficulty or help), 3 good, 4 easy (explicit learner report only). */
export type RecallGrade=1|2|3|4;
export interface MemoryState {stability:number;difficulty:number}
export interface RecallSchedule {
 version:1;
 memory:MemoryState;
 lastReviewedOn:string;
 dueOn:string;
 reviews:number;
 lapses:number;
}
export interface SchedulerSettings {
 /** Target probability of recall when an item becomes due. */
 desiredRetention:number;
 maximumIntervalDays:number;
 weights:readonly number[];
}
export const fsrs6DefaultWeights:readonly number[]=Object.freeze([0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542]);
export const defaultSchedulerSettings:SchedulerSettings=Object.freeze({desiredRetention:0.9,maximumIntervalDays:365,weights:fsrs6DefaultWeights});
const minStability=0.001,maxStability=36500;
const round8=(n:number)=>Math.round(n*1e8)/1e8;
const clamp=(n:number,min:number,max:number)=>Math.min(Math.max(n,min),max);

export function validateSchedulerSettings(settings:SchedulerSettings):SchedulerSettings{
 const {desiredRetention:r,maximumIntervalDays:max,weights:w}=settings;
 if(!Number.isFinite(r)||r<0.7||r>0.97)throw new Error('Desired retention must be between 0.7 and 0.97');
 if(!Number.isSafeInteger(max)||max<1||max>36500)throw new Error('Invalid maximum interval');
 if(!Array.isArray(w)||w.length!==21||w.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw new Error('FSRS-6 needs 21 finite weights');
 if(w[20]!<=0||w.slice(0,4).some(x=>x<=0))throw new Error('Invalid FSRS weights');
 return settings;
}
function decayFactor(w:readonly number[]){
 const decay=-w[20]!;
 return {decay,factor:round8(Math.exp(Math.log(0.9)/decay)-1)};
}
/** Probability of recall after `elapsedDays` for a memory with the given stability. */
export function recallProbability(stability:number,elapsedDays:number,weights:readonly number[]=fsrs6DefaultWeights):number{
 if(!(stability>0)||!Number.isFinite(elapsedDays)||elapsedDays<0)throw new Error('Invalid memory input');
 const {decay,factor}=decayFactor(weights);
 return round8(Math.pow(1+factor*elapsedDays/stability,decay));
}
const initialDifficulty=(w:readonly number[],g:RecallGrade)=>round8(w[4]!-Math.exp((g-1)*w[5]!)+1);
export function nextMemoryState(memory:MemoryState|null,elapsedDays:number,grade:RecallGrade,weights:readonly number[]=fsrs6DefaultWeights):MemoryState{
 if(![1,2,3,4].includes(grade))throw new Error('Invalid recall grade');
 if(!Number.isFinite(elapsedDays)||elapsedDays<0)throw new Error('Invalid elapsed days');
 const w=weights;
 if(!memory)return {difficulty:clamp(initialDifficulty(w,grade),1,10),stability:Math.max(w[grade-1]!,0.1)};
 const {stability:s,difficulty:d}=memory;
 if(!(d>=1&&d<=10)||!(s>=minStability))throw new Error('Invalid memory state');
 const r=recallProbability(s,elapsedDays,w);
 let next:number;
 if(elapsedDays===0){
  // Same-day review: short-term stability update.
  const sinc=Math.pow(s,-w[19]!)*Math.exp(w[17]!*(grade-3+w[18]!));
  next=round8(clamp(s*(grade>=2?Math.max(sinc,1):sinc),minStability,maxStability));
 }else if(grade===1){
  const afterLapse=round8(clamp(w[11]!*Math.pow(d,-w[12]!)*(Math.pow(s+1,w[13]!)-1)*Math.exp((1-r)*w[14]!),minStability,maxStability));
  next=clamp(round8(s/Math.exp(w[17]!*w[18]!)),minStability,afterLapse);
 }else{
  const hard=grade===2?w[15]!:1,easy=grade===4?w[16]!:1;
  next=round8(clamp(s*(1+Math.exp(w[8]!)*(11-d)*Math.pow(s,-w[9]!)*(Math.exp((1-r)*w[10]!)-1)*hard*easy),minStability,maxStability));
 }
 const damped=d+round8(-w[6]!*(grade-3)*(10-d)/9);
 const difficulty=clamp(round8(w[7]!*initialDifficulty(w,4)+(1-w[7]!)*damped),1,10);
 return {difficulty,stability:next};
}
/** Whole-day interval that reaches the desired retention, at least one day. */
export function scheduledIntervalDays(stability:number,settings:SchedulerSettings=defaultSchedulerSettings):number{
 const {weights,desiredRetention,maximumIntervalDays}=validateSchedulerSettings(settings);
 const {decay,factor}=decayFactor(weights);
 const modifier=round8((Math.pow(desiredRetention,1/decay)-1)/factor);
 return Math.min(Math.max(1,Math.round(stability*modifier)),maximumIntervalDays);
}
export function scheduleRecall(previous:RecallSchedule|null,grade:RecallGrade,today:string,settings:SchedulerSettings=defaultSchedulerSettings):RecallSchedule{
 if(!isLocalDay(today))throw new Error('Invalid local day');
 const elapsed=previous?localDaysBetween(previous.lastReviewedOn,today):0;
 if(elapsed<0)throw new Error('Review date precedes the previous review');
 validateSchedulerSettings(settings);
 const memory=nextMemoryState(previous?.memory??null,elapsed,grade,settings.weights);
 return {version:1,memory,lastReviewedOn:today,dueOn:addLocalDays(today,scheduledIntervalDays(memory.stability,settings)),
  reviews:(previous?.reviews??0)+1,lapses:(previous?.lapses??0)+(previous&&grade===1?1:0)};
}
/** Current recall probability, for ordering reviews and spotting decay. */
export function recallProbabilityOn(schedule:RecallSchedule,today:string,weights:readonly number[]=fsrs6DefaultWeights):number{
 return recallProbability(schedule.memory.stability,Math.max(0,localDaysBetween(schedule.lastReviewedOn,today)),weights);
}
export function recallScheduleFromUnknown(value:unknown):RecallSchedule|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>,m=v.memory as Record<string,unknown>|undefined;
 if(v.version!==1||!m||typeof m!=='object'||!isLocalDay(v.lastReviewedOn)||!isLocalDay(v.dueOn)||v.dueOn<=v.lastReviewedOn)return null;
 const s=m.stability,d=m.difficulty;
 if(typeof s!=='number'||typeof d!=='number'||!(s>=minStability&&s<=maxStability)||!(d>=1&&d<=10))return null;
 if(!Number.isSafeInteger(v.reviews)||!Number.isSafeInteger(v.lapses)||(v.reviews as number)<1||(v.lapses as number)<0||(v.lapses as number)>=(v.reviews as number))return null;
 return {version:1,memory:{stability:s,difficulty:d},lastReviewedOn:v.lastReviewedOn,dueOn:v.dueOn,reviews:v.reviews as number,lapses:v.lapses as number};
}
