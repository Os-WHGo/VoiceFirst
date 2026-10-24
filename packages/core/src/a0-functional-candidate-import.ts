/** Validates authored A0 single-choice lesson candidates without granting publication. */
import {targetLanguages,type TargetLanguage} from './types.js';
type Dict=Record<string,unknown>;
const record=(v:unknown):v is Dict=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const nonempty=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
export interface A0Choice {id:string;text:string}
export interface A0LessonCandidate {
 lessonId:string;conceptId:string;targetLanguage:TargetLanguage;sequence:number;
 prerequisites:string[];skill:'reading';contextByKnownLanguage:Record<string,string>;
 promptByKnownLanguage:Record<string,string>;options:A0Choice[];correctOptionId:string;
 publishable:false;humanReviewRequired:true;
}
export interface A0ImportResult {lessons:A0LessonCandidate[];issues:{path:string;code:string}[];readyForPublicRelease:false}
/** Import only explicit answers and instructions; do not invent missing translations. */
export function importA0FunctionalCandidates(input:unknown):A0ImportResult {
 const out:A0ImportResult={lessons:[],issues:[],readyForPublicRelease:false};
 const fail=(path:string,code:string)=>out.issues.push({path,code});
 if(!record(input)||input.schema_version!=='voicefirst.lesson-candidate.v0.2'||!Array.isArray(input.lessons)){
  fail('$','INVALID_ROOT');return out;
 }
 const ids=new Set<string>();
 for(const [i,raw] of input.lessons.entries()){
  const path='lessons['+i+']';
  if(!record(raw)||!record(raw.activity)||!nonempty(raw.lesson_id)||!nonempty(raw.concept_id)||!targetLanguages.includes(raw.target_language as TargetLanguage)||!Number.isInteger(raw.sequence)||Number(raw.sequence)<1||!Array.isArray(raw.prerequisites)||raw.prerequisites.some(x=>!nonempty(x))||raw.editorial_status!=='candidate'||raw.publishable!==false||raw.human_review_required!==true){
   fail(path,'INVALID_LESSON');continue;
  }
  if(ids.has(raw.lesson_id)){fail(path,'DUPLICATE_ID');continue;}ids.add(raw.lesson_id);
  const a=raw.activity;
  if(a.type!=='single_choice'||a.skill!=='reading'||a.audio_required!==false||a.text_fallback!==true||!record(a.context_by_known_language)||!record(a.prompt_by_known_language)||!Array.isArray(a.options)||a.options.length<2||!Array.isArray(a.correct_option_ids)||a.correct_option_ids.length!==1||!record(a.assessment)||a.assessment.scoring!=='exact_match'){
   fail(path,'INVALID_ACTIVITY');continue;
  }
  const needed=targetLanguages.filter(lang=>lang!==raw.target_language);
  if(needed.some(lang=>!nonempty((a.context_by_known_language as Dict)[lang])||!nonempty((a.prompt_by_known_language as Dict)[lang]))){
   fail(path,'MISSING_LOCALIZATION');continue;
  }
  const options:A0Choice[]=[];
  for(const item of a.options){if(!record(item)||!nonempty(item.id)||!nonempty(item.text)){break;}options.push({id:item.id,text:item.text});}
  const correct=a.correct_option_ids[0];
  if(options.length!==a.options.length||new Set(options.map(x=>x.id)).size!==options.length||!nonempty(correct)||!options.some(x=>x.id===correct)){
   fail(path,'INVALID_ANSWER');continue;
  }
  out.lessons.push({lessonId:raw.lesson_id,conceptId:raw.concept_id,targetLanguage:raw.target_language as TargetLanguage,sequence:raw.sequence as number,
   prerequisites:raw.prerequisites as string[],skill:'reading',
   contextByKnownLanguage:Object.fromEntries(needed.map(lang=>[lang,(a.context_by_known_language as Dict)[lang] as string])),
   promptByKnownLanguage:Object.fromEntries(needed.map(lang=>[lang,(a.prompt_by_known_language as Dict)[lang] as string])),
   options,correctOptionId:correct,publishable:false,humanReviewRequired:true});
 }
 return out;
}
