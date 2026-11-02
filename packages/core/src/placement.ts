/** Optional, offline, non-certifying placement preview using original course exercises. */
import {targetLanguages,type TargetLanguage} from './types.js';
import {lessonsFor,normalizedUtterance,type CourseExercise} from './course.js';
export type PlacementSkill='comprehension'|'production'|'recall';
export interface PlacementItem {id:string;language:TargetLanguage;skill:PlacementSkill;prompt:string;accepted:readonly string[];lessonId:string}
export type PlacementAnswer={itemId:string;response:string;kind:'answered'|'skip'|'uncertain'};
export interface PlacementResult {language:TargetLanguage;answered:number;correct:number;uncertain:number;skipped:number;recommendedLessonId:string;skillScores:Readonly<Record<PlacementSkill,{correct:number;attempted:number}>>;provisional:true;certification:false}
const skillFor=(e:CourseExercise):PlacementSkill=>e.type==='listen'?'comprehension':e.type==='repeat'?'production':'recall';
/** A small optional sample across the existing authored sequence, no microphone required. */
export function placementItems(language:TargetLanguage,limit=6):PlacementItem[]{
 if(!targetLanguages.includes(language))throw new Error('Unsupported target language');
 if(!Number.isInteger(limit)||limit<1||limit>12)throw new Error('Invalid placement length');
 const lessons=lessonsFor(language);
 return lessons.slice(0,limit).map((lesson,i)=>{
  const exercise=lesson.exercises.find(e=>e.type===(['listen','repeat','recall'][i%3]))!;
  return {id:exercise.id,language,skill:skillFor(exercise),prompt:exercise.meaning[language],accepted:exercise.alternatives,lessonId:lesson.id};
 });
}
/** Unanswered/uncertain items never count as mistakes; do not grant formal CEFR levels. */
export function scorePlacement(language:TargetLanguage,answers:readonly PlacementAnswer[],limit=6):PlacementResult{
 const items=placementItems(language,limit);
 const ids=new Set(items.map(x=>x.id));
 if(answers.some(a=>!ids.has(a.itemId))||new Set(answers.map(a=>a.itemId)).size!==answers.length)throw new Error('Invalid placement answers');
 const skills:Record<PlacementSkill,{correct:number;attempted:number}>={comprehension:{correct:0,attempted:0},production:{correct:0,attempted:0},recall:{correct:0,attempted:0}};
 let correct=0,answered=0,uncertain=0,skipped=0,firstGap=items.length;
 for(let i=0;i<items.length;i++){
  const item=items[i]!,answer=answers.find(a=>a.itemId===item.id);
  if(!answer||answer.kind==='skip'){skipped++;if(firstGap===items.length)firstGap=i;continue;}
  if(answer.kind==='uncertain'){uncertain++;if(firstGap===items.length)firstGap=i;continue;}
  answered++;skills[item.skill].attempted++;
  const valid=item.accepted.some(a=>normalizedUtterance(a,language)===normalizedUtterance(answer.response,language));
  if(valid){correct++;skills[item.skill].correct++;}else if(firstGap===items.length)firstGap=i;
 }
 return {language,answered,correct,uncertain,skipped,recommendedLessonId:firstGap===items.length?(lessonsFor(language)[Math.min(limit,lessonsFor(language).length-1)]?.id??items[items.length-1]!.lessonId):items[firstGap]!.lessonId,skillScores:skills,provisional:true,certification:false};
}
