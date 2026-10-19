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

## Indigenous languages research track for the first expansion (2026-10-19, researched only)

**Product intent, NOT launch approval:** After the six core language courses are validated, add Indigenous languages of Chile and Canada as an explicitly prioritized **research/partnership track alongside** international demand-based expansion. No Indigenous language course, recording, speaker profile, regional pronunciation, model, translation or community endorsement is implemented/authorized as of this entry. Avoid increasing `targetLanguages`, changing 30 pairs, migrating learners or deploying material before community-led agreement. Respect Indigenous orthographies, dialect naming and locally decided goals; do not presume CEFR equivalence or an unrestricted AI tutor.

### Sea-to-Sky starting point: Squamish, Whistler, Pemberton

- **Sḵwx̱wú7mesh sníchim**, language of the Sḵwx̱wú7mesh/Squamish Nation; Coast Salish. Nation-run classes, online sessions, school teaching, certificates and curriculum development exist. Primary: https://www.squamish.net/divisions/territory-culture-services/language-cultural-affairs/skwxwu7mesh-snichim/ and https://www.squamish.net/about-our-nation/our-language/ . Liaison must follow the Nation's language/cultural affairs and permission protocols, without presuming participation.
- **Ucwalmícwts**, Líl̓wat Nation, Mount Currie/Pemberton. A local St̓át̓imc variety with community-run education, immersive classes, a 6,200+ word dictionary, FirstVoices language site and a pre-existing Ucwalmícwts learning app. Primary: https://lilwat.ca/our-community/about-us/ and https://lilwat.ca/departments/tszil-language-and-culture/culture-centre/ . **Do not duplicate existing app or bulk-copy dictionary/audio**. Seek community-defined complementary role if interested.
- **Whistler has shared territories of two distinct Nations**, not one common language. Primary: https://www.whistler.ca/about/shared-territories-lilwat-and-squamish-nations/ . Local Squamish Lil'wat Cultural Centre offers community-led educational media and sessions, including 2022 language video and 2025 exhibition: https://slcc.ca/slcc-language-video/ ; https://slcc.ca/revitalized-exhibit/ . A language tour was listed unavailable until spring 2027 at last check (https://slcc.ca/group-tours/); do not schedule/assume it exists now.
- **N'Quatqua First Nation** at D'Arcy/Anderson Lake (Sea-to-Sky/Pemberton wider research area) identified with St̓át̓imcets, per https://www.bcafn.ca/first-nations-bc/lower-mainland-southwest/nquatqua . Treat dialect/community specificity separately; do not assume all St̓át̓imc communities share one identical resource or partnership.
- First Peoples' Cultural Council 2026 B.C. language list documents **36 First Nations languages** (not six generic 'First Nations languages'). https://fpcc.ca/resource/fpcc-list-of-languages-of-bc/

### Chilean candidates, separately governed

- Chile's Subdirección Nacional de Pueblos Originarios documents **six Indigenous languages in use**: Mapuzugun, Aymara, Quechua, Rapa Nui, Kawésqar, Yagán. It describes **Ckunsa/Kunza** (Lickanantay) as a seventh, under revitalization. Primary: https://www.pueblosoriginarios.gob.cl/lenguas-indigenas-en-chile .
- Proposed initial feasibility/partnership conversations **Mapuzugun, Aymara, Quechua and Rapa Nui**; research **Kawésqar, Yagán and Ckunsa** in parallel without presenting these as generic translation-only lessons. None is approved for release and no material is imported. Different local naming, orthographies and communities require distinct review.
- Education references: https://peib.mineduc.cl/recursos/programas-de-estudio-sector-lengua-indigena-sli/ and https://www.curriculumnacional.cl/pueblos-originarios-ancestrales . Publicly accessible or public-domain curriculum metadata **does not override** rights attached to language recordings, living contributors or traditional cultural material.

### Requirements and hard gates

1. **Community leadership & benefit:** Indigenous nations, language authorities, teachers and speakers decide whether collaboration happens, what is public/restricted, curriculum scope, age suitability, who may learn, cultural review, compensation, continued ownership and removal/correction process. Do not contact anyone, incur expenses, represent affiliation or sign agreements without the user's authorization.
2. **Data sovereignty & permission:** FirstVoices linguistic content is managed and owned by originating communities; its terms bar copying, scraping, modification, embedding or commercial reuse without the copyright owner's prior written authorization, even if a related **software** repo has an open-source license. https://firstvoices.atlassian.net/wiki/spaces/FIR1/pages/1704993 ; https://firstvoices.atlassian.net/wiki/spaces/FIR1/pages/1704799 . Refer/link to community sites rather than rehost.
3. **AI and voice safety:** No automatic ASR/LLM translation, synthetic 'native accent', voice cloning, speech datasets, external training or cloud uploads of Indigenous-language recordings. Evaluate only if explicitly community-authorized; prefer reviewed original human recordings, and permit text/phoneme-only learning if ASR/TTS does not work. FPCC June 2026 cautions: https://fpcc.ca/resource/ai-for-indigenous-language-revitalization/ .
4. **Technology feasibility, tested before adoption:** key requirements are exact Unicode/grapheme fidelity, combining diacritics/glottal symbols, readable font, original keyboard layouts, offline packaging with revocable license terms, provenance per asset, community editable review. FPCC's open **orthography/Unicode tooling** at https://github.com/First-Peoples-Cultural-Council/unicode-resources is Apache-2.0 (review license and particular files before reuse), FirstVoices app/website repositories https://github.com/First-Peoples-Cultural-Council and Keyman keyboards https://github.com/keymanapp/keyman are technology alternatives to evaluate, not permission to copy FirstVoices linguistic content.
5. **Distinct milestones:** (a) research-only profiles/links, (b) opt-in collaboration and explicit permissions, (c) jointly designed A0-like *introductory* pedagogy, (d) community-reviewed visual and authentic pronunciation assets, (e) accessibility + offline test + rights verification, (f) release **only if authorized**. No expectation to finish all A1-C2 using mainstream CEFR standards; communities can set their own competency system.
6. **Counts remain conditional:** Current base is **six**. Prior general-language proposal was six more in the first expansion (12 total). This adds **two local Canadian research candidates plus four initial Chilean research candidates**; an eventual ceiling of 18 base+general+Indigenous courses would be hypothetical and contingent on community approvals. Report separately *languages researched*, *partners engaged*, *content reviewed*, *offline speaking verified*, *released*; do not claim 18 deployed courses or add six to `targetLanguages` now.

Research status: sources and reusable technology screened; **no contact, permission, partnership, materials imported, machine-learning training, testing with speakers or release**. Keep existing VoiceFirst six-language CI and content unchanged.
