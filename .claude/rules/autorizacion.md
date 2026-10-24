# Protocolo de autorización inicial

Se aplica en todos los proyectos. Las reglas específicas de cada proyecto se suman a este
protocolo; si alguna lo contradice, gana la del proyecto, salvo que la contradicción afloje la
seguridad (ahí prevalece este protocolo).

## Antes de actuar

1. Interpreta primero la intención del mensaje: **conversación**, **consulta**, **idea o
   propuesta**, o **solicitud de ejecución**. Una idea o una pregunta no son una orden de
   implementar.
2. Sin autorización puedes investigar, leer y analizar (archivos, búsquedas, documentación,
   comandos de solo lectura).
3. Antes de escribir código, editar archivos, instalar dependencias o modificar el proyecto o
   servicios externos, presenta un **resumen breve** del trabajo (qué, dónde, cómo se probará)
   y termina con la pregunta: **«¿Quieres que comience?»**
4. Espera una confirmación explícita. No interpretes como aprobación un mensaje ambiguo.

## Durante la ejecución autorizada

5. Ejecuta todo lo que entra en el alcance aprobado sin pedir permisos repetidos.
6. Investiga los errores, corrígelos y ejecuta pruebas de regresión dentro de ese alcance.
7. Para dudas puntuales usa la herramienta de preguntas (AskUserQuestion), que no interrumpe la
   autorización; un mensaje nuevo del usuario sí la revoca, salvo que vuelva a aprobar.
8. Pide autorización de nuevo **solo** ante: un cambio importante de alcance, gastos,
   operaciones irreversibles, publicación en producción o riesgos relevantes.

## Al terminar

9. Entrega un resumen con tres apartados: **realizado**, **pruebas** (con su resultado real) y
   **pendientes**.
10. Una solicitud nueva e independiente necesita una autorización nueva.

## Cómo se verifica (hooks en `.claude/hooks/authz/`)

- La autorización solo nace de un mensaje del usuario que la expresa al inicio («Sí, comienza»,
  «Adelante», «Sigue», «Procede», «Quiero que comiences»…), de un «sí» a secas justo después de
  «¿Quieres que comience?», o de un plan aprobado en Plan Mode. Una negación delante («no»,
  «todavía no», «antes de…») la anula.
- Mientras no haya autorización, un hook `PreToolUse` bloquea las ediciones de archivos, los
  comandos que no son de solo lectura y las herramientas MCP que escriben. Si te bloquea, no
  intentes rodearlo: presenta el resumen y pregunta.
- Cualquier mensaje nuevo del usuario que no sea una aprobación revoca la autorización
  (revocación estricta). Reanudar o limpiar la sesión también la revoca.
- Los archivos del propio mecanismo (`hooks/authz`, `settings.json`, esta regla) solo se pueden
  modificar si el usuario escribe «autorizo config» en su aprobación.
- Las operaciones críticas (push forzado o a `main`, `rm -rf`, publicaciones, despliegues,
  envíos de correo, merges) piden confirmación siempre mediante reglas `ask`, haya o no
  autorización.
