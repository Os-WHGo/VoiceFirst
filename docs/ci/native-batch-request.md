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

Lote: B0-ci-2026-11-02-03-expo57-patch.
Motivo: reducir deuda de validación acumulada de las correcciones de VoiceFirst.
Resultado: consultar la ejecución de GitHub Actions correspondiente al último HEAD de la PR; no anotar «aprobada» antes de que los jobs terminen.

## Validación acumulada B0 · traspaso seguro de ASR · 02-11-2026 UTC

Motivo del lote agrupado: se acumularon varios macrobloques reales de navegación por voz, selección de idiomas y turnos de reconocimiento sin actualización de la compilación nativa desde el SHA da5d95d4. El núcleo ahora espera el evento terminal nativo del turno anterior antes de un único reintento foreground, con cancelación por pausa/cambio de idioma/background, límite de 5 segundos y comprobación actualizada de modelo. Se solicita ejecutar en esta rama los trabajos nativos de código Android Kotlin debug/release e iOS Simulator, sin generar APK/AAB/IPA, sin firma o publicación, sin permiso de audio de fondo, gastos externos o pruebas físicas simuladas. Solo registrar PASS al terminar los jobs correspondientes al HEAD real.

## Validación B0 nativa agrupada · actualización de SDK 57 dentro de la misma versión mayor · 02-11-2026 UTC

Motivo: se promovió en `package-lock.json` el conjunto de 27 cambios exactos del experimento reproducible https://github.com/Os-WHGo/VoiceFirst/actions/runs/41419235597. Incluye `expo 57.0.30→57.0.31`, `@expo/cli 57.0.31→57.0.32`, `@expo/config-plugins 57.0.10→57.0.11`, `xcode 3.0.1→4.0.0` como transitiva upstream y eliminación de `uuid`. Esa actualización transitiva de `xcode` afecta rutas de prebuild y obliga a validación de Android Kotlin debug/release **e iOS Simulator** bajo la política V4 antes de dar por seguro el cambio. El ensayo previo verificó núcleo/TypeScript/Expo/Metro en runner temporal, no compilación nativa.

Requisitos: usar el SHA real de esta PR, ejecutar `expo-native-readiness.yml` completo, sin `APK/AAB/IPA`, sin firma comercial, sin despliegue, ni recursos de micrófono en segundo plano. Registrar fallos sin suprimir alertas. El inventario npm permanecerá FAILED mientras existan GHSA sin corregir; no confundir compilación nativa satisfactoria con seguridad de publicación.
