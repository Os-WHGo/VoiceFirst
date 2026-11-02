# VoiceFirst AI Contributor Instructions

VoiceFirst is independent from WHGo, Wivra, and all other repositories. Scope changes to this repository only. The app should teach six languages mutually: `en-CA`, `fr-CA`, `es`, `pt-BR`, `de`, `it`, while preserving user-selected native language, target language, and interface language as separate fields.

## Safety and quality
- Voice-first, accessible and adjustable to individual preferences without assigning clinical labels.
- No third-party ads, forced subscription, sale of data, or ads during classes.
- Don't record audio without explicit consent; never commit credentials, personal data, keys or recordings.
- Never claim iOS background audio, Meta SDK functionality, native mobile compatibility, or CEFR certification without evidence.
- Do not reuse proprietary competitors' content or assets.
- Audit code licenses and model/voice weights before adding dependencies.

## Development procedure
1. Read `README.md`, `docs/STATUS.md`, and project Google Drive document 00 when accessible.
2. Make minimal, testable scoped changes; retain native and target language distinction and 30 cross-language pairings.
3. Run `npm run check` and note any build, device, or network checks you could not execute.
4. Develop on branches; obtain review before merging to main.
5. Differentiate prototype selection, functional voice interaction and pedagogical coverage clearly.

Official research folder: https://drive.google.com/drive/folders/13ccLxx3GZHKXBiPu63Jduu5SamonXGzL

## Priority after the October 2026 decision
- Finish the six-language hands-free tutor first on phone, wired headsets and Bluetooth. Meta wearables translation of speech and signs is a **later independent module**.
- OpenAI is the first **candidate** for contextual tutoring, slang and multilingual dialog, not a guarantee of accuracy nor free access to the ChatGPT model. API keys remain on a trusted service; ChatGPT subscription is unrelated to API billing.
- Read `docs/OPENAI_VOICE_ARCHITECTURE.md`. Never expose the local-only development gateway publicly. Future production authorization and budget controls are required.
- Never treat transcription text alone as proof of a phonetic pronunciation error; do not infer autism, ADHD or diagnoses.
