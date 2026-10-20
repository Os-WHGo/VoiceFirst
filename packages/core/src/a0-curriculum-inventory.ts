/** Inventory Meta A0 curriculum units without treating them as scored lessons. */
import {targetLanguages,type TargetLanguage} from './types.js';
type Dict=Record<string,unknown>;
const obj=(x:unknown):x is Dict=>!!x&&typeof x==='object'&&!Array.isArray(x);
export interface A0CurriculumUnitSummary {unitId:string;conceptId:string;targetLanguage:TargetLanguage;hasAuthoredVocabulary:boolean;hasRecordedAudio:false}
export interface A0CurriculumInventory {units:A0CurriculumUnitSummary[];issues:{path:string;code:string}[];publishable:false;interactiveLessonsReady:0}
export function inventoryA0Curriculum(input:unknown):A0CurriculumInventory {
 const result:A0CurriculumInventory={units:[],issues:[],publishable:false,interactiveLessonsReady:0};
 if(!obj(input)||!Array.isArray(input.units)){result.issues.push({path:'$',code:'INVALID_ROOT'});return result;}
 const ids=new Set<string>();
 for(const [index,unit] of input.units.entries()){
  const path='units['+index+']';
  if(!obj(unit)||typeof unit.unit_id!=='string'||!unit.unit_id||typeof unit.concept_id!=='string'||!unit.concept_id||!targetLanguages.includes(unit.target_language as TargetLanguage)||unit.level!=='A0'){
   result.issues.push({path,code:'INVALID_UNIT'});continue;
  }
  if(ids.has(unit.unit_id)){result.issues.push({path,code:'DUPLICATE_UNIT'});continue;}
  ids.add(unit.unit_id);
  if(!obj(unit.skills)||!obj(unit.skills.listening)||unit.skills.listening.audio_status!=='not_recorded'){
   result.issues.push({path,code:'UNVERIFIED_AUDIO_STATUS'});continue;
  }
  result.units.push({unitId:unit.unit_id,conceptId:unit.concept_id,targetLanguage:unit.target_language as TargetLanguage,hasAuthoredVocabulary:Array.isArray(unit.vocabulary)&&unit.vocabulary.length>0,hasRecordedAudio:false});
 }
 return result;
}
