import type { TargetLanguage } from './types.js';
export type VoiceCommand =
  | { type: 'START' | 'STOP' | 'PAUSE' | 'RESUME' | 'REPEAT' | 'HELP' | 'SLOWER' | 'FASTER' | 'SUMMARY' | 'NEXT' | 'ONLY_LISTEN' | 'CONFIRM_ANSWER' | 'REJECT_ANSWER' }
  | { type: 'TARGET'; language: TargetLanguage }
  | { type: 'EXPLAIN_IN'; language: TargetLanguage };

function clean(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const patterns: ReadonlyArray<{ words: readonly string[]; action: VoiceCommand }> = [
  { words: ['inicia mi clase', 'empezar mi clase', 'comenzar clase', 'start my lesson', 'start lesson', 'commencer la lecon'], action: { type: 'START' } },
  { words: ['terminar clase', 'detener clase', 'finalizar clase', 'stop lesson', 'end lesson', 'terminer la lecon'], action: { type: 'STOP' } },
  { words: ['pausa', 'pausar clase', 'pause', 'pause lesson', 'mettre en pause'], action: { type: 'PAUSE' } },
  { words: ['continuemos', 'reanudar clase', 'continuar clase', 'resume', 'resume lesson', 'reprendre la lecon'], action: { type: 'RESUME' } },
  { words: ['repitelo', 'repite', 'otra vez', 'repeat that', 'say it again', 'repete'], action: { type: 'REPEAT' } },
  { words: ['mas lento', 'habla mas lento', 'speak slower', 'slower please', 'parle plus lentement'], action: { type: 'SLOWER' } },
  { words: ['mas rapido', 'habla mas rapido', 'speak faster', 'faster please', 'parle plus vite'], action: { type: 'FASTER' } },
  { words: ['no entendi', 'dame una pista', 'ayuda', 'i need a hint', 'i do not understand', 'je ne comprends pas'], action: { type: 'HELP' } },
  { words: ['siguiente ejercicio', 'siguiente', 'next exercise', 'next question', 'exercice suivant'], action: { type: 'NEXT' } },
  { words: ['que aprendi hoy', 'resumen', 'summary', 'what did i learn', 'resume de la lecon'], action: { type: 'SUMMARY' } },
  { words: ['solo escuchar', 'quiero solo escuchar', 'just listen', 'listening only', 'ecouter seulement'], action: { type: 'ONLY_LISTEN' } },
  { words: ['cambia a frances', 'cambiemos a frances', 'switch to french', 'passer en francais'], action: { type: 'TARGET', language: 'fr-CA' } },
  { words: ['cambia a ingles', 'cambiemos a ingles', 'switch to english', 'passer en anglais'], action: { type: 'TARGET', language: 'en-CA' } },
  { words: ['explicame en espanol', 'explica en espanol', 'explain in spanish'], action: { type: 'EXPLAIN_IN', language: 'es' } },
  { words: ['solo en ingles', 'hablame en ingles', 'speak only english', 'explain in english'], action: { type: 'EXPLAIN_IN', language: 'en-CA' } },
  { words: ['explica en frances', 'explain in french'], action: { type: 'EXPLAIN_IN', language: 'fr-CA' } },
  { words: ['cambia a espanol', 'switch to spanish', 'passer en espagnol', 'mudar para espanhol', 'wechsle zu spanisch', 'passa allo spagnolo'], action: { type: 'TARGET', language:'es' } },
  { words: ['cambia a portugues', 'switch to portuguese', 'passer en portugais', 'mudar para portugues', 'wechsle zu portugiesisch', 'passa al portoghese'], action: { type: 'TARGET', language:'pt-BR' } },
  { words: ['cambia a aleman', 'switch to german', 'passer en allemand', 'mudar para alemao', 'wechsle zu deutsch', 'passa al tedesco'], action: { type: 'TARGET', language:'de' } },
  { words: ['cambia a italiano', 'switch to italian', 'passer en italien', 'mudar para italiano', 'wechsle zu italienisch', 'passa all italiano'], action: { type: 'TARGET', language:'it' } },
  { words: ['explica en portugues', 'explain in portuguese', 'explique em portugues'], action: { type: 'EXPLAIN_IN', language: 'pt-BR' } },
  { words: ['explica en aleman', 'explain in german', 'erklare auf deutsch'], action: { type: 'EXPLAIN_IN', language: 'de' } },
  { words: ['explica en italiano', 'explain in italian', 'spiega in italiano'], action: { type: 'EXPLAIN_IN', language: 'it' } },
  { words: ['comece minha aula', 'inizia la lezione', 'lektion beginnen'], action: { type: 'START' } },
  { words: ['repita por favor', 'wiederholen bitte', 'ripeti per favore'], action: { type: 'REPEAT' } },
  { words: ['pausar aula', 'pausa na aula', 'lektion pausieren', 'pause machen', 'pausa lezione', 'metti in pausa'], action: { type: 'PAUSE' } },
  { words: ['continuar aula', 'retomar aula', 'lektion fortsetzen', 'weiterlernen', 'riprendi la lezione', 'continua la lezione'], action: { type: 'RESUME' } },
  { words: ['terminar aula', 'encerrar aula', 'lektion beenden', 'lezione finita', 'termina la lezione'], action: { type: 'STOP' } },
  { words: ['mais devagar', 'fale mais devagar', 'langsamer bitte', 'sprich langsamer', 'piu lentamente', 'parla piu lentamente'], action: { type: 'SLOWER' } },
  { words: ['uma dica', 'me de uma dica', 'gib mir einen hinweis', 'ein hinweis bitte', 'dammi un indizio', 'un suggerimento'], action: { type: 'HELP' } },
  { words: ['proximo exercicio', 'nachste ubung', 'prossimo esercizio'], action: { type: 'NEXT' } },
  { words: ['o que aprendi', 'resumo da aula', 'was habe ich gelernt', 'zusammenfassung', 'cosa ho imparato', 'riepilogo'], action: { type: 'SUMMARY' } },
  { words: ['apenas ouvir', 'so escutar', 'nur zuhoren', 'nur horen', 'solo ascoltare', 'voglio solo ascoltare'], action: { type: 'ONLY_LISTEN' } },
  { words: ['mais rapido', 'fale mais rapido', 'schneller bitte', 'sprich schneller', 'piu veloce', 'parla piu veloce'], action: { type: 'FASTER' } },
  { words: ['comece de novo', 'noch einmal', 'ancora una volta'], action: { type: 'REPEAT' } },
  { words: ['suivant', 'exercice suivant s il vous plait', 'proximo', 'proxima atividade', 'weiter', 'nachste aufgabe', 'avanti', 'prossima domanda'], action: { type: 'NEXT' } },
  { words: ['ecouter seulement', 'seulement ecouter', 'nur anhoren', 'ascolta soltanto'], action: { type: 'ONLY_LISTEN' } },
  { words: ['plus vite', 'parle plus rapidement', 'plus rapido', 'piu in fretta'], action: { type: 'FASTER' } },
  { words: ['un indice', 'aide moi', 'hilfe bitte', 'aiutami'], action: { type: 'HELP' } },
  // Explicit multiword confirmation ONLY after a pending ASR answer, never a bare yes/no.
  { words: ['confirmar mi respuesta', 'confirmo mi respuesta', 'confirm my answer', 'i confirm my answer',
    'confirmer ma reponse', 'je confirme ma reponse', 'confirmar minha resposta', 'confirmo minha resposta',
    'antwort bestatigen', 'ich bestatige meine antwort', 'conferma la mia risposta', 'confermo la mia risposta'], action: { type: 'CONFIRM_ANSWER' } },
  { words: ['rechazar mi respuesta', 'repito mi respuesta', 'reject my answer', 'retry my answer',
    'refuser ma reponse', 'recommencer ma reponse', 'rejeitar minha resposta', 'refazer minha resposta',
    'antwort ablehnen', 'ich wiederhole meine antwort', 'rifiuta la mia risposta', 'ripeto la mia risposta'], action: { type: 'REJECT_ANSWER' } },
  { words: ['explica em portugues'], action: { type: 'EXPLAIN_IN', language: 'pt-BR' } },
  { words: ['erklar es auf deutsch'], action: { type: 'EXPLAIN_IN', language: 'de' } },
  { words: ['spiegami in italiano'], action: { type: 'EXPLAIN_IN', language: 'it' } },

];
const index = new Map(patterns.flatMap(({ words, action }) => words.map((w): [string, VoiceCommand] => [clean(w), action])));
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const normalized = clean(transcript);
  if (!normalized) return null;
  const noPoliteness = normalized.replace(/^(por favor|please|s il vous plait)\s+/, '');
  const withoutTrailingPoliteness = noPoliteness.replace(/\s+(por favor|please|s il vous plait)$/, '');
  return index.get(normalized) ?? index.get(noPoliteness) ?? index.get(withoutTrailingPoliteness) ?? null;
}
// Strict exact matching intentionally prevents the phrase 'I said pause' from halting a lesson.
