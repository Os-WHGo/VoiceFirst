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
