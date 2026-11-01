# VoiceFirst · transferencia Wivra → voz manos libres (evaluación 2026-11-01)

**Alcance:** conservar VoiceFirst como curso de idiomas por voz. No incorporar editor de vídeo, captura de cámara, transmisor LIVE, teleprompter ni SDK Meta por defecto. Fuentes: biblioteca MU, ficha «TRANSFERENCIA DE INVESTIGACIÓN WIVRA → VOICEFIRST» del 01-11-2026; revisión PR Wivra #138 y PR VoiceFirst #1/#2. No se copiaron archivos privados de Wivra.

## Estado comprobado del proyecto

- VoiceFirst React Native/Expo: voz TTS local/OS, ASR de sistema con `requiresOnDeviceRecognition: true`, micrófono en primer plano, turnos explícitos, selector por idioma, control de modelos, progreso offline SQLite, respuestas inciertas con confirmación. **No se han validado micrófonos de Ray-Ban, Display, capturas durante bloqueo de pantalla ni audio de hardware real.**
- `packages/core/src/audio-routing.ts` ya comprobaba route requested versus actual; `native-speech-session-gate.ts` espera evento final `end` y `use-on-device-answer.ts` no tiene acceso a AVAudioSession.currentRoute/AudioManager. No afirmar «micrófono de gafas» por el nombre de un accesorio ni por ASR exitoso.
- PR #1 abierto a main; PR #2 abierto a la rama de desarrollo, cambios pedagógicos ya integrados de manera selectiva y documentada. No fusionar nuevamente sin comparar; no publicar.
- Wivra #138: diseño por capacidades e identificación de registro, dispositivo, flujo, frames reales, audio y display. Su código de vídeo y SDK no es una dependencia de VoiceFirst.
- Configuración Expo existente desactiva playback/recording en background; no prometer pantalla bloqueada con pantalla apagada.

## Comparativa técnica verificada (repositorios oficiales, 2026-11-01)

| Alternativa | Plataformas / licencia de **código** | Valor para VoiceFirst | Decisión |
| --- | --- | --- | --- |
| ASR nativo on-device existente | iOS/Android, API del SO vía expo-speech-recognition (biblioteca MIT; verificar disponibilidad y offline real por idioma/OS) | Menor huella y batería estimada por reutilizar el runtime del SO; coste de API externo ninguno en la ruta local | **Conservar para beta**, opción textual siempre; sin atribuir fuente de micrófono ni acreditar precisión |
| sherpa-onnx v2.0.1 | Android arm64 e iOS arm64; Apache-2.0 [LICENSE](https://github.com/k2-fsa/sherpa-onnx/blob/master/LICENSE), [README](https://github.com/k2-fsa/sherpa-onnx/blob/master/README.md) | ASR/VAD/TTS y modelos ONNX, admite adaptador offline transversal; paquete/modelos y latencia dependen del peso concreto | **Primer candidato de laboratorio** para ASR/TTS opcional, no integrado |
| whisper.cpp v1.9.5 | iOS/Android; MIT [LICENSE](https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE), [README](https://github.com/ggml-org/whisper.cpp/blob/master/README.md) | Multilingüe, buen baseline; tiny de referencia ~75 MiB en disco y ~273 MB de memoria, base ~142 MiB/~388 MB según README, no presupuestar como límites de móvil | **Segundo candidato** de transcripción offline bajo demanda, no integrado |
| Silero VAD v6.2.3 | Runtime ONNX/C++ necesita adaptador nativo móvil; MIT [LICENSE](https://github.com/snakers4/silero-vad/blob/master/LICENSE) | Detectar voz/silencio con una ventana acotada sin transmitir; **no transcribe** ni certifica pronunciación | Investigar con detector de energía actual, no instalar hasta ensayo con ruido, falsas activaciones y consumo |
| Vosk | Android/iOS; Apache-2.0 [LICENSE](https://github.com/alphacep/vosk-api/blob/master/COPYING) | ASR streaming offline y modelos separados, ya contemplado por SpeechStack | Comparador adicional si sherpa y Whisper fallan en latencia/cobertura |
| SenseVoiceSmall | Código MIT [LICENSE](https://github.com/QwenAudio/SenseVoice/blob/main/LICENSE), pesos sujeto a acuerdo FunASR/model card | Pesos oficiales centrados en mandarín, cantonés, inglés, japonés y coreano; no cubren directamente ES/FR objetivo de lanzamiento | **No integrar ahora** |
| MLX Swift 0.33.0 | Apple Silicon iOS/macOS, MIT [LICENSE](https://github.com/ml-explore/mlx-swift/blob/main/LICENSE) | Runtime de modelos iOS, no motor ASR por sí mismo; sin equivalente Android | Laboratorio iOS posterior, no integrar a la beta inicial |
| Moonshine | Repositorio [moonshine-ai/moonshine](https://github.com/moonshine-ai/moonshine), licencia/repos/pesos requieren auditoría de artefactos (GitHub devuelve NOASSERTION) | Posible baja latencia, cobertura ES/FR y tamaños/versiones no certificados aquí | No adoptar antes de revisar licencia/modelos y ensayo |

Las licencias de **pesos, datasets, modelos convertidos y posibles runtimes/transitivos** pueden diferir de la licencia del repositorio. No empaquetar ningún modelo ni aceptar acuerdos en nombre del propietario sin inspección y autorización.

## Meta DAT, gafas y privacidad

- Meta Wearables Device Access Toolkit 1.0: iOS/Android. La [FAQ](https://developers.meta.com/wearables/faq/) describe cámara, audio, micrófono, movimiento y SDK 1.0; el [LICENSE del SDK Android](https://github.com/meta/meta-wearables-dat-android/blob/main/LICENSE) remite a **Meta Wearables Developer Terms + Acceptable Use Policy**, no a MIT/Apache. El soporte concreto de capacidades depende del dispositivo, permisos y SDK; Display y Neural Band requieren evidencia específica independiente de la cámara/micrófono. La capacidad de invocación Hey Meta anunciada en portal no autoriza asumir que la frase o plugin exacto de VoiceFirst está disponible para terceros.
- Audio Bluetooth: en iOS A2DP es **salida** de calidad estéreo, mientras HFP permite **entrada** de micrófono; [Apple allowBluetoothHFP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetoothhfp), [Apple currentRoute / preferredInput](https://developer.apple.com/documentation/avfaudio/avaudiosession/preferredinput?language=objc). SetPreferredInput no es prueba de ruta efectiva. La aplicación aún NO expone observador nativo de currentRoute ni inspección de AudioManager; nunca confundir escucha por gafas con uso del micrófono de gafas.
- Pantalla bloqueada: [Android FGS microphone](https://developer.android.com/develop/background-work/services/fgs/service-types) exige permisos y un servicio iniciado conforme a restricciones while-in-use; [inicio en background](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start) puede bloquearse. En iOS exigir AVAudioSession y modo de fondo apropiados, justificación de App Review, consentimiento y pruebas. En la beta vigente **no se activa captura en segundo plano**.
- Aprendizaje contextual por cámara: solamente futuro opt-in, memoria temporal mínima, sin captar personas/terceros ni conservar medios sin consentimiento. La visión y el Display son opcionales y no gobiernan la sesión de idiomas.
- Batería: **no hay mediciones reales** para Ray-Ban/Android/iPhone. Se priorizan turnos de micrófono cortos frente a escucha continua, VAD opcional con límite, sin nube, apagado al salir de primer plano; probar temperatura/energía antes de prometer duración.

## Macrobloque reversible ejecutado

1. `handsfree-capture-policy.ts`: decisión pura de canStart / canStop separadas. Un cambio de ruta, segundo plano o permiso puede bloquear comienzo **sin quitar la capacidad de detener un turno ya activo**.
2. Modo Bluetooth y candidato wearable requieren ruta actual observada, HFP de entrada, registro real, dispositivo conectado y capacidad reportada. Para atribuir muestras al micrófono de gafas además se exige conteo de muestras >0 y timestamp monotónico fresco (<=4s). La mera marca, LED, modelo o callback ASR no son evidencia.
3. Display se evalúa separadamente mediante capability + frame reconocido, sin afirmar capacidad por nombre de Gen 2/Gen 3/Display ni integrar SDK de Meta.
4. `mobile/use-on-device-answer.ts` expone **audioInputEvidence: 'unverified'**, porque la integración actual no observa la ruta nativa. `mobile/LearningSessionCourse.tsx` advierte en seis idiomas y conserva ASR del sistema y el fallback visual sin bloquearlo ni introducir permisos.
5. Pruebas en `handsfree-capture-policy.test.mjs` cubren permisos, desconexión, HFP frente a salida/no soportada, prueba fresca de muestras, sesión actual/canStop, modelos, Display y timestamps. Adaptadores móviles comprueban que un transcript no demuestra micrófono de gafas. No se añadió ninguna dependencia ni paquete de modelo.

## Matriz de QA requerida antes de afirmar soporte

- **Aparatos**: iPhone y Android físicos, mic integrado, auriculares HFP y Ray-Ban Meta Gen 2 con firmware/OS anotado. Gen 3, Display y futuras versiones solo después de contar con dispositivo/SDK documentados; MockDeviceKit valida lógica pero no audio RF real.
- **Idioma/acento**: 6 idiomas objetivo y 30 pares de ayuda/objetivo; ES Chile, EN CA/US/UK, FR CA/FR, PT-BR; confirmar voz, permisos, modelo instalado, ruta efectiva y no-score ante ASR incierto.
- **Estados**: foreground, permisos denegados/revocados, conexión BT/desconexión/cambio, notificación/llamada, bloqueos, ruta A2DP→HFP, voz TTS durante ASR, WiFi/datos desactivados, pérdida del modelo, reintentos y vuelta de segundo plano.
- **Métricas a obtener**: latencia inicio/fin p50-p95, tiempo real de inferencia, WER por idioma/acento con corpus autorizado, falsas activaciones por silencio/ruido, RAM pico, temperatura, CPU y batería en sesiones de 10/30 minutos. Obtener con Instruments Energy Log y Android Studio/Perfetto; no inventar consumos. Consentimiento, sin guardar audio personal/terceros por defecto.
- **Criterio de adopción**: motor externo solo si en hardware real mejora al OS en idioma/reconocimiento y no empeora materialmente batería/latencia/espacio; licencia y pesos revisados; módulo opcional descargado explícitamente con digest y rollback, nunca dependencia de P0.

**Estado de esta revisión:** comparación de fuentes y política pura con pruebas automatizadas. No se han probado gafas reales, sensores, frames ni audio PCM Meta; no existe captura real en segundo plano, compatibilidad Display ni invocación Hey Meta certificadas. No llamarla función operativa.
