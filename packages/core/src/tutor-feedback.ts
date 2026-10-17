/** Offline tutoring feedback policy. This selects a teaching action, never a pronunciation grade.
 * The audio layer can speak these curated hints in the learner's support language.
 */
import type {TargetLanguage} from './types.js';
import type {DialogueTurn,DialogueAttempt} from './guided-dialogues.js';
import type {LocalizedText} from './course.js';

export type TutorTeachingAction='advance'|'ask-again'|'offer-hint'|'model-answer'|'confirm-hearing';
export interface TutorFeedbackDecision{
 action:TutorTeachingAction;
 message:LocalizedText;
 /** Whether the turn may be marked successful by the caller. */
 canAdvance:boolean;
 /** An authored example, not a synthesized or fabricated correction. */
 example?:string;
}
const L=(en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
const feedback={
 success:L('Good! Let’s try another situation.','Bien ! Essayons une autre situation.','¡Bien! Probemos otra situación.','Muito bem! Vamos tentar outra situação.','Gut! Versuchen wir eine andere Situation.','Bene! Proviamo un’altra situazione.'),
 retry:L('That expression is not in this exercise's examples yet. Try another way to say it.','Réessaie. Dis ce dont tu as besoin avec tes mots.','Esa expresión aún no está entre los ejemplos de este ejercicio. Prueba otra forma de decirlo.','Tente novamente. Diga o que precisa com suas palavras.','Versuch es noch einmal. Sag mit eigenen Worten, was du brauchst.','Riprova. Di di cosa hai bisogno con parole tue.'),
 hint:L('Here is a possible answer. Listen, then try it yourself.','Voici une réponse possible. Écoute, puis essaie.','Esta es una respuesta posible. Escucha y luego inténtalo.','Aqui está uma resposta possível. Ouça e tente.','Hier ist eine mögliche Antwort. Hör zu und versuch es.','Ecco una possibile risposta. Ascolta e prova.'),
 model:L('Let’s practice with an example. You can answer in another correct way too.','Pratiquons avec un exemple. Tu peux aussi répondre autrement.','Practiquemos con un ejemplo. También puedes responder correctamente de otra forma.','Vamos praticar com um exemplo. Você também pode responder de outra forma.','Üben wir mit einem Beispiel. Du kannst auch anders richtig antworten.','Facciamo pratica con un esempio. Puoi rispondere correttamente anche in un altro modo.'),
 uncertain:L('I could not hear clearly. Please repeat, or use another input method.','Je n’ai pas bien entendu. Répète ou utilise une autre méthode.','No escuché con claridad. Repite o usa otra forma de responder.','Não ouvi com clareza. Repita ou use outra forma de responder.','Ich habe dich nicht gut verstanden. Wiederhole oder nutze eine andere Eingabe.','Non ho sentito bene. Ripeti o usa un altro metodo.'),
};
export function decideTutorFeedback(turn:DialogueTurn,attempt:DialogueAttempt,confidentRetries:number):TutorFeedbackDecision{
 if(attempt.verdict==='uncertain')return{action:'confirm-hearing',message:feedback.uncertain,canAdvance:false};
 if(attempt.verdict==='accepted')return{action:'advance',message:feedback.success,canAdvance:true};
 const count=Number.isFinite(confidentRetries)?Math.max(0,Math.floor(confidentRetries)):0;
 if(count===0)return{action:'ask-again',message:feedback.retry,canAdvance:false};
 if(count===1)return{action:'offer-hint',message:feedback.hint,canAdvance:false,example:turn.acceptedReplies[0]};
 return{action:'model-answer',message:feedback.model,canAdvance:false,example:turn.acceptedReplies[0]};
}
export function tutorFeedbackForLanguage(decision:TutorFeedbackDecision,knownLanguage:TargetLanguage):string{
 return decision.message[knownLanguage];
}
