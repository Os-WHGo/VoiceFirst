# Motores de voz offline · investigación y prueba de concepto · 23-10-2026

Claude Code, rama `codex/voicefirst-claude-pedagogy`. Complementa `docs/LOCAL_AI_BAKEOFF_AND_DICTIONARY_PLAN.md` y `docs/VOICE_LIBRARY_AND_WIVRA_REUSE.md` (no los sustituye). La integración nativa en Android/iOS corresponde a ChatGPT; aquí hay evidencia, decisiones técnicas y componentes de núcleo.

**Nivel de evidencia:** prueba en CPU de escritorio (4 vCPU, Linux x64, 2 hilos) con voz sintética. **No es una medida en teléfono** ni con voz humana o acentos reales de estudiantes.

## Prueba realizada

`scripts/research/voice-engine-poc.cjs` ejecuta sin red: Piper TTS → remuestreo a 16 kHz → VAD Silero → ASR offline → `evaluateAnswer` de VoiceFirst. Corpus: las respuestas de recuperación autorizadas de las 6 primeras lecciones de cada idioma (36 frases correctas). Como el audio es correcto, **todo resultado distinto de `correct` es un error del reconocedor**, no del estudiante. Runtime: `sherpa-onnx-node` 1.13.8 (Apache-2.0), modelos desde las releases de GitHub de k2-fsa/sherpa-onnx.

| ASR (int8) | Disco | Idiomas | Correctas | Falsos errores | Confirmar | RTF | Pico RAM | Carga |
|---|---|---|---|---|---|---|---|---|
| Whisper tiny | 99 MB | multilingüe | 18–20/36 | 10–14 | 4–7 | 0,12 | ~285 MiB | 0,6 s |
| Whisper base | 153 MB | multilingüe | 21–27/36 | 7–8 | 2–7 | 0,20 | — | — |
| Canary-180M-flash | 198 MB | en, es, de, fr | 23/24 | 1 | 0 | 0,20 | ~436 MiB | 1,4 s |
| Parakeet-TDT-0.6B-v3 | 641 MB | 25 europeos (los 6) | 32/36 | 2 | 2 | 0,14 | ~876 MiB | 3,4 s |
| Canary, ruido 10 dB | | | 19/24 | 3 | 2 | 0,18 | | |
| Parakeet, ruido 10 dB | | | 30/36 | 4 | 2 | 0,15 | | |

Los rangos reflejan la variación entre ejecuciones: la síntesis Piper no es determinista y la muestra es pequeña. TTS Piper: RTF ≈ 0,07.

## Hallazgos que cambian el diseño

1. **El VAD recortaba el final de la frase** («…parada de aut», «…ônib»). Sin VAD la frase llega completa, pero Whisper alucina repeticiones en el silencio final («Where is the bus stop? Where is»). Regla adoptada: recortar con VAD **conservando audio original**: 200 ms antes y 400 ms después del segmento. Rellenar con ceros no sirve.
2. **Respuestas de una palabra** (A0): el VAD con `minSpeechDuration` 0,25 s no las detectaba («Hallo», «Ciao»); con 0,1 s sí. Los modelos sin idioma fijo derivan al inglés en palabras sueltas («Olá» → «Hulk.», «Ciao» → «So.»). Implementado: una discrepancia hablada frente a una respuesta de una o dos palabras pide confirmación y nunca cuenta como error.
3. **Whisper tiny/base no sirve para calificar automáticamente** frases cortas en fr/es/pt/it (entre 7 y 14 de 36 respuestas correctas se habrían calificado como erróneas). Además, Whisper no entrega una confianza calibrada, así que la integración debe pasar `confidence:'unknown'` (lo que hace `classifyVoiceConfidence`), y con eso el evaluador nunca devuelve error.
4. **Compuestos alemanes**: el ASR separa palabras («wieder holen», «Bus halte Stelle»). Implementado: en voz, la unión de palabras no es error del estudiante; al escribir sí se señala.

## Endpointer propio de VoiceFirst con audio real

`voice-pipeline.ts` (`EnergyVad` por estadística de mínimos + `Endpointer` con pre-roll de 200 ms, post-roll de 400 ms, voz mínima de 0,1 s y 1,2 s de silencio para terminar el turno) sustituyó a Silero en la misma prueba (modo `vfend`): **un único enunciado por respuesta en los 36 casos**, en limpio y con ruido de 10 dB.

| Endpointing | ASR | Correctas | Confirmar | Falsos errores |
|---|---|---|---|---|
| Silero + roll | Canary | 23/24 | 0 | 1 |
| **VoiceFirst** | Canary | **24/24** | 0 | **0** |
| Silero + roll | Parakeet | 32/36 | 2 | 2 |
| **VoiceFirst** | Parakeet | **33/36** | 3 | **0** |
| VoiceFirst, ruido 10 dB | Parakeet | 28/36 | 6 | 2 |

El VAD de energía es la alternativa sin dependencias; Silero sigue siendo el candidato para ruido no estacionario (conversaciones de fondo), que esta prueba no cubre.

## Comparación de motores

| Motor | Licencia código | Plataformas / RN | Valoración |
|---|---|---|---|
| **sherpa-onnx** (k2-fsa) | Apache-2.0 | Android, iOS (C/Kotlin/Swift); Node para pruebas; RN comunitario `react-native-sherpa-onnx` 0.4.4 (MIT, un solo mantenedor) | **Seleccionado como runtime candidato**: un solo motor para ASR, TTS, VAD, identificación de idioma y eliminación de ruido; probado aquí. Integración nativa por ChatGPT (módulo Expo propio o paquete comunitario tras auditoría). |
| Canary-180M-flash (NVIDIA) | pesos CC-BY-4.0, según la tarjeta del modelo (verificar) | vía sherpa-onnx | **Candidato** para en/es/de/fr: el mejor equilibrio entre tamaño y precisión en la prueba. Sin pt ni it. |
| Parakeet-TDT-0.6B-v3 (NVIDIA) | pesos CC-BY-4.0, según la tarjeta del modelo (verificar) | vía sherpa-onnx | **Candidato** para pt-BR/it y como modelo único de los 6 idiomas; ~880 MiB de RAM: probablemente solo para gama media/alta; requiere prueba en dispositivo. Sin bloqueo de idioma. |
| whisper.cpp + `whisper.rn` 0.7.4 | MIT | RN (Expo con development build) | **Descartado para calificación** por la precisión en frases cortas (punto 3). Útil para dictado libre con confirmación. |
| Vosk (+ `react-native-vosk` 2.1.7, MIT) | Apache-2.0 | Android, iOS | **No probado**: el host de modelos (alphacephei.com) devuelve 403 desde este entorno. Interesa por la **gramática restringida a las frases esperadas**, que encaja con un curso preparado; prueba pendiente en otro entorno. |
| Moonshine | variable según modelo | vía sherpa-onnx | No probado: los modelos publicados para sherpa son solo de inglés (`moonshine-tiny-en`). |
| WhisperKit | MIT | solo Apple | Descartado como base común (no cubre Android). |
| ASR del sistema (`expo-speech-recognition`, ya integrado) | — | Android/iOS on-device si el SO tiene el modelo | Se mantiene como primera opción sin descarga, con confirmación (sin confianza calibrada en todos los SO). |
| **Silero VAD** (vía sherpa-onnx) | MIT (la biblioteca MU señaló una ambigüedad en el distintivo; revisar el LICENSE del repositorio) | 632 KB | **Seleccionado**: con pre-roll y post-roll (punto 1). |
| TEN VAD | licencia con restricciones adicionales | | Descartado (registro previo en la biblioteca MU). |
| **Piper** (voces vía sherpa-onnx) | piper1-gpl es GPL-3.0; las voces tienen licencia propia; usa datos de **espeak-ng (GPL-3.0)** | | **Candidato para generar audio en compilación**, no para incluirlo en la app: generar los WAV del curso con voces CC0 y distribuirlos con el sistema de paquetes de voz verificados por SHA-256 que ya existe evita distribuir espeak-ng. Voces probadas: de thorsten **CC0**, es davefx **CC0**, pt-BR faber **CC0**, fr siwis **CC-BY 4.0**, en amy e it paola **licencia por verificar**. **No hay voces en-CA ni fr-CA** (solo en_US y fr_FR): hay una brecha regional. |
| Kokoro (multi-lang v1.0 vía sherpa) | pesos Apache-2.0 (verificar) | vía sherpa-onnx | No probado (descarga de ~350 MB pendiente); la documentación de sherpa no lista alemán. |

## Recomendación técnica (decisión final: propietario y ChatGPT)

- **ASR de dos niveles**: (1) el ASR on-device del SO cuando exista, sin descargas, siempre con flujo de confirmación; (2) un paquete opcional descargable de sherpa-onnx: Canary-180M para en/es/de/fr, Parakeet-v3 para pt-BR/it en dispositivos capaces, o un modelo más pequeño por idioma tras las pruebas en dispositivo. Ningún resultado de ASR sin confianza calibrada debe contar como error.
- **VAD** Silero con pre-roll de 200 ms, post-roll de 400 ms y `minSpeechDuration` 0,1 s (implementado como política en el núcleo; ver `voice-pipeline.ts`).
- **TTS**: voces del sistema en tiempo real y audio del curso pregenerado con voces de licencia verificada.
- **Pruebas pendientes**: teléfonos de gama baja, media y alta (RAM, calor, batería, latencia real), voz humana con acentos de estudiantes, Bluetooth y pantalla bloqueada.
