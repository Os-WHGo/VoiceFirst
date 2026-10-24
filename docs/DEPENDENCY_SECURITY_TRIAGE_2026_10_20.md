# VoiceFirst · Triaje inicial de seguridad de dependencias (2026-10-20)

Fuente verificable: GitHub Actions, workflow **Dependency vulnerability inventory**, commit `d39d9c3c42dbcc8ebb05b5b3b88d372d99a566ca`, run `39397520072`, job `118543826872`. Comando `npm audit --json --package-lock-only`. Resultado: **22 vulnerabilidades reportadas (15 high, 7 moderate, 0 critical)**. El workflow informa hallazgos, **no** exige cero vulnerabilidades.

## Paquetes señalados

- **Directos, severidad alta**: `expo`, `react-native`. El reporte indica `fixAvailable` con intervención o actualización mayor. No cambiar versiones aisladas sin verificar compatibilidad Expo SDK 57.
- **Indirectos, severidad alta**: `@expo/cli`, `@expo/code-signing-certificates`, `@expo/metro`, `@expo/metro-config`, `@react-native/community-cli-plugin`, `@react-native/virtualized-lists`, `braces`, `metro`, `metro-config`, `metro-file-map`, `metro-transform-worker`, `micromatch`, `node-forge`.
- **Indirectos, severidad moderada**: `@expo/config`, `@expo/config-plugins`, `@expo/inline-modules`, `@expo/local-build-cache-provider`, `@expo/prebuild-config`, `uuid`, `xcode`.

Referencias de advisories expuestas en el log:
- `braces` (rango reportado `<=3.0.3`): https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- `node-forge` (rango reportado `<=1.4.0`): https://github.com/advisories/GHSA-86w9-cpqp-85rv
- `uuid` (rango reportado `<11.1.1`): https://github.com/advisories/GHSA-w5hq-g745-h8pq

## Evaluación provisional, no conclusión de explotabilidad

Los paquetes de CLI, Metro, configuración y Xcode se usan habitualmente en desarrollo y empaquetado. **Esto no prueba** que sus vulnerabilidades no puedan afectar el producto, el proceso de compilación o la cadena de suministro. `react-native` y `@react-native/virtualized-lists` requieren revisión especial por su relación con código de ejecución. No se ha determinado aún la ruta vulnerable, versión exacta corregida ni si existe una mitigación sin salto mayor.

## Próximas comprobaciones

1. Obtener para cada advisory el camino de dependencia `npm explain <paquete>`, versiones instaladas y versiones corregidas.
2. Comparar opciones de actualización y `overrides` con los rangos requeridos por Expo SDK 57; no forzar cambios masivos ni `npm audit fix --force`.
3. En una rama autorizada, probar cada cambio con núcleo, TypeScript, Expo config, prebuild Android y export Metro Android/iOS.
4. Repetir `npm audit`, documentar diferencia exacta y revisar los riesgos residuales antes de distribuir una beta a terceros.

**Estado:** inventario y triaje documental realizados. **No se han remediado vulnerabilidades ni certificado seguridad.**
