# VoiceFirst B0 | Auditable six-turn A1 original audio | 2026-11-07

**Editorial QA only.** This milestone prepares private, locally verified original audio for the existing 24 six-turn A1 situations (three priority launch languages). It does not include any recordings and cannot publish lessons.

## Existing architecture reused
- Reuses the exact source dialogue and IDs already authored in `a1-expanded-greeting-pilots.ts` and `a1-situational-pilots.ts`.
- Reuses `cueFingerprint` as a source-version marker (not a cryptographic signature), `a1AccentMatchesTarget` as an accent-family structural check, `sha256Bytes` to compare actual file content and `inspectPcmWav` to ensure real PCM16 WAV audio with matching duration and nontrivial signal.
- Reuses the app-owned `expo-file-system` Documents storage, with a **separate** `voicefirst-a1-review/` directory. It neither touches the legacy two-turn A1 inventory nor the C1/C2 editorial review files, public voice packs or persisted learner sessions.

## Six-turn manifest contract
One manifest per scene at `Documents/voicefirst-a1-review/<locale>/a1/<topic>/manifest.json`.
The literal status must be `editorial-candidate`; `format` must be `voicefirst.a1-six-turn-editorial.v1`. Exactly six original `audioId` entries must contain a source fingerprint, actual size (max 8 MiB), duration (250–60000 ms), SHA-256, accent tag, rights reference and source reference. Unknown fields, missing turns, extra files, mismatched source fingerprints, forged approval flags and duplicate IDs are rejected **before** reading any audio.

Each clip path is derived from the known authored ID; JSON is never permitted to supply an arbitrary file path or external URL. The **manual** internal reviewer control asks the app to read and inspect the six app-owned WAV files (no auto import, microphone or network). A report indicates how many passed. A missing directory or manifest is an ordinary, explicitly reported not-ready state.

A complete technical audit reports `readyForEditorialPlayback:true` only for six verified files. It explicitly retains `rightsCleared:false`, `publicAvailable:false` and `proofPersistent:false`. Metadata references are **not** legal clearance, dialect quality checks, human narration approval or a reusable permission token. Before any eventual actual-file playback, a fresh full audit is required to prevent stale verification.

## QA and acceptance
Automated tests cover all 24 scenes / 144 expected IDs, malformed JSON shapes, tampered original text markers, duplicates, format/size/duration, fake release status, incorrect SHA-256, invalid PCM and native file errors. CI results must be linked to the exact PR HEAD.

To produce real offline listening: obtain original voices with documented consent and licenses for code, narrator and sound assets separately; inspect human pronunciation and variants for each locale; install a small verified pilot, then add an editor-only player with re-verification immediately before playback. B0 does not certify iPhone/Android offline/Bluetooth operation or complete A1–C2 content.

No new package, public lesson, account, payment, cloud voice, background recording, APK/IPA or `main` merge. npm's security hard gate remains active even while upstream Expo tooling advisories persist.
