import { validatePreferences, type CefrBand, type LearnerPreferences } from './types.js';
import { buildTutorInstructions } from './tutor.js';

export const realtimeModels = ['gpt-realtime-2.1-mini', 'gpt-realtime-2.1'] as const;
export type RealtimeModel = (typeof realtimeModels)[number];
export interface RealtimeOptions { level?: CefrBand; missionId?: string; model?: RealtimeModel }

/** Payload for POST /v1/realtime/client_secrets. Requires a trusted backend API key. */
export function createRealtimeSecretRequest(raw: LearnerPreferences, options: RealtimeOptions = {}) {
  const p = validatePreferences(raw);
  const model = options.model ?? 'gpt-realtime-2.1-mini';
  if (!realtimeModels.includes(model)) throw new Error('Unsupported realtime model');
  return {
    expires_after: { anchor: 'created_at', seconds: 60 },
    session: {
      type: 'realtime',
      model,
      output_modalities: ['audio'],
      instructions: buildTutorInstructions(p, options),
      audio: {
        input: {
          // In until-ready mode the mobile client must explicitly commit and create a response.
          turn_detection: p.answerWaitMode === 'until-ready' ? null : {
            type: 'server_vad',
            threshold: 0.5,
            silence_duration_ms: Math.max(500, Math.min(2000, p.answerWaitSeconds * 1000)),
            create_response: true,
            interrupt_response: true,
          },
        },
        output: { voice: 'sage', speed: Math.max(0.75, Math.min(1.1, p.speechRate)) },
      },
    },
  };
}

export function isEphemeralSecretResponse(value: unknown): value is {value: string; expires_at: number} {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.value === 'string' && obj.value.startsWith('ek_') && typeof obj.expires_at === 'number' && Number.isFinite(obj.expires_at);
}
