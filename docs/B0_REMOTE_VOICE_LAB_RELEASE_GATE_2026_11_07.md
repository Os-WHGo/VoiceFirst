# MU | VoiceFirst B0 | Optional remote voice lab cannot ship in public courses

Date: 2026-11-07. **Development-only, no remote service activation and no billing.**

## Problem
`mobile/VoicePractice.tsx` was mounted in `mobile/App.tsx` even in production builds. It required a URL, developer token and opt-in before a request but could have become accessible with an accidental `EXPO_PUBLIC_VOICEFIRST_DEV_URL` release configuration, violating the promised free, local-first compulsory course and making the optional remote path too visible.

## Safe implementation
- Wrap the whole `VoicePractice` route in `__DEV__` while preserving the existing compulsory offline-first learning course, microphone with no-mic alternatives, local SQLite, voice packs and accessibility. The optional lab is not a release navigation item.
- `privateVoiceLabDevUrl` returns **null** for every non-development build. In development, explicit local URL must be plain HTTP on localhost/127.x, IPv6 ::1 or RFC1918 (10/8, 172.16/12, 192.168/16), with no credentials, path, query, fragment or whitespace. This does not certify a safe backend: the app still requires voluntary consent and a separate developer token; the backend still owns authentication and rate limits. VPN/domain/Internet URLs are deliberately out of scope.
- `VoicePractice` itself also fails closed in release on URL selection, recording start, recording completion and rendered controls. Revokes consent and aborts pending remote fetches if the app becomes inactive; tries to stop and delete temporary audio if recording, without claiming infallible deletion. Rechecks consent/foreground around async upload.
- No API key is stored in the client, no remote AI or server is automatically activated. **No public release, subscription, paywall, ads or sale of user data** results from this change.

## Verification and acceptance
`packages/core/test/voice-lab-development-policy.test.mjs` checks adversarial URLs, release mode, UI route gate, foreground-only recorder, request cancellation and consent revalidation. TypeScript, JS bundle, core and native checks must be associated with exact SHA via CI.

A private beta developer may still enable this local laboratory explicitly, but the free and offline authored core does not depend on it. Never claim end-to-end audio privacy or deletion without physical device and network traffic QA. Production releases require an independent policy review before exposing any paid/remote option.

No dependency or `main` modifications, generated APK/IPA, new backend calls, model fees or unrelated project integration.
