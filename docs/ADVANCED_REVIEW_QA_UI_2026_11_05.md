# VoiceFirst B0 | Internal C1–C2 mobile reviewer · 2026-11-05

This macrobloque brings the existing 12 advanced storyboards and the six-file verified audio player into a **development-only React Native inspection screen**. It remains editorial QA, not a learner-facing C1/C2 course, public audio player or exam.

## Real code flow

- `mobile/App.tsx` mounts `AdvancedEditorialReview` only under the compile-time React Native `__DEV__` condition, and only when a developer explicitly opens the control. Release navigation has no route to this review screen.
- The mobile reviewer accepts only current first-release known/target language pairs. It lets an editor choose C1/C2, two draft topics per level, and walk ten steps: six scripted turns, three contextual evidence questions and an oral/written review suggestion. Explicit evidence is hidden until requested. A `next`, `restart` or `close` action does not save learning data.
- `advanced-review-manifest.ts` checks exact scene and six authored clip IDs, stable language/accent metadata, valid SHA-256 shape and 8 MiB maximum per clip. It requires `status: candidate-only`; unexpected publication flags or unrecognized keys are rejected. **Successful manifest parsing is only a structural check**, not a file-contents proof, licensing clearance or linguistic endorsement.
- `mobile/advanced-editorial-review-manifest.ts` reads at most 16 KiB of the app-private `Documents/voicefirst-advanced-review/<locale>/<level-lowercase>/<unit-id>/manifest.json`. It derives clip URIs from authored IDs; supplied arbitrary URI and HTTP URL fields have no path to playback.
- Only a user tap triggers audio. Existing `AdvancedEditorialClipPlayer` re-verifies the actual six local WAV bytes via the Expo file adapter immediately before playback; previous playback is stopped and its callbacks invalidated. There is no remote service or TTS fallback. Changing topic, leaving foreground or closing the reviewer stops playback.
- The app does not install, download, record or fabricate voice clips. The pilot therefore works as a **text-only editorial walkthrough until reviewers provide original recordings** by a separate authorized, private installation path.

## Expected private manifest format

The schema is `voicefirst.advanced-audio-editorial.v1` with exactly `format`, `sceneId`, `status: candidate-only`, and `clips`. For one C1 English scene the scene ID is `en-CA/C1/nuance-and-register` and each of the six rows has `audioId`, `bytes`, lowercase hexadecimal `sha256`, `accentTag`, `rightsReference`, and `sourceReference`. The corresponding WAV paths use lower-case `c1` in `Documents/voicefirst-advanced-review/en-CA/c1/nuance-and-register/turn-N.wav`. Fake hashes or permissions must not be used to assert a ready clip.

An editorial source/rights reference in JSON is not legal clearance or a human linguistic review. Audio quality, rights, safety, and regional pronunciation require independent evidence before inclusion in a public lesson. The script does not request personal learner data.

## Verification and limits

Core tests cover all 12 manifest shapes, missing/repeated/injected fields, unsupported languages, oversized clips and fake approval; the existing SHA and playback tests cover integrity and request cancellation. Mobile TypeScript, JS bundling and native builds remain separate gates. No APK/IPA or physical headphone/mic test was authorized by this work. npm dependency advisories remain blocking. No changes to the commercial policy, offline course, SQLite or privacy prompts.

**Next:** acquire first original, rights-cleared recordings and independent pedagogical review, side-load them into an authorized internal test build, verify end-to-end audio on physical iPhone and Android in B1, then integrate approved pedagogy into the pre-existing `LessonPackage` validation and sessions with proper accessibility and non-mic alternatives. Never pretend a test manifest is a verified recording or a complete CEFR band.
