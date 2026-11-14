# VoiceFirst B0 | A1 local recorded six-turn editorial playback | 2026-11-13

## What actually changed
The prior #18 A1 system verified private six-turn WAV originals but did not play them. This block **extends the existing architecture without creating any recordings**, preserving the old public voice-pack system, separate C1/C2 editorial player and A0/A1 historical course.

- New `A1EditorialClipPlayer` in TypeScript core: manual foreground-only request, strict `inspectA1SixTurnAudioManifest`, fresh `auditA1SixTurnAudio` on **all six real file byte streams before each play**, and a target audio ID owned by the source scene. Valid PCM16, per-clip duration/size, SHA-256 and authoring fingerprint remain required.
- Native `mobile/a1-editorial-native-player.ts` maps the *authoring ID*, not a user-provided path, to a WAV in app Documents `voicefirst-a1-review/<locale>/a1/<unit>/turn-N.wav`. No remote source or fallback TTS. Prevent background playback and stop on scene/unmount/background/new request.
- `A1EditorialPractice` offers **two separate reviewer controls** for each turn, system TTS and verified original local recording. TTS is **never** substituted for a corrupt/missing recording in the original-recording control. Neither can grant credit or progress.
- Common `loadA1LocalReviewManifest` and `a1NativeAudioVerifier` feed the old explicit integrity audit and the new playback gate. This is separate from public sessions. No change to mandatory course, user data, install workflow or microphone permission.
- Ownership prevents stale request callbacks from granting a successful result. 120-second hard upper bound, capped based on WAV duration and chosen speaking rate. No proof of review or rights is persisted.

## Boundaries and risk
These **24 source-locked A1 scenes / 144 turns are editorial candidates only**. This commit provides no actual recorded media, no narrator consent, no audio quality review, no regional native-language approval and no physical offline test. Existing `rightsReference` and `sourceReference` are metadata labels, not proof of a contractual license. `publicAvailable:false`, `rightsCleared:false` and `proofPersistent:false` remain unchanged. Do not add this player to `lessonsFor`, SQLite learner progress, production UI or CEFR claims.

Due to mobile filesystem and asynchronous startup, the app cannot guarantee that bytes cannot be modified between SHA verification and audio-player opening; the URI stays app-owned and the file existence/size is checked again. A physical test with a valid original authorized six-file A1 scene is necessary before treating playback as demonstrated on devices.

## Test/CI requirements
Added pure core tests: six-file revalidation per play; manifest, ID and sibling-hash tampering; in-flight cancellation; repeated requests; DEV-only source and no URL. Updated existing foreground cancel regression to require both local and TTS cleanup. The real GitHub core and mobile TS runs decide if this block passes. Production npm hard gate remains strict and failing until compatible upstream patch actually clears all advisories. No forced overrides, paid services, main merge, release or APK/IPA.
