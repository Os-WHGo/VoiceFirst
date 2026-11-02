# Bloque 11 | Audio pregrabado verificable y respuestas por voz en microlecciones

## Objetivo y estado comprobable

- El curso sigue siendo **original, estructurado y no generado en vivo**. Existe un inventario de 194 segmentos (preguntas, ejemplos y ejercicios), no 194 grabaciones humanas ni voces aprobadas.
- Ahora hay un **pipeline real de autoría WAV PCM16** sin llamadas externas, con guion y plantilla de derechos, compilación de paquetes parciales y verificación SHA-256 de archivos locales. Los audios reales deben aportarlos narradores autorizados o un sintetizador cuyo modelo y licencia de voces permitan redistribuir cada clip.
- En móvil, `curated-voice-output` primero busca `Documents/voicefirst-voices/<lang>/pack.json` y un WAV registrado; valida ID, idioma, versión del contenido, licencia, tamaño y **hash SHA-256 de los bytes**. Si el paquete está corrupto, muestra error y no lo reproduce. Si no hay paquete, usa la voz instalada del SO cuando existe; **no podemos garantizar que la voz del sistema funcione sin red** sin pruebas físicas.
- Se añadió captura de respuestas habladas en `OfflineCourse` cuando la API nativa reconoce **estrictamente en el dispositivo**, con permiso explícito, abandono del primer plano deteniendo el micrófono, revisión manual si ASR tiene baja/ninguna confianza y progreso local sin almacenar transcripciones ni grabaciones. No hay conversación con pantalla bloqueada ni auditiva continua todavía.

## Cómo producir audios propios sin pagar una API

Requisitos de autoría: Node 22, grabaciones **WAV PCM16, 16/22.05/24/44.1/48 kHz, mono o estéreo**, cada clip entre 0,15 y 60 s; voces y material con licencias/revisión documentadas.

1. `npm run build:core`
2. `node scripts/voice-pack.mjs plan en-CA ./work/en-CA` produce `script.json` (líneas originales e ID del archivo) y `rights.example.json`.
3. Grabar o sintetizar localmente **cada línea exacta**, solo si los derechos de los modelos y las voces lo permiten; guardar en `work/en-CA/clips/<id-cifrado>.wav`. No inventar consentimientos.
4. Copiar y completar **solo las entradas de los audios realmente existentes** en `work/en-CA/rights.json`: `rightsOwner`, `rightsReference` y `reviewer`. Para terceros, añadir `license: licensed-third-party` y `permissionReference` verificable.
5. `node scripts/voice-pack.mjs build en-CA ./work/en-CA ./build/voice-packs/en-CA`
6. `node scripts/voice-pack.mjs verify ./build/voice-packs/en-CA`

Nunca crear archivos con nombres dinámicos desde datos externos fuera de rutas validadas; no ejecutar modelos de terceros ni copiar contenidos protegidos sin licencia explícita. Un paquete parcial es válido si sus audios están revisados; NO debe marcarse como completo ni se puede decir que el curso entero ya tiene narración.

El lector móvil requiere que los paquetes se instalen en el almacenamiento privado antes de usarlos. **La distribución/importación de paquetes a dispositivos está pendiente**. No descargar packs automáticamente ni crear una API de distribución sin plan de privacidad y presupuesto.

## Calidad y límites

El WAV PCM ocupa bastante; en la siguiente fase compararemos AAC/Opus con evaluación de inteligibilidad y compatibilidad (no asumir que es mejor por ser pequeño). Verificación solo protege integridad y procedencia *declarada*, no constituye una firma digital de confianza contra un atacante que pueda sustituir simultáneamente el archivo y el manifiesto. Para distribución pública deben firmarse paquetes o incluir un hash confiable en la aplicación.

En `use-on-device-answer` el reconocimiento del sistema es una dependencia opcional de iOS/Android que debe probarse en cada región `en-CA`, `fr-CA`, `es-ES`, `pt-BR`, `de-DE`, `it-IT`. No evalúa pronunciación fonética ni acepta todavía cualquier paráfrasis correcta. Si no reconoce offline, sigue disponible la entrada escrita y ninguna llamada oculta a terceros.

## Referencias de plataforma

- Reproductor e interrupción por auriculares Bluetooth: https://docs.expo.dev/versions/v57.0.0/sdk/audio/
- `expo-file-system` almacenamiento privado y operaciones binarias: https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
- Reconocedor nativo opcional: https://github.com/jamsch/expo-speech-recognition
- Código de ruta y dispositivos de **Wivra** como investigación de diseño, no dependencia: https://github.com/Os-WHGo/Wivra/blob/chatgpt/wivra-beta-complete-assembly-20261016/streaming/ios/B0/Sources/WivraAudioRoute.swift

**Pruebas**: Node/TypeScript core, script de audio, hash y UI TypeScript en GitHub Actions. No se ha publicado un APK/IPA ni probado micrófonos, rutas reales, TTS offline, ruido de trabajo ni pantalla apagada.
