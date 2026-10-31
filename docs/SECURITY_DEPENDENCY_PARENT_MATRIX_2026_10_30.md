# VoiceFirst dependency parent matrix

Read-only analysis of package-lock.json on 2026-10-30.

| Dependency | Resolved version | Direct parent and requested range |
| --- | --- | --- |
| zod | 3.25.76 | @expo/cli 57.0.31, ^3.25.76 |
| deepmerge | 4.3.1 | @expo/config 57.0.10, ^4.3.1 |
| glob | 13.0.6 | @expo/cli, @expo/config, @expo/config-plugins, @expo/fingerprint, @expo/metro-config, ^13.0.0 |
| minimatch | 10.2.6 | @expo/fingerprint and glob, ^10.2.2 |
| uuid | 7.0.3 | xcode 3.0.1, ^7.0.3 |

CI currently blocks on deepmerge, glob, minimatch, and zod advisory sources; do not weaken the baseline gate. All are transitive paths, predominantly Expo build tooling. A reported advisory is not proof that untrusted input reaches the affected function. Prioritize evaluating the high-severity Zod advisory. Zod 4 is outside @expo/cli's declared major range and must not be forced without upstream compatibility validation.

Before updating: review official advisories and Expo patch releases; test any proposed version change on this isolated branch, compare npm audit results, and run core/mobile/native config and lockfile checks. Do not merge to main or ship a beta without validation.
