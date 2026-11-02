/** Offline speech models measured in the 2026-10-23 desktop PoC (docs/VOICE_ENGINE_RESEARCH_2026_10_23.md).
 * CANDIDATES ONLY: licenses are not reviewed (so assessModelFit never makes them usable) and no phone was tested.
 * Digests and byte counts are of the archives downloaded from the sherpa-onnx GitHub releases on 2026-10-23;
 * memory is the desktop process peak minus the Node baseline (about 42 MiB), not a phone measurement.
 */
import type {SpeechModelEntry} from './speech-stack.js';
import type {TargetLanguage} from './types.js';

const release='https://github.com/k2-fsa/sherpa-onnx/releases/download/';
const both=['android','ios'] as const;
function entry(id:string,role:SpeechModelEntry['role'],asset:string,bytes:number,sha256:string,locales:readonly TargetLanguage[],installedBytes:number,peakRamMb:number,
 licenseId:string,languageLock:boolean,note:string):SpeechModelEntry{
 return {pack:{id,kind:role==='tts'?'tts':'asr',version:'2026.10.23',bytes,dependencies:[],locales,sha256,licenseId,licenseReviewed:false,sourceUrl:release+asset},
  role,engine:'sherpa-onnx',platforms:both,installedBytes,peakRamMb,calibratedConfidence:false,languageLock,evidence:{kind:'desktop-poc',date:'2026-10-23',note}};
}
const all:readonly TargetLanguage[]=['en-CA','fr-CA','es','pt-BR','de','it'];
export const measuredSpeechCandidates:readonly SpeechModelEntry[]=Object.freeze([
 // VAD packs share the 'asr' pack kind of language-packs.ts; `role` distinguishes them.
 entry('sherpa-silero-vad','vad','asr-models/silero_vad.onnx',643854,'9e2449e1087496d8d4caba907f23e0bd3f78d91fa552479bb9c23ac09cbb1fd6',all,643854,19,
  'MIT (verify repository LICENSE)',false,'Frame VAD; with pre/post-roll, one utterance per answer in the PoC.'),
 entry('sherpa-whisper-tiny','asr','asr-models/sherpa-onnx-whisper-tiny.tar.bz2',116204861,'c46116994e539aa165266d96b325252728429c12535eb9d8b6a2b10f129e66b1',all,256587445,245,
  'MIT (OpenAI Whisper weights; verify)',true,'Not for grading: 18-20/36 correct answers recognized; 10-14 would be graded as errors.'),
 entry('sherpa-canary-180m-flash-int8','asr','asr-models/sherpa-onnx-nemo-canary-180m-flash-en-es-de-fr-int8.tar.bz2',153692328,'7a38ed8b13f014ad632b09ff8d22e0c6f1359dd046af9235d281dfae841b9ab9',['en-CA','es','de','fr-CA'],207476042,395,
  'CC-BY-4.0 (NVIDIA model card; verify)',true,'en/es/de/fr only. 23-24/24 recognized; 0-1 false error.'),
 entry('sherpa-parakeet-tdt-0.6b-v3-int8','asr','asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8.tar.bz2',487170055,'5793d0fd397c5778d2cf2126994d58e9d56b1be7c04d13c7a15bb1b4eafb16bf',all,671239000,835,
  'CC-BY-4.0 (NVIDIA model card; verify)',false,'All six. 32-33/36 recognized; short answers can drift to English (no language lock).'),
 entry('sherpa-piper-de-thorsten-medium','tts','tts-models/vits-piper-de_DE-thorsten-medium.tar.bz2',67214254,'50487d9c95fdf2191f31d2588569381063ba1591dcd4c7d4bdd30f12b2191714',['de'],81146852,120,
  'Dataset CC0; voice model and bundled espeak-ng-data (GPL-3.0) need review',false,'TTS RTF about 0.07 on desktop.'),
 entry('sherpa-piper-es-davefx-medium','tts','tts-models/vits-piper-es_ES-davefx-medium.tar.bz2',67184952,'a3f6beb54a9cb893279f72978a22f807a4d9fc9c7848157b524d5cc7b7f58b22',['es'],81146842,120,
  'Dataset CC0; voice model and bundled espeak-ng-data (GPL-3.0) need review',false,'Spain Spanish voice.'),
 entry('sherpa-piper-pt-br-faber-medium','tts','tts-models/vits-piper-pt_BR-faber-medium.tar.bz2',67183065,'7add3f923ad6bc25ca8a192805fd1a64d1b3893e4611c4a9719545a825039a83',['pt-BR'],81199149,120,
  'Dataset CC0; voice model and bundled espeak-ng-data (GPL-3.0) need review',false,'Brazilian voice.'),
 entry('sherpa-piper-fr-siwis-medium','tts','tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2',67207459,'375909aa30842b3a4efa10b1beb1d761af792960ae6873b4d53889f96c66195b',['fr-CA'],81146921,120,
  'Dataset CC-BY-4.0 (attribution); espeak-ng-data (GPL-3.0) needs review',false,'France French voice: no fr-CA voice was found; regional gap.'),
]);
