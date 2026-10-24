/** Original A1 editorial drafts for all six launch languages.
 * Not learner-visible, reviewed, narrated, or CEFR-certified. Each activity is an
 * authoring prompt, not a functional assessment until its media/UI are built.
 */
import {targetLanguages,type TargetLanguage} from './types.js';
import {auditCurriculumProduction,courseSkills, type ProductionUnit, type CourseSkill} from './learning-paths.js';

export const a1DraftTopics=['greetings-and-introductions','personal-information'] as const;
export type A1DraftTopic=(typeof a1DraftTopics)[number];
export const a1VocabularyConcepts={
 'greetings-and-introductions':['hello','state-name','meet-someone','farewell'],
 'personal-information':['state-origin','state-residence','state-language','ask-repeat']
} as const satisfies Record<A1DraftTopic,readonly string[]>;
type TopicSeed={
 outcome:string;
 grammar:string;
 dialogue:readonly [string,string];
 /** Four pedagogical phrase patterns for named semantic concepts, not a complete dictionary. */
 vocabulary:readonly [string,string,string,string];
 /** Listening, speaking, reading, writing, interaction, mediation: content briefs only. */
 tasks:readonly [string,string,string,string,string,string];
};
const authoring:Readonly<Record<TargetLanguage,Readonly<Record<'greeting'|'personal',TopicSeed>>>>={
 'en-CA':{
 greeting:{
  outcome:'Introduce yourself and respond politely to a first greeting.',
  grammar:'Practise the difference between I am and my name is; keep the social register consistent.',
  dialogue:['Hello! My name is Ana.','Hi, Ana. I’m Leo. Nice to meet you.'],
  vocabulary:['Hello','My name is','Nice to meet you','Goodbye'],
  tasks:[
   'Listen to a recorded greeting and identify the names and closing phrase.',
   'Say your name and introduce yourself in one short sentence.',
   'Read the two-person dialogue and identify who introduces themselves first.',
   'Write two sentences introducing a fictional person.',
   'Practise greeting and replying with a partner, allowing time to answer.',
   'Explain to a new learner when to use Hello rather than Goodbye.'
  ]
 },
 personal:{
  outcome:'Ask and answer simple questions about origin, residence and language.',
  grammar:'Contrast where are you from with where do you live; use short present-tense answers.',
  dialogue:['Where are you from?','I’m from Canada. I live in Vancouver.'],
  vocabulary:['I’m from','I live in','I speak','Could you repeat that?'],
  tasks:[
   'Listen for a country and a city in a short dialogue using approved audio when available.',
   'Answer Where are you from? with an invented country or your own choice.',
   'Read two profiles and match each city to its country.',
   'Write an imaginary short profile with city and languages.',
   'Ask and answer two personal-information questions without requesting private addresses.',
   'Restate the speaker’s city in simple words for a learner who missed it.'
  ]
 },
 },
 'fr-CA':{
 greeting:{
  outcome:'Saluer quelqu’un, se présenter et répondre poliment.',
  grammar:'Distinguer je m’appelle et moi, c’est; comparer bonjour et salut selon le contexte.',
  dialogue:['Bonjour! Je m’appelle Ana.','Bonjour, Ana! Moi, c’est Léo. Enchanté.'],
  vocabulary:['Bonjour','Je m’appelle','Enchanté','Au revoir'],
  tasks:[
   'Écouter un échange avec une voix vérifiée et repérer les prénoms.',
   'Dire son prénom avec je m’appelle dans une courte phrase.',
   'Lire le dialogue et relever deux façons de se présenter.',
   'Écrire deux phrases pour présenter un personnage fictif.',
   'Saluer une autre personne et lui répondre avec politesse.',
   'Expliquer simplement à un partenaire quand utiliser bonjour ou au revoir.'
  ]
 },
 personal:{
  outcome:'Demander et donner des renseignements généraux sur un pays et une ville.',
  grammar:'Observer la différence entre venir de et habiter à, sans inventer d’adresse.',
  dialogue:['D’où venez-vous?','Je viens du Canada. J’habite à Montréal.'],
  vocabulary:['Je viens de','J’habite à','Je parle','Pouvez-vous répéter?'],
  tasks:[
   'Écouter une présentation approuvée et identifier pays et ville.',
   'Dire d’où vient un personnage fictif en une phrase.',
   'Lire une fiche fictive et associer la ville au pays.',
   'Écrire une petite présentation avec pays, ville et langue.',
   'Poser deux questions simples sur la ville et le pays.',
   'Reformuler le lieu de résidence pour une autre personne en français simple.'
  ]
 }
 },
 es:{
 greeting:{
  outcome:'Saludar, presentarse y responder de forma apropiada.',
  grammar:'Comparar me llamo con soy; distinguir hola de adiós en situaciones cotidianas.',
  dialogue:['¡Hola! Me llamo Ana.','Mucho gusto, Ana. Soy Leo.'],
  vocabulary:['Hola','Me llamo','Mucho gusto','Adiós'],
  tasks:[
   'Escuchar un saludo con audio revisado e identificar los dos nombres.',
   'Decir tu nombre utilizando me llamo.',
   'Leer el diálogo e identificar las expresiones de presentación.',
   'Escribir dos frases para presentar a una persona ficticia.',
   'Saludar y responder a otra persona usando un registro adecuado.',
   'Explicar a un compañero la diferencia entre saludar y despedirse.'
  ]
 },
 personal:{
  outcome:'Preguntar y responder sobre país, ciudad e idioma con frases breves.',
  grammar:'Distinguir soy de y vivo en; emplear el presente de hablar en contextos sencillos.',
  dialogue:['¿De dónde eres?','Soy de Chile. Vivo en Temuco.'],
  vocabulary:['Soy de','Vivo en','Hablo','¿Puedes repetir?'],
  tasks:[
   'Escuchar una presentación verificada y reconocer país y ciudad.',
   'Contar de dónde viene un personaje ficticio.',
   'Leer perfiles y distinguir país de residencia y ciudad.',
   'Escribir una ficha inventada con ciudad e idioma.',
   'Preguntar y responder de dónde es una persona sin solicitar datos privados.',
   'Explicar con palabras sencillas dónde vive otra persona.'
  ]
 }
 },
 'pt-BR':{
 greeting:{
  outcome:'Cumprimentar alguém, apresentar-se e responder com educação.',
  grammar:'Diferenciar eu sou e meu nome é; observar olá e tchau em situações cotidianas.',
  dialogue:['Olá! Meu nome é Ana.','Oi, Ana! Eu sou Leo. Prazer.'],
  vocabulary:['Olá','Meu nome é','Prazer','Tchau'],
  tasks:[
   'Ouvir um diálogo validado e identificar os nomes dos participantes.',
   'Dizer o próprio nome usando meu nome é.',
   'Ler o diálogo e localizar duas expressões de apresentação.',
   'Escrever duas frases apresentando uma pessoa fictícia.',
   'Cumprimentar e responder a alguém em um diálogo breve.',
   'Explicar em palavras simples a diferença entre olá e tchau.'
  ]
 },
 personal:{
  outcome:'Fazer perguntas simples sobre país, cidade e idiomas.',
  grammar:'Comparar sou de e moro em; usar falo para idiomas sem indicar endereço particular.',
  dialogue:['De onde você é?','Sou do Brasil. Moro em Curitiba.'],
  vocabulary:['Sou de','Moro em','Falo','Pode repetir?'],
  tasks:[
   'Ouvir um exemplo revisado e reconhecer país e cidade.',
   'Dizer de qual país vem um personagem fictício.',
   'Ler duas apresentações e distinguir país de cidade.',
   'Escrever uma apresentação fictícia com país e idioma.',
   'Perguntar e responder onde alguém mora sem pedir endereço.',
   'Explicar para outra pessoa a cidade mencionada no diálogo.'
  ]
 }
 },
 de:{
 greeting:{
  outcome:'Eine Person begrüßen, sich vorstellen und höflich antworten.',
  grammar:'Ich heiße und ich bin vergleichen; Hallo und Auf Wiedersehen unterscheiden.',
  dialogue:['Hallo! Ich heiße Ana.','Hallo, Ana! Ich bin Leo. Freut mich.'],
  vocabulary:['Hallo','Ich heiße','Freut mich','Auf Wiedersehen'],
  tasks:[
   'Einen geprüften Begrüßungsdialog hören und die Namen erkennen.',
   'Sich mit einem kurzen Satz und ich heiße vorstellen.',
   'Den Dialog lesen und zwei Begrüßungen markieren.',
   'Zwei Sätze über eine erfundene Person schreiben.',
   'Ein einfaches Begrüßungsgespräch mit einer anderen Person führen.',
   'Einem Lernpartner den Unterschied zwischen Hallo und Auf Wiedersehen erklären.'
  ]
 },
 personal:{
  outcome:'Nach Herkunft, Wohnort und Sprachen in einfachen Sätzen fragen.',
  grammar:'Ich komme aus und ich wohne in unterscheiden; höfliches Sie bei Fragen beachten.',
  dialogue:['Woher kommen Sie?','Ich komme aus Deutschland. Ich wohne in Berlin.'],
  vocabulary:['Ich komme aus','Ich wohne in','Ich spreche','Können Sie das wiederholen?'],
  tasks:[
   'Ein geprüftes Beispiel hören und Land und Stadt erkennen.',
   'Die Herkunft einer erfundenen Person nennen.',
   'Zwei kurze Profile lesen und Länder den Städten zuordnen.',
   'Ein fiktives Profil mit Wohnort und Sprache schreiben.',
   'Zwei höfliche Fragen zur Herkunft und zum Wohnort stellen.',
   'Den Wohnort einer Person für einen Lernpartner einfach wiedergeben.'
  ]
 }
 },
 it:{
 greeting:{
  outcome:'Salutare una persona, presentarsi e rispondere con cortesia.',
  grammar:'Confrontare mi chiamo e sono; distinguere ciao e arrivederci nei contesti d’uso.',
  dialogue:['Ciao! Mi chiamo Ana.','Piacere, Ana. Io sono Leo.'],
  vocabulary:['Ciao','Mi chiamo','Piacere','Arrivederci'],
  tasks:[
   'Ascoltare un saluto revisionato e riconoscere i due nomi.',
   'Dire il proprio nome usando mi chiamo.',
   'Leggere il dialogo e individuare le formule di presentazione.',
   'Scrivere due frasi su una persona immaginaria.',
   'Salutare un compagno e rispondere in modo appropriato.',
   'Spiegare in modo semplice quando dire ciao e arrivederci.'
  ]
 },
 personal:{
  outcome:'Chiedere e fornire semplici informazioni su paese, città e lingua.',
  grammar:'Confrontare vengo da e abito a; usare parlo per le lingue conosciute.',
  dialogue:['Di dove sei?','Sono italiana. Abito a Torino.'],
  vocabulary:['Vengo da','Abito a','Parlo','Può ripetere?'],
  tasks:[
   'Ascoltare una presentazione revisionata e distinguere paese e città.',
   'Dire la provenienza di un personaggio immaginario.',
   'Leggere due profili e collegare città e paesi.',
   'Scrivere un profilo inventato con città e lingue.',
   'Fare domande semplici sulla provenienza senza chiedere indirizzi.',
   'Riferire a un compagno la città in cui vive il personaggio.'
  ]
 }
 }
};

export interface A1EditorialDraft extends ProductionUnit {
 level:'A1';
 unitId:A1DraftTopic;
 status:'draft';
 /** Authored dialogue, but NO produced recording or ASR grading. */
 dialogue:readonly [string,string];
 grammarFocus:string;
 lexemes:readonly {conceptId:string;form:string}[];
 audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';
 editorialStatus:'not-human-reviewed';
}
export const a1EditorialDrafts:readonly A1EditorialDraft[]=targetLanguages.flatMap(targetLanguage=>
 a1DraftTopics.map((unitId):A1EditorialDraft=>{
  const part=authoring[targetLanguage][unitId==='greetings-and-introductions'?'greeting':'personal'];
  return {
   targetLanguage,level:'A1',unitId,revision:'0.1.0',status:'draft',
   outcomes:[part.outcome],
   activities:courseSkills.map((skill,i)=>({
    id:'activity-'+skill,skill,prompt:part.tasks[i]!
   })),
   dialogue:[...part.dialogue],
   grammarFocus:part.grammar,
   lexemes:a1VocabularyConcepts[unitId].map((conceptId,i)=>({
    conceptId,form:part.vocabulary[i]!
   })),
   audioStatus:'not-recorded',
   rightsStatus:'pending-editorial-clearance',
   editorialStatus:'not-human-reviewed'
  };
 }));

/** Measures completeness of the EDITORIAL draft contract, never correctness of
 * translations, proficiency, rights ownership or listening audio availability.
 */
export function auditA1EditorialDrafts(drafts:readonly A1EditorialDraft[]=a1EditorialDrafts):{
 valid:boolean;errors:readonly string[];plannedUnits:number;actualDrafts:number;
}{
 const results=auditCurriculumProduction(drafts);
 const errors=[...results.errors],ids=new Set<string>();
 for(const item of drafts){
  const id=[item.targetLanguage,item.unitId].join('/');
  if(ids.has(id)){errors.push('Repeated A1 draft '+id);continue;}
  ids.add(id);
  const concepts=a1VocabularyConcepts[item.unitId];
  if(item.level!=='A1'||item.status!=='draft'||!concepts){
   errors.push('Invalid editorial stage '+id);continue;
  }
  if(item.audioStatus!=='not-recorded'||item.rightsStatus!=='pending-editorial-clearance'||
     item.editorialStatus!=='not-human-reviewed')errors.push('Premature release claim '+id);
  if(item.activities.length!==courseSkills.length||
     !courseSkills.every(skill=>item.activities.some(a=>a.skill===skill&&a.prompt.trim().length>=25)))
      errors.push('Skill briefs missing '+id);
  if(item.dialogue.length!==2||item.dialogue.some(s=>s.trim().length<12)||
     !item.grammarFocus.trim())errors.push('Dialogue or grammar missing '+id);
  if(item.lexemes.length!==concepts.length||
     concepts.some(concept=>item.lexemes.filter(v=>v.conceptId===concept&&v.form.trim()).length!==1))
      errors.push('Lexical concept coverage missing '+id);
 }
 return{valid:errors.length===0,errors,plannedUnits:288,actualDrafts:drafts.length};
}
