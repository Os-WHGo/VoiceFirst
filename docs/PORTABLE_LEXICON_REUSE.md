# VoiceFirst | Reusable vocabulary and phrase catalog (v1 experimental)

**Status (2026-10-19): implemented portable core contract, no public dictionary pack published.**
The six-language source of truth remains VoiceFirst. This is **not** a completed A1–C2 dictionary, speech recognition model, subtitle generator, translation service, automatic phonetic transcriber, or permission to reuse other people's data.

## Existing production inventory

- `packages/core/src/lexical-seed.ts`: 12 original authored seed expressions in six target languages. `portableLexiconDraftsFromSeed()` maps them to license/review **pending** records.
- `packages/core/src/course.ts` and `extended-course.ts`: 84 introductory lessons (14 per language). `portableLexiconDraftsFromCourse()` creates **84 linked draft phrase records**, preserving the original lesson ID, written phrase, already-authored alternative forms and A0/A1 band.
- `packages/core/src/portable-lexicon.ts`: independent TypeScript lexical record validator, purpose-specific bundle builder and opt-in exact subtitle suggestion lookup. `packages/core/src/index.ts` exposes the API.
- Neither source function changes course progression or duplicates any of the 30 learner-direction curricula. The **12 + 84 draft records may overlap**; they are not 96 distinct dictionary words and have **not** been professionally reviewed or licensed for redistribution.
- `buildPortableLexiconBundle()` exports **zero** records from these drafts, by design. A reviewed/licensed status must be established per entry, with evidence and explicit allowed uses, before export.

## Reusable data contract

A `PortableLexicalRecord` holds stable ID, BCP-47 language tag, ISO-15924 script tag, kind (word/phrase), **original form**, alternatives, semantic intent ID, register, optional source-lesson ID and A0/A1 band, plus review and rights metadata. Any candidate intended for another app must pass `validatePortableLexicalRecord`.

The `voicefirst.lexicon.v1` JSON bundle is generated for a **single target locale and purpose**, either `lesson`, `subtitle-hint` or `speech-hint`. Entries must have a review evidence reference, explicit clearance, identifiable rights holder and license reference, and purpose included in `allowedUses`. Community-controlled material additionally requires a distinct community authorization reference. These fields are a **structural audit gate, not a verification of signatures or a substitute for legal and community review**. Wivra must verify such references before trusting content.

Normalization for exact comparison is NFC and locale-aware case folding, not accent stripping or unreviewed spell correction. Export preserves source characters. A suggestion is only an **optional human-editable hint**. It must never overwrite ASR segments automatically, train a model by default or assert the transcript is correct.

### Example consumer flow (future integration only)

```js
// @voicefirst/core, after explicit reviewed and licensed entries are supplied:
const result = buildPortableLexiconBundle(records, 'subtitle-hint', 'es-CL');
if (result.status === 'ok') {
  const portableJSON = JSON.stringify(result.bundle);
  const imported = parsePortableLexiconBundle(portableJSON);
  if (imported.status !== 'ok') throw new Error('Invalid licensed lexicon');
  // Future Wivra bridge verifies rights references and imports locally.
  // Each suggestion is reviewed by a user; it never replaces recognized audio.
}
```

The current cross-app integration is a **format proposal**. There is no Wivra import pipeline or newly installed ASR model, and `@voicefirst/core` is still a private workspace package, not an independently published SDK. A future independent shared package must have reviewed ownership and versioning; do not copy private source or a client's assets between repositories without permission.

## Indigenous-language readiness

BC First Nations and Chilean Indigenous languages require **nation/community-specific orthography and permissions**. The locale/script fields are extensible but **no Indigenous language entries have been created or approved**. No scraped dictionaries, FirstVoices data, protected stories, recordings, speakers' voices, synthetic native voices, AI training or inferred translations. Obtain the language authority's permission, compensation/benefit arrangements and withdrawal process before any bundle. Respect combining marks and grapheme clusters when editing/exporting subtitles; a JavaScript `String.slice` may cut UTF-16 code units rather than user-visible graphemes.

## Technology alternatives investigated

| Option | Result |
| --- | --- |
| Extend existing TypeScript lexical seed + course, offline JSON and strict rights | **Selected** as smallest compatible reversible change |
| [Lexonomy](https://github.com/lexicalcomputing/lexonomy) dictionary editor, MIT code | Useful later for multi-editor lexicography; currently introduces a server/administration layer and must still verify content licenses |
| [CLDF](https://github.com/cldf/cldf) Cross-Linguistic Data Formats | Strong interoperability reference for community-approved linguistic corpora; future exporter, not immediate app runtime requirement |
| Copy a large external dictionary or auto-generate speech corrections | **Rejected** without item-level licensing and linguistic validation |
| [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) | Potential grapheme-aware rendering when supported; not an ASR or phonetics engine |

## Gates before downstream use

1. Original author or community grants license **for the specific purpose and redistribution mode**.
2. Linguistic and pedagogical reviewers validate register, meaning, dialect/locale and sense, and their references are independently checked.
3. Test NFC/NFD spelling, combining marks, non-Latin scripts, timing and reversible Unicode export. No automatic transcript changes.
4. Maintain purpose-specific, versioned manifests with SHA-256 and opt-in offline installation; check data limits and cancellation.
5. First test with neutral original sample fixtures; only then integrate through Wivra's existing SRT/VTT code and optional local speech engine.

**Evidence:** automated Node regressions live in `packages/core/test/portable-lexicon.test.mjs`; real device testing and semantic/rights audit are outstanding. This block did not run GitHub Actions manually.
