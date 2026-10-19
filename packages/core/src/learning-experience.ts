/** Offline, non-diagnostic learning experiences. No speech recognition, cloud calls or CEFR certification. */
import {lessonsFor, normalizedUtterance, type CourseExercise, type OfflineLesson} from './course.js';
import {guidedDialogues} from './guided-dialogues.js';
import {type TargetLanguage} from './types.js';
import {type AgeStage} from './learning-paths.js';

export type LearningSkill='listening'|'speaking'|'vocabulary'|'reading'|'interaction';
export type AssessmentAnswer='correct'|'retry'|'uncertain'|'skipped';
export interface PlacementItem {id:string;skill:LearningSkill;exercise:CourseExercise;lessonId:string}
export interface PlacementResult {target:TargetLanguage;observed:Record<LearningSkill,{correct:number;attempted:number}>;suggestedLessonId:string;status:'exploratory-not-certified'}
export function initialPlacement(target:TargetLanguage,limit=8):readonly PlacementItem[]{
 const lessons=lessonsFor(target);
 const sample:PlacementItem[]=[];
 for(const lesson of lessons){
  const exercise=lesson.exercises.find(e=>e.type==='recall');
  if(exercise)sample.push({id:exercise.id,skill:sample.length%2===0?'vocabulary':'speaking',exercise,lessonId:lesson.id});
  if(sample.length>=Math.max(1,Math.min(12,Math.floor(limit))))break;
 }
 return sample;
}
export function scorePlacement(target:TargetLanguage,answers:Readonly<Record<string,AssessmentAnswer>>,limit=8):PlacementResult{
 const items=initialPlacement(target,limit);
 const observed:PlacementResult['observed']={listening:{correct:0,attempted:0},speaking:{correct:0,attempted:0},vocabulary:{correct:0,attempted:0},reading:{correct:0,attempted:0},interaction:{correct:0,attempted:0}};
 let passed=0;
 for(const item of items){
  const answer=answers[item.id];
  if(answer==='correct'||answer==='retry'){
   observed[item.skill].attempted++;
   if(answer==='correct'){observed[item.skill].correct++;passed++;}
  }
 }
 const lessons=lessonsFor(target);
 const suggested=lessons[Math.min(Math.floor(passed/2),lessons.length-1)]!;
 return {target,observed,suggestedLessonId:suggested.id,status:'exploratory-not-certified'};
}
export interface LearningMission {id:string;target:TargetLanguage;lessonId:string;goal:string;prompt:string;acceptedReplies:readonly string[];kind:'guided-offline'}
export function offlineMissions(target:TargetLanguage):readonly LearningMission[]{
 return lessonsFor(target).map(lesson=>({
  id:'mission-'+lesson.id,target,lessonId:lesson.id,goal:lesson.goal[target],
  prompt:lesson.exercises[0]?.meaning[target]??lesson.goal[target],
  acceptedReplies:lesson.exercises.find(e=>e.type==='recall')?.alternatives??[],
  kind:'guided-offline' as const
 }));
}
export function missionReplyAccepted(mission:LearningMission,reply:string):boolean{
 return mission.acceptedReplies.some(a=>normalizedUtterance(a,mission.target)===normalizedUtterance(reply,mission.target));
}
export interface InclusiveLearningMode {presentation:'text-and-audio'|'text-only'|'audio-first';pace:'self-paced'|'guided';lowStimulation:boolean;corrections:'on-request'|'after-attempt';allowSkip:true}
export function inclusiveLearningMode(mode:Partial<InclusiveLearningMode>={}):InclusiveLearningMode{
 return {presentation:mode.presentation??'text-and-audio',pace:mode.pace??'self-paced',lowStimulation:mode.lowStimulation??true,corrections:mode.corrections??'on-request',allowSkip:true};
}
export function situationalQuickPractice(target:TargetLanguage,keyword:string):readonly LearningMission[]{
 const missions=offlineMissions(target);
 const q=keyword.trim().toLocaleLowerCase();
 return q?missions.filter(m=>(m.id+' '+m.goal+' '+m.prompt).toLocaleLowerCase().includes(q)):missions.slice(0,4);
}
/** Recombine authored alternatives without inventing or translating new utterances. */
export function contextualReview(target:TargetLanguage,completed:readonly string[],seed=0):readonly LearningMission[]{
 const eligible=offlineMissions(target).filter(m=>completed.includes(m.lessonId));
 return eligible.map((m,i)=>({...m,acceptedReplies:m.acceptedReplies.length>1?[m.acceptedReplies[(i+Math.abs(Math.floor(seed)))%m.acceptedReplies.length]!,...m.acceptedReplies.filter((_,j)=>j!==(i+Math.abs(Math.floor(seed)))%m.acceptedReplies.length)]:m.acceptedReplies}));
}
export interface BranchingScenario {id:string;target:TargetLanguage;turns:readonly {cue:string;acceptedReplies:readonly string[]}[];kind:'curated-branching-preview'}
export function branchingScenarios(target:TargetLanguage,stage:AgeStage):readonly BranchingScenario[]{
 if(stage!=='adult')return [];
 return guidedDialogues.filter(d=>d.target===target).map(d=>({id:d.id,target,turns:d.turns.map(t=>({cue:t.teacherCue,acceptedReplies:t.acceptedReplies})),kind:'curated-branching-preview' as const}));
}
