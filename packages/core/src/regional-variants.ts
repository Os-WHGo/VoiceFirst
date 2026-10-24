/** Curated, original regional language examples. No geolocation, LLM or remote call.
 * Variation represents common usage, not exclusive national rules or voice accuracy.
 * The small starter catalog is NOT full dialect coverage and has no recorded accents.
 */
import type {TargetLanguage} from './types.js';

export const englishVariants=['en-CA','en-US','en-GB'] as const;
export const frenchVariants=['fr-CA','fr-FR'] as const;
export type LanguageVariant=typeof englishVariants[number]|typeof frenchVariants[number];
export type VariantDisplay='hidden'|'on-demand'|'always';
export type ComparisonTopic='everyday'|'work';
export type ExpressionRegister='neutral'|'informal'|'polite';
export interface RegionalExample {
  locale: LanguageVariant;
  /** Short original phrase, not quoted from the external dictionary. */
  sentence: string;
  register: ExpressionRegister;
  usageNote: string;
  /** Source corroborates usage or terminology, not this authored sentence. */
  referenceUrl: string;
  voice: 'system-unverified';
}
export interface RegionalSituation {
  id:string;
  language:'en'|'fr';
  topic:ComparisonTopic;
  cefr:'A1'|'A2';
  intentEs:string;
  examples:readonly RegionalExample[];
  authoring:'original';
}
const OXFORD_BATHROOM='https://www.oxfordlearnersdictionaries.com/definition/english/toilet';
const OXFORD_WASHROOM='https://www.oxfordlearnersdictionaries.com/us/definition/english/washroom';
const BRITISH_COUNCIL='https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/british-english-american-english';
const OQLF_DEPANNEUR='https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/1299675/depanneur';
const ACADEMY_DEPANNEUR='https://www.dictionnaire-academie.fr/article/A9D1428';
const OXFORD_TAKEOUT='https://www.oxfordlearnersdictionaries.com/us/definition/english/takeout';
const OXFORD_TAKEAWAY='https://www.oxfordlearnersdictionaries.com/definition/english/takeaway';
const OQLF_STATIONNEMENT='https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/1298970/parc-de-stationnement';
const LAROUSSE_PARKING='https://www.larousse.fr/dictionnaires/francais/parking/58227';
export const regionalSituations:readonly RegionalSituation[]=[
  {id:'en-find-public-facilities',language:'en',topic:'everyday',cefr:'A1',intentEs:'Preguntar dónde están los baños en un lugar público',authoring:'original',examples:[
    {locale:'en-CA',sentence:'Excuse me, where is the washroom?',register:'polite',usageNote:'Washroom es especialmente habitual en Canadá, aunque otras formas también se entienden.',referenceUrl:OXFORD_WASHROOM,voice:'system-unverified'},
    {locale:'en-US',sentence:'Excuse me, where is the restroom?',register:'polite',usageNote:'Restroom es frecuente en establecimientos públicos de Estados Unidos.',referenceUrl:OXFORD_BATHROOM,voice:'system-unverified'},
    {locale:'en-GB',sentence:'Excuse me, where are the toilets?',register:'polite',usageNote:'Toilets es habitual en señalética y lugares públicos del Reino Unido.',referenceUrl:OXFORD_BATHROOM,voice:'system-unverified'},
  ]},
  {id:'en-find-elevator',language:'en',topic:'work',cefr:'A1',intentEs:'Preguntar dónde está el ascensor en un edificio',authoring:'original',examples:[
    {locale:'en-CA',sentence:'Excuse me, where is the elevator?',register:'polite',usageNote:'Elevator es habitual en Canadá y Estados Unidos.',referenceUrl:BRITISH_COUNCIL,voice:'system-unverified'},
    {locale:'en-US',sentence:'Excuse me, where is the elevator?',register:'polite',usageNote:'Elevator es la forma habitual estadounidense.',referenceUrl:BRITISH_COUNCIL,voice:'system-unverified'},
    {locale:'en-GB',sentence:'Excuse me, where is the lift?',register:'polite',usageNote:'Lift es habitual en el Reino Unido; elevator también se comprende.',referenceUrl:BRITISH_COUNCIL,voice:'system-unverified'},
  ]},
  {id:'en-takeaway-meal',language:'en',topic:'everyday',cefr:'A2',intentEs:'Pedir una comida para llevar',authoring:'original',examples:[
    {locale:'en-CA',sentence:'Could I order this for takeout, please?',register:'polite',usageNote:'Takeout es una palabra norteamericana habitual también en Canadá; no excluye to go.',referenceUrl:OXFORD_TAKEOUT,voice:'system-unverified'},
    {locale:'en-US',sentence:'Can I get this to go, please?',register:'polite',usageNote:'To go es corriente en los Estados Unidos y también se oye en Canadá.',referenceUrl:OXFORD_TAKEOUT,voice:'system-unverified'},
    {locale:'en-GB',sentence:'Could I have this to take away, please?',register:'polite',usageNote:'To take away y takeaway son usos británicos comunes; hay variación entre hablantes.',referenceUrl:OXFORD_TAKEAWAY,voice:'system-unverified'},
  ]},
  {id:'fr-find-parking',language:'fr',topic:'everyday',cefr:'A2',intentEs:'Preguntar dónde hay un estacionamiento cercano',authoring:'original',examples:[
    {locale:'fr-CA',sentence:'Où est le stationnement le plus proche, s’il vous plaît ?',register:'polite',usageNote:'Stationnement para el lugar es un uso frecuente en Quebec y Canadá francófono; la expresión también tiene otros significados.',referenceUrl:OQLF_STATIONNEMENT,voice:'system-unverified'},
    {locale:'fr-FR',sentence:'Où est le parking le plus proche, s’il vous plaît ?',register:'polite',usageNote:'Parking es corriente en Francia, aunque parc de stationnement también es válido y suele recomendarse como alternativa.',referenceUrl:LAROUSSE_PARKING,voice:'system-unverified'},
  ]},
  {id:'fr-convenience-shop',language:'fr',topic:'everyday',cefr:'A2',intentEs:'Preguntar por una pequeña tienda de artículos cotidianos',authoring:'original',examples:[
    {locale:'fr-CA',sentence:'Excusez-moi, où est le dépanneur le plus proche ?',register:'polite',usageNote:'Dépanneur nombra en Quebec una pequeña tienda de artículos corrientes, con horario extendido.',referenceUrl:OQLF_DEPANNEUR,voice:'system-unverified'},
    {locale:'fr-FR',sentence:'Excusez-moi, où est la petite épicerie la plus proche ?',register:'polite',usageNote:'Petite épicerie describe una tienda de alimentación pequeña; no siempre ofrece exactamente los mismos servicios que un dépanneur.',referenceUrl:ACADEMY_DEPANNEUR,voice:'system-unverified'},
  ]},
];
export interface RegionalPreferences {
  primary:LanguageVariant;
  compare:readonly LanguageVariant[];
  display:VariantDisplay;
  /** Do not penalize regional language when it expresses the accepted intent. */
  acceptRegionalAlternatives:boolean;
}
export function variantsFor(target:TargetLanguage): readonly LanguageVariant[]{
  if(target==='en-CA')return englishVariants;
  if(target==='fr-CA')return frenchVariants;
  return [];
}
export function defaultRegionalPreferences(target:TargetLanguage):RegionalPreferences|null{
  const supported=variantsFor(target);
  if(!supported.length)return null;
  return {primary:supported[0]!,compare:supported.slice(1),display:'on-demand',acceptRegionalAlternatives:true};
}
export function validateRegionalPreferences(target:TargetLanguage,value:unknown):RegionalPreferences|null{
  const base=defaultRegionalPreferences(target);
  if(!base)return null;
  if(!value||typeof value!=='object')return base;
  const input=value as Partial<RegionalPreferences>;
  const supported=variantsFor(target);
  const primary=supported.includes(input.primary as LanguageVariant)?input.primary as LanguageVariant:base.primary;
  const compare=Array.isArray(input.compare)?Array.from(new Set(input.compare.filter((v):v is LanguageVariant=>typeof v==='string'&&supported.includes(v as LanguageVariant)&&v!==primary))):base.compare.filter(v=>v!==primary);
  const display=['hidden','on-demand','always'].includes(input.display??'')?input.display!:base.display;
  return {primary,compare,display,acceptRegionalAlternatives:input.acceptRegionalAlternatives!==false};
}
export function regionalExamplesFor(target:TargetLanguage,prefs:RegionalPreferences,showComparison=false,topic?:ComparisonTopic){
  const supported=variantsFor(target);
  if(!supported.includes(prefs.primary))return [];
  const group=target==='en-CA'?'en':'fr';
  const permitted=[prefs.primary,...(prefs.display==='always'||(prefs.display==='on-demand'&&showComparison)?prefs.compare:[])];
  return regionalSituations.filter(s=>s.language===group&&(!topic||s.topic===topic)).map(s=>({
    ...s,examples:permitted.map(locale=>s.examples.find(v=>v.locale===locale)).filter((x):x is RegionalExample=>!!x)
  })).filter(s=>s.examples.length>0);
}
