/** First-release B2: 24 original listening/dialogue briefs. Editorial only.
 * Content is not reviewed, recorded, packaged, certified or exposed as learner progress.
 * Core assets and historical journals are unchanged.
 */
import {firstReleaseLanguages,canSelectFirstReleasePair} from './first-release-languages.js';
import {curriculumUnitBlueprint,courseSkills,auditCurriculumProduction,type ProductionUnit} from './learning-paths.js';
import type {TargetLanguage} from './types.js';
export const b2DraftTopics=curriculumUnitBlueprint.B2;
export type B2Topic=(typeof b2DraftTopics)[number];
type FirstTarget=(typeof firstReleaseLanguages)[number];
type B2Seed=readonly [speakerQuestion:string,speakerAnswer:string,listenQuestion:string,evidence:string,outcome:string];
const authored:Readonly<Record<FirstTarget,readonly B2Seed[]>>={
  "en-CA": [
    [
      "Should we keep the late bus permanently?",
      "The survey looks promising, but it excludes evening commuters, so we need better evidence.",
      "Who was not included in the survey?",
      "evening commuters",
      "Assess how missing participants affect the strength of a public argument."
    ],
    [
      "Can I approve the replacement when the form arrives?",
      "First verify the reference number. If it differs, stop the process and ask the supervisor.",
      "What needs verification before approval?",
      "reference number",
      "Relay an operational instruction without dropping its stop condition."
    ],
    [
      "Can we promise delivery to the client on Friday?",
      "No, the shipment date remains unconfirmed. We can explain the contingency plan instead.",
      "What remains uncertain?",
      "shipment date",
      "Communicate a professional uncertainty without inventing a guarantee."
    ],
    [
      "Would a completely silent library serve everyone?",
      "It could help concentration but exclude people who need group discussion and supported learning.",
      "Which activity might be excluded?",
      "group discussion",
      "Explain tensions between accessibility and concentration using a concrete example."
    ],
    [
      "Could we move the meeting to the smaller hall?",
      "Possibly, provided the accessible entrance stays open and every attendee can enter independently.",
      "Which entrance must remain available?",
      "accessible entrance",
      "Negotiate a concession while protecting a non-negotiable access requirement."
    ],
    [
      "Does the article prove that music improves grades?",
      "No. It identifies an association but supplies no evidence of causation, despite the confident headline.",
      "What kind of evidence is missing?",
      "causation",
      "Challenge a misleading headline by separating association from causal proof."
    ],
    [
      "How should I organize the response to residents?",
      "Begin with a factual summary, explain the concerns still unresolved, and only then recommend a course of action.",
      "What should begin the response?",
      "factual summary",
      "Structure a reasoned reply that separates verified facts from proposed action."
    ],
    [
      "Would you support a three-month street redesign?",
      "Only if we monitor accessibility throughout the trial and publish the findings before making a final decision.",
      "What must be monitored during the trial?",
      "accessibility",
      "Take part in a balanced debate with explicit evidence requirements."
    ]
  ],
  "es": [
    [
      "¿Mantendrías para siempre el autobús nocturno?",
      "La encuesta parece prometedora, pero no incluye a quienes viajan de noche, así que faltan pruebas.",
      "¿A quiénes no incluye la encuesta?",
      "quienes viajan de noche",
      "Evaluar cómo una muestra incompleta afecta la fuerza de un argumento público."
    ],
    [
      "¿Puedo aprobar el reemplazo cuando llegue el formulario?",
      "Primero comprueba el número de referencia. Si no coincide, detén el trámite y consulta con la persona responsable.",
      "¿Qué número debe verificarse primero?",
      "número de referencia",
      "Transmitir instrucciones con condiciones y excepciones sin omitir pasos críticos."
    ],
    [
      "¿Podemos prometer que el pedido llegará el viernes?",
      "No, la fecha de entrega sigue sin confirmarse. Podemos explicar el plan alternativo sin garantizar nada.",
      "¿Qué información no está confirmada?",
      "fecha de entrega",
      "Comunicar incertidumbre profesional sin prometer resultados no verificados."
    ],
    [
      "¿Una biblioteca totalmente silenciosa sería inclusiva?",
      "Favorecería la concentración, pero podría excluir a quienes necesitan conversar y estudiar en grupo.",
      "¿Qué actividad podría resultar excluida?",
      "estudiar en grupo",
      "Explicar tensiones entre distintos valores mediante ejemplos concretos."
    ],
    [
      "¿Podemos cambiar la reunión a la sala pequeña?",
      "Quizás, siempre que la entrada accesible permanezca abierta y todas las personas puedan ingresar sin ayuda.",
      "¿Qué entrada debe permanecer abierta?",
      "entrada accesible",
      "Negociar un acuerdo que preserve un requisito esencial de accesibilidad."
    ],
    [
      "¿El artículo demuestra que la música mejora las notas?",
      "No. Describe una asociación, pero no aporta pruebas de causalidad, aunque el titular lo afirme.",
      "¿Qué tipo de pruebas faltan?",
      "causalidad",
      "Cuestionar un titular diferenciando correlación y relaciones causales."
    ],
    [
      "¿Cómo organizo una respuesta a los vecinos?",
      "Comienza con un resumen verificable, explica los asuntos pendientes y luego presenta la recomendación y sus límites.",
      "¿Con qué debe comenzar el texto?",
      "resumen verificable",
      "Organizar una respuesta argumentada separando hechos y propuestas."
    ],
    [
      "¿Apoyarías una prueba de tres meses para rediseñar la calle?",
      "Solo si evaluamos la accesibilidad durante la prueba y publicamos los resultados antes de decidir.",
      "¿Qué debemos evaluar durante la prueba?",
      "accesibilidad",
      "Sostener un debate equilibrado y pedir datos antes de adoptar una postura."
    ]
  ],
  "fr-CA": [
    [
      "Faut-il conserver le bus tardif en permanence ?",
      "Le sondage paraît encourageant, mais il exclut les personnes qui voyagent en soirée; il nous faut plus de preuves.",
      "Qui n'a pas été interrogé ?",
      "personnes qui voyagent en soirée",
      "Évaluer comment un échantillon incomplet affaiblit un argument public."
    ],
    [
      "Puis-je approuver le remplacement dès réception du formulaire ?",
      "Vérifie d'abord le numéro de référence. S'il diffère, suspends la demande et consulte la personne responsable.",
      "Quel numéro faut-il vérifier ?",
      "numéro de référence",
      "Transmettre des consignes complexes sans omettre les conditions d'arrêt."
    ],
    [
      "Peut-on promettre une livraison vendredi au client ?",
      "Non, la date de livraison reste à confirmer. Nous pouvons présenter le plan de rechange sans garantie.",
      "Qu'est-ce qui reste à confirmer ?",
      "date de livraison",
      "Communiquer une incertitude professionnelle sans créer de fausse garantie."
    ],
    [
      "Une bibliothèque entièrement silencieuse serait-elle inclusive ?",
      "Cela aiderait la concentration, mais pourrait exclure les personnes qui ont besoin de travailler en groupe.",
      "Quelle activité pourrait être exclue ?",
      "travailler en groupe",
      "Expliquer les tensions entre deux valeurs avec un exemple concret."
    ],
    [
      "Peut-on déplacer la réunion dans une plus petite salle ?",
      "Peut-être, à condition que l'entrée accessible reste ouverte et que chaque personne puisse entrer sans aide.",
      "Quelle entrée doit rester ouverte ?",
      "entrée accessible",
      "Négocier une concession en protégeant un besoin essentiel d'accessibilité."
    ],
    [
      "L'article prouve-t-il que la musique améliore les notes ?",
      "Non. Il relève une association sans démontrer un lien de cause à effet, malgré son titre catégorique.",
      "Quel lien n'est pas démontré ?",
      "cause à effet",
      "Critiquer un titre en distinguant association et causalité."
    ],
    [
      "Comment structurer notre réponse aux résidents ?",
      "Commencez par un résumé factuel, présentez les préoccupations encore ouvertes, puis la recommandation et ses limites.",
      "Par quoi la réponse doit-elle commencer ?",
      "résumé factuel",
      "Structurer une réponse argumentée en séparant constats et recommandations."
    ],
    [
      "Soutiendrais-tu un réaménagement de la rue pendant trois mois ?",
      "Seulement si l'accessibilité est suivie pendant l'essai et si les résultats sont publiés avant la décision.",
      "Que faut-il suivre pendant l'essai ?",
      "accessibilité",
      "Débattre de manière nuancée avec des conditions de preuve explicites."
    ]
  ]
};
const taskInstructions:Readonly<Record<FirstTarget,readonly [string,string,string,string,string,string]>>={
 'en-CA':['Listen carefully and answer the specific evidence question without guessing.',
 'Respond aloud, qualify your view and acknowledge one limitation of the evidence.',
 'Read the exchange and distinguish an explicit claim from an inference.',
 'Write a fictional reasoned response with a clear position and a qualification.',
 'Negotiate a response with a partner and check any condition explicitly.',
 'Summarize both positions faithfully without removing uncertainty.'],
 es:['Escucha atentamente y responde a la pregunta concreta sin adivinar.',
 'Expón en voz alta tu opinión y reconoce al menos una limitación de las pruebas.',
 'Lee el intercambio y distingue lo afirmado de lo que solo se infiere.',
 'Redacta una respuesta ficticia razonada con una reserva explícita.',
 'Negocia la situación con otra persona y confirma las condiciones.',
 'Resume las distintas posturas sin inventar certezas.'],
 'fr-CA':['Écoutez attentivement et répondez à la question sans deviner.',
 'Exprimez votre avis à voix haute en reconnaissant une limite des preuves.',
 'Lisez le dialogue et distinguez les affirmations des déductions.',
 'Rédigez une réponse fictive argumentée avec une réserve claire.',
 'Négociez une solution avec un partenaire en vérifiant les conditions.',
 'Résumez les deux positions sans effacer les incertitudes.']
};
export interface B2EditorialDraft extends ProductionUnit {
 level:'B2';unitId:B2Topic;status:'draft';
 dialogue:readonly [string,string];listeningQuestion:string;answerEvidence:string;
 editorialStatus:'not-human-reviewed';audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';publicAvailable:false;
}
export const b2EditorialDrafts:readonly B2EditorialDraft[]=firstReleaseLanguages.flatMap(targetLanguage=>
 b2DraftTopics.map((unitId,i):B2EditorialDraft=>{
  const seed=authored[targetLanguage][i]!;
  return {targetLanguage,level:'B2',unitId,revision:'0.1.0',status:'draft',
   outcomes:[seed[4]],dialogue:[seed[0],seed[1]],
   listeningQuestion:seed[2],answerEvidence:seed[3],
   activities:courseSkills.map((skill,j)=>({
    id:'activity-'+skill,skill,prompt:taskInstructions[targetLanguage][j]+' Situation: '+seed[4]
   })),
   editorialStatus:'not-human-reviewed',audioStatus:'not-recorded',
   rightsStatus:'pending-editorial-clearance',publicAvailable:false
  };
 })
);
export const b2AudioExpectedIds:readonly string[]=b2EditorialDrafts.flatMap(item=>
 item.dialogue.map((_,i)=>[item.targetLanguage,'b2',item.unitId,'dialogue-'+(i+1)].join('/')));
export const b2AudioBaseline={expected:b2AudioExpectedIds.length,verified:0,
 missing:b2AudioExpectedIds,readyForEditorialPlayback:false,readyForPublicRelease:false} as const;
/** Editor-only preview. This result is never a session activity or a scoring rule. */
export function b2LocalizedPreview(known:TargetLanguage,target:TargetLanguage,unitId:B2Topic){
 if(!canSelectFirstReleasePair(known,target)||!b2DraftTopics.includes(unitId))return null;
 const row=b2EditorialDrafts.find(x=>x.targetLanguage===target&&x.unitId===unitId);
 if(!row||row.publicAvailable!==false||row.audioStatus!=='not-recorded'||
  row.editorialStatus!=='not-human-reviewed'||row.rightsStatus!=='pending-editorial-clearance')return null;
 return {status:'editorial-only' as const,knownLanguage:known,targetLanguage:target,unitId,
  outcome:row.outcomes[0]!,dialogue:row.dialogue,listeningQuestion:row.listeningQuestion,
  answerEvidence:row.answerEvidence,helpInstructions:taskInstructions[known as FirstTarget],
  publicAvailable:false as const,readyForListening:false as const,readyForAssessment:false as const};
}
/** Editorial structure is necessary, never sufficient for approval or certification. */
export function auditB2EditorialDrafts(drafts:readonly B2EditorialDraft[]=b2EditorialDrafts){
 const report=auditCurriculumProduction(drafts),errors=[...report.errors],seen=new Set<string>();
 for(const row of drafts){
  const id=row.targetLanguage+'/'+row.unitId;
  if(seen.has(id))errors.push('DUPLICATE_B2 '+id);
  seen.add(id);
  if(!firstReleaseLanguages.includes(row.targetLanguage as FirstTarget)||
   row.level!=='B2'||!b2DraftTopics.includes(row.unitId)||row.status!=='draft')
    errors.push('WRONG_B2_SCOPE '+id);
  if(row.publicAvailable!==false||row.audioStatus!=='not-recorded'||
   row.editorialStatus!=='not-human-reviewed'||row.rightsStatus!=='pending-editorial-clearance')
    errors.push('PREMATURE_B2_PUBLICATION '+id);
  if(row.outcomes.length!==1||row.outcomes[0]!.trim().length<25||
   row.dialogue.length!==2||row.dialogue.some(x=>x.trim().length<25))
    errors.push('INCOMPLETE_B2_DIALOGUE '+id);
  if(row.listeningQuestion.trim().length<15||row.answerEvidence.trim().length<7||
   !row.dialogue[1]?.includes(row.answerEvidence))
    errors.push('UNGROUNDED_B2_LISTENING '+id);
  if(row.activities.length!==6||!courseSkills.every(skill=>
    row.activities.filter(a=>a.skill===skill&&a.prompt.trim().length>=25).length===1))
    errors.push('INCOMPLETE_B2_SKILLS '+id);
 }
 for(const language of firstReleaseLanguages)for(const topic of b2DraftTopics)
  if(!seen.has(language+'/'+topic))errors.push('MISSING_B2_DRAFT '+language+'/'+topic);
 return {valid:errors.length===0,errors,plannedFirstReleaseUnits:24,
  actualDrafts:drafts.length,approvedUnits:0,recordedAudioTurns:0,
  readyForPublicRelease:false as const};
}
