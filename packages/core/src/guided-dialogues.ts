/** Original, curated conversational exercises for a course, with no generative API calls.
 * IMPORTANT: Transcript matching checks listed acceptable RESPONSES, not accent, phonetics,
 * comprehension, arbitrary semantics or official CEFR mastery.
 */
import {normalizedUtterance, type LocalizedText, type RecognitionConfidence} from './course.js';
import {targetLanguages, type TargetLanguage} from './types.js';
import type {AgeStage} from './learning-paths.js';

export type LearningFocus = 'balanced' | 'work' | 'daily-life' | 'travel';
export type DialogueDomain = 'foundation' | 'work' | 'travel' | 'shopping';
export type DialogueVerdict = 'accepted' | 'retry' | 'uncertain';

export interface DialogueTurn {
  id: string;
  /** Teacher cue in target language, NOT something the learner should translate verbatim. */
  teacherCue: string;
  /** Optional meaning/instruction in any of the six known languages. */
  support: LocalizedText;
  /** Multiple original, human-authored acceptable replies that express the intended action. */
  acceptedReplies: readonly string[];
  /** Semantic intention label for future richer local intent recognition, NOT an ASR score. */
  intent: string;
}
export interface GuidedDialogue {
  id: string;
  target: TargetLanguage;
  level: 'A0'|'A1';
  domain: DialogueDomain;
  label: LocalizedText;
  /** Core transferable competencies appear regardless of optional career focus. */
  isFoundation: boolean;
  original: true;
  turns: readonly DialogueTurn[];
}
export interface DialogueAttempt {
  verdict: DialogueVerdict;
  /** Matching human-authored reply for accepted transcript; never a pronunciation grade. */
  matchedReply?: string;
}
export interface DialogueRun {
  dialogueId: string;
  turnIndex: number;
  acceptedTurnIds: readonly string[];
  /** Counts confident transcripts on this run, not acoustic pronunciation. */
  attempts: Readonly<Record<string, number>>;
  completed: boolean;
}
export type DialogueSelection =
  | {status:'available'; dialogues: readonly GuidedDialogue[]}
  | {status:'requires-child-safety-review'; dialogues: readonly GuidedDialogue[]};

const T = (en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>
  ({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
const topics = {
  foundation:T('Everyday requests','Demandes quotidiennes','Peticiones cotidianas','Pedidos do dia a dia','Alltagsbitten','Richieste quotidiane'),
  work:T('Workplace conversations','Conversations au travail','Conversaciones en el trabajo','Conversas no trabalho','Gespräche bei der Arbeit','Conversazioni al lavoro'),
  travel:T('Getting around','Se déplacer','Moverse por la ciudad','Como chegar','Unterwegs sein','Muoversi in città'),
  shopping:T('Shopping and payment','Achats et paiement','Compras y pagos','Compras e pagamento','Einkaufen und Bezahlen','Acquisti e pagamenti'),
};
const support = {
  water:T('You are thirsty. Ask for water, not a translation of the question.', 'Tu as soif. Demande de l’eau, sans traduire la consigne.', 'Tienes sed. Pide agua en el idioma que aprendes; no traduzcas la pregunta.', 'Você está com sede. Peça água, sem traduzir a pergunta.', 'Du hast Durst. Bitte um Wasser, statt die Frage zu übersetzen.', 'Hai sete. Chiedi dell’acqua, senza tradurre la domanda.'),
  thanks:T('Someone helped you. Thank them.', 'Quelqu’un t’a aidé. Remercie cette personne.', 'Alguien te ayudó. Dale las gracias.', 'Alguém te ajudou. Agradeça.', 'Jemand hat dir geholfen. Bedanke dich.', 'Qualcuno ti ha aiutato. Ringrazialo.'),
  offer:T('Your coworker is carrying a heavy box. Offer to help.', 'Ton collègue porte une boîte lourde. Propose ton aide.', 'Un compañero lleva una caja pesada. Ofrécele ayuda.', 'Seu colega carrega uma caixa pesada. Ofereça ajuda.', 'Dein Kollege trägt eine schwere Kiste. Biete Hilfe an.', 'Un collega porta una scatola pesante. Offri aiuto.'),
  request:T('You need help at work. Ask a coworker politely.', 'Tu as besoin d’aide au travail. Demande poliment.', 'Necesitas ayuda en el trabajo. Pídela educadamente.', 'Você precisa de ajuda no trabalho. Peça com educação.', 'Du brauchst bei der Arbeit Hilfe. Bitte höflich darum.', 'Hai bisogno di aiuto al lavoro. Chiedilo con gentilezza.'),
  bus:T('You are at a bus stop. Ask where the station is.', 'Tu es à un arrêt de bus. Demande où est la gare.', 'Estás en una parada de bus. Pregunta dónde está la estación.', 'Você está no ponto de ônibus. Pergunte onde fica a estação.', 'Du stehst an einer Bushaltestelle. Frag, wo der Bahnhof ist.', 'Sei alla fermata dell’autobus. Chiedi dov’è la stazione.'),
  ticket:T('You want to buy a bus ticket. Ask for one ticket.', 'Tu veux acheter un billet d’autobus. Demandes-en un.', 'Quieres comprar un billete de bus. Pide uno.', 'Você quer comprar uma passagem de ônibus. Peça uma.', 'Du möchtest ein Busticket kaufen. Bitte um ein Ticket.', 'Vuoi comprare un biglietto dell’autobus. Chiedine uno.'),
  price:T('Ask how much this item costs.','Demande combien coûte cet article.','Pregunta cuánto cuesta este producto.','Pergunte quanto custa este produto.','Frag, wie viel dieser Artikel kostet.','Chiedi quanto costa questo articolo.'),
  card:T('Ask whether you can pay by card.','Demande si tu peux payer par carte.','Pregunta si puedes pagar con tarjeta.','Pergunte se pode pagar com cartão.','Frag, ob du mit Karte bezahlen kannst.','Chiedi se puoi pagare con la carta.'),
};
type CaseName = 'water'|'thanks'|'offer'|'request'|'bus'|'ticket'|'price'|'card';
const authored:Record<TargetLanguage, Record<CaseName,{cue:string;responses:readonly string[]}>>={
  'en-CA':{price:{cue:'How do you ask the price?',responses:['How much is this?','How much does this cost?']},card:{cue:'Ask if you can pay by card.',responses:['Can I pay by card?','Do you accept cards?']},
    water:{cue:'You are thirsty. What do you ask for?',responses:['Can I have some water, please?','Could I have some water, please?','May I have some water, please?']},
    thanks:{cue:'I gave you some water. What do you say?',responses:['Thank you.','Thanks.','Thank you very much.']},
    offer:{cue:'Your coworker is carrying a heavy box. What do you say?',responses:['Can I help you?','Do you need a hand?','Would you like some help?','Can I give you a hand?']},
    request:{cue:'You need help with a task. How do you ask?',responses:['Can you help me, please?','Could you give me a hand?','Could you help me, please?']},
    bus:{cue:'You are at a bus stop. How do you ask for the station?',responses:['Where is the station?','Excuse me, where is the station?','Could you tell me where the station is?']},
    ticket:{cue:'You want one bus ticket. What do you say?',responses:['One ticket, please.','Can I have one ticket, please?','Could I get one bus ticket, please?']},
  },
  'fr-CA':{price:{cue:'Comment demandes-tu le prix ?',responses:['Combien ça coûte ?','Quel est le prix ?']},card:{cue:'Demande si tu peux payer par carte.',responses:['Est-ce que je peux payer par carte ?','Acceptez-vous les cartes ?']},
    water:{cue:'Tu as soif. Comment demandes-tu de l’eau ?',responses:['Est-ce que je peux avoir de l’eau, s’il vous plaît ?', 'Puis-je avoir de l’eau, s’il vous plaît ?','Je voudrais de l’eau, s’il vous plaît.']},
    thanks:{cue:'Je t’ai donné de l’eau. Que dis-tu ?',responses:['Merci.','Merci beaucoup.','Je vous remercie.']},
    offer:{cue:'Ton collègue porte une boîte lourde. Que lui dis-tu ?',responses:['Est-ce que je peux t’aider ?', 'Tu veux un coup de main ?', 'Puis-je vous aider ?']},
    request:{cue:'Tu as besoin d’aide au travail. Que demandes-tu ?',responses:['Peux-tu m’aider, s’il te plaît ?', 'Est-ce que tu peux me donner un coup de main ?', 'Pouvez-vous m’aider, s’il vous plaît ?']},
    bus:{cue:'Tu cherches la gare depuis l’arrêt de bus. Quelle question poses-tu ?',responses:['Où est la gare ?', 'Excusez-moi, où est la gare ?', 'Pouvez-vous me dire où se trouve la gare ?']},
    ticket:{cue:'Tu veux acheter un billet d’autobus. Que dis-tu ?',responses:['Un billet, s’il vous plaît.','Je voudrais un billet d’autobus, s’il vous plaît.','Est-ce que je peux avoir un billet ?']},
  },
  es:{price:{cue:'¿Cómo preguntas el precio?',responses:['¿Cuánto cuesta esto?','¿Cuál es el precio?']},card:{cue:'Pregunta si puedes pagar con tarjeta.',responses:['¿Puedo pagar con tarjeta?','¿Aceptan tarjetas?']},
    water:{cue:'Tienes sed. ¿Cómo pides agua?',responses:['¿Me das agua, por favor?','¿Puedo tomar agua, por favor?','¿Me podrías dar un poco de agua?']},
    thanks:{cue:'Te di agua. ¿Qué me dices?',responses:['Gracias.','Muchas gracias.','Te lo agradezco.']},
    offer:{cue:'Tu compañero lleva una caja pesada. ¿Qué le dices?',responses:['¿Te ayudo?','¿Necesitas ayuda?','¿Te echo una mano?']},
    request:{cue:'Necesitas ayuda en el trabajo. ¿Qué dices?',responses:['¿Me puedes ayudar, por favor?','¿Me echas una mano?','¿Podrías ayudarme, por favor?']},
    bus:{cue:'Estás en la parada de bus. ¿Cómo preguntas por la estación?',responses:['¿Dónde está la estación?','Disculpe, ¿dónde está la estación?','¿Me puede decir dónde queda la estación?']},
    ticket:{cue:'Quieres un pasaje de bus. ¿Qué dices?',responses:['Un pasaje, por favor.','¿Me da un boleto, por favor?','Quisiera un pasaje de bus, por favor.']},
  },
  'pt-BR':{price:{cue:'Como você pergunta o preço?',responses:['Quanto custa isso?','Qual é o preço?']},card:{cue:'Pergunte se pode pagar com cartão.',responses:['Posso pagar com cartão?','Vocês aceitam cartão?']},
    water:{cue:'Você está com sede. Como pede água?',responses:['Posso tomar um pouco de água, por favor?','Você pode me dar água, por favor?','Eu queria água, por favor.']},
    thanks:{cue:'Eu te dei água. O que você diz?',responses:['Obrigado.','Obrigada.','Muito obrigado.','Muito obrigada.']},
    offer:{cue:'Seu colega está carregando uma caixa pesada. O que você diz?',responses:['Posso ajudar?','Precisa de ajuda?','Quer uma mãozinha?']},
    request:{cue:'Você precisa de ajuda no trabalho. Como pede?',responses:['Você pode me ajudar, por favor?','Pode me dar uma mão?','Você poderia me ajudar, por favor?']},
    bus:{cue:'Você está no ponto de ônibus. Como pergunta pela estação?',responses:['Onde fica a estação?','Com licença, onde fica a estação?','Pode me dizer onde é a estação?']},
    ticket:{cue:'Você quer uma passagem de ônibus. O que diz?',responses:['Uma passagem, por favor.','Queria uma passagem de ônibus, por favor.','Pode me dar uma passagem, por favor?']},
  },
  de:{price:{cue:'Wie fragst du nach dem Preis?',responses:['Wie viel kostet das?','Was kostet das?']},card:{cue:'Frag, ob du mit Karte bezahlen kannst.',responses:['Kann ich mit Karte bezahlen?','Akzeptieren Sie Karten?']},
    water:{cue:'Du hast Durst. Wie bittest du um Wasser?',responses:['Kann ich bitte Wasser haben?','Könnte ich bitte etwas Wasser bekommen?','Ich hätte gern Wasser, bitte.']},
    thanks:{cue:'Ich habe dir Wasser gegeben. Was sagst du?',responses:['Danke.','Vielen Dank.','Danke schön.']},
    offer:{cue:'Dein Kollege trägt eine schwere Kiste. Was sagst du?',responses:['Kann ich dir helfen?','Brauchst du Hilfe?','Soll ich dir helfen?']},
    request:{cue:'Du brauchst bei der Arbeit Hilfe. Wie fragst du?',responses:['Kannst du mir bitte helfen?','Könntest du mir bitte helfen?','Kannst du mir kurz helfen?']},
    bus:{cue:'Du bist an der Bushaltestelle. Wie fragst du nach dem Bahnhof?',responses:['Wo ist der Bahnhof?','Entschuldigung, wo ist der Bahnhof?','Können Sie mir sagen, wo der Bahnhof ist?']},
    ticket:{cue:'Du möchtest ein Busticket kaufen. Was sagst du?',responses:['Ein Ticket, bitte.','Ich hätte gern ein Busticket.','Kann ich bitte eine Fahrkarte bekommen?']},
  },
  it:{price:{cue:'Come chiedi il prezzo?',responses:['Quanto costa questo?','Qual è il prezzo?']},card:{cue:'Chiedi se puoi pagare con la carta.',responses:['Posso pagare con la carta?','Accettate le carte?']},
    water:{cue:'Hai sete. Come chiedi dell’acqua?',responses:['Posso avere un po’ d’acqua, per favore?','Mi può dare dell’acqua, per favore?','Vorrei dell’acqua, per favore.']},
    thanks:{cue:'Ti ho dato dell’acqua. Cosa dici?',responses:['Grazie.','Grazie mille.','La ringrazio.']},
    offer:{cue:'Il tuo collega porta una scatola pesante. Cosa dici?',responses:['Posso aiutarti?','Hai bisogno di una mano?','Vuoi una mano?']},
    request:{cue:'Hai bisogno di aiuto al lavoro. Come lo chiedi?',responses:['Puoi aiutarmi, per favore?','Mi dai una mano, per favore?','Potresti aiutarmi, per favore?']},
    bus:{cue:'Sei alla fermata dell’autobus. Come chiedi dov’è la stazione?',responses:['Dov’è la stazione?','Scusi, dov’è la stazione?','Può dirmi dov’è la stazione?']},
    ticket:{cue:'Vuoi comprare un biglietto dell’autobus. Cosa dici?',responses:['Un biglietto, per favore.','Vorrei un biglietto dell’autobus, per favore.','Posso avere un biglietto, per favore?']},
  }
};

const intent:Record<CaseName,string>={water:'request-water',thanks:'express-gratitude',offer:'offer-assistance',request:'request-assistance',bus:'ask-location',ticket:'request-ticket',price:'ask-price',card:'ask-card-payment'};
const categories:readonly {domain:DialogueDomain; cases:readonly CaseName[];level:'A0'|'A1'}[]=[
  {domain:'foundation',cases:['water','thanks'],level:'A0'},
  {domain:'work',cases:['offer','request'],level:'A1'},
  {domain:'travel',cases:['bus','ticket'],level:'A1'},
  {domain:'shopping',cases:['price','card'],level:'A1'},
];
/** Six targets x four original, short, curated dialogues = twenty-four demonstration sequences. */
export const guidedDialogues:readonly GuidedDialogue[]=targetLanguages.flatMap(target=>categories.map(category=>({
  id:`${target}-dialogue-${category.domain}`,target,domain:category.domain,level:category.level,
  label:topics[category.domain],isFoundation:category.domain==='foundation',original:true as const,
  turns:category.cases.map(name=>({id:`${target}-${name}`,teacherCue:authored[target][name].cue,
    support:support[name],acceptedReplies:authored[target][name].responses,intent:intent[name]})),
})));
export function dialoguesFor(target:TargetLanguage):GuidedDialogue[]{return guidedDialogues.filter(x=>x.target===target);}
/** Interest controls order, but never removes the core everyday skills. Child profiles remain gated. */
export function selectGuidedDialogues(target:TargetLanguage,focus:LearningFocus,ageStage:AgeStage):DialogueSelection {
  const items=dialoguesFor(target);
  const preference=focus==='work'?'work':focus==='travel'?'travel':focus==='daily-life'?'foundation':null;
  const sorted=[...items].sort((a,b)=>((a.domain===preference)?-1:0)-((b.domain===preference)?-1:0));
  // Prevent unintended child-directed release: after expert, guardian and safety review, enable in a separate change.
  if(ageStage!=='adult')return {status:'requires-child-safety-review',dialogues:[]};
  return {status:'available',dialogues:sorted};
}
export function evaluateDialogueTurn(turn:DialogueTurn,spoken:string,target:TargetLanguage,confidence:RecognitionConfidence):DialogueAttempt {
  if(confidence!=='high'||!spoken.trim())return {verdict:'uncertain'};
  const normalized=normalizedUtterance(spoken,target);
  const match=turn.acceptedReplies.find(r=>normalizedUtterance(r,target)===normalized);
  return match?{verdict:'accepted',matchedReply:match}:{verdict:'retry'};
}
export function newDialogueRun(dialogue:GuidedDialogue):DialogueRun{return{dialogueId:dialogue.id,turnIndex:0,acceptedTurnIds:[],attempts:{},completed:false};}
/** Never advance on uncertain recognition, mismatch or wrong transcript, and never skip unobserved turns. */
export function recordDialogueResponse(run:DialogueRun,dialogue:GuidedDialogue,attempt:DialogueAttempt):DialogueRun {
  if(run.dialogueId!==dialogue.id)throw new Error('Dialogue mismatch');
  if(run.completed || attempt.verdict==='uncertain')return run;
  const turn=dialogue.turns[run.turnIndex];if(!turn)return run;
  const attempts={...run.attempts,[turn.id]:(run.attempts[turn.id]||0)+1};
  if(attempt.verdict==='retry')return{...run,attempts};
  const acceptedTurnIds=[...run.acceptedTurnIds,turn.id];
  const turnIndex=run.turnIndex+1;
  return {...run,attempts,acceptedTurnIds,turnIndex,completed:turnIndex===dialogue.turns.length};
}
/** Spoken cue may be in target or learner's known language; no translation exercise required. */
export function dialogueAudioCue(dialogue:GuidedDialogue,turnIndex:number,knownLanguage:TargetLanguage,explainFirst:boolean):{text:string;language:TargetLanguage}|null {
  const turn=dialogue.turns[turnIndex];if(!turn)return null;
  return explainFirst?{text:turn.support[knownLanguage],language:knownLanguage}:{text:turn.teacherCue,language:dialogue.target};
}
