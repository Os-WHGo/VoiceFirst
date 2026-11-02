# VoiceFirst, bloque 08: continuidad de clases y reconocimiento en dispositivo

## Implementado en la rama de desarrollo

- `packages/core/src/learning-progress.ts` contiene progreso de diálogos con un esquema versionado, prueba de integridad al cargar, revisión cada 1/3/7/14/30/60 días, priorización de repasos vencidos, reanudación del turno exacto y grabaciones no almacenadas. Un diálogo completado es **práctica**, nunca una calificación MCER.
- `mobile/progress-storage.ts` utiliza `expo-sqlite/kv-store`, compatible con Expo SDK 57 (versión recomendada `~57.0.4`). Guarda idioma meta, identificadores de ejercicios, contadores y días, **no** transcripciones, audio, diagnósticos ni fecha de nacimiento. SQLite por defecto **no está cifrada**. El flujo se bloquea ante datos incompatibles en vez de borrarlos silenciosamente.
- `mobile/GuidedDialoguePractice.tsx` usa un adaptador de `expo-speech-recognition` (MIT) que exige reconocimiento **en el dispositivo** (`requiresOnDeviceRecognition: true`), verifica disponibilidad y requiere consentimiento del micrófono. No habilita el proveedor de red si falla; el estudiante puede usar respuestas escritas. La voz se reproduce por `expo-speech`; en primer plano es posible iniciar una pregunta y escuchar una respuesta al terminar la lectura. El modo encadenado aún necesita pruebas con hardware y casos de ASR sin confianza cuantificada.
- `mobile/app.json` declara el permiso de reconocimiento y micrófono, pero el plugin **requiere development build**, no es compatible con Expo Go sin módulo nativo. El mismo modelo de voz puede no estar instalado para todos los seis idiomas o variantes en el sistema operativo. En Android se expone la descarga voluntaria del modelo local.
- `AppState` detiene la captura al salir de primer plano. **NO** afirmamos que funcione con pantalla bloqueada todavía, ni que el micrófono Bluetooth se enrute de una forma concreta. Habilitar audio en segundo plano requerirá permiso explícito, revisión de políticas iOS/Android, foreground service Android y pruebas reales, no solo un cambio de permisos.
- Las respuestas del tutor son HUMANAMENTE AUTORADAS y la verificación acepta únicamente respuestas redactadas. Un ASR seguro no es una medición fiable de pronunciación. Una respuesta diferente pero válida puede no ser reconocida; no se obliga al estudiante a aceptar una corrección de IA.

## Fuentes técnicas

- Expo SQLite SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/
- expo-speech-recognition: https://github.com/jamsch/expo-speech-recognition (MIT, revisar compatibilidad con Expo SDK 57 y versiones)
- Expo Audio SDK 57, reproducción/grabación en segundo plano y limitaciones: https://docs.expo.dev/versions/v57.0.0/sdk/audio/

## Verificación y límites

- `npm run check`: TypeScript del núcleo + pruebas Node automatizadas; nuevos tests de serialización, reanudación, integración de repaso y controles de datos dañados.
- `npm run check:mobile`: tipado de la interfaz y del plugin para comprobar mediante GitHub Actions. La instalación local de npm y el binario iOS/Android aún no están validados por un dispositivo físico.
- No se ha habilitado un servicio dirigido a niños; edad y condiciones de privacidad siguen en investigación/documentación.
- Sin API externa de texto, transcripción o IA para este modo básico de diálogo. Para preparar un lanzamiento real faltan empaquetar contenido, atención a errores por dispositivo, cifrado si se incluyen datos sensibles, pruebas e instalación beta.
