/** Curated number-listening seed. Not an ASR, phonetic scorer or complete dictionary.
 * All forms are authored; preserve regional variation and teach comprehension first.
 */
import type {TargetLanguage} from './types.js';
export type NumberContext='isolated'|'price'|'phone'|'time';
export interface NumberPrompt {value:number;target:TargetLanguage;written:string;alternatives:readonly string[];confusableWith:readonly number[];context:NumberContext}
const enUnits=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const enTens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const frUnits=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
const frTens:Record<number,string>={20:'vingt',30:'trente',40:'quarante',50:'cinquante',60:'soixante'};
export function numberWords(value:number,language:'en-CA'|'fr-CA'):string{
 if(!Number.isInteger(value)||value<0||value>99)throw new RangeError('Number seed supports integers 0..99');
 if(language==='en-CA'){
  if(value<20)return enUnits[value]!;
  const tens=enTens[Math.floor(value/10)]!;
  return value%10===0?tens:tens+'-'+enUnits[value%10];
 }
 if(value<=16)return frUnits[value]!;
 if(value<20)return 'dix-'+frUnits[value-10];
 if(value<70){
  const decade=Math.floor(value/10)*10,unit=value%10,stem=frTens[decade]!;
  if(unit===0)return stem;
  if(unit===1)return stem+' et un';
  return stem+'-'+numberWords(unit,'fr-CA');
 }
 if(value<80){
  if(value===71)return 'soixante et onze';
  return 'soixante-'+numberWords(value-60,'fr-CA');
 }
 if(value===80)return 'quatre-vingts';
 return 'quatre-vingt-'+numberWords(value-80,'fr-CA');
}
export function numberListeningPrompt(value:number,target:'en-CA'|'fr-CA',context:NumberContext='isolated'):NumberPrompt{
 const written=numberWords(value,target);
 const confusableWith=target==='en-CA'
  ?({13:[30],14:[40],15:[50],16:[60],17:[70],18:[80],19:[90],30:[13],40:[14],50:[15],60:[16],70:[17],80:[18],90:[19]} as Record<number,number[]>)[value]??[]
  : value>=70?[value>=80?value-20:value-60].filter(x=>x!==value):[];
 return {value,target,written,alternatives:[written,String(value)],confusableWith,context};
}
/** Do not grade a speaker's accent from text matching. Only normalize written answer. */
export function checkNumberAnswer(answer:string,expected:number):'match'|'retry'|'uncertain'{
 if(!answer.trim())return 'uncertain';
 const cleaned=answer.trim().replace(/[\s,]/g,'');
 return /^\d+$/.test(cleaned)&&Number(cleaned)===expected?'match':'retry';
}
