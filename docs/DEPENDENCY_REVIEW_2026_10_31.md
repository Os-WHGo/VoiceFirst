# Dependencias · 31 octubre 2026

`npm audit --json` sobre el lockfile inicial informó 12 paquetes afectados:
4 high, 3 moderate, 5 low. Son paquetes y cadenas, no 12 fallos independientes.
La guardia existente falla por los avisos nuevos de deepmerge y Zod y por low>0.
No se cambia la guardia, no se amplía su allowlist ni se declara el árbol seguro.

Cambio acotado: `npm update node-forge --package-lock-only --ignore-scripts
--no-audit --no-fund` fijó **1.4.0 → 1.4.2**. El diff solo modifica versión,
URL e integrity de ese paquete; ningún manifiesto, rango o dependencia nueva.
El rango de Expo CLI `^1.3.3` admite el parche. Se verificó el LICENSE instalado:
BSD-3-Clause o GPL-2.0, con opción BSD, sin cambiar la política de licencia del
producto. Fuente https://github.com/digitalbazaar/forge/blob/main/LICENSE .

Después de `npm ci`, el audit informa **11 paquetes: 3 high, 3 moderate, 5 low**;
desaparece GHSA-86w9-cpqp-85rv del árbol. Persisten:

| Aviso oficial | Estado verificado | Decisión |
| --- | --- | --- |
| https://github.com/advisories/GHSA-gcqx-w48m-w2h4 | deepmerge 4.3.1, sin first_patched_version; MIT en LICENSE oficial | No inventar parche, no downgrade sin comparación. Necesita arreglo upstream o sustitución compatible de la cadena Expo config. |
| https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | Zod <4.6.6; versión npm vigente 4.6.7; MIT | Expo CLI fija ^3.25.76. No imponer override 4.x ni aceptar downgrade Expo 51 propuesto por npm audit fix. Evaluar actualización compatible del proveedor. |
| https://github.com/advisories/GHSA-w5hq-g745-h8pq | uuid 7.0.3 a través de xcode | Sigue pendiente; no cambio mayor de API en este bloque. |

Fuentes de licencias:
https://github.com/TehShrike/deepmerge/blob/master/license.txt y
https://github.com/colinhacks/zod/blob/main/LICENSE . Los avisos se consultaron
en la API pública de GitHub y las versiones/rangos en npm el 31-10-2026.
El alcance observado de Zod/deepmerge es la cadena de herramientas Expo; eso
no prueba que el binario excluya todos sus usos ni justifica suprimir alertas.

Alternativas comparadas: conservar el árbol (deja un parche disponible sin aplicar),
actualizar solo el parche compatible de node-forge (elegido), migrar Expo/Zod o
forzar overrides mayores (descartado sin pruebas de compatibilidad). No se usó
`npm audit fix --force`, no hubo gastos, producción ni publicación.

La suite funcional y TypeScript pasan con el parche. La auditoría de seguridad
sigue **FAIL**, separada de esos resultados. Repetir CI remoto tras el push;
los resultados locales no sustituyen Actions ni aceptación en dispositivos.

## Actualización MU V4 · 1 noviembre 2026 (CI 2 noviembre UTC)

Evidencia CI en SHA `f4a22d1eaa734581d4183a459ce0663b97386748`:
`https://github.com/Os-WHGo/VoiceFirst/actions/runs/41376407027` — **FAIL**.
La guardia describe 15 **paquetes afectados**, no 15 avisos únicos:
2 high, 11 moderate, 2 low. Fuentes de advisory: `deepmerge`,
`glob`, `minimatch`, `uuid`, `zod`. La regresión frente
al baseline no está aceptada y no se rebajó ninguna severidad ni se
amplió la lista permitida. La compilación anterior/TypeScript y los
bundles Metro verifican propiedades distintas: no cancelan esta deuda.

Investigación upstream al 01-11-2026:
- `glob` GHSA-3g3m-2fjr-6pw4 se corrige en 14.0.2, mientras que
  herramientas Expo aún fijan ^13 en SDK 58 según issue abierto
  https://github.com/expo/expo/issues/52735 (es una incidencia de SDK
  58; extrapolar compatibilidad exacta a SDK 57 sería incorrecto).
- `minimatch` GHSA-g3hv-75wg-m249 exige 11.0.1 y rutas Expo
  incluyen líneas ^10; forzar el salto puede romper consumidores de
  `makeRe`, tal como advierte el mismo issue de Expo.
- `zod` GHSA-mrhx-c7xc-m3w5 exige 4.6.6; NO hay
  parche compatible 3.x. Requiere migración validada del proveedor;
  un override 4.x sin comprobar APIs puede romper CLI/configuración.
- `deepmerge` y `uuid` también siguen observados; no se ha demostrado
  una sustitución transitiva y compatible con Expo 57 ni un parche
  aprobado de la cadena completa.

Opciones examinadas: (A) actualizar parches compatibles aislados
(ya se hizo para node-forge en el bloque previo);
(B) sustituir/probar versiones mayores de Expo y sus dependencias en
rama experimental con lockfile+Metro+TypeScript+prebuild+CI nativa
antes de integrar, sin resultado validado por ahora;
(C) imponer overrides mayores o ejecutar npm audit fix --force para
obtener verde (DESCARTADO: integridad de compilación no demostrada);
(D) conservar bloqueo de auditoría (aplicado, hasta remediación compatible).
No se afirma que la falta de fuentes detectadas en el bundle JS implique
ausencia de riesgo en el conjunto nativo/proceso de build.

**Estado:** auditoría abierta, sin parche nuevo a dependencias en esta
revisión. PR #1 conserva el control rojo intencional; ninguna beta se
considera aprobada por este documento. Próximo ensayo: comprobar rangos
de cada dependencia transitiva de Expo 57 y evaluar una actualización
compatible en rama reversible; documentar resultado positivo y negativo.


## Consolidación de la rama histórica de seguridad · 2 noviembre 2026

Fuente histórica preservada: rama `codex/voicefirst-security-triage-20261030`, cabeza `51379744ff09`. Inspección de contenido, no integración ciega de su historial. En el repositorio activo ya existen `scripts/audit-dependency-parents.mjs`, `scripts/audit-dependency-inventory.mjs` y comprobaciones de regresión; su cobertura reemplaza la necesidad de reimportar otro trazador de padres que solo examina el lockfile. No se borra ninguna rama ni archivo de su origen.

La evidencia histórica identificó la cadena de `zod@3.25.76` desde `@expo/cli@57.0.31` con rango `^3.25.76`. El aviso `GHSA-mrhx-c7xc-m3w5` exigía en ese corte una versión 4.6.6 o posterior, por lo que un override de raíz a Zod 4 vulneraría el rango declarado por Expo y **no se aplicó**. También se identificaron `minimatch@10.2.6` en la cadena de `glob@13` / `@expo/fingerprint`, `deepmerge@4.3.1` en `@expo/config` y `uuid@7.0.3` desde `xcode@3.0.1`. Son versiones/rutas observadas en el análisis histórico: para una remediación nueva deben volverse a comprobar contra el lockfile, versiones upstream y avisos actuales. Fuentes originales: `docs/SECURITY_DEPENDENCY_PARENT_MATRIX_2026_10_30.md` y `docs/SECURITY_UPSTREAM_ADVISORIES_2026_10_30.md` en esa rama. Avisos: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 y https://github.com/advisories/GHSA-g3hv-75wg-m249 .

El CI más reciente a esta fecha informa **15 paquetes afectados** (2 high, 11 moderate, 2 low). La auditoría continúa fallando tanto por nuevas fuentes como por agravamiento respecto a la referencia anterior. No aceptar automáticamente el riesgo, no silenciar avisos, no forzar cambios mayores de Expo/Metro/Zod por un resultado verde superficial. Este bloqueo impide fusionar responsablemente la PR #1 a `main` y distribuir una beta sin revisión de seguridad; sus 918+ commits y las pruebas del núcleo son evidencia diferente. Próximo experimento seguro: comprobar una actualización Expo 57 oficialmente compatible y sus cambios de rangos, regenerar el lockfile en una rama aislada y contrastar el inventario npm, TypeScript, Metro, regresiones y compilación nativa antes de adoptar cambios.

La PR pedagógica histórica #2, todavía DRAFT sobre `codex/voicefirst-initial-source`, también se cotejó contra el árbol activo y no contiene archivos pedagógicos ausentes: sus aportes están preservados en la rama integrada. No se fusionan cambios desactualizados sobre 289 commits posteriores ni se eliminan ramas. Se mantienen el historial y la atribución de las contribuciones, sin reasignar trabajo a Claude/Codex inactivos.
