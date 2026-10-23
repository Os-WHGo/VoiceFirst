# Motor pedagógico offline · Claude Code · 23-10-2026

Rama `codex/voicefirst-claude-pedagogy`, basada en `codex/voicefirst-initial-source` @ `e9eda01`. Todo el código está en `packages/core` (TypeScript puro, sin dependencias nuevas, sin red, sin IA generativa). No se modificaron archivos reservados a ChatGPT (`mobile/App.tsx`, workflows, `scripts/android-emulator-smoke.sh`, adaptadores nativos de micrófono/ASR/TTS, configuración de compilación).

**Estado: implementado y probado automáticamente (Node).** No se ha probado en dispositivo físico ni con ASR real. La interfaz móvil todavía no usa estos módulos: la integración corresponde a ChatGPT (ver «Puntos de integración»).

## Módulos

| Archivo | Función |
|---|---|
| `answer-evaluation.ts` | Evaluación determinista de respuestas contra respuestas autorizadas, con feedback específico en 6 idiomas. |
| `answer-patterns.ts` | Respuestas con hueco personal `{name}` («Me llamo {name}.»); el contenido capturado nunca se devuelve ni se guarda. |
| `spaced-repetition.ts` | Modelo de memoria FSRS-6 por días naturales; sin dependencias. |
| `skill-mastery.ts` | Modelo del estudiante por objetivo × habilidad, estados de dominio distintos de «lección completada». |
| `learning-session.ts` | Sesión reanudable: plan, adaptación, preferencias de corrección/tiempo/instrucciones, resumen fundamentado. |
| `session-copy.ts` | Textos de la sesión en los seis idiomas conocidos (borradores originales sin revisión nativa). |
| `content-validation.ts` | Formato `voicefirst.lesson-package` v1 y validador estructural con integridad SHA-256. |
| `local-day.ts` | Utilidades de fecha local `YYYY-MM-DD`. |
| `course.ts`, `extended-course.ts` | Cambios compatibles: campos opcionales `acceptedVariants` / `acceptedPatterns` y contenido corregido. |

## Macrobloque C · Evaluación

`evaluateAnswer(key, response, source)` → `outcome` ∈ `correct`, `correct-variant`, `minor-error`, `meaning-error`, `needs-confirmation`, `needs-review`, `no-evidence`, más `findings` con códigos y `pronunciation: 'not-assessed'` siempre.

- **Diferencias inocuas** (aceptadas, con nota informativa): mayúsculas, puntuación, apóstrofos tipográficos, contracciones inglesas (`I'm`/`I am`, `can't`/`cannot`…), `geht's`, formas orales brasileñas (`pra`, `tá`, `tô`, `cê`), omisión de *ne* en francés oral/Québec (`je peux pas`), cifras 0–20 ↔ palabras (por idioma, incluidas formas con género), tildes ausentes al **escribir**, `ae/oe/ue/ss` en alemán, muletillas (`um`, `euh`, `äh`…, solo en voz y por idioma: `um` no se elimina en portugués, donde significa «un»), palabras añadidas que no niegan.
- **Errores de significado**: cualquier negación añadida o eliminada (`I am not allergic…`, `nicht`), sustitución de una palabra de contenido (`cash` por `card`), respuestas no relacionadas.
- **Errores de forma** (solo texto escrito): ortografía con distancia OSA (`crad`→`card` cuenta como una errata), palabra que falta o sobra, orden de palabras, respuesta incompleta.
- **Voz**: las mismas diferencias pequeñas en voz se tratan como posible error del reconocedor → `needs-confirmation` (confirmar, repetir o escribir; nunca cuenta en contra). Una transcripción cortada al final se trata como fallo de detección de fin de turno. Confianza no alta → nunca se califica.
- **Ambigüedad**: la respuesta contiene la frase esperada más una negación (`No, thank you very much.`, `¿No puedo pagar con tarjeta?`) → `needs-review`, no cuenta ni a favor ni en contra.
- **Pronunciación**: no existe motor acústico validado; la capacidad queda **pendiente** y nunca se infiere de texto.

Contenido corregido (defecto real encontrado al cotejar diálogos y microlecciones): las microlecciones rechazaban formas femeninas correctas que los diálogos sí aceptaban. Se añadieron como `acceptedVariants` (no se presentan como modelo): `Soy alérgica…`, `Sou alérgica…`, `Sono allergica…`, `Muito obrigada.`, y variantes regionales `maní`/`cacahuates`. La autopresentación acepta el nombre propio en los seis idiomas mediante `acceptedPatterns`. `checkUtterance` y `recordCourseAttempt` respetan estos campos, de modo que la pantalla actual `OfflineCourse` ya se beneficia sin cambios. Los modelos (`alternatives`, 2 por ejercicio) y el plan de 194 voces no cambian.

## Macrobloque A · Motor de aprendizaje

**Repaso espaciado (FSRS-6).** Fórmulas publicadas por open-spaced-repetition, reimplementadas a granularidad diaria. Validación aislada contra `ts-fsrs` 5.4.2 (MIT) instalado solo en un directorio temporal: **24 000 pasos aleatorios con estabilidad, dificultad, probabilidad de recuerdo e intervalos idénticos bit a bit**; los vectores de referencia quedan fijados en `spaced-repetition.test.mjs`. Los pesos por defecto proceden de repasos de tarjetas, no de práctica oral: el planificador ordena la práctica, no califica.

Asignación de calificaciones: logro independiente o confirmado → Good; tras reintento, pista o modelo → Hard; sin lograrlo tras tres errores → Again; incierto/omitido → sin actualización. *Easy* solo para una futura autodeclaración explícita. Las repeticiones de audio nunca modifican la calificación.

**Habilidades separadas.** La evidencia va a la habilidad realmente usada: recuperación oral → `spoken-production`; turno de diálogo oral → `spoken-interaction`; respuesta escrita → `written-production`; elección → `listening-comprehension`; repetición oral → `pronunciation` **solo como práctica** (estado limitado a `practicing`, `capReason: acoustic-assessment-unavailable`); escuchar sin comprobación → exposición.

**Estados de dominio.** `not-started` → `introduced` → `practicing` → `consolidating` (éxito independiente en ≥2 días distintos) → `secure` (además recuperación espaciada ≥7 días, al menos un éxito verificado no autoconfirmado y probabilidad de recuerdo actual ≥0,85). El olvido o un fallo posterior devuelven a `needs-review`. Completar una lección en un día es `practicing`. `levelEvidence` devuelve `cefrClaim: null` siempre.

**Sesión.** `planLearningSession` → repasos vencidos primero (los más olvidados, máx. 40 %), luego la siguiente lección desbloqueada, luego consolidación. Con estructura flexible, los repasos se intercalan tras las dos primeras actividades nuevas. Adaptación: al segundo error se ofrece el modelo (salvo modos «al final» / «a petición»); al tercero la actividad termina sin penalización verbal y se inserta una vez por objetivo un paso atrás (escuchar/repetir el modelo y reintentar). `courseProgressAfterSession` y `completeSession` aplican el resultado una única vez al modelo del estudiante y al `CourseProgress` existente (los éxitos asistidos se registran como intentos y no desbloquean lecciones).

**Reanudación.** `sessionToJSON` / `sessionFromJSON` con validación estricta; una sesión interrumpida mientras estaba activa vuelve en pausa y al reanudar se emite orientación («Actividad 3 de 4»). Resultados fuera de orden (una sesión antigua finalizada después de otra) se integran en el último día conocido sin retroceder el calendario.

**Resumen.** Construido exclusivamente a partir de los resultados registrados: actividades, objetivos, sin ayuda / con ayuda / por repasar, no contado, próximo repaso, correcciones a petición y la frase «evidencia de práctica, no un nivel de idioma ni una nota de pronunciación».

## Macrobloque D · Neuroinclusión y accesibilidad (sin diagnóstico)

`sessionPreferencesFrom(ExperiencePreferences, LearnerPreferences?)` traduce las preferencias que la app ya guarda:

| Preferencia | Comportamiento |
|---|---|
| Correcciones `after-each-answer` / `after-exercise` / `on-request` / `end-of-session` | inmediatas con detalle · tras la actividad · solo al pedirlas · en el resumen. Mientras tanto, un aviso neutro («Intentémoslo una vez más»). |
| Instrucciones `one-step` / `full-context` | un paso por vez (`continue` revela el siguiente; se puede responder en cualquier paso) · todo junto. |
| `answerControl` | `wait-for-me` sin límite (los `timeout` se ignoran) · `auto-after-silence` con ventana ampliable (`more-time`, hasta +60 s); el tiempo agotado nunca penaliza. |
| Repetir / más lento | sin efecto en la calificación. |
| Saltar | sin penalización (`no-evidence`). |
| Pausa / reanudar / «¿dónde estoy?» | estado conservado, respuestas ignoradas en pausa, orientación al volver. |
| Estructura predecible | orden fijo, objetivo anunciado al inicio y aviso antes de cada cambio de objetivo. |
| Baja estimulación | textos sobrios (sin celebraciones), un solo detalle por corrección. |

## Macrobloque B · Validación de contenido

`validateLessonPackage` comprueba: formato y versión del esquema, `packageId`, versión semántica, idioma objetivo y variante permitida (`en-CA/en-US/en-GB`, `fr-CA/fr-FR`; resto solo su locale base hasta tener contenido regional validado), IDs únicos, banda A0–C2, objetivo con ayuda en los seis idiomas (aviso si ≥3 idiomas comparten texto idéntico), habilidades, prerrequisitos desconocidos o cíclicos, respuestas aceptadas no vacías y sin duplicados, modelo incluido entre las aceptadas, **cada respuesta autorizada aceptada por el evaluador al decirse en voz alta**, patrones `{name}` válidos, opciones de elección, audio local `audio/*.wav|m4a|ogg|opus` con SHA-256, **vía de respuesta no oral obligatoria**, límites de tiempo solo orientativos (≥10 s, aviso <20 s), **ninguna URL de ejecución** (solo atribución en `rights.source`) y digest SHA-256 sobre JSON canónico. `readyForPublication` es siempre `false`; `publicationBlockers` enumera revisión editorial, derechos, audio y ASR pendientes.

`lessonPackageFromCourse` / `lessonPackageFromDialogues` exportan el contenido integrado: **108 lecciones y 384 actividades en seis idiomas validan sin incidencias**, con estados honestos (`draft`, `audio-missing`, `asr-unvalidated`).

## Investigación y alternativas (protocolo MU)

| Necesidad | Opciones evaluadas | Decisión |
|---|---|---|
| Repaso espaciado | (a) mantener `review.ts` SM-2 simplificado (no usado por la app), intervalos fijos 1/3/7/14/30/60 de `learning-progress.ts` y repaso al día siguiente de `course.ts`; (b) dependencia `ts-fsrs` 5.4.2 MIT; (c) `fsrs-rs` (Rust, binario nativo); (d) Leitner | **Reimplementar FSRS-6** (≈60 líneas) y usar `ts-fsrs` como oráculo de pruebas. Motivo: `@voicefirst/core` no tiene dependencias y el lockfile está verificado byte a byte en CI; el oráculo prueba equivalencia exacta. (c) descartado por compilación nativa; (d) inferior en precisión. Los módulos antiguos se conservan por compatibilidad. |
| Comparación difusa | `fastest-levenshtein` (MIT), `string-similarity` (abandonado), modelos de similitud semántica | **Distancia OSA propia** (~10 líneas). Los modelos semánticos no son deterministas, requieren pesos y no distinguen negaciones de forma fiable. |
| Silabeo/pronunciación | — | Sin cambio: no hay motor acústico validado; capacidad pendiente. |

Fuentes: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm · https://github.com/open-spaced-repetition/ts-fsrs (MIT, v5.4.2, consultado 23-10-2026) · https://www.coe.int/en/web/common-european-framework-reference-languages

## Pruebas

`npm run check`: **522/522** (468 previas + 54 nuevas en 6 archivos). `npm run check:mobile`: sin errores. Incluye regresión de los 30 pares dirigidos (sesión completa con textos localizados sin marcadores sin rellenar), autocoherencia de todas las respuestas autorizadas en voz y texto (>1000 comprobaciones), persistencia y restauración con datos manipulados, idempotencia, e integridad de paquetes. Limitación del entorno: las 5 pruebas que transpilan archivos `mobile/` requieren `npm ci` (dependencia `typescript`); sin ello fallan por entorno, no por código.

## Puntos de integración para ChatGPT

1. **Evaluación en `OfflineCourse` / `GuidedDialoguePractice`**: sustituir `checkUtterance`/`evaluateDialogueTurn` por `evaluateAnswer(answerKeyForExercise(e, target), texto, {kind:'speech', confidence: classifyVoiceConfidence(...)} | {kind:'typed'})` y mostrar `answerFeedbackText(evaluación, nativeLanguage)`. `needs-confirmation` debe ofrecer «Sí / Repetir / Escribir».
2. **Sesión de voz**: el orquestador de turnos traduce comandos («repítelo», «más lento», «dame una pista», «pausa», «¿qué aprendí?») a `LearningSessionEvent` y reproduce `LearningSessionOutput` (`speech.language` indica la voz TTS; `instruction` está en el idioma conocido). `responseWindow` gobierna la espera del micrófono.
3. **Persistencia**: guardar `sessionToJSON(state)` y `learnerModelToJSON(model)` en el almacenamiento local existente (SQLite KV con CAS); al terminar, `completeSession` y guardar ambos resultados juntos.
4. **Preferencias**: `sessionPreferencesFrom(experiencePreferences, learnerPreferences)`.
5. **Paquetes futuros (Meta/ChatGPT)**: pasar por `validateLessonPackage` antes de cualquier importación.

## Riesgos y pendientes

- Copias de texto en seis idiomas: borradores originales **sin revisión nativa**.
- Pesos FSRS por defecto no ajustados a práctica oral; reajuste solo con datos reales consentidos.
- El hueco `{name}` acepta 1–3 palabras cualesquiera (no verifica que sea un nombre).
- La lista de negaciones/muletillas es finita; casos raros pueden caer en `needs-review` (sin penalización).
- Actividades de elección (`choice`) soportadas por el motor y el validador, pero todavía sin contenido autorizado.
- Pruebas físicas (ASR real, Bluetooth, pantalla bloqueada) pendientes; el motor no las requiere ni las simula.
