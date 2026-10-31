# Integración móvil y recuperación · 31 octubre 2026

## Base y conservación

Trabajo en `codex/voicefirst-initial-source`, partiendo de `ffd451c`.
Se contrastaron `main` (`0828660`), pedagogía (`61c088f`) y configuración
Claude (`be38c6f`). Esta última añade configuración y habilidades de Claude,
no funciones de la aplicación; se conserva en su rama sin instalar hooks.
Los 11 commits de pedagogía se incorporaron mediante cherry-pick conservando
autoría. PR #2 queda como procedencia: no volver a aplicar ciegamente el mismo
trabajo. No se fusionó ni modificó main ni se publicó un servicio.

Se consultaron MU V3, Registro de Fuentes Vivas, reglas de VoiceFirst,
checkpoint existente, malla curricular v0.1 y biblioteca MU. El dossier
`VOICEFIRST_DOSSIER_MAESTRO_CODEX_2026-10-30.md` no estaba disponible entre
los archivos adjuntos/locales ni en la búsqueda de Drive. No se declara leído.

## Función conectada

`LearningSessionCourse` sustituye la instancia activa de `OfflineCourse` en
App. El componente anterior queda intacto como referencia de rollback, sin
montarse ni escribir en paralelo. Reutiliza el mismo contenido A0/A1, los
adaptadores de micrófono y reproducción, preferencias, ayuda fonética optativa
y catálogo de voces. No añade un curso duplicado ni una dependencia de IA.

- Planificación con FSRS, elección de clase desbloqueada y revisión voluntaria.
- Comprensión auditiva con opciones barajadas: la pantalla requiere finalización
  real del callback de reproducción antes de habilitar respuestas de elección.
  Esto verifica el flujo, no que el alumno haya oído o comprendido el sonido.
- Evaluación determinista, variantes aceptadas y nombres ficticios/personales
  mediante patrones; la respuesta personal no se persiste.
- ASR nativo siempre enviado como confianza desconocida. Una transcripción
  correcta propone una respuesta autorizada y requiere confirmación. Editar el
  campo cambia la evidencia a escrita; no se presenta como producción oral.
- Captura de comandos separada, en el idioma de ayuda de la sesión. Repetir,
  lento, pista, pausa, reanudar, saltar, terminar y resumen requieren confirmación
  explícita. No se reinterpretan las respuestas del alumno como comandos.
- Instrucciones, textos del motor y controles principales localizados en seis
  idiomas, aún borradores sin revisión lingüística humana.
- Resumen fundamentado y reproducción voluntaria; no certificación MCER,
  puntuación de pronunciación ni inferencia clínica.
- Se detiene audio/micrófono al salir del primer plano. No escucha continua,
  VAD nativo, barge-in acústico ni funcionamiento con pantalla bloqueada validado.

## Persistencia y recuperación

Una sola clave SQLite por idioma objetivo guarda la sesión, el modelo de
habilidades y el progreso del curso. Cada transición usa el updater transaccional
de `expo-sqlite` 57.0.4 y compara exactamente los bytes previos. La revisión
monótona detecta escritores obsoletos. La UI avanza después del guardado.
Finalizar aplica las evidencias una vez y guarda todos los resultados juntos.

Al primer uso se lee el progreso anterior; sus claves, cursor y datos se conservan.
Los resultados históricos no se convierten artificialmente en un modelo FSRS.
Una sesión recuperada vuelve pausada. Un cambio de idioma conocido no sustituye
la sesión pendiente: continúa con su idioma de ayuda guardado. Cambiar de día
actualiza las fechas sin retroceder ante cambios de reloj.

JSON corrupto, catálogo distinto, conflicto de escritura y error de almacenamiento
bloquean la escritura; no hay reset, borrado, reparación ni reintento automático.
El SHA-256 del catálogo y política identifica su versión, **no autentica** al editor.
SQLite sigue sin cifrado: almacena IDs, fechas, contadores y correcciones de autor;
no audio, transcripciones, nombres recibidos ni datos médicos. SQLCipher y gestión
de claves serán necesarios antes de ampliar a información sensible.

## Comparación técnica y licencias

Se reutilizó el núcleo TypeScript sin dependencias y el patrón CAS del instalador
de packs. Alternativas: mantener progreso/cursor/modelo en claves independientes
(descartado por commits parciales); sustituir todo el almacenamiento por otra BD
(no aporta una ventaja demostrada en este bloque); updater SQLite existente
(elegido). Se inspeccionó `expo-sqlite/src/Storage.ts`: el callback de setItem
se ejecuta dentro de `withExclusiveTransactionAsync`. MIT:
https://github.com/expo/expo/blob/main/LICENSE . No se aceptaron nuevos contratos.

El modelo FSRS conserva la política **provisional** de Claude. Sus parámetros
no se presentan como validados con estudiantes. El trabajo previo contra ts-fsrs
es evidencia de equivalencia matemática, no de eficacia educativa ni prueba
física repetida en esta sesión.

## Verificación reproducible

`npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`,
`npm run check:mobile`, `npm run check:expo-config`,
`npm run check:mobile-bundle`, `node scripts/check-ios-introspection.mjs`
y `npm run check:android-prebuild`.

Las pruebas nuevas recorren A0→A1 para los 30 pares, las 14 microlecciones por
cada objetivo (84), restauración, idempotencia, JSON/catálogo alterado, escritura
obsoleta, disco fallido, preservación de claves antiguas y cruce de medianoche.
Se ejecuta el código real de los adaptadores TS/TSX con límites React/SQLite/audio
simulados para comprobar doble pulsación, bloqueo tras fallo y barrera auditiva.
No constituyen ejecución de React Native, SQLite ni micrófono físicos.

Resultado consolidado: **561/561 pruebas**, TypeScript móvil y configuración
Expo aprobados después de `npm ci` con node-forge 1.4.2. Los cuatro casos del
adaptador móvil también pasan por separado. `git diff --check` sin incidencias.
La auditoría npm sigue bloqueada (11 paquetes afectados); véase
[revisión de dependencias](DEPENDENCY_REVIEW_2026_10_31.md).

La exportación Metro genera bundles Hermes para Android e iOS. La introspección
iOS verifica las declaraciones de privacidad; el prebuild Android verifica
applicationId y permiso. Ninguna de estas operaciones produce una beta instalable.
El intento Gradle nativo y los avisos npm se registran por separado con su resultado.

## Alcance pendiente

El recorrido de las muestras existentes funciona en pruebas automatizadas; **no**
está completo el currículo A0/A1 ni A0–C2. Los candidatos A0, la orientación A0,
diálogos, contenidos editoriales, variantes regionales y referencias de exámenes
anteriores permanecen disponibles y no se convierten en material aprobado.
Pendientes: dossier, revisión docente/nativa, autoría curricular por macrobloques,
audio autorizado, importación editorial, SDK/toolchain instalable, firma interna,
pruebas Android/iPhone, accesibilidad real, Bluetooth, interrupciones y offline.

Rollback de la conexión móvil: restaurar el import anterior de `OfflineCourse`
en App; las claves legacy se conservaron. No exportar automáticamente las nuevas
evidencias hacia un esquema viejo ni borrar el checkpoint nuevo.
