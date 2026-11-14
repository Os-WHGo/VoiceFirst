# VoiceFirst B0 | Importación A1 original privada para ensayo real | 13 noviembre 2026

## Qué estaba pendiente
La PR #22 crea y valida un paquete A1 editorial de seis grabaciones originales en una carpeta **del computador**, pero la PR #21 busca ese material únicamente en el Documents privado de la aplicación instalada. Faltaba una transferencia manual segura desde Files al contenedor local de VoiceFirst, sin añadir un servidor, dependencia ni ruta pública.

## Implementación
`mobile/install-a1-editorial-audio.ts` añade dos funciones: `selectAndInstallA1EditorialAudio(sceneId)` abre el selector de carpetas nativo `Directory.pickDirectoryAsync()` que ya usaba la importación de narraciones regulares; `installA1EditorialAudioFromFolder(sceneId,source)` realiza la inspección y copia local. Ambas devuelven `rejected` en Release sin acceder al selector ni archivos. La única UI está en `mobile/A1EditorialPractice.tsx` dentro del bloque `__DEV__` ya existente.

**Procedimiento B0 manual con material real que tenga permisos independientes:**
1. En un equipo de desarrollo con el repositorio, compilar core y crear el guion con `node scripts/a1-original-review-pack.mjs plan "en-CA/A1/greetings-and-introductions"`.
2. Grabar **seis WAV PCM16 originales** que respeten el texto de ese guion, con permiso humano verificable y revisión del acento, calidad y claridad por separado. No introducir identificadores personales en textos ni pruebas.
3. Ejecutar `build SCENE FOLDER` y `verify SCENE` del generador existente. Esto crea, bajo `build/a1-review-packages/voicefirst-a1-review/<locale>/a1/<unit>`, una carpeta con `manifest.json` + `turn-1.wav` … `turn-6.wav`.
4. Copiar esa carpeta de ensayo a la app Files del teléfono **manualmente** por un procedimiento local autorizado (no subir grabaciones a GitHub, Drive u otro servidor). No se realiza transferencia automática por esta PR.
5. Abrir una compilación DEV privada de VoiceFirst, ingresar a revisión editorial A1, seleccionar el mismo idioma/tema y tocar **Importar seis grabaciones A1 originales**. Elegir exactamente la carpeta del `unit`, no la carpeta antecesora `voicefirst-a1-review`.
6. VoiceFirst inspecciona el nombre de los siete archivos, la identidad de la escena, los metadatos, los seis WAV reales y sus huellas antes de crear destino. Crea un directorio `.incoming-<unit>` solo si no existe otro. Copia exclusivamente los seis nombres fuente conocidos y el `manifest.json` y **reverifica los siete archivos copiados** (seis SHA/PCM más texto JSON inmutable). Finalmente mueve al destino `Documents/voicefirst-a1-review/<locale>/a1/<unit>` sin sobrescribir. Un resultado defectuoso limpia solo el staging creado en ese intento, conservando fuente y paquetes existentes.
7. La UI realiza auditoría posterior y permite escuchar cada WAV mediante el controlador de PR #21, que revisa de nuevo las seis piezas antes de cada reproducción. Ningún audio se sube, ninguna IA remota se activa, ninguna calificación se concede y ninguna certificación de idioma se reclama.

## Seguridad, límites y QA
El importador NO confía en rutas de un manifiesto, no admite URLs, nombres de clip extra, source IDs ajenos, firma/licencia inventada, audio ausente ni un único clip corrupto. Tampoco actualiza el paquete de narración público `voicefirst-voices`. No borra ni reescribe importaciones existentes. La ausencia de grabaciones reales significa que este macrobloque prueba la mecánica, **no el comportamiento real del audio de una persona**.

Se incluye `packages/core/test/a1-private-folder-import.test.mjs`, que transpila el módulo TypeScript real y lo ejecuta contra un filesystem Expo simulado con:
- éxito seis archivos y relectura a destino; importación repetida rechazada;
- corrupción, faltantes, manifiesto de otra escena y campos forjados;
- alteración durante copia y cleanup limitado al staging;
- importación incompleta previa conservada;
- cancelación del selector y bloqueo Release, además de puerta __DEV__.

Los WAV sintéticos generados dentro del test son exclusivamente vectores efímeros de PCM para QA, **no** material de curso. Tras core, TypeScript y bundle en CI, el siguiente paso será validar en iPhone/Android físicos permisos de Files, copia de directorio, arranque y reproducción en primer plano/mode avión. En caso de fallos iOS/Android, no habilitar un fallback remoto ni mantener temporal sin consentimiento.

No cambian dependencias Expo, modelo de almacenamiento SQLite, protocolos nativos, rama main, licencias, precios ni workflows de instalación. El gate NPM cero sigue pendiente por `minimatch` y prohíbe publicación/fusión hasta resolución autorizada.
