# VoiceFirst · Course-first, conversational, accessible learning (research / implementation)

Date: 2026-10-16. Read Drive source documents **13** and **14** before this implementation.

## The decision

One **complete foundational spiral curriculum** for each target language, with optional interest pathways (work, travel, everyday, parent-supported child routines) layered on top. A work focus prioritizes work tasks without removing general communication; it does **not** become an isolated occupational-only course. Age/communication level/individual access needs remain independent. All six target languages can be supported from the other five as home/help languages, subject to authoring and quality validation. Official CEFR ends at **C2** (A0 is an internal onboarding level). Do not claim course coverage C2 based on a catalogue or prompt.

## Classroom micro-cycle

1. Context and communicative **purpose**, with optional help in known language.
2. Teacher asks a situation-driven question in the target language, without just saying the desired answer.
3. Learner gives an **appropriate target-language reply**, not a translation of the instruction.
4. Accept several **human-authored equivalent formulations**; never pretend exact deterministic transcript matching is full semantic or pronunciation evaluation.
5. If uncertain ASR: ask to repeat or skip without penalty. If recognized but outside curated variants: offer an example / retry **without asserting the learner is wrong**.
6. Transfer the same skill into a different situation, then spaced retrieval and progress evidence.
7. For child routines: short, voluntary, playful language exposure with parent-support and safety/consent review before release.

The demonstration includes 18 authored mini-dialogues, three in each of six target languages. Each contains two **original** situation-driven turns with alternative correct responses. A typed transcript preview is available in the Expo UI; audio question playback uses expo-speech. **ASR/audio answer capture, no-screen control, background playback and progress persistence are not complete.** No LLM calls are required for current preview.

## Evidence and limitations

- Council of Europe, official CEFR descriptors. Interaction and task-based communicative competencies guide curricula; official A1–C2 descriptors are not automatically assigned from one phrase. https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- TBLT speaking meta-analysis (Medina Fernández, 2021; 61 studies synthesized, 11 pooled, heterogeneous interventions): positive results; not a universal guarantee. https://cienciadigital.org/revistacienciadigital2/index.php/CienciaDigital/article/view/1801
- British Council: games, short sessions, familiar routines and children's interests; avoid overcorrecting and respect the first language. https://learnenglishkids.britishcouncil.org/parents/helping-your-child/how-children-learn
- Cambridge English: real speaking opportunities outside lessons and games relevant to children. https://www.cambridgeenglish.org/learning-english/parents-and-children/your-childs-interests/practising-speaking-outside-the-classroom/
- Systematic review of songs 2024 (60 intervention studies): evidence insufficient for robust causal conclusion; use songs as an option, **not** a verified universal treatment or technique. https://www.sciencedirect.com/science/article/pii/S0346251X24001325
- Accessibility: CAST UDL 3.0 https://udlguidelines.cast.org/ ; allow modes, pauses, sensory preferences and genuine autonomy, never diagnose or induce compulsive focus.

## Free curated external resource directory

`packages/core/src/free-resources.ts` holds verified links to official sites. It returns **links**, never copies video or text. It marks courses with limited enrollment as variable. The mobile view filters existing metadata without API billing. Initial examples:

- British Council speaking: https://learnenglish.britishcouncil.org/free-resources/speaking
- Cambridge English parent-supported practice: https://www.cambridgeenglish.org/learning-english/parents-and-children/your-childs-interests/practising-speaking-outside-the-classroom/
- TV5MONDE: https://apprendre.tv5monde.com/es
- Francisation Québec, workplace and daily-life courses: https://www.quebec.ca/education/apprendre-le-francais/outils-ressources
- FUN-MOOC Vivre en France A1: https://www.fun-mooc.fr/en/cours/vivre-en-france-a1/
- Instituto Cervantes free city microcourse: https://cervantes.org/es/aprender-ensenar/cursos/cursos-espanol-online
- Universidade Federal do Ceará Portuguese A1, past edition only, **enrollment is not guaranteed**: https://casasdeculturaestrangeira.ufc.br/pt/curso-portugues-brasileiro-nivel-a1/
- Goethe Institut free A1–C2: https://www.goethe.de/prj/dfd/en/home.cfm
- Rai Scuola italiano per stranieri: https://www.raiscuola.rai.it/percorsi/corsoditalianoperstranieri

The YouTube search integration is **not implemented**. It requires official APIs, quota compliance, copyright enforcement and potentially approved embeds. Never scrape/download/rehost videos for offline use. https://developers.google.com/youtube/data/reference/rest/v3/search/list and https://developers.google.com/youtube/terms/developer-policies

## What is implemented and tested

- Pure `guided-dialogues.ts` with six language packs and 18 original demonstration contexts, each consisting of two prompted response tasks.
- 30 language directions with learner-language supporting prompts, valid alternate authored utterances, confidence-aware deterministic results, no penalty for unclear recognition, and blocked child-facing release.
- Interest-based **ordering**, retaining foundational and travel material even with work selected.
- Expo `GuidedDialoguePractice.tsx` visual UI to hear the teacher's question and type a response, and `FreeResources.tsx` curated link browser.
- `npm run check` verifies the TypeScript core and 75 tests, including new dialogue/resource cases. No Expo simulator or mobile hardware validation yet.

## Next technical blocks

1. Implement and test a truly on-device ASR adapter with six-language capability matrix, native TTS, audio session/background-route lifecycle and controls without touch; audit device support and pack licenses per locale.
2. Persist the lesson, exercises and reviewed skills locally with encryption where necessary and restore precisely after interruption.
3. Improve contextual evaluation using authored intents and optional local recognizers; compare against diverse accents, but never overgrade based on ASR text alone.
4. Author and validate complete curriculum A1–C2 in six languages with pedagogical review and inclusive families/age content policies.
5. Add safely configurable child routines and user-driven resource discovery under the appropriate privacy, license and caregiver controls.
