/** Pure, resumable offline learning session over authored activities.
 * Plans reviews and new content from the learner model, adapts after errors, applies the learner's
 * correction timing, one-step instructions and response-time preferences, and summarizes only what was done.
 * No microphone, network, LLM, audio or transcript storage: the voice layer sends events and speaks outputs.
 */
import {answerFeedbackText,answerTokens,quoteIn,answerKeyForDialogueTurn,answerKeyForExercise,evaluateAnswer,type AnswerEvaluation,type AnswerKey,type AnswerOutcome,type FindingCode,type ResponseSource} from './answer-evaluation.js';
import {answerSlot,matchesAnswerPattern} from './answer-patterns.js';
import {finishLesson,lessonsFor,normalizedUtterance,recordCourseAttempt,type CourseProgress,type LocalizedText} from './course.js';
import type {ExperiencePreferences} from './experience.js';
import {dialoguesFor} from './guided-dialogues.js';
import {isLocalDay} from './local-day.js';
import {languageNameIn,sessionText} from './session-copy.js';
import {courseComprehensionActivities,seededOptionOrder,type ChoiceOption} from './choice-activities.js';
import {applySessionResults,assessObjective,dueObjectiveReviews,validateActivityResult,type ActivityAchievement,type ActivityResult,type LearnerModel,type LearningActivityKind,type MasterySkill,type ResponseModality} from './skill-mastery.js';
import {provisionalPedagogyPolicy,type PedagogyPolicy} from './pedagogy-policy.js';
import {defaultSchedulerSettings,type SchedulerSettings} from './spaced-repetition.js';
import {targetLanguages,type CefrBand,type LearnerPreferences,type TargetLanguage} from './types.js';

export interface SessionActivity {
 id:string;
 objectiveId:string;
 lessonId:string;
 prerequisite?:string;
 band:CefrBand;
 kind:LearningActivityKind;
 goal:LocalizedText;
 meaning:LocalizedText;
 /** Target-language speech heard before answering (a dialogue partner's line). */
 cue?:string;
 /** Authored model answer; never the learner's words. */
 model:string;
 key:AnswerKey|null;
 /** Choice activities: options shown in the target language or, for meanings, in the known language. */
 options?:readonly ChoiceOption[];
 correctOptionId?:string;
 optionLanguage?:'target'|'known';
 /** Options that are also valid in some register or region: reviewed, never counted as errors. */
 acceptableOptions?:readonly {optionId:string;note:LocalizedText}[];
 /** Authored situation and instruction in each known language, when the activity provides its own. */
 context?:LocalizedText;
 instruction?:LocalizedText;
 /** Skill the evidence belongs to when it is not implied by kind and modality. */
 skill?:MasterySkill;
}
/** Course activities per lesson: listen, a listening-comprehension choice (optional), repeat, recall, checkpoint. */
export function courseActivities(target:TargetLanguage,options:{comprehension?:boolean}={}):SessionActivity[]{
 const comprehension=options.comprehension===false?new Map<string,SessionActivity>():new Map(courseComprehensionActivities(target).map(a=>[a.lessonId,a]));
 return lessonsFor(target).flatMap(lesson=>lesson.exercises.flatMap(e=>{
  const activity:SessionActivity={id:e.id,objectiveId:lesson.id,lessonId:lesson.id,...(lesson.prerequisite?{prerequisite:lesson.prerequisite}:{}),
   band:lesson.band,kind:e.type,goal:lesson.goal,meaning:e.meaning,model:e.utterance,key:e.type==='listen'?null:answerKeyForExercise(e,target)};
  const check=e.type==='listen'?comprehension.get(lesson.id):undefined;
  return check?[activity,check]:[activity];
 }));
}
export function dialogueActivities(target:TargetLanguage):SessionActivity[]{
 return dialoguesFor(target).flatMap(d=>d.turns.map(t=>({id:t.id,objectiveId:d.id,lessonId:d.id,band:d.level,kind:'dialogue-turn' as const,goal:d.label,meaning:t.support,cue:t.teacherCue,model:t.acceptedReplies[0]!,key:answerKeyForDialogueTurn(t,target)})));
}

export type SessionCorrectionTiming='immediate'|'after-activity'|'end-of-session'|'on-request';
export type ResponseWindow={mode:'untimed'}|{mode:'timed';seconds:number};
export interface SessionPreferences {
 correctionTiming:SessionCorrectionTiming;
 instructionFormat:'one-step'|'full-context';
 responseWindow:ResponseWindow;
 lowStimulation:boolean;
 /** Fixed order with announced transitions; otherwise reviews are interleaved with new content. */
 predictableStructure:boolean;
 maxActivities:number;
 maxNewLessons:number;
 /** After an unsuccessful activity, step back once to the model before trying again. */
 remediation:boolean;
}
export const defaultSessionPreferences:SessionPreferences=Object.freeze({correctionTiming:'after-activity',instructionFormat:'one-step',responseWindow:{mode:'untimed'} as ResponseWindow,
 lowStimulation:true,predictableStructure:true,maxActivities:10,maxNewLessons:1,remediation:true});
export function validateSessionPreferences(p:SessionPreferences):SessionPreferences{
 const timings:readonly SessionCorrectionTiming[]=['immediate','after-activity','end-of-session','on-request'];
 if(!p||!timings.includes(p.correctionTiming)||!['one-step','full-context'].includes(p.instructionFormat))throw new Error('Invalid session preferences');
 const w=p.responseWindow;
 if(!w||(w.mode!=='untimed'&&!(w.mode==='timed'&&Number.isSafeInteger(w.seconds)&&w.seconds>=3&&w.seconds<=120)))throw new Error('Invalid response window');
 if(![p.lowStimulation,p.predictableStructure,p.remediation].every(x=>typeof x==='boolean'))throw new Error('Invalid session preferences');
 if(!Number.isSafeInteger(p.maxActivities)||p.maxActivities<1||p.maxActivities>40||!Number.isSafeInteger(p.maxNewLessons)||p.maxNewLessons<0||p.maxNewLessons>5)throw new Error('Invalid session size');
 return {...p,responseWindow:w.mode==='untimed'?{mode:'untimed'}:{mode:'timed',seconds:w.seconds}};
}
/** Derives session behaviour from the preferences the app already stores. No diagnosis is involved. */
export function sessionPreferencesFrom(experience:ExperiencePreferences,learner?:Partial<LearnerPreferences>):SessionPreferences{
 const timing:SessionCorrectionTiming=learner?.correctionMode==='end-of-session'?'end-of-session':
  experience.correctionTiming==='after-each-answer'?'immediate':experience.correctionTiming==='on-request'?'on-request':'after-activity';
 const seconds=Math.round(Math.max(3,Math.min(120,learner?.answerWaitSeconds??8)));
 const minutes=learner?.microLessonMinutes;
 return validateSessionPreferences({...defaultSessionPreferences,correctionTiming:timing,instructionFormat:experience.instructionFormat,
  responseWindow:experience.answerControl==='auto-after-silence'?{mode:'timed',seconds}:{mode:'untimed'},
  lowStimulation:experience.sensoryPresentation==='calm'||learner?.lowStimulation===true,
  predictableStructure:learner?.interactionStyle!=='flexible',
  maxActivities:minutes===5?6:minutes===15?14:minutes===30?24:10});
}

export type QueueReason='review'|'new'|'consolidation'|'remediation';
export interface QueueItem {activityId:string;reason:QueueReason}
export interface CorrectionNote {activityId:string;outcome:AnswerOutcome;findings:readonly {code:FindingCode;expected?:string}[];closestAnswer?:string;correctOptionId?:string}
export interface CurrentActivity {
 activityId:string;
 attempts:number;
 minorErrors:number;
 meaningErrors:number;
 replays:number;
 hints:number;
 modelShown:boolean;
 instructionStep:number;
 extraSeconds:number;
 /** Uncertain recognition awaiting the learner's confirmation; holds an authored answer only. */
 pendingConfirmation:string|null;
 lastModality:ResponseModality;
}
export interface LearningSessionState {
 version:1;
 sessionId:string;
 target:TargetLanguage;
 known:TargetLanguage;
 startedOn:string;
 lastActiveOn:string;
 status:'active'|'paused'|'finished';
 preferences:SessionPreferences;
 queue:readonly QueueItem[];
 position:number;
 current:CurrentActivity|null;
 results:readonly ActivityResult[];
 pendingCorrections:readonly CorrectionNote[];
 remediated:readonly string[];
 uncertainEvents:number;
 pauses:number;
 revision:number;
}
export type LearningSessionOutput=
 |{kind:'prompt';activityId:string;activityKind:LearningActivityKind;instruction:string;step:{index:number;total:number};speech?:{text:string;language:TargetLanguage};responseWindow:ResponseWindow;acceptsAnswer:boolean;options?:readonly {id:string;text:string;language:TargetLanguage}[]}
 |{kind:'feedback';text:string;outcome:AnswerOutcome}
 |{kind:'confirm-request';text:string;closestAnswer:string}
 |{kind:'model';text:string;speech:{text:string;language:TargetLanguage}}
 |{kind:'hint';text:string}
 |{kind:'replay';speech?:{text:string;language:TargetLanguage};rate:'normal'|'slower';instruction:string}
 |{kind:'message';text:string;code:'goal'|'transition'|'step-back'|'later'|'skipped'|'more-time'|'no-rush'|'not-heard'|'paused'|'still-paused'|'no-corrections'|'all-done'|'orientation'}
 |{kind:'corrections';items:readonly string[]}
 |{kind:'summary';summary:SessionSummary};
export interface LearningSessionStep {state:LearningSessionState;outputs:LearningSessionOutput[]}
export type LearningSessionEvent=
 |{type:'answer';response:string;source:ResponseSource}
 |{type:'choose';optionId:string}
 |{type:'continue'}|{type:'replay'}|{type:'slower'}|{type:'hint'}|{type:'show-model'}
 |{type:'confirm'}|{type:'reject'}|{type:'skip'}|{type:'timeout'}|{type:'more-time'}
 |{type:'pause'}|{type:'resume';day:string}|{type:'request-corrections'}|{type:'where-am-i'}|{type:'finish'};

const idPattern=/^[\w.:-]{1,160}$/;
const display=(text:string)=>text.split(answerSlot).join('…');
type Catalog=ReadonlyMap<string,SessionActivity>;
const catalogOf=(activities:readonly SessionActivity[]):Catalog=>new Map(activities.map(a=>[a.id,a]));
function activityOf(catalog:Catalog,id:string):SessionActivity{const a=catalog.get(id);if(!a)throw new Error('Unknown activity '+id);return a;}

export interface SessionPlanInput {
 sessionId:string;
 target:TargetLanguage;
 known:TargetLanguage;
 today:string;
 activities:readonly SessionActivity[];
 model:LearnerModel;
 /** Lessons already completed in the course progress; unlocks follow their prerequisites. */
 completedLessons:readonly string[];
 preferences:SessionPreferences;
 /** Provisional unless ChatGPT approved another one; see pedagogy-policy.ts. */
 policy?:PedagogyPolicy;
}
/** Due reviews first (most forgotten first), then the next unlocked lesson, then consolidation of recent practice. */
export function planLearningSession(input:SessionPlanInput):LearningSessionState{
 const {sessionId,target,known,today,activities,model}=input;
 if(!idPattern.test(sessionId)||!isLocalDay(today))throw new Error('Invalid session id or day');
 if(!targetLanguages.includes(target)||!targetLanguages.includes(known)||target===known||model.target!==target)throw new Error('Invalid language pair');
 const prefs=validateSessionPreferences(input.preferences);
 const policy=input.policy??provisionalPedagogyPolicy;
 const pool=activities.filter(a=>a.key||a.kind==='listen'||(a.options&&a.correctOptionId));
 const reviews:QueueItem[]=[],fresh:QueueItem[]=[],extra:QueueItem[]=[];
 const used=new Set<string>();
 const reviewCap=Math.max(1,Math.floor(prefs.maxActivities*policy.activity.reviewShare));
 for(const due of dueObjectiveReviews(model,today)){
  if(reviews.length>=reviewCap||used.has(due.objectiveId))continue;
  const own=pool.filter(a=>a.objectiveId===due.objectiveId&&a.kind!=='listen');
  const pick=due.skill==='spoken-interaction'?own.find(a=>a.kind==='dialogue-turn'):due.skill==='listening-comprehension'||due.skill==='reading-comprehension'?own.find(a=>a.kind==='choice'):
   own.find(a=>a.kind==='checkpoint')??own.find(a=>a.kind==='recall')??own[0];
  if(pick){reviews.push({activityId:pick.id,reason:'review'});used.add(due.objectiveId);}
 }
 const lessons=[...new Set(pool.map(a=>a.lessonId))];
 let added=0;
 for(const lessonId of lessons){
  if(added>=prefs.maxNewLessons)break;
  const items=pool.filter(a=>a.lessonId===lessonId);
  const first=items[0]!;
  if(input.completedLessons.includes(lessonId)||used.has(first.objectiveId)||(first.prerequisite&&!input.completedLessons.includes(first.prerequisite)))continue;
  if(reviews.length+fresh.length+items.length>prefs.maxActivities&&reviews.length+fresh.length>0)break;
  fresh.push(...items.map(a=>({activityId:a.id,reason:'new' as const})));used.add(first.objectiveId);added++;
 }
 for(const objectiveId of new Set(pool.map(a=>a.objectiveId))){
  if(reviews.length+fresh.length+extra.length>=prefs.maxActivities)break;
  if(used.has(objectiveId))continue;
  const a=assessObjective(model,objectiveId,today,policy);
  const practicing=a['spoken-production'].state==='practicing'||a['spoken-interaction'].state==='practicing';
  const pick=pool.find(x=>x.objectiveId===objectiveId&&(x.kind==='recall'||x.kind==='dialogue-turn'));
  if(practicing&&pick){extra.push({activityId:pick.id,reason:'consolidation'});used.add(objectiveId);}
 }
 let queue:QueueItem[];
 if(prefs.predictableStructure||!fresh.length)queue=[...reviews,...fresh,...extra];
 else{
  // Interleave: reviews after the first practice of the new phrase, so retrieval is spaced within the session.
  const split=Math.min(2,fresh.length);
  queue=[...fresh.slice(0,split),...reviews,...fresh.slice(split),...extra];
 }
 return {version:1,sessionId,target,known,startedOn:today,lastActiveOn:today,status:queue.length?'active':'finished',preferences:prefs,queue,position:0,
  current:queue[0]?freshCurrent(queue[0].activityId):null,results:[],pendingCorrections:[],remediated:[],uncertainEvents:0,pauses:0,revision:0};
}
function freshCurrent(activityId:string):CurrentActivity{
 return {activityId,attempts:0,minorErrors:0,meaningErrors:0,replays:0,hints:0,modelShown:false,instructionStep:0,extraSeconds:0,pendingConfirmation:null,lastModality:'none'};
}
function windowFor(state:LearningSessionState):ResponseWindow{
 const w=state.preferences.responseWindow;
 return w.mode==='untimed'?w:{mode:'timed',seconds:Math.min(120,w.seconds+(state.current?.extraSeconds??0))};
}
function instructionSteps(state:LearningSessionState,a:SessionActivity):string[]{
 const k=state.known,w=windowFor(state);
 const timing=w.mode==='untimed'?sessionText('untimed',k):sessionText('timed',k,{seconds:w.seconds});
 switch(a.kind){
  case 'listen':return [sessionText('listen',k),sessionText('continueWhenReady',k)];
  case 'repeat':return [sessionText('listenModel',k),sessionText('repeatNow',k),timing];
  case 'checkpoint':return [sessionText('situation',k,{goal:a.goal[k]}),sessionText('withoutModel',k),timing];
  case 'dialogue-turn':return [sessionText('listenPerson',k),sessionText('answerSituation',k),timing];
  case 'choice':return a.instruction?[sessionText('situation',k,{goal:(a.context??a.goal)[k]}),a.instruction[k],timing]:[sessionText('listen',k),sessionText('chooseMeaning',k),timing];
  default:return [sessionText('meaning',k,{meaning:a.meaning[k]}),sessionText('sayIt',k,{language:languageNameIn[k][state.target]}),timing];
 }
}
function speechFor(state:LearningSessionState,a:SessionActivity){
 if(a.kind==='listen'||a.kind==='repeat')return {text:display(a.model),language:state.target};
 if((a.kind==='dialogue-turn'||a.kind==='choice')&&a.cue)return {text:a.cue,language:state.target};
 return undefined;
}
function promptOutput(state:LearningSessionState,catalog:Catalog):LearningSessionOutput[]{
 if(!state.current)return [];
 const a=activityOf(catalog,state.current.activityId),steps=instructionSteps(state,a);
 const oneStep=state.preferences.instructionFormat==='one-step';
 const index=oneStep?Math.min(state.current.instructionStep,steps.length-1):0;
 const speech=speechFor(state,a);
 return [{kind:'prompt',activityId:a.id,activityKind:a.kind,instruction:oneStep?steps[index]!:steps.join(' '),step:{index,total:oneStep?steps.length:1},
  ...(speech?{speech}:{}),responseWindow:windowFor(state),acceptsAnswer:a.kind!=='listen',...(a.options?{options:orderedOptions(state,a)}:{})}];
}
function optionText(state:LearningSessionState,o:ChoiceOption):{text:string;language:TargetLanguage}{
 return typeof o.text==='string'?{text:o.text,language:state.target}:{text:o.text[state.known],language:state.known};
}
/** Per-session order: the right answer's position cannot be learned and survives pause and resume. */
function orderedOptions(state:LearningSessionState,a:SessionActivity){
 return seededOptionOrder(a.options??[],`${state.sessionId}:${a.id}`).map(o=>({id:o.id,...optionText(state,o)}));
}
/** Opening outputs: the session goal, then the first prompt. */
export function sessionOpening(state:LearningSessionState,activities:readonly SessionActivity[]):LearningSessionOutput[]{
 const catalog=catalogOf(activities),k=state.known;
 if(!state.queue.length)return [{kind:'message',code:'all-done',text:sessionText('sumNothing',k)}];
 const goals=[...new Set(state.queue.map(q=>activityOf(catalog,q.activityId).goal[k]))].join('; ');
 return [{kind:'message',code:'goal',text:sessionText('goal',k,{goals,total:state.queue.length})},...promptOutput(state,catalog)];
}
function correctionText(state:LearningSessionState,note:CorrectionNote,catalog:Catalog):string{
 const evaluation:AnswerEvaluation={outcome:note.outcome,findings:note.findings,...(note.closestAnswer?{closestAnswer:note.closestAnswer}:{}),countsAsSuccess:false,countsAsError:true,source:'typed',pronunciation:'not-assessed'};
 const detail=answerFeedbackText(evaluation,state.known,{maxDetails:state.preferences.lowStimulation?1:2,omitHead:true});
 const correct=note.correctOptionId?catalog.get(note.activityId)?.options?.find(x=>x.id===note.correctOptionId):undefined;
 const option=correct?optionText(state,correct).text:undefined;
 const answer=option?quoteIn(state.known,option):note.closestAnswer?quoteIn(state.known,note.closestAnswer):'';
 return [answer?sessionText('oneAnswer',state.known,{answer}):'',detail].filter(Boolean).join(' ');
}
function noteFrom(activityId:string,e:AnswerEvaluation):CorrectionNote{
 return {activityId,outcome:e.outcome,findings:e.findings.filter(f=>f.code!=='filler-removed').map(f=>({code:f.code,...(f.expected!==undefined?{expected:f.expected}:{})})),...(e.closestAnswer?{closestAnswer:e.closestAnswer}:{})};
}
function achievementOf(c:CurrentActivity,success:'evaluated'|'confirmed'):ActivityAchievement{
 if(c.hints>0||c.modelShown)return 'assisted';
 if(c.minorErrors+c.meaningErrors>0)return 'after-retry';
 return success==='confirmed'?'learner-confirmed':'independent';
}
/** Close the current activity, deliver after-activity corrections, adapt the queue and move on. */
function finalize(state:LearningSessionState,catalog:Catalog,achievement:ActivityAchievement,outputs:LearningSessionOutput[]):LearningSessionStep{
 const c=state.current!,a=activityOf(catalog,c.activityId),k=state.known;
 const result=validateActivityResult({activityId:a.id,objectiveId:a.objectiveId,kind:a.kind,modality:achievement==='no-evidence'&&a.kind==='listen'?'none':c.lastModality,achievement,
  minorErrors:c.minorErrors,meaningErrors:c.meaningErrors,replays:c.replays,hints:c.hints,modelShown:c.modelShown,day:state.lastActiveOn,...(a.skill?{skill:a.skill}:{})});
 let pending=state.pendingCorrections;
 if(state.preferences.correctionTiming==='after-activity'){
  const mine=pending.filter(n=>n.activityId===a.id);
  if(mine.length)outputs.push({kind:'corrections',items:mine.map(n=>correctionText(state,n,catalog))});
  pending=pending.filter(n=>n.activityId!==a.id);
 }
 let queue=[...state.queue],remediated=state.remediated;
 if(achievement==='not-achieved'){
  outputs.push({kind:'message',code:'later',text:sessionText('laterAgain',k)});
  if(state.preferences.remediation&&!remediated.includes(a.objectiveId)){
   const model=[...catalog.values()].find(x=>x.objectiveId===a.objectiveId&&x.kind==='repeat');
   const insert:QueueItem[]=[...(model&&model.id!==a.id?[{activityId:model.id,reason:'remediation' as const}]:[]),{activityId:a.id,reason:'remediation'}];
   queue.splice(state.position+1,0,...insert);remediated=[...remediated,a.objectiveId];
   outputs.push({kind:'message',code:'step-back',text:sessionText('stepBack',k)});
  }
 }
 const position=state.position+1,nextItem=queue[position];
 const next:LearningSessionState={...state,queue,position,remediated,pendingCorrections:pending,results:[...state.results,result],
  current:nextItem?freshCurrent(nextItem.activityId):null,revision:state.revision+1};
 if(!nextItem)return finish(next,catalog,outputs);
 const nextActivity=activityOf(catalog,nextItem.activityId);
 if(next.preferences.predictableStructure&&nextActivity.objectiveId!==a.objectiveId)outputs.push({kind:'message',code:'transition',text:sessionText('next',k,{goal:nextActivity.goal[k]})});
 outputs.push(...promptOutput(next,catalog));
 return {state:next,outputs};
}
function finish(state:LearningSessionState,catalog:Catalog,outputs:LearningSessionOutput[]):LearningSessionStep{
 const done:LearningSessionState={...state,status:'finished',current:null,revision:state.revision+1};
 outputs.push({kind:'summary',summary:summarizeSession(done,[...catalog.values()])});
 if(done.preferences.correctionTiming==='end-of-session'&&done.pendingCorrections.length){
  outputs.push({kind:'corrections',items:done.pendingCorrections.map(n=>correctionText(done,n,catalog))});
  return {state:{...done,pendingCorrections:[]},outputs};
 }
 return {state:done,outputs};
}
function hintText(state:LearningSessionState,a:SessionActivity):string{
 const words=display(a.model).split(/\s+/);
 return sessionText('hint',state.known,{start:`${words.slice(0,Math.max(1,Math.ceil(words.length/3))).join(' ')}…`});
}
function modelOutput(state:LearningSessionState,a:SessionActivity):LearningSessionOutput{
 const correct=a.options?.find(o=>o.id===a.correctOptionId);
 if(correct)return {kind:'model',text:sessionText('oneAnswer',state.known,{answer:quoteIn(state.known,optionText(state,correct).text)}),speech:{text:display(a.cue??a.model),language:state.target}};
 return {kind:'model',text:sessionText('model',state.known),speech:{text:display(a.model),language:state.target}};
}
/** A choice hint removes one wrong option instead of revealing the answer. */
function choiceHint(state:LearningSessionState,a:SessionActivity):string{
 const acceptable=new Set((a.acceptableOptions??[]).map(x=>x.optionId));
 const wrong=orderedOptions(state,a).filter(o=>o.id!==a.correctOptionId&&!acceptable.has(o.id));
 return sessionText('notThis',state.known,{option:quoteIn(state.known,wrong[wrong.length-1]?.text??'')});
}
function chooseOption(state:LearningSessionState,catalog:Catalog,a:SessionActivity,c:CurrentActivity,optionId:string,outputs:LearningSessionOutput[]):LearningSessionStep{
 const k=state.known,timing=state.preferences.correctionTiming;
 if(optionId===a.correctOptionId){
  outputs.push({kind:'feedback',outcome:'correct',text:answerFeedbackText({outcome:'correct',findings:[],countsAsSuccess:true,countsAsError:false,source:'typed',pronunciation:'not-assessed'},k)});
  return finalize({...state,current:c},catalog,achievementOf(c,'evaluated'),outputs);
 }
 const acceptable=a.acceptableOptions?.find(x=>x.optionId===optionId);
 if(acceptable)return {state:{...state,current:c,revision:state.revision+1},outputs:[{kind:'feedback',outcome:'needs-review',text:acceptable.note[k]}]};
 const errored={...c,meaningErrors:c.meaningErrors+1};
 const wrongText=answerFeedbackText({outcome:'meaning-error',findings:[],countsAsSuccess:false,countsAsError:true,source:'typed',pronunciation:'not-assessed'},k);
 const corrections=timing==='immediate'?state.pendingCorrections:[...state.pendingCorrections,{activityId:a.id,outcome:'meaning-error' as const,findings:[],correctOptionId:a.correctOptionId!}];
 outputs.push({kind:'feedback',outcome:'meaning-error',text:timing==='immediate'?wrongText:sessionText('tryAgain',k)});
 const next={...state,pendingCorrections:corrections,current:errored};
 if(errored.meaningErrors>=Math.max(1,(a.options?.length??2)-1-(a.acceptableOptions?.length??0)))return finalize(next,catalog,'not-achieved',outputs);
 return {state:{...next,revision:state.revision+1},outputs};
}
function orientation(state:LearningSessionState,catalog:Catalog):LearningSessionOutput{
 const k=state.known;
 if(!state.current)return {kind:'message',code:'all-done',text:sessionText('allDone',k)};
 const a=activityOf(catalog,state.current.activityId);
 return {kind:'message',code:'orientation',text:sessionText('orientation',k,{goal:a.goal[k],n:state.position+1,total:state.queue.length})};
}
export function stepSession(state:LearningSessionState,event:LearningSessionEvent,activities:readonly SessionActivity[],policy:PedagogyPolicy=provisionalPedagogyPolicy):LearningSessionStep{
 const maxErrors=policy.activity.maxErrors;
 const catalog=catalogOf(activities),k=state.known,outputs:LearningSessionOutput[]=[];
 const same=(code:Extract<LearningSessionOutput,{kind:'message'}>['code'],key:Parameters<typeof sessionText>[0]):LearningSessionStep=>({state,outputs:[{kind:'message',code,text:sessionText(key,k)}]});
 if(event.type==='where-am-i')return {state,outputs:[orientation(state,catalog)]};
 if(event.type==='request-corrections'){
  if(!state.pendingCorrections.length)return same('no-corrections','noCorrections');
  return {state:{...state,pendingCorrections:[],revision:state.revision+1},outputs:[{kind:'corrections',items:state.pendingCorrections.map(n=>correctionText(state,n,catalog))}]};
 }
 if(state.status==='finished'||!state.current)return {state,outputs:[orientation(state,catalog)]};
 if(event.type==='finish')return finish({...state,results:state.results},catalog,outputs);
 if(state.status==='paused'){
  if(event.type!=='resume')return same('still-paused','stillPaused');
  if(!isLocalDay(event.day))throw new Error('Invalid local day');
  const resumed:LearningSessionState={...state,status:'active',lastActiveOn:event.day>state.lastActiveOn?event.day:state.lastActiveOn,current:{...state.current,instructionStep:0,pendingConfirmation:null},revision:state.revision+1};
  return {state:resumed,outputs:[orientation(resumed,catalog),...promptOutput(resumed,catalog)]};
 }
 const c=state.current,a=activityOf(catalog,c.activityId);
 const update=(patch:Partial<CurrentActivity>,extra:Partial<LearningSessionState>={}):LearningSessionState=>({...state,...extra,current:{...c,...patch},revision:state.revision+1});
 switch(event.type){
  case 'resume':return {state,outputs:promptOutput(state,catalog)};
  case 'pause':return {state:{...state,status:'paused',pauses:state.pauses+1,revision:state.revision+1},outputs:[{kind:'message',code:'paused',text:sessionText('paused',k)}]};
  case 'continue':{
   if(a.kind==='listen')return finalize(state,catalog,'no-evidence',outputs);
   const total=instructionSteps(state,a).length;
   if(state.preferences.instructionFormat==='one-step'&&c.instructionStep<total-1){const next=update({instructionStep:c.instructionStep+1});return {state:next,outputs:promptOutput(next,catalog)};}
   return {state,outputs:promptOutput(state,catalog)};
  }
  case 'replay':case 'slower':{
   const next=update({replays:c.replays+1});const speech=speechFor(state,a);
   return {state:next,outputs:[{kind:'replay',...(speech?{speech}:{}),rate:event.type==='slower'?'slower':'normal',instruction:instructionSteps(state,a).join(' ')}]};
  }
  case 'hint':{
   if(a.options&&c.hints===0)return {state:update({hints:1}),outputs:[{kind:'hint',text:choiceHint(state,a)}]};
   if(c.hints>=1)return {state:update({hints:c.hints+1,modelShown:true}),outputs:[modelOutput(state,a)]};
   return {state:update({hints:1}),outputs:[{kind:'hint',text:hintText(state,a)}]};
  }
  case 'show-model':return {state:update({modelShown:true}),outputs:[modelOutput(state,a)]};
  case 'skip':outputs.push({kind:'message',code:'skipped',text:sessionText('skipped',k)});return finalize(state,catalog,'no-evidence',outputs);
  case 'timeout':return state.preferences.responseWindow.mode==='untimed'?{state,outputs:[]}:same('no-rush','noRush');
  case 'more-time':{const next=update({extraSeconds:Math.min(60,c.extraSeconds+(state.preferences.responseWindow.mode==='timed'?state.preferences.responseWindow.seconds:0))});return {state:next,outputs:[{kind:'message',code:'more-time',text:sessionText('moreTime',k)}]};}
  case 'reject':return c.pendingConfirmation?{state:update({pendingConfirmation:null}),outputs:[{kind:'message',code:'not-heard',text:sessionText('notHeard',k)}]}:{state,outputs:[]};
  case 'confirm':{
   if(!c.pendingConfirmation)return {state,outputs:[]};
   outputs.push({kind:'feedback',outcome:'correct',text:answerFeedbackText({outcome:'correct',findings:[],countsAsSuccess:true,countsAsError:false,source:'speech',pronunciation:'not-assessed'},k)});
   return finalize({...state,current:{...c,pendingConfirmation:null}},catalog,achievementOf(c,'confirmed'),outputs);
  }
  case 'choose':{
   if(!a.options?.some(o=>o.id===event.optionId))return {state,outputs:[]};
   return chooseOption(state,catalog,a,{...c,attempts:c.attempts+1,lastModality:'choice'},event.optionId,outputs);
  }
  case 'answer':{
   if(a.options){
    // A spoken or typed option counts as choosing it; anything else asks to choose.
    const said=normalizedUtterance(event.response,state.target),saidKnown=normalizedUtterance(event.response,state.known);
    const hit=a.options.find(o=>typeof o.text==='string'?normalizedUtterance(o.text,state.target)===said:normalizedUtterance(o.text[state.known],state.known)===saidKnown);
    if(!hit||!said||(event.source.kind==='speech'&&event.source.confidence!=='high'))return {state,outputs:[{kind:'message',code:'not-heard',text:sessionText('chooseOne',k)}]};
    return chooseOption(state,catalog,a,{...c,attempts:c.attempts+1,lastModality:event.source.kind==='speech'?'speech':'choice'},hit.id,outputs);
   }
   if(a.kind==='listen'||!a.key)return finalize(state,catalog,'no-evidence',outputs);
   const modality:ResponseModality=event.source.kind==='speech'?'speech':event.source.kind;
   const e=evaluateAnswer(a.key,event.response,event.source);
   const timing=state.preferences.correctionTiming,maxDetails=state.preferences.lowStimulation?1:2;
   const base={...c,attempts:c.attempts+1,lastModality:modality,pendingConfirmation:null};
   if(e.countsAsSuccess){
    const immediate=timing==='immediate';
    outputs.push({kind:'feedback',outcome:e.outcome,text:answerFeedbackText(immediate?e:{...e,findings:[]},k,{maxDetails})});
    const informative=e.findings.some(f=>f.code==='accent-marks'||f.code==='umlaut-spelling');
    const pending=!immediate&&informative?[...state.pendingCorrections,noteFrom(a.id,e)]:state.pendingCorrections;
    return finalize({...state,pendingCorrections:pending,current:base},catalog,achievementOf(base,'evaluated'),outputs);
   }
   if(e.outcome==='needs-confirmation'&&e.closestAnswer){
    return {state:update({...base,pendingConfirmation:e.closestAnswer},{uncertainEvents:state.uncertainEvents+1}),outputs:[{kind:'confirm-request',closestAnswer:display(e.closestAnswer),text:answerFeedbackText(e,k,{maxDetails:0})}]};
   }
   if(e.outcome==='no-evidence'||e.outcome==='needs-review'){
    return {state:update(base,{uncertainEvents:state.uncertainEvents+1}),outputs:[{kind:'feedback',outcome:e.outcome,text:answerFeedbackText(e,k,{maxDetails})}]};
   }
   const errored={...base,minorErrors:c.minorErrors+(e.outcome==='minor-error'?1:0),meaningErrors:c.meaningErrors+(e.outcome==='meaning-error'?1:0)};
   const corrections=timing==='immediate'?state.pendingCorrections:[...state.pendingCorrections,noteFrom(a.id,e)];
   outputs.push(timing==='immediate'?{kind:'feedback',outcome:e.outcome,text:answerFeedbackText(e,k,{maxDetails})}:{kind:'feedback',outcome:e.outcome,text:sessionText('tryAgain',k)});
   const errors=errored.minorErrors+errored.meaningErrors;
   if(errors>=maxErrors)return finalize({...state,pendingCorrections:corrections,current:errored},catalog,'not-achieved',outputs);
   const offerModel=errors===policy.activity.offerModelAfterErrors&&errors<maxErrors&&!errored.modelShown&&(timing==='immediate'||timing==='after-activity');
   if(offerModel)outputs.push(modelOutput(state,a));
   return {state:{...state,pendingCorrections:corrections,uncertainEvents:state.uncertainEvents,current:{...errored,modelShown:errored.modelShown||offerModel},revision:state.revision+1},outputs};
  }
 }
}

export interface SessionSummary {
 sessionId:string;
 target:TargetLanguage;
 known:TargetLanguage;
 startedOn:string;
 endedOn:string;
 activitiesDone:number;
 objectives:readonly {objectiveId:string;goal:string;achievements:Readonly<Partial<Record<ActivityAchievement,number>>>}[];
 independent:number;
 assisted:number;
 notAchieved:number;
 notCounted:number;
 uncertainEvents:number;
 replays:number;
 hints:number;
 pendingCorrections:number;
 nextReviewOn:string|null;
 /** Localized statements derived only from the results above. */
 statements:readonly string[];
 cefrClaim:null;
 pronunciation:'not-assessed';
}
/** A summary grounded strictly in recorded results. Pass the updated learner model to include the next review. */
export function summarizeSession(state:LearningSessionState,activities:readonly SessionActivity[],modelAfter?:LearnerModel):SessionSummary{
 const catalog=catalogOf(activities),k=state.known,results=state.results;
 const count=(xs:readonly ActivityAchievement[])=>results.filter(r=>xs.includes(r.achievement)).length;
 const independent=count(['independent','learner-confirmed']),assisted=count(['after-retry','assisted']),notAchieved=count(['not-achieved']);
 const notCounted=results.filter(r=>r.achievement==='no-evidence'&&r.kind!=='listen').length;
 const byObjective=new Map<string,Partial<Record<ActivityAchievement,number>>>();
 for(const r of results){const m=byObjective.get(r.objectiveId)??{};m[r.achievement]=(m[r.achievement]??0)+1;byObjective.set(r.objectiveId,m);}
 const objectives=[...byObjective].map(([objectiveId,achievements])=>{
  const goal=[...catalog.values()].find(a=>a.objectiveId===objectiveId)?.goal[k]??objectiveId;
  return {objectiveId,goal,achievements};
 });
 let nextReviewOn:string|null=null;
 if(modelAfter)for(const r of Object.values(modelAfter.records))if(byObjective.has(r.objectiveId)&&r.schedule&&(!nextReviewOn||r.schedule.dueOn<nextReviewOn))nextReviewOn=r.schedule.dueOn;
 const statements:string[]=[];
 if(!results.length)statements.push(sessionText('sumNothing',k));
 else{
  statements.push(sessionText('sumPracticed',k,{count:results.length,goals:objectives.map(o=>o.goal).join('; ')}));
  if(independent+assisted+notAchieved>0)statements.push(sessionText('sumOutcomes',k,{independent,assisted,notAchieved}));
  if(notCounted>0)statements.push(sessionText('sumNotCounted',k,{count:notCounted}));
  if(nextReviewOn)statements.push(sessionText('sumNextReview',k,{date:nextReviewOn}));
 }
 if(state.preferences.correctionTiming==='on-request'&&state.pendingCorrections.length)statements.push(sessionText('sumOnRequest',k,{count:state.pendingCorrections.length}));
 statements.push(sessionText('sumNoClaim',k));
 return {sessionId:state.sessionId,target:state.target,known:k,startedOn:state.startedOn,endedOn:state.lastActiveOn,activitiesDone:results.length,objectives,
  independent,assisted,notAchieved,notCounted,uncertainEvents:state.uncertainEvents,replays:results.reduce((n,r)=>n+r.replays,0),hints:results.reduce((n,r)=>n+r.hints,0),
  pendingCorrections:state.pendingCorrections.length,nextReviewOn,statements,cefrClaim:null,pronunciation:'not-assessed'};
}
/** Course progress view of a session: successful recall/checkpoint answers count as authored matches.
 * Assisted answers are recorded as attempts, not as independent successes, so they do not unlock lessons.
 */
export function courseProgressAfterSession(progress:CourseProgress,state:LearningSessionState):CourseProgress{
 if(progress.language!==state.target)throw new Error('Language mismatch');
 const lessons=lessonsFor(state.target),exercises=new Map(lessons.flatMap(l=>l.exercises.map(e=>[e.id,e] as const)));
 let p=progress;const touched=new Set<string>();
 for(const r of state.results){
  const e=exercises.get(r.activityId);
  if(!e||r.achievement==='no-evidence'||e.type==='listen')continue;
  const success=r.achievement==='independent'||r.achievement==='learner-confirmed'||r.achievement==='after-retry';
  p=recordCourseAttempt(p,e,success?{kind:'match',recognized:e.utterance}:{kind:'retry',hint:''},r.day);
  touched.add(r.objectiveId);
 }
 for(const lesson of lessons)if(touched.has(lesson.id))p=finishLesson(p,lesson);
 return p;
}
/** Apply a finished session once to the learner model and course progress. Re-applying is a no-op. */
export function completeSession(state:LearningSessionState,model:LearnerModel,progress:CourseProgress,settings:SchedulerSettings=defaultSchedulerSettings,policy:PedagogyPolicy=provisionalPedagogyPolicy):{model:LearnerModel;progress:CourseProgress;applied:boolean}{
 if(state.status!=='finished')throw new Error('Session is not finished');
 if(model.appliedSessions.includes(state.sessionId))return {model,progress,applied:false};
 return {model:applySessionResults(model,state.sessionId,state.results,settings,policy),progress:courseProgressAfterSession(progress,state),applied:true};
}

const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const count=(v:unknown)=>Number.isSafeInteger(v)&&(v as number)>=0&&(v as number)<=100000;
const outcomes:readonly AnswerOutcome[]=['correct','correct-variant','minor-error','meaning-error','needs-confirmation','needs-review','no-evidence'];
function isAuthored(a:SessionActivity,text:unknown):text is string{
 if(typeof text!=='string'||!a.key)return false;
 if([...a.key.models,...(a.key.variants??[]),...(a.key.patterns??[])].includes(text))return true;
 return (a.key.patterns??[]).some(p=>matchesAnswerPattern(p,text,t=>normalizedUtterance(t,a.key!.language)));
}
export function sessionToJSON(state:LearningSessionState):string{return JSON.stringify(state);}
/** Strict restore. An interrupted active session comes back paused, so resuming starts with orientation. */
export function sessionFromJSON(raw:string,activities:readonly SessionActivity[],policy:PedagogyPolicy=provisionalPedagogyPolicy):LearningSessionState|null{
 const maxErrors=policy.activity.maxErrors;
 if(typeof raw!=='string'||raw.length>300000)return null;
 let v:unknown;try{v=JSON.parse(raw);}catch{return null;}
 if(!obj(v)||v.version!==1||typeof v.sessionId!=='string'||!idPattern.test(v.sessionId))return null;
 if(!targetLanguages.includes(v.target as TargetLanguage)||!targetLanguages.includes(v.known as TargetLanguage)||v.target===v.known)return null;
 if(!isLocalDay(v.startedOn)||!isLocalDay(v.lastActiveOn)||v.lastActiveOn<v.startedOn||!['active','paused','finished'].includes(v.status as string))return null;
 let preferences:SessionPreferences;try{preferences=validateSessionPreferences(v.preferences as SessionPreferences);}catch{return null;}
 const catalog=catalogOf(activities);
 if(!Array.isArray(v.queue)||v.queue.length>200||!v.queue.every(q=>obj(q)&&typeof q.activityId==='string'&&catalog.has(q.activityId)&&['review','new','consolidation','remediation'].includes(q.reason as string)))return null;
 const queue=(v.queue as Record<string,unknown>[]).map(q=>({activityId:q.activityId as string,reason:q.reason as QueueReason}));
 if(!Number.isSafeInteger(v.position)||(v.position as number)<0||(v.position as number)>queue.length)return null;
 const position=v.position as number;
 let current:CurrentActivity|null=null;
 if(v.current!==null){
  const c=v.current;
  if(!obj(c)||queue[position]?.activityId!==c.activityId||v.status==='finished')return null;
  const a=catalog.get(c.activityId as string)!;
  if(!['attempts','minorErrors','meaningErrors','replays','hints','instructionStep','extraSeconds'].every(f=>count(c[f]))||typeof c.modelShown!=='boolean'||!['speech','typed','choice','none'].includes(c.lastModality as string))return null;
  if((c.instructionStep as number)>3||(c.extraSeconds as number)>60||(c.minorErrors as number)+(c.meaningErrors as number)>=maxErrors)return null;
  if(c.pendingConfirmation!==null&&!isAuthored(a,c.pendingConfirmation))return null;
  current={activityId:a.id,attempts:c.attempts as number,minorErrors:c.minorErrors as number,meaningErrors:c.meaningErrors as number,replays:c.replays as number,hints:c.hints as number,
   modelShown:c.modelShown,instructionStep:c.instructionStep as number,extraSeconds:c.extraSeconds as number,pendingConfirmation:null,lastModality:c.lastModality as ResponseModality};
 }else if(position<queue.length&&v.status!=='finished')return null;
 if(!Array.isArray(v.results)||v.results.length>200)return null;
 const results:ActivityResult[]=[];
 for(const r of v.results){
  try{const x=validateActivityResult(r as ActivityResult);const a=catalog.get(x.activityId);if(!a||a.objectiveId!==x.objectiveId||a.kind!==x.kind||x.day<(v.startedOn as string)||x.day>(v.lastActiveOn as string))return null;
   results.push({activityId:x.activityId,objectiveId:x.objectiveId,kind:x.kind,modality:x.modality,achievement:x.achievement,minorErrors:x.minorErrors,meaningErrors:x.meaningErrors,replays:x.replays,hints:x.hints,modelShown:x.modelShown,day:x.day});}catch{return null;}
 }
 if(!Array.isArray(v.pendingCorrections)||v.pendingCorrections.length>200)return null;
 const pendingCorrections:CorrectionNote[]=[];
 for(const n of v.pendingCorrections){
  if(!obj(n)||typeof n.activityId!=='string'||!catalog.has(n.activityId)||!outcomes.includes(n.outcome as AnswerOutcome)||!Array.isArray(n.findings))return null;
  const a=catalog.get(n.activityId)!;
  if(n.closestAnswer!==undefined&&!isAuthored(a,n.closestAnswer))return null;
  if(n.correctOptionId!==undefined&&(typeof n.correctOptionId!=='string'||n.correctOptionId!==a.correctOptionId))return null;
  // Only authored words may be kept: an `expected` value must occur in an authored answer of the activity.
  const language=a.key?.language??(v.target as TargetLanguage);
  const authoredTexts=[a.model,...(a.key?.models??[]),...(a.key?.variants??[]),...(a.key?.patterns??[])];
  const authoredWords=new Set(authoredTexts.flatMap(t=>answerTokens(t,language)));
  const findings:{code:FindingCode;expected?:string}[]=[];
  for(const f of n.findings){
   if(!obj(f)||typeof f.code!=='string'||!/^[a-z-]{2,40}$/.test(f.code)||'received' in f)return null;
   if(f.expected!==undefined&&(typeof f.expected!=='string'||!(authoredTexts.includes(f.expected)||f.expected.split(' ').every(w=>authoredWords.has(w)))))return null;
   findings.push({code:f.code as FindingCode,...(typeof f.expected==='string'?{expected:f.expected}:{})});
  }
  pendingCorrections.push({activityId:n.activityId,outcome:n.outcome as AnswerOutcome,findings,...(typeof n.closestAnswer==='string'?{closestAnswer:n.closestAnswer}:{}),...(typeof n.correctOptionId==='string'?{correctOptionId:n.correctOptionId}:{})});
 }
 if(!Array.isArray(v.remediated)||!v.remediated.every(id=>typeof id==='string'&&[...catalog.values()].some(a=>a.objectiveId===id)))return null;
 if(!count(v.uncertainEvents)||!count(v.pauses)||!count(v.revision))return null;
 return {version:1,sessionId:v.sessionId,target:v.target as TargetLanguage,known:v.known as TargetLanguage,startedOn:v.startedOn,lastActiveOn:v.lastActiveOn,
  status:v.status==='active'?'paused':v.status as LearningSessionState['status'],preferences,queue,position,current,results,pendingCorrections,remediated:[...v.remediated as string[]],
  uncertainEvents:v.uncertainEvents as number,pauses:(v.pauses as number)+(v.status==='active'?1:0),revision:v.revision as number};
}
