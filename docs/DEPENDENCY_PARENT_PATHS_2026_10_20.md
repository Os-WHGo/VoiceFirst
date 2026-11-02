# VoiceFirst: rutas de dependencia y decisión de remediación (2026-10-20)

**Fuente real:** GitHub Actions, commit `536cdbda6d6f380a33c15292039ee23ed0025dfc`, workflow Dependency vulnerability inventory, run `39398400090`, job `118546730742`. El informe utiliza `npm audit --json --package-lock-only`, `npm explain` y el grafo inverso de `package-lock.json`. No sustituye una evaluación de explotabilidad.

## Relaciones confirmadas

| Paquete afectado instalado | Introducido por | Restricción declarada |
|---|---|---|
| braces 3.0.3 | micromatch 4.0.8 | ^3.0.3 |
| micromatch 4.0.8 | metro-file-map 0.84.5 | ^4.0.4 |
| node-forge 1.4.0 | @expo/cli 57.0.31; @expo/code-signing-certificates 0.0.6 | ^1.3.3 |
| uuid 7.0.3 | xcode 3.0.1 | ^7.0.3 |
| metro-transform-worker 0.84.5 | @expo/metro 56.0.2; metro 0.84.5 | 0.84.5 |
| @expo/code-signing-certificates 0.0.6 | @expo/cli 57.0.31 | ^0.0.6 |

## Decisiones técnicas justificadas

- **No aplicar overrides masivos:** `metro-transform-worker` tiene dependencia exacta `0.84.5`; una sustitución aislada podría romper Metro.
- **No actualizar `uuid` aisladamente a una versión mayor:** `xcode` declara `^7.0.3`; la solución requiere revisar la compatibilidad de su padre.
- **Priorizar el árbol Expo/Metro:** `node-forge` está conectado a herramientas Expo y firma; se necesita verificar el contexto vulnerable y alternativas compatibles, no declararlo inocuo.
- **No prometer que la auditoría está resuelta:** siguen 22 hallazgos (15 high, 7 moderate). Los cinco workflows de la ejecución `4ed44bb1` aprobaron; al consultar `536cdbda` la comprobación Expo native readiness seguía en curso.
- **Próxima prueba concreta:** comparar las versiones corregidas publicadas y rangos de Expo SDK 57, probar cambios puntuales con npm ci, core, TS, prebuild y Metro Android/iOS, repetir npm audit y registrar delta. Mantener opción de revertir.

**Ninguna versión ha sido modificada. No hay APK físico generado ni test en dispositivo.**
