/** Adapt DeepSeek PT-BR A1/A2 structure for review only. No learner-facing content. */
import {auditExternalCurriculumCandidate} from './external-curriculum-audit.js';
import {catalogueExternalCurriculum} from './external-curriculum-catalog.js';
const required=['listening','speaking','reading','writing','interaction','mediation'] as const;
export function inspectPortugueseCandidate(curriculum:unknown,dialogues?:unknown){
 const errors:string[]=[];
 const doc=curriculum&&typeof curriculum==='object'&&!Array.isArray(curriculum)?curriculum as {meta?:{language?:unknown;editorial_status?:unknown};units?:unknown}:null;
 if(doc?.meta?.language!=='pt-BR')errors.push('Expected pt-BR metadata');
 if(doc?.meta?.editorial_status!=='not-human-reviewed')errors.push('Unreviewed editorial status required');
 if(!Array.isArray(doc?.units))errors.push('Missing units array');
 const units=Array.isArray(doc?.units)?doc.units:[];
 const normalized=units.map((item:unknown)=>{
  const u=item&&typeof item==='object'&&!Array.isArray(item)?item as {id?:unknown;level?:unknown;activities?:unknown;editorial_status?:unknown}:{};
  if(u.editorial_status!=='not-human-reviewed')errors.push('Unreviewed unit status required '+String(u.id));
  const activities=u.activities&&typeof u.activities==='object'&&!Array.isArray(u.activities)?u.activities as Record<string,unknown>:{};
  for(const skill of required)if(!Array.isArray(activities[skill])||!(activities[skill] as unknown[]).length)errors.push('Missing activities '+String(u.id)+'/'+skill);
  return {id:u.id,unitId:u.id,level:u.level,targetLanguage:'pt-BR',skills:Object.fromEntries(required.map(s=>[s,activities[s]])),status:{publishable:false}};
 });
 const audit=auditExternalCurriculumCandidate({metadata:{language:'pt-BR'},units:normalized});
 errors.push(...audit.errors);
 const dialogueDoc=dialogues&&typeof dialogues==='object'&&!Array.isArray(dialogues)?dialogues as {meta?:{language?:unknown;editorial_status?:unknown};dialogues?:unknown}:null;
 if(dialogues!==undefined){
  if(dialogueDoc?.meta?.language!=='pt-BR'||dialogueDoc?.meta?.editorial_status!=='not-human-reviewed')errors.push('Invalid dialogue metadata');
  if(!Array.isArray(dialogueDoc?.dialogues))errors.push('Missing dialogues array');
  const ids=new Set(units.map((u:unknown)=>u&&typeof u==='object'?(u as {id?:unknown}).id:undefined));
  const vocab=new Set(units.flatMap((u:unknown)=>u&&typeof u==='object'&&Array.isArray((u as {vocabulary?:unknown}).vocabulary)?((u as {vocabulary:{id?:unknown}[]}).vocabulary).map(v=>v.id):[]));
  const seen=new Set<string>();
  for(const d of Array.isArray(dialogueDoc?.dialogues)?dialogueDoc.dialogues:[]){
   if(!d||typeof d!=='object'){errors.push('Invalid dialogue');continue;}
   const x=d as {id?:unknown;unit_ref?:unknown;vocabulary_refs?:unknown;editorial_status?:unknown};
   if(typeof x.id!=='string'||seen.has(x.id))errors.push('Invalid or duplicate dialogue ID '+String(x.id));
   if(typeof x.id==='string')seen.add(x.id);
   if(!ids.has(x.unit_ref))errors.push('Unknown dialogue unit '+String(x.id));
   if(!Array.isArray(x.vocabulary_refs)||x.vocabulary_refs.some(v=>!vocab.has(v)))errors.push('Unknown vocabulary reference '+String(x.id));
   if(x.editorial_status!=='not-human-reviewed')errors.push('Dialogue editorial status '+String(x.id));
  }
 }
 const catalog=catalogueExternalCurriculum({metadata:{language:'pt-BR'},units:normalized});
 return {acceptedForReview:errors.length===0&&audit.acceptedForReview,unitCount:units.length,dialogueCount:Array.isArray(dialogueDoc?.dialogues)?dialogueDoc.dialogues.length:0,entries:errors.length===0?catalog.entries:[],errors,readyForPublicRelease:false as const};
}
