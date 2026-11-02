/** Editorial-only A1 listening availability derived from verified local bytes.
 * This is not a public-release or player permission gate.
 */
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
import type {A1AudioLocalAudit} from './a1-audio-local-audit.js';
export interface A1ListeningAvailability {
 targetLanguage:string;unitId:string;required:readonly string[];
 verifiedCount:number;editorialPreviewAvailable:boolean;publicPlaybackAvailable:false;
}
export function a1ListeningAvailability(audit:A1AudioLocalAudit):readonly A1ListeningAvailability[]{
 const expected=a1EditorialDrafts.flatMap(unit=>['dialogue-first','dialogue-second'].map(role=>[unit.targetLanguage,unit.unitId,role].join('/')));
 const missing=new Set(audit.missing);
 const inventoryConsistent=audit.expected===expected.length&&
  Number.isSafeInteger(audit.verified)&&audit.verified>=0&&
  missing.size===audit.missing.length&&
  audit.verified+missing.size===expected.length&&
  [...missing].every(id=>expected.includes(id))&&
  audit.rejected.length===0;
 const verified=new Set(inventoryConsistent?expected.filter(id=>!missing.has(id)):[]);
 const rejected=new Set(audit.rejected.map(item=>item.id));
 return a1EditorialDrafts.map(unit=>{
  const required=['dialogue-first','dialogue-second'].map(role=>[unit.targetLanguage,unit.unitId,role].join('/'));
  const verifiedCount=required.filter(id=>verified.has(id)&&!rejected.has(id)).length;
  return {targetLanguage:unit.targetLanguage,unitId:unit.unitId,required,verifiedCount,
   editorialPreviewAvailable:verifiedCount===2&&inventoryConsistent,
   publicPlaybackAvailable:false};
 });
}
