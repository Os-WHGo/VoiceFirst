/** Private read-only editor content. No recording or network. */
import {File,Paths} from 'expo-file-system';
import {advancedListeningStoryboards,inspectAdvancedReviewManifest,type AdvancedAudioCandidate} from '@voicefirst/core';
import {privateAdvancedReviewUri} from './advanced-editorial-review-audio';
export type ReviewAssets={kind:'candidate';clips:readonly AdvancedAudioCandidate[];verified:false}|{kind:'missing'|'rejected';reason:string;verified:false};
