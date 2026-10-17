# Translation fallback architecture (research + implemented core)

Reviewed 2026-10-16. This complements the voice tutor; it does NOT implement a realtime voice pipeline.

## Verified official free allowances (subject to changes)
- DeepL API Free: 500,000 text characters/month, no speech-to-text in API Free. https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-plans
- Google Cloud Translation NMT Basic + Advanced: first 500,000 characters/month within shared USD $10 credit; document translations and LLM translation are not equivalent. Requires Cloud billing configuration; costs can accrue after the monthly allowance. https://cloud.google.com/products/translate/pricing
- LibreTranslate: AGPL-3.0 server built on Argos Translate. Self-hosting uses CPU, RAM, server/power and ops; it is not cost-free at any scale. No assurance of slang quality or all 30 directed pairs. https://github.com/LibreTranslate/LibreTranslate
- ChatGPT plan and OpenAI API billed independently. Using the ChatGPT website or a consumer translation interface doesn't give a general free embedded translator API. https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus

## Implemented code
`packages/core/src/translation-router.ts` exposes `translateWithFallback`, `TranslationProvider`, `TranslationRequest`, and explicit classified failure reasons. This core:
1. Validates source/target in six supported languages and rejects same-language pairs.
2. Checks an explicit consent allow-list before sending content to any *remote* translator.
3. Handles local-only privacy request strictly: never falls back to a remote API.
4. Separates ordinary short-phrase UI translation from *contextual* slang requests. Text-only literal translators are never silently chosen for context-required tasks.
5. Consults an external quota estimate, skips insufficient quotas, and tries a different APPROVED provider after RATE_LIMIT/TEMPORARY/UNAVAILABLE, not policy/authentication errors.
6. Does not contain provider HTTP calls, keys, account billing, retries that risk multiple charges, nor content logging.

## Not implemented (do not confuse with completed integration)
Real DeepL/Google/LibreTranslate adapters, API access credentials, account authorization, usage billing ledger, backend quota enforcement, test on network, cache with privacy protection, locale adaptation, quality evaluation for slang, ASR, speech synthesis and realtime voice.

## Proposed integration workflow
1. Server-side translation adapter for DeepL API Free via official REST and one for Google Cloud Translation NMT. Never ship API keys inside the mobile binary.
2. Self-hosted LibreTranslate can be evaluated as local fallback with license review. Avoid accidentally exposing a public translator relay.
3. Maintain actual quota accounting centrally with atomic reservation and hard stop for over-quota; never treat the code's quota estimate as authoritative.
4. Explicitly route all conversational learning through tutor-specific semantic model with source confidence, not through translation-only providers.
5. Prove quality and cost for EN-CA, FR-CA, ES, PT-BR, DE, IT with slang, speed, regional accents and noise on consenting samples.
6. Consent choice for third-party processors and their terms before new provider becomes active; no hidden changes in data protection.

**Important:** Two 500k allowances may provide 1M text characters in aggregate under qualifying conditions, but they do not yield 1M spoken characters or free unlimited voice conversations.
