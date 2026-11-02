/**
 * Provider-neutral translation router for VoiceFirst.
 * NO real provider credentials or HTTP requests belong in this package.
 * This router is for complementary text translation, NOT the voice tutor.
 */
import { targetLanguages, type TargetLanguage as Language } from './types.js';

export type TranslationIntent = 'ui' | 'short-phrase' | 'contextual';
export type PrivacyScope = 'local-only' | 'approved-remote';
export type FailureKind = 'RATE_LIMIT' | 'TEMPORARY' | 'UNAVAILABLE' | 'INVALID_REQUEST' | 'AUTHENTICATION' | 'POLICY';

export type TranslationRequest = Readonly<{
  text: string;
  source: Language;
  target: Language;
  intent: TranslationIntent;
  privacy: PrivacyScope;
  /** IDs explicitly enabled by the learner/operator, never inferred. */
  approvedRemoteIds?: readonly string[];
  /** A quota *estimate* from the backend; does not replace atomic server enforcement. */
  quotaRemaining?: Readonly<Record<string, number>>;
}>;

export type TranslationProvider = Readonly<{
  id: string;
  location: 'local' | 'remote';
  capability: 'literal' | 'contextual';
  supports(source: Language, target: Language): boolean;
  translate(request: TranslationRequest): Promise<string>;
}>;

export class TranslationError extends Error {
  constructor(public readonly kind: FailureKind) { super(kind); this.name = 'TranslationError'; }
}

export type TranslationResult = Readonly<{
  text: string;
  providerId: string;
  attempts: readonly string[];
}>;

const allLanguages = new Set<string>(targetLanguages);
function validate(r: TranslationRequest) {
  if (!r.text?.trim() || r.text.length > 4000 || !allLanguages.has(r.source) || !allLanguages.has(r.target) || r.source === r.target) {
    throw new TranslationError('INVALID_REQUEST');
  }
}

/**
 * Tries permitted providers in order. Only quota/transient/unavailable errors are retried.
 * The caller MUST enforce spending and privacy on the server as well.
 */
export async function translateWithFallback(
  request: TranslationRequest,
  providers: readonly TranslationProvider[],
): Promise<TranslationResult> {
  validate(request);
  const tried: string[] = [];
  const unique = new Set<string>();
  for (const p of providers) {
    if (unique.has(p.id)) continue;
    unique.add(p.id);
    if (!p.supports(request.source, request.target)) continue;
    if (request.intent === 'contextual' && p.capability !== 'contextual') continue;
    if (p.location === 'remote') {
      if (request.privacy !== 'approved-remote' || !request.approvedRemoteIds?.includes(p.id)) continue;
    }
    const quota = request.quotaRemaining?.[p.id];
    if (quota !== undefined && quota < request.text.length) continue;
    tried.push(p.id);
    try {
      const text = await p.translate(request);
      if (!text?.trim()) throw new TranslationError('TEMPORARY');
      return { text: text.trim(), providerId: p.id, attempts: tried };
    } catch (error) {
      if (!(error instanceof TranslationError) || !['RATE_LIMIT','TEMPORARY','UNAVAILABLE'].includes(error.kind)) throw error;
    }
  }
  // Safe failure instead of bypassing privacy, guessing translations, or charging another provider.
  throw new TranslationError('UNAVAILABLE');
}
