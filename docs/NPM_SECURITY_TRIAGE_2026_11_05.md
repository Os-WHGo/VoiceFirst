# VoiceFirst | NPM security triage | 2026-11-05

## Verdict
**BLOCKED for merge / public release.** A failing security job is intentional as long as the audited npm tree contains known vulnerabilities. A passing TypeScript/Node/Metro check is not proof of dependency security. This report does not certify that a vulnerability is reachable from a mobile binary.

## Verified repo and dependency chain
- Base feature PR #3 is DRAFT, itself based on feature branch PR #1. This dedicated security PR #4 is based on PR #3. Nothing was merged to `main`.
- Actual locked packages: `@expo/cli@57.0.32` -> `zod@3.25.76` (`^3.25.76`); `@expo/cli/config/config-plugins/fingerprint/metro-config` -> `glob@13.0.6` (`^13.0.0`); `glob@13` and `@expo/fingerprint@0.20.14` -> `minimatch@10.2.6` (`^10.2.2`); `@expo/config@57.0.10` -> `deepmerge@4.3.1` (`^4.3.1`).
- `uuid@7` is **absent** from the current lockfile after the earlier Expo patch; it is not a current root vulnerability in this tree.
- Last unmodified lockfile audit: **10 affected packages**; 2 HIGH, 7 MODERATE, 1 LOW, 0 CRITICAL. Four root advisories, not ten independent exploits.

| Root | Advisory | Upstream patch status (2026-11-05) | Outcome |
| --- | --- | --- | --- |
| Zod 3.25.76 | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | fixed 4.6.6 (breaking major relative to Expo CLI requirement) | unresolved |
| glob 13.0.6 | https://github.com/advisories/GHSA-3g3m-2fjr-6pw4 | fixed 14.0.2 (breaking major relative to Expo family pins) | unresolved |
| minimatch 10.2.6 | https://github.com/advisories/GHSA-g3hv-75wg-m249 | fixed 11.0.1 (breaking major relative to Expo fingerprint / glob pins) | unresolved |
| deepmerge 4.3.1 | https://github.com/advisories/GHSA-gcqx-w48m-w2h4 | no fixed 4.x version listed | unresolved |

Expo issue https://github.com/expo/expo/issues/52735 remained open when checked; even SDK 58 includes the glob/minimatch range problem. Do not equate a routine SDK upgrade with a verified remedy.

## Changes made in security PR #4
1. Fix `scripts/audit-dependency-parents.mjs`: optional packages that disappeared are classified as `not-installed` rather than making `npm explain` fail. A package still declared by a lockfile parent but missing from its installation inventory remains fail-closed. CLI failures for installed dependencies remain failures.
2. Add `scripts/npm-security-hard-gate.mjs`: **zero** affected packages required, independently of historical baseline comparisons. Reject invalid JSON, inconsistent totals and unknown advisory URLs. Run it at the end of the existing always-on PR security workflow, even after other failures.
3. Add regression tests for missing packages, dangling requirements, valid/invalid npm audits and mandatory workflow.
4. Add isolated CI `npm-safe-patch-trial.yml`, which tries `npm audit fix --package-lock-only --ignore-scripts` without `--force`, rejects changed manifests, validates Expo57/RN0.86 with the existing comparator, and tests any structurally valid candidate. No remote AI, background recording, distribution build or package lockfile promotion.

## Experiment: why `npm audit fix` was rejected
In the isolated CI run https://github.com/Os-WHGo/VoiceFirst/actions/runs/42108035414, **unforced** `npm audit fix --package-lock-only` changed a temporary lockfile by over a thousand diff lines. The existing compatibility comparator rejected its structure because `@expo/cli` was missing. That is **not** an acceptable drop-in fix for Expo 57; it was NOT committed or used to compile a new mobile binary. A command's unforced status alone does not demonstrate compatibility.

## What can and cannot be claimed
- All four root problems are transitive in the present lockfile. They originate through Expo tooling paths, but whether any one is exploitable on-device requires separate bundle and attack-path evidence; no blanket claim of safety.
- The zero-findings release gate is a policy enforcement improvement, **not a vulnerability patch**.
- Expo and package publishers must supply compatible fixes, or a separately audited migration can be tested on a new branch with Node/core/TypeScript/Metro + compile-only Swift/Kotlin and device QA. Do not force Zod, glob or minimatch across major APIs in the app.
- Do not merge `main`, update historical security baselines to hide alerts, skip tests, publish binaries, or activate remote billable features because a trial was rejected.
- Continue authored language content and foreground B0 tests independently; physical beta and public launch gates stay explicit.

## Next safe action
Monitor verified upstream Expo security releases; isolate and test a coherent parent-dependency update only after matching package versions, license review, npm audit and app/native compatibility. Keep hard gate red until actually resolved.
