# MU VoiceFirst | B0 npm/Expo SDK57 patch reassessment | 13 Nov 2026

## Source chronology
On 7 Nov the HEAD of PR #20 had a strict `npm audit --package-lock-only` block: **4 affected packages moderate, zero high/critical**. Root advisory URLs:
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4 (glob 13)
- https://github.com/advisories/GHSA-g3hv-75wg-m249 (minimatch 10)

Expo upstream [#52735](https://github.com/expo/expo/issues/52735) closed 6 Nov, clarifying that many matching-tooling advisories concern local build tooling rather than shipped mobile code. Nevertheless, npm still identifies the dependency chain in VoiceFirst and the **owner's strict zero-vulnerability release gate remains active**. Expo SDK57 excluded a breaking change to `@expo/fingerprint` minimatch matching semantics. No user-facing security certificate or waiver is justified by the upstream conversation.

The package registry [@expo/fingerprint versions](https://www.npmjs.com/package/@expo/fingerprint?activeTab=versions) and [package-version history](https://security.snyk.io/package/npm/%40expo%2Ffingerprint/versions?page=1) show **0.20.16 published Nov 12, 2026** in the SDK57 line, following 0.20.15. Neither its existence nor a direct-vulnerability listing establishes that all nested `glob` / `minimatch` copies are fixed, and an SDK58/0.21.x upgrade is not approved here.

## The actual reversible experiment
Use the existing `.github/workflows/expo57-security-patch-trial.yml`, now retriggered in a Draft PR. Its runner-local steps:
1. `npm ci --ignore-scripts`, `npm ls --all` and capture **before** nested dependency tree and advisory set.
2. `npm update --workspace mobile --package-lock-only --ignore-scripts` within the existing Expo57 and RN0.86 package ranges, without a committed manifest, lockfile or third-party installation script.
3. Print **all actual nested `@expo/fingerprint`, `glob` and `minimatch` copies**, reject root overrides/resolutions and reject a fingerprint major/minor outside SDK57 0.20.x.
4. Run pre-existing `scripts/expo57-security-trial.mjs after` to compare every upstream/root advisory and severity; reject any new/worsened findings or SDK family escape.
5. Reinstall trial lock, run core + TypeScript + Expo config + Metro checks on the candidate. Nothing is promoted, merged, signed or packaged.

If even one advisory remains, mark `clean:false`; the **independent** `dependency-vulnerability-inventory.yml` stays FAIL. If a candidate is clean and passes all checks, it still requires specific review and a separate committed lockfile patch + native compilation before any merge. Do not use `npm audit fix --force`, overrides, forced minimatch11 or a silent allowlist, even if a package maintainer rates the production exploitability low.

## Other risk gates
Branch protection remains an administrator task. Audio/voice/ASR offline physical B1 validation remains pending. No main merge, no remote provider, expenditures or publication are authorized by this experiment.

Record the actual CI run and snapshots in the existing VoiceFirst checkpoint before deciding whether the next block may safely promote a particular lockfile candidate.
