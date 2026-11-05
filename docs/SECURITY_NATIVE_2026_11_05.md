# Expo 57 security and native compatibility · 2026-11-05

Base verified live: PR #5 `757a083c886bc341a76d688af543c5b28660d7a6`, based on PR #4 → #3 → #1. Dedicated stacked Draft PR; no changes to original branches, main, curriculum, permissions or offline behavior.

## Security result

Full audit: **10 → 4 affected packages**, HIGH **2 → 0**, MODERATE **7 → 4**, LOW **1 → 0**, CRITICAL 0. Security remains **BLOCKED**. Raw reproducible audit snapshots: [before](security/2026-11-05/audit-before.json), [after](security/2026-11-05/audit-after.json). Counts include dependent parents, not independent exploits.

- Zod GHSA-mrhx-c7xc-m3w5 (HIGH, fixed 4.6.6): removed by official CLI 57.0.33 switching to Expo schema-utils. No forced Zod major.
- deepmerge GHSA-gcqx-w48m-w2h4 (LOW, no patch): removed by official config 57.0.11. No downgrade or exception.
- glob GHSA-3g3m-2fjr-6pw4 (MODERATE, fixed 14.0.2): official parents now use 14.0.3, but fingerprint 0.20.15 still requests ^13.0.0 and installs nested 13.0.6. **Unresolved**.
- minimatch GHSA-g3hv-75wg-m249 (MODERATE, fixed 11.0.1): glob14 uses 11.0.4, but fingerprint and glob13 retain 10.2.6. **Unresolved**.
- Remaining affected packages: expo (direct dependency with inherited finding), @expo/fingerprint, nested glob13 and minimatch10. Root causes are transitive build/fingerprint tooling. Audit production flags do not prove on-device exposure: Expo tooling is in the production dependency graph. Metro source provenance is checked separately; no blanket runtime safety claim.

Official metadata checked live: Expo sdk-57 57.0.32, latest 58.0.23. SDK58 is not a proven remedy: fingerprint 0.21.9 still requires glob13/minimatch10; issue https://github.com/expo/expo/issues/52735 remains open. Keep SDK57/RN0.86, no major overrides or npm audit fix promotion. Review GHSA API metadata at https://api.github.com/advisories/<GHSA-ID>. The four advisories and corrected versions were read, not inferred from historical reports.

## Reproduction and safeguards

Node 24.22.1 / npm 11.9.0 locally; CI Node22 independently verifies npm ci. Starting with the exact base lockfile: `npm ci --ignore-scripts --no-audit --no-fund`, then `npm update --workspace mobile --package-lock-only --ignore-scripts --no-audit --no-fund`. npm emitted a workspace warning but produced the full tree; installation and checks must validate it. Initial Expo-only candidate reinstalled with npm ci; its SHA256 was `4a3135584edbb8dea531b5cd86846f08b41c6cbb5a6e7d91e2dce44cd105f8b1`. A second scoped update, `npm install --workspace mobile react-native@0.86.3 --save-exact --package-lock-only --ignore-scripts --no-audit --no-fund`, aligns the native runtime with the official Expo recommendation. Final lockfile SHA256: `f54184c144ae69f8f4908480f26c1f14749e82314fe74254ca5d57c9368be2aa`. The sole manifest edit is the exact RN patch pin.

All dependency majors below come from official parent releases within existing manifest ranges, never overrides. In particular glob14, minimatch11 and path-scurry3 are upstream choices; fingerprint's old copies are preserved rather than silently replaced. React 19.2.3 unchanged; RN 0.86.0 → 0.86.3, within the same supported minor. Both Expo 57.0.31 and 57.0.32 bundledNativeModules.json recommend RN 0.86.3; this corrects a pre-existing alignment warning. React peer ^19.2.3 is satisfied. RN MIT license read from installed package (https://github.com/facebook/react-native/blob/main/LICENSE). New helper @isaacs/nonrecursive-glob-match is transitive from glob14, not a direct app dependency. Expo metadata declares MIT; official license https://github.com/expo/expo/blob/main/LICENSE. Existing upstream package notices retained.

`expo install --check` also reports inherited development-tool recommendations (@types/react ~19.2.4 instead of installed 19.3.0, TypeScript ~6.0.3 instead of 5.9.3). No TypeScript major or type downgrade imposed: actual core/mobile typechecks verify this tree; these advisory tool-alignment warnings remain explicit.

Snapshot diagnostic now lists every monitored nested package path/version, preventing a fixed hoisted glob from hiding the nested vulnerable copy. Regression covers this exact split and a nested-only Zod installation. Existing zero-advisory gate and baselines unchanged.

## Exact lockfile delta

| Lockfile path | Before | After |
| --- | --- | --- |
| `mobile` | 0.1.0 | 0.1.0 |
| `node_modules/@babel/core` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/core/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/@babel/generator` | 7.29.12 | 7.29.13 |
| `node_modules/@babel/helper-compilation-targets` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/helper-compilation-targets/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/@babel/helper-create-class-features-plugin` | 7.29.12 | 7.29.13 |
| `node_modules/@babel/helper-create-class-features-plugin/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/@babel/helper-create-regexp-features-plugin/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/@babel/helper-module-transforms` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/helper-skip-transparent-expression-wrappers` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/helper-string-parser` | 7.29.11 | 7.29.13 |
| `node_modules/@babel/helpers` | 7.29.10 | 7.29.13 |
| `node_modules/@babel/parser` | 7.29.12 | 7.29.13 |
| `node_modules/@babel/plugin-transform-block-scoping` | 7.29.12 | 7.29.13 |
| `node_modules/@babel/plugin-transform-destructuring` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/plugin-transform-for-of` | 7.29.7 | 7.29.13 |
| `node_modules/@babel/plugin-transform-runtime/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/@babel/runtime` | 7.29.10 | 7.29.13 |
| `node_modules/@babel/traverse` | 7.29.12 | 7.29.13 |
| `node_modules/@expo/cli` | 57.0.32 | 57.0.33 |
| `node_modules/@expo/cli/node_modules/@expo/router-server` | 57.0.14 | 57.0.15 |
| `node_modules/@expo/config` | 57.0.10 | 57.0.11 |
| `node_modules/@expo/config-plugins` | 57.0.11 | 57.0.12 |
| `node_modules/@expo/env` | 2.4.3 | 2.4.4 |
| `node_modules/@expo/fingerprint` | 0.20.14 | 0.20.15 |
| `node_modules/@expo/fingerprint/node_modules/glob` | absent | 13.0.6 |
| `node_modules/@expo/fingerprint/node_modules/lru-cache` | absent | 11.5.3 |
| `node_modules/@expo/fingerprint/node_modules/path-scurry` | absent | 2.0.2 |
| `node_modules/@expo/image-utils` | 0.11.6 | 0.11.7 |
| `node_modules/@expo/inline-modules` | 0.1.8 | 0.1.9 |
| `node_modules/@expo/local-build-cache-provider` | 57.0.9 | 57.0.10 |
| `node_modules/@expo/log-box` | 57.0.4 | 57.0.5 |
| `node_modules/@expo/metro-config` | 57.0.13 | 57.0.14 |
| `node_modules/@expo/plist` | 0.8.1 | 0.8.2 |
| `node_modules/@expo/prebuild-config` | 57.0.19 | 57.0.20 |
| `node_modules/@expo/require-utils` | 57.0.6 | 57.0.7 |
| `node_modules/@expo/schema-utils` | 57.0.2 | 57.0.3 |
| `node_modules/@isaacs/nonrecursive-glob-match` | absent | 1.1.0 |
| `node_modules/@react-native/assets-registry` | 0.86.0 | 0.86.3 |
| `node_modules/@react-native/community-cli-plugin` | 0.86.0 | 0.86.3 |
| `node_modules/@react-native/community-cli-plugin/node_modules/@react-native/debugger-frontend` | 0.86.0 | absent |
| `node_modules/@react-native/community-cli-plugin/node_modules/@react-native/debugger-shell` | 0.86.0 | absent |
| `node_modules/@react-native/community-cli-plugin/node_modules/@react-native/dev-middleware` | 0.86.0 | absent |
| `node_modules/@react-native/community-cli-plugin/node_modules/ws` | 7.5.13 | absent |
| `node_modules/@react-native/gradle-plugin` | 0.86.0 | 0.86.3 |
| `node_modules/@react-native/js-polyfills` | 0.86.0 | 0.86.3 |
| `node_modules/@react-native/virtualized-lists` | 0.86.0 | 0.86.3 |
| `node_modules/babel-plugin-polyfill-corejs2/node_modules/semver` | 6.3.1 | 6.3.2 |
| `node_modules/babel-preset-expo` | 57.0.16 | 57.0.17 |
| `node_modules/baseline-browser-mapping` | 2.11.34 | 2.11.35 |
| `node_modules/caniuse-lite` | 1.0.30001820 | 1.0.30001822 |
| `node_modules/deepmerge` | 4.3.1 | absent |
| `node_modules/electron-to-chromium` | 1.5.472 | 1.5.477 |
| `node_modules/expo` | 57.0.31 | 57.0.32 |
| `node_modules/expo-asset` | 57.0.20 | 57.0.21 |
| `node_modules/expo-constants` | 57.0.22 | 57.0.23 |
| `node_modules/expo-modules-autolinking` | 57.0.16 | 57.0.17 |
| `node_modules/expo-modules-core` | 57.0.24 | 57.0.25 |
| `node_modules/glob` | 13.0.6 | 14.0.3 |
| `node_modules/glob/node_modules/minimatch` | absent | 11.0.4 |
| `node_modules/hermes-compiler` | 250829098.0.14 | 250829098.0.17 |
| `node_modules/is-core-module` | 2.17.0 | 2.18.0 |
| `node_modules/node-forge` | 1.4.2 | 1.4.3 |
| `node_modules/path-scurry` | 2.0.2 | 3.0.0 |
| `node_modules/react-native` | 0.86.0 | 0.86.3 |
| `node_modules/react-native/node_modules/@react-native/codegen` | 0.86.0 | absent |
| `node_modules/react-native/node_modules/@react-native/normalize-colors` | 0.86.0 | absent |
| `node_modules/regexpu-core` | 6.5.3 | 6.5.4 |
| `node_modules/regjsparser` | 0.13.4 | 0.14.1 |
| `node_modules/resolve` | 1.22.13 | 1.22.14 |
| `node_modules/semver` | 7.8.5 | 7.8.6 |
| `node_modules/zod` | 3.25.76 | absent |

## Validation

Final code/lockfile SHA: `81ad431fa70a79c29c95a01406b26e65812c5e29`. The closing report commit changes documentation only. All following GitHub results were read after completion for that code SHA.

| Check | Result | GitHub run |
| --- | --- | --- |
| Core TypeScript + regression/unit tests | 794/794 PASS, zero failures | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115471526 |
| Mobile TypeScript | PASS | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469391 |
| Lockfile review | PASS | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469417 |
| Metro Android + iOS, source provenance | PASS, 797/799 sources; watched advisory packages absent from JS maps | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469585 |
| Repeated SDK57 patch trial | PASS, delta 0; exact final SHA256 unchanged | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469429 |
| Native batch | PASS: config/privacy, Android debug + release Kotlin, local Swift module + full iOS Simulator app | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469425 |
| Full npm security inventory | **FAIL**, 4 MODERATE; hard gate and historical regressions preserved | https://github.com/Os-WHGo/VoiceFirst/actions/runs/42115469371 |

Initial Expo-only patch SHA `abf7393248aab16bf93d780bb685ea88e66d664a` also passed full Android/iOS native batch https://github.com/Os-WHGo/VoiceFirst/actions/runs/42114895623 before the subsequent RN alignment. Final batch above supersedes it for the final dependency tree.

Local: reproducible npm ci without third-party scripts, npm ls --all without invalid tree errors, full npm audit (confirmed again after reinstall), 794 tests/core compilation, mobile TS, config/privacy and both Metro exports PASS. Android native-source prebuild, autolinking, release bundling wiring and signing-configuration inspection also PASS; the generated prebuild script edits to mobile/package.json were restored, retaining only the intentional RN pin. Final CI independently repeats prebuild/autolinking and compiles both platforms with Node22; iOS uses Xcode26.6. No source-only evidence is represented as hardware testing.

`expo install --check`: native runtime warning fixed by RN patch; inherited dev-tool version recommendations remain as described above. They are not hidden or treated as successful checks. Android generated release config references debug signing; this compile-only workflow is not a distribution-signing check and no production key was added.

**iPhone/Android status:** native source compilation verified on CI (iOS Simulator, Android Kotlin debug/release); physical phones, mic/ASR/TTS offline models, Bluetooth, airplane-mode and interruption behavior remain PENDING. No APK/AAB/IPA generated, no EAS, paid service, publication, new permission, account or required server. Distributed native exposure is not exhaustively proven by Metro maps. Security remains blocked for merge/release; main remains unmodified (08286606e0fb6e934dc9c38735106ff457a186b3) and no branch protection was changed.

Changed files are limited to mobile/package.json (RN patch pin), package-lock.json, snapshot diagnostic + regression test, native batch marker, this report and two raw audit snapshots. Roll back both dependency commits together on this isolated branch if native/device review finds a regression; do not modify the ChatGPT base branches or rewrite history.

## Next technical block

Obtain an official SDK57-compatible fingerprint update or documented Expo backport moving both glob and minimatch to fixed ranges; test the complete parent chain with npm ci, full audit, Metro, privacy/autolinking and both native builds. Do not upgrade fingerprint across SDK constraints or weaken the gate. Physical iPhone/Android voice/offline/Bluetooth QA remains independently pending.

## Continuation · trial compatibility safeguards

Rechecked upstream and completed PR #6 checks on c3a4d62. npm audit remains **4 MODERATE, 0 HIGH/LOW/CRITICAL**; no newer official fingerprint0.20 patch or SDK57 release is available, and fingerprint0.21.9 still requires glob13/minimatch10. No additional dependency or manifest change is justified.

A reproducible gap in the previous trial comparator allowed prerelease/downgrade candidates within the same numerical SDK major, and inspected family compatibility only for hoisted copies. The comparator now rejects unstable SDK candidates, rollback of required SDK components, fingerprint migration beyond 0.20, and incompatible nested Expo/RN copies even if advisory counts drop. This conservative experiment policy does not assert that every rejected candidate is broken; it requires separate review rather than automatic patch-trial acceptance. Official glob14/minimatch11 transitive choices remain allowed; remaining advisories still block security.

Lockfile-review and both disposable update trials now also run `npm ls --all` after installation, checking missing/invalid installed dependency edges independently of audit counts. No security threshold, baseline, exemption, third-party dependency, mobile feature or native source was changed. Regression fixtures exercise clean-audit candidates with incompatible nested CLI/RN, prereleases, downgraded Expo, unsupported fingerprint, missing instance inventory and the valid official SDK57 patch combination.

Validation and CI results for this continuation are recorded below after completion. Native compilation is not repeated for tooling/tests-only changes; dependency tree is byte-identical to the previously compiled 81ad431 tree (lock SHA256 f54184c144ae69f8f4908480f26c1f14749e82314fe74254ca5d57c9368be2aa). Device QA and the two fingerprint root advisories remain pending.

Continuation code SHA `4414c69bc75a34545ab193008eb8296d5f36c903`: **796/796 PASS** [core](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427346), [mobile TS](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427373), [Metro](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427344), [lockfile + installed graph](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427364). Both disposable experiments PASS: [patch update](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427437) and [unforced audit fix](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427351); both produce delta0 and unchanged checksum, with all four moderate findings still present. Unlike the historical PR#4 candidate, audit fix on the now-patched Expo tree preserves CLI and passes the structural checks, but offers **no additional remediation**. No experimental lockfile was promoted. [Security inventory](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427415) FAIL remains intentional. Local npm ci, npm ls --all, 796 tests and mobile TS PASS. The [native change gate](https://github.com/Os-WHGo/VoiceFirst/actions/runs/42117427345) skips compilation for this tooling-only continuation; actual native compilation evidence remains run42115469425 on the identical dependency/runtime tree.

## Audit response validation continuation

Upstream remains Expo57.0.32/fingerprint0.20.15, with four moderate findings. Reproduced a control defect before editing: `assessReleaseAudit` returned `readyForMerge: true` for a synthetic zero-count response containing `error: {code: 'EAUDIT'}`. This does not demonstrate a real registry exploit or a false green in historical CI; it identifies missing fail-closed input validation.

The zero gate now rejects error-bearing reports and unsupported audit schema versions, checks affected-entry and per-severity totals, and validates npm exit status against findings. A shared `readAuditResult` also protects the patch experiment's actual npm subprocess response. Exit1 alone cannot distinguish findings from an operational error. Regression tests cover error payloads, unknown schemas, interrupted/spawn-failed processes, invalid JSON, contradictory exit status and incorrect severity counts; valid clean reports and valid vulnerability reports remain distinguishable. No threshold, baseline, manifest, lockfile, native/mobile source or curriculum change.

Full validation/CI evidence for this continuation is linked in the PR #6 description and canonical checkpoint. Native compile evidence remains run42115469425 on the unchanged dependency/runtime tree; hardware QA and fingerprint advisories remain open.
