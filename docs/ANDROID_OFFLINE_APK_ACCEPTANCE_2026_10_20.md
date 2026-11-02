# VoiceFirst · Criterios de aceptación de APK Android sin Metro

Fecha: 2026-10-20. Alcance: preparar y verificar, sin disparar compilaciones manuales ni publicar.

## Diferenciar artefactos

- `./gradlew :app:assembleDebug` genera un APK de desarrollo. Según configuración puede solicitar un servidor Metro; **no equivale automáticamente a una beta offline**.
- La exportación `expo export --platform android` ya verificada por CI confirma un bundle JS/Hermes exportable, **no que el APK lo incluya**.
- El workflow `android-internal-apk-manual.yml` (commit `c65d5de`) inspecciona el listado ZIP del APK de debug e informa si no detecta `assets/index.android.bundle` o un `.hbc`. Es un indicador, no una prueba suficiente de arranque offline.

## Criterios mínimos para llamar beta offline

1. Compilación nativa de una variante con bundle JS/Hermes y assets empaquetados, sin requerir Metro.
2. Instalación limpia y arranque con datos móviles y Wi-Fi desactivados, sin conexión a un servidor de desarrollo.
3. Catálogo A0 de 36 lecciones cargado localmente y navegación en seis idiomas.
4. Progreso y reintentos persisten tras cierre forzado/reinicio, sin sobrescribir un diario corrupto.
5. Pruebas de accesibilidad y permisos de audio; reconocimiento local probado en dispositivos y lenguas compatibles. Si un motor necesita descargar modelos, no afirmar offline antes de su instalación y validación.
6. Evidencia reproducible: SHA-256 del APK, commit, versión Android, dispositivo/emulador, resultado y fallos.

## Decisión de seguridad

No modificar automáticamente el flujo de compilación manual para producir una variante release ni añadir claves de firma sin validar el proceso de firma y los permisos. No activar workflow_dispatch sin aprobación. Investigar variante interna autónoma compatible con Expo SDK 57 y Android Gradle Plugin antes de implementarla.

## Estado

No hay APK construido en este bloque, ni instalación o prueba offline real. Los 22 hallazgos npm siguen abiertos.
