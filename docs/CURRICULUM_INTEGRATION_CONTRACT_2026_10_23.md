# VoiceFirst | Contrato de integración curricular y auditoría de Claude | 2026-10-23

**Estado:** especificación de integración; no despliegue ni fusión de ramas.

## Evidencia inspeccionada
- Rama Claude: `codex/voicefirst-claude-pedagogy`; divergencia frente a `codex/voicefirst-initial-source`: 10 commits por delante y 6 por detrás (comparación consultada 2026-10-23).
- `packages/core/src/content-validation.ts` define el contrato `voicefirst.lesson-package`, `schemaVersion:1`, SHA-256 canónico, validación de prerrequisitos, localización en seis idiomas y ruta no oral.
- `packages/core/src/pedagogy-policy.ts` contiene parámetros **provisionales**, no aprobados.
- `docs/VOICE_ENGINE_RESEARCH_2026_10_23.md` documenta pruebas Linux/CPU con voz sintética; no acredita funcionamiento real iOS/Android.

## Integración segura, sin pérdida de datos
1. Preservar los archivos fuente A0-B1 y su `source_payload` sin alteraciones. La normalización es un contenedor de intercambio, no un paquete importable por sí mismo.
2. Crear conversor **explícito** a `voicefirst.lesson-package` v1 por idioma, sin rellenar silenciosamente traducciones ausentes. Si faltan los seis `LocalizedText`, dejar la unidad bloqueada para revisión editorial, no generar una traducción fingida.
3. Asignar identificadores globales únicos a lecciones, objetivos y actividades; convertir `A0.01.en-CA` en identificador compatible; comprobar prerrequisitos dentro del paquete.
4. Cada actividad evaluable requiere respuestas autorizadas, modalidades `speech` y `typed` o `choice`; nunca usar una transcripción ASR de confianza desconocida como error de aprendizaje.
5. Las actividades genéricas de A0-B1 (p. ej. “Identify communicative intent”) **no son ítems completos**: no inventar distractores, claves ni rúbricas. Dejar pendiente su autoría antes de importar.
6. Marcar `editorialStatus:draft`, `audioStatus:audio-missing`, `asrStatus:asr-unvalidated`, `rights.status:original` solo cuando la procedencia se compruebe. Ningún paquete listo para publicación sin revisión lingüística y de audio.
7. Calcular `contentSha256` mediante `lessonPackageDigest` del motor, no con serialización JSON distinta. Ejecutar `validateLessonPackage` y guardar errores y advertencias.
8. Mantener las ramas separadas; integrar mediante revisión de diff y cambios aislados, sin merge a `main`.

## Decisiones pedagógicas
- **No aprobar todavía** umbrales de dominio 0.85/0.70, 2 días, 7 días, tres errores, ni 40 % de repasos: son hipótesis de implementación. Hacen falta pruebas de sensibilidad, equidad y accesibilidad.
- FSRS-6 se puede utilizar para **programar repasos**, nunca como certificación CEFR o evaluación de pronunciación.
- Las variantes regionales válidas deben aceptarse; los distractores ambiguos de despedidas A0 requieren corrección editorial.
- El reconocimiento de voz incierto produce confirmación o vía escrita; no una calificación negativa.
- Preparación de exámenes separada del currículo general, con fuentes oficiales y versiones de formato verificadas.

## Siguientes pruebas obligatorias
- Pruebas de conversión con unidades A0-A1 reales y casos negativos: traducciones faltantes, clave ausente, prerrequisitos inválidos, IDs duplicados, SHA alterado.
- Integración local en rama autorizada, TypeScript y pruebas del núcleo; ninguna afirmación de pruebas móviles sin dispositivo.
- Evaluación con hablantes reales y ruido de fondo antes de escoger modelo offline por defecto.

**Responsabilidad:** ChatGPT define el contenido y las decisiones pedagógicas. Claude mantiene su rama y desarrolla infraestructura técnica. El usuario aprueba cambios protegidos, producción y gastos.
