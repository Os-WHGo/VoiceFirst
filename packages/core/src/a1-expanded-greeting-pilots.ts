/** Original A1 situational continuations, first-release languages only.
 * These are editorial candidates, not published audio or certified A1 lessons.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
type LaunchLanguage=(typeof firstReleaseLanguages)[number];
export interface A1ExpandedSeed{
 continuation:readonly [string,string,string,string];
 checks:readonly [
  readonly [string,string,string],
  readonly [string,string,string],
  readonly [string,string,string]
 ];
 spokenFollowUp:string;noMicAlternative:string;
}
const authored:Readonly<Record<LaunchLanguage,A1ExpandedSeed>>={
 'en-CA':{
  continuation:[
   'Thanks, Leo. Is this your first day at the community library?',
   'Yes, it is my first day here. I live near the park.',
   'Welcome! Would you like to meet our learning group after class?',
   'Yes, thank you. I can join the group after class.'
  ],
  checks:[
   ['What is the second person called?','I’m Leo.','The second person introduces herself as Maya.'],
   ['Where does Leo live?','near the park.','Leo lives inside the community library.'],
   ['When can Leo meet the group?','after class.','Leo will meet the group before the library opens.']
  ],
  spokenFollowUp:'Greet a fictional classmate, ask their name and invite them to meet after class using a polite reply.',
  noMicAlternative:'Write two short fictional greetings and a one-sentence invitation without using any private details.'
 },
 'fr-CA':{
  continuation:[
   'Merci, Léo. C’est ta première journée à la bibliothèque du quartier ?',
   'Oui, c’est ma première journée ici. J’habite près du parc.',
   'Bienvenue ! Tu veux rencontrer notre groupe après le cours ?',
   'Oui, merci. Je peux rejoindre le groupe après le cours.'
  ],
  checks:[
   ['Comment s’appelle la deuxième personne ?','Moi, c’est Léo.','La deuxième personne se présente comme Maya.'],
   ['Où habite Léo ?','près du parc.','Léo habite dans la bibliothèque du quartier.'],
   ['Quand Léo peut-il rencontrer le groupe ?','après le cours.','Léo doit rencontrer le groupe avant le début du cours.']
  ],
  spokenFollowUp:'Saluez un personnage fictif, demandez son prénom et proposez une rencontre après le cours.',
  noMicAlternative:'Écrivez deux salutations fictives et une courte invitation, sans indiquer de renseignements personnels.'
 },
 es:{
  continuation:[
   'Gracias, Leo. ¿Es tu primer día en la biblioteca del barrio?',
   'Sí, es mi primer día aquí. Vivo cerca del parque.',
   '¡Bienvenido! ¿Quieres conocer a nuestro grupo después de la clase?',
   'Sí, gracias. Puedo reunirme con el grupo después de la clase.'
  ],
  checks:[
   ['¿Cómo se llama la segunda persona?','Soy Leo.','La segunda persona se presenta con el nombre de Maya.'],
   ['¿Dónde vive Leo?','cerca del parque.','Leo vive dentro de la biblioteca del barrio.'],
   ['¿Cuándo puede reunirse Leo con el grupo?','después de la clase.','Leo se reunirá con el grupo antes de comenzar la clase.']
  ],
  spokenFollowUp:'Saluda a un personaje ficticio, pregunta cómo se llama e invítalo a conocer a tu grupo después de la clase.',
  noMicAlternative:'Escribe dos saludos ficticios y una invitación breve sin incluir datos personales.'
 }
};
export interface A1ExpandedTurn{
 id:string;speaker:'a'|'b';text:string;audioId:string;
}
export interface A1ExpandedCheck{
 afterTurnId:string;question:string;verbatimEvidence:string;unsupportedInterpretation:string;
}
export interface A1ExpandedScene{
 sceneId:string;level:'A1';unitId:'greetings-and-introductions';targetLanguage:LaunchLanguage;
 turns:readonly A1ExpandedTurn[];checks:readonly A1ExpandedCheck[];
 spokenFollowUp:string;noMicAlternative:string;
 editorialStatus:'not-human-reviewed';audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';publicAvailable:false;
 canScore:false;canCertify:false;
}
const unitId='greetings-and-introductions';
export const expandedA1GreetingPilots:readonly A1ExpandedScene[]=firstReleaseLanguages.map(targetLanguage=>{
 const original=a1EditorialDrafts.find(d=>d.targetLanguage===targetLanguage&&d.unitId===unitId);
 if(!original)throw new Error('A1 original missing for '+targetLanguage);
 const seed=authored[targetLanguage],lines=[...original.dialogue,...seed.continuation];
 return {
  sceneId:targetLanguage+'/A1/'+unitId,level:'A1' as const,unitId,targetLanguage,
  turns:lines.map((text,i)=>({id:'turn-'+(i+1),speaker:i%2===0?'a' as const:'b' as const,
   text,audioId:targetLanguage+'/a1/'+unitId+'/turn-'+(i+1)})),
  checks:seed.checks.map(([question,verbatimEvidence,unsupportedInterpretation],i)=>({
   afterTurnId:'turn-'+(2*i+2),question,verbatimEvidence,unsupportedInterpretation
  })),
  spokenFollowUp:seed.spokenFollowUp,noMicAlternative:seed.noMicAlternative,
  editorialStatus:'not-human-reviewed' as const,audioStatus:'not-recorded' as const,
  rightsStatus:'pending-editorial-clearance' as const,publicAvailable:false as const,
  canScore:false as const,canCertify:false as const
 };
});
export const a1ExpandedExpectedAudioIds:readonly string[]=
 expandedA1GreetingPilots.flatMap(scene=>scene.turns.map(turn=>turn.audioId));
/** Validation asserts identity and that every comprehension key appears verbatim
 * in the intended earlier speaker reply, not in an invented answer.
 */
export function auditExpandedA1GreetingPilots(input:unknown=expandedA1GreetingPilots){
 const errors:string[]=[],seen=new Set<string>(),seenAudio=new Set<string>();
 if(!Array.isArray(input)||input.length!==3)return{
  valid:false,errors:['BAD_A1_PILOT_COUNT'],scenes:0,turns:0,checks:0,
  approvedAudio:0,publicAvailable:false as const
 };
 let turns=0,checks=0;
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){
   errors.push('INVALID_A1_PILOT_ROW');continue;
  }
  const row=raw as Partial<A1ExpandedScene>,id=String(row.sceneId);
  if(!firstReleaseLanguages.includes(row.targetLanguage as LaunchLanguage)||
   id!==row.targetLanguage+'/A1/'+unitId||seen.has(id))errors.push('BAD_SCENE_ID '+id);
  seen.add(id);
  const original=a1EditorialDrafts.find(d=>
   d.targetLanguage===row.targetLanguage&&d.unitId===unitId);
  const t=Array.isArray(row.turns)?row.turns:[];
  const q=Array.isArray(row.checks)?row.checks:[];
  turns+=t.length;checks+=q.length;
  if(t.length!==6||q.length!==3||!original||
    t[0]?.text!==original.dialogue[0]||t[1]?.text!==original.dialogue[1])
   errors.push('BROKEN_A1_ORIGINAL '+id);
  t.forEach((turn,i)=>{
   if(!turn||turn.id!=='turn-'+(i+1)||turn.speaker!==(i%2===0?'a':'b')||
      typeof turn.text!=='string'||turn.text.trim().length<15||
      turn.audioId!==row.targetLanguage+'/a1/'+unitId+'/turn-'+(i+1)||
      seenAudio.has(String(turn.audioId)))errors.push('INVALID_A1_TURN '+id+'/'+i);
   if(turn&&typeof turn.audioId==='string')seenAudio.add(turn.audioId);
  });
  q.forEach((check,i)=>{
   if(!check||check.afterTurnId!=='turn-'+(2*i+2)||
    typeof check.question!=='string'||check.question.length<14||
    typeof check.verbatimEvidence!=='string'||check.verbatimEvidence.length<8||
    typeof t[2*i+1]?.text!=='string'||
    !t[2*i+1]!.text.includes(check.verbatimEvidence)||
    typeof check.unsupportedInterpretation!=='string'||
    check.unsupportedInterpretation.length<24)
    errors.push('UNGROUNDED_A1_CHECK '+id+'/'+i);
  });
  if(row.publicAvailable!==false||row.canScore!==false||row.canCertify!==false||
   row.editorialStatus!=='not-human-reviewed'||row.audioStatus!=='not-recorded'||
   row.rightsStatus!=='pending-editorial-clearance')
    errors.push('PREMATURE_A1_RELEASE '+id);
  if(typeof row.spokenFollowUp!=='string'||row.spokenFollowUp.length<55||
    typeof row.noMicAlternative!=='string'||row.noMicAlternative.length<55)
   errors.push('MISSING_A1_FALLBACK '+id);
 }
 return {valid:errors.length===0,errors,scenes:input.length,turns,checks,
  approvedAudio:0,publicAvailable:false as const};
}
