# VoiceFirst B0 | A1 source evidence and authored alternatives | 2026-11-05

Status: **prepublication editorial QA**, not a learner-facing course or a CEFR assessment.

## What changed
- Source-grounded short-answer variants cover all **72 comprehension checks** of the existing **24 A1 six-turn scenes** in Canadian English, Canadian French and Spanish. Earlier 24 question-1 variant sets are retained; **48 additional sets** for questions 2 and 3 are independently authored candidate phrases (not translations generated at runtime).
- The internal React Native review can reveal all six authored dialogue turns in context and the core returns their expected audio cue IDs. All cues are **not recorded**. This is a transcription/voice-production reference, not an audio player or an installed voice pack.
- A1 editorial state validation rejects unsupported languages, changing a target into a same-language pair, contradictory review phase/result states and corrupted completion. Editors cannot silently jump to the next question: use an explicit answer or **Skip**.
- Inputs remain ephemeral. Neither typed response, microphone audio nor reviewer transcript is persisted as learner progress; all output flags remain non-scoring and unpublished.

## Required before promotion
1. Human reviewer checks every candidate expression and its meaning against source context, including Canadian French regional usage and Spanish variation. A matching string is an **authored candidate**, not a proof of language competence.
2. Commission and document original recordings and voice/rights consent per locale and cue, including delivery format and hashes. No third-party voices, copyrighted clips or speech models are licensed by this change.
3. Validate genuine listening tasks with verified local audio and no-mic alternatives. Only reviewed/cleared resources can enter the existing offline learner session and spaced repetition.
4. Keep native iPhone/Android/Bluetooth/offline physical tests and CEFR content-completeness claims as separate acceptance gates.

## Scope and verification
New dependencies: **none**. No changes to SQLite, ASR/TTS, public navigation, installed voice packs, network requests, release build, model hosting or billing. Automated core tests cover keys, transcript provenance, malformed states, explicit skip and non-scoring controls. Full CI verification belongs to the exact PR commit, not to prior passing workflows. Security hard gate remains enabled even if Expo tooling vulnerabilities persist.

Stacked after draft PR #15. Do not merge to `main`, publish APK/IPA or approve an A1 course by this editorial work alone.
