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
