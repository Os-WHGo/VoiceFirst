# MU | VoiceFirst | Auditoría de seguridad técnica
**Fecha de corte:** 2026-11-02 (UTC). **Alcance:** PR #1, rama `codex/voicefirst-initial-source`, Expo SDK 57, dependencias npm, workflow de seguridad, superficies móviles de voz/almacenamiento, importadores locales, gateway de desarrollo y condiciones para fusión.

> **DICTAMEN: NO APTO PARA FUSIÓN A `main` NI PARA RELEASE PÚBLICO EN ESTE CORTE.** La CI funcional y las compilaciones nativas históricas funcionan, pero `Dependency vulnerability inventory` continúa FAIL. La compatibilidad de upgrades mayores Expo/Zod/glob/minimatch/uuid no está demostrada y las pruebas físicas aún faltan. Un conteo npm audit es *paquetes afectados*, no el número de explotaciones independientes.

## Evidencia verificable

- PR: https://github.com/Os-WHGo/VoiceFirst/pull/1 (DRAFT, base `main`); SHA de revisión funcional anterior `087237cab0b706d4c82039fa86e80d0c94943914`.
- Inventario npm vivo en Actions: https://github.com/Os-WHGo/VoiceFirst/actions/runs/41414060990 (FAIL); **15 paquetes afectados = 2 high, 11 moderate, 2 low, 0 critical**. 5 bibliotecas fuente de avisos y dependientes señalados por propagación. El baseline de seguridad es un techo de regresiones, no una autorización de riesgos.
- Pruebas funcionales anteriores al cambio de workflow: 767/767 PASS, https://github.com/Os-WHGo/VoiceFirst/actions/runs/41414061102.
- Compilación agrupada anterior Kotlin Android debug/release e iOS Simulator: SUCCESS https://github.com/Os-WHGo/VoiceFirst/actions/runs/41406213103 (SHA `f3ec5867728fd9398c3aefb8145f5848dae3a3c3`). Sin APK/IPA, sin QA de dispositivos.
- Comprobación histórica de source maps Expo/Metro (repositorio/CI previos) informó ausencia de las cinco bibliotecas afectadas en las fuentes de JS entregadas: **indicio de alcance principalmente de tooling**, no prueba de que no exista riesgo nativo o indirecto; no se repitió la inspección de source maps físicos en este corte.
- La rama `main` devuelve `protected:false` en API de GitHub. Riesgo de gobernanza: una persona con permisos podría fusionar incluso con CI rojo. Proponer configurar required checks y revisión en GitHub; no modificar protección sin decisión explícita del propietario.

## Inventario de causas raíz (CI 41414060990)

| Raíz / versión observada en trazas | Severidad GHSA fuente | Afectación y parche oficial | Cadena / decisión |
| --- | --- | --- | --- |
| `zod@3.25.76` | **HIGH** | GHSA-mrhx-c7xc-m3w5: versiones `<4.6.6`, fijo `4.6.6` | `@expo/cli@57.0.31` declaró `^3.25.76` en el lockfile histórico; Zod 4 no cabe en el rango. No forzar override mayor, investigar parche oficial Expo y sus API. |
| `glob@13.0.6` | MODERATE | GHSA-3g3m-2fjr-6pw4: `>=9 <=14.0.1`, fijo `14.0.2` | `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config` y relacionados requieren `^13`. Requiere adaptación upstream y pruebas. |
| `minimatch@10.2.6` | MODERATE | GHSA-g3hv-75wg-m249: `<11.0.1`, fijo `11.0.1` | `glob@13` y `@expo/fingerprint` aún requieren 10.x. Posibles cambios de semántica entre mayores. |
| `uuid@7.0.3` | MODERATE | GHSA-w5hq-g745-h8pq: `<11.1.1` (entre otros rangos), corregido `11.1.1` | `xcode@3.0.1` requiere `^7.0.3`. Un major override no es compatible sin evidencias. |
| `deepmerge@4.3.1` | LOW según GHSA | GHSA-gcqx-w48m-w2h4: `>=4.2.0 <=4.3.1`; **sin versión corregida** | `@expo/config` requiere 4.x; no hay solución npm directa verificada. |

**Fuentes primarias:** https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 ; https://github.com/advisories/GHSA-3g3m-2fjr-6pw4 ; https://github.com/advisories/GHSA-g3hv-75wg-m249 ; https://github.com/advisories/GHSA-w5hq-g745-h8pq ; https://github.com/advisories/GHSA-gcqx-w48m-w2h4 . Ver también upstream Expo issue https://github.com/expo/expo/issues/52735 , aún abierto al corte; se refiere a SDK 58 y NO prueba que Expo 57 esté corregido. Registrar por separado versiones futuras antes de tocar el lockfile.

**Importante:** “2 high” cuenta dos entradas del árbol que heredan/señalan severidad alta; el advisory propio alto es Zod. “11 moderate” incluye padres que heredan avisos. No multiplicar las causas raíz por la cantidad de dependientes.

## Auditoría de otras superficies relevantes

| Área | Evidencia de código | Estado / riesgo residual |
| --- | --- | --- |
| Audio y ASR | `mobile/app.json` deshabilita `enableBackgroundPlayback` y `enableBackgroundRecording`. `use-on-device-answer.ts` usa `requiresOnDeviceRecognition:true`, `continuous:false`, `persist:false`, cancela foreground al cambiar AppState y espera `end` antes de nuevo turno. | Controles de privacidad presentes en código. Sin evidencia física de comportamiento del SO, ruta Bluetooth, permisos terminales o procesamiento offline real. |
| Progreso | `mobile/progress-storage.ts` almacena identificadores y conteos locales; advierte explícitamente SQLite KV **sin cifrado**. | Apto solo para esos datos no sensibles. No añadir transcripciones, biometría ni identificadores a esta base sin cifrado y gestión de claves. |
| Paquetes de audio | `preflightLocalWavPack` comprueba límites, WAV, rutas y derechos declarados; `install-voice-pack.ts` verifica SHA-256 y revalida copias antes de promover. | SHA verifica integridad respecto del manifiesto, NO autenticidad ni licencias de un tercero. En distribución pública se requiere firma/procedencia editorial verificada. |
| Paquetes/modelos locales | `mobile/local-model-file-verifier.ts` restringe `file://`, tamaño <=8 MiB y SHA-256; `mobile/llama-rn-adapter.ts` es adaptador opcional sin módulo nativo incluido. | No tratar el adaptador como IA local integrada. Riesgos de modelos externos, licencia, entradas maliciosas y recursos deben probarse antes de habilitar. |
| Gateway remoto opcional | `backend/src/server.mjs` se anuncia de desarrollo; comprueba loopback, dev token y límites de petición, y mantiene clave OpenAI en servidor. `backend/test/gateway.test.mjs` cubre parte del contrato. | No incluirlo ni desplegarlo para el curso obligatorio. Contiene rutas de servicio facturable opcional, nunca activar sin autorización. No es un backend de producción. |
| GitHub Actions | `dependency-vulnerability-inventory.yml` tenía filtro `pull_request.paths`; una PR distinta con cambios no listados podía omitir la auditoría. | **Corregido en rama:** ejecutar para TODAS las PR, sin `paths`; checkout de solo lectura sin credenciales persistentes. 3 pruebas de regresión. Aún no demuestra enforcement de required checks de `main`. |

## Medidas efectuadas durante esta auditoría

1. **Corrección reversible del workflow:** `.github/workflows/dependency-vulnerability-inventory.yml` ahora usa `pull_request` sin filtro de rutas para que cada PR tenga inventario; `actions/checkout@v4` con `persist-credentials:false`; `permissions: contents: read` ya existente se conserva.
2. **Pruebas adicionales:** `packages/core/test/security-workflow-always-on.test.mjs` comprueba cobertura global de PR, ausencia de exclusiones por rutas, ejecución de raíz/advisory/regresión y que no haya `continue-on-error` ni credenciales retenidas.
3. Se preservan los controles `check-security-advisory-baseline.mjs` y `check-security-audit-regression.mjs` **sin alterar baselines, suprimir GHSA, desactivar auditoría, ni usar `npm audit fix --force`**.
4. No hubo cambios del lockfile ni upgrades incompatibles, no se generaron instalables, no se publicaron servicios, no se usaron credenciales privadas, no se tocó `main`.

## Plan de remediación, ordenado por riesgo

1. **P0, no fusionar/publicar:** mantener la CI roja para seguridad, impedir merge incluso si la API indica `mergeable:true`; exigir requerido el check de auditoría para `main` desde GitHub Branch Protection (necesita autorización/configuración de repo).
2. **P0, proveedor:** revisar nuevas versiones de parche **compatibles del conjunto Expo SDK 57** y los rangos transitivos reales; ensayar lockfile en rama aislada. No asumir que `@expo/cli@57.0.32` ni SDK 58 solucionan los cinco GHSA sin inspección de sus manifiestos.
3. **P1, cambios compatibles demostrados:** validar variantes de dependencias en copia aislada con `npm ci`, `npm audit --json --package-lock-only`, core, TypeScript, Metro, configuración iOS/Android y lote nativo acumulado; descartar cualquier override mayor que rompa semántica o autolinking. Revisar también licencias.
4. **P1, contenido y privacidad:** firmar/validar procedencia de paquetes publicados, probar micrófono, modelos locales y modo avión en dispositivo físico, comprobar ausencia de grabación de fondo y que sólo se guardan datos no sensibles.
5. **P2, producción:** pruebas de penetración y SAST/secret scanning dedicados, verificación de permisos efectivos y bloqueo de publicación hasta cursos y seguridad completos. Esta auditoría **no es un pentest exhaustivo**, ni certificación de seguridad de la app.

**Estado de entrega de este documento:** la verificación de CI se actualizará en el checkpoint único después de observar el HEAD final. La auditoría no demuestra ninguna remediación de los cinco GHSA de dependencias; documenta su origen, alcance probable, opciones y el refuerzo verificable del gate PR.
