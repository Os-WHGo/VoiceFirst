# Android release candidate artifact policy | 2026-10-20

Source: manual workflow `.github/workflows/android-standalone-candidate-manual.yml`, still protected by `workflow_dispatch` approval. No APK was built in this change.

Added `scripts/android-release-artifact-policy.mjs` with pure checks for embedded JS/Hermes, an APK signing scheme verified as true, exact application ID `com.oswhgo.voicefirst`, nonempty manifest inspection, and refusal of `android:debuggable=true` in `aapt dump xmltree` output. Eight fixture tests cover positive and negative paths in `packages/core/test/android-release-artifact-policy.test.mjs`.

**Scope:** The new pure policy is covered by the core test suite but is not yet wired to consume actual APK outputs in the manual build workflow. That workflow retains its existing shell verification. Therefore these tests do not prove real aapt/apksigner formats, successful Gradle compilation, installability, or offline startup. No production signing keys or release credentials were added.

Next step: validate native tool output formats against a real internal APK only after explicit approval for the manual build. Maintain checks for SHA-256, application ID, bundle, signature, debug flag, SQLite persistence and microphone on-device.
