# MU VoiceFirst | Consolidación curricular A1–C2 y pilotos amplificados | 2026-11-05

## Alcance realmente implementado

Este bloque **no equivale a terminar los cursos completos**. Conserva el contrato de seis idiomas internos y 30 pares dirigidos, con lanzamiento público priorizado en inglés canadiense, francés canadiense y español. A0 continúa como orientación interna previa a A1, no como banda oficial del MCER.

1. Se reutilizaron los **144 borradores temáticos originales** del lanzamiento (3 idiomas × 6 bandas A1–C2 × 8 unidades previstas por banda) y los contratos actuales `LessonPackage`, `validateLessonPackage` y `lessonPackageDigest`. Ninguna de estas unidades se agrega automáticamente a `lessonsFor`, al progreso del alumno, a SQLite ni al ASR/TTS.
2. Tres paquetes de producción **editoriales**, 48 unidades por idioma, con 7 etapas por unidad inicial (dos turnos de exposición textual, reconocimiento de la respuesta escrita, modelo, turno de diálogo, recuerdo y comprobación no certificante). Estos elementos son borradores de práctica; el reconocimiento textual de una frase NO demuestra comprensión auditiva ni destreza oral.
3. Nueve pilotos ampliados **A2/B1/B2** (tres por idioma) mejoran sus intercambios de dos a **seis turnos**, con 27 preguntas y evidencias textuales verificables. El banco conserva idénticos sus dos primeros turnos procedentes del material anterior y agrega cuatro originales por escenario. Cada piloto tiene además propuesta de respuesta oral y alternativa escrita sin micrófono.
4. Los nueve pilotos se integraron en sus respectivas unidades del paquete con cuatro escuchas redactadas adicionales y tres opciones de comprensión basadas en frases efectivamente presentes. Los restantes 135 borradores mantienen dos turnos y siguen siendo material insuficiente para un curso completo.
5. Inventario resultante: **144 unidades candidatas y 1.071 actividades de borrador**; **9 escenas A2–B2 de seis turnos** con **54 identificadores de audio todavía no grabado**; además de las **12 escenas C1–C2** ampliadas anteriormente, que siguen en la rama ancestral.
6. Mantenemos aparte las 84 microlecciones A0–A1 funcionales históricas para seis idiomas. El bloque no infla ese catálogo ni altera sus rutas de reanudación, prerequisitos o tests.

## Decisión curricular y fuente

El MCER del Consejo de Europa propone planificar por capacidades de **recepción, producción, interacción y mediación**, además de las bandas A1–C2. La edición Companion Volume 2020 añade descriptores de mediación y de comprensión oral; el esquema de autoevaluación incluye escucha, lectura, expresión, interacción y escritura. Fuentes:
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-

No se copian materiales, grabaciones o texto protegido de entidades educativas. Se redactan diálogos originales ficticios en este repositorio y se registrará por separado cualquier licencia de código, modelo, dataset y voz. La licencia CC BY 4.0, cuando aplique a recursos externos, exige atribución, enlace y señalamiento de cambios (https://creativecommons.org/licenses/by/4.0/deed.en). La simple referencia a un material público NO concede el derecho de redistribuir su audio.

## Barreras obligatorias para declarar una unidad terminada

- **Diseño pedagógico:** objetivos específicos por habilidad y nivel, suficientes situaciones y variaciones regionales, práctica por escucha y conversación auténtica, repaso espaciado, verificación de comprensión no trivial, tareas situacionales de interacción/mediación y aceptación de variantes correctas.
- **Revisión independiente:** lingüística regional, dificultad por banda MCER, tratamiento de alternativas e inferencias, accesibilidad, lectura opcional y revisión de adecuación a la edad cuando corresponda. Un metadato `draft` no cuenta como revisión.
- **Audio:** producir y aclarar derechos de los seis clips de cada escena, validar tamaño/SHA y procedencia desde archivo local, escuchar en dispositivo con acento adecuado, comprobar interrupciones, rutas de audio y uso sin red. El motor ASR del sistema no certifica pronunciación ni disponibilidad offline de cada dialecto.
- **Evaluación responsable:** comprobación determinista conservadora y elección/confirmación manual cuando hay ASR incierto, sin puntuaciones CEFR extrapoladas ni guardar transcripciones personales.
- **Producto:** pase completo en iPhone/Android físicos durante B1, almacenamiento local seguro, sesión recuperable, navegación accesible y ninguna cuenta/IA remota obligatoria.
- **Seguridad:** auditoría NPM sin avisos bloqueantes, no saltar `readyForMerge`, no usar `npm audit fix --force` que rompa Expo.

## Separación de hitos, cumplimiento y tareas siguientes

- **B0:** continuar pasando de guion a secuencia pedagógica reproducible, expandir los 135 temas todavía breves con dificultades propias de cada nivel, QA automatizada; no se confunde con currículo completo.
- **B1:** betas internas instalables solo en hitos autorizados, audio real en modo avión, permisos, recuperación, cambios de ruta, ASR local conservador y alternativa sin micrófono.
- **B2:** ensayos de audífonos, Bluetooth, lentes, pantalla bloqueada y manos libres ampliado solo con permisos del SO y pruebas físicas.
- **Publicación oficial:** solamente con A1–C2 completos y revisados en los 3 idiomas, derechos, contenido y seguridad aprobados. Cursos gratuitos, sin publicidad de terceros, suscripción ni venta de datos.

Las ramas históricas y contribuciones únicas de Claude/Codex se conservan; no se fusiona `main`, no se generan instalables con cada bloque y no se hacen gastos ni se activan servicios externos. La PR independiente #9 de Codex compila iOS pero falla en la fase `bootstatus` del simulador; no atribuir el fallo a la aplicación sin pruebas del arranque real.
