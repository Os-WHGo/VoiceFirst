# VoiceFirst · Resultado de auditoría de dependencias de producción

Fecha: 2026-10-20. Evidencia: GitHub Actions `Dependency vulnerability inventory`, commit `01b7276e4b26fb6e83ed168e0828ae4fb143bd11`, run `39398814004`, job `118548106997`.

## Resultado verificable

| Inventario npm | Altas | Moderadas | Críticas | Total |
|---|---:|---:|---:|---:|
| Árbol completo | 15 | 7 | 0 | 22 |
| Árbol con `npm audit --omit=dev` | 15 | 7 | 0 | 22 |

Los 22 nombres del inventario completo aparecen también en el árbol de producción de npm. No hay vulnerabilidades exclusivas del árbol completo en esta comprobación. Los cinco workflows del commit aprobaron, lo cual acredita funcionamiento de las comprobaciones, **no ausencia de vulnerabilidades**.

## Interpretación y siguiente decisión

- `--omit=dev` evalúa cómo npm clasifica dependencias; **no inspecciona el contenido final de Hermes, APK o IPA**.
- Las dependencias de Expo CLI, Metro y Xcode pueden ser necesarias para generar un binario sin ejecutarse dentro de él. Su presencia en el árbol de producción npm no demuestra inclusión en el dispositivo.
- Las dependencias `expo`, `react-native` y `@react-native/virtualized-lists` necesitan un análisis de riesgo de ejecución por separado.
- No se aplican `overrides` ni actualizaciones mayores sin verificar primero versiones corregidas, restricciones de Expo SDK 57, licencia y regresiones.
- Se debe priorizar un artefacto nativo instalable y un inventario verificable de su contenido, además de revisar advisories de `braces`, `node-forge` y `uuid` y sus condiciones de explotación.
- El workflow manual actual `assembleDebug` **no debe anunciarse como APK offline autónomo** sin demostrar que incluye el bundle JS y funciona sin Metro. Una beta instalable offline necesita prueba en dispositivo o emulador y validación de assets, persistencia y reconocimiento de voz local.

**Estado:** 22 alertas sin remediar; 5 workflows SUCCESS; no compilación nativa manual ni prueba física realizada.
