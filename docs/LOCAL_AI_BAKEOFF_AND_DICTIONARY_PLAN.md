# Local AI evaluation gate (17 October 2026)

Status: candidates only. NO conversational LLM, phonetic grading engine, or standalone speech synthesis model has been installed or benchmarked on a physical phone.

## Target behavior
1. Learner speaks freely. Offline ASR produces transcript and uncertainty indicators.
2. A local intent/semantic component distinguishes understandable alternatives from errors; it must be able to abstain.
3. A distinct phonetic assessment component uses actual audio, not just the transcript, to offer sound-level feedback only when confidence is sufficient.
4. The authored teaching engine owns lesson sequencing, support language, safety, and progress.
5. Speech output must be locally available and licensed for the intended distribution.

## Candidate matrix for a real device bake-off
| Layer | Candidate | Decision |
|---|---|---|
| ASR | whisper.cpp | Investigate CPU, memory, six-language accuracy and offline model redistribution |
| ASR | sherpa-onnx | Investigate mobile streaming, VAD, language models and licenses |
| ASR (Apple) | WhisperKit | Investigate Apple-only tradeoffs, model availability and Android alternative |
| On-device LLM | llama.cpp with a small multilingual GGUF model | Investigate memory, latency, license, language understanding, and safe abstention |
| TTS | Kokoro / sherpa-onnx TTS | Investigate six-language voice availability, audio quality and voice/model licenses |
| Pronunciation | forced alignment + phoneme-level acoustic evidence (candidate undecided) | Do not claim scores from transcript matching |

## Test set to build before selecting
- 30 directional language-pair support cases.
- English: 13 vs 30, 15 vs 50, 16 vs 60, prices, dates, phone digits and code-switching.
- French: 70–99, 71, 80, 81, 97, Quebec and France pronunciation variations.
- Meaningful alternate requests, grammatical slips, accented L2 speech, background noise, low confidence and interruptions.
- Compare response latency, battery, RAM, offline network isolation, model download sizes, cold start and child privacy controls.
- Test clear international speech plus Canadian, US, UK, and mixed lexical variants without penalizing legitimate accents.
- Reject unsupported model claims and any model/license that forbids intended app distribution.

## Current repository implementation
- Authored short dialogues, exact curated alternative transcript matching, SQLite progress and on-device OS ASR route.
- New isolated modules: `number-listening.ts` (original English/French 0–99 listening seed), `speech-learning-preferences.ts` (accent/instruction policy).
- These modules are not a complete dictionary, not yet wired to the app UI, and not evidence of real pronunciation grading.
- Real model comparison requires installing candidates and measuring on Android/iOS hardware. No paid inference API as mandatory runtime.
