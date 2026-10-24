# Estado técnico · 16 de octubre de 2026, bloque 03

## Desarrollado como código
- [x] Proyecto independiente y UI VoiceFirst con órbita sonora, seis idiomas y 30 pares dirigidos.
- [x] Comandos reconocidos a partir de transcripciones en seis lenguas, máquina de sesión, preferencias cognitivas individuales no clínicas, repaso SRS básico.
- [x] 42 situaciones **originales de muestra** por idioma y nivel etiquetado A0-C2; no currículo completo ni acreditación CEFR.
- [x] Política de tutor contextual OpenAI, que interpreta slang, modismos, tono y contexto, sin inventar audios ni diagnosticar.
- [x] Adaptador de configuración para `gpt-realtime-2.1-mini` y `gpt-realtime-2.1`, que prepara tokens efímeros por backend local. WebRTC en app **pendiente**.
- [x] Gateway exclusivamente local `127.0.0.1` con auth de desarrollo, limitación de requests, transcripción `gpt-transcribe` y respuesta contextual `gpt-6-luna` (Responses API), sin clave API dentro del cliente.
- [x] `VoicePractice`: ruta móvil escrita de grabar, subir a gateway, transcribir, recibir respuesta y hablar con `expo-speech`. Requiere pulsar para grabar y pulsar para enviar. **No comprobado en dispositivo ni con servicios OpenAI reales**.
- [x] Grabación con consentimiento y uso local de almacenamiento temporal, eliminación intentada tras cada turno. No garantizada en fallos físicos; pendiente pruebas de privacidad.
- [x] Plan de traducción visual/audio con lentes aplazado hasta consolidar el tutor. La IA y los modelos de traducción no están limitados a un glosario manual.

## Comprobaciones realizadas
- [x] `npm run check`: TypeScript del paquete core compilado; 34 de 34 pruebas automatizadas superadas (incluidos mocks HTTP del gateway, no llamadas reales a OpenAI).
- [ ] Compilación completa de Expo + RN móvil.
- [ ] Grabaciones reales por iOS/Android, resultado auténtico de API, calidad de audio, cambios de ruta y latencia.
- [ ] Control por comandos con micrófono continuo, VAD real y manos libres sin toques.
- [ ] Uso con pantalla bloqueada, Siri, Bluetooth y audífonos de distintas marcas.
- [ ] Controles de identidad y cuotas de servidor de producción.

## Prioridad siguiente
1. Compilar Expo SDK 57, probar micrófono y TTS en iOS Simulator y dispositivo físico.
2. Implementar conexión WebRTC realtime con gestión real de turnos, interrupciones y sesiones largas; servicio autenticado y presupuestos limitados.
3. Guardar objetivos y progreso cifrados localmente, agregar currículo real evaluado y seis idiomas de enseñanza.
4. Pruebas de accesibilidad y co-diseño neuroinclusivo; instalaciones beta iOS/Android.
5. Solo después: traductor Meta con audio, signos en cámara y compatibilidad de pantalla donde SDK lo permita.

## Dependencias externas
- Se requiere cuenta API con autorización de uso y facturación separada de ChatGPT para hablar realmente con OpenAI. No compartir claves en chat/GitHub.
- GitHub público **todavía no creado/confirmado**. El paquete de código se puede subir cuando exista repositorio independiente.

## Restricción de esta sesión
- El intento de consultar versiones instalables en npm falló por DNS (`EAI_AGAIN` hacia registry.npmjs.org); por ello no se instalaron dependencias Expo ni se compiló el cliente móvil. No inferir que las versiones declaradas funcionan hasta ejecutar `npx expo install --check` en entorno con red y probar en simulador/dispositivo.

## Bloque 04 · Alternativas gratuitas y fallback (2026-10-16)
- [x] Revisadas condiciones oficiales para DeepL API Free, Google Cloud Translation NMT, LibreTranslate y separación ChatGPT/API.
- [x] Creado `translation-router.ts` y seis tests aislados de cascada permitida, privacidad, cuotas y selección contextual.
- [x] `npm run check` terminó con **40/40 tests** de lógica y backend simulado. No hay llamadas reales a proveedores.
- [ ] Adaptadores HTTP con autenticación, auditoría de licencias, cumplimiento de protección de datos y límites transaccionales de facturación.
- [ ] Comparación objetiva de 30 pares y rendimiento real de voz.

## Bloque 05 · Curso preparado primero (2026-10-16)
- [x] Prioridad corregida: no generar clases espontáneamente; curso local estructurado, IA opcional.
- [x] Doce microlecciones ORIGINALES y guiadas (2 x 6 lenguas), 48 pasos, objetivos y ayudas en seis lenguas, y prerrequisitos. Son **ejemplos de estructura**, no un currículo A1-C2 ya completado.
- [x] Evaluador de coincidencia conservador de transcripción y estado para desbloqueos; nunca califica fonética y no penaliza incertidumbre de ASR.
- [x] Módulo visual/auditivo OfflineCourse para escuchar, repetir y pasar por etapas, sin API. No activa reconocimiento ni domina voz sin tocar.
- [x] Compilación TypeScript y `npm run check` con **50/50 pruebas automatizadas** aprobadas (10 nuevas).
- [ ] No se ha compilado cliente Expo ni probado con micrófono y auriculares reales. Las pruebas de pasos son lógicas.
- [ ] Persistencia, motor de voz completamente offline y curso completo de seis idiomas hasta C2 pendientes.

## Bloque 06 · Perfil por edad y certificaciones (2026-10-16)
- [x] Añadido `learning-paths.ts` para mantener independientes los ejes edad orientativa, nivel CEFR por idioma y preferencias individuales de accesibilidad.
- [x] Franja 3–5, 6–9, 10–12, 13–17, 18+ con materiales sugeridos, tiempos y `guardianRequired` conservador. `unrestrictedConversationEnabled` sigue deshabilitado para todos: los perfiles **NO habilitan acceso de menores** ni sustituyen controles legales.
- [x] Nivel máximo C2 aplicable a los seis idiomas y treinta combinaciones sin imponer nivel en función de edad. Estado `curriculumStatus: planned` explícito: la cobertura completa no está creada.
- [x] Catálogo de referencias para IELTS/CELPIP/PTE/TOEFL/Cambridge, DELF/DALF/TEF/TCF, DELE/SIELE, Celpe-Bras/CAPLE, Goethe/TestDaF y CILS/CELI/PLIDA. Sólo rutas informativas de preparación ORIGINAL futura, sin material de terceros ni puntajes/certificados oficiales.
- [x] `npm run check`: 62/62 tests Node y compilación del núcleo TypeScript aprobados, 12 tests añadidos.
- [ ] Pendiente configurar vistas móviles, almacenamiento de perfiles, cumplimiento de privacidad infantil, revisión pedagógica por edades, contenido completo y simulaciones reales de exámenes.
- [ ] TV5MONDE se evaluó como referencia educativa, pero no se incorporaron sus ejercicios, vídeos o grabaciones por derechos de autor.

## Bloque 07 · Diálogos guiados y recursos gratuitos (2026-10-16)
- [x] Revisados los documentos 13 y 14 de Drive antes de programar.
- [x] Decisión: currículo espiral general + enfoque opcional laboral/cotidiano/viajes; no clases generativas ni aprendizaje exclusivamente laboral.
- [x] Motor puro `guided-dialogues.ts`: 18 diálogos de muestra (3 por idioma, 2 preguntas-respuestas por diálogo), soporte de ayuda en los 30 pares, varias respuestas originales válidas; no evaluador semántico abierto ni fonética.
- [x] Interfaz Expo de práctica de preguntas con TTS y respuestas **por texto de prueba**, no reconocimiento de voz. Es un laboratorio de currículo antes de instalar ASR local.
- [x] Catálogo enlazado de recursos externos gratuitos de seis idiomas y buscador local, incluyendo TV5MONDE, Quebec, Cambridge, British Council, Cervantes, Goethe, Rai Scuola y UFC. La app no copia ni descarga videos y no llama API de YouTube.
- [x] Niños: rutas cerradas por defecto hasta consentimiento, seguridad y validación pedagógica. Preferencias neuroinclusivas por necesidad, sin diagnóstico.
- [x] `npm run check`: 75/75 pruebas automatizadas de lógica superadas y paquete TypeScript compilado. CI GitHub pendiente de ejecución sobre commit de este bloque.
- [ ] Sin micrófono offline, manos libres real, bloqueo de pantalla, persistencia local ni lecciones avanzadas verificadas; simulador/dispositivo iOS/Android pendiente.


## Bloque 08 · Progreso local y reconocedor offline de sistema (2026-10-16)
- [x] Motor puro versionado de progreso de diálogos con reanudación de turno, agenda de repasos, protección de estado corrupto y escritura ordenada; pruebas Node.
- [x] Adaptador de persistencia local `expo-sqlite/kv-store` en aplicación móvil, con almacenamiento exclusivamente de IDs y contadores, NO cifrado y SIN audio/transcripción.
- [x] Prototipo de micrófono con `expo-speech-recognition` en dispositivo y `requiresOnDeviceRecognition: true`, sin respaldo a nube, con permiso explícito. Sólo compatible con native development build, modelo instalado y soporte de idioma.
- [x] Configuración de plugins Expo y comprobación de tipos móvil añadidas a CI.
- [ ] No comprobado iPhone/Android físico, ni funcionamiento con pantalla bloqueada o micrófonos Bluetooth, ni uso móvil completo del sistema de almacenamiento.
- [ ] No hay todavía currículo completo C2, procesamiento semántico libre, puntuación de pronunciación, ni acceso infantil autorizado.


## Bloque 09 · Microcurso evaluado y estado recuperable (2026-10-16)
- [x] Motor `course-state.ts` con serialización defensiva, progresión por prerrequisitos, elección de lección siguiente, repaso y prevención de logros falsificados.
- [x] `OfflineCourse.tsx` ahora exige dos pasos verificables (recuperación y checkpoint) antes de completar una microlección y guarda resultados en SQLite por idioma, sin transcripciones ni grabaciones.
- [x] UI muestra bloqueos, progreso, errores de almacenamiento y retoma desde una lección disponible.
- [ ] La interacción de microcurso sigue usando respuesta escrita y ejemplos propios de A0/A1; no puede evaluar respuestas orales, acento ni rango C2 todavía.
- [ ] Hay que probar binarios en iPhone/Android y resolver accesibilidad del modo pantalla bloqueada.

## Bloque 10 · Voces del curso y reutilización arquitectónica de Wivra (2026-10-16)
- [x] Contrato puro de identidad de micrófono y cambio de ruta basado en lecciones de Wivra, **sin copiar su código de captura de video** ni tocar su repositorio. `audio-routing.ts` comprueba input seleccionado vs activo y exige parar si se desconecta. Puentes nativos pendientes.
- [x] `voice-library.ts` prepara cues originales por pregunta, respuesta modelo y frase de microlección, con idioma y huella de contenido. `npm run voices:plan` produce **194 tareas de grabación/síntesis**, sin generar audio ni consumir IA.
- [x] `planVoiceOutput` exige comprobación de archivos locales, formato, identidad de voz, licencia, identificador y estado real de offline. Un inventario de sistema **no certifica offline**.
- [x] `curated-voice-output.ts` permite escuchar pregunta y respuesta modelo a través de voces que ofrece el sistema, cuando estén disponibles. No hace llamadas a nuestra API; NO se garantiza que el TTS del propio sistema no utilice red.
- [x] Ejecutado `npm run check`: **106/106 pruebas Node/TypeScript core aprobadas**.
- [ ] Grabaciones preproducidas reales, hashes de audio verificados y reproducción de packs; todavía no están integrados.
- [ ] Compilación móvil CI tras push y prueba de voces en dispositivos/auriculares con pantalla bloqueada. Revisión legal de las licencias de cada modelo y voz es obligatoria antes de distribuirlos.

## Bloque 11 · Paquetes WAV autorizados y ASR de microlecciones (2026-10-16)
- [x] `voice-packs.ts` valida manifiestos, locales, versiones de texto, rutas seguras, hashes, tamaños y permisos; packs parciales nunca se anuncian como completos.
- [x] CLI `scripts/voice-pack.mjs` prepara guiones por idioma, compila WAV PCM16 solo con autorización explícita, y verifica archivos localmente por SHA-256.
- [x] `mobile/installed-voice-pack.ts` revisa WAV en almacenamiento privado con hash real; `curated-voice-output` reproduce WAV autorizado primero, y si falta recurre a voz nativa sin prometer offline.
- [x] `mobile/use-on-device-answer.ts` agrega el reconocimiento local de respuestas orales a la pantalla de microlecciones, donde antes solo había texto; incertidumbre no puntúa.
- [ ] Audio real autorizado generado: 0/194; falta producción de narraciones y licencias individuales.
- [ ] Instalador/distribuidor en dispositivos, certificación offline de TTS, audio con pantalla bloqueada, pruebas iPhone/Android y aprobación pedagógica.

## Bloque 12: variedades regionales y preferencias adultas (2026-10-16)
- Catálogo original de muestras `en-CA`/`en-US`/`en-GB`, `fr-CA`/`fr-FR` con 3 escenarios y 8 frases, licencias y etiquetas de voz *no verificadas*. Las variantes de otras lenguas siguen planificadas.
- Preferencias para adultos neurodivergentes y neurotípicos sin diagnóstico: instrucciones paso a paso, cuándo mostrar correcciones y estimulación visual. Persistencia local para preferencias; ninguna edad impone techo MCER.
- Perfiles adolescentes y niños **todavía no habilitados**; requieren auditoría específica. Los ajustes regionales solo cambian la comparación y la lectura solicitada en esa pantalla, no el ASR del currículo general.
- `REGIONAL_VARIANTS_AND_ADULT_ACCESSIBILITY.md` reúne bibliografía y límites. Core TypeScript y tests pasaron localmente; revisión móvil CI pendiente al publicar.

## Bloque 13 · Preferencias unificadas, regiones y audio por importación (2026-10-16)

**Código integrado sobre PR #1 (borrador, sin cambiar main):**
- `mobile/use-learning-preferences.ts` centraliza preferencias en SQLite KV para lecciones preparadas, diálogos y laboratorio opcional. Guarda ritmo de voz, presentación, momentos de corrección, visibilidad de transcripción, control de turno y reanudación. No registra diagnósticos, voz ni transcripciones. Lee ajustes existentes de la clave anterior sin reinicializarlos; bloquea la edición si la lectura/estructura no es segura.
- `OfflineCourse.tsx` guarda el cursor de ejercicio por idioma, permite retomar cuando se elige la opción, y deja avanzar explícitamente al aceptar la respuesta. Añadido resumen de correcciones diferidas e instrucciones de un paso o contexto completo. La validación conserva límites de coincidencia textual y no puntúa fonética.
- `GuidedDialoguePractice.tsx` aplica la misma elección de correcciones, subtítulos, control de paso siguiente y reanudación, sin permitir captura en segundo plano.
- `RegionalComparisons.tsx` permite elegir países de comparación, visualizar registro y escoger voz del sistema no verificada; catálogo inicial ampliado de 3 situaciones / 8 frases a **5 situaciones / 13 frases originales**. No presume exclusividad de vocabulario por país.
- `mobile/install-voice-pack.ts` y `VoicePackImporter.tsx` añaden importación por selección de carpeta local de narraciones WAV. Requieren manifiesto válido, derechos, revisión de narración, límites de bytes, comprobación SHA-256 de cada archivo antes y después de copiar, copia temporal y movimiento final; no reemplazan paquetes existentes. SHA-256 acredita integridad respecto del manifiesto pero NO firma ni autoría. Los 194 fragmentos siguen pendientes de producir.

**Verificación externa:** `e40226aaa940b803f96f1ae9c039b6cbffe36ece` pasó `npm run check` (125/125) y `check:mobile` por GitHub Actions: https://github.com/Os-WHGo/VoiceFirst/actions/runs/39003950466 . El importador quedó agregado después, en `b13abad2d80ec58655a229c17c90fc126b1981f5`, y requiere confirmar el resultado de su propia ejecución CI antes de atribuirle compilación móvil aprobada.

**Pendientes críticos:** importar y reproducir narración genuina autorizada en hardware, calidad de acentos y ASR, comprobar permisos del selector de archivos y compatibilidad Android/iOS, probar Bluetooth y modelos locales, construir binarios, validar pantalla bloqueada con restricciones de SO. No se presenta como beta instalada ni currículo completo hasta C2. Menores bloqueados a falta de privacidad/consentimiento/revisión.

## Bloque 14 · Circuito de voz de clases y preparación de binarios nativos (2026-10-16)

**Código, no beta física.**
- `mobile/use-on-device-answer.ts`: un solo propietario de micrófono entre microcurso y diálogos, reconocimiento **solo en dispositivo**, `recordingOptions.persist=false`, cancelación si la app deja el primer plano o se revoca el turno. No se abre el micro si una petición tardía de permisos fue cancelada. Categoría de audio iOS `playAndRecord` con opción Bluetooth convencional; compatibilidad de ruta **no probada** ni selección real del dispositivo certificada.
- `packages/core/src/voice-turn-policy.ts`: evaluación de transcripción según confianza y preferencia `wait-for-me` / `auto-after-silence`. Con confianza desconocida o baja, no se puntúa automáticamente. Comprobación de identidad del ejercicio para descartar resultados de turnos obsoletos.
- `mobile/GuidedDialoguePractice.tsx`: migra desde un segundo controlador de ASR al compartido, conserva control por voz en primer plano y persistencia previa. Preferencias de corrección diferida y verbalización de cierre en el idioma del estudiante.
- `mobile/OfflineCourse.tsx`: reproducción de pregunta → intento de ASR local al terminar audio → texto reconocido → confirmación del estudiante o corrección automática solo si él lo permite → persistencia del resultado. Incluye pausa y reanudación del paso local.
- `mobile/app.json` + `mobile/eas.json`: perfiles de compilación de ensayo Android APK interno e iOS para **simulador**, sin subir a tiendas y sin activar segundo plano. Identificadores técnicos `com.oswhgo.voicefirst`.
- `packages/core/test/voice-flow-integration.test.mjs` y `native-build-config.test.mjs`: casos simulados de reconocimiento incierto, confirmación, varios idiomas, guardado/recuperación y restricciones de builds. `docs/NATIVE_BETA_GATE.md`: protocolo de aceptación física por dispositivos, permisos, offline, interrupciones y accesibilidad.

**Evidencia verificada hasta ahora:** commit `2a4763b442534f5a32220c4abeab8f3f1c0d5b3c`, GitHub Actions https://github.com/Os-WHGo/VoiceFirst/actions/runs/39005406541 , **132/132 pruebas y check:mobile TypeScript SUCCESS**. Ajuste posterior de cierre multilingüe, correcciones al final del ejercicio y permisos de audio Bluetooth publicado en `f9cff878ab318a5b23df3891f97b6a2050eb6365`; confirmar CI específica antes de declararlo aprobado.

**Bloqueadores reales:** todavía no se ha creado ni instalado un APK/IPA; no hay acceso a teléfono/emulador para pruebas físicas, firma iOS para distribución en iPhone, clips narrados originales, ruta de micrófono verificada, escucha con pantalla bloqueada ni currículo general completo C2. Un EAS profile es preparación, no compilación realizada. Las APIs opcionales pagadas permanecen desactivadas para el curso. PR #1 continúa en borrador y `main` intacta.

**Cierre validado del Bloque 14:** corrección JSX en `ad1d8dbf68ec6a7ffc406a8545a305c7c75f6ca6` tras detectar y resolver una regresión de compilación móvil. GitHub Actions https://github.com/Os-WHGo/VoiceFirst/actions/runs/39005579510 terminó **SUCCESS: 132/132 tests de Node y compilación TypeScript móvil aprobada**. No se han creado APK/IPA ni probado hardware, Bluetooth, pantalla bloqueada o modelos de voz reales. No se fusionó el PR #1.

## Bloque 15 · Importación verificable y modelos offline por idioma (2026-10-16)

**Rama** `codex/voicefirst-initial-source` · PR #1 draft, `main` no fusionada. El núcleo no requiere cuentas, descarga ni modelos generativos.

### Trabajo de código verificado
- `packages/core/src/pcm-wav.ts`: validador PCM16 original compartido por importador, lectura móvil y generador. Comprueba RIFF con longitud exacta, estructura y tamaños de chunks, frecuencia permitida, canales mono/estéreo, duración declarada, alineación de frames y una amplitud mínima detectable. No acepta archivos con solo una cabecera RIFF válida ni clips silenciosos como narración terminada.
- `scripts/voice-pack.mjs`: utiliza el mismo validador al preparar, construir y volver a verificar paquetes. El audio se sigue **produciendo externamente con derechos**, no se sintetiza ni se graba por arte de magia.
- `packages/core/src/voice-pack-import-policy.ts`: inspección pura antes de crear carpetas, identidad `voicefirst-<language>-v1`, lista hasta 200 grabaciones, 128 MiB y rutas `clips/NAME.wav` compatibles con el builder. La carpeta importada debe coincidir exactamente con los archivos declarados.
- `mobile/install-voice-pack.ts` y `mobile/installed-voice-pack.ts`: comprobar WAV completo y SHA-256 antes/después de copiar; almacenamiento en etapas sin reemplazar; auditar cada clip instalado por tamaño, hash, duración y contenido PCM. Los metadatos de licencias son autodeclarados; no existe firma ni autenticación criptográfica del autor.
- `mobile/VoicePackImporter.tsx`: panel explícito para importar, revisar los clips reales instalados por idioma y reproducir una muestra local verificada. No presenta una colección de grabaciones inexistente como instalada.
- `mobile/curated-voice-output.ts` y `mobile/App.tsx`: configurar sesión de audio en primer plano, sin reproducción de fondo; detener reproducción al salir de la aplicación. **No** se han probado rutas Bluetooth, interrupciones reales o compatibilidad del reproductor en teléfonos físicos.
- `packages/core/src/local-model-status.ts` y `mobile/use-on-device-answer.ts`: consultar, cuando Android lo permite, idiomas admitidos e instalados para reconocimiento local. Coincidencia por dialecto exacto; estado desconocido si el sistema no informa. Advertir y bloquear captura cuando la lista muestra explícitamente que falta el modelo; ofrecer solicitud de descarga y nueva revisión. En otros sistemas, `requiresOnDeviceRecognition:true` permanece como salvaguarda.
- `scripts/check-expo-config.mjs` y `.github/workflows/core-check.yml`: la CI verifica también la configuración de Expo resuelta, nombres de paquete Android/iOS y soporte de tablet. Es una comprobación estática sin EAS, SDK físico, firma o tienda.

### Evidencia
Commits de código: `76f289a88b945d68a7450d5e73b03e21db50cccb`, `e1d15d42061d78c1cd4d3dcf91f56238954ff3e3`, `ce617f51e15059bd59fb9f8a8e5d12670e7f832c`, `72eff082bd3137301fa61b9b0e533191f1730d31`, `2b2a81f6862b24776f76a5e273b6123dd3c056b7`.
**GitHub Actions** https://github.com/Os-WHGo/VoiceFirst/actions/runs/39012079574 : **SUCCESS, 142/142 pruebas Node**, `check:mobile` TypeScript PASSED y `check:expo-config` PASSED en el último commit de código `2b2a81f6862b24776f76a5e273b6123dd3c056b7`. Validación de lógica y compilación, no pruebas de instalación.

### Bloqueadores abiertos
No se ha generado ni instalado un IPA/APK; no hay audios originales producidos para el inventario de 194 líneas, revisión auditiva de regionalismos, ni firma criptográfica de editores; no hay pruebas físicas de lector de carpetas iOS/Android, permisos de almacenamiento, Bluetooth/AirPods/lentes, micrófono real, pantalla bloqueada o duración de batería. El sistema TTS puede depender de la plataforma y no está certificado offline. Currículo completo hasta C2 y perfiles de menores siguen pendientes de contenido/revisión y no pueden anunciarse como terminados.

## 2026-10-19 · Presentación de baja estimulación (rama de desarrollo)
- La preferencia `sensoryPresentation=calm` afecta ahora dos pantallas de clases: paleta y espaciado más sobrios; biblioteca de lecciones/repasos y selector de situaciones tras acciones explícitas reversibles. En la vista estándar siguen visibles.
- No se ocultan controles principales del ejercicio, progreso, avisos de micrófono ni acciones para acceder a contenidos. No se infiere diagnóstico.
- Prueba unitaria de la política de visibilidad; pendiente inspección visual y lectores de pantalla en teléfonos Android/iOS reales. No equivale a certificación de accesibilidad.

## 2026-10-19 · Conditional journal writes across runtime instances (A01 follow-up)
- Package sessions now call `PackJournalStore.save(next, expected)`, with null only for initial absence, and the last validated snapshot on retry/verify/commit/abort. Existing journals and manifest payloads retain the same format.
- The mobile store uses `expo-sqlite/kv-store` functional `setItem(key, updater)`, which Expo SDK57 executes in an exclusive SQLite transaction; it aborts writes if the current validated snapshot differs from the expected one, including a competing install, failed retry or commit. No new database or dependencies, no deletion or schema migration.
- Deterministic native-adapter mocks and coordinator tests cover stale abort, competing starts, explicit restart and corrupt journals. A JavaScript gate still guards I/O in the running process; atomicity here applies to the journal key, not the filesystem move, and identical ABA snapshots or different physical app processes remain to be evaluated on hardware.
- Native Android/iOS execution remains mandatory before classifying this as validated recovery.

## 2026-10-19 · Generation-safe journal updates (ABA mitigation)
- Persisted optional pack journals now have a monotonic `revision` counter. New sessions start at 0; each verify/abort/commit/retry increments it and the same-key transactional save requires the next revision. Legacy journals without a counter remain readable and receive revision 1 on their first permitted transition, with no migration or deletion.
- Stale staging snapshots can no longer match a subsequent staging state after an abort and retry with the same manifest. Overflow, invalid revisions and counter rollback fail closed. Deterministic core and mobile CAS tests cover this sequence.
- SQLite KV transaction atomicity does not include filesystem copy/move, so crash/restart, UI integration and physical-device acceptance remain pending. No new dependencies, background entitlement or network endpoint.

## 2026-10-19 · Crash-boundary regressions and reproducible dependency resolution probe
- The small-pack recovery adapter now has deterministic fault injections for a first failed move, failed journal commit after successful promotion, ambiguous directories, missing staging, and installed-state rejection. Tests assert that prior files/journals are preserved and that explicit retries never overwrite successful installs. Simulated modules are not real Android/iOS file handles.
- Added read-only GitHub Actions workflow `dependency-lockfile-review.yml`: on this PR or manual dispatch, Node 22 generates an actual npm workspace lockfile from registry metadata, verifies workspace entries, runs `npm ci --ignore-scripts` and core/mobile checks, and uploads SHA-256 + lockfile as a 7-day review artifact. It neither pushes nor commits automatically; CI and native builds still use existing `npm install` until the authentic artifact is reviewed and committed. Do not claim M09 fully closed yet.

## 2026-10-19 · Npm workspace dependency lockfile promoted after independent CI validation
- GitHub Actions dependency-lockfile review run https://github.com/Os-WHGo/VoiceFirst/actions/runs/39313618874 generated a real npm lockfile v3 from npm registry metadata on Node 22, verified root + both workspaces, passed npm ci --ignore-scripts, core tests, mobile TypeScript and Expo config, and uploaded a checksum/artifact. Local inspection verified 502 package entries; file bytes SHA-256 08ab8fda44878a53e8aa0a1b6aad3753e8f5e4eaad9cea04114370dd9af28097 and Git blob SHA-1 1a0b6c3c04a98cd22261da760b11579537d77736.
- The exact byte-verified package-lock.json is now tracked. Core, Android Debug, Android Offline Candidate and manually dispatched Android Offline Smoke workflows use npm ci --ignore-scripts --no-audit --no-fund, not npm install. The dependency review workflow checks the committed lockfile and fails if npm ci cannot resolve it. No package manifest changes, new npm dependency, push token, native signing or deployment.
- Fresh workflow executions on the new head are required before reporting these updated CI paths as validated. This pins npm dependency versions but not all external Android SDK/Gradle/toolchain versions or native device behavior.

## 2026-10-19 · Fail-closed install retry and byte-backed recovery tests
- A retry of failed optional pack is restricted to the same ID/version/SHA-256/expected byte length. It cannot silently adopt another manifest with the same ID. The coordinator also rejects a journal returned for a different ID.
- New adapter inspection tests transpile the actual `mobile/small-pack-recovery.ts` with simulated Expo files, use the actual core SHA-256 over bytes, and cover valid promotion, corrupted same-size bytes, truncation, 8 MiB limit, double folders, missing files/journal and read failure. Simulator tests are not actual Android/iOS crash acceptance.

## 2026-10-19 · Snapshot-bound verification and promotion (TOCTOU protection)
- Byte hash verification now requires the same journal snapshot after hashing. A concurrent revision, version, size or digest change blocks verification rather than authorizing a different manifest.
- File promotion (initial install, explicit recovery from verified staging, and finalization after a move) commits only against the exact verified journal that the file was checked against. SQLite compare-and-save still guards between final journal read and write.
- Node regression tests simulate journal mutation mid-hash/mid-recovery. There is no claim of atomicity across SQLite plus filesystem or of a physical crash test.

## 2026-10-19 · Offline ASR locale-inventory request ownership
- The on-device recognition hook now discards native locale-inventory responses that arrive after changing language, issuing a newer query, or unmounting. React state identifies the exact locale so an old 'installed' result is never presented as evidence for the newly selected dialect.
- A failed current query becomes 'unknown', never 'missing'. A stale failed query is ignored. Model download statuses also check current language and mounted state before displaying feedback. No network fallback, new dependency, automatic download or microphone permission change.
- Added three deterministic async tests exercising out-of-order locale responses, rejected stale queries and exact regional matches. Native physical Android/iOS validation remains pending.

## 2026-10-19 · Native speech turn ownership and session termination guard
- The microphone owner is now reserved synchronously before the operating-system permission request; a newer request can cancel an older outstanding permission prompt, whose eventual result must never start listening.
- Recognition session gate remains closed across final result, abort or error until the native 'end' event. The module's event stream lacks turn IDs; this avoids assigning a terminal event from an earlier native session to a later exercise. Missing end intentionally fails closed, so test platform behavior on hardware before release. Native start that throws synchronously releases the gate. Stale result listeners also check foreground, mount and selected language.
- No background audio, cloud fallback, new dependency, permission change, automatic model download or Android APK build. Node tests cover the gate contract; device tests remain necessary for real event ordering.

## 2026-10-19 · Learner-readable phonetic aid prototype (not reviewed)
- Implemented a typed, per-phrase, per-target, per-known-language pronunciation-reading catalog in packages/core/src/pronunciation-reading.ts. It contains four **original unreviewed prototype approximations** for existing first micro-lessons, not blanket translations or phonetic scoring. Unsupported or altered phrases return null. Region mismatch is rejected; no IPA or audio is fabricated.
- mobile/OfflineCourse.tsx now offers a voluntary `Cómo leer esta frase` aid during listen/repeat only, never inside recall or checkpoint grading. Clear pending-review and approximation labels; missing coverage is stated instead of inferred. The aid does not modify progress, ASR transcripts, microphone handling or course material and makes no network calls.
- Added four contract/UI-invariant tests in packages/core/test/pronunciation-reading.test.mjs. No new npm dependencies, native binaries, recordings or language products. Human linguistic review and real on-device testing are required before claiming pedagogical accuracy or adding non-Latin/more regional languages.

## 2026-10-19 · Localized readable-phonetic help per known language
- Original `PronunciationReading` pilot now explicitly stores `noteLanguage` and refuses hints if the explanatory note does not match the learner's known language. Corrected the initial English-speaking learner's Spanish `¡Hola!` articulation note to English instead of Spanish.
- The opt-in pronunciation UI includes short author-written help labels, warnings and unavailable-state explanations in all six learner languages (en-CA, fr-CA, es, pt-BR, de, it), keyed by `nativeLanguage`. Existing guide remains only in listen/repeat, never recall/checkpoint; pausing also hides the optional guidance. Added two Node/invariant regressions, no new dependencies, no language packs or progress migrations.
- Labels and readings are draft material requiring linguistic review and on-device accessibility QA; the code is not a verified pronunciation assessment.

## 2026-10-19 · Approximate syllable groups and word emphasis (content pilot)
- Four **unreviewed** native-language reading guide records now have explicit author-supplied `approximateSyllables` and `prominentSyllableIndex`. A fail-closed consistency check rejects mismatched chunks, invalid indices or incorrect known-language metadata before returning a hint. It does **not** verify phonetic correctness, and a null prominence can mark uncertainty in future content.
- In opt-in listen/repeat UI, students can see segmented reading groups, approximate emphasis and existing articulation notes. Labels are original localized drafts for the six known languages. Recall/checkpoint steps stay unchanged; no phonetic score or hidden audio upload.
- Automated syllabification was deliberately not adopted: JS Intl.Segmenter provides grapheme/word/sentence only; Hypher JS BSD-3 hyphenation patterns vary by licence and are not a pronunciation guarantee; ICU transliteration is not a speech transcription. References: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter , https://github.com/bramstein/hypher , https://unicode-org.github.io/icu/userguide/transforms/general/ . No added npm packages or migration. Linguistic review and native accessibility testing remain mandatory.

## 2026-10-19 · Locale-matched reading aid and complete six-target starter pilot
- Added two **unreviewed** A0 examples for Spanish-speaking learners: fr-CA `Bonjour!` (nasal vowel, voiced fricative/uvular R warnings) and German `Hallo!` (aspirated H and uncertain stress marked null). We researched French Quebec and German pronunciation alternatives; these cues are provisional pedagogical respellings, not verified native speakers, transcriptions or audio. Now six pilot examples, one per target language, while 30 known-to-target combinations and 84 lessons remain mostly uncovered.
- Reading selection now requires an exact explicit target locale. The current regional selector reports the selected primary variant to the parent; when en-US/en-GB or fr-FR is selected, an en-CA/fr-CA core reading aid is suppressed. On initial preference load or storage errors, the feature fails closed until the region is known. The selection continues NOT to change course native ASR/TTS or course content; that remains explicitly pending. Spanish general still uses es-ES for core guides; es-CL not yet implemented.
- Added three Node tests, including source-level component wiring invariants and strict locale lookups. No new package, migration, offline model or manual Android build. The UI, core data and docs remain in draft/non-clinical learning scope.


## 2026-10-19 · First real six-language A1 authoring batch
- New `packages/core/src/course-content-a1-drafts.ts`: **12 original editorial unit drafts**, two A1 roadmap topics per each of the six launch languages (`greetings-and-introductions`, `personal-information`). Contains 12 brief dialogs, 12 regional grammar notes, 12 learning outcomes, **72 lesson-activity briefs** (six skill categories per unit), and **48 lexical phrase patterns** mapped to eight stable cross-language semantic concepts. These are original authoring records, not executed lessons, audio clips, professional translations, assessments or signed CEFR outcomes. Beginner-facing prompts must be localized to the learner's known language before release.
- `auditA1EditorialDrafts` verifies identities, stage, six activity categories, dialogue, lexical concept links and pending review/audio/rights. The existing `auditCurriculumProduction` now receives these drafts and reports **12 drafts, 0 documented reviews, 276 missing planned units out of 288 A1–C2**, not a completed A1 level. All 84 existing runnable A0/A1 micro-lessons stay unchanged.
- `portableLexiconDraftsFromA1Authoring` adds 48 records to the editorial queue with exact target language, semantic concept, A1 tag, original phrase and **draft/pending licensing**. They produce **zero** exportable course, subtitle or speech-hint records until independently reviewed and explicitly authorized. The 48 patterns may overlap earlier lexical/course phrases and are not 48 independent dictionary definitions. No First Nations or Chilean Indigenous content added.
- Added `packages/core/test/course-content-a1-drafts.test.mjs` (4 tests) and `packages/core/test/a1-lexicon-bridge.test.mjs` (3 tests) for six target languages, 12 units, 72 activity briefs, lexical rights, audit counts and non-publication. No new dependencies, server, external dictionary import, cloud model, generated speech, store submission or manual GitHub Actions.
- Internal comparison: reuse strict TypeScript authoring + editorial audit + portable lexicon (chosen, minimal/no new packages); auto-generated mass AI lessons without linguistic QA (rejected); immediate learner-facing exposure or implicit C2 accreditation (rejected). Reference descriptions and teaching outcomes will be reviewed against https://www.coe.int/en/web/common-european-framework-reference-languages/reference-level-descriptions and CEFR https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors before pedagogical approval. Next blocks: additional units per level, localized known-language instructions, human/rights QA, reviewed audio and real modular downloads. Public launch still requires six complete validated A1–C2 courses.

## Macrobloque A1 localizado · 2026-10-19
- Se añadieron ayudas editoriales en seis idiomas para 30 combinaciones dirigidas, dos temas A1 y seis habilidades, sin declarar traducciones aprobadas.
- Adaptador `a1-localized-preview.ts`: 60 vistas editoriales derivadas de 12 unidades A1, con diálogo y consignas localizadas. Solo lectura de borradores; NO conecta con tutor en producción.
- Exportaciones públicas en `packages/core/src/index.ts`; pruebas Node para 30 pares y 60 vistas. Nuevos commits: `42bb9ef`, `4135b66`, `1d5d5ee`, `168807b`, `bfb9345`, `38dd526`, `3826c7f`.
- GitHub Actions para `168807b`: Core unit checks y Dependency lockfile review completados con éxito. Para `3826c7f`, al registrar esto, Core unit checks en cola y Dependency lockfile review en curso; no afirmar resultado final.
- Pendientes: validación CI del último commit, revisión humana de contenido, audio y derechos, pruebas físicas, exposición UI restringida a herramientas editoriales, y completar 276 unidades curriculares aún no redactadas.
- Investigación tecnológica: biblioteca MU consultada; para este adaptador puro se priorizó reutilizar TypeScript y el contrato editorial existentes sin introducir dependencias ni modelos nuevos.
