# VoiceFirst B0 | Native bridge for advanced editorial audio review | 2026-11-05

## Implemented

This branch introduces an **internal-only** C1/C2 audio review path. It does not mount a learner-facing screen or modify `lessonsFor`, SQLite, ASR or the public teaching/assessment engine.

`AdvancedEditorialClipPlayer` accepts one editorial rehearsal turn plus exactly six candidates from its scene. Before every request it configures foreground audio, reruns the existing size and SHA-256 verification of all six actual local files, then allocates a clip player only if the current turn is covered. The result can be `completed`, `cancelled`, `unavailable`, `failed` or `timeout`; it carries no mastery evidence.

`mobile/advanced-editorial-review-audio.ts` uses existing Expo File and Audio APIs and stops prior curated narration. The native adapter limits files to canonical paths under app-owned `Documents/voicefirst-advanced-review/<locale>/<level>/<unit>/<turn>.wav`, with no HTTP/TTS fallback. The safety owner invalidates older callbacks on new play or stop. The app's foreground/background lifecycle must call `stop()` from any future private review UI.

The project already has `sha256Bytes` capped at **8 MiB** per file. This block corrects the advanced candidate maximum from 32 to 8 MiB rather than weaken or bypass hashing. The 128 MiB aggregate preflight remains a safety ceiling. The local matcher is integrity, **not** proof of recording rights, human editorial review, speaker pronunciation or curriculum completion.

## What is NOT yet true

- No professionally recorded, licensed, SHA-verified production audio is supplied.
- The new adapter is not mounted in public navigation and no actual file playback on a phone is claimed.
- There is no runtime ASR pronunciation score or CEFR certification.
- A mock test with six candidate clips does not establish device support or offline audio availability.
- No new packages or remote services. All source-language infrastructure and release gates are retained.

## Testing and continuation

The source includes core regressions for missing/bad assets, no false activation, token cancellation during file verification and stale terminal callbacks. Existing mobile TypeScript / Metro CI checks compile the Expo adapter. Hardware testing requires a later authorized B1 installation milestone, actual local voice recordings and separately reviewed licenses.

Next: acquire and locally install original audio for one **human-reviewed** pilot with provenance, review both accent and comprehension items, use an internal editor-only screen to listen and report issues, and only then consider packaging with existing lesson package / audio integrity validation. Keep the public content gate and npm security gate closed until their requirements are satisfied.

Codex's PR #9 for real iOS Simulator startup is separate from this branch; do not merge their branches automatically. No main merge, paid service, IPA/APK, unexpected microphone activation or background listening was introduced here.
