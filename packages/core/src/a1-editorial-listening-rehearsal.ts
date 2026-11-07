/** Foreground-only A1 editorial TTS rehearsal plan.
 * Does NOT play, generate, record, download or certify any audio.
 * The caller must explicitly request one turn and stop it on background/unmount.
 * System TTS may depend on OS services; OFFLINE IS NOT GUARANTEED.
 */
import {a1EditorialReviewTranscript,currentA1EditorialReview} from './a1-editorial-feedback-review.js';
import {voiceLocales,type VoiceCue} from './voice-library.js';

export interface A1EditorialListeningTurn {
 audioId:string;speaker:'a'|'b';index:number;total:6;
 cue:VoiceCue;reviewerOnly:true;
 recordedAudioAvailable:false;offlineGuaranteed:false;
 canAssessListening:false;canRecordProgress:false;publicAvailable:false;
}
/** Reuses the frozen source dialogue and existing playback VoiceCue contract.
 * Deliberately uses a private cue prefix so no unreviewed source can resolve
 * to a published VoiceFirst voice-pack recording.
 */
export function a1EditorialListeningTurns(input:unknown):readonly A1EditorialListeningTurn[]|null {
 const transcript=a1EditorialReviewTranscript(input);
 if(!transcript||currentA1EditorialReview(input)?.kind==='complete')return null;
 return transcript.turns.map((turn,index)=>({
  audioId:turn.audioId,speaker:turn.speaker,index,total:6 as const,
  cue:{
   id:'a1-editorial-only/'+turn.audioId,
   language:transcript.targetLanguage,
   locale:voiceLocales[transcript.targetLanguage],
   text:turn.text,
   kind:'dialogue-model-answer' as const,
   source:'voicefirst-original' as const
  },
  reviewerOnly:true as const,recordedAudioAvailable:false as const,
  offlineGuaranteed:false as const,canAssessListening:false as const,
  canRecordProgress:false as const,publicAvailable:false as const
 }));
}
