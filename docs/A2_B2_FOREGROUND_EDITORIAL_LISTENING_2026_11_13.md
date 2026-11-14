# VoiceFirst B0 | Ensayo editorial A2–B2 en primer plano | 13 noviembre 2026

## Finalidad y continuidad
Los 9 diálogos situacionales A2–B2 anteriores y los 9 del macrobloque #25 ya cuentan con seis turnos de guion. Este bloque permite a una persona del equipo revisar los **18 diálogos** directamente en una pantalla de desarrollo con la voz del sistema, sin inventar grabaciones, emitir notas ni atribuir validaciones inexistentes.

Se reutiliza `playCuratedVoice` (narración local previamente verificada cuando exista; voz TTS del sistema como alternativa) y `stopCuratedVoice`, junto con el control de primer plano de `AppState`. No se desarrolla un motor paralelo de TTS, ASR, reconocimiento de pronunciación o sesiones ni se modifica la gestión de narraciones de A1.

## Implementación
- `packages/core/src/a2-b2-editorial-voice-rehearsal.ts`: exporta `a2B2EditorialRehearsalScenes` para los 18 guiones y `planA2B2EditorialVoiceRehearsal` para las rutas dirigidas válidas entre los tres idiomas iniciales. Verifica estado editorial inalterado, seis turnos con IDs exactos de autoría y tres preguntas respaldadas por las respuestas 2, 4 y 6. Produce **108 pistas de voz** de prueba identificadas como `a2-b2-editorial-only`.
- Cada `VoiceCue` conserva el texto original y un dialecto objetivo, pero el plan indica literalmente `recordedAudioAvailable:false`, `offlineGuaranteed:false`, `canAssessListening:false`, `canRecordProgress:false`, `publicAvailable:false`, `canScore:false` y `canCertify:false`.
- `mobile/A2B2EditorialPractice.tsx`: opciones de seis escenas por idioma meta (dos por nivel A2/B1/B2), escucha manual de turnos, evidencia consultable bajo demanda, interpretación no respaldada, propuesta oral y alternativa de lectura/escritura sin micrófono. Detiene TTS al seleccionar otra escena, cambiar idiomas/ritmo, perder primer plano y desmontarse. No reproduce automáticamente al abrir ni recoge audio de la persona.
- `mobile/App.tsx`: monta el nuevo componente **únicamente** dentro del panel de revisión ya protegido por `__DEV__`. Un build público no debe mostrar este panel. No altera `LearningSessionCourse`, `lessonsFor`, SQLite, inicio offline ni la UI base de aprendizaje.
- `packages/core/test/a2-b2-editorial-voice-rehearsal.test.mjs`: recorre las 18 escenas, conserva 108 IDs distintos, valida rutas/idiomas y rechaza escenas cruzadas/forjadas; exige barreras anti-publicación, ausencia de puntuación y que una voz del sistema anunciada como instalada **no** demuestre uso offline.

## Límites
El TTS del sistema **no es audio original licenciado**, no garantiza pronunciación ni conectividad offline y puede tener calidad o variantes regionales distintas. Ninguna voz humana ha sido grabada o aprobada en este macrobloque. No incluye seguimiento, planificador de repaso, medición real de comprensión, grabaciones del alumno, permisos de micrófono ni escucha con pantalla bloqueada.

No generar APK/IPA fuera de hito autorizado. No integrar servicios remotos, IA generativa, pagos o base de datos de otros proyectos. El gate de seguridad NPM sigue bloqueado, independiente del número de pruebas core. Una revisión editorial humana y QA física seguirán siendo necesarias antes de ofrecer estas escenas al público.
