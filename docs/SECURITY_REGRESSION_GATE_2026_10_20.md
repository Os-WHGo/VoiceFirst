# Security regression gate | VoiceFirst | 2026-10-20

## Scope
This is a **non-mutating** npm audit guard. It does not remediate vulnerabilities or establish Android/iOS runtime exploitability.

## Observed baseline
- 22 flagged npm packages: 15 high, 7 moderate, 0 critical, 0 low.
- 3 packages with their own advisories: `braces`, `node-forge`, `uuid`.
- Allowed advisory IDs: GHSA-vfj7-8cjw-p6xm, GHSA-86w9-cpqp-85rv, GHSA-w5hq-g745-h8pq.
- Direct workspace packages flagged: `expo` and `react-native`; inherited flags are not independent advisories.

## Enforced checks
`scripts/security-audit-policy.mjs` is pure and tested with six cases: baseline, new advisory on an existing package, high-severity increase, improvements, missing counts, and malformed advisory URLs. `scripts/check-security-audit-regression.mjs` reads `npm audit --json --package-lock-only`; CI fails if any severity count exceeds its baseline, any unknown advisory URL appears, or the audit schema is malformed. The existing advisory-root guard remains.

**Limitations:** A severity ceiling is not a security fix. An advisory reclassification or registry response change can require manual investigation. The check is not a substitute for scanning mobile bundles, verifying patched upstream releases, testing native builds, or device testing.

## Follow-up
Investigate compatible dependency-chain replacements in an isolated branch or reversible PR commit. Verify `npm ci`, unit tests, TypeScript, Expo prebuild, Android/iOS JS bundles, and npm audit delta. Do not use `npm audit fix --force` or assume a patched release exists. Do not distribute the A0 beta until native offline validation is complete.
