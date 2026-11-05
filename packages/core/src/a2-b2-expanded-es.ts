/** Continuaciones originales en español, pendientes de revisión pedagógica. */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const expandedPilotSpanish={
 A2:{
  unitId:'plans-and-invitations',
  continuation:[
   'El domingo me viene bien. ¿El museo abre por la tarde?',
   'Según el horario publicado, abre a la una. ¿Nos encontramos en la entrada a las dos?',
   'A las dos me parece perfecto, pero confirmemos que no hayan cambiado los horarios.',
   'De acuerdo. Revisaré el horario antes de confirmar y te avisaré si tenemos que cambiar el plan.'
  ],
  checks:[
   ['¿Qué otro día se propuso después de la primera invitación?','domingo','La visita del sábado quedó confirmada definitivamente.'],
   ['¿A qué hora proponen encontrarse?','a las dos','Quedaron en reunirse a las nueve de la mañana.'],
   ['¿Qué debe comprobarse antes de confirmar la salida?','Revisaré el horario antes de confirmar','Irán al museo aunque esté cerrado ese día.']
  ],
  spokenFollowUp:'Invita a un personaje ficticio, explica una dificultad de horario y negocia otra fecha con una condición.',
  noMicAlternative:'Escribe dos mensajes ficticios: una invitación y una respuesta con un nuevo día y una hora concreta.'
 },
 B1:{
  unitId:'workplace-collaboration',
  continuation:[
   'Puedo preparar la sala antes de la reunión, pero dime qué equipos vas a comprobar.',
   'Voy a probar el proyector y los micrófonos después del almuerzo y te enviaré un mensaje antes de que llegue el grupo.',
   'Si el proyector falla, ¿preparo una pantalla de respaldo o espero tu mensaje?',
   'Prepara la pantalla de respaldo si falla la prueba. Te informaré del resultado sin dar por hecho que todo funciona.'
  ],
  checks:[
   ['¿Cuándo puede revisar los equipos la segunda persona?','después del almuerzo','Los equipos ya han sido revisados y funcionan sin problemas.'],
   ['¿Qué equipos se comprobarán?','proyector y los micrófonos','La persona reparará el sistema eléctrico de todo el edificio.'],
   ['¿En qué condición se necesita la pantalla de respaldo?','si falla la prueba','Deben usar la pantalla de respaldo incluso si todo funciona.']
  ],
  spokenFollowUp:'Confirma las responsabilidades de cada persona y explica cuándo se activa el plan alternativo.',
  noMicAlternative:'Redacta una nota ficticia de entrega de turno que indique responsables, horarios y condición del respaldo.'
 },
 B2:{
  unitId:'argument-and-evidence',
  continuation:[
   '¿Qué datos nos ayudarían a decidir de manera justa para las personas que viajan fuera del horario habitual?',
   'Deberíamos entrevistar a quienes usan el servicio nocturno y comparar pasajeros de varios días, no de una sola noche.',
   '¿Esas cifras bastarían para justificar un servicio permanente?',
   'No. También debemos evaluar los costos y la accesibilidad; nuestra recomendación será provisional hasta terminar el análisis.'
  ],
  checks:[
   ['¿Qué personas quedaron fuera de la encuesta original?','quienes viajan de noche','La encuesta incluyó a todas las personas usuarias del servicio nocturno.'],
   ['¿Qué información adicional se propone recoger?','comparar pasajeros de varios días','Una sola noche concurrida demuestra toda la demanda habitual.'],
   ['¿Cuál es el estado de la recomendación final?','será provisional','La permanencia del servicio ya fue aprobada formalmente.']
  ],
  spokenFollowUp:'Presenta una recomendación matizada que distinga la muestra, las pruebas faltantes y los costos.',
  noMicAlternative:'Escribe un informe ficticio breve con hechos observados, límites de la muestra y una conclusión condicional.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
