import type { TargetLanguage } from './types.js';
export type SessionPhase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'interrupted' | 'error';
export interface SessionState {
  phase: SessionPhase;
  target: TargetLanguage;
  turnId: number;
  savedPhase: 'listening' | 'thinking' | 'speaking' | null;
  lastError: string | null;
}
export type SessionEvent =
  | { type: 'START' }
  | { type: 'USER_UTTERANCE'; transcript: string }
  | { type: 'ANSWER_READY'; turnId: number }
  | { type: 'SPEECH_DONE' }
  | { type: 'BARGE_IN' }
  | { type: 'PAUSE' | 'RESUME' | 'INTERRUPTED' | 'STOP' | 'RECOVER' }
  | { type: 'TARGET'; language: TargetLanguage }
  | { type: 'FAIL'; error: string };
export function initialSession(target: TargetLanguage = 'en-CA'): SessionState {
  return { phase: 'idle', target, turnId: 0, savedPhase: null, lastError: null };
}
export function transition(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'START': return { ...state, phase: 'listening', turnId: state.turnId + 1, savedPhase: null, lastError: null };
    case 'STOP': return { ...state, phase: 'idle', turnId: state.turnId + 1, savedPhase: null };
    case 'PAUSE':
      return ['listening','thinking','speaking'].includes(state.phase)
        ? { ...state, phase: 'paused', savedPhase: state.phase as 'listening' | 'thinking' | 'speaking', turnId: state.turnId + 1 }
        : state;
    case 'INTERRUPTED':
      return ['listening','thinking','speaking'].includes(state.phase)
        ? { ...state, phase: 'interrupted', savedPhase: 'listening', turnId: state.turnId + 1 }
        : state;
    case 'RESUME': case 'RECOVER':
      return state.phase === 'paused' || state.phase === 'interrupted'
        ? { ...state, phase: 'listening', savedPhase: null, turnId: state.turnId + 1 }
        : state;
    case 'USER_UTTERANCE':
      return state.phase === 'listening' && event.transcript.trim()
        ? { ...state, phase: 'thinking', turnId: state.turnId + 1 } : state;
    case 'ANSWER_READY':
      return state.phase === 'thinking' && event.turnId === state.turnId
        ? { ...state, phase: 'speaking' } : state;
    case 'SPEECH_DONE': return state.phase === 'speaking' ? { ...state, phase: 'listening' } : state;
    case 'BARGE_IN': return state.phase === 'speaking'
      ? { ...state, phase: 'listening', turnId: state.turnId + 1 } : state;
    case 'TARGET': return { ...state, target: event.language, turnId: state.turnId + 1, phase: state.phase === 'idle' ? 'idle' : 'listening' };
    case 'FAIL': return { ...state, phase: 'error', lastError: event.error, turnId: state.turnId + 1 };
  }
}
