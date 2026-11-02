/** B1 editorial layer for the first-release languages. No exercises in the live course.
 * This is an authoring inventory and translation-safe help-preview only, NOT a
 * learner assessment, published lesson or a recording production licence.
 */
import {firstReleaseLanguages,canSelectFirstReleasePair} from './first-release-languages.js';
import {courseSkills,curriculumUnitBlueprint,auditCurriculumProduction,type ProductionUnit} from './learning-paths.js';
import type {TargetLanguage} from './types.js';
import {b1English} from './b1-editorial-seeds-en.js';
import {b1French} from './b1-editorial-seeds-fr.js';
import {b1Spanish} from './b1-editorial-seeds-es.js';

export const b1DraftTopics=curriculumUnitBlueprint.B1;
export type B1Topic=(typeof b1DraftTopics)[number];
export interface B1EditorialSeed {
 outcome:string;grammar:string;dialogue:readonly [string,string];
 vocabulary:readonly [string,string,string,string];
 tasks:readonly [string,string,string,string,string,string];
}
type FirstReleaseTarget=(typeof firstReleaseLanguages)[number];
const authoring:Readonly<Record<FirstReleaseTarget,Readonly<Record<B1Topic,B1EditorialSeed>>>>={
 'en-CA':b1English,'fr-CA':b1French,es:b1Spanish
};
export const b1VocabularyConcepts:Readonly<Record<B1Topic,readonly [string,string,string,string]>>={
 'narrating-events':['background-event','interruption','causal-result','resolution'],
 'explaining-opinions':['claim','supporting-reason','illustrative-example','counterpoint'],
 'workplace-collaboration':['polite-delegation','conditional-offer','responsibility','confirm-assignment'],
 'media-and-culture':['source-attribution','reported-view','contrast','interpretation'],
 'handling-unexpected-situations':['state-disruption','conditional-availability','alternative','ask-options'],
 'personal-goals':['state-goal','reported-progress','identify-gap','next-step'],
 'community-and-society':['one-group-view','other-group-need','balanced-comparison','compromise'],
 'extended-conversations':['clarify','rephrase','check-understanding','confirm-outcome']
};
export interface B1EditorialDraft extends ProductionUnit {
 level:'B1';unitId:B1Topic;status:'draft';
 dialogue:readonly [string,string];grammarFocus:string;
 lexemes:readonly {conceptId:string;form:string}[];
 editorialStatus:'not-human-reviewed';
 audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';
 publicAvailable:false;
}
export const b1EditorialDrafts:readonly B1EditorialDraft[]=firstReleaseLanguages.flatMap(targetLanguage=>
 b1DraftTopics.map((unitId):B1EditorialDraft=>{
  const source=authoring[targetLanguage][unitId];
  return {
   targetLanguage,level:'B1',unitId,revision:'0.1.0',status:'draft',
   outcomes:[source.outcome],grammarFocus:source.grammar,dialogue:[...source.dialogue],
   activities:courseSkills.map((skill,i)=>({id:'activity-'+skill,skill,prompt:source.tasks[i]!})),
   lexemes:b1VocabularyConcepts[unitId].map((conceptId,i)=>({conceptId,form:source.vocabulary[i]!})),
   editorialStatus:'not-human-reviewed',audioStatus:'not-recorded',
   rightsStatus:'pending-editorial-clearance',publicAvailable:false
  };
 })
);
export const b1AudioExpectedIds:readonly string[]=b1EditorialDrafts.flatMap(unit=>
 unit.dialogue.map((_,i)=>[unit.targetLanguage,'b1',unit.unitId,'dialogue-'+(i+1)].join('/')));
export const b1AudioBaseline={
 expected:b1AudioExpectedIds.length,verified:0,missing:b1AudioExpectedIds,
 readyForEditorialPlayback:false,readyForPublicRelease:false
} as const;
const topicCopy:Readonly<Record<FirstReleaseTarget,Readonly<Record<B1Topic,string>>>>={
 es:{
  'narrating-events':'Relata un imprevisto con causas y consecuencias.',
  'explaining-opinions':'Defiende una opinión con argumentos y escucha objeciones.',
  'workplace-collaboration':'Negocia tareas y responsabilidades con cortesía.',
  'media-and-culture':'Compara noticias culturales distinguiendo fuentes y opiniones.',
  'handling-unexpected-situations':'Propón alternativas a un cambio imprevisto.',
  'personal-goals':'Explica progresos, dificultades y el siguiente objetivo.',
  'community-and-society':'Discute necesidades comunitarias sin generalizar.',
  'extended-conversations':'Mantén un diálogo aclarando malentendidos.'
 },
 'en-CA':{
  'narrating-events':'Explain an unexpected event, its causes and results.',
  'explaining-opinions':'Support a position with reasons and acknowledge objections.',
  'workplace-collaboration':'Negotiate team responsibilities politely.',
  'media-and-culture':'Discuss media reports while distinguishing sources and views.',
  'handling-unexpected-situations':'Suggest alternatives when plans change.',
  'personal-goals':'Explain progress, obstacles and next steps.',
  'community-and-society':'Compare community needs without generalizing.',
  'extended-conversations':'Continue a longer dialogue by clarifying misunderstandings.'
 },
 'fr-CA':{
  'narrating-events':'Expliquez un imprévu, ses causes et ses conséquences.',
  'explaining-opinions':'Défendez un avis en reconnaissant les objections.',
  'workplace-collaboration':'Négociez les responsabilités avec politesse.',
  'media-and-culture':'Distinguez les sources et les avis dans une nouvelle culturelle.',
  'handling-unexpected-situations':'Proposez des solutions face à un changement.',
  'personal-goals':'Décrivez vos progrès, obstacles et prochaines étapes.',
  'community-and-society':'Comparez des besoins communautaires sans généralisation.',
  'extended-conversations':'Poursuivez un dialogue en clarifiant un malentendu.'
 }
};
const skillsCopy:Readonly<Record<FirstReleaseTarget,readonly [string,string,string,string,string,string]>>={
 es:['Escucha los argumentos, la secuencia y las reservas.','Da una explicación razonada en voz alta.','Lee la situación y separa hechos de opiniones.','Escribe un mensaje ficticio coherente.','Sostén un intercambio y pide aclaraciones.','Resume las opiniones sin añadir detalles inventados.'],
 'en-CA':['Listen for reasons, sequence and qualifications.','Explain your position aloud with supporting detail.','Read and distinguish observation from opinion.','Write a coherent fictional response.','Maintain an exchange and seek clarification.','Restate both positions without inventing facts.'],
 'fr-CA':['Écoutez les raisons, la chronologie et les nuances.','Expliquez votre avis à voix haute avec des arguments.','Lisez et distinguez les faits des opinions.','Rédigez une réponse fictive cohérente.','Poursuivez un échange et demandez des précisions.','Résumez les points de vue sans inventer de faits.']
};
/** Only the six directed help/learning pairs selected for public launch.
 * Returns editorial metadata and written drafting prompts, never playable
 * lessons, audio, verified subtitles, scoring or genuine progress.
 */
export function b1LocalizedPreview(known:TargetLanguage,target:TargetLanguage,unitId:B1Topic){
 if(!canSelectFirstReleasePair(known,target)||!b1DraftTopics.includes(unitId))return null;
 const unit=b1EditorialDrafts.find(x=>x.targetLanguage===target&&x.unitId===unitId);
 if(!unit||unit.editorialStatus!=='not-human-reviewed'||
    unit.audioStatus!=='not-recorded'||unit.rightsStatus!=='pending-editorial-clearance'||
    unit.publicAvailable!==false)return null;
 const help=known as FirstReleaseTarget;
 return {
  status:'editorial-only' as const,
  knownLanguage:known,targetLanguage:target,unitId,
  topicHelp:topicCopy[help][unitId],
  outcome:unit.outcomes[0]!,grammarFocus:unit.grammarFocus,dialogue:unit.dialogue,
  activities:unit.activities.map((a,i)=>({
   skill:a.skill,instruction:skillsCopy[help][i]!,draftPrompt:a.prompt
  })),
  editorialStatus:unit.editorialStatus,audioStatus:unit.audioStatus,
  rightsStatus:unit.rightsStatus,publicAvailable:false as const,
  readyForListening:false as const,
  warning:'B1 editorial preview only. No approved audio, interactive lesson or certification.' as const
 };
}
export function auditB1EditorialDrafts(drafts:readonly B1EditorialDraft[]=b1EditorialDrafts){
 const structural=auditCurriculumProduction(drafts);
 const errors=[...structural.errors];
 const seen=new Set<string>();
 for(const item of drafts){
  const id=item.targetLanguage+'/'+item.unitId;
  if(seen.has(id)){errors.push('DUPLICATE_B1 '+id);continue;}
  seen.add(id);
  if(!firstReleaseLanguages.includes(item.targetLanguage as FirstReleaseTarget)||
     item.level!=='B1'||item.status!=='draft'||!b1DraftTopics.includes(item.unitId))
   errors.push('WRONG_B1_SCOPE '+id);
  if(item.editorialStatus!=='not-human-reviewed'||item.audioStatus!=='not-recorded'||
     item.rightsStatus!=='pending-editorial-clearance'||item.publicAvailable!==false)
   errors.push('PREMATURE_B1_PUBLICATION '+id);
  if(item.activities.length!==6||!courseSkills.every(skill=>item.activities.some(a=>
     a.skill===skill&&a.prompt.trim().length>=25)))errors.push('MISSING_B1_SKILLS '+id);
  if(item.outcomes.length!==1||!item.outcomes[0]?.trim()||
     item.dialogue.length!==2||item.dialogue.some(line=>line.trim().length<12)||
     item.grammarFocus.trim().length<25)errors.push('INCOMPLETE_B1_BRIEF '+id);
  const concepts=b1VocabularyConcepts[item.unitId];
  if(item.lexemes.length!==4||concepts.some(key=>item.lexemes.filter(row=>
     row.conceptId===key&&row.form.trim().length>2).length!==1))errors.push('MISSING_B1_LEXEME '+id);
 }
 for(const target of firstReleaseLanguages)for(const topic of b1DraftTopics)
  if(!seen.has(target+'/'+topic))errors.push('MISSING_B1_DRAFT '+target+'/'+topic);
 return {valid:errors.length===0,errors,plannedFirstReleaseUnits:24,
  actualDrafts:drafts.length,approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false as const};
}
