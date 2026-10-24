/** Local, per-skill practice evidence. Counts are NOT CEFR or exam scores. */
import {targetLanguages,type TargetLanguage} from './types.js';
export type LearningSkillAxis='listening'|'speaking'|'reading'|'writing';
export type EvidenceKind='completed'|'attempted'|'uncertain';
export interface SkillEvidence {attempted:number;completed:number;uncertain:number}
export interface SkillRecord {version:1;language:TargetLanguage;skills:Record<LearningSkillAxis,SkillEvidence>}
const empty=():SkillEvidence=>({attempted:0,completed:0,uncertain:0});
export function newSkillRecord(language:TargetLanguage):SkillRecord{
 if(!targetLanguages.includes(language))throw Error('Unsupported language');
 return {version:1,language,skills:{listening:empty(),speaking:empty(),reading:empty(),writing:empty()}};
}
export function recordSkillEvidence(record:SkillRecord,skill:LearningSkillAxis,kind:EvidenceKind):SkillRecord{
 if(!['listening','speaking','reading','writing'].includes(skill)||!['completed','attempted','uncertain'].includes(kind))throw Error('Invalid evidence');
 const prev=record.skills[skill];if(!prev)throw Error('Invalid skill record');
 const next={...prev,attempted:prev.attempted+1,completed:prev.completed+(kind==='completed'?1:0),uncertain:prev.uncertain+(kind==='uncertain'?1:0)};
 return {...record,skills:{...record.skills,[skill]:next}};
}
export function skillRecordFromJSON(raw:string,language:TargetLanguage):SkillRecord|null{
 if(raw.length>4096||!targetLanguages.includes(language))return null;
 try{
  const v:unknown=JSON.parse(raw);
  if(!v||typeof v!=='object')return null;
  const r=v as Partial<SkillRecord>;
  if(r.version!==1||r.language!==language||!r.skills||typeof r.skills!=='object')return null;
  for(const skill of ['listening','speaking','reading','writing'] as const){
   const x=r.skills[skill];
   if(!x||!Number.isSafeInteger(x.attempted)||!Number.isSafeInteger(x.completed)||!Number.isSafeInteger(x.uncertain)||x.attempted<0||x.completed<0||x.uncertain<0||x.completed+x.uncertain>x.attempted)return null;
  }
  return {version:1,language,skills:Object.fromEntries((['listening','speaking','reading','writing'] as const).map(k=>[k,{...r.skills![k]}])) as SkillRecord['skills']};
 }catch{return null;}
}
