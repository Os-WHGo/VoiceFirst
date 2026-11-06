# MU | VoiceFirst | A1: ocho situaciones ampliadas por idioma | 05-11-2026

## Entrega verificable

Se ampliaron **los cuatro temas A1 que faltaban** para cada idioma prioritario de lanzamiento (inglés canadiense, francés canadiense y español):

- `numbers-time-and-dates`: confirmar día, hora y sala de una clase ficticia.
- `family-and-people`: presentar con respeto a un familiar ficticio y comunicar una invitación.
- `daily-routines`: seguir el orden y los horarios de desayuno, autobús y comienzo del trabajo.
- `basic-needs-and-help`: pedir ayuda sobre un boleto imaginario y repetir instrucciones más lentamente.

Cada escena conserva sus **dos turnos originales** y añade cuatro nuevos, con tres comprobaciones que deben citar literalmente una intervención concreta. Incluye consigna de intercambio oral, alternativa escrita sin micrófono y tarea editorial de mediación. No se utilizan datos reales de familia, salud, ubicación, compras o calendario del alumno.

Los otros cuatro temas A1 (saludos, datos personales generales, compras, indicaciones) ya estaban ampliados en la cadena anterior. Como resultado, las **ocho unidades temáticas A1 × tres idiomas = 24 unidades mínimas** ahora tienen al menos un guion situacional de seis turnos. Esto **NO demuestra que el curso A1 esté completo**, ni que exista audio de escucha funcional, enseñanza adaptativa o suficiente cantidad de práctica.

## Inventario de producción (no equiparable a graduación CEFR)

| Elemento | Estado |
|---|---:|
| Pares ayuda → objetivo preservados | 30 pares internos (6 idiomas) |
| Idiomas de lanzamiento prioritario | 3 (en-CA, fr-CA, es) |
| Niveles oficiales planificados | A1–C2 |
| Unidades temáticas en borrador para el lanzamiento | 144 |
| Unidades A1 con escena de seis turnos | 24/24 |
| Escenas de seis turnos entre A1–C2 | 45 (24 A1 + 9 A2–B2 + 12 C1/C2) |
| Escenas de las 144 unidades aún sin expansión | 99 |
| Turnos de esas 45 escenas | 270 |
| Comprobaciones editoriales con evidencia textual | 135 |
| Espacios de actividad en paquetes curriculares de borrador | 1.347 |
| Referencias de audio previstas solo para las escenas A1 | 144 |
| Nuevas grabaciones originales con derechos, revisión y hash | **0** |
| Unidades A1–C2 nuevas publicadas o certificadas | **0** |

Las 84 microlecciones A0/A1 funcionales históricas para seis idiomas permanecen en los motores anteriores. A0 es una etiqueta **interna**, no banda MCER. Los tres idiomas restantes siguen «Próximamente» para lanzamiento oficial, sin eliminar su infraestructura.

## Arquitectura y protección

- Se reutilizaron `a1-situational-pilots.ts`, las tres fuentes `a1-situations-en/fr/es.ts`, el auditor `LessonPackage` y el ensamblador `first-release-editorial-packages.ts`. **Sin segundo motor ni reemplazos** de borradores previos de Claude/Codex.
- El auditor conserva exactamente los dos turnos fuente y rechaza cambios de orden, cita sin respaldo, IDs repetidos, falsos estados `audio-verified` o `publicAvailable`, eliminación de alternativa sin micrófono o de consigna de mediación.
- La auditoría global de paquetes rechaza una pregunta o respuesta manipulada **incluso si el SHA-256 del paquete se vuelve a calcular**. La prueba de hash no significa comprobación de licencia, validez pedagógica o pronunciación.
- Los textos de escuchar siguen siendo **guiones y actividades editoriales**; el audio no está grabado. No se alteran `lessonsFor`, sesiones públicas, SQLite, TTS/ASR, permisos, dependencias ni seguimiento de progreso del usuario.
- No hay escucha continua, IA remota obligatoria, captura personal imprevista o comunicaciones de red en el nuevo material.

## Evaluación editorial pendiente

El Marco Común Europeo de Referencia para las Lenguas requiere progresión de comprensión/recepción, producción, interacción y mediación, no simplemente una lista de diálogos y preguntas. El enfoque se apoya en el Companion Volume del Consejo de Europa: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions .

Antes de publicar, cada escena necesita: revisión regional humana (en-CA, fr-CA, es), revisión lingüística y de accesibilidad, varias respuestas aceptables y feedback conservador, actividades genuinamente auditivas, repaso con retención demostrable, grabaciones originales con derechos separados de las licencias de modelos/datasets, validación local de archivos/audio y pruebas físicas iPhone y Android en B1.

## Bloque siguiente

Con los ocho temas A1 inicialmente ampliados, avanzar con profundidad pedagógica y **pilotos A2** en situaciones nuevas, incluyendo cambios de planes, interacción laboral, servicios, comprensión inferencial y mediación, en lugar de aumentar solo el número de casillas. Paralelamente, preparar el proceso de grabación/licencias de un piloto A1 real, sin autorizar servicios facturables ni publicación; mantener el fallo del arranque iOS Simulator en PR #9 y los avisos NPM moderados como bloqueos independientes.

Sin fusionar `main`, generar IPA/APK por bloque, gastar, activar IA remota o publicar contenido no revisado. VoiceFirst permanece gratuita, sin suscripciones, publicidad comercial de terceros, paywall ni venta de datos.
