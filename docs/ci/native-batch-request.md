# VoiceFirst | Validación nativa acumulada y voluntaria

Estado: solicitud explícita de un lote B0, 1 noviembre 2026 (CI puede finalizar el 2 noviembre UTC).

## Propósito

Ejecutar UNA ronda conjunta de compilación Kotlin Android y compilación iOS Simulator sobre el HEAD actual de PR #1 tras acumular múltiples macrobloques de progreso local, sesión y currículo. El usuario autorizó hoy agrupar pruebas y compilaciones cuando convenga, en vez de hacerlo siempre o de prohibirlas por completo.

Este archivo es un disparador documentado, **no** una aprobación de publicación:
- La edición del marcador activa el workflow existente `expo-native-readiness.yml`, sin duplicar pipelines.
- `native-ci-change-gate.mjs` detecta la edición y habilita la compilación nativa.
- Android verifica Kotlin debug/release sin empaquetar APK/AAB.
- iOS compila la aplicación en Simulator sin generar IPA ni firmar para iPhone físico.
- Node core, TS y Metro se ejecutan por sus workflows ordinarios.
- No ejecutar EAS, gasto, firma, subida a tiendas, escucha en segundo plano ni sesiones de micrófono real.

El último resultado favorable del runner no sustituye una prueba de audio físico. Tras este lote, solo se edita este marcador para solicitar otra validación acumulada cuando se haya reunido suficiente trabajo pendiente o aparezca un cambio nativo importante.

## Solicitud de lote

Lote: B0-ci-2026-11-01-01.
Motivo: reducir deuda de validación acumulada de las correcciones de VoiceFirst.
Resultado: consultar la ejecución de GitHub Actions correspondiente al último HEAD de la PR; no anotar «aprobada» antes de que los jobs terminen.
