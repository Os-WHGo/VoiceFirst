# VoiceFirst · COURSE-FIRST · 2026-10-16

## Immutable priority
The offline authored curriculum is the primary product. Generative AI is optional enrichment, never mandatory for regular lessons or checkpoints. Begin a daily lesson without login/API/server. Read full researched sources from Drive Doc 12.

## Framework
- Six target languages: en-CA, fr-CA, es, pt-BR, de, it. Thirty directed native-to-target routes; content authoring is by target language with source-language glosses. A selectable pair does NOT imply a complete validated curriculum.
- Official CEFR stops at **C2**, not C3; A0 is internal onramp only. Design pathways A0→A1→A2→B1→B2→C1→C2, each with validated listening, speaking, interactions, and optional reading/writing.
- Course packs: authored and versioned objectives, dialogues with accepted forms, prompts, review schedule, contextual notes (including Canadian French and multiple English dialects), provenance/license, accessibility options, CEFR descriptor mapping, assessment rubric.
- A normal lesson (optional duration 10–15 min) introduces one communicative goal, one audio example, coached rehearsal, recall without immediate example, one transfer scene, a checkpoint. Choose 3–30 min variants without streak punishments.
- Progress only if two different evidence points demonstrate retrieval and transfer. Always support repeat, stop, skip, later resumption, low stimulus, asynchronous response times. Never infer diagnoses or manipulate users into compulsive focus.
- Exact phrase transcription matching is deliberately conservative and **NOT** a pronunciation or CEFR score. Local ASR must implement confidence/unknown handling; ambiguous speech cannot cause negative penalties. Semantically equivalent variants and creative responses need a carefully validated classifier before broad credit.

## Research reuse and licensing
- LibreLingo: https://github.com/kantord/LibreLingo AGPL-3 software; course content licenses vary. Study content schemas, navigation and SRS patterns, never bulk-copy without exact license compatibility.
- FSRS: https://github.com/open-spaced-repetition/ts-fsrs MIT, alternative to initial simple spaced-repetition scheduling.
- Tatoeba: https://tatoeba.org/downloads CC BY 2.0 FR and some CC0 sentences; audio per uploader. Provenance per item mandatory.
- Common Voice: https://commonvoice.mozilla.org/ CC0 audio datasets; train/evaluate ASR but do not bundle huge raw corpora into mobile build or republish speaker data thoughtlessly.
- Kaikki/Wiktionary: https://kaikki.org/dictionary/ CC BY-SA/GFDL data; evaluate obligations carefully before incorporating in independently licensed app.
- Quebec resources: https://www.quebec.ca/education/apprendre-le-francais/outils-ressources and https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique ; authoritative references, not licensed for automatic copying.
- France MOOCs and British Council: reference course design; do not copy restricted audiovisual content.
- IELTS/CELPIP: build **original** practice tasks modeled on public exam skills. Free practice papers on official sites do not grant reproduction rights. No official scoring/certification claims.
- `Jakeschincariol/replica-skill`: MIT tools for clean-room feature reconnaissance, test plans, comparison; don't copy protected UI/text/training content.

## Reality of current code
- `packages/core/src/course.ts`: 12 authored example lesson units (2 x 6), with 4 scripted steps each (48 step instances), localized glosses in all six languages, prerequisite unlocking and nonclinical voluntary repetition. Scripted content is NOT a validated complete syllabus.
- `mobile/OfflineCourse.tsx`: simple audible sample/walkthrough, no ASR offline. Existing OpenAI practice remains optional experiment.
- `packages/core/test/course.test.mjs`: 10 test cases; 50 tests across core and backend as of this block.
- Neither OS background audio nor headset hands-free is verified. Do not imply beta readiness.

## Future implementation tasks
Course content authoring tools (YAML/JSON schema + lint), persistence encrypted on device, offline language packs, integration iOS/Android local speech recognition where supported, keyword VAD, configurable lesson checkpoint with robust error uncertainty, opt-in Internet tutor provider, content review with educators and neurodivergent participants, original exam prep and copyright-safe slang corpora.
