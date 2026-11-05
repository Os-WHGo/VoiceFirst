# VoiceFirst | C1–C2 expanded listening storyboards · 2026-11-05

## Scope and exact meaning

This macrobloque advances the *authored instructional substance* for the three first-release targets (en-CA, fr-CA, es). It does not integrate a new speech engine, microphone permission, server, subscription, or runtime assessment.

Each locale receives four longer original dialogue scenes:
- C1: `nuance-and-register` and `implicit-meaning`.
- C2: `idiomatic-mastery` and `subtle-implications`.

Each scene contains **six alternating conversation turns**, **three explicit-evidence comprehension checkpoints**, an oral role-play prompt and a non-microphone written alternative. The checks separate a plausible, tentative inference from an unsupported inference. Nothing automatically grades an open-ended answer. Literal evidence is validated against an exact substring of the relevant turn.

**Inventory:** 12 scene drafts / 72 dialogue turns / 36 question briefs / 72 future audio asset IDs, with **0 locally verified audio**, **0 native/human-reviewed scene drafts**, **0 CEFR assessment validations**, and **0 scenes published**. These 12 expansions cover 12 of the 48 previous C1/C2 mini-topic drafts (25% expanded to this six-turn editorial script format). They do not increase the 144/144 *topic-draft* inventory or mean that 25% of full courses exist. The A0 internal track and earlier A1–B2 material remain unchanged.

## Why this is not yet a playable listening course

- The new spoken lines are scripts, not audio. Any playback would require actual recorded and rights-cleared audio, exact local asset integrity checks, verified accent/language, and device playback testing.
- No C1/C2 score may be inferred from literal text matching, ASR transcripts, TTS output, or a sample of 3 questions.
- Prompts for speaking and writing are content proposals, not operational tasks in the learner app. They are not inserted into `lessonsFor`, SQLite, scoring, session progression or curriculum completion.
- Existing foreground offline engines and six-language legacy catalog are preserved. The three first-release routes remain selected while Portuguese Brazilian/German/Italian remain marked coming soon for the public launch.
- Human educators must expand feedback, evaluate plausible alternative readings and register, design cumulative tasks, establish C1/C2 discourse authenticity, and validate regional use. Fictional policy/meeting scenes have no connection to a real employer, regulator or administrative action.

## Quality and non-publication gates

`auditAdvancedListeningStoryboards` rejects absent or duplicated unit IDs, nonexistent earlier editorial drafts, mutated public/score/certification flags, missing dialogue turns, wrong turn order or speaker alternation, unsafe or duplicated audio IDs, quotations not contained in the selected turn, unsupported/incomplete inference comparisons, missing typed fallback, and malformed/oversized inventories.

`advancedStoryboardPreview` supplies editor-only planning context for the six directed known/target combinations among three release languages. It always returns `canPlayAudio:false`, `canAssess:false`, `canAwardProgress:false`, and `publicAvailable:false`. The absence of approved audio is fail-closed by contract, not hidden by an audio-placeholder widget.

Tests: `packages/core/test/advanced-listening-storyboards.test.mjs`. The existing `content-validation.ts` and packaged lesson gates remain authoritative for any future real promotion. Do not bypass or reimplement them.

## Next block

1. Qualified linguistic and pedagogical review, keeping independent review evidence and rights manifests; no fake approvals.
2. Convert the reviewed scenes into multi-stage offline lessons via existing package validator, not a second session engine.
3. Record or license local audio clips, verify original bytes and language variants, integrate spoken instructions and conservative no-mic fallback.
4. Add comprehension, interaction and mediation tests with real audience participants, recovery and accessibility QA.
5. Validate on iPhone and Android in authorized B1 hardware testing; B2 blocked-screen/hands-free remains a separate system-permission milestone.

Security work is isolated in Codex PR #6. This curricular branch intentionally changes no dependencies, Expo configuration, security baselines or lockfiles. Do not merge `main`, publish, or build distributable IPA/APK merely for this authoring block.
