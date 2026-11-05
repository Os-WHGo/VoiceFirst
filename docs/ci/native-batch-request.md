# Native batch request · iOS Simulator startup · 2026-11-05

Base: PR #7 be6b24006eeff3a0b7f3e76807ad6fc077be2dc4, including PR #6 dependency/security work. Run existing Android Kotlin Debug/Release and full unsigned iOS Simulator compilation. Then launch the already-built Simulator app on a fresh disposable iPhone Simulator and verify the actual initial React Native screen with Apple Vision OCR, without granting permissions or pressing playback.

No APK/AAB/IPA, production signing, distribution or hardware-audio claim. Four moderate npm findings remain blocked. Details: docs/IOS_SIMULATOR_STARTUP_2026_11_05.md.
