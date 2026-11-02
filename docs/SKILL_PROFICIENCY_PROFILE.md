# VoiceFirst: perfil de competencia por habilidad

Decisión pedagógica: cada idioma tiene cuatro ejes independientes: listening, speaking, reading y writing. Nunca inferir el nivel de una habilidad a partir de otra.

## Representación
- Registrar evidencias por actividad y por habilidad, diferenciando intento, éxito e incertidumbre.
- Estado de nivel por habilidad: no evaluado, estimación interna provisional, o resultado de evaluación externa declarado/verificado. Nunca convertir recuentos de ejercicios en niveles MCER automáticamente.
- Escala de referencia MCER: A1, A2, B1, B2, C1, C2. A0 puede ser una etiqueta de producto pre-A1, no un nivel oficial MCER.
- Guardar fecha y método de evaluación y permitir reevaluación; conservar historial de revisiones sin guardar grabaciones o transcripciones por defecto.
- Un nivel C2 en comprensión oral no implica C2 en producción oral ni en lectura o escritura.
- La preparación para CELPIP, IELTS, DELE y demás certificaciones debe mantener puntuaciones y criterios propios de cada examen, sin equivalencias automáticas no fundamentadas.

## Interacción
- El modo manos libres registra solo las habilidades efectivamente ejercitadas. Ofrecer repaso escrito del mismo contenido cuando el usuario quiera usar pantalla.
- No bloquear avance oral por tareas escritas pendientes.
- El perfil puede sugerir prioridades, nunca imponerlas. No equiparar tiempo de uso con competencia.
- Si no hay evidencia suficiente, mostrar «Sin evaluar» y no inventar un nivel.

## Estado técnico
Existe skill-evidence.ts para contadores independientes y written-followup.ts para sugerencias de repaso a partir de lecciones completadas. La estimación MCER fiable, persistencia completa y UI de perfil aún no están implementadas ni verificadas.
