/** A2 original editorial briefs for the THREE first-release target languages.
 * These are NOT lessons, recordings, tests of real ASR, or CEFR certification.
 * Existing A2 historical candidates remain quarantined and unchanged.
 */
import {firstReleaseLanguages,canSelectFirstReleasePair} from './first-release-languages.js';
import {courseSkills,curriculumUnitBlueprint,auditCurriculumProduction,type ProductionUnit} from './learning-paths.js';
import type {TargetLanguage} from './types.js';
import {a2English} from './a2-editorial-seeds-en.js';
import {a2French} from './a2-editorial-seeds-fr.js';
import {a2Spanish} from './a2-editorial-seeds-es.js';

export const a2DraftTopics=curriculumUnitBlueprint.A2;
export type A2Topic=(typeof a2DraftTopics)[number];
export interface A2EditorialSeed {
 outcome:string;grammar:string;dialogue:readonly [string,string];
 vocabulary:readonly [string,string,string,string];
 /** Six distinct authoring prompts in canonical skill order. */
 tasks:readonly [string,string,string,string,string,string];
}
const authoring:Readonly<Record<(typeof firstReleaseLanguages)[number],Readonly<Record<A2Topic,A2EditorialSeed>>>>={
 'en-CA':a2English,'fr-CA':a2French,es:a2Spanish
};
export const a2VocabularyConcepts:Readonly<Record<A2Topic,readonly [string,string,string,string]>>={
 'past-experiences':['when-past','past-action','past-observation','past-followup'],
 'plans-and-invitations':['offer-invitation','planned-activity','suggest-alternative','confirm-schedule'],
 'housing-and-services':['report-fault','state-not-working','request-inspection','arrange-time'],
 'health-and-wellbeing':['describe-symptom','state-duration','describe-discomfort','request-assistance'],
 'work-and-study':['state-obligation','state-necessity','order-first','ask-clarification'],
 'travel-problems':['report-missed-connection','identify-next-service','ask-departure','ask-alternative'],
 'opinions-and-preferences':['state-preference','give-reason','qualify-opinion','ask-opinion'],
 'everyday-storytelling':['begin-event','sequence-event','simultaneous-event','finish-event']
};
export interface A2EditorialDraft extends ProductionUnit {
 level:'A2';unitId:A2Topic;status:'draft';
 dialogue:readonly [string,string];grammarFocus:string;
 lexemes:readonly {conceptId:string;form:string}[];
 editorialStatus:'not-human-reviewed';
 audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';
 publicAvailable:false;
}
/** Text is deliberately NOT inserted into lessonsFor, SQLite or the audio player. */
export const a2EditorialDrafts:readonly A2EditorialDraft[]=firstReleaseLanguages.flatMap(targetLanguage=>
 a2DraftTopics.map((unitId):A2EditorialDraft=>{
  const seed=authoring[targetLanguage][unitId];
  return {targetLanguage,level:'A2',unitId,status:'draft',revision:'0.1.0',
   outcomes:[seed.outcome],grammarFocus:seed.grammar,dialogue:[...seed.dialogue],
   activities:courseSkills.map((skill,i)=>({id:'activity-'+skill,skill,prompt:seed.tasks[i]!})),
   lexemes:a2VocabularyConcepts[unitId].map((conceptId,i)=>({conceptId,form:seed.vocabulary[i]!})),
   editorialStatus:'not-human-reviewed',audioStatus:'not-recorded',
   rightsStatus:'pending-editorial-clearance',publicAvailable:false};
 })
);
export const a2AudioExpectedIds:readonly string[]=a2EditorialDrafts.flatMap(unit=>
 unit.dialogue.map((_,index)=>[unit.targetLanguage,'a2',unit.unitId,'dialogue-'+(index+1)].join('/'))
);
export const a2AudioBaseline={
 expected:a2AudioExpectedIds.length,verified:0,missing:a2AudioExpectedIds,
 readyForEditorialPlayback:false,readyForPublicRelease:false
} as const;

const topicHelp:Readonly<Record<(typeof firstReleaseLanguages)[number],Readonly<Record<A2Topic,string>>>>={
 es:{
  'past-experiences':'Relata una experiencia pasada ficticia.',
  'plans-and-invitations':'Invita y negocia un horario alternativo.',
  'housing-and-services':'Explica una avería ficticia y solicita ayuda.',
  'health-and-wellbeing':'Describe un síntoma ficticio sin diagnosticar.',
  'work-and-study':'Explica deberes y aclara instrucciones.',
  'travel-problems':'Explica una conexión perdida y busca alternativas.',
  'opinions-and-preferences':'Da una opinión y justifica respetuosamente tu preferencia.',
  'everyday-storytelling':'Cuenta una sorpresa cotidiana imaginaria en orden.'
 },
 'en-CA':{
  'past-experiences':'Retell a fictional past experience.',
  'plans-and-invitations':'Invite someone and suggest another time.',
  'housing-and-services':'Explain a fictional maintenance problem and ask for help.',
  'health-and-wellbeing':'Describe an imaginary symptom without diagnosing anyone.',
  'work-and-study':'Explain duties and clarify an instruction.',
  'travel-problems':'Report a missed connection and ask about alternatives.',
  'opinions-and-preferences':'Support a personal preference with a respectful reason.',
  'everyday-storytelling':'Tell an imaginary everyday surprise in chronological order.'
 },
 'fr-CA':{
  'past-experiences':'Racontez un événement passé fictif.',
  'plans-and-invitations':'Invitez quelqu’un et proposez un autre horaire.',
  'housing-and-services':'Expliquez une panne fictive et demandez de l’aide.',
  'health-and-wellbeing':'Décrivez un symptôme imaginaire sans poser de diagnostic.',
  'work-and-study':'Expliquez les tâches et demandez une précision.',
  'travel-problems':'Signalez un transport manqué et explorez les solutions.',
  'opinions-and-preferences':'Justifiez une préférence de façon respectueuse.',
  'everyday-storytelling':'Racontez un petit imprévu imaginaire dans l’ordre.'
 }
};
const skillHelp:Readonly<Record<(typeof firstReleaseLanguages)[number],readonly string[]>>={
 es:['Escucha para reconocer los hechos clave.','Responde hablando con tus palabras.','Lee el contexto ficticio.','Escribe una respuesta inventada.','Practica turnos de conversación.','Reformula lo aprendido para otra persona.'],
 'en-CA':['Listen for the essential facts.','Answer aloud in your own words.','Read the fictional context.','Write an invented response.','Take conversational turns.','Restate the key information for another listener.'],
 'fr-CA':['Écoutez les informations essentielles.','Répondez à voix haute avec vos mots.','Lisez le contexte fictif.','Rédigez une réponse imaginaire.','Échangez à tour de rôle.','Reformulez les informations pour un autre auditeur.']
};
/** Preview only for the six directed first-release routes; never emits an approved assessment. */
export function a2LocalizedPreview(known:TargetLanguage,target:TargetLanguage,unitId:A2Topic) {
 if(!canSelectFirstReleasePair(known,target)||!a2DraftTopics.includes(unitId))return null;
 const unit=a2EditorialDrafts.find(row=>row.targetLanguage===target&&row.unitId===unitId);
 if(!unit||unit.editorialStatus!=='not-human-reviewed'||unit.audioStatus!=='not-recorded'||
    unit.rightsStatus!=='pending-editorial-clearance'||unit.publicAvailable!==false)return null;
 const help=known as (typeof firstReleaseLanguages)[number];
 return {
  status:'editorial-only' as const,knownLanguage:known,targetLanguage:target,unitId,
  outcome:unit.outcomes[0]!,grammarFocus:unit.grammarFocus,dialogue:unit.dialogue,
  topicHelp:topicHelp[help][unitId],
  activities:unit.activities.map((a,i)=>({skill:a.skill,instruction:skillHelp[help][i]!,draftPrompt:a.prompt})),
  audioStatus:unit.audioStatus,editorialStatus:unit.editorialStatus,rightsStatus:unit.rightsStatus,
  publicAvailable:false as const,readyForListening:false as const,
  warning:'A2 editorial draft. No approved lesson, audio recording, assessment or certification.' as const
 };
}
/** Audit counts text drafts without inflating learning or public release readiness. */
export function auditA2EditorialDrafts(drafts:readonly A2EditorialDraft[]=a2EditorialDrafts){
 const report=auditCurriculumProduction(drafts);
 const errors=[...report.errors],seen=new Set<string>();
 for(const item of drafts){
  const id=item.targetLanguage+'/'+item.unitId;
  if(seen.has(id)){errors.push('DUPLICATE_A2 '+id);continue;}
  seen.add(id);
  if(!firstReleaseLanguages.includes(item.targetLanguage as (typeof firstReleaseLanguages)[number])||
     item.level!=='A2'||item.status!=='draft'||!a2DraftTopics.includes(item.unitId))
   errors.push('WRONG_A2_SCOPE '+id);
  if(item.editorialStatus!=='not-human-reviewed'||item.audioStatus!=='not-recorded'||
     item.rightsStatus!=='pending-editorial-clearance'||item.publicAvailable!==false)
   errors.push('PREMATURE_A2_PUBLICATION '+id);
  if(item.activities.length!==6||!courseSkills.every(skill=>
     item.activities.some(a=>a.skill===skill&&a.prompt.trim().length>=25)))
   errors.push('MISSING_A2_SKILLS '+id);
  if(item.outcomes.length!==1||!item.outcomes[0]?.trim()||
     item.dialogue.length!==2||item.dialogue.some(line=>line.trim().length<12)||
     item.grammarFocus.trim().length<25)errors.push('INCOMPLETE_A2_BRIEF '+id);
  const concepts=a2VocabularyConcepts[item.unitId];
  if(item.lexemes.length!==4||concepts.some(key=>item.lexemes.filter(row=>
     row.conceptId===key&&row.form.trim().length>2).length!==1))
    errors.push('MISSING_A2_LEXEME '+id);
 }
 for(const targetLanguage of firstReleaseLanguages)for(const unitId of a2DraftTopics)
  if(!seen.has(targetLanguage+'/'+unitId))errors.push('MISSING_A2_DRAFT '+targetLanguage+'/'+unitId);
 return {valid:errors.length===0,errors,plannedFirstReleaseUnits:24,
  actualDrafts:drafts.length,approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false as const};
}
