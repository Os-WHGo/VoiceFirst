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
