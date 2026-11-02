# Transferencia y guía de voz · 31 octubre 2026

El usuario aportó `VOICEFIRST_TRANSFERENCIA_CODEX_PDF_2026-10-30.zip`.
Se leyeron íntegramente el dossier PDF (diez secciones) y el prompt Markdown.
El PDF se convirtió a Markdown íntegro conservando el original, fuera del
repositorio público. SHA-256 del PDF:
`2d2ff043baac69dc5a43d528236b55806fa0fa8c1750e7b9c7b175bfd49410d3`.
Se usa como transferencia histórica, subordinada a fuentes vivas y código.
La anterior anotación «dossier no accesible» describía la sesión previa a recibirlo.
Los ZIP V1–V8 y materiales curriculares citados no estaban incluidos: no se
importaron ni se declaró que sus pruebas Node acreditasen funcionamiento nativo.

## Guía conectada al recorrido existente

`session-narration.ts` transforma las salidas del motor ya integrado en una cola
de audio: objetivo, consigna en idioma conocido, modelo en idioma objetivo,
opciones, feedback y resumen fundamentado. Reutiliza los IDs de voces existentes
si coinciden idioma y texto. No genera ni traduce lecciones ni modifica las claves
de respuesta. El catálogo/progreso anterior conserva el mismo esquema y hash.

`LearningSessionCourse` ofrece una guía voluntaria, con aviso previo de micrófono
y estado accesible de voz/captura. Después de la narración abre un solo turno:
comando en el idioma conocido para la etapa de escucha; respuesta en el objetivo
para repetir/recuperar. Las elecciones siguen requiriendo acción del alumno.
Una transcripción se envía como incierta aunque el OS informe confianza alta;
se narra la propuesta y se espera confirmación explícita en pantalla. Nunca se
convierte el ASR en una nota de pronunciación ni se confirma automáticamente.

Pausa, detener, cambio de actividad, cierre y salida del primer plano cancelan
la cola y revocan sus callbacks. Una cancelación no espera un onDone nativo que
quizá no llegue; los callbacks tardíos no habilitan comprensión ni micrófono.
Una voz que no termina tiene límite de espera y deja disponible la vía escrita,
sin avanzar ni penalizar. Al volver del fondo la guía no se reactiva sola.

## Comparación técnica

Biblioteca MU y código existentes consultados. Se compararon (1) conservar botones
independientes, (2) encadenar Speech.speak sin propiedad de la secuencia, (3)
reutilizar PlaybackRequestOwnership + playCuratedVoice con una cola cancelable.
Se eligió (3): mantiene audio local verificado y fallback OS, evita una dependencia
nueva y resuelve la secuenciación. No se incorpora otro motor ASR/TTS, VAD ni SDK.

Se inspeccionó expo-speech 57.0.3 `src/Speech.ts`: onDone y onStopped son eventos
distintos; stop no equivale a terminar correctamente una narración. Fuente:
https://docs.expo.dev/versions/v57.0.0/sdk/speech/ . Expo MIT:
https://github.com/expo/expo/blob/main/LICENSE . Las licencias de voces/modelos
no cambian y no se distribuyen grabaciones nuevas.

## Verificación y límites

Pruebas del plan para los 30 pares; orden de callbacks, cancelación, timeout,
errores síncronos/asíncronos y reutilización de cues. Pruebas sobre el TSX real
con límites React/audio/ASR simulados: guía optativa, narración antes de captura,
confirmación de comandos y respuestas, salida a fondo y callback tardío.
El temporizador no limita al alumno, solo un reproductor que dejó de responder.

No son pruebas físicas de micrófono, SQLite, Bluetooth, pantalla bloqueada,
energía, accesibilidad ni calidad lingüística. La voz del sistema no está
certificada offline. No hay barge-in acústico ni manos libres completo: siguen
siendo necesarias confirmaciones y selecciones. Android SDK y Xcode continúan
pendientes; no hay nueva beta instalable ni cambio de permisos o background audio.
