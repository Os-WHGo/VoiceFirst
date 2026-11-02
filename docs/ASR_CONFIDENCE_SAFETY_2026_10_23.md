# VoiceFirst: contrato seguro de confianza ASR · 2026-10-23

## Hallazgo comprobado
En `codex/voicefirst-claude-pedagogy`, `packages/core/src/speech-stack.ts` devuelve `confidencePolicy:'use-reported-confidence'` para ASR del sistema por la sola presencia del locale. Esto **no demuestra** que el adaptador nativo entregue puntuaciones calibradas. El propio informe `docs/VOICE_ENGINE_RESEARCH_2026_10_23.md` exige confirmación cuando no exista confianza calibrada.

## Regla obligatoria para integración
- La selección del idioma ASR del sistema **no habilita calificación automática**.
- Política predeterminada para `os-on-device`: `confirm-every-answer`.
- Solo un adaptador específico, probado por sistema operativo, versión, idioma y dispositivo, puede declarar `confidenceCalibrated:true`; aun así se necesitan umbrales y pruebas con voces humanas antes de usar una transcripción para evaluar.
- Una puntuación numérica o etiqueta `high` sin evidencia de calibración no equivale a confianza fiable.
- `needs-confirmation` ofrece confirmar, repetir o escribir; nunca penalizar por ASR incierto.
- En el catálogo `measuredSpeechCandidates`, mantener `licenseReviewed:false` hasta verificar licencia de pesos, dependencias y redistribución, además de memoria y rendimiento en móvil.
- No publicar una ruta de pronunciación puntuada sin evaluación acústica validada.

## Caso de prueba obligatorio
Dado `osOnDeviceAsrLocales:['en-CA']` y sin modelos instalados, `planSpeechStack` debe seleccionar `source:'os-on-device'` con `confidencePolicy:'confirm-every-answer'`. El resultado no debe cambiar por una etiqueta de confianza inventada por la interfaz.

## Estado
Especificación de seguridad documentada. Implementación en rama Claude pendiente de incorporación selectiva. No implica fusión ni prueba en dispositivos.
