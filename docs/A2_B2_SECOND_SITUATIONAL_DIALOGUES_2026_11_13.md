# VoiceFirst | B0 | Segundo lote situacional A2–B2 | 13 noviembre 2026

## Alcance editorial
Nueve nuevos diálogos autorados para la primera selección de idioma meta en-CA, fr-CA y es. No se reemplazan, fusionan ni reescriben los nueve pilotos A2–B2 anteriores, el núcleo de lecciones, el progreso SQLite ni los ocho borradores temáticos por nivel. Se reutilizan las dos intervenciones originales de cada tema (fuente autoral preexistente) y se añaden **cuatro intervenciones nuevas** por diálogo.

| Nivel | Tema adicional por idioma | Situación funcional |
| --- | --- | --- |
| A2 | `housing-and-services` | Pedir una revisión de mantenimiento, sin inventar una cita confirmada |
| B1 | `handling-unexpected-situations` | Negociar una sala de taller alternativa, separando posibilidades de autorización |
| B2 | `complex-instructions` | Repetir una secuencia de verificación sin perder condiciones de interrupción y aprobación |

Por cada diálogo: seis turnos, tres preguntas de comprensión con fragmentos textuales de las respuestas 2, 4 y 6, distractores explícitamente no respaldados, consigna de seguimiento oral y alternativa escrita sin micrófono. Las acciones son situaciones ficticias: no se piden direcciones reales, teléfonos, documentos, salud privada ni datos de una empresa.

## Integración segura
- Código: `packages/core/src/a2-b2-second-dialogue-pilots.ts`, con tres fuentes separadas `a2-b2-second-pilot-en.ts`, `a2-b2-second-pilot-fr.ts`, `a2-b2-second-pilot-es.ts`. Se exporta por `packages/core/src/index.ts` para uso editorial y auditoría, **no** se registra en `lessonsFor`, `mobile/App.tsx` o progresos de estudiantes.
- `auditExpandedSecondEditorialPilots` comprueba la identidad de nueve escenas, las dos primeras intervenciones originales intactas, seis IDs de audio únicos y fuente conocida, secuencia de interlocutores, 27 claves textuales respaldadas, consigna oral y ruta sin micrófono, y la imposibilidad de marcar un borrador como publicado, grabado, evaluado o certificado.
- `packages/core/test/a2-b2-second-dialogue-pilots.test.mjs` valida estructuras y adversarios: texto original reescrito, respuestas inventadas, turnos/IDs duplicados, URL de audio remota, estados ficticiamente aprobados y huecos de accesibilidad.
- No hay archivos WAV, ASR evaluado, intervención en TTS, modelo de IA, dictados, seguimiento de rendimiento ni revisión pedagógica humana. Las etiquetas `audioStatus:'not-recorded'`, `editorialStatus:'not-human-reviewed'`, `rightsStatus:'pending-editorial-clearance'`, `publicAvailable:false`, `canScore:false` y `canCertify:false` se mantienen expresamente.

## Progreso de contenido, sin inflarlo
Con este lote se llega a **18 diálogos expandidos A2–B2** (9 anteriores + 9 nuevos). Existen además 24 pilotos A1 de seis turnos y los storyboards avanzados C1–C2 ya redactados. Los 144 borradores de unidades (3 idiomas × 6 niveles × 8 temas) siguen siendo candidatos, no cursos aprobados ni grabados. Estos 9 diálogos suman **54 turnos previstos** (18 fuentes existentes conservadas y 36 turnos nuevos) y 27 preguntas de comprensión; no equivalen a 9 unidades completas ni aportan audios licenciados.

## Siguiente puerta de calidad
Revisar los nueve diálogos con personas competentes en inglés canadiense, francés canadiense y español; comprobar naturalidad, secuencia, inclusividad y nivel A2/B1/B2 antes de producir originales. Si se opta por grabar, seguir el control separado de licencias, consentimiento y audio local estricto. No emitir una beta B1 ni publicar sin resolver seguridad NPM, probar dispositivos reales y contar con contenido aprobado suficiente. Este macrobloque no genera APK/IPA, gastos, cambios de `main` ni nuevos servicios externos.
