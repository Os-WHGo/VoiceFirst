# VoiceFirst local LLM integration: gated implementation

Status: adapter implemented; native dependency and GGUF model NOT installed or device-tested.

## Existing compatibility evidence

- VoiceFirst uses Expo SDK 57, React Native 0.86, and Expo Continuous Native Generation.
- Upstream [llama.rn](https://github.com/mybigday/llama.rn) documents `initLlama`, `completion`, and `release` plus an Expo config plugin. Its `package.json` main branch reported `0.13.0-rc.7` when inspected on 2026-10-18, with MIT license; version is prerelease and must be pinned and verified before adoption.
- Since llama.rn v0.10, React Native New Architecture is mandatory. Check the actual generated app architecture and build environment rather than assuming compatibility.
- llama.rn `postinstall` downloads prebuilt native libraries. Inspect release provenance, SHA-256, license notices, build reproducibility and Android/iOS binary size before allowing dependency installation. This is a build-time network action, not a runtime AI API.

## Existing code

`mobile/llama-rn-adapter.ts` maps the injected native `initLlama` function to the `NativeLocalTutor` interface. The adapter uses local file URI, CPU-first (`n_gpu_layers:0`), a 512-8192 context bound, low temperature, max 256 output tokens and explicit session release. The native package is not imported or bundled yet.

`packages/core/src/local-model-file-verification.ts` validates file size and a digest returned by a native verifier. The temporary Expo implementation uses in-memory hashing limited to 8 MiB; real GGUF files need a streaming native SHA-256 implementation with private staging, verified file promotion and interruption recovery. URI string checks are not sandbox containment proofs.

## Next acceptance gates

1. Verify a specific stable release of llama.rn and compatibility with Expo 57 / RN 0.86 in an isolated branch or build. Do not enable prerelease binary downloads in protected CI without review.
2. Select a small GGUF model with verified redistribution license, locale coverage, SHA-256 and memory budget. Do not imply the model is installed based on manifest metadata.
3. Implement native streaming SHA-256 and private atomic install before passing a file path to `initLlama`.
4. Build Android debug and iOS development binaries; measure model load time, tokens/s, peak RAM, heat and battery on physical devices, across six locales.
5. Run prompt-injection, off-topic, minor-safety and offline/no-network tests. Preserve authored course fallback.

No inference has been verified on a physical device. Do not merge to main without approval.
