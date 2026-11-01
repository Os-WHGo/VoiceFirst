/** Explicit, numbered, hands-free selection for authored comprehension choices.
 * Matches one exact phrase in the learner's known language: a noisy ASR
 * transcript cannot choose by substring, fuzzy similarity or a bare number.
 * Selecting proposes an option; only a second explicit confirm can submit it.
 */
import type {TargetLanguage} from './types.js';

const ordinal:Readonly<Record<TargetLanguage,readonly string[]>>={
 'en-CA':['first','second','third','fourth'],
 'fr-CA':['première','deuxième','troisième','quatrième'],
 es:['primera','segunda','tercera','cuarta'],
 'pt-BR':['primeira','segunda','terceira','quarta'],
 de:['erste','zweite','dritte','vierte'],
 it:['prima','seconda','terza','quarta'],
};
const fullPhrases:Readonly<Record<TargetLanguage,readonly string[]>>={
 'en-CA':['I choose the first option','I choose the second option','I choose the third option','I choose the fourth option'],
 'fr-CA':['Je choisis la première option','Je choisis la deuxième option','Je choisis la troisième option','Je choisis la quatrième option'],
 es:['Elijo la primera opción','Elijo la segunda opción','Elijo la tercera opción','Elijo la cuarta opción'],
 'pt-BR':['Escolho a primeira opção','Escolho a segunda opção','Escolho a terceira opção','Escolho a quarta opção'],
 de:['Ich wähle die erste Option','Ich wähle die zweite Option','Ich wähle die dritte Option','Ich wähle die vierte Option'],
 it:['Scelgo la prima opzione','Scelgo la seconda opzione','Scelgo la terza opzione','Scelgo la quarta opzione'],
};
const labelPhrases:Readonly<Record<TargetLanguage,readonly string[]>>={
 'en-CA':['First option','Second option','Third option','Fourth option'],
 'fr-CA':['Première option','Deuxième option','Troisième option','Quatrième option'],
 es:['Primera opción','Segunda opción','Tercera opción','Cuarta opción'],
 'pt-BR':['Primeira opção','Segunda opção','Terceira opção','Quarta opção'],
 de:['Erste Option','Zweite Option','Dritte Option','Vierte Option'],
 it:['Prima opzione','Seconda opzione','Terza opzione','Quarta opzione'],
};
function normalized(value:string):string{
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu,' ').trim().replace(/\s+/g,' ');
}
/** 0-based index, or null. Deliberately requires the complete spoken intent. */
export function voiceChoiceIndex(transcript:unknown,known:TargetLanguage,optionCount:number):number|null{
 if(typeof transcript!=='string'||!Number.isInteger(optionCount)||optionCount<1||optionCount>4||!fullPhrases[known])return null;
 const phrase=normalized(transcript);
 if(!phrase)return null;
 const result=fullPhrases[known].findIndex((candidate,index)=>index<optionCount&&normalized(candidate)===phrase);
 return result<0?null:result;
}
export function voiceChoiceLabel(known:TargetLanguage,index:number):string{
 return labelPhrases[known]?.[index]??'';
}
export function voiceChoiceCommandHint(known:TargetLanguage):string{
 const sample=fullPhrases[known][0]!;
 const copy:Readonly<Record<TargetLanguage,string>>={
  'en-CA':`Say a complete choice such as "${sample}". Your selection will be confirmed before it counts.`,
  'fr-CA':`Dis un choix complet, par exemple « ${sample} ». Tu pourras confirmer avant de valider.`,
  es:`Di una elección completa, por ejemplo «${sample}». Podrás confirmarla antes de enviarla.`,
  'pt-BR':`Diga uma escolha completa, como «${sample}». Confirme antes de enviar.`,
  de:`Sage eine vollständige Auswahl, zum Beispiel „${sample}“. Bestätige sie vor dem Absenden.`,
  it:`Pronuncia una scelta completa, per esempio «${sample}». Confermala prima di inviarla.`,
 };
 return copy[known];
}
export function voiceChoiceConfirmation(known:TargetLanguage,index:number,optionText:string):string{
 const label=voiceChoiceLabel(known,index);
 const copy:Readonly<Record<TargetLanguage,string>>={
  'en-CA':`Proposed: ${label}. ${optionText}. Say "confirm my answer" to submit or "reject my answer" to choose again.`,
  'fr-CA':`Proposition : ${label}. ${optionText}. Dis « confirmer ma réponse » pour valider ou « refuser ma réponse » pour choisir encore.`,
  es:`Propuesta: ${label}. ${optionText}. Di «confirmar mi respuesta» para enviar o «rechazar mi respuesta» para elegir otra.`,
  'pt-BR':`Proposta: ${label}. ${optionText}. Diga «confirmar minha resposta» para enviar ou «rejeitar minha resposta» para escolher novamente.`,
  de:`Vorschlag: ${label}. ${optionText}. Sage „Antwort bestätigen“ zum Senden oder „Antwort ablehnen“ für eine neue Auswahl.`,
  it:`Proposta: ${label}. ${optionText}. Di «conferma la mia risposta» per inviare o «rifiuta la mia risposta» per scegliere di nuovo.`,
 };
 return copy[known];
}
