# VoiceFirst: upstream advisory validation (2026-10-30)

## Confirmed official advisory

GHSA-mrhx-c7xc-m3w5 (Zod, high) affects npm zod versions below 4.6.6. The first patched version is 4.6.6. Source: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 .

Current lockfile resolves zod 3.25.76 because @expo/cli 57.0.31 declares ^3.25.76. There is no safe semver-compatible upgrade within the declared Zod 3 major range that satisfies this advisory. A direct root override to Zod 4 would violate Expo CLI's declared compatibility range; it is NOT applied.

GHSA-g3hv-75wg-m249 (minimatch) identifies a potential denial of service for versions below 11.0.1. Current minimatch is 10.2.6, required by glob 13 and @expo/fingerprint. A direct override to minimatch 11 likewise requires compatibility tests.

## Actionable next experiment

1. Review newer Expo 57 patch releases and upstream @expo/cli dependency declarations for an officially supported Zod 4 path.
2. If no compatible upstream release exists, investigate whether affected Zod 4 parser paths are actually imported by Expo CLI; document evidence, not an assumption.
3. Trial only on isolated security branch. Run npm ci, npm audit, npm run check, npm run check:mobile, native configuration checks, and regression CI. Do not weaken the advisory gate.
4. Any residual high finding needs explicit security review before release.

This note records upstream research, not a tested remediation or a release approval.
