# Native beta preparation and real-world validation

VoiceFirst is a **prototype**. A passing TypeScript workflow is not an installable iOS/Android binary. Do not mark items verified without evidence from a real device.

## Config present in source
- Expo SDK 57, React Native and `expo-speech-recognition` config plugin for microphone and speech recognition permissions. No background recording or playback entitlement enabled by default.
- Internal Android `android-apk` profile and `ios-simulator` profile in `mobile/eas.json`; they do **not** upload to an app store.
- Technical application identifier `com.oswhgo.voicefirst`. No App Store / Play Store registration or intellectual-property exclusivity is claimed.
- Voice recognition explicitly uses `requiresOnDeviceRecognition: true`. If the OS lacks a compatible installed model, voice input is unavailable with a manual text fallback. No automatic cloud ASR.
- One foreground mic owner across curated screens. On backgrounding, invalidating consent or changing activity, stop recording. Requests awaiting mic permission must not activate after the learner cancels.

## Commands for an authorized operator with Expo setup
From the repository root, install dependencies using the declared Node/Expo versions:
```sh
npm install --ignore-scripts
npm run check
npm run check:mobile
cd mobile
npx expo config --type public
# After Expo account / native signing setup, only with explicit approval for service execution:
# eas build --platform android --profile android-apk
# eas build --platform ios --profile ios-simulator
```
For physical iPhones, internal ad hoc provisioning or TestFlight requires appropriate Apple Developer signing and device registration. The iOS simulator profile does **not** install on a physical iPhone. Do not trigger paid cloud builds automatically. Expo Go cannot run the custom ASR native module.

## Acceptance protocol: record device/OS/version and pass/fail
1. **Audio rights**: import a permitted and reviewed WAV pack; attempt invalid hash, wrong locale, duplicate and oversized file; ensure existing pack is never silently replaced. Verify audio plays locally in airplane mode.
2. **Offline-only recognition**: with airplane mode on and model installed, request microphone permission explicitly, read prompt aloud, capture on-device transcription. When unavailable, ensure the app never contacts a VoiceFirst ASR server.
3. **Age/privacy**: verify adult-only preview gate; no diagnostic prompts; no saved audio/transcripts; corrupt preferences/progress must not be overwritten.
4. **Hands-free foreground**: prompt playback → mic start on completion → learner responds → correct review/feedback → commit progress → resume after force close. Verify manual confirmation and lower-confidence paths.
5. **Interruptions**: tap pause, deny permission, lock screen, call interruption, background transition, switch between course and dialogue, change lesson during prompt; late ASR events must not award progress.
6. **Audio routes**: built-in phone mic, wired earbuds, AirPods, generic Bluetooth HFP headset, and Ray-Ban glasses only as generic Bluetooth device when recognized; compare requested vs actual route (native route bridge still pending).
7. **Accessibility**: test one-step vs full-context, subtitles and hidden transcript, low-stimulation, speech rate, longer breaks, correction on request, adult language, VoiceOver / TalkBack.
8. **Reliability**: native launch, crash logs, battery/CPU, local storage migration, latency from prompt end to mic readiness, locale-specific quality, and any device-dependent limitations.
9. **Locked screen**: currently unsupported and intentionally not enabled. Evaluate native iOS AVAudioSession and Android foreground service requirements and platform policy before promising or enabling.

## Known barriers
- No physical iOS/Android binary built in ChatGPT and no native device tests executed.
- No real curated recordings of the approximately 194 planned voice cues, no proven regional TTS voices, no high-accuracy accent assessment.
- No on-device audio input route bridge, user-facing model inventory, or Android foreground service verified.
- Full A1–C2 curriculum remains unfinished and children's launch requires legal/pedagogical/privacy review.

## Bloque 15: nuevas pruebas nativas obligatorias
- Importar en Android e iOS una carpeta real desde el sistema operativo; comprobar permisos temporales iOS y SAF en Android. Validar importador con WAV corruptos, duración cambiada sin alterar el hash autodeclarado, archivos ajenos y carpetas anidadas no permitidas. Un SHA-256 correcto pero controlado por un tercero **no autentica procedencia**.
- Verificar que `pack.json` no se sobrescribe, que staging residual no reemplaza material válido, que las narraciones funcionan desconectadas y que la pantalla de inventario inspecciona realmente los clips locales.
- En Android 13+ contrastar el resultado del listado `getSupportedLocales()` con descargas confirmadas para **cada dialecto**. En Android 12 y anteriores y en iOS no convertir información ausente en afirmación de soporte o instalación. `requiresOnDeviceRecognition:true` debe impedir la ruta cloud en cada caso.
- Comparar `expo config --type public` con `expo prebuild` o binario generado cuando sea autorizado. La verificación estática de CI actual **no** equivale a ejecutar plugins nativos, firmar o instalar APK/IPA.
- Confirmar audio del sistema tras interrumpir con llamadas, cambiar a segundo plano y apagar la pantalla. Ninguna reproducción/captura de fondo es característica habilitada en esta versión.
