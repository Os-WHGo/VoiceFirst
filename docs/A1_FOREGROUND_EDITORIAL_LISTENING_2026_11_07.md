# VoiceFirst B0 | Manual A1 source listening in foreground | 2026-11-07

**Status: internal editorial rehearsal only**, not a learner-facing CEFR listening course and not a claim of offline speech synthesis.

## Implemented
- Reuses 24 authored A1 scenarios in English (Canada), French (Canada) and Spanish. Six turns each yield 144 deterministic `VoiceCue` objects via the existing voice library schema; the source dialogue is unchanged.
- The `A1EditorialPractice` internal development view can play **one explicitly tapped turn at a time** using the pre-existing `playCuratedVoice` foreground audio output. The edited panel keeps the actual source text and non-microphone fallback visible.
- This route uses a distinct `a1-editorial-only/` cue namespace so no unreviewed A1 speech prompt can be mistaken for an approved published voice pack. Recordings have **not** been commissioned, imported or verified in this block.
- Every change of language/topic, hide-transcript, next question, background transition or unmount invalidates the request and calls the shared stop path. Native playback request ownership was already designed to reject stale/overlapping requests. No continuous background capture or background audio mode is enabled.
- Uses existing configured speaking rate. Spoken practice remains optional, nothing is automatically narrated or captured, and a learner can continue with on-screen text.

## Non-negotiable honesty
The TTS engine is supplied by the installed operating system and VoiceFirst has **not** verified that it runs offline. The internal reviewer therefore exposes `offlineGuaranteed:false` and does not treat voice availability or a completed playback callback as proof of original/licensed narration, articulation, multilingual coverage or learning mastery. System voice listing does not establish offline capability. The public course remains unchanged and must not rely on this internal preview.

## Tests and restrictions
New `a1-editorial-listening-rehearsal.test.mjs` validates all 144 cues, 24 scenarios, locale mapping and non-scoring flags, rejects spoofed/closed review state, and asserts the native voice selection cannot claim offline without a separately verified voice. UI source guards assert manual click, AppState stopping, cleanup, existing development gate and no exposure in the public app.

No new npm dependencies, remote language model, account, billable speech API, persisted transcript, learner mastery/FSRS/SQLite writes, new public routes, voice-pack files, SDK upgrades or APK/IPA. The already-failing NPM vulnerability gate remains unchanged.

## Next measurable increment
1. Obtain **original, licensed and reviewed six-turn A1 voice clips**, one locale and one scenario as a small pilot. Preserve voice permission, accent variant, consent/restrictions and full SHA-256 per binary separately.
2. Add a private six-turn A1 manifest to the existing app-owned, SHA-verified local audio path; refuse mismatched IDs, path traversal, file changes and publication flags. Do not confuse the older two-turn A1 inventory with these six-turn scenes.
3. Validate offline listening on a real iPhone and Android phone, then promote only pedagogically reviewed and rights-cleared resources to the existing course/session engine and local FSRS. A1–C2 course completeness remains a distinct gate.

**No `main` merge, public release, expense or physical device certification is authorized by this block.**
