/** Two separate explicit spoken acts are needed to approve a voice-navigation
 * proposal. This recognizer is for the learner's known language, not for grading
 * speech or general conversation. Bare yes/no and answer confirmations are
 * deliberately not command approvals.
 */
import type {TargetLanguage} from './types.js';
import type {VoiceCommand} from './commands.js';

export type SpokenCommandApproval='approve'|'cancel'|null;
type LocalCopy={approve:string;cancel:string;proposed:string};
const instructions:Readonly<Record<TargetLanguage,LocalCopy>>={
 es:{approve:'confirmar comando de voz',cancel:'cancelar comando de voz',
  proposed:'He reconocido el comando {command}. Para ejecutarlo, di «{approve}». Para descartarlo, di «{cancel}».'},
 'en-CA':{approve:'confirm voice command',cancel:'cancel voice command',
  proposed:'I heard the command {command}. Say “{approve}” to carry it out or “{cancel}” to dismiss it.'},
 'fr-CA':{approve:'confirmer la commande vocale',cancel:'annuler la commande vocale',
  proposed:'J’ai reconnu la commande {command}. Dites « {approve} » pour l’exécuter ou « {cancel} » pour l’annuler.'},
 'pt-BR':{approve:'confirmar comando de voz',cancel:'cancelar comando de voz',
  proposed:'Reconheci o comando {command}. Diga «{approve}» para executar ou «{cancel}» para descartar.'},
 de:{approve:'Sprachbefehl bestätigen',cancel:'Sprachbefehl abbrechen',
  proposed:'Ich habe den Befehl {command} erkannt. Sage „{approve}“ zum Ausführen oder „{cancel}“ zum Abbrechen.'},
 it:{approve:'conferma comando vocale',cancel:'annulla comando vocale',
  proposed:'Ho riconosciuto il comando {command}. Di «{approve}» per eseguirlo o «{cancel}» per annullarlo.'}
};
const readableNames:Readonly<Record<TargetLanguage,Readonly<Partial<Record<VoiceCommand['type'],string>>>>>={
 es:{PAUSE:'pausar',STOP:'terminar',NEXT:'siguiente ejercicio',REPEAT:'repetir',SLOWER:'más lento',FASTER:'más rápido',HELP:'pista',SUMMARY:'resumen',ONLY_LISTEN:'escuchar modelo',RESUME:'reanudar'},
 'en-CA':{PAUSE:'pause',STOP:'finish',NEXT:'next exercise',REPEAT:'repeat',SLOWER:'slower',FASTER:'faster',HELP:'hint',SUMMARY:'summary',ONLY_LISTEN:'listen to the model',RESUME:'resume'},
 'fr-CA':{PAUSE:'pause',STOP:'terminer',NEXT:'exercice suivant',REPEAT:'répéter',SLOWER:'plus lentement',FASTER:'plus vite',HELP:'indice',SUMMARY:'résumé',ONLY_LISTEN:'écouter le modèle',RESUME:'reprendre'},
 'pt-BR':{PAUSE:'pausar',STOP:'terminar',NEXT:'próximo exercício',REPEAT:'repetir',SLOWER:'mais devagar',FASTER:'mais rápido',HELP:'dica',SUMMARY:'resumo',ONLY_LISTEN:'ouvir o modelo',RESUME:'retomar'},
 de:{PAUSE:'Pause',STOP:'beenden',NEXT:'nächste Übung',REPEAT:'wiederholen',SLOWER:'langsamer',FASTER:'schneller',HELP:'Hinweis',SUMMARY:'Zusammenfassung',ONLY_LISTEN:'Beispiel hören',RESUME:'fortsetzen'},
 it:{PAUSE:'pausa',STOP:'termina',NEXT:'prossimo esercizio',REPEAT:'ripeti',SLOWER:'più lentamente',FASTER:'più veloce',HELP:'suggerimento',SUMMARY:'riepilogo',ONLY_LISTEN:'ascolta il modello',RESUME:'riprendi'}
};
function normalize(transcript:string):string {
 return transcript.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu,' ').trim().replace(/\s+/g,' ');
}
/** One complete exact sentence, never a substring, generic affirmation or an
 * answer-grading command. Does not interpret native ASR confidence as reliable. */
export function spokenCommandApproval(transcript:unknown,known:TargetLanguage):SpokenCommandApproval {
 if(typeof transcript!=='string'||transcript.length>160)return null;
 const copy=instructions[known];
 if(!copy)return null;
 const value=normalize(transcript);
 if(value===normalize(copy.approve))return 'approve';
 if(value===normalize(copy.cancel))return 'cancel';
 return null;
}
export function voiceCommandProposalPrompt(known:TargetLanguage,command:VoiceCommand):string {
 const copy=instructions[known];
 if(!copy)return '';
 const name=readableNames[known][command.type]??command.type.toLocaleLowerCase();
 return copy.proposed.replace('{command}',name).replace('{approve}',copy.approve).replace('{cancel}',copy.cancel);
}

/** A cancelled navigation action is neutral: reopen a safe command turn, not
 * a choice or learning answer, and do not award progress. */
export function voiceCommandRetryPrompt(known:TargetLanguage):string {
 const copy:Readonly<Record<TargetLanguage,string>>={
  es:'Comando cancelado. Puedes decir siguiente ejercicio, repite, más lento o pausa.',
  'en-CA':'Command cancelled. You can say next exercise, repeat that, speak slower or pause.',
  'fr-CA':'Commande annulée. Vous pouvez dire exercice suivant, répétez, plus lentement ou pause.',
  'pt-BR':'Comando cancelado. Você pode dizer próximo exercício, repita, mais devagar ou pausa.',
  de:'Befehl abgebrochen. Du kannst nächste Übung, wiederholen, langsamer oder Pause sagen.',
  it:'Comando annullato. Puoi dire prossimo esercizio, ripeti, più lentamente o pausa.'
 };
 return copy[known];
}
