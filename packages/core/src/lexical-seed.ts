/** Small authored lexical seed for deterministic offline tutoring.
 * Original phrases only. Not a comprehensive dictionary or a CEFR certification.
 * Semantic roles and situations are owned by the curriculum, not an LLM.
 */
import type {TargetLanguage} from './types.js';
export type LexicalIntent='greeting'|'request-help'|'request-water'|'express-gratitude';
export interface LexicalEntry{
 id:string;locale:TargetLanguage;intent:LexicalIntent;situation:'daily-life'|'restaurant';
 canonical:string;alternatives:readonly string[];register:'neutral'|'polite';
}
export const lexicalSeed:readonly LexicalEntry[]=[
 {id:'en-greet',locale:'en-CA',intent:'greeting',situation:'daily-life',canonical:'Hello',alternatives:['Hi','Good morning'],register:'neutral'},
 {id:'fr-greet',locale:'fr-CA',intent:'greeting',situation:'daily-life',canonical:'Bonjour',alternatives:['Salut','Allô'],register:'neutral'},
 {id:'es-greet',locale:'es',intent:'greeting',situation:'daily-life',canonical:'Hola',alternatives:['Buenos días','Buenas tardes'],register:'neutral'},
 {id:'pt-greet',locale:'pt-BR',intent:'greeting',situation:'daily-life',canonical:'Olá',alternatives:['Oi','Bom dia'],register:'neutral'},
 {id:'de-greet',locale:'de',intent:'greeting',situation:'daily-life',canonical:'Hallo',alternatives:['Guten Morgen','Guten Tag'],register:'neutral'},
 {id:'it-greet',locale:'it',intent:'greeting',situation:'daily-life',canonical:'Ciao',alternatives:['Buongiorno','Salve'],register:'neutral'},
 {id:'en-water',locale:'en-CA',intent:'request-water',situation:'restaurant',canonical:'Could I have some water, please?',alternatives:['Can I have some water, please?','May I have some water?'],register:'polite'},
 {id:'fr-water',locale:'fr-CA',intent:'request-water',situation:'restaurant',canonical:"Est-ce que je pourrais avoir de l'eau, s'il vous plaît ?",alternatives:["Je voudrais de l'eau, s'il vous plaît.","Puis-je avoir de l'eau ?"],register:'polite'},
 {id:'es-water',locale:'es',intent:'request-water',situation:'restaurant',canonical:'¿Me puede traer agua, por favor?',alternatives:['Quisiera agua, por favor.','¿Me da agua, por favor?'],register:'polite'},
 {id:'pt-water',locale:'pt-BR',intent:'request-water',situation:'restaurant',canonical:'Pode me trazer água, por favor?',alternatives:['Eu gostaria de água, por favor.','Pode me dar água?'],register:'polite'},
 {id:'de-water',locale:'de',intent:'request-water',situation:'restaurant',canonical:'Könnte ich bitte Wasser bekommen?',alternatives:['Ich hätte gern Wasser, bitte.','Kann ich bitte Wasser haben?'],register:'polite'},
 {id:'it-water',locale:'it',intent:'request-water',situation:'restaurant',canonical:"Potrei avere dell'acqua, per favore?",alternatives:["Vorrei dell'acqua, per favore.","Mi può portare dell'acqua?"],register:'polite'},
];
const normalize=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim();
export function findAuthoredLexicalMatch(locale:TargetLanguage,utterance:string):LexicalEntry|undefined{
 const target=normalize(utterance);
 if(!target)return undefined;
 return lexicalSeed.find(entry=>entry.locale===locale&&[entry.canonical,...entry.alternatives].some(v=>normalize(v)===target));
}
export function authoredPhrasesForIntent(locale:TargetLanguage,intent:LexicalIntent):readonly string[]{
 return lexicalSeed.filter(entry=>entry.locale===locale&&entry.intent===intent).flatMap(entry=>[entry.canonical,...entry.alternatives]);
}
