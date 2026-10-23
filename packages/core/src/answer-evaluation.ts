/** Deterministic, offline evaluation of a learner response against AUTHORED answers.
 * Separates harmless differences (case, punctuation, contractions, digits, spoken colloquial forms, missing accents
 * when typing) from form errors and from meaning changes (e.g. an added or dropped negation).
 * Speech is treated conservatively: a near miss may be a recognition error, so it asks for confirmation and is
 * never counted against the learner. Pronunciation is NEVER inferred from text; no transcript is stored here.
 */
import type {CourseExercise,LocalizedText,RecognitionConfidence} from './course.js';
import type {DialogueTurn} from './guided-dialogues.js';
import {answerSlot,isAnswerPattern,maxSlotWords} from './answer-patterns.js';
import {targetLanguages,type TargetLanguage} from './types.js';

export type ResponseSource={kind:'typed'}|{kind:'choice'}|{kind:'speech';confidence:RecognitionConfidence};
export interface AnswerKey {
 language:TargetLanguage;
 /** Model answers that may be presented to the learner. */
 models:readonly string[];
 /** Further valid answers (e.g. gendered or regional forms) that are accepted but not presented as models. */
 variants?:readonly string[];
 /** Answers with a personal-detail slot, see answer-patterns.ts. */
 patterns?:readonly string[];
}
export type AnswerOutcome=
 |'correct'|'correct-variant'
 /** Meaning is intact but the form needs adjusting (typed spelling, one word, word order). Not an independent success. */
 |'minor-error'
 |'meaning-error'
 /** Speech that is close to an answer, or uncertain recognition: confirm, repeat or type. Never penalized. */
 |'needs-confirmation'
 /** Ambiguous: contains the answer plus words that may change its meaning. Counted neither way. */
 |'needs-review'
 |'no-evidence';
export type FindingCode=
 |'contraction'|'colloquial-form'|'accent-marks'|'umlaut-spelling'|'number-form'|'filler-removed'|'extra-content'|'personal-detail'
 |'spelling'|'missing-word'|'extra-word'|'word-substitution'|'word-order'|'negation-changed'|'negation-missing'|'incomplete'
 |'possible-recognition-error'|'asr-uncertain'|'partial-match'|'unrelated'|'empty';
/** `expected` is authored text. `received` echoes the learner and must not be persisted. */
export interface AnswerFinding {code:FindingCode;expected?:string;received?:string}
export interface AnswerEvaluation {
 outcome:AnswerOutcome;
 findings:readonly AnswerFinding[];
 /** Authored answer (or pattern) that matched; safe to persist or pass to recordCourseAttempt. */
 matchedAnswer?:string;
 /** Authored answer closest to the response, for hints and confirmation prompts. */
 closestAnswer?:string;
 countsAsSuccess:boolean;
 countsAsError:boolean;
 source:ResponseSource['kind'];
 pronunciation:'not-assessed';
}

interface LanguageRules {locale:string;negations:readonly string[];fillers:readonly string[];numbers:readonly (readonly string[])[];quote:readonly [string,string]}
const n=(...xs:string[])=>xs;
const rules:Record<TargetLanguage,LanguageRules>={
 'en-CA':{locale:'en',quote:['“','”'],negations:n('not','no','never','cannot','nothing','nobody','none','neither','nor'),fillers:n('um','uh','uhm','erm','er','hmm','mm'),
  numbers:[n('zero'),n('one'),n('two'),n('three'),n('four'),n('five'),n('six'),n('seven'),n('eight'),n('nine'),n('ten'),n('eleven'),n('twelve'),n('thirteen'),n('fourteen'),n('fifteen'),n('sixteen'),n('seventeen'),n('eighteen'),n('nineteen'),n('twenty')]},
 'fr-CA':{locale:'fr',quote:['« ',' »'],negations:n('ne','n','pas','jamais','non','rien','aucun','aucune'),fillers:n('euh','heu','hum'),
  numbers:[n('zéro'),n('un','une'),n('deux'),n('trois'),n('quatre'),n('cinq'),n('six'),n('sept'),n('huit'),n('neuf'),n('dix'),n('onze'),n('douze'),n('treize'),n('quatorze'),n('quinze'),n('seize'),n('dix sept'),n('dix huit'),n('dix neuf'),n('vingt')]},
 es:{locale:'es',quote:['«','»'],negations:n('no','nunca','jamás','nada','nadie','ningún','ninguno','ninguna','tampoco','ni'),fillers:n('eh','em','ehm','mmm'),
  numbers:[n('cero'),n('uno','una','un'),n('dos'),n('tres'),n('cuatro'),n('cinco'),n('seis'),n('siete'),n('ocho'),n('nueve'),n('diez'),n('once'),n('doce'),n('trece'),n('catorce'),n('quince'),n('dieciséis'),n('diecisiete'),n('dieciocho'),n('diecinueve'),n('veinte')]},
 'pt-BR':{locale:'pt',quote:['“','”'],negations:n('não','nunca','jamais','nada','ninguém','nenhum','nenhuma','nem'),fillers:n('hum','ãh','hã','ahn'),
  numbers:[n('zero'),n('um','uma'),n('dois','duas'),n('três'),n('quatro'),n('cinco'),n('seis'),n('sete'),n('oito'),n('nove'),n('dez'),n('onze'),n('doze'),n('treze'),n('catorze','quatorze'),n('quinze'),n('dezesseis'),n('dezessete'),n('dezoito'),n('dezenove'),n('vinte')]},
 de:{locale:'de',quote:['„','“'],negations:n('nicht','kein','keine','keinen','keinem','keiner','keines','nie','niemals','nichts','niemand','nein','weder'),fillers:n('äh','ähm','öhm','hm','hmm'),
  numbers:[n('null'),n('eins','ein','eine'),n('zwei'),n('drei'),n('vier'),n('fünf'),n('sechs'),n('sieben'),n('acht'),n('neun'),n('zehn'),n('elf'),n('zwölf'),n('dreizehn'),n('vierzehn'),n('fünfzehn'),n('sechzehn'),n('siebzehn'),n('achtzehn'),n('neunzehn'),n('zwanzig')]},
 // Italian clitic "ne" is not a negation, so "né" is deliberately absent.
 it:{locale:'it',quote:['«','»'],negations:n('non','mai','niente','nulla','nessuno','nessuna'),fillers:n('ehm','eh','mmm','uhm'),
  numbers:[n('zero'),n('uno','una','un'),n('due'),n('tre'),n('quattro'),n('cinque'),n('sei'),n('sette'),n('otto'),n('nove'),n('dieci'),n('undici'),n('dodici'),n('tredici'),n('quattordici'),n('quindici'),n('sedici'),n('diciassette'),n('diciotto'),n('diciannove'),n('venti')]},
};
const englishContractions:readonly [RegExp,string][]=[
 [/\bcan't\b/g,'cannot'],[/\bcan not\b/g,'cannot'],[/\bwon't\b/g,'will not'],[/\bshan't\b/g,'shall not'],[/\blet's\b/g,'let us'],
 [/\bi'm\b/g,'i am'],[/\b(you|we|they)'re\b/g,'$1 are'],[/\b(it|that|what|where|there|here|who|how|he|she)'s\b/g,'$1 is'],
 [/\b(i|you|we|they)'ve\b/g,'$1 have'],[/\b(i|you|we|they|he|she|it|that)'ll\b/g,'$1 will'],[/\b(i|you|we|they|he|she)'d\b/g,'$1 would'],[/n't\b/g,' not'],
];
const germanContractions:readonly [RegExp,string][]=[[/\b(geht|gibt|wie)'s\b/g,'$1 es']];
/** Spoken Brazilian forms that are correct in everyday speech and frequent in ASR output. */
const brazilianSpoken:Readonly<Record<string,readonly string[]>>={pra:['para'],pro:['para','o'],'tá':['está'],'tô':['estou'],'cê':['você']};

/** `literal` keeps the surface words (before equivalences) so identical answers are not reported as variants. */
interface Normalized {tokens:string[];folded:string[];literal:string;literalFolded:string;applied:Set<FindingCode>}
const fold=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
/** Spoken French, frequent in Québec, often drops "ne" while keeping the second negative word. */
const frenchSecondNegatives=new Set(['pas','jamais','rien','aucun','aucune','plus','personne']);
function normalizeText(text:string,language:TargetLanguage,options:{speech:boolean}):Normalized{
 const r=rules[language],applied=new Set<FindingCode>();
 const base=text.normalize('NFC').toLocaleLowerCase(r.locale).replace(/[’‘`´ʼ′]/g,"'").replace(/[-‐-―_/]/g,' ')
  .replace(/[^\p{L}\p{N}'\s]/gu,' ').replace(/\s+/g,' ').trim();
 const words=(s:string)=>{
  const all=s.replace(/'/g,' ').split(' ').filter(Boolean);
  return options.speech?all.filter(t=>!r.fillers.includes(t)):all;
 };
 const literal=words(base);
 if(literal.length!==base.replace(/'/g,' ').split(' ').filter(Boolean).length)applied.add('filler-removed');
 let s=base;
 const contractions=language==='en-CA'?englishContractions:language==='de'?germanContractions:[];
 for(const [pattern,replacement] of contractions){const next=s.replace(pattern,replacement);if(next!==s)applied.add('contraction');s=next;}
 let tokens=words(s);
 if(language==='pt-BR')tokens=tokens.flatMap(t=>{const m=brazilianSpoken[t];if(m){applied.add('colloquial-form');return [...m];}return [t];});
 if(language==='fr-CA'&&tokens.some(t=>frenchSecondNegatives.has(t))&&tokens.some(t=>t==='ne'||t==='n')){tokens=tokens.filter(t=>t!=='ne'&&t!=='n');applied.add('colloquial-form');}
 return {tokens,folded:tokens.map(fold),literal:literal.join(' '),literalFolded:literal.map(fold).join(' '),applied};
}
const umlautSpelling=(s:string)=>s.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
/** Optimal string alignment distance: a swap of two adjacent letters ("crad"/"card") is one typo. */
function editDistance(a:string,b:string):number{
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  d[i]![j]=Math.min(d[i-1]![j]!+1,d[i]![j-1]!+1,d[i-1]![j-1]!+(a[i-1]===b[j-1]?0:1));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i]![j]=Math.min(d[i]![j]!,d[i-2]![j-2]!+1);
 }
 return d[a.length]![b.length]!;
}
const similarWords=(a:string,b:string)=>{const len=Math.max(a.length,b.length);return len>=3&&editDistance(a,b)<=(len>=6?2:1);};
type Op={kind:'sub'|'del'|'ins';expected?:string;received?:string};
/** Token alignment from authored (a) to response (b); display forms are returned for findings. */
function alignTokens(a:Normalized,b:Normalized):Op[]{
 const x=a.folded,y=b.folded,d:number[][]=Array.from({length:x.length+1},(_,i)=>Array.from({length:y.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=x.length;i++)for(let j=1;j<=y.length;j++)d[i]![j]=Math.min(d[i-1]![j]!+1,d[i]![j-1]!+1,d[i-1]![j-1]!+(x[i-1]===y[j-1]?0:1));
 const ops:Op[]=[];let i=x.length,j=y.length;
 while(i>0||j>0){
  if(i>0&&j>0&&d[i]![j]===d[i-1]![j-1]!+(x[i-1]===y[j-1]?0:1)){if(x[i-1]!==y[j-1])ops.push({kind:'sub',expected:a.tokens[i-1],received:b.tokens[j-1]});i--;j--;}
  else if(i>0&&d[i]![j]===d[i-1]![j]!+1){ops.push({kind:'del',expected:a.tokens[i-1]});i--;}
  else{ops.push({kind:'ins',received:b.tokens[j-1]});j--;}
 }
 return ops.reverse();
}
const sameSequence=(a:readonly string[],b:readonly string[])=>a.length===b.length&&a.every((t,i)=>t===b[i]);
function containsSequence(haystack:readonly string[],needle:readonly string[]):number{
 if(!needle.length||needle.length>haystack.length)return -1;
 for(let i=0;i+needle.length<=haystack.length;i++)if(needle.every((t,k)=>haystack[i+k]===t))return i;
 return -1;
}
/** Responses with digits 0-20 are also tried with each number word of the language. */
function numberReadings(response:Normalized,language:TargetLanguage,speech:boolean):Normalized[]{
 const words=rules[language].numbers;
 const positions=response.tokens.map((t,i)=>/^\d{1,2}$/.test(t)&&Number(t)<=20?i:-1).filter(i=>i>=0).slice(0,3);
 if(!positions.length)return [];
 let variants:string[][]=[response.tokens];
 for(const position of positions)variants=variants.flatMap(v=>words[Number(response.tokens[position])]!.map(w=>v.map((t,i)=>i===position?w:t)));
 return variants.slice(0,27).map(v=>{const x=normalizeText(v.join(' '),language,{speech});x.applied.add('number-form');for(const c of response.applied)x.applied.add(c);return x;});
}
function result(outcome:AnswerOutcome,source:ResponseSource,findings:AnswerFinding[],extra:Partial<AnswerEvaluation>={}):AnswerEvaluation{
 return {outcome,findings,countsAsSuccess:outcome==='correct'||outcome==='correct-variant',countsAsError:outcome==='meaning-error'||outcome==='minor-error',source:source.kind,pronunciation:'not-assessed',...extra};
}
const informational=(applied:Set<FindingCode>):AnswerFinding[]=>[...applied].map(code=>({code}));

export function answerKeyForExercise(exercise:CourseExercise,language:TargetLanguage):AnswerKey{
 return {language,models:exercise.alternatives,variants:exercise.acceptedVariants??[],patterns:exercise.acceptedPatterns??[]};
}
export function answerKeyForDialogueTurn(turn:DialogueTurn,language:TargetLanguage):AnswerKey{
 return {language,models:turn.acceptedReplies};
}
export function evaluateAnswer(key:AnswerKey,response:string,source:ResponseSource):AnswerEvaluation{
 if(!targetLanguages.includes(key.language))throw new Error('Unsupported language');
 const authored=[...key.models,...(key.variants??[])].filter(a=>typeof a==='string'&&a.trim());
 const patterns=(key.patterns??[]).filter(isAnswerPattern);
 if(!authored.length&&!patterns.length)throw new Error('Answer key has no authored answers');
 const speech=source.kind==='speech',language=key.language;
 const typed=typeof response==='string'?response:'';
 const said=normalizeText(typed,language,{speech});
 if(!said.tokens.length)return result('no-evidence',source,[{code:speech?'asr-uncertain':'empty'}]);
 const readings=[said,...numberReadings(said,language,speech)];
 const candidates=authored.map(text=>({text,norm:normalizeText(text,language,{speech:false})}));
 // 1. Exact, equivalent and accent-insensitive matches.
 let match:{text:string;findings:AnswerFinding[];variant:boolean}|null=null;
 const literal=candidates.find(c=>c.norm.literal===said.literal);
 if(literal)match={text:literal.text,findings:said.applied.has('filler-removed')?[{code:'filler-removed'}]:[],variant:false};
 for(const reading of match?[]:readings){
  for(const c of candidates){
   const applied=new Set([...reading.applied,...c.norm.applied]);
   const numeric=reading.applied.has('number-form');
   const plain=():AnswerFinding[]=>reading.applied.has('filler-removed')?[{code:'filler-removed'}]:[];
   if(sameSequence(reading.tokens,c.norm.tokens)){
    match=reading.literal===c.norm.literal&&!numeric?{text:c.text,findings:plain(),variant:false}:{text:c.text,findings:informational(applied),variant:true};break;
   }
   if(sameSequence(reading.folded,c.norm.folded)){
    // Speech recognizers choose the spelling, so accent marks are not the learner's; typed accents are noted.
    if(speech&&reading.literalFolded===c.norm.literalFolded&&!numeric){match={text:c.text,findings:plain(),variant:false};break;}
    if(!speech)applied.add('accent-marks');
    match={text:c.text,findings:informational(applied).map(f=>f.code==='accent-marks'?{...f,expected:c.text}:f),variant:true};break;
   }
   if(language==='de'&&!speech&&sameSequence(reading.tokens.map(umlautSpelling),c.norm.tokens.map(umlautSpelling))){
    applied.add('umlaut-spelling');
    match={text:c.text,findings:informational(applied).map(f=>f.code==='umlaut-spelling'?{...f,expected:c.text}:f),variant:true};break;
   }
  }
  if(match)break;
  for(const pattern of patterns){
   const [before,after]=pattern.split(answerSlot).map(part=>normalizeText(part,language,{speech:false}).folded) as [string[],string[]];
   const slot=reading.folded.length-before.length-after.length;
   if(slot>=1&&slot<=maxSlotWords&&before.every((w,i)=>reading.folded[i]===w)&&after.every((w,i)=>reading.folded[before.length+slot+i]===w)){
    match={text:pattern,findings:[{code:'personal-detail'},...informational(reading.applied)],variant:false};break;
   }
  }
  if(match)break;
 }
 // Speech recognizers choose word boundaries ("wieder holen", "Bus halte Stelle" for German compounds), not the learner.
 if(!match&&speech){
  const joined=said.folded.join('');
  const c=candidates.find(x=>x.norm.folded.join('')===joined);
  if(c)match={text:c.text,findings:[],variant:false};
 }
 const uncertainSpeech=speech&&source.confidence!=='high';
 if(match){
  if(uncertainSpeech)return result('needs-confirmation',source,[{code:'asr-uncertain'}],{closestAnswer:match.text});
  return result(match.variant?'correct-variant':'correct',source,match.findings,{matchedAnswer:match.text,closestAnswer:match.text});
 }
 if(uncertainSpeech)return result('no-evidence',source,[{code:'asr-uncertain'}]);
 const negations=new Set(rules[language].negations.map(fold));
 // 2. The answer plus extra words: valid unless the extra words may negate it.
 for(const c of candidates){
  const at=containsSequence(said.folded,c.norm.folded);
  if(at<0)continue;
  const extra=said.tokens.filter((_,i)=>i<at||i>=at+c.norm.folded.length);
  const negating=extra.filter(t=>negations.has(fold(t)));
  if(negating.length)return result('needs-review',source,[{code:'extra-content'},{code:'negation-changed',received:negating.join(' ')}],{closestAnswer:c.text});
  return result('correct-variant',source,[{code:'extra-content'},...informational(said.applied)],{matchedAnswer:c.text,closestAnswer:c.text});
 }
 // 3. Closest authored answer by token alignment.
 const ranked=candidates.map(c=>({c,ops:alignTokens(c.norm,said)})).sort((a,b)=>a.ops.length/Math.max(a.c.norm.tokens.length,said.tokens.length)-b.ops.length/Math.max(b.c.norm.tokens.length,said.tokens.length));
 const {c:best,ops}=ranked[0]!;
 const closest=best.text,size=best.norm.tokens.length;
 const isNeg=(t?:string)=>t!==undefined&&negations.has(fold(t));
 const negationOps=ops.filter(o=>isNeg(o.expected)!==isNeg(o.received));
 if(negationOps.length){
  const added=negationOps.find(o=>isNeg(o.received)),dropped=negationOps.find(o=>isNeg(o.expected));
  return result('meaning-error',source,[added?{code:'negation-changed',received:added.received}:{code:'negation-missing',expected:dropped!.expected}],{closestAnswer:closest});
 }
 if(said.tokens.length>1&&[...said.folded].sort().join(' ')===[...best.norm.folded].sort().join(' '))
  return result('minor-error',source,[{code:'word-order',expected:closest}],{closestAnswer:closest});
 const missingTail=ops.every(o=>o.kind==='del')&&containsSequence(best.norm.folded,said.folded)===0;
 if(missingTail){
  const rest=ops.map(o=>o.expected).join(' ');
  if(speech)return result('needs-confirmation',source,[{code:'incomplete',expected:rest},{code:'possible-recognition-error'}],{closestAnswer:closest});
  return result(ops.length<=Math.max(1,Math.floor(size/3))?'minor-error':'meaning-error',source,[{code:'incomplete',expected:rest}],{closestAnswer:closest});
 }
 const similarSubs=ops.every(o=>o.kind==='sub'&&similarWords(fold(o.expected!),fold(o.received!)));
 if(similarSubs&&ops.length<=2){
  if(speech)return result('needs-confirmation',source,[{code:'possible-recognition-error'}],{closestAnswer:closest});
  return result('minor-error',source,ops.map(o=>({code:'spelling' as const,expected:o.expected,received:o.received})),{closestAnswer:closest});
 }
 const small=size>=2&&(ops.length===1||(ops.length===2&&size>=5&&ops.every(o=>o.kind!=='sub'||similarWords(fold(o.expected!),fold(o.received!)))));
 if(small){
  if(speech)return result('needs-confirmation',source,[{code:'possible-recognition-error'}],{closestAnswer:closest});
  const findings=ops.map((o):AnswerFinding=>o.kind==='del'?{code:'missing-word',expected:o.expected}:o.kind==='ins'?{code:'extra-word',received:o.received}:
   similarWords(fold(o.expected!),fold(o.received!))?{code:'spelling',expected:o.expected,received:o.received}:{code:'word-substitution',expected:o.expected,received:o.received});
  return result(findings.some(f=>f.code==='word-substitution')?'meaning-error':'minor-error',source,findings,{closestAnswer:closest});
 }
 // Offline recognizers are least reliable on one- or two-word answers (PoC 2026-10-23: "Olá!" heard as "Hulk.",
 // "Ciao!" as "So."), so a short spoken mismatch asks for confirmation instead of counting as an error.
 if(speech&&size<=2&&said.tokens.length<=3)return result('needs-confirmation',source,[{code:'possible-recognition-error'}],{closestAnswer:closest});
 const similarity=1-ops.length/Math.max(size,said.tokens.length);
 return result('meaning-error',source,[{code:similarity>=0.5?'partial-match':'unrelated'}],{closestAnswer:closest});
}

const L=(en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
/** Draft, unreviewed learner-facing copy. Calm wording by design; no celebratory or shaming phrasing. */
export const answerOutcomeCopy:Readonly<Record<AnswerOutcome,LocalizedText>>={
 correct:L('Correct.','C’est juste.','Correcto.','Correto.','Richtig.','Corretto.'),
 'correct-variant':L('Correct: that is another valid way to say it.','C’est juste : c’est une autre façon valable de le dire.','Correcto: es otra forma válida de decirlo.','Correto: é outra forma válida de dizer isso.','Richtig: Das ist eine andere gültige Art, es zu sagen.','Corretto: è un altro modo valido di dirlo.'),
 'minor-error':L('Almost. The meaning is clear; one detail needs adjusting.','Presque. Le sens est clair; il reste un détail à ajuster.','Casi. Se entiende; falta ajustar un detalle.','Quase. Dá para entender; falta ajustar um detalhe.','Fast. Die Bedeutung ist klar; ein Detail muss noch angepasst werden.','Quasi. Il senso è chiaro; manca da sistemare un dettaglio.'),
 'meaning-error':L('Not quite: here that would mean something different. Try again or ask for a hint.','Pas tout à fait : ici, cela voudrait dire autre chose. Réessaie ou demande un indice.','Todavía no: aquí eso significaría otra cosa. Inténtalo de nuevo o pide una pista.','Ainda não: aqui isso significaria outra coisa. Tente de novo ou peça uma dica.','Noch nicht ganz: Das würde hier etwas anderes bedeuten. Versuch es noch einmal oder bitte um einen Tipp.','Non ancora: qui significherebbe un’altra cosa. Riprova o chiedi un suggerimento.'),
 'needs-confirmation':L('I may not have heard that correctly. Did you mean {closest}? You can confirm, repeat or type it; this does not count against you.','Je n’ai peut-être pas bien entendu. Voulais-tu dire {closest} ? Tu peux confirmer, répéter ou l’écrire; cela ne compte pas contre toi.','Puede que no te haya entendido bien. ¿Quisiste decir {closest}? Puedes confirmarlo, repetirlo o escribirlo; no cuenta como error.','Talvez eu não tenha entendido bem. Você quis dizer {closest}? Você pode confirmar, repetir ou digitar; isso não conta como erro.','Vielleicht habe ich dich nicht richtig verstanden. Meintest du {closest}? Du kannst bestätigen, wiederholen oder tippen; das zählt nicht als Fehler.','Forse non ho capito bene. Volevi dire {closest}? Puoi confermare, ripetere o scriverlo; non conta come errore.'),
 'needs-review':L('Your answer includes the expected phrase, but also words that may change its meaning. It is not counted either way; you can try again.','Ta réponse contient la phrase attendue, mais aussi des mots qui peuvent en changer le sens. Elle n’est comptée ni comme juste ni comme fausse; tu peux réessayer.','Tu respuesta incluye la frase esperada, pero también palabras que pueden cambiar el sentido. No cuenta como acierto ni como error; puedes intentarlo de nuevo.','Sua resposta inclui a frase esperada, mas também palavras que podem mudar o sentido. Ela não conta como acerto nem como erro; você pode tentar de novo.','Deine Antwort enthält den erwarteten Satz, aber auch Wörter, die die Bedeutung ändern können. Sie zählt weder als richtig noch als falsch; du kannst es noch einmal versuchen.','La tua risposta contiene la frase attesa, ma anche parole che possono cambiarne il senso. Non conta né come giusta né come sbagliata; puoi riprovare.'),
 'no-evidence':L('I could not get an answer clearly. Nothing was counted. Repeat when you want, type it, or skip.','Je n’ai pas pu saisir une réponse clairement. Rien n’a été compté. Répète quand tu veux, écris-la ou passe à la suite.','No pude captar una respuesta con claridad. No se contó nada. Repite cuando quieras, escríbela o sáltala.','Não consegui captar uma resposta com clareza. Nada foi contado. Repita quando quiser, digite ou pule.','Ich konnte keine Antwort deutlich erfassen. Es wurde nichts gezählt. Wiederhole, wann du willst, tippe sie ein oder überspringe sie.','Non sono riuscito a cogliere chiaramente una risposta. Non è stato contato nulla. Ripeti quando vuoi, scrivila o salta.'),
};
export const answerFindingCopy:Readonly<Partial<Record<FindingCode,LocalizedText>>>={
 contraction:L('Contracted and full forms are both correct.','La forme contractée et la forme complète sont toutes deux correctes.','La forma contraída y la completa son correctas.','A forma contraída e a completa estão corretas.','Die verkürzte und die volle Form sind beide richtig.','La forma contratta e quella completa sono entrambe corrette.'),
 'colloquial-form':L('That is an informal spoken form; it is correct in everyday speech.','C’est une forme familière de l’oral; elle est correcte au quotidien.','Es una forma coloquial oral; es correcta en el habla cotidiana.','É uma forma coloquial da fala; está correta no dia a dia.','Das ist eine umgangssprachliche Form; im Alltag ist sie richtig.','È una forma colloquiale del parlato; è corretta nell’uso quotidiano.'),
 'accent-marks':L('In writing, remember the accent marks: {expected}.','À l’écrit, pense aux accents : {expected}.','Al escribir, recuerda las tildes: {expected}.','Na escrita, lembre-se dos acentos: {expected}.','Achte beim Schreiben auf Akzente und Umlaute: {expected}.','Quando scrivi, ricorda gli accenti: {expected}.'),
 'umlaut-spelling':L('Writing ae/oe/ue/ss is understood; the standard spelling is {expected}.','L’écriture ae/oe/ue/ss est comprise; l’orthographe standard est {expected}.','Se entiende la escritura ae/oe/ue/ss; la ortografía estándar es {expected}.','A escrita ae/oe/ue/ss é compreendida; a ortografia padrão é {expected}.','ae/oe/ue/ss ist verständlich; die Standardschreibung ist {expected}.','La scrittura ae/oe/ue/ss è comprensibile; l’ortografia standard è {expected}.'),
 'number-form':L('Digits and number words are both accepted.','Les chiffres et les nombres en lettres sont acceptés.','Se aceptan cifras y números escritos con letras.','Números em algarismos e por extenso são aceitos.','Ziffern und ausgeschriebene Zahlen werden beide akzeptiert.','Sono accettati sia le cifre sia i numeri in lettere.'),
 'extra-content':L('You added extra words; the key phrase is there.','Tu as ajouté des mots; la phrase clé est là.','Añadiste palabras; la frase clave está ahí.','Você acrescentou palavras; a frase principal está lá.','Du hast Wörter ergänzt; der wichtige Satz ist dabei.','Hai aggiunto parole; la frase chiave c’è.'),
 'personal-detail':L('Your own name is fine; it is not saved.','Ton propre nom convient; il n’est pas enregistré.','Tu propio nombre vale; no se guarda.','Seu próprio nome serve; ele não é salvo.','Dein eigener Name passt; er wird nicht gespeichert.','Il tuo nome va bene; non viene salvato.'),
 spelling:L('Check the spelling: {expected} (you wrote {received}).','Vérifie l’orthographe : {expected} (tu as écrit {received}).','Revisa la ortografía: {expected} (escribiste {received}).','Confira a ortografia: {expected} (você escreveu {received}).','Prüfe die Schreibung: {expected} (du hast {received} geschrieben).','Controlla l’ortografia: {expected} (hai scritto {received}).'),
 'missing-word':L('A word is missing: {expected}.','Il manque un mot : {expected}.','Falta una palabra: {expected}.','Falta uma palavra: {expected}.','Ein Wort fehlt: {expected}.','Manca una parola: {expected}.'),
 'extra-word':L('This word is not needed here: {received}.','Ce mot n’est pas nécessaire ici : {received}.','Esta palabra sobra aquí: {received}.','Esta palavra não é necessária aqui: {received}.','Dieses Wort ist hier nicht nötig: {received}.','Questa parola qui non serve: {received}.'),
 'word-substitution':L('Instead of {received}, this situation needs {expected}.','Au lieu de {received}, cette situation demande {expected}.','En lugar de {received}, esta situación pide {expected}.','Em vez de {received}, esta situação pede {expected}.','Statt {received} braucht diese Situation {expected}.','Invece di {received}, questa situazione richiede {expected}.'),
 'word-order':L('The words are right; try another order: {expected}.','Les mots sont bons; essaie un autre ordre : {expected}.','Las palabras están bien; prueba otro orden: {expected}.','As palavras estão certas; tente outra ordem: {expected}.','Die Wörter stimmen; versuch eine andere Reihenfolge: {expected}.','Le parole sono giuste; prova un altro ordine: {expected}.'),
 'negation-changed':L('Careful: {received} changes the meaning to the opposite.','Attention : {received} change le sens en son contraire.','Atención: {received} cambia el sentido al contrario.','Atenção: {received} muda o sentido para o contrário.','Achtung: {received} kehrt die Bedeutung um.','Attenzione: {received} cambia il senso nel contrario.'),
 'negation-missing':L('Careful: without {expected} the meaning changes.','Attention : sans {expected}, le sens change.','Atención: sin {expected}, el sentido cambia.','Atenção: sem {expected}, o sentido muda.','Achtung: Ohne {expected} ändert sich die Bedeutung.','Attenzione: senza {expected} il senso cambia.'),
 incomplete:L('The answer seems incomplete. It continues with: {expected}.','La réponse semble incomplète. Elle continue avec : {expected}.','La respuesta parece incompleta. Continúa con: {expected}.','A resposta parece incompleta. Ela continua com: {expected}.','Die Antwort scheint unvollständig. Sie geht weiter mit: {expected}.','La risposta sembra incompleta. Continua con: {expected}.'),
};
/** Wording for stored corrections, which keep authored words only (never what the learner said). */
export const answerFindingAuthoredOnlyCopy:Readonly<Partial<Record<FindingCode,LocalizedText>>>={
 spelling:L('Check the spelling: {expected}.','Vérifie l’orthographe : {expected}.','Revisa la ortografía: {expected}.','Confira a ortografia: {expected}.','Prüfe die Schreibung: {expected}.','Controlla l’ortografia: {expected}.'),
 'word-substitution':L('This situation needs {expected}.','Cette situation demande {expected}.','Esta situación pide {expected}.','Esta situação pede {expected}.','Diese Situation braucht {expected}.','Questa situazione richiede {expected}.'),
};
/** Authored text in the quotation marks of the known language; a {name} slot is shown as an ellipsis. */
export function quoteIn(language:TargetLanguage,text:string):string{
 const [open,close]=rules[language].quote;
 return open+text.split(answerSlot).join('…')+close;
}
/** Comparison tokens of an authored text, e.g. to check that stored feedback only holds authored words. */
export function answerTokens(text:string,language:TargetLanguage):string[]{
 return normalizeText(text,language,{speech:false}).tokens;
}
/** Localized feedback in the learner's known language. Details that would need the learner's own words
 * are skipped when those words are not available (stored corrections never keep them).
 */
export function answerFeedbackText(evaluation:AnswerEvaluation,knownLanguage:TargetLanguage,options:{maxDetails?:number;omitHead?:boolean}={}):string{
 if(!targetLanguages.includes(knownLanguage))throw new Error('Unsupported language');
 const q=(s?:string)=>s===undefined?'':quoteIn(knownLanguage,s);
 const fill=(template:string,f:Partial<AnswerFinding>)=>template.replace('{expected}',q(f.expected)).replace('{received}',q(f.received)).replace('{closest}',q(evaluation.closestAnswer));
 const head=options.omitHead?[]:[fill(answerOutcomeCopy[evaluation.outcome][knownLanguage],{})];
 const details=evaluation.findings.map(f=>{
  const full=answerFindingCopy[f.code]?.[knownLanguage];
  const copy=full?.includes('{received}')&&f.received===undefined?answerFindingAuthoredOnlyCopy[f.code]?.[knownLanguage]??full:full;
  if(!copy||(copy.includes('{received}')&&f.received===undefined)||(copy.includes('{expected}')&&f.expected===undefined))return null;
  return fill(copy,f);
 }).filter((x):x is string=>!!x).filter((x,i,all)=>all.indexOf(x)===i).slice(0,Math.max(0,options.maxDetails??2));
 return [...head,...details].join(' ');
}
