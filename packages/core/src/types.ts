export const targetLanguages = ['en-CA', 'fr-CA', 'es', 'pt-BR', 'de', 'it'] as const;
export type TargetLanguage = (typeof targetLanguages)[number];
export function learningPairs(): Array<readonly [TargetLanguage, TargetLanguage]> {
  return targetLanguages.flatMap(native => targetLanguages.filter(target => target !== native).map(target => [native, target] as const));
}
export const languageNames: Record<TargetLanguage, string> = { 'en-CA':'English 🇨🇦', 'fr-CA':'Français 🇨🇦', es:'Español', 'pt-BR':'Português 🇧🇷', de:'Deutsch', it:'Italiano' };

export type SupportedLanguage = TargetLanguage | 'es' | 'pt-BR' | 'de' | 'it' | 'ja' | 'ko' | 'zh-CN';
export type CefrBand = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type InteractionStyle = 'structured' | 'flexible';
export type CorrectionMode = 'immediate' | 'end-of-turn' | 'end-of-session' | 'on-request';
export interface LearnerPreferences {
  target: TargetLanguage;
  nativeLanguage: TargetLanguage;
  interfaceLanguage: TargetLanguage;
  speechRate: number;
  answerWaitMode: 'automatic' | 'until-ready';
  answerWaitSeconds: number;
  correctionMode: CorrectionMode;
  interactionStyle: InteractionStyle;
  lowStimulation: boolean;
  microLessonMinutes: 5 | 10 | 15 | 30;
}
export const defaultPreferences: LearnerPreferences = {
  target: 'en-CA', nativeLanguage: 'es', interfaceLanguage: 'es', speechRate: 0.88,
  answerWaitMode: 'until-ready', answerWaitSeconds: 8,
  correctionMode: 'end-of-turn', interactionStyle: 'structured',
  lowStimulation: true, microLessonMinutes: 10,
};
export function validatePreferences(input: LearnerPreferences): LearnerPreferences {
  if (!targetLanguages.includes(input.target) || !targetLanguages.includes(input.nativeLanguage) || input.target === input.nativeLanguage) {
    throw new Error('Native and target languages must differ and be supported.');
  }
  return { ...input,
    speechRate: Number.isFinite(input.speechRate) ? Math.max(0.65, Math.min(1.2, input.speechRate)) : 0.88,
    answerWaitSeconds: Number.isFinite(input.answerWaitSeconds) ? Math.max(1, Math.min(60, input.answerWaitSeconds)) : 8,
  };
}
