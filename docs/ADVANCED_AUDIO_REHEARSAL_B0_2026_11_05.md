# VoiceFirst | B0 advanced editorial rehearsal and local audio checks | 2026-11-05

This branch adds a pure, offline editorial rehearsal controller for 12 C1/C2 conversation scripts across English, French and Spanish. Each script has 6 turns, 3 optional evidence checks and a final speaking or writing activity. The controller handles reveal, next, restart and stop. It records no responses or student progress and has no microphone, network or AI dependency.

The audio candidate gate checks at most 72 local WAV/other clip entries, rejecting duplicate IDs, duplicate paths, unsafe paths, oversize entries, bad locale tags and malformed SHA-256 metadata before requesting any native file read. It reuses the existing NativeLocalFileVerifier interface for actual size and digest verification. An internal editor may request a verified audio ID only after all 6 clips for that scene pass the current audit. This is not an audio player.

There are 72 audio IDs planned, **zero professionally reviewed or distribution-ready audio files**. A simulated six-file pass in the tests is strictly mock data. Audio provenance, licenses and human editorial approval remain separate prerequisites. No public lesson, CEFR scoring, certificate, SQLite progress or background capture is enabled.

Native playback must revalidate files immediately before use and cancel stale playback; never persist the in-memory audit result as a trusted entitlement. The earlier lesson and audio verification policies remain authoritative.

This is a core TypeScript-only addition. Do not create APK/IPA or claim phone testing from these unit checks. NPM security issues remain on the independent Codex branch; no dependency or manifest changes are made here.

Next: acquire rights-cleared, regionally reviewed recordings for a small pilot; connect the vetted scene to existing local player and lesson-package validation; test spoken and typed alternatives on a physical iPhone and Android phone in the authorized B1 milestone. Maintain free, account-free, optional-AI offline-first design.
