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
 /** Human-authored approximate reading groups, not automated phoneme/syllable analysis. */
 readonly approximateSyllables:readonly string[];
 /** Zero-based index of the prominent reading group, if known. Not an ASR grade. */
 readonly prominentSyllableIndex:number|null;
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
  approximateSyllables:['he','LÓU'],prominentSyllableIndex:1,
  stressAndArticulation:'La h inicial requiere una salida suave de aire, no es muda. La sílaba final recibe el acento. Esta escritura es solo una aproximación.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'pt-BR',known:'es',phrase:'Olá!',targetLocale:'pt-BR',
  reading:'o-LÁ',readingScript:'Latn',noteLanguage:'es',
  approximateSyllables:['o','LÁ'],prominentSyllableIndex:1,
  stressAndArticulation:'El acento está en la última sílaba. Los sonidos y el ritmo del portugués brasileño deben comprobarse escuchando un modelo apropiado.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'it',known:'es',phrase:'Ciao!',targetLocale:'it-IT',
  reading:'CHÁ-o',readingScript:'Latn',noteLanguage:'es',
  approximateSyllables:['CHÁ','o'],prominentSyllableIndex:0,
  stressAndArticulation:'La combinación ci en este saludo se aproxima a ch española. Conserva la transición entre las dos vocales.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 },
 {
  target:'es',known:'en-CA',phrase:'¡Hola!',targetLocale:'es-ES',
  reading:'OH-lah',readingScript:'Latn',noteLanguage:'en-CA',
  approximateSyllables:['OH','lah'],prominentSyllableIndex:0,
  stressAndArticulation:'The Spanish h is silent. Keep the Spanish o vowel steady without the glide common in English. Stress the first syllable. This reading is approximate.',
  status:'prototype-unreviewed',attribution:'voicefirst-original'
 }
];

/** Validate authored chunks before displaying them. A library update, future
 * offline pack or malformed human edit must not silently display a contradictory
 * stress position or reading. This checks internal consistency, not correctness
 * against an actual native speaker.
 */
export function consistentPronunciationReading(r:PronunciationReading):boolean{
 return !!r && r.target!==r.known && r.noteLanguage===r.known &&
  r.status==='prototype-unreviewed' && r.attribution==='voicefirst-original' &&
  r.readingScript==='Latn' && r.phrase.trim().length>0 &&
  r.targetLocale.trim().length>0 && Array.isArray(r.approximateSyllables) &&
  r.approximateSyllables.length>0 && r.approximateSyllables.length<=24 &&
  r.approximateSyllables.every(part=>typeof part==='string'&&
   part.length>0&&part===part.trim()&&!/[-·\\n\\r]/u.test(part)) &&
  r.approximateSyllables.join('-').normalize('NFC')===r.reading.normalize('NFC') &&
  (r.prominentSyllableIndex===null ||
   (Number.isSafeInteger(r.prominentSyllableIndex)&&r.prominentSyllableIndex>=0&&
    r.prominentSyllableIndex<r.approximateSyllables.length));
}

/** Return null instead of guessing. Never silently fall back to another region
 * or a spelling hint meant for another learner language.
 */
export function pronunciationReadingFor(
 phrase:string,target:TargetLanguage,known:TargetLanguage,targetLocale?:string
):PronunciationReading|null{
 if(!phrase.trim()||target===known)return null;
 return prototypePronunciationReadings.find(r=>
  consistentPronunciationReading(r)&&
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
 readonly syllables:string;
 readonly emphasis:string;
 readonly unavailable:string;
 readonly disclaimer:string;
}
export const readingAidCopy:Readonly<Record<TargetLanguage,ReadingAidCopy>>={
 'en-CA':{
  show:'How do I read this?',hide:'Hide reading guide',
  heading:'Approximate reading in your language · linguistic review pending',
  syllables:'Approximate reading groups',emphasis:'Prominent group (approximate)',
  unavailable:'No reviewed reading guide exists for this phrase and your known language. We do not guess.',
  disclaimer:'Experimental approximation, not a pronunciation score. Listen to a compatible voice when available.'
 },
 'fr-CA':{
  show:'Comment lire cette phrase?',hide:'Masquer le guide de prononciation',
  heading:'Lecture approximative dans votre langue · révision linguistique à venir',
  syllables:'Groupes de lecture approximatifs',emphasis:'Groupe accentué (approximatif)',
  unavailable:"Aucun guide de lecture vérifié n’est disponible pour cette phrase et votre langue. Nous n’inventons pas de prononciation.",
  disclaimer:"Approximation expérimentale, pas une note de prononciation. Écoutez une voix compatible si elle est disponible."
 },
 es:{
  show:'Cómo leer esta frase',hide:'Ocultar guía de pronunciación',
  heading:'Lectura aproximada en tu idioma · pendiente de revisión lingüística',
  syllables:'Sílabas de lectura aproximadas',emphasis:'Sílaba destacada (aproximada)',
  unavailable:'Aún no hay guía de lectura para esta frase y este idioma de apoyo. No generamos pronunciaciones sin revisar.',
  disclaimer:'Borrador experimental. No determina si tu pronunciación es correcta; escucha un modelo si hay una voz compatible.'
 },
 'pt-BR':{
  show:'Como ler esta frase?',hide:'Ocultar guia de pronúncia',
  heading:'Leitura aproximada no seu idioma · revisão linguística pendente',
  syllables:'Sílabas de leitura aproximadas',emphasis:'Sílaba destacada (aproximada)',
  unavailable:'Ainda não há um guia de leitura verificado para esta frase e seu idioma. Não inventamos pronúncias.',
  disclaimer:'Aproximação experimental, não é avaliação de pronúncia. Ouça uma voz compatível quando disponível.'
 },
 de:{
  show:'Wie lese ich diesen Satz?',hide:'Aussprachehilfe ausblenden',
  heading:'Ungefähre Lesehilfe in deiner Sprache · noch nicht sprachlich geprüft',
  syllables:'Ungefähre Sprechabschnitte',emphasis:'Betonter Abschnitt (ungefähr)',
  unavailable:'Für diesen Satz und deine Sprache ist noch keine geprüfte Lesehilfe vorhanden. Wir raten keine Aussprache.',
  disclaimer:'Experimentelle Annäherung, keine Aussprachebewertung. Höre eine passende Stimme, falls verfügbar.'
 },
 it:{
  show:'Come si legge questa frase?',hide:'Nascondi la guida di pronuncia',
  heading:'Lettura approssimativa nella tua lingua · revisione linguistica in attesa',
  syllables:'Sillabe indicative per la lettura',emphasis:'Sillaba evidenziata (indicativa)',
  unavailable:'Non è ancora disponibile una guida verificata per questa frase nella tua lingua. Non inventiamo pronunce.',
  disclaimer:'Approssimazione sperimentale, non un voto sulla pronuncia. Ascolta una voce compatibile, se disponibile.'
 }
};
