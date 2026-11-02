/** Authored answer patterns with a personal-detail slot, e.g. "My name is {name}.".
 * The slot accepts one to three words; the captured words are never returned or stored.
 */
export const answerSlot='{name}';
export const maxSlotWords=3;
export function isAnswerPattern(pattern:string):boolean{
 const parts=pattern.split(answerSlot);
 return parts.length===2&&!/[{}]/.test(parts[0]!+parts[1]!);
}
/** `normalize` must map text to space-separated tokens; the same function is applied to both sides. */
export function matchesAnswerPattern(pattern:string,response:string,normalize:(text:string)=>string):boolean{
 if(!isAnswerPattern(pattern))return false;
 const [before,after]=pattern.split(answerSlot).map(part=>normalize(part).split(' ').filter(Boolean)) as [string[],string[]];
 const words=normalize(response).split(' ').filter(Boolean);
 const slot=words.length-before.length-after.length;
 if(slot<1||slot>maxSlotWords)return false;
 return before.every((w,i)=>words[i]===w)&&after.every((w,i)=>words[before.length+slot+i]===w);
}
