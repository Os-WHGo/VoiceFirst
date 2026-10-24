# VoiceFirst · Protocolo de prueba A0 en dispositivos (candidato)

Este documento prepara la validación física sin afirmar que existe una beta instalada. La fuente es `mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json`, 36 actividades candidatas, no publicables y pendientes de revisión humana.

## Antes de probar

- Verificar CI de la rama `codex/voicefirst-initial-source`: `npm run check`, `npm run check:mobile`, `npm run check:expo-config` y `npm run check:android-prebuild` (estos últimos no generan APK).
- Revisar `mobile/eas.json`: perfil `android-apk` para APK interno y `ios-simulator` para simulador; ninguno demuestra disponibilidad de firma iOS física.
- No utilizar Expo Go para validar el reconocimiento de voz nativo. Requiere development build compatible.
- No iniciar EAS Build de pago, distribución externa ni cambios de credenciales sin autorización y revisión de cuotas/costes.
- Guardar modelo de dispositivo, versión OS, fecha, SHA de commit, variante de build, logs de errores y resultado de cada caso, sin grabar voces ni datos personales.

## Matriz mínima de pruebas

| Caso | Procedimiento | Resultado esperado |
| --- | --- | --- |
| A0-01 | Abrir A0 en cada uno de los seis idiomas | Aparecen seis lecciones candidatas en el idioma objetivo, con etiqueta de revisión |
| A0-02 | Cambiar idioma de ayuda entre los otros cinco idiomas | Contexto y pregunta cambian sin perder el objetivo ni la clave de respuesta |
| A0-03 | Responder incorrectamente la primera actividad | Registra intento, permite reintento y no desbloquea la segunda |
| A0-04 | Responder correctamente la primera actividad | Guarda progreso y habilita la segunda |
| A0-05 | Cerrar totalmente y volver a abrir la aplicación | Recupera el progreso de SQLite y no repite una respuesta completada |
| A0-06 | Cambiar idioma objetivo y volver | El progreso permanece separado por idioma |
| A0-07 | Completar las seis actividades | Finaliza la secuencia sin saltos ni duplicados |
| A0-08 | Denegar micrófono y usar A0 textual | A0 sigue funcionando sin conexión ni permiso de micrófono |
| A0-09 | Activar modo avión antes de iniciar y repetir A0-03 a A0-05 | No depende de un proveedor externo |
| A0-10 | Interrumpir la aplicación durante guardado | No confirma respuestas no persistidas; revisar sin destruir historial |
| A0-11 | VoiceOver/TalkBack, texto grande y contraste | Controles accesibles y estado de respuestas anunciado |
| A0-12 | Probar en Android y en iPhone/iPad compatibles | Registrar diferencias de comportamiento, no extrapolar entre plataformas |

## Criterios para continuar a beta interna

CI verde, APK interno o build equivalente efectivamente generada, instalación y pruebas A0-01 a A0-12 verificadas, sin pérdida de progreso ni bloqueos graves. La revisión editorial por hablantes nativos y la validación de ASR/audio son **independientes** y no se dan por aprobadas por completar estas pruebas. Si falla un caso, registrar evidencia, corregir en la rama autorizada y repetirlo. No fusionar `main` ni publicar tiendas automáticamente.
