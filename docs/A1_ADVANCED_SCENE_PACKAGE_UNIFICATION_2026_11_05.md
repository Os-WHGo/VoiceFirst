# VoiceFirst | B0 unificación editorial A1 y C1–C2 | 05-11-2026

## Resultado técnico

Este bloque reúne **tres guiones A1 nuevos** (inglés canadiense, francés canadiense y español) con las **12 escenas C1/C2 de seis turnos** desarrolladas anteriormente. Reutiliza los **nueve escenarios A2/B1/B2** existentes, sin reescribir ni duplicar sus turnos iniciales ni los borradores históricos de Claude/Codex.

Todas esas escenas pasan por el **mismo contrato de validación editorial LessonPackage v1** y mantienen `draft`, `audio-missing`, `asr-unvalidated`. Cada nueva escena A1 incluye dos turnos canónicos existentes y cuatro añadidos, tres preguntas con una cita literal que respalda la respuesta y una interpretación deliberadamente no respaldada, una tarea oral ficticia y alternativa escrita sin micrófono. Las 12 escenas avanzadas C1/C2 se agregan como **situaciones independientes** del mismo tema a las unidades correspondientes: no sustituyen los dos turnos originales del nivel C1/C2 ni se hacen pasar por continuaciones del mismo diálogo.

### Contabilidad editorial sin inflar los cursos

| Dimensión | Inventario |
| --- | ---: |
| Idiomas del lanzamiento público prioritario | 3 |
| Niveles oficiales planeados por idioma | 6 (A1–C2) |
| Unidades temáticas originales del inventario | 144 (= 3 × 6 × 8) |
| Unidades con al menos una escena adicional de seis turnos | 24 (3 A1, 9 A2–B2, 12 C1–C2) |
| Intervenciones en estas 24 escenas | 144 *guiones escritos*, no clips |
| Preguntas editoriales fundadas en citas de esas escenas | 72 |
| Espacios de actividad en paquetes provisionales | 1.200 |
| Audio aprobado/instalado por este bloque | 0 |
| Nuevas clases C1/C2 aprobadas, jugables o certificantes | 0 |
| Cursos completos y revisados A1–C2 | 0 |

El inventario de 144 unidades sigue siendo una **plantilla curricular mínima**; la longitud, dificultad progresiva, interacción, mediación, evaluación y cantidad de situaciones deben revisarse por especialistas por cada banda. Un diálogo de seis líneas y tres preguntas no constituye una lección completa. Tampoco se puede comparar un porcentaje de borradores elaborados con un porcentaje real de dominio MCER.

### Integridad y seguridad

- Los paquetes emplean el validador y SHA-256 canónico del núcleo ya existente. Ahora el auditor editorial adicional contrasta **los turnos completos y las evidencias correctas** contra las fuentes autoradas. La prueba adversarial demuestra que editar un turno o intercambiar una clave de respuesta sigue bloqueado **incluso si se recalcula el SHA** del paquete manipulado.
- Las preguntas de comprensión son **de revisión**, no pruebas auditivas reales. El audio sigue sin existir. No se guardan respuestas o transcripciones, no se usa IA generativa, no se abre micrófono, ni se concede progreso o certificación.
- La integración no modifica `lessonsFor`, SQLite, navegación pública, TTS/ASR, audífonos, fondos, dependencias NPM ni workflow nativo.
- Se conservan seis idiomas de infraestructura y 30 combinaciones de base; portugués brasileño, alemán e italiano siguen próximos para lanzamiento oficial. A0 es orientación interna, no un nivel MCER.
- El MCER Companion Volume del Consejo de Europa orienta el diseño por comprensión/recepción, producción, interacción y mediación: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions . Es referencia de método, no un sello de cumplimiento ni permiso para copiar contenidos protegidos.
- Derechos de software, voces, audios, modelos y datasets se comprueban **separadamente**. No se han encargado voces ni contratado servicios. Nada se publica sin revisión.

### Siguiente macrobloque seguro

Priorizar ampliar los contenidos A1–B1 más breves con objetivos, situaciones, variaciones de respuesta, comprensión no obvia, repaso y mediación; construir una cadena editorial de aprobación verificable (autor/revisor/licencia/audio/dispositivo) que no permita autoaprobarse por un hash o un campo JSON; empezar a producir grabaciones **originales**, derechos comprobados, para pilotos autorizados y validar en iPhone/Android físicos durante B1. Mantener las cuatro alertas npm moderadas como bloqueo real; revisar por separado el fallo de `bootstatus` del simulador en la PR Codex #9.

No fusionar main ni crear IPA/APK por bloque. Mantener PR apiladas y el checkpoint único. La política de VoiceFirst sigue: aplicación gratuita, sin suscripciones, publicidad comercial de terceros, paywalls ni venta de datos. El curso obligatorio debe funcionar sin servidor/cuenta/IA generativa cuando los recursos locales necesarios estén disponibles.
