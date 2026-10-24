/** External learning-resource directory, hand-curated, not scraped or redistributed.
 * No third-party text/audio/video is embedded, cached or represented as our own work.
 */
import type {TargetLanguage} from './types.js';
export type ResourceFocus = 'general'|'speaking'|'work'|'kids'|'culture';
export interface FreeLearningResource {
  id:string;
  language:TargetLanguage;
  title:string;
  publisher:string;
  url:string;
  topics:readonly ResourceFocus[];
  access:'free-to-access'|'free-course-enrollment-varies';
  reuse:'external-link-only';
  /** Every external resource still requires Internet and its own terms. */
  needsInternet:true;
  childUse:'requires-guardian-review'|'general-audience';
}
export const freeLearningResources: readonly FreeLearningResource[]=[
  {id:'british-council-speaking',language:'en-CA',title:'LearnEnglish: Speaking A1–B2',publisher:'British Council',url:'https://learnenglish.britishcouncil.org/free-resources/speaking',topics:['general','speaking','work'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'cambridge-family-speaking',language:'en-CA',title:'Speaking outside the classroom',publisher:'Cambridge English',url:'https://www.cambridgeenglish.org/learning-english/parents-and-children/your-childs-interests/practising-speaking-outside-the-classroom/',topics:['kids','speaking'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'requires-guardian-review'},
  {id:'tv5monde',language:'fr-CA',title:'Apprendre le français: A1–B2',publisher:'TV5MONDE',url:'https://apprendre.tv5monde.com/es',topics:['general','culture'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'quebec-francisation',language:'fr-CA',title:'Outils et ressources en français',publisher:'Gouvernement du Québec',url:'https://www.quebec.ca/education/apprendre-le-francais/outils-ressources',topics:['work','general'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'fun-mooc-a1',language:'fr-CA',title:'Vivre en France A1',publisher:'France Université Numérique',url:'https://www.fun-mooc.fr/en/cours/vivre-en-france-a1/',topics:['general','culture'],access:'free-course-enrollment-varies',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'cervantes-microcurso',language:'es',title:'Descubre tu ciudad ideal: microcurso',publisher:'Instituto Cervantes',url:'https://cervantes.org/es/aprender-ensenar/cursos/cursos-espanol-online',topics:['general','culture'],access:'free-course-enrollment-varies',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'ufc-brazilian-portuguese',language:'pt-BR',title:'Português Brasileiro A1 (ediciones)',publisher:'Universidade Federal do Ceará',url:'https://casasdeculturaestrangeira.ufc.br/pt/curso-portugues-brasileiro-nivel-a1/',topics:['general'],access:'free-course-enrollment-varies',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'goethe-deutsch-fuer-dich',language:'de',title:'Deutsch für dich: A1–C2',publisher:'Goethe-Institut',url:'https://www.goethe.de/prj/dfd/en/home.cfm',topics:['general','speaking','work','culture'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
  {id:'goethe-kids',language:'de',title:'Deutsch üben: Kinder & Jugendliche',publisher:'Goethe-Institut',url:'https://www.goethe.de/de/spr/ueb.html',topics:['kids','culture'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'requires-guardian-review'},
  {id:'rai-italiano',language:'it',title:'Corso di italiano per stranieri: A1–B2',publisher:'Rai Scuola',url:'https://www.raiscuola.rai.it/percorsi/corsoditalianoperstranieri',topics:['general','speaking','culture'],access:'free-to-access',reuse:'external-link-only',needsInternet:true,childUse:'general-audience'},
];
/** Simple local directory search. Live video search needs separate authenticated API + policy review. */
export function findFreeResources(language:TargetLanguage,query='',topic?:ResourceFocus):FreeLearningResource[]{
  const q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  return freeLearningResources.filter(r=>r.language===language&&(!topic||r.topics.includes(topic))&&(
    !q||[r.title,r.publisher,...r.topics].some(v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q))
  ));
}
