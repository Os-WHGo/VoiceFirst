/** Versioned offline lesson packages and their validator.
 * Checks identity, language and variant, objectives, localized support, answer coherence (every accepted answer must
 * evaluate as correct), audio references, absence of runtime network dependencies, a non-oral answer path,
 * prerequisite graph and SHA-256 integrity. Passing validation is STRUCTURAL only: it never authorizes publication.
 */
import {evaluateAnswer,type AnswerKey} from './answer-evaluation.js';
import {isAnswerPattern} from './answer-patterns.js';
import {lessonsFor,normalizedUtterance,type LocalizedText} from './course.js';
import {dialoguesFor} from './guided-dialogues.js';
import {englishVariants,frenchVariants} from './regional-variants.js';
import {sha256Bytes} from './sha256-bytes.js';
import {masterySkills,type LearningActivityKind,type MasterySkill} from './skill-mastery.js';
import {targetLanguages,type CefrBand,type TargetLanguage} from './types.js';

export const lessonPackageFormat='voicefirst.lesson-package';
export type PackageResponseMode='speech'|'typed'|'choice';
export interface PackageActivity {
 id:string;
 kind:LearningActivityKind;
 prompt:{target?:string;support:LocalizedText};
 model?:string;
 accepted?:readonly string[];
 variants?:readonly string[];
 patterns?:readonly string[];
 options?:readonly {id:string;text:string}[];
 correctOptionId?:string;
 responseModes:readonly PackageResponseMode[];
 audio?:{ref:string;sha256:string};
 /** Advisory only: the session never enforces it as a hard limit. */
 timeLimitSeconds?:number;
}
export interface PackageLesson {
 id:string;
 band:CefrBand;
 objective:{id:string;goal:LocalizedText};
 skills:readonly MasterySkill[];
 prerequisites:readonly string[];
 activities:readonly PackageActivity[];
 rights:{status:'original'|'rights-cleared'|'rights-pending';source?:string};
 editorialStatus:'draft'|'reviewed'|'final';
 audioStatus:'audio-missing'|'audio-unverified'|'audio-verified';
 asrStatus:'asr-unvalidated'|'asr-validated';
}
export interface LessonPackage {
 format:typeof lessonPackageFormat;
 schemaVersion:1;
 packageId:string;
 version:string;
 targetLanguage:TargetLanguage;
 variant:string;
 contentSha256:string;
 lessons:readonly PackageLesson[];
}
export type ValidationSeverity='error'|'warning';
export interface ValidationIssue {severity:ValidationSeverity;code:string;path:string;detail?:string}
export interface PackageValidation {
 structurallyValid:boolean;
 issues:readonly ValidationIssue[];
 computedSha256:string|null;
 lessons:number;
 activities:number;
 /** Reasons the package cannot be published yet; validation itself never clears them. */
 publicationBlockers:readonly string[];
 readyForPublication:false;
}

const bands:readonly CefrBand[]=['A0','A1','A2','B1','B2','C1','C2'];
const kinds:readonly LearningActivityKind[]=['listen','repeat','recall','checkpoint','dialogue-turn','choice'];
const idPattern=/^[a-z0-9][\w.:-]{1,159}$/i;
const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const audioRef=/^audio\/[a-z0-9][a-z0-9._-]{0,120}\.(wav|m4a|ogg|opus)$/i;
const urlLike=/\b(?:https?|ftp|wss?|data|file):|\bwww\.[a-z0-9-]+\.[a-z]/i;
const maxText=1000;
export function packageVariantsFor(target:TargetLanguage):readonly string[]{
 return target==='en-CA'?englishVariants:target==='fr-CA'?frenchVariants:[target];
}
/** Deterministic JSON with sorted object keys, the basis of the integrity digest. */
export function canonicalJSON(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return `[${value.map(canonicalJSON).join(',')}]`;
 const entries=Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0);
 return `{${entries.map(([k,v])=>`${JSON.stringify(k)}:${canonicalJSON(v)}`).join(',')}}`;
}
function utf8(text:string):Uint8Array{
 const out:number[]=[];
 for(const ch of text){
  const c=ch.codePointAt(0)!;
  if(c<0x80)out.push(c);
  else if(c<0x800)out.push(0xc0|c>>6,0x80|c&63);
  else if(c<0x10000)out.push(0xe0|c>>12,0x80|c>>6&63,0x80|c&63);
  else out.push(0xf0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);
 }
 return Uint8Array.from(out);
}
export function lessonPackageDigest(lessons:readonly PackageLesson[]):string{return sha256Bytes(utf8(canonicalJSON(lessons)));}

const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=maxText;
export function validateLessonPackage(input:unknown):PackageValidation{
 const issues:ValidationIssue[]=[];
 const err=(code:string,path:string,detail?:string)=>issues.push({severity:'error',code,path,...(detail?{detail}:{})});
 const warn=(code:string,path:string,detail?:string)=>issues.push({severity:'warning',code,path,...(detail?{detail}:{})});
 const done=(computed:string|null,lessons=0,activities=0,blockers:string[]=[]):PackageValidation=>({structurallyValid:!issues.some(i=>i.severity==='error'),issues,computedSha256:computed,lessons,activities,publicationBlockers:blockers,readyForPublication:false});
 if(!obj(input)){err('NOT_AN_OBJECT','$');return done(null);}
 if(input.format!==lessonPackageFormat)err('FORMAT','$.format');
 if(input.schemaVersion!==1){err('SCHEMA_VERSION','$.schemaVersion');return done(null);}
 if(typeof input.packageId!=='string'||!idPattern.test(input.packageId))err('PACKAGE_ID','$.packageId');
 if(typeof input.version!=='string'||!semver.test(input.version))err('VERSION','$.version','semantic version x.y.z required');
 const target=input.targetLanguage as TargetLanguage;
 if(!targetLanguages.includes(target)){err('TARGET_LANGUAGE','$.targetLanguage');return done(null);}
 if(typeof input.variant!=='string'||!packageVariantsFor(target).includes(input.variant))err('VARIANT','$.variant',`allowed: ${packageVariantsFor(target).join(', ')}`);
 if(!Array.isArray(input.lessons)||!input.lessons.length||input.lessons.length>500){err('LESSONS','$.lessons');return done(null);}
 // Offline requirement: no runtime URL anywhere, except attribution in rights.source.
 const scan=(v:unknown,path:string):void=>{
  if(typeof v==='string'){if(urlLike.test(v)&&!/\.rights\.source$/.test(path))err('EXTERNAL_DEPENDENCY',path);return;}
  if(Array.isArray(v))v.forEach((x,i)=>scan(x,`${path}[${i}]`));else if(obj(v))for(const [k,x] of Object.entries(v))scan(x,`${path}.${k}`);
 };
 scan(input.lessons,'$.lessons');
 let computed:string|null=null;
 try{computed=lessonPackageDigest(input.lessons as PackageLesson[]);}catch{err('INTEGRITY','$.lessons','content cannot be hashed');}
 if(typeof input.contentSha256!=='string'||!/^[0-9a-f]{64}$/.test(input.contentSha256))err('INTEGRITY','$.contentSha256','missing digest');
 else if(computed&&computed!==input.contentSha256)err('INTEGRITY','$.contentSha256','content does not match its digest');
 const lessonIds=new Set<string>(),activityIds=new Set<string>(),objectiveIds=new Set<string>();
 const graph=new Map<string,readonly string[]>();
 const blockers=new Set<string>();
 let activities=0;
 const localized=(v:unknown,path:string)=>{
  if(!obj(v)){err('SUPPORT_MISSING',path);return;}
  for(const k of targetLanguages)if(!text(v[k]))err('SUPPORT_MISSING',`${path}.${k}`);
  const values=targetLanguages.map(k=>v[k]).filter(text);
  const most=Math.max(0,...values.map(x=>values.filter(y=>y===x).length));
  if(most>=3)warn('SUPPORT_NOT_LOCALIZED',path,'three or more known languages share identical wording');
 };
 for(const [li,lesson] of (input.lessons as unknown[]).entries()){
  const lp=`$.lessons[${li}]`;
  if(!obj(lesson)){err('LESSON',lp);continue;}
  const id=lesson.id;
  if(typeof id!=='string'||!idPattern.test(id))err('LESSON_ID',`${lp}.id`);
  else if(lessonIds.has(id))err('DUPLICATE_ID',`${lp}.id`,id);else lessonIds.add(id);
  if(!bands.includes(lesson.band as CefrBand))err('BAND',`${lp}.band`);
  const objective=lesson.objective;
  if(!obj(objective)||typeof objective.id!=='string'||!idPattern.test(objective.id))err('OBJECTIVE',`${lp}.objective`);
  else{if(objectiveIds.has(objective.id))err('DUPLICATE_ID',`${lp}.objective.id`,objective.id);objectiveIds.add(objective.id);localized(objective.goal,`${lp}.objective.goal`);}
  if(!Array.isArray(lesson.skills)||!lesson.skills.length||lesson.skills.some(s=>!masterySkills.includes(s as MasterySkill)))err('SKILLS',`${lp}.skills`);
  if(!Array.isArray(lesson.prerequisites)||lesson.prerequisites.some(p=>typeof p!=='string'))err('PREREQUISITES',`${lp}.prerequisites`);
  else if(typeof id==='string')graph.set(id,lesson.prerequisites as string[]);
  const rights=lesson.rights;
  if(!obj(rights)||!['original','rights-cleared','rights-pending'].includes(rights.status as string))err('RIGHTS',`${lp}.rights`);
  else if(rights.status==='rights-pending')blockers.add('rights-pending');
  if(!['draft','reviewed','final'].includes(lesson.editorialStatus as string))err('EDITORIAL_STATUS',`${lp}.editorialStatus`);
  else if(lesson.editorialStatus!=='final')blockers.add('editorial-review-pending');
  if(!['audio-missing','audio-unverified','audio-verified'].includes(lesson.audioStatus as string))err('AUDIO_STATUS',`${lp}.audioStatus`);
  else if(lesson.audioStatus!=='audio-verified')blockers.add('audio-not-verified');
  if(!['asr-unvalidated','asr-validated'].includes(lesson.asrStatus as string))err('ASR_STATUS',`${lp}.asrStatus`);
  else if(lesson.asrStatus!=='asr-validated')blockers.add('asr-not-validated');
  if(!Array.isArray(lesson.activities)||!lesson.activities.length){err('ACTIVITIES',`${lp}.activities`);continue;}
  let evidence=false;
  for(const [ai,activity] of lesson.activities.entries()){
   const ap=`${lp}.activities[${ai}]`;activities++;
   if(!obj(activity)){err('ACTIVITY',ap);continue;}
   if(typeof activity.id!=='string'||!idPattern.test(activity.id))err('ACTIVITY_ID',`${ap}.id`);
   else if(activityIds.has(activity.id))err('DUPLICATE_ID',`${ap}.id`,activity.id);else activityIds.add(activity.id);
   const kind=activity.kind as LearningActivityKind;
   if(!kinds.includes(kind)){err('ACTIVITY_KIND',`${ap}.kind`);continue;}
   const prompt=activity.prompt;
   if(!obj(prompt))err('PROMPT',`${ap}.prompt`);
   else{localized(prompt.support,`${ap}.prompt.support`);if(prompt.target!==undefined&&!text(prompt.target))err('PROMPT',`${ap}.prompt.target`);}
   if((kind==='dialogue-turn'||kind==='listen')&&!(obj(prompt)&&text(prompt.target))&&!text(activity.model))err('PROMPT_TARGET_MISSING',`${ap}.prompt.target`);
   const modes=activity.responseModes;
   if(!Array.isArray(modes)||modes.some(m=>!['speech','typed','choice'].includes(m as string)))err('RESPONSE_MODES',`${ap}.responseModes`);
   else if(kind!=='listen'&&!modes.some(m=>m==='typed'||m==='choice'))err('NO_NON_ORAL_PATH',`${ap}.responseModes`,'learners must be able to answer without speaking');
   if(activity.timeLimitSeconds!==undefined){
    const t=activity.timeLimitSeconds;
    if(typeof t!=='number'||!Number.isFinite(t)||t<10)err('TIME_LIMIT',`${ap}.timeLimitSeconds`,'too short for flexible response time');
    else if(t<20)warn('TIME_LIMIT',`${ap}.timeLimitSeconds`,'short; the session treats it as advisory');
   }
   if(activity.audio!==undefined){
    const a=activity.audio;
    if(!obj(a)||typeof a.ref!=='string'||!audioRef.test(a.ref)||a.ref.includes('..'))err('AUDIO_REF',`${ap}.audio.ref`,'relative audio/<file>.(wav|m4a|ogg|opus) required');
    if(!obj(a)||typeof a.sha256!=='string'||!/^[0-9a-f]{64}$/.test(a.sha256))err('AUDIO_DIGEST',`${ap}.audio.sha256`);
   }
   if(kind==='listen')continue;
   evidence=true;
   if(kind==='choice'){
    const options=activity.options;
    if(!Array.isArray(options)||options.length<2||!options.every(o=>obj(o)&&typeof o.id==='string'&&text(o.text)))err('CHOICE_OPTIONS',`${ap}.options`);
    else{
     if(new Set(options.map(o=>(o as {id:string}).id)).size!==options.length)err('DUPLICATE_ID',`${ap}.options`);
     if(!options.some(o=>(o as {id:string}).id===activity.correctOptionId))err('CHOICE_ANSWER',`${ap}.correctOptionId`);
    }
    continue;
   }
   const accepted=activity.accepted,variants=activity.variants??[],patterns=activity.patterns??[];
   if(!Array.isArray(accepted)||!accepted.length||!accepted.every(text)){err('ACCEPTED_ANSWERS',`${ap}.accepted`);continue;}
   if(!Array.isArray(variants)||!variants.every(text))err('VARIANTS',`${ap}.variants`);
   if(!Array.isArray(patterns)||!patterns.every(p=>typeof p==='string'&&isAnswerPattern(p)))err('PATTERNS',`${ap}.patterns`);
   const all=[...accepted,...(Array.isArray(variants)?variants.filter(text):[])] as string[];
   const normalized=all.map(a=>normalizedUtterance(a,target));
   if(normalized.some(n=>!n))err('EMPTY_ANSWER',`${ap}.accepted`);
   if(new Set(normalized).size!==normalized.length)warn('DUPLICATE_ANSWER',`${ap}.accepted`);
   if(activity.model!==undefined&&!(text(activity.model)&&all.includes(activity.model)))err('MODEL_NOT_ACCEPTED',`${ap}.model`,'the model answer must be one of the accepted answers');
   // Coherence: every authored answer, said aloud and recognized verbatim, must be accepted by the evaluator
   // (e.g. an answer starting with a word the speech normalizer treats as a filler would not be).
   const key:AnswerKey={language:target,models:accepted as string[],variants:Array.isArray(variants)?variants.filter(text) as string[]:[],patterns:Array.isArray(patterns)?patterns.filter(p=>typeof p==='string'&&isAnswerPattern(p)) as string[]:[]};
   for(const answer of all)if(normalizedUtterance(answer,target)&&evaluateAnswer(key,answer,{kind:'speech',confidence:'high'}).outcome!=='correct')err('INCOHERENT_ANSWER',`${ap}.accepted`,answer);
  }
  if(!evidence)warn('NO_EVIDENCE_ACTIVITY',lp,'the lesson has no activity that checks learning');
 }
 for(const [id,prerequisites] of graph){
  for(const p of prerequisites){if(p===id)err('PREREQUISITE_CYCLE',id);else if(!lessonIds.has(p))err('PREREQUISITE_UNKNOWN',id,p);}
 }
 const visiting=new Set<string>(),visited=new Set<string>();
 const visit=(id:string):boolean=>{
  if(visiting.has(id))return true;if(visited.has(id))return false;
  visiting.add(id);const cyclic=(graph.get(id)??[]).some(p=>lessonIds.has(p)&&p!==id&&visit(p));visiting.delete(id);visited.add(id);return cyclic;
 };
 for(const id of graph.keys())if(visit(id)){err('PREREQUISITE_CYCLE',id);break;}
 return done(computed,lessonIds.size,activities,[...blockers].sort());
}

function finalize(base:Omit<LessonPackage,'contentSha256'>):LessonPackage{
 return {...base,contentSha256:lessonPackageDigest(base.lessons)};
}
const draftStatus={rights:{status:'original'} as PackageLesson['rights'],editorialStatus:'draft' as const,audioStatus:'audio-missing' as const,asrStatus:'asr-unvalidated' as const};
/** The built-in micro-course as a package. Statuses are honest: draft, no recorded audio, ASR not validated. */
export function lessonPackageFromCourse(target:TargetLanguage,version='0.1.0'):LessonPackage{
 const lessons:PackageLesson[]=lessonsFor(target).map(lesson=>({
  id:lesson.id,band:lesson.band,objective:{id:lesson.id,goal:lesson.goal},
  skills:['spoken-production','pronunciation','written-production'],prerequisites:lesson.prerequisite?[lesson.prerequisite]:[],
  activities:lesson.exercises.map(e=>({id:e.id,kind:e.type,prompt:{...(e.type==='listen'?{target:e.utterance}:{}),support:e.meaning},model:e.utterance,
   ...(e.type==='listen'?{responseModes:[] as PackageResponseMode[]}:{accepted:e.alternatives,...(e.acceptedVariants?{variants:e.acceptedVariants}:{}),...(e.acceptedPatterns?{patterns:e.acceptedPatterns}:{}),responseModes:['speech','typed'] as PackageResponseMode[]})})),
  ...draftStatus}));
 return finalize({format:lessonPackageFormat,schemaVersion:1,packageId:`voicefirst-course-${target.toLowerCase()}`,version,targetLanguage:target,variant:target,lessons});
}
export function lessonPackageFromDialogues(target:TargetLanguage,version='0.1.0'):LessonPackage{
 const lessons:PackageLesson[]=dialoguesFor(target).map(d=>({
  id:d.id,band:d.level,objective:{id:d.id,goal:d.label},skills:['spoken-interaction','written-production'],prerequisites:[],
  activities:d.turns.map(t=>({id:t.id,kind:'dialogue-turn' as const,prompt:{target:t.teacherCue,support:t.support},model:t.acceptedReplies[0]!,accepted:t.acceptedReplies,responseModes:['speech','typed'] as PackageResponseMode[]})),
  ...draftStatus}));
 return finalize({format:lessonPackageFormat,schemaVersion:1,packageId:`voicefirst-dialogues-${target.toLowerCase()}`,version,targetLanguage:target,variant:target,lessons});
}
