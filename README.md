# VoiceFirst · Bloque técnico 01

**Proyecto nuevo e independiente.** Prototipo de una aplicación *audio-first* para aprender seis idiomas entre sí, construida para usuarios con preferencias de atención configurables. Este paquete no incluye código de WHGo, Wivra ni otros repositorios.

## Incluye
- `packages/core`: motor básico de estado de sesión, comandos ES/EN/FR/PT/DE/IT (parciales), preferencias, misiones originales de muestra A0-C2 y agenda simple de repaso.
- `mobile`: interfaz React Native con Expo SDK 57, visual de órbita sonora, elección de 30 pares de idiomas, siete etiquetas de niveles, ajuste de ritmo, modo de baja estimulación y demostración **real de texto a voz** mediante `expo-speech`.
- `packages/core/test`: pruebas automatizadas del núcleo (no prueban micrófono real).
- `docs/STATUS.md`: distinción entre implementado, pendiente y sin pruebas físicas.

## Ejecutar pruebas del motor

Desde la raíz:

```sh
npm run check
```

Estas pruebas solo requieren Node 22+ y TypeScript 5.8+ (o `npm install` cuando haya conexión). El motor no depende de servicios de IA.

## Ejecutar la app en el teléfono

Con Node 22.13+ e Internet para instalar Expo:

```sh
npm install
npm run build:core
npm start
```

En un teléfono compatible abre Expo Go si Expo SDK 57 está soportado por la versión instalada. Para integrar más adelante un módulo de reconocimiento de voz de bajo nivel y Meta DAT puede ser obligatorio usar una **development build**; no asumir que funcionarán en Expo Go. En iPhone, `expo-speech` puede requerir desactivar modo silencioso para oír el ejemplo.

## Importante
No existe todavía escucha de micrófono, conversación generativa, comandos de voz en ejecución ni sesiones de audio de fondo. La UI indica esas limitaciones explícitamente. El parser de comandos en el núcleo **sí funciona y está probado**, pero aún no está conectado a un motor ASR. La TTS móvil está programada, pero no ha sido ejecutada físicamente por el asistente.

## Arquitectura planeada
`Microphone/ASR -> command router/turn detector -> pedagogical tutor -> TTS/audio routing`, con un servicio de tokens efímeros y controles presupuestarios para proveedores online, además de packs de audio offline. El motor de decisiones y preferencias se mantiene desacoplado del proveedor de voz.

## Fuentes técnicas
- https://docs.expo.dev/versions/v57.0.0/sdk/speech/
- https://docs.expo.dev/versions/v57.0.0/sdk/audio/
- https://developer.apple.com/documentation/avfaudio/avaudiosession
- https://developers.meta.com/wearables/device-access-toolkit/

Documentación del proyecto: https://drive.google.com/drive/folders/13ccLxx3GZHKXBiPu63Jduu5SamonXGzL

## Language expansion (six mutual languages)

Language selection now supports en-CA, fr-CA, es, pt-BR, de, and it, in **30 distinct native→target pairings**, with one original demonstration situation per seven prototype levels per target language (42 total). This **does not** imply finished translations, voice recognition, real-time instruction for each direction, or a validated CEFR A1-C2 curriculum. The native-language value is stored in the in-memory UI only.

## Bloque 03: Proveedor OpenAI + laboratorio de micrófono

Se agregó un gateway solo para desarrollo local (`backend/src/server.mjs`), un preparador de sesiones Realtime con secretos efímeros y un laboratorio de turnos grabados en la interfaz. Las pruebas usan respuestas simuladas: **no** se han validado aún las llamadas reales de API, el micrófono físico, iOS/Android ni el modo manos libres.

Para detalles de seguridad, API y preparación de pruebas, leer `docs/OPENAI_VOICE_ARCHITECTURE.md` y `docs/STATUS.md`. **La API de OpenAI se factura aparte de ChatGPT y jamás se debe poner la clave API en `EXPO_PUBLIC_*` ni en GitHub.**

## Bloque 04: enrutador seguro de traductores
Se incorpora un enrutador `translateWithFallback` (6 idiomas) con privacidad explícita, selección contextual y manejo de cuotas. Por ahora usa adaptadores inyectados/simulados: **DeepL, Google o LibreTranslate todavía no están conectados**. No convierte un servicio de traducción textual en tutor de voz; ver `docs/FREE_PROVIDER_FALLBACK.md`.

### Guided contextual course, no generative dependency (block 07)

- `packages/core/src/guided-dialogues.ts`: six-language authored questions, **multiple valid replies**, confidence-aware transcript validation and interests without sacrificing foundational skills.
- `mobile/GuidedDialoguePractice.tsx`: teacher audio via device TTS and a **typed transcript demo**. This is *not yet offline speech recognition* and does not measure accent or proficiency.
- `packages/core/src/free-resources.ts` and `mobile/FreeResources.tsx`: link-only curated free learning sites in six languages; no scraping/rehosting media. YouTube live search is not integrated.
- `docs/COURSE_DIALOGUES_RESEARCH_2026_10_16.md`: evidence, licensing, pedagogy and remaining milestones.
- Child profiles remain disabled pending legal/guardian/pedagogical review; see Drive documents 13 and 14.


### Bloque 08: progreso y voz local (prototipo)
El módulo de diálogos dispone de un esquema versionado para guardar el turno y los repasos con SQLite local; no se guardan archivos de audio ni transcripciones. Se agregó un adaptador a `expo-speech-recognition` para intentar ASR **únicamente en el dispositivo** y un fallback de texto cuando el modelo de idioma o la extensión nativa no esté disponible. Las clases con micrófono requieren **development build** (no Expo Go), y no se ha validado pantalla bloqueada ni Bluetooth. La disponibilidad de ASR local depende de SO, modelo descargado y locale. La base SQLite de esta fase no cifra los contadores. Revisa `docs/OFFLINE_PROGRESS_AND_SPEECH.md`.

Pruebas: `npm run check` para el núcleo, `npm run check:mobile` para TypeScript móvil cuando las dependencias estén instaladas.

### Bloque 09: currículo y comprobación de respuestas
`OfflineCourse` usa ahora dos evidencias separadas de recuperación y control de aprendizaje para dar por completada una microlección; guarda datos por idioma y reabre lecciones según prerrequisitos y repasos. Las respuestas se introducen por **texto** temporalmente; el camino oral requiere integrar el adaptador nativo con este flujo. Véase `packages/core/src/course-state.ts`.

### Voces del curso sin generación de lecciones en vivo

El bloque 10 introduce `voice-library.ts`, `audio-routing.ts` y `mobile/curated-voice-output.ts`.
Para obtener el guion original de **194** fragmentos de voz (preguntas, respuestas modelo y microlecciones), ejecuta `npm run voices:plan`. Genera `build/voice-cue-plan.json`, no audios. La app lee preguntas y un ejemplo de respuesta con voces disponibles del sistema. No se han instalado motores, packs o grabaciones de terceros; no se garantiza operación offline o con pantalla bloqueada en dispositivos reales.
Consulta [Voces, licencias y reutilización de Wivra](docs/VOICE_LIBRARY_AND_WIVRA_REUSE.md).

### Bloque 11 · Audio pregrabado verificable

Las preguntas del curso pueden reproducirse desde un WAV validado por SHA-256 y derechos de reproducción. Sin un WAV local compatible se recurre a la voz instalada en el dispositivo; el motor VoiceFirst no llama a ninguna API generativa. La producción y revisión de grabaciones está pendiente. Instrucciones: [docs/OFFLINE_VOICE_PACKS_BLOCK11.md](docs/OFFLINE_VOICE_PACKS_BLOCK11.md). Microlecciones aceptan ahora ASR **exclusivamente en el dispositivo** cuando el OS tiene el modelo adecuado; no soportan por ahora escucha continua con pantalla bloqueada.

### Bloque 12: diversidad regional y acceso adulto
- Ejemplos originales comparables de inglés Canadá/EE. UU./Reino Unido y francés Quebec/Francia, con selector de preferencias local y referencias de uso.
- Opciones sin diagnóstico para adultos neurodivergentes y neurotípicos: ritmo de corrección, instrucciones en pasos y baja estimulación. Diseño por edades independiente del nivel.
- **Límites**: el comparador no cambia aún el acento real de los modelos ASR, no hay audios regionales certificados; las preferencias nuevas afectan primero la práctica de diálogos, y menores siguen deshabilitados pendiente de privacidad.
- Documentación: `docs/REGIONAL_VARIANTS_AND_ADULT_ACCESSIBILITY.md`.
