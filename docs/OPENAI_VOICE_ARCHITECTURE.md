# VoiceFirst | OpenAI voice-first provider | 2026-10-16

## Main decision

Learning-first. Meta Ray-Ban translation and sign translation are **not in MVP**. Keep future translator as a separate source adapter with its own permissions, not a dependency of the teacher.

Six immediately selectable languages: en-CA, fr-CA, es, pt-BR, de, it, all 30 directed native-to-target combinations. Real curriculum parity and reliability are not demonstrated yet. CEFR A0 is an internal pre-A1 label.

## What OpenAI does

- Primary realtime: OpenAI `gpt-realtime-2.1-mini` via WebRTC, or `gpt-realtime-2.1` for comparative quality/latency tests; keep audio and interruption controls distinct from pedagogy. Client secret created by backend: `POST /v1/realtime/client_secrets` (GA, not deprecated `/v1/realtime/sessions`). See https://developers.openai.com/api/docs/guides/voice-webrtc and https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets/methods/create . **Live media track wiring not yet implemented.**
- First microphone lab: capture short turns through Expo Audio -> protected local development gateway -> OpenAI `gpt-transcribe` -> `gpt-6-luna` Responses API (contextual tutor) -> `expo-speech` on-device playback. Microphone available only with permission, and a button ends each turn. This is **not** yet fully hands-free, real-time or screen-lock compatible.
- User context is capped to six short turns and is sent only as needed; `store:false` is supplied to Responses API. Actual retention by the API provider follows its applicable settings and terms, not exclusively our application flag.
- Tutor instructions are generated from individual preferences, without assigning neurodiagnoses. Explains slang, dialect, intent, uncertainty and register; never treats ambiguous ASR as a pronunciation score.
- Curated pedagogical content still required: CEFR skill graph, assessment rubrics, spaced repetition, localization, validation with diverse learners and real educators. Avoid copyrighted transcript ingestion.

## Gateway safety

The server at `backend/src/server.mjs` binds **127.0.0.1 only**, demands a 20+ character `VOICEFIRST_DEV_TOKEN` supplied interactively in the mobile lab, applies a basic per-process request budget and limits file/history size. It never sends a permanent OpenAI key to the phone. The gateway's development token is also **not** production authentication: before deployment implement user identity, HTTPS, quotas, revocation and abuse control. Do not deploy this gateway as-is.

Configure locally in a terminal, never in GitHub or chat:

```bash
export OPENAI_API_KEY="your-key-from-platform.openai.com"
export VOICEFIRST_DEV_TOKEN="a-long-random-dev-password-min-20-chars"
npm run backend:dev
```

For the iOS Simulator running on the same computer, set `EXPO_PUBLIC_VOICEFIRST_DEV_URL=http://127.0.0.1:8787` in a **local uncommitted** `.env.local`; enter the development token into the app's field when testing. This is a strictly local route; on a physical iPhone it does not work yet, since the iPhone's localhost is the iPhone and the gateway rejects public binding. Do not put `OPENAI_API_KEY` or `VOICEFIRST_DEV_TOKEN` in an `EXPO_PUBLIC_*` variable.

Initial dependencies (Expo SDK 57): `expo-audio`, `expo-file-system`, `expo-speech`. Validate with `npx expo install --check` and a dev build. Microphone integration, recording file deletion and audio response synthesis **not validated on physical devices**. `expo-speech` alone should not be assumed to support uninterrupted playback under screen lock.

API costs are **separate from ChatGPT Plus** and depend on audio and text usage. Add a real per-user cost meter and spending limits before public launch.

## Future Ray-Ban module (separate)

`translation/audio` transcribes **only audio explicitly consented to and heard**, including live speech. `translation/vision` interprets **only images explicitly captured with consent**: signs and other text. Present results as speech and optionally text in supported wearables displays. Never claim third-party access to Meta smart glasses screen, camera or `Hey Meta` without SDK permission and hardware validation. Work deferred until tutor is stable.

## Verified automated coverage

`npm run check`: TypeScript domain build and 33 logical/mock network tests as of this commit. They do **not** prove OpenAI account entitlement, actual voice transcription quality, real time end-to-end latency, headset compatibility, OS background playback, physical mobile build, or production readiness.
