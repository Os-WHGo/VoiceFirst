import type { LearnerPreferences, TargetLanguage } from './types.js';
export interface AudioAdapter {
  requestMicPermission(): Promise<boolean>;
  startCapture(): Promise<void>;
  stopCapture(): Promise<void>;
  speak(text: string, language: TargetLanguage, rate: number): Promise<void>;
  stopSpeaking(): Promise<void>;
}
export interface TutorAdapter {
  reply(input: string, sessionId: string, language: TargetLanguage, preferences: LearnerPreferences, signal?: AbortSignal): Promise<string>;
}
export interface PreferencesStore {
  load(): Promise<LearnerPreferences>;
  save(value: LearnerPreferences): Promise<void>;
  deleteAll(): Promise<void>;
}
// Boundary contracts only: no fake microphone, online LLM or persistent storage implementations.
