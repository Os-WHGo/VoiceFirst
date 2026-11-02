# VoiceFirst: voces de cursos sin IA generativa

**Estado (16-10-2026):** módulo implementado y probado para *planificar*, no para grabar ni reproducir packs precalculados. Ningún modelo/peso de terceros está redistribuido en este repositorio. La app usa primero voces instaladas mediante `expo-speech`; las garantías de uso completamente offline requieren ensayos por sistema/voz y paquetes grabados verificados.

## Separación de motores

1. **Currículo escrito**: lección/cuestionario/respuestas alternativas originales en `guided-dialogues.ts` y `course.ts`. No se inventan clases durante el uso.
2. **Voz del profesor**: `voice-library.ts` identifica *todas* las preguntas y respuestas modelo con ID estable, idioma, variante regional y huella de contenido. `npm run voices:plan` crea una cola JSON con 194 clips; no genera audio, no accede a API ni guarda datos personales.
3. **Salida de audio**: en la beta, `mobile/curated-voice-output.ts` busca voces reales del sistema y prioriza variante regional exacta. `Speech.getAvailableVoicesAsync()` NO prueba que una voz sea offline; marcarla como `offlineVerified` exige prueba en el dispositivo. El siguiente paso es distribuir WAV/M4A originales o generados localmente mediante una biblioteca descargable y comprobar su SHA-256 antes de reproducirlos. No se han implementado los reproductores de ese paquete.
4. **Entrada de audio**: en `GuidedDialoguePractice`, la ruta existente de `expo-speech-recognition` requiere procesamiento en el dispositivo, cuando esté disponible. No sustituye evaluación fonética profesional. El software puede quedarse sin ASR en ciertos teléfonos o idiomas.
5. **Gestión de entrada física**: reutilizamos *el principio* de Wivra `streaming/ios/B0/Sources/WivraAudioRoute.swift`: identificar Bluetooth HFP, micrófono interno, cable y USB; comparar selección con ruta realmente activa; interrumpir la grabación al cambiar o perder la fuente. En VoiceFirst se implementó el contrato de dominio `audio-routing.ts` con pruebas; faltan los puentes nativos AVAudioSession/AudioManager. **No se copió la configuración .videoRecording de Wivra**, que no es la adecuada para un tutor de voz. No se modificó Wivra.

## Modelos locales candidatos (no instalados)

- **Voces del sistema iOS/Android**: coste cero por carácter de *nuestra API*, pero las voces no están garantizadas ni offline ni por región. Expo Speech docs: https://docs.expo.dev/versions/v57.0.0/sdk/speech/
- **Pocket TTS (Kyutai)**: seis idiomas del lanzamiento (inglés, francés, español, portugués, alemán e italiano), pequeño motor CPU, candidato prioritario para sintetizar previamente preguntas y respuestas EN UN EQUIPO DE PRODUCCIÓN, no necesariamente para incluir motor Python completo en iPhone. https://github.com/kyutai-labs/pocket-tts ; https://kyutai.org/blog/2026-05-04-pocket-tts-multilingual/ . Revisar licencia de pesos/voz antes de empaquetar; solo voces autorizadas, sin clonación no consentida. Verificar calidad Quebec/Canada/Inglaterra con hablantes.
- **sherpa-onnx**: motor C/Swift/Android para familias de TTS como VITS/Piper y otras, y ASR offline; modelo y dependencia pueden tener licencias propias. https://github.com/k2-fsa/sherpa-onnx/blob/master/sherpa-onnx/c-api/docs/tts.dox
- **Piper**: fuentes y voces en https://github.com/rhasspy/piper; desarrollo actual GPL-3.0 en https://github.com/OHF-Voice/piper1-gpl. Revisar eSpeak NG y licencias de cada voz, no asumir que MIT cubre toda la pila.
- **SupertonicTTS 3**: motor offline multilingüe 31 idiomas a través de sherpa-onnx; auditar licencia y tamaño del modelo individual y compatibilidad iOS antes de prometerlo en la app: https://github.com/k2-fsa/sherpa/blob/master/docs/source/onnx/tts/supertonic.rst

## Pipeline planificado para packs

1. Autoría de lecciones y revisión bilingüe por nivel.
2. `npm run voices:plan`, que genera una lista estable de frases originales y locales, sin producir audio.
3. Grabación humana consentida o síntesis LOCAL controlada. Revisar voz, pronunciación, entonación, regionalismos y modelo utilizado.
4. Transcodificar a formatos compatibles y obtener digest SHA-256 + licencia/permiso de cada clip.
5. Importar pack firmado/versionado y validar ruta local, idioma, checksum, consentimiento/licencia y concordancia exacta del texto **antes** de habilitar su reproducción.
6. Paquete instalable básico con audio pregrabado para lecciones fundamentales; packs extra opcionales descargables sin pago. Evitar redes para hablar después de instalar pack.

## Limitaciones y pendientes

- La estructura `VoiceAsset` describe datos que deberán verificarse en instalación; hoy no existe instalador ni reproductor de packs real. Un manifiesto que declare un hash SHA-256 no significa por sí solo que el archivo exista o haya sido verificado.
- En el prototipo móvil, `curated-voice-output` muestra la primera alternativa de respuesta hablada y usa voces enumeradas del sistema, pero la compilación y los acentos en hardware no están probados.
- Una lección estructurada puede guiar por preguntas y reconocer respuestas prediseñadas sin IA, pero requiere revisión pedagógica y pruebas de ASR. No podemos aceptar cualquier respuesta equivalente usando solo comparación literal.
- Captura audio en segundo plano y pantalla bloqueada es una **fase posterior de validación de sistemas operativos**, no está disponible en esta rama.
