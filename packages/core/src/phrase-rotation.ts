/** Deterministic offline practice variation, inspired by reusable corpus patterns. */
import {authoredPhrasesForIntent,type LexicalIntent} from './lexical-seed.js';
import type {TargetLanguage} from './types.js';
export function selectPracticePhrase(locale:TargetLanguage,intent:LexicalIntent,attempt:number):string|undefined{
 const phrases=authoredPhrasesForIntent(locale,intent);
 if(!Number.isSafeInteger(attempt)||attempt<0||phrases.length===0)return undefined;
 return phrases[attempt%phrases.length];
}
