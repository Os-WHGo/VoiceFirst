# VoiceFirst | C1-C2 original editorial briefs | 2026-11-05

**Purpose:** build an auditable authored-content backlog for the first-release trio `en-CA`, `fr-CA` and `es`. This is NOT a complete CEFR-level course, a calibrated evaluation, an audio pack or a public feature.

## Authored deliverable
- 16 topic-specific seed briefs in each language: 8 C1 + 8 C2, total 48 advanced unit drafts.
- Each brief has a two-turn fictional scenario, listening question, verbatim supporting phrase, a plausible interpretation, an unsupported interpretation, a pragmatic device and a skill objective.
- Six activity-authoring instructions per brief cover listening, speaking, reading, writing, interaction and mediation. Speaking/listening remain product priorities; reading/writing are optional prompts.
- Preview is editorial only for the six directed help/target routes among the three release languages. `pt-BR`, `de` and `it` retain historical core resources but remain “Próximamente” for first-release selection.
- No other courses, session storage, assessment, audio output, microphone capture, personal data or server services are modified.

## Pedagogical caveats
These two-turn examples are **seeds for editorial expansion**, not a defensible C1 or C2 course. The curriculum still needs extended listening sequences with varied speakers and authentic discourse, role-play turns and feedback, coherent scaffolded practice, spaced review, proficiency evidence, accessible alternatives, regional linguistic review and responsible assessment calibration. A structurally correct inference is not automatically a scorable answer and should not be used to assign CEFR mastery. No certificate is issued.

## Quality and clearance gates
1. Native or qualified reviewer per locale verifies natural idiom, discourse-level difficulty, cultural neutrality, respectful language, pronunciation variants, ambiguity and factual plausibility. Record reviewer evidence honestly; never generate a fictional approval.
2. Educational reviewer extends each seed into a lesson sequence with clear objectives, listening comprehensibility and varied tasks; verifies CEFR descriptors and valid feedback, checks that unsupported inferences are truly unsupported by the entire passage.
3. Audio producer sources or records legally usable real speech locally; verifies separate code, voice/model/dataset and recording rights. For the 48 new seeds there are 96 planned audio-turn identifiers and **zero recorded or SHA-verified turns**.
4. Mobile B0/B1 tests validate audio availability, recovery and language route on real devices, safe offline alternatives and no background capture. `npm audit` security CI remains a merge blocker independently.
5. Only after approved audio, explicit rights, localization, accessibility and assessments does a separate promotion process add playable material. This draft contract never auto-promotes to `lessonsFor`, SQLite or user-progress scoring.

## Honest numeric meaning
- First-release minimal unit **outline**: 3 languages × 6 official CEFR bands × 8 topics = **144 planned**.
- With this macrobloque: **144/144 have editorial text drafts**, compared with 96/144 previously. This is **100% of the small planned editorial outline only**, not 100% of the course or development.
- **0 independently reviewed units, 0 verified audio turns, 0 production-ready C1/C2 units, 0 CEFR-accredited evaluations.** The internal A0 onboarding track is outside this count.
- Security from inherited PR #4 remains unresolved in the lockfile. Do not merge `main`, generate distribution artifacts or pronounce a public launch ready.

## File map
- `packages/core/src/advanced-c1-en.ts`, `advanced-c1-fr.ts`, `advanced-c1-es.ts`: locale-specific original C1 drafts.
- `packages/core/src/advanced-c2-en.ts`, `advanced-c2-fr.ts`, `advanced-c2-es.ts`: locale-specific original C2 drafts.
- `packages/core/src/advanced-editorial-contract.ts`: 48-unit editorial inventory, six-pair preview, expected audio IDs and fail-closed audit.
- `packages/core/src/first-release-curriculum-coverage.ts`: editorial counts only.
- `packages/core/test/advanced-editorial-first-release.test.mjs` and `first-release-curriculum-coverage.test.mjs`: structural and non-publication checks.

**Next macrobloque:** expand and individually review first high-priority units to multi-turn, listening-first, offline lesson modules with original licensed audio candidates; develop the same pipeline per language without claiming review or course completion prematurely. Keep separate the cumulative B0 core functional milestone, authorized B1 installable and later B2 hands-free scope.
