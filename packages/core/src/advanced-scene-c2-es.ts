/** Escenas C2 originales en español, solo material de trabajo editorial. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c2ListeningSpanish=[
 {
  level:'C2',unitId:'idiomatic-mastery',title:'Negociación entre asociaciones',
  context:'Dos integrantes de un equipo interpretan metáforas en una reunión ficticia.',
  turns:[
   ['speaker-a','Cuando la presidenta dijo que podríamos cerrar todas las puertas, ¿hablaba de los accesos al edificio?'],
   ['speaker-b','No. Se refería a romper una relación de trabajo de tal manera que volver a colaborar resultaría difícil.'],
   ['speaker-a','Entonces hablar de seguridad de las puertas sería una traducción engañosa.'],
   ['speaker-b','En el acta conviene mencionar el riesgo de cerrar oportunidades de cooperación futura, no un desperfecto físico.'],
   ['speaker-a','También propuso guardarnos un as bajo la manga. ¿Cómo explicamos esa expresión?'],
   ['speaker-b','En este caso significa guardar el argumento más fuerte para una conversación posterior, no esconder cartas de verdad.']
  ],
  checks:[
   [1,'¿Qué riesgo real señala la primera metáfora?','volver a colaborar resultaría difícil',
    'Una ruptura tajante podría impedir relaciones futuras.','La organización tendrá que cambiar las cerraduras.'],
   [3,'¿Qué consecuencia debe describirse en el acta?','cerrar oportunidades de cooperación futura',
    'El aviso se refiere a vínculos institucionales y no a seguridad física.','El informe debe confirmar una avería en las puertas.'],
   [5,'¿Qué implica la segunda expresión aquí?','guardar el argumento más fuerte',
    'Se propone reservar una razón persuasiva para otro momento.','Alguien está ocultando naipes durante una partida.']
  ],
  spokenFollowUp:'Explica las dos expresiones a alguien que podría entenderlas de manera literal.',
  noMicAlternative:'Redacta un acta ficticia con el significado de ambas metáforas, sin repetirlas literalmente.'
 },
 {
  level:'C2',unitId:'subtle-implications',title:'El silencio del comité',
  context:'Dos colegas analizan los límites de lo que puede constar en un acta.',
  turns:[
   ['speaker-a','La presidenta calificó el plan de ambicioso, guardó silencio y cerró el debate. ¿Lo aprobó?'],
   ['speaker-b','Tras una pausa prolongada, pidió otra revisión en lugar de someter la propuesta a votación.'],
   ['speaker-a','¿Interpretamos la pausa como una forma indirecta de rechazo?'],
   ['speaker-b','Tal vez fue un aplazamiento cortés, pero ese silencio no basta para conocer sus intenciones privadas.'],
   ['speaker-a','¿Cómo podemos escribir lo ocurrido sin atribuirle motivos?'],
   ['speaker-b','Dejemos constancia de que no hubo votación y se solicitó una nueva revisión, sin afirmar una oposición que nadie expresó.']
  ],
  checks:[
   [1,'¿Qué procedimiento se pidió en vez de votar?','otra revisión en lugar de someter la propuesta a votación',
    'El comité pospuso una decisión en vez de aprobarla.','El comité respaldó el plan con una votación unánime.'],
   [3,'¿Qué límite tiene interpretar la pausa?','no basta para conocer sus intenciones privadas',
    'El tono puede sugerir algo, pero no demostrar un motivo personal.','La pausa demuestra inequívocamente una oposición secreta.'],
   [5,'¿Qué información verificable cabe en el acta?','no hubo votación y se solicitó una nueva revisión',
    'El documento debe consignar hechos sin suponer intenciones.','El acta debe registrar un rechazo formal que no ocurrió.']
  ],
  spokenFollowUp:'Resume los hechos e identifica aparte una interpretación que aún no puede comprobarse.',
  noMicAlternative:'Escribe un resumen factual y una inferencia cautelosa como ejercicio independiente.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
