# Diario A0 y recuperación por habilidad · 31 octubre 2026

## Diario A0 conectado al adaptador móvil

El checkpoint de las microlecciones ya usaba CAS, pero `useA0Session` todavía
guardaba el diario candidato mediante `Storage.setItem(key, value)`. Dos
instancias podían restaurar la misma revisión y sobrescribirse. Además, tras
un fallo, operaciones ya encoladas podían volver a escribir con la vista obsoleta.

Se amplía el contrato existente `A0StoragePort` con `compareAndWrite`, sin otra
base de datos ni nuevo diario. `restoreA0Session` devuelve los bytes originales;
`commitA0Attempt` exige ese snapshot cuando el puerto admite CAS. Comprueba
también que corresponda al journal sobre el que se calculó el siguiente intento.
`a0-device-storage.ts` usa el updater transaccional de expo-sqlite 57.0.4. El hook
guarda el siguiente snapshot solo tras commit y bloquea las operaciones pendientes
al primer conflicto/fallo. Los puertos simulados/legados sin CAS conservan su
contrato previo; el puerto móvil sí exige CAS y nunca usa la vía de escritura directa.

Sin migración, renombrado ni eliminación de claves: el esquema sigue siendo v1.
Se acepta JSON v1 con otro espaciado/orden comparando su contenido de forma
canónica antes de contrastar **los bytes exactos** en la transacción. JSON corrupto
o campos futuros desconocidos no se sobrescriben. Un conflicto se resuelve con
una lectura nueva, nunca reasignando revisiones ni mezclando respuestas a ciegas.

Alternativas comparadas: conservar solo la cola por instancia (no evita otros
escritores), reescribir el almacenamiento (innecesario), reutilizar el patrón CAS
del checkpoint/instalador ya presente (elegido). No se añadió dependencia ni
algoritmo criptográfico. Fuente SDK inspeccionada:
https://github.com/expo/expo/blob/main/packages/expo-sqlite/src/Storage.ts ;
licencia MIT https://github.com/expo/expo/blob/main/LICENSE . SQLite continúa
sin cifrado, limitado a IDs y contadores; no sirve para datos sensibles nuevos.

## Recuperación de la habilidad realmente practicada

`sessionFromJSON` validaba `ActivityResult.skill` pero lo omitía al reconstruir
el resultado. Una elección A0 con `reading-comprehension` se convertía así en
la clasificación genérica de elección: `listening-comprehension`.

Ahora conserva la habilidad declarada por la actividad del catálogo. Si un
snapshot antiguo la omitió, se recupera de esa actividad; si declara otra,
se rechaza. No cambia aciertos, errores, fechas ni umbrales pedagógicos. No se
reescriben modelos históricos ya aplicados ni se les inventa una corrección:
cualquier migración de evidencia previa requerirá procedencia suficiente.

## Pruebas

Adaptador móvil real transpileado con límite SQLite simulado: escritores
concurrentes, 36 candidatos A0 en los seis idiomas con cierre/reapertura,
snapshot requerido, JSON v1, metadatos desconocidos y disco fallido. Hook móvil
real con límites React/almacenamiento simulados: bloquear la cola tras fallo,
evitar escritura desde un callback viejo y recuperar mediante nueva lectura.

Seis idiomas con candidatos reales en el motor de sesiones: lectura antes y
después del round trip, aplicación al modelo únicamente como lectura, recuperación
del campo ausente y rechazo de una habilidad falsificada. Son pruebas Node y de
adaptadores, no funcionamiento SQLite físico ni revisión editorial de los candidatos.
No se modificó el contenido candidato, su estado de publicación, el catálogo de
lecciones, los permisos, ni las decisiones de pronunciación/MCER.
