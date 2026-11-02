/** Immediate, offline-first practice drawn only from the original course catalog. */
import {targetLanguages,type TargetLanguage} from './types.js';
import {lessonsFor,type CourseExercise} from './course.js';
export type UrgentSituation='emergency'|'allergy'|'payment'|'transport'|'request-help';
export interface SituationPractice {language:TargetLanguage;situation:UrgentSituation;lessonId:string;phrase:string;alternatives:readonly string[];exerciseId:string;offline:true;certification:false}
export function situationPractice(language:TargetLanguage,situation:UrgentSituation):SituationPractice|null {
 if(!targetLanguages.includes(language))throw new Error('Unsupported language');
 const lesson=lessonsFor(language).find(l=>l.focusTag===situation);
 if(!lesson)return null;
 const exercise:CourseExercise|undefined=lesson.exercises.find(e=>e.type==='recall');
 if(!exercise)return null;
 return {language,situation,lessonId:lesson.id,phrase:exercise.utterance,alternatives:exercise.alternatives,exerciseId:exercise.id,offline:true,certification:false};
}
export function availableSituations(language:TargetLanguage):SituationPractice[]{
 return (['emergency','allergy','payment','transport','request-help'] as const).map(s=>situationPractice(language,s)).filter((x):x is SituationPractice=>x!==null);
}
