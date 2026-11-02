# VoiceFirst security CI triage, 2026-10-30

## Verified
Commit `a4bddfa93a93531e2172141a6b70c22aea227824`: core checks, mobile TypeScript, Expo native configuration and dependency lockfile review PASS. Dependency vulnerability inventory FAILS at `check-security-advisory-baseline.mjs`.

Previous inventory job reported newly observed advisory-source packages: `deepmerge` (low), `glob` (moderate), `minimatch` (moderate), `zod` (high); `uuid` remains a known baseline source. These are advisory sources in the dependency tree, not proof of exploitability in mobile runtime.

Mobile dependency manifest currently pins Expo ~57.0.0, React Native 0.86.0 and related Expo packages. The existing baseline script permits only `braces`, `node-forge`, `uuid`; do not simply append newly flagged packages to make CI green.

## Remediation gate
1. Inspect `package-lock.json` for exact affected versions, dependency parents, and whether production or tooling paths.
2. Check upstream patched versions and Expo 57 / RN 0.86 compatibility. Review GitHub advisories and licensing. Prioritize `zod` high.
3. Prefer smallest compatible updates, preserve lockfile reproducibility. Do not use blind `npm audit fix --force`.
4. Run `npm ci --ignore-scripts`, `npm run check`, `npm run check:mobile`, Expo native config checks, dependency inventory and lockfile review. Compare before/after advisory IDs and severities.
5. Only after tests and compatibility checks, commit changes on authorized branch; do not alter main or weaken security checks.

## Mobile beta
No signed APK/IPA or physical offline voice test is verified by these CI passes. Keep beta gate blocked until native validation.
