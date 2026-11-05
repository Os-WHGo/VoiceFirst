/** Escenas C1 originales en español; edición pendiente, sin audio aprobado. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c1ListeningSpanish=[
 {
  level:'C1',unitId:'nuance-and-register',title:'Informe sobre una biblioteca',
  context:'Dos coordinadores preparan un informe ficticio para el barrio.',
  turns:[
   ['speaker-a','¿Podemos presentar el nuevo horario de la biblioteca como un éxito absoluto?'],
   ['speaker-b','La espera se redujo, pero quienes necesitan entrar sin subir escalones todavía encuentran cerrada la puerta lateral.'],
   ['speaker-a','Entonces afirmar que funcionó para todas las personas sería una exageración.'],
   ['speaker-b','Es mejor reconocer los avances y aclarar que el acceso universal sigue pendiente.'],
   ['speaker-a','¿Usamos todos los tecnicismos cuando conversemos con las personas voluntarias?'],
   ['speaker-b','No. Expliquemos los resultados con palabras sencillas y dejemos espacio para preguntas sobre los obstáculos.']
  ],
  checks:[
   [1,'¿Qué barrera física todavía existe?','cerrada la puerta lateral',
    'La mejora no eliminó una barrera importante para ciertas personas.','La entrada lateral ya está disponible para todo el mundo.'],
   [3,'¿Qué reserva debe aparecer en el informe?','el acceso universal sigue pendiente',
    'El resumen debe incluir un problema que aún no está resuelto.','La accesibilidad universal ya se alcanzó completamente.'],
   [5,'¿Qué registro se propone para conversar con voluntarios?','con palabras sencillas',
    'El tono puede ser cercano sin perder precisión.','El equipo debe usar solamente vocabulario técnico.']
  ],
  spokenFollowUp:'Explica con cortesía el avance y el problema pendiente a una vecina ficticia.',
  noMicAlternative:'Redacta dos frases sobre un resultado positivo y una limitación aún comprobable.'
 },
 {
  level:'C1',unitId:'implicit-meaning',title:'Taller de horario vespertino',
  context:'Un equipo analiza una respuesta indirecta de su directora.',
  turns:[
   ['speaker-a','¿La directora aprobó el nuevo taller para las tardes?'],
   ['speaker-b','Dijo que era una posibilidad, pero pidió retomarlo después de aprobar el plan de personal.'],
   ['speaker-a','¿Entonces sería prematuro anunciar que comenzará el lunes?'],
   ['speaker-b','Exacto. Expresó interés, pero no asumió un compromiso; todavía faltan condiciones.'],
   ['speaker-a','¿Podemos decir a las personas inscritas que lo estamos evaluando?'],
   ['speaker-b','Sí, siempre que aclaremos que no hay fecha confirmada y que informaremos tras la revisión de personal.']
  ],
  checks:[
   [1,'¿Qué debe ocurrir antes de retomar la propuesta?','después de aprobar el plan de personal',
    'La decisión depende de una revisión de recursos humanos.','La directora ya confirmó la fecha de inicio.'],
   [3,'¿Qué diferencia destaca el segundo participante?','interés, pero no asumió un compromiso',
    'Una expresión favorable no equivale a una aprobación definitiva.','El interés expresado garantiza que habrá un taller.'],
   [5,'¿Qué dato todavía no se puede comunicar como definitivo?','no hay fecha confirmada',
    'Puede informarse una intención, pero no inventar un calendario.','El taller tiene un día y horario de inicio oficial.']
  ],
  spokenFollowUp:'Aclara la diferencia entre intención y aprobación sin inventar motivos personales.',
  noMicAlternative:'Escribe una nota ficticia que preserve la incertidumbre y explique el siguiente paso.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
