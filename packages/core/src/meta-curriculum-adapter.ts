/** Pure adapter for Meta AI candidate JSON. Never authorizes publishing or installs content. */
import {type SharedConcept,type TargetLanguageUnit,type KnownLanguageSupport} from './reusable-curriculum.js';
import {type TargetLanguage,targetLanguages} from './types.js';
export interface MetaAdaptationIssue {code:string; path:string; detail:string}
export interface MetaAdaptationResult {concepts:SharedConcept[];units:TargetLanguageUnit[];supports:KnownLanguageSupport[];issues:MetaAdaptationIssue[];readyForPublicRelease:false}
const rec=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const str=(x:unknown):string=>typeof x==='string'?x.trim():'';
const levels=new Set(['A0','A1','A2','B1','B2','C1','C2']);
const skills=['listening','speaking','reading','writing','interaction','mediation'] as const;
/** Preserves Meta unit identity and reports missing resources rather than fabricating them. */
export function adaptMetaCurriculumCandidate(targetLanguage:TargetLanguage,curriculum:unknown,dialogues:unknown,supportLocales:unknown):MetaAdaptationResult {
 const result:MetaAdaptationResult={concepts:[],units:[],supports:[],issues:[],readyForPublicRelease:false};
 const issue=(code:string,path:string,detail:string)=>result.issues.push({code,path,detail});
 if(!targetLanguages.includes(targetLanguage)||!rec(curriculum)||!Array.isArray(curriculum.units)||!rec(dialogues)||!Array.isArray(dialogues.dialogues)||!rec(supportLocales)||!rec(supportLocales.translations)){
  issue('INVALID_ROOT','$','Expected consolidated curriculum.units, dialogues.dialogues, supportLocales.translations');return result;
 }
 const byUnit=new Map<string,string[]>();
 for(const [i,d] of dialogues.dialogues.entries()){
  if(!rec(d)||!str(d.unitId)){issue('INVALID_DIALOGUE',`dialogues.dialogues[${i}]`,'Missing unitId');continue;}
  const turns=d.lines??d.dialogue??d.turns;
  if(!Array.isArray(turns)||!turns.length||turns.some(t=>!rec(t)||!str(t.text))){issue('INVALID_DIALOGUE',`dialogues.dialogues[${i}]`,'Missing dialogue turns');continue;}
  byUnit.set(str(d.unitId),[...(byUnit.get(str(d.unitId))??[]),...turns.map(t=>str(t.text))]);
 }
 const translations=supportLocales.translations;
 const seen=new Set<string>();
 for(const [i,u] of curriculum.units.entries()){
  const path=`curriculum.units[${i}]`;
  if(!rec(u)||!str(u.id)||!levels.has(str(u.level))||!Array.isArray(u.objectives)||!u.objectives.length||!rec(u.skills)||!skills.every(s=>rec((u.skills as Record<string,unknown>)[s]))){issue('INVALID_UNIT',path,'Missing ID, level, objectives or six skills');continue;}
  const id=str(u.id),conceptId=`meta:${id}`;
  if(seen.has(id)){issue('DUPLICATE_UNIT',path,id);continue;}seen.add(id);
  const vocab=Array.isArray(u.vocabulary)?u.vocabulary.map(v=>rec(v)?str(v.lemma):'').filter(Boolean):[];
  const lines=byUnit.get(id)??[];
  if(!vocab.length||!lines.length){issue('INCOMPLETE_UNIT',path,`Missing vocabulary or dialogues for ${id}`);continue;}
  result.concepts.push({id:conceptId,level:u.level as SharedConcept['level'],goal:u.objectives.map(str).filter(Boolean).join('; '),prerequisites:[],skills:[...skills]});
  result.units.push({conceptId,targetLanguage,dialogue:lines,vocabulary:vocab,editorialStatus:'candidate',rightsCleared:false,audioReviewed:false});
  for(const knownLanguage of targetLanguages){
   if(knownLanguage===targetLanguage)continue;
   let value:unknown;
   if(rec(translations[knownLanguage]))value=(translations[knownLanguage] as Record<string,unknown>)[id];
   else if(rec(translations[id]))value=(translations[id] as Record<string,unknown>)[knownLanguage];
   const instructions=typeof value==='string'?str(value):rec(value)?str(value.objectives_explained)||str(value.unit_title):'';
   if(!instructions){issue('MISSING_SUPPORT',`${path}.support.${knownLanguage}`,id);continue;}
   result.supports.push({conceptId,knownLanguage,instructions,editorialStatus:'candidate'});
  }
 }
 return result;
}
