# VoiceFirst B0 | Six original WAV A1 authoring, no AI, no release | 13 Nov 2026

## Purpose
The previous A1 local player accepts six app-owned, source-locked PCM16 recordings but does not create or install them. This macrobloque adds **offline preparation tooling for real authorized human narration**. Nothing in the repository creates voices, uploads recordings, asks for microphone permission or marks A1 ready for learners.

The existing `scripts/voice-pack.mjs` manages the published authoring inventory of course cues and is **not** reused as an importer for these 24 separate six-turn editorial scenes. This tool reuses the core's strict A1 manifest, `inspectPcmWav`, `sha256Bytes`, source fingerprints and `auditA1SixTurnAudio`, not a new hash algorithm.

## Instructions (local developer computer, Node 22+, core already built)
1. `npm run build:core`
2. `node scripts/a1-original-review-pack.mjs plan "en-CA/A1/greetings-and-introductions"`
3. Open `build/a1-recording-briefs/en-CA/a1/greetings-and-introductions/script.json` to see the **six unchanged authored lines** with speaker identifiers. `rights.example.json` is a blank form only; it cannot authorize anything.
4. Arrange **six genuinely original consented** mono/stereo WAV PCM16 recordings, 250 ms to 60 s each, supported sample rate 16000/22050/24000/44100/48000 Hz and audible signal. Put only `turn-1.wav` to `turn-6.wav` in a new local source folder.
5. Add local `rights.json` with exactly `{"accentTag":"en-CA","rightsReference":"your-reviewed-reference","sourceReference":"your-source-recording-reference"}`. These strings are **editorial references only**, not proof that a narrator consented, a dialect is correct or rights have been granted. An independent signed permission and human editorial review must be separately checked.
6. Run `node scripts/a1-original-review-pack.mjs build "en-CA/A1/greetings-and-introductions" PATH_TO_SOURCE_FOLDER`.
7. Run `node scripts/a1-original-review-pack.mjs verify "en-CA/A1/greetings-and-introductions"`. It validates six actual source files, PCM/duration, each SHA-256 and manifest identity. After any alteration, verify again.
8. The complete *private*, unapproved output is under `build/a1-review-packages/voicefirst-a1-review/en-CA/a1/greetings-and-introductions`. A reviewer must transfer that directory into the same relative **app Documents/voicefirst-a1-review** folder through a separately authorized, device-specific private QA workflow. This CLI does NOT install files or create APK/IPA.

Do not put narration WAVs, rights forms, source recordings, license identities or packaging output into GitHub. `build/` remains gitignored.

## Safety and quality
The original scene may be any of the 24 A1 source-locked IDs from en-CA/fr-CA/es. Unknown scenes, symlinks, extra WAVs, corrupt/quiet/too-short/incompatible recordings, missing metadata, forged approval fields, previous destination and changed SHA are rejected. The build writes to a new staging folder, verifies all bytes, then renames atomically; existing output is never overwritten or deleted. Existing review artifacts are preserved after failed verification.

This output has `status: editorial-candidate`. It contains **no** `rightsCleared:true`, no `publicAvailable:true`, no recordings bundled in the project and does not touch student sessions or progress. Rights notes can never substitute for actual consent and regional review. SHA proves file integrity only.

## CI evidence and pending work
Node CLI integration regressions use six synthetic audible *test-only* WAV samples created inside temporary test directories; the test bytes are neither human narration nor distributable media. Tests cover six-file generation, corruption/muted/symlink/unknown filenames, unsafe metadata, no overwrite, altered SHA and wrong scene. All audio test fixtures remain ephemeral. Core, TypeScript, Expo, dependency security, physical iPhone/Android and human rights review must be reported separately.

No new dependencies, IA generativa, remote server, cloud inference, purchases, publication or changes to `main`. A1–C2 public curriculum remains incomplete, and npm security still blocks releases.
