# Android release candidate artifact policy | 2026-10-20

Source: manual workflow `.github/workflows/android-standalone-candidate-manual.yml`, still protected by `workflow_dispatch` approval. No APK was built in this change.

Added `scripts/android-release-artifact-policy.mjs` with pure checks for embedded JS/Hermes, an APK signing scheme verified as true, exact application ID `com.oswhgo.voicefirst`, nonempty manifest inspection, and refusal of `android:debuggable=true` in `aapt dump xmltree` output. Eight fixture tests cover positive and negative paths in `packages/core/test/android-release-artifact-policy.test.mjs`.

**Scope update:** The policy is now wired through `scripts/verify-android-release-artifact.mjs` to consume real `unzip -Z1`, `apksigner verify`, `aapt dump badging` and `aapt dump xmltree` outputs in the protected manual workflow, retaining existing shell checks. The workflow has **not** been executed. Therefore the fixtures do not yet prove real aapt/apksigner formats, successful Gradle compilation, installability, or offline startup. No production signing keys or release credentials were added.

Next step: validate native tool output formats against a real internal APK only after explicit approval for the manual build. Maintain checks for SHA-256, application ID, bundle, signature, debug flag, SQLite persistence and microphone on-device.

## Verified static signing finding

GitHub Actions Expo native readiness job for commit `0c016044` succeeded and printed `releaseReferencesDebugSigning: true` and `releaseExplicitlyDebuggable: false`. Therefore generated Gradle release uses debug signing, despite not being marked debuggable. This does not establish an APK was built or that any signing certificate was checked. The protected manual workflow now reports signing classification before compilation and labels the candidate as non-production. Production signing, publishing, and credential changes require separate approval.
