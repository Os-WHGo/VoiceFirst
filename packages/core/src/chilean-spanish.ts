/** Original Chilean Spanish launch seed. Regional course, not a seventh language.
 * Curated written examples; speech/accent and CEFR equivalence unvalidated.
 * No generative AI, network dependency or copyrighted course imports.
 */
export type ChileanRoute='from-zero'|'spanish-speaker';
export type ChileanRegister='neutral'|'colloquial';
export interface ChileanExpression {
 id:string;standard:string;chilean:string;meaningEn:string;
 register:ChileanRegister;context:string;avoidInFormal:boolean;
}
export const chileanSpanishLaunchExpressions:readonly ChileanExpression[]=[
 {id:'understand',standard:'¿Entendiste?',chilean:'¿Cachaste?',meaningEn:'Did you get it?',register:'colloquial',context:'Conversación informal entre personas con confianza',avoidInFormal:true},
 {id:'work',standard:'Voy al trabajo.',chilean:'Voy a la pega.',meaningEn:'I am going to work.',register:'colloquial',context:'Conversación cotidiana sobre trabajo',avoidInFormal:true},
 {id:'boring',standard:'Qué aburrido.',chilean:'Qué fome.',meaningEn:'How boring.',register:'colloquial',context:'Opinión informal sobre una situación',avoidInFormal:true},
 {id:'child',standard:'Es un niño pequeño.',chilean:'Es un cabro chico.',meaningEn:'He is a little kid.',register:'colloquial',context:'Conversación informal sobre un niño',avoidInFormal:true},
 {id:'embarrassing',standard:'Qué vergüenza.',chilean:'Qué plancha.',meaningEn:'How embarrassing.',register:'colloquial',context:'Situación informal que causa vergüenza',avoidInFormal:true},
 {id:'greeting',standard:'¿Cómo estás?',chilean:'¿Cómo está?',meaningEn:'How are you?',register:'neutral',context:'Tratamiento de usted, no exclusivo de Chile',avoidInFormal:false},
];
export const chileanSpanishRoutes:readonly {id:ChileanRoute;title:string;description:string}[]=[
 {id:'from-zero',title:'Español chileno desde cero',description:'Español comprensible desde el inicio, con situaciones chilenas y modismos introducidos gradualmente.'},
 {id:'spanish-speaker',title:'Chileno cotidiano',description:'Reconocer modismos, registros y expresiones locales sin tratar otras variedades como errores.'},
];
export function chileanSpanishExample(id:string){return chileanSpanishLaunchExpressions.find(x=>x.id===id)??null;}
