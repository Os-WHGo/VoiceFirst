/** Offline authored examples for literal/implicit meaning. Interpretations are
 * hypotheses, never diagnoses or definitive mind-reading. */
export type PragmaticsDetail='brief'|'step-by-step';
export interface PragmaticsScenario {
 id:string;locale:'es'|'es-CL'|'en-CA';utterance:string;literal:string;
 possibleMeaning:string;observableCue:string;uncertainty:string;
 clarification:string;ageSafe:true;
}
export const pragmaticsScenarios:readonly PragmaticsScenario[]=[
 {id:'late-sarcasm-es',locale:'es',utterance:'¡Qué puntual eres!',literal:'La frase elogia la puntualidad.',possibleMeaning:'Si alguien llegó tarde, podría ser una crítica sarcástica.',observableCue:'La persona llegó treinta minutos después de la hora acordada.',uncertainty:'Sin conocer el tono y la relación, también podría ser una broma amistosa.',clarification:'Perdón por llegar tarde. ¿Te molestó?',ageSafe:true},
 {id:'chile-cachaste',locale:'es-CL',utterance:'¿Cachaste?',literal:'En Chile puede significar «¿entendiste?»',possibleMeaning:'Podría ser una pregunta amistosa para confirmar comprensión.',observableCue:'La persona acaba de explicar cómo llegar a un lugar.',uncertainty:'El tono y la relación pueden cambiar cómo se recibe.',clarification:'Sí, entendí. ¿Me lo puedes repetir por favor?',ageSafe:true},
 {id:'great-timing-en',locale:'en-CA',utterance:'Great timing!',literal:'La frase elogia haber llegado en el momento adecuado.',possibleMeaning:'Si alguien interrumpe un momento complicado, podría ser irónica.',observableCue:'La persona llegó durante una situación estresante.',uncertainty:'Sin más contexto, podría ser un elogio sincero.',clarification:'Do you mean now is a good time, or should I come back later?',ageSafe:true},
];
export function explainPragmatics(id:string,detail:PragmaticsDetail='step-by-step'){
 const s=pragmaticsScenarios.find(x=>x.id===id);
 if(!s)return null;
 return detail==='brief'
 ?{id:s.id,utterance:s.utterance,possibleMeaning:s.possibleMeaning,uncertainty:s.uncertainty,clarification:s.clarification}
 :{...s};
}
