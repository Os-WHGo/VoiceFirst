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
 /** Language in which the learner-facing articulation note is written. */
 readonly noteLanguage:TargetLanguage;
 readonly stressAndArticulation:string;
 readonly status:'prototype-unreviewed';
 readonly attribution:'voicefirst-original';
}

/** A small opt-in authoring pilot, not full coverage of the 30 directed pairs. */
export const prototypePronunciationReadings:readonly PronunciationReading[]=[
 {
  target:'en-CA',known:'es',phrase:'Hello!',targetLocale:'en-CA',
  reading:'he-LÓU',readingScript:'Latn',noteLanguage:'es',
  stressAndArticulation:'La h inicial requiere una salida suave de aire, no es muda. La sílaba final recibe el acento. Esta escritura es solo una aproximación.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'pt-BR',known:'es',phrase:'Olá!',targetLocale:'pt-BR',
  reading:'o-LÁ',readingScript:'Latn',noteLanguage:'es',
  stressAndArticulation:'El acento está en la última sílaba. Los sonidos y el ritmo del portugués brasileño deben comprobarse escuchando un modelo apropiado.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'it',known:'es',phrase:'Ciao!',targetLocale:'it-IT',
  reading:'CHÁ-o',readingScript:'Latn',noteLanguage:'es',
  stressAndArticulation:'La combinación ci en este saludo se aproxima a ch española. Conserva la transición entre las dos vocales.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'es',known:'en-CA',phrase:'¡Hola!',targetLocale:'es-ES',
  reading:'OH-lah',readingScript:'Latn',noteLanguage:'en-CA',
  stressAndArticulation:'The Spanish h is silent. Keep the Spanish o vowel steady without the glide common in English. Stress the first syllable. This reading is approximate.',
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
  r.known===known&&r.noteLanguage===known&&(targetLocale===undefined||r.targetLocale===targetLocale)
 )??null;
}

/** Student-facing help text localized by their KNOWN language, not by the
 * target language. These short UI strings are original drafts for review.
 */
export interface ReadingAidCopy{
 readonly show:string;
 readonly hide:string;
 readonly heading:string;
 readonly unavailable:string;
 readonly disclaimer:string;
}
export const readingAidCopy:Readonly<Record<TargetLanguage,ReadingAidCopy>>={
 'en-CA':{
  show:'How do I read this?',hide:'Hide reading guide',
  heading:'Approximate reading in your language · linguistic review pending',
  unavailable:'No reviewed reading guide exists for this phrase and your known language. We do not guess.',
  disclaimer:'Experimental approximation, not a pronunciation score. Listen to a compatible voice when available.'
 },
 'fr-CA':{
  show:'Comment lire cette phrase?',hide:'Masquer le guide de prononciation',
  heading:'Lecture approximative dans votre langue · révision linguistique à venir',
  unavailable:"Aucun guide de lecture vérifié n’est disponible pour cette phrase et votre langue. Nous n’inventons pas de prononciation.",
  disclaimer:"Approximation expérimentale, pas une note de prononciation. Écoutez une voix compatible si elle est disponible."
 },
 es:{
  show:'Cómo leer esta frase',hide:'Ocultar guía de pronunciación',
  heading:'Lectura aproximada en tu idioma · pendiente de revisión lingüística',
  unavailable:'Aún no hay guía de lectura para esta frase y este idioma de apoyo. No generamos pronunciaciones sin revisar.',
  disclaimer:'Borrador experimental. No determina si tu pronunciación es correcta; escucha un modelo si hay una voz compatible.'
 },
 'pt-BR':{
  show:'Como ler esta frase?',hide:'Ocultar guia de pronúncia',
  heading:'Leitura aproximada no seu idioma · revisão linguística pendente',
  unavailable:'Ainda não há um guia de leitura verificado para esta frase e seu idioma. Não inventamos pronúncias.',
  disclaimer:'Aproximação experimental, não é avaliação de pronúncia. Ouça uma voz compatível quando disponível.'
 },
 de:{
  show:'Wie lese ich diesen Satz?',hide:'Aussprachehilfe ausblenden',
  heading:'Ungefähre Lesehilfe in deiner Sprache · noch nicht sprachlich geprüft',
  unavailable:'Für diesen Satz und deine Sprache ist noch keine geprüfte Lesehilfe vorhanden. Wir raten keine Aussprache.',
  disclaimer:'Experimentelle Annäherung, keine Aussprachebewertung. Höre eine passende Stimme, falls verfügbar.'
 },
 it:{
  show:'Come si legge questa frase?',hide:'Nascondi la guida di pronuncia',
  heading:'Lettura approssimativa nella tua lingua · revisione linguistica in attesa',
  unavailable:'Non è ancora disponibile una guida verificata per questa frase nella tua lingua. Non inventiamo pronunce.',
  disclaimer:'Approssimazione sperimentale, non un voto sulla pronuncia. Ascolta una voce compatibile, se disponibile.'
 }
};
