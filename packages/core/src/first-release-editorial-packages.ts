/** Unifies existing first-release A1–C2 ORIGINAL editorial scripts into the
 * existing strict lesson-package contract. These are NOT playable, reviewed or
 * complete CEFR lessons: they are structured production candidates.
 * No session, user progress, microphone, TTS, AI or SQLite integration.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {officialCefrBands,curriculumUnitBlueprint,type ProductionUnit} from './learning-paths.js';
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
import {a2EditorialDrafts} from './a2-editorial-contract.js';
import {b1EditorialDrafts} from './b1-editorial-contract.js';
import {b2EditorialDrafts} from './b2-editorial-contract.js';
import {advancedEditorialDrafts} from './advanced-editorial-contract.js';
import {expandedFirstReleasePilots} from './a2-b2-expanded-pilots.js';
import {expandedA1GreetingPilots} from './a1-expanded-greeting-pilots.js';
import {advancedListeningStoryboards} from './advanced-listening-storyboards.js';
import {
 lessonPackageFormat,lessonPackageDigest,validateLessonPackage,
 type LessonPackage,type PackageLesson,type PackageActivity,type PackageResponseMode
} from './content-validation.js';
import type {LocalizedText} from './course.js';
import type {CefrBand,TargetLanguage} from './types.js';

type FirstTarget=(typeof firstReleaseLanguages)[number];
type SourceDraft=ProductionUnit&{
 dialogue:readonly [string,string];editorialStatus:'not-human-reviewed';
 audioStatus:'not-recorded';rightsStatus:'pending-editorial-clearance'
};
type Stage='hear-cue'|'hear-reply'|'identify-reply'|'model-response'|'take-turn'|'independent-recall'|'checkpoint';
const supports:Readonly<Record<Stage,LocalizedText>>={
 'hear-cue':{
  'en-CA':'Listen to the first speaker in this original draft dialogue.',
  'fr-CA':'Écoutez la première personne dans ce dialogue original en préparation.',
  es:'Escucha a la primera persona en este diálogo original en preparación.',
  'pt-BR':'Ouça a primeira pessoa deste diálogo original em preparação.',
  de:'Hören Sie der ersten Person in diesem ursprünglichen Entwurfsdialog zu.',
  it:'Ascolta la prima persona in questo dialogo originale in preparazione.'
 },
 'hear-reply':{
  'en-CA':'Listen to the reply; its audio still needs recording and review.',
  'fr-CA':'Écoutez la réponse; son audio doit encore être enregistré et révisé.',
  es:'Escucha la respuesta; su audio aún debe grabarse y revisarse.',
  'pt-BR':'Ouça a resposta; o áudio ainda precisa ser gravado e revisado.',
  de:'Hören Sie die Antwort; der Ton muss noch aufgenommen und geprüft werden.',
  it:'Ascolta la risposta; l’audio deve ancora essere registrato e verificato.'
 },
 'identify-reply':{
  'en-CA':'Which sentence follows the first speaker? Text-recognition rehearsal only.',
  'fr-CA':'Quelle phrase suit la première intervention ? Reconnaissance du texte seulement.',
  es:'¿Qué frase sigue a la primera intervención? Solo práctica de reconocimiento textual.',
  'pt-BR':'Qual frase vem depois da primeira fala? Apenas reconhecimento de texto.',
  de:'Welcher Satz folgt auf die erste Äußerung? Nur Texterkennung als Übung.',
  it:'Quale frase segue il primo intervento? Solo riconoscimento testuale.'
 },
 'model-response':{
  'en-CA':'Study a model reply. You may use text instead of the microphone.',
  'fr-CA':'Étudiez une réponse modèle. Vous pouvez répondre par écrit.',
  es:'Practica una respuesta modelo. Puedes escribir sin utilizar el micrófono.',
  'pt-BR':'Pratique uma resposta modelo. Você pode responder por escrito.',
  de:'Üben Sie eine Musterantwort. Sie können auch schreiben.',
  it:'Esercitati con una risposta modello. Puoi anche scrivere.'
 },
 'take-turn':{
  'en-CA':'Reply to the first speaker in this fictional conversation.',
  'fr-CA':'Répondez à la première personne dans cette conversation fictive.',
  es:'Responde a la primera persona de esta conversación ficticia.',
  'pt-BR':'Responda à primeira pessoa nesta conversa fictícia.',
  de:'Antworten Sie der ersten Person in diesem fiktiven Gespräch.',
  it:'Rispondi alla prima persona in questa conversazione immaginaria.'
 },
 'independent-recall':{
  'en-CA':'Recall the response without relying on audio recognition or a timer.',
  'fr-CA':'Rappelez la réponse sans dépendre du micro ni d’une limite de temps.',
  es:'Recuerda la respuesta sin depender del micrófono ni de un cronómetro.',
  'pt-BR':'Lembre-se da resposta sem depender do microfone ou de um cronômetro.',
  de:'Erinnern Sie sich ohne Mikrofon oder Zeitdruck an die Antwort.',
  it:'Ricorda la risposta senza dipendere dal microfono o da limiti di tempo.'
 },
 checkpoint:{
  'en-CA':'Editorial checkpoint: respond without a time limit; this is not a CEFR exam.',
  'fr-CA':'Contrôle éditorial : répondez sans limite de temps; ce n’est pas un examen CECR.',
  es:'Comprobación editorial: responde sin límite de tiempo; no es un examen MCER.',
  'pt-BR':'Verificação editorial: responda sem limite de tempo; não é um exame CEFR.',
  de:'Redaktionelle Prüfung ohne Zeitlimit; dies ist keine GER-Prüfung.',
  it:'Verifica editoriale senza limiti di tempo; non è un esame QCER.'
 }
};
const originalSources:readonly SourceDraft[]=[
 ...a1EditorialDrafts.filter(x=>firstReleaseLanguages.includes(x.targetLanguage as FirstTarget)),
 ...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts,...advancedEditorialDrafts
];
const sourceId=(s:Pick<SourceDraft,'targetLanguage'|'level'|'unitId'>)=>
 [s.targetLanguage,s.level,s.unitId].join('/');
const originalById=new Map(originalSources.map(s=>[sourceId(s),s]));
const stage=(id:string,kind:PackageActivity['kind'],support:Stage,opts:Partial<PackageActivity>):PackageActivity=>
 ({id,kind,prompt:{support:supports[support]},responseModes:[],...opts});
/** Each original draft has two *written* dialogue lines, no genuine audio.
 * A model-response is deterministic practice, not a score of spoken quality.
 */
function candidateLesson(source:SourceDraft):PackageLesson{
 const id=[source.targetLanguage,source.level.toLowerCase(),source.unitId].join('-');
 const [cue,reply]=source.dialogue;
 const base=(suffix:string)=>id+'-'+suffix;
 const oralAndText=['speech','typed'] as const satisfies readonly PackageResponseMode[];
 const activities:PackageActivity[]=[
  stage(base('cue'),'listen','hear-cue',{prompt:{target:cue,support:supports['hear-cue']}}),
  stage(base('reply'),'listen','hear-reply',{prompt:{target:reply,support:supports['hear-reply']}}),
  stage(base('identify'),'choice','identify-reply',{
   prompt:{support:supports['identify-reply']},
   options:[{id:base('option-cue'),text:cue},{id:base('option-reply'),text:reply}],
   correctOptionId:base('option-reply'),responseModes:['choice']
  }),
  stage(base('model'),'repeat','model-response',{
   model:reply,accepted:[reply],responseModes:oralAndText
  }),
  stage(base('turn'),'dialogue-turn','take-turn',{
   prompt:{target:cue,support:supports['take-turn']},
   model:reply,accepted:[reply],responseModes:oralAndText
  }),
  stage(base('recall'),'recall','independent-recall',{
   model:reply,accepted:[reply],responseModes:oralAndText
  }),
  stage(base('checkpoint'),'checkpoint','checkpoint',{
   model:reply,accepted:[reply],responseModes:oralAndText
  })
 ];
 const pilot=expandedFirstReleasePilots.find(p=>
  p.targetLanguage===source.targetLanguage&&p.level===source.level&&p.unitId===source.unitId);
 if(pilot){
  if(pilot.turns[0]?.text!==cue||pilot.turns[1]?.text!==reply)
   throw new Error('Expanded dialogue differs from canonical source: '+id);
  const followup:PackageActivity[]=pilot.turns.slice(2).map((turn,i)=>
   stage(base('extended-turn-'+(i+3)),'listen','hear-reply',{
    prompt:{target:turn.text,support:supports['hear-reply']}
   }));
  const evidence:PackageActivity[]=pilot.checks.map((check,i)=>
   stage(base('evidence-'+(i+1)),'choice','identify-reply',{
    prompt:{target:check.question,support:supports['identify-reply']},
    options:[
     {id:base('evidence-correct-'+(i+1)),text:check.verbatimEvidence},
     {id:base('evidence-unsupported-'+(i+1)),text:check.unsupportedInterpretation}
    ],
    correctOptionId:base('evidence-correct-'+(i+1)),
    responseModes:['choice']
   }));
  activities.splice(2,0,...followup,...evidence);
 }
 const a1Pilot=expandedA1GreetingPilots.find(p=>
  p.targetLanguage===source.targetLanguage&&source.level==='A1'&&p.unitId===source.unitId);
 if(a1Pilot){
  if(a1Pilot.turns[0]?.text!==cue||a1Pilot.turns[1]?.text!==reply)
   throw new Error('A1 pilot dialogue differs from source: '+id);
  const extraTurns:PackageActivity[]=a1Pilot.turns.slice(2).map((turn,i)=>
   stage(base('a1-turn-'+(i+3)),'listen','hear-reply',{
    prompt:{target:turn.text,support:supports['hear-reply']}
   }));
  const extraChecks:PackageActivity[]=a1Pilot.checks.map((check,i)=>
   stage(base('a1-evidence-'+(i+1)),'choice','identify-reply',{
    prompt:{target:check.question,support:supports['identify-reply']},
    options:[
     {id:base('a1-correct-'+(i+1)),text:check.verbatimEvidence},
     {id:base('a1-unsupported-'+(i+1)),text:check.unsupportedInterpretation}
    ],
    correctOptionId:base('a1-correct-'+(i+1)),responseModes:['choice']
   }));
  activities.splice(2,0,...extraTurns,...extraChecks);
 }
 // Advanced six-turn scenarios are additional, distinct situations on the SAME
 // unit topic. They do not overwrite the original two-turn C1/C2 source draft.
 const advanced=advancedListeningStoryboards.find(p=>
  p.targetLanguage===source.targetLanguage&&p.level===source.level&&p.unitId===source.unitId);
 if(advanced){
  if(advanced.publicAvailable!==false||advanced.canScore!==false||
    advanced.audioStatus!=='not-recorded')
   throw new Error('Advanced scene is not a permitted editorial draft: '+id);
  const sceneTurns:PackageActivity[]=advanced.turns.map((turn,i)=>
   stage(base('advanced-scene-'+(i+1)),'listen','hear-reply',{
    prompt:{target:turn.text,support:supports['hear-reply']}
   }));
  const sceneChecks:PackageActivity[]=advanced.checks.map((check,i)=>
   stage(base('advanced-evidence-'+(i+1)),'choice','identify-reply',{
    prompt:{target:check.question,support:supports['identify-reply']},
    options:[
     {id:base('advanced-correct-'+(i+1)),text:check.verbatimEvidence},
     {id:base('advanced-unsupported-'+(i+1)),text:check.unsupportedInterpretation}
    ],
    correctOptionId:base('advanced-correct-'+(i+1)),responseModes:['choice']
   }));
  activities.splice(2,0,...sceneTurns,...sceneChecks);
 }
 const outcome=source.outcomes[0]??'';
 const goal:LocalizedText={...supports['take-turn'],[source.targetLanguage]:outcome};
 return {
  id,band:source.level,objective:{id,goal},
  skills:['listening-comprehension','spoken-production','spoken-interaction','written-production'],
  prerequisites:[],activities,
  rights:{status:'original'},
  editorialStatus:'draft',audioStatus:'audio-missing',asrStatus:'asr-unvalidated'
 };
}
export const firstReleaseEditorialPackages:readonly LessonPackage[]=firstReleaseLanguages.map(targetLanguage=>{
 const lessons:PackageLesson[]=officialCefrBands.flatMap(level=>
  curriculumUnitBlueprint[level].map(unitId=>{
   const source=originalById.get([targetLanguage,level,unitId].join('/'));
   if(!source)throw new Error('Missing original draft '+targetLanguage+'/'+level+'/'+unitId);
   return candidateLesson(source);
  }));
 return {
  format:lessonPackageFormat,schemaVersion:1,
  packageId:'voicefirst-editorial-'+targetLanguage.toLowerCase(),
  version:'0.1.0',targetLanguage,variant:targetLanguage,
  contentSha256:lessonPackageDigest(lessons),lessons
 };
});
export interface FirstReleaseProductionReport {
 structurallyValid:boolean;errors:readonly string[];packages:number;
 candidateLessons:number;draftActivities:number;
 editoriallyApprovedLessons:0;verifiedVoiceClips:0;
 publiclyAvailableLessons:0;fullCoursesReady:0;
}
export function auditFirstReleaseProductionPackages(
 packs:unknown=firstReleaseEditorialPackages
):FirstReleaseProductionReport{
 const errors:string[]=[];
 if(!Array.isArray(packs)||packs.length!==3)
  return {structurallyValid:false,errors:['INVALID_PACKAGE_COUNT'],packages:0,
   candidateLessons:0,draftActivities:0,editoriallyApprovedLessons:0,
   verifiedVoiceClips:0,publiclyAvailableLessons:0,fullCoursesReady:0};
 let lessonCount=0,activityCount=0;
 for(const [i,targetLanguage] of firstReleaseLanguages.entries()){
  const pack=packs[i] as LessonPackage|null;
  if(!pack||typeof pack!=='object'||pack.targetLanguage!==targetLanguage){
   errors.push('INVALID_PACKAGE_LANGUAGE '+targetLanguage);continue;
  }
  const result=validateLessonPackage(pack);
  if(!result.structurallyValid)errors.push(...result.issues.filter(x=>x.severity==='error').map(x=>x.code+':'+x.path));
  if(result.readyForPublication!==false||
    !result.publicationBlockers.includes('editorial-review-pending')||
    !result.publicationBlockers.includes('audio-not-verified')||
    !result.publicationBlockers.includes('asr-not-validated'))
   errors.push('PREMATURE_PUBLICATION '+targetLanguage);
  if(!Array.isArray(pack.lessons)){
   errors.push('INVALID_LESSON_LIST '+targetLanguage);continue;
  }
  if(pack.lessons.length!==48)errors.push('LESSON_COUNT '+targetLanguage);
  const validLessons=pack.lessons.filter((lesson):lesson is PackageLesson=>
   lesson!==null&&typeof lesson==='object'&&!Array.isArray(lesson));
  if(validLessons.length!==pack.lessons.length)errors.push('INVALID_LESSON_ROW '+targetLanguage);
  for(const level of officialCefrBands){
   const expected=curriculumUnitBlueprint[level];
   const found=validLessons.filter(l=>l.band===level);
   if(found.length!==expected.length)errors.push('LEVEL_COUNT '+targetLanguage+'/'+level);
   for(const unitId of expected){
    const draft=originalById.get([targetLanguage,level,unitId].join('/'));
    const lesson=validLessons.find(l=>l.id===[targetLanguage,level.toLowerCase(),unitId].join('-'));
    const activities=lesson&&Array.isArray(lesson.activities)?lesson.activities:[];
    if(!draft||!lesson||!Array.isArray(lesson.activities)||lesson.band!==level||lesson.editorialStatus!=='draft'||
      lesson.audioStatus!=='audio-missing'||lesson.asrStatus!=='asr-unvalidated'||
      lesson.rights?.status!=='original'||
      activities.length!==(
       7+
       (expandedFirstReleasePilots.some(p=>p.targetLanguage===targetLanguage&&
        p.level===level&&p.unitId===unitId)?7:0)+
       (expandedA1GreetingPilots.some(p=>p.targetLanguage===targetLanguage&&
        level==='A1'&&p.unitId===unitId)?7:0)+
       (advancedListeningStoryboards.some(p=>p.targetLanguage===targetLanguage&&
        p.level===level&&p.unitId===unitId)?9:0)
      )||
      activities[0]?.prompt?.target!==draft.dialogue[0]||
      activities[1]?.prompt?.target!==draft.dialogue[1]||
      !activities.some(a=>a.kind==='dialogue-turn'&&a.model===draft.dialogue[1]))
      errors.push('INCOMPLETE_OR_CHANGED_DRAFT '+targetLanguage+'/'+level+'/'+unitId);
    if(!lesson||!Array.isArray(lesson.activities))continue;
    // A recomputed package digest must not conceal substitution of a reviewed
    // draft's evidence. Compare the FULL source dialogue and answer choices,
    // including all standalone C1/C2 scenes and the extra A1/A2-B2 pilots.
    const scenes=[
     ...expandedFirstReleasePilots,
     ...expandedA1GreetingPilots,
     ...advancedListeningStoryboards
    ].filter(p=>p.targetLanguage===targetLanguage&&p.level===level&&p.unitId===unitId);
    for(const scene of scenes){
     for(const turn of scene.turns){
      if(!activities.some(a=>a?.kind==='listen'&&a.prompt?.target===turn.text))
       errors.push('MISSING_STORYBOARD_TURN '+targetLanguage+'/'+level+'/'+unitId+'/'+turn.id);
     }
     for(const check of scene.checks){
      if(!activities.some(a=>a?.kind==='choice'&&a.prompt?.target===check.question&&
       a.options?.some(o=>o.id===a.correctOptionId&&o.text===check.verbatimEvidence)&&
       a.options?.some(o=>o.text===check.unsupportedInterpretation)))
       errors.push('MISSING_STORYBOARD_EVIDENCE '+targetLanguage+'/'+level+'/'+unitId+'/'+check.afterTurnId);
     }
    }
   }
  }
  lessonCount+=pack.lessons.length;activityCount+=result.activities;
 }
 return {structurallyValid:errors.length===0,errors,packages:packs.length,
  candidateLessons:lessonCount,draftActivities:activityCount,
  editoriallyApprovedLessons:0,verifiedVoiceClips:0,
  publiclyAvailableLessons:0,fullCoursesReady:0};
}
/** For human QA ONLY. It deliberately does not import into lessonsFor or sessions. */
export function editorialPackagePreview(target:TargetLanguage,level:CefrBand,unitId:string){
 if(!firstReleaseLanguages.includes(target as FirstTarget)||level==='A0')return null;
 const pack=firstReleaseEditorialPackages.find(p=>p.targetLanguage===target);
 const lesson=pack?.lessons.find(l=>l.id===[target,level.toLowerCase(),unitId].join('-'));
 if(!lesson||lesson.band!==level)return null;
 return {status:'editorial-only' as const,lesson,
  hasApprovedAudio:false as const,canAssess:false as const,
  canAwardProgress:false as const,publicAvailable:false as const};
}
