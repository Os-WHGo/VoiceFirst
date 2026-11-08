# VoiceFirst B0 | Recovery of Codex iOS startup runtime QA | 2026-11-07

## Source continuity
This block **preserves the independently authored Codex PR #9** `codex/ios-simulator-startup-20261105`, without merging or closing it. Four unique files are transplanted unchanged first, then the startup orchestrator and regression tests are amended in this stacked branch. The original historical document `docs/IOS_SIMULATOR_STARTUP_2026_11_05.md` is preserved for attribution and context.

Original file blobs from PR #9:
- `scripts/check-ios-simulator-startup.mjs` blob `dde15d73323a4cdfe0827497982e44acad74feee`
- `scripts/check-ios-startup-screen.swift` blob `0acfa0fb94513e81078a65418cc337cc22f6a8fb`
- `packages/core/test/ios-simulator-startup.test.mjs` blob `6499ea75dcbe616ea53c6868623440e9f733eefa`
- `docs/IOS_SIMULATOR_STARTUP_2026_11_05.md` blob `c0c82a3ab7b65fb0a418fd43db24be5d50b46386`

## What failed in Codex's previous trial
[CI run 42123288215](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42123288215) built the iOS Simulator app but failed at `simctl bootstatus` before app installation or launch. **That event does not demonstrate an app startup failure.** The previous workflow was never in the main A1 stack and therefore the official #18 native-green run was only a compile, not a launch test.

## Safe recovery approach
- Add the same source-built Simulator app launch and native Apple Vision OCR verification as a required step in the existing macOS native-readiness workflow, without generating IPA/APK, signing, uploading screenshots or acquiring permissions.
- Verify app identity, create a fresh disposable compatible iPhone Simulator, boot, install, launch, check the PID, capture only ephemeral screenshot, require actual header and playback control via the original Swift OCR script, then recheck that same process.
- On a macOS runner with transient CoreSimulator slowness, `bootstatus` may fail even when `simctl boot` succeeded. Retry `bootstatus` **once** with finite command timeouts (180s then 120s) and a bounded 5s gap. Persist attempt count in the local ephemeral JSON report. **Never continue to app installation or mark success unless a bootstatus command succeeds.**
- If startup, OCR or process integrity fails, fail the native CI job and delete only the newly created Simulator; no false success or PR auto-merge. A report is no evidence of physical iPhone, audio, Bluetooth, offline ASR, background operation or learner course quality.
- Set the report's `codeSha` to the actual checked-out GitHub CI merge-tree SHA (`github.sha`), since `pull_request` checkouts do not necessarily correspond byte-for-byte to the PR head. The PR head is separately identified in its GitHub metadata.

## Regression and acceptance
Recovered Codex tests verify runtime selection, real-display requirement, PID identity, cleanup and bound command timeouts, plus a new case for transient bootstatus failure and persistent failure. The GitHub CI native job is **not** considered proven to launch the app until the new run returns success at the OCR stage. If simulator boot fails twice, the correct result is a red native check with the stage/attempt count.

No new dependencies, cloud service, assistant work assignment, changes to Android bundling, paid EAS, learner data or public release. SDK security still blocks merge separately. Native hardware B1 QA is not supplanted.
