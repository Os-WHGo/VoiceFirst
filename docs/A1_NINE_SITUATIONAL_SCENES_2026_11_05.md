# VoiceFirst | B0: nueve prácticas A1 situacionales originales | 05-11-2026

## Alcance real

Este macrobloque amplía nueve unidades temáticas A1, distribuidas entre **en-CA, fr-CA y es**, sin modificar sus dos turnos originales. Los temas son **información personal general**, **alimentos y compras ficticias** y **lugares e indicaciones**. Cada uno incorpora cuatro turnos nuevos, tres preguntas de comprensión basadas en expresiones literales de la respuesta indicada, una propuesta de diálogo oral, alternativa escrita sin micrófono y tarea de **mediación editorial** para explicar a una persona ficticia el significado de un intercambio. Todas las frases se redactaron para VoiceFirst y requieren revisión profesional de lenguaje, variantes regionales y adecuación pedagógica.

El lenguaje es sencillo y situacional. Las escenas no solicitan direcciones privadas, ni pagos reales, ni ubicación en tiempo real. En el ejemplo de precios, los importes son inventados, no datos comerciales actuales. Las indicaciones se refieren a lugares ficticios, no son instrucciones de navegación del usuario.

Las escenas se ensamblan desde los contratos A1 existentes y se validan en `a1-situational-pilots.ts`, con nueve combinaciones dirigidas de unidad e idioma; `a1-situations-{en,fr,es}.ts` contiene el material autorado. Se integran al `LessonPackage` actual, no a un segundo motor. Se añaden cuatro turnos de escucha *escrita* y tres preguntas de reconocimiento por unidad, además de la propuesta oral/escrita documentada. La mediación todavía es una consigna editorial, **no un ejercicio automáticamente calificado**.

## Inventario después del macrobloque

| Elemento | Inventario editorial |
| --- | ---: |
| Idiomas prioritarios de lanzamiento | 3 |
| Niveles previstos | A1, A2, B1, B2, C1, C2 |
| Unidades temáticas candidatas | 144 |
| Unidades con escena ampliada a seis turnos | 33 (12 A1 + 9 A2–B2 + 12 C1–C2) |
| Unidades todavía sin escena ampliada | 111 |
| Turnos redactados en las 33 escenas | 198 |
| Preguntas editoriales de evidencia literal | 99 |
| Actividades provisionales en los tres paquetes | 1.263 |
| Nuevas grabaciones originales aprobadas | 0 |
| Nuevas lecciones públicas, evaluaciones CEFR o certificaciones | 0 |

**Limitación principal:** el inventario de 144 unidades temáticas no equivale a un curso A1–C2 completo. Los guiones de seis turnos son material de partida: faltan conversaciones auténticas extensas, variedad de respuestas aceptables, actividades de comprensión auditiva verdadera, revisión profesional, repaso, mediación significativa, grabaciones, licencias y validación física de iPhone y Android.

## Barreras y pruebas

- Se rechazan escenas con turnos originales alterados, duplicados, rutas de audio falsas, evidencia literal ausente, flags de publicación/puntuación inventados o alternativas sin micrófono incompletas.
- El auditor de paquetes cruza diálogos y claves de respuesta con sus fuentes autoradas **aunque se recalcule el SHA-256**. El validador de paquetes existente sigue siendo obligatorio.
- Las 54 referencias de audio de las nuevas nueve escenas son **identificadores planificados**, no ficheros WAV existentes, autorizados o validados.
- Se conservan las 84 microlecciones funcionales históricas A0/A1 en seis idiomas; A0 es solamente una etiqueta interna, no una banda MCER oficial.
- `lessonsFor`, SQLite, ASR/TTS, permisos de micrófono, navegación pública y dependencias NPM permanecen sin modificar.
- Compilar Expo o aprobar pruebas de núcleo no prueba pronunciación ni audio offline real en dispositivos. No se generan IPA/APK en este macrobloque.
- La auditoría NPM heredada sigue bloqueando publicación mientras tenga avisos. La investigación de arranque del simulador en PR #9 de Codex sigue separada.

## Siguiente macrobloque

Ampliar tres temas A1 restantes por idioma (números/horas, rutinas y solicitudes de ayuda, por ejemplo), mejorar la diversidad de interacciones y respuestas correctas y documentar revisión pedagógica humana con procedencia. Luego escoger un piloto de audio original, asegurar derechos de voz independientes y verificarlo con las rutas ya integradas y hardware autorizado B1. Mantener primero la calidad funcional y pedagógica y no automatizar la aprobación por etiqueta o por hash.

**Política vigente:** aplicación gratuita, sin suscripciones, anuncios comerciales de terceros, paywall ni venta de datos; el curso obligatorio funcionará sin IA generativa, cuenta ni servidor cuando existan recursos locales. Sin fusión de `main`, publicación ni gastos sin autorización.
