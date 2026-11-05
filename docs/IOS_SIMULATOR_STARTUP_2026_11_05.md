# Native startup verification · 2026-11-05

## Scope and base

Dedicated branch `codex/ios-simulator-startup-20261105`, based on verified PR #7 `be6b24006eeff3a0b7f3e76807ad6fc077be2dc4` (itself based on npm/native security PR #6). No editorial, curriculum, lesson or mobile product source is changed. Existing security improvements and author contributions remain in history. No main merge or modifications to ChatGPT branches.

Compilation alone does not demonstrate that React Native can initialize its native modules and render its bundled JS. The existing iOS readiness job now uses the unsigned Release Simulator app it already builds to verify real, noninteractive startup. Android remains compile-only, without an APK/AAB. This is not a public release, an iPhone IPA, or hardware audio testing.

## Real runtime check

- Select an explicitly compatible available iOS26+ iPhone runtime/type pair from Xcode simctl metadata. Prefer a large Pro Max/Plus viewport so the actual startup title and playback button are visible without scrolling. Missing supported runtime metadata is a failure, not an assumed pass.
- Create a fresh uniquely named disposable Simulator; boot, install the existing app and launch only its verified bundle identifier. No user account, audio samples, permission grants, UI taps or application test hooks.
- Wait fifteen seconds, verify the launched PID still belongs to that app, capture a temporary screenshot, use native Apple Vision OCR to require the actual Spanish title and inactive playback control, and check the same PID remains alive afterwards. A launch/PID alone is insufficient; a crash, splash-only or missing JS startup screen fails.
- Always delete only the newly created Simulator, preserving failure evidence in a bounded JSON report (stage, booleans, runtime/type, code SHA; no arbitrary OCR text/errors). A cleanup failure cannot produce success. Screenshot and report stay in the ephemeral runner; no distributable or additional artifact upload is added.

Scripts: `scripts/check-ios-simulator-startup.mjs`, `scripts/check-ios-startup-screen.swift`. The Swift script uses Apple system Vision/ImageIO/CoreGraphics/Foundation; no package, SDK, service or third-party license is introduced. References: https://developer.apple.com/documentation/vision/recognizing-text-in-images ; https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device . Existing Xcode26.6 and public macOS runner retained.

Node regression tests inject command failures to verify fresh-device cleanup, crash after OCR, wrong app identity, absent runtime and no implicit permission/UI interaction. These mocks validate orchestration only; the positive Swift/OCR/runtime result must come from macOS CI.

## Dependency security remains blocked

No dependency or lockfile changes. Full npm audit still has four moderate affected packages, caused by glob13/minimatch10 under fingerprint. Expo sdk-57 remains57.0.32, fingerprint0.20 remains0.20.15; latest fingerprint0.21.9 also requests the vulnerable ranges.

Additional upstream evidence checked live: https://github.com/expo/expo/pull/52819 merged the SDK57 tooling fixes while explicitly excluding fingerprint due to changed matching behavior; https://github.com/expo/expo/pull/52790 (replace minimatch/drop glob) remains open/unmerged; https://github.com/expo/expo/pull/52753 (simple dependency major bump) closed unmerged. Issue https://github.com/expo/expo/issues/52735 remains open. A forced dependency swap or bespoke fork would bypass an unresolved upstream compatibility decision, so neither is introduced. Zero-finding policy, existing baselines and release block are unchanged.

## Evidence and limits

Final CI results are recorded in this Draft PR's description and canonical checkpoint after completion. Until then, runtime startup is unverified. Previously verified full native compilation: https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469425 . This new check does not establish physical iPhone behavior, Android runtime, microphone/ASR/TTS, Bluetooth, airplane-mode course operation, background operation, complete curriculum or dependency security.
