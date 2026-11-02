/** First public release SCOPE, not a claim of release readiness.
 * Private beta can test unfinished A0-C2 journeys. Public launch remains blocked
 * until the full authored, approved, offline voice-first course passes real QA.
 * Keep all six targetLanguages and their authored material in the shared core.
 */
import {targetLanguages,type TargetLanguage} from './types.js';

export const firstReleaseLanguages=['en-CA','fr-CA','es'] as const satisfies readonly TargetLanguage[];
export const comingSoonLanguages=['pt-BR','de','it'] as const satisfies readonly TargetLanguage[];

export type FirstReleaseLanguageStatus='selected-for-first-release'|'coming-soon';

/** Selected for development and private beta does NOT mean a finished C2 course. */
export function firstReleaseLanguageStatus(language:TargetLanguage):FirstReleaseLanguageStatus {
 return firstReleaseLanguages.includes(language as (typeof firstReleaseLanguages)[number])
  ?'selected-for-first-release':'coming-soon';
}

/** Never expose a coming-soon course as playable in the first-release selector. */
export function canSelectFirstReleaseLanguage(language:TargetLanguage):boolean {
 return targetLanguages.includes(language)&&firstReleaseLanguageStatus(language)==='selected-for-first-release';
}

/** The known/help language must also be offered in this first-release UI. */
export function canSelectFirstReleasePair(known:TargetLanguage,target:TargetLanguage):boolean {
 return known!==target&&canSelectFirstReleaseLanguage(known)&&canSelectFirstReleaseLanguage(target);
}

export const firstReleaseLanguagePairs=firstReleaseLanguages.flatMap(known=>
 firstReleaseLanguages.filter(target=>target!==known).map(target=>({known,target}))
);

/** The public course is not declared ready by language selection or editorial drafts. */
export const firstPublicReleaseReadiness={
 status:'not-ready' as const,
 requiredLevels:['A0','A1','A2','B1','B2','C1','C2'] as const,
 blockers:[
  'approved-complete-curriculum-through-C2-for-three-languages',
  'verified-local-audio-and-rights',
  'speech-session-and-offline-real-device-validation',
  'resolved-or-formally-reviewed-dependency-security-gate'
 ] as const
};
