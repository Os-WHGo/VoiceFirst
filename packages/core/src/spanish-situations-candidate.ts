/** Original Spanish (es) situations, review-only. No audio, CEFR certification or publication. */
export interface SpanishSituationCandidate {
 id:string;locale:'es';level:'A1'|'A2';title:string;goal:string;
 dialogue:readonly [string,string];focus:string;prompts:readonly string[];
 status:'not-human-reviewed';rights:'pending-editorial-clearance';
 audio:'not-recorded';publishable:false;
}
export const spanishSituationCandidates:readonly SpanishSituationCandidate[]=[
 {id:'es-a1-transporte',locale:'es',level:'A1',title:'Preguntar por una parada',goal:'Pedir información básica sobre una parada de transporte.',dialogue:['Disculpe, ¿dónde está la parada de autobús?','Está al lado de la biblioteca.'],focus:'¿Dónde está...? y referencias de lugar.',prompts:['Leer el diálogo e identificar el destino.','Escribir una pregunta sobre una parada ficticia.','Practicar una respuesta corta usando al lado de.'],status:'not-human-reviewed',rights:'pending-editorial-clearance',audio:'not-recorded',publishable:false},
 {id:'es-a1-compras',locale:'es',level:'A1',title:'Consultar un precio',goal:'Preguntar cuánto cuesta un artículo.',dialogue:['Buenos días, ¿cuánto cuesta este cuaderno?','Cuesta tres mil pesos.'],focus:'¿Cuánto cuesta...? y cantidades.',prompts:['Leer el diálogo y reconocer el precio.','Escribir el precio de un artículo imaginario.','Responder con una cantidad diferente.'],status:'not-human-reviewed',rights:'pending-editorial-clearance',audio:'not-recorded',publishable:false},
 {id:'es-a2-salud',locale:'es',level:'A2',title:'Pedir una hora de atención',goal:'Solicitar información general para agendar una consulta.',dialogue:['Hola, quisiera pedir una hora para mañana.','Tenemos una hora disponible a las diez.'],focus:'Quisiera y expresiones de fecha y hora.',prompts:['Leer el diálogo e identificar la hora propuesta.','Redactar una solicitud ficticia sin datos médicos.','Responder aceptando o pidiendo otro horario.'],status:'not-human-reviewed',rights:'pending-editorial-clearance',audio:'not-recorded',publishable:false},
 {id:'es-a2-vivienda',locale:'es',level:'A2',title:'Consultar por una habitación',goal:'Preguntar por las condiciones básicas de un alojamiento.',dialogue:['Hola, ¿la habitación incluye los gastos de luz?','Sí, están incluidos en el precio mensual.'],focus:'Preguntas de inclusión y precio mensual.',prompts:['Leer e identificar qué gasto está incluido.','Escribir dos preguntas sobre una habitación ficticia.','Comparar dos anuncios inventados sin compartir datos privados.'],status:'not-human-reviewed',rights:'pending-editorial-clearance',audio:'not-recorded',publishable:false}
];
export function auditSpanishSituationCandidates(items:readonly SpanishSituationCandidate[]=spanishSituationCandidates){
 const errors:string[]=[],seen=new Set<string>();
 for(const item of items){
  if(seen.has(item.id))errors.push('Duplicate '+item.id);seen.add(item.id);
  if(!/^es-a[12]-[a-z-]+$/.test(item.id)||item.locale!=='es'||!['A1','A2'].includes(item.level))errors.push('Invalid identity '+item.id);
  if(item.status!=='not-human-reviewed'||item.rights!=='pending-editorial-clearance'||item.audio!=='not-recorded'||item.publishable!==false)errors.push('Unsafe release flags '+item.id);
  if(item.dialogue.length!==2||item.dialogue.some(s=>s.trim().length<15)||item.prompts.length!==3||item.prompts.some(s=>s.trim().length<20))errors.push('Incomplete content '+item.id);
 }
 return {valid:errors.length===0&&items.length>0,errors,reviewOnly:true as const,readyForPublicRelease:false as const};
}
