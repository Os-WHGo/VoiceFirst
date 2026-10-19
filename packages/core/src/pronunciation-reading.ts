/** Optional readable pronunciation pilots, never a substitute for expert audio.
 * A transcription is valid only for the exact target utterance and the
 * learner's known language. No automatic spelling-to-sound guessing.
 *
 * These original examples are PROTOTYPES pending linguistic review; do not
 * present them as native-speaker-verified or use them for scoring.
 */
import {type TargetLanguage} from './types.js';

export interface PronunciationReading {
 readonly target:TargetLanguage;
 readonly known:TargetLanguage;
 readonly phrase:string;
 readonly targetLocale:string;
 readonly reading:string;
 readonly readingScript:'Latn';
 readonly stressAndArticulation:string;
 readonly status:'prototype-unreviewed';
 readonly attribution:'voicefirst-original';
}

/** A small opt-in authoring pilot, not full coverage of the 30 directed pairs. */
export const prototypePronunciationReadings:readonly PronunciationReading[]=[
 {
  target:'en-CA',known:'es',phrase:'Hello!',targetLocale:'en-CA',
  reading:'he-LÓU',readingScript:'Latn',
  stressAndArticulation:'La h inicial requiere una salida suave de aire, no es muda. La sílaba final recibe el acento. Esta escritura es solo una aproximación.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'pt-BR',known:'es',phrase:'Olá!',targetLocale:'pt-BR',
  reading:'o-LÁ',readingScript:'Latn',
  stressAndArticulation:'El acento está en la última sílaba. Los sonidos y el ritmo del portugués brasileño deben comprobarse escuchando un modelo apropiado.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'it',known:'es',phrase:'Ciao!',targetLocale:'it-IT',
  reading:'CHÁ-o',readingScript:'Latn',
  stressAndArticulation:'La combinación ci en este saludo se aproxima a ch española. Conserva la transición entre las dos vocales.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'es',known:'en-CA',phrase:'¡Hola!',targetLocale:'es-ES',
  reading:'OH-lah',readingScript:'Latn',
  stressAndArticulation:'La h es muda. Mantén la o española estable: no tiene el deslizamiento vocálico frecuente del inglés.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 }
];

/** Return null instead of guessing. Never silently fall back to another region
 * or a spelling hint meant for another learner language.
 */
export function pronunciationReadingFor(
 phrase:string,target:TargetLanguage,known:TargetLanguage,targetLocale?:string
):PronunciationReading|null{
 if(!phrase.trim()||target===known)return null;
 return prototypePronunciationReadings.find(r=>
  r.phrase===phrase.normalize('NFC').trim()&&r.target===target&&
  r.known===known&&(targetLocale===undefined||r.targetLocale===targetLocale)
 )??null;
}
