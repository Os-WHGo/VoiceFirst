/** VoiceFirst curated offline course foundation. All exercise utterances below are original.
 * No LLM/API calls are made here. Not an accredited CEFR curriculum.
 */
import { targetLanguages, type TargetLanguage } from './types.js';
import { extendedOfflineLessons } from './extended-course.js';

export type CourseStage = 'listen' | 'repeat' | 'recall' | 'checkpoint';
export type RecognitionConfidence = 'high' | 'low' | 'unknown';
export type Evidence = 'not-observed' | 'recognized-phrase' | 'manual-confirmed';
export interface LocalizedText { 'en-CA': string; 'fr-CA': string; es: string; 'pt-BR': string; de: string; it: string }
export interface CourseExercise {
  id: string;
  type: CourseStage;
  utterance: string;
  alternatives: readonly string[];
  /** Understanding/utterance, not acoustic pronunciation; a local ASR port may supply a transcript. */
  meaning: LocalizedText;
}
export interface OfflineLesson {
  id: string;
  language: TargetLanguage;
  band: 'A0'|'A1';
  goal: LocalizedText;
  context: string;
  exercises: readonly CourseExercise[];
  prerequisite?: string;
  focusTag: string;
  attribution: 'original';
}
export type Evaluation = { kind: 'match'; recognized: string } | { kind: 'retry'; hint: string } | { kind: 'uncertain'; hint: string };
export interface CourseProgress {
  language: TargetLanguage;
  completed: readonly string[];
  attempts: Readonly<Record<string, number>>;
  /** Number of confidently transcribed independent correct attempts. */
  correct: Readonly<Record<string, number>>;
  due: Readonly<Record<string, string>>;
}

const T = (en: string, fr: string, es: string, pt: string, de: string, it: string): LocalizedText =>
  ({ 'en-CA': en, 'fr-CA': fr, es, 'pt-BR': pt, de, it });
const goals = {
  greet: T('Greet someone naturally', 'Saluer quelqu’un naturellement', 'Saludar con naturalidad', 'Cumprimentar alguém', 'Jemanden begrüßen', 'Salutare qualcuno'),
  help: T('Ask a person for help', 'Demander de l’aide à quelqu’un', 'Pedir ayuda a alguien', 'Pedir ajuda a alguém', 'Um Hilfe bitten', 'Chiedere aiuto'),
};
const meanings = {
  greet: T('Hello', 'Bonjour', 'Hola', 'Olá', 'Hallo', 'Ciao'),
  help: T('Can you help me?', 'Est-ce que tu peux m’aider ?', '¿Me puedes ayudar?', 'Você pode me ajudar?', 'Kannst du mir helfen?', 'Mi puoi aiutare?'),
};
const originals: Record<TargetLanguage, {greet: readonly string[]; help: readonly string[]}> = {
  'en-CA': {greet:['Hello!','Hi!'], help:['Can you help me?', 'Could you give me a hand?']},
  'fr-CA': {greet:['Bonjour!','Salut!'], help:['Est-ce que tu peux m’aider ?', 'Peux-tu m’aider ?']},
  es: {greet:['¡Hola!', 'Buenos días.'], help:['¿Me puedes ayudar?', '¿Podrías ayudarme?']},
  'pt-BR': {greet:['Olá!', 'Oi!'], help:['Você pode me ajudar?', 'Pode me dar uma mão?']},
  de: {greet:['Hallo!', 'Guten Tag!'], help:['Kannst du mir helfen?', 'Können Sie mir helfen?']},
  it: {greet:['Ciao!', 'Buongiorno!'], help:['Mi puoi aiutare?', 'Puoi darmi una mano?']},
};
/** Two foundation micro-lessons per language; additional authored lessons are imported above. */
export const offlineLessons: readonly OfflineLesson[] = targetLanguages.flatMap(language => {
  const phrases = originals[language];
  function exercise(stage: CourseStage, topic: 'greet' | 'help', index: number): CourseExercise {
    const alternatives = phrases[topic];
    return { id:`${language}-${topic}-${stage}-${index}`, type:stage, utterance:alternatives[0]!, alternatives, meaning:meanings[topic] };
  }
  return [
    { id:`${language}-a0-greeting`, language, band:'A0', goal:goals.greet, context:'A short first meeting', focusTag:'greeting', attribution:'original' as const,
      exercises:[exercise('listen','greet',1), exercise('repeat','greet',2), exercise('recall','greet',3), exercise('checkpoint','greet',4)] },
    { id:`${language}-a1-help`, language, band:'A1', goal:goals.help, context:'Ask a coworker for assistance', focusTag:'request-help', prerequisite:`${language}-a0-greeting`, attribution:'original' as const,
      exercises:[exercise('listen','help',1), exercise('repeat','help',2), exercise('recall','help',3), exercise('checkpoint','help',4)] }
  ];
});
export function lessonsFor(target: TargetLanguage) {return [...offlineLessons,...extendedOfflineLessons].filter(l=>l.language===target);}
export function newCourseProgress(language: TargetLanguage): CourseProgress {return {language,completed:[],attempts:{},correct:{},due:{}};}
export function availableLessons(progress: CourseProgress): OfflineLesson[] {return lessonsFor(progress.language).filter(l=>!l.prerequisite || progress.completed.includes(l.prerequisite));}
/** A transcript matcher, NOT a pronunciation or CEFR assessment. Real ASR uncertainty must not count as failure. */
export function normalizedUtterance(input:string, language:TargetLanguage): string {
  const locale = language === 'en-CA' ? 'en' : language === 'fr-CA' ? 'fr' : language;
  return input.toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').trim().replace(/\s+/g,' ');
}
export function checkUtterance(exercise:CourseExercise, spoken:string, language:TargetLanguage, confidence:RecognitionConfidence):Evaluation {
  if(confidence!=='high' || !spoken.trim())return {kind:'uncertain',hint:'Audio uncertain. Repeat when ready, or skip without penalty.'};
  const normalized=normalizedUtterance(spoken,language);
  const exact=exercise.alternatives.some(a=>normalizedUtterance(a,language)===normalized);
  return exact ? {kind:'match',recognized:spoken} : {kind:'retry',hint:'Try the example again, or ask to hear it more slowly.'};
}
/** Two independent successful recalls including a checkpoint, with unlimited time and no negative streaks. */
export function recordCourseAttempt(progress:CourseProgress, exercise:CourseExercise, result:Evaluation, todayISO:string):CourseProgress {
  if(result.kind==='uncertain') return progress;
  const attempts={...progress.attempts,[exercise.id]:(progress.attempts[exercise.id]||0)+1};
  const correct={...progress.correct,[exercise.id]:(progress.correct[exercise.id]||0)+(result.kind==='match'?1:0)};
  // Due next day for known answer; retrying is voluntary, not forced.
  const due={...progress.due};
  if(result.kind==='match')due[exercise.id]=new Date(Date.parse(`${todayISO}T00:00:00Z`)+86400000).toISOString().slice(0,10);
  return {...progress,attempts,correct,due};
}
export function finishLesson(progress:CourseProgress,lesson:OfflineLesson):CourseProgress {
  if(lesson.language!==progress.language)throw new Error('Language mismatch');
  if(lesson.prerequisite&&!progress.completed.includes(lesson.prerequisite))return progress;
  const recall=lesson.exercises.find(e=>e.type==='recall');
  const checkpoint=lesson.exercises.find(e=>e.type==='checkpoint');
  if(!recall||!checkpoint||(progress.correct[recall.id]??0)<1||(progress.correct[checkpoint.id]??0)<1) return progress;
  return {...progress, completed:[...new Set([...progress.completed,lesson.id]) ]};
}
export function nextAudioStep(lesson:OfflineLesson,index:number,native:TargetLanguage): {speech:string;language:TargetLanguage;kind:CourseStage} | null {
  const item=lesson.exercises[index];if(!item)return null;
  // Listen stage is target speech; following stages can ask for a repeat using target-language example.
  return {speech:item.utterance, language:lesson.language, kind:item.type};
}
