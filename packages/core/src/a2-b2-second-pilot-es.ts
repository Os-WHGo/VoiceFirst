/** Segunda colección original de diálogos editoriales en español.
 * No se ha grabado audio ni revisado la competencia lingüística.
 */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const secondPilotSpanish={
 A2:{
  unitId:'housing-and-services',
  continuation:[
   'Gracias. ¿Necesito quedarme en casa durante toda la mañana?',
   'Todavía debemos confirmar la hora de la visita con la persona encargada.',
   '¿Cómo sabré cuándo vendrán a revisar la llave?',
   'Te enviaremos un mensaje cuando esté confirmada la cita; todavía no hay una hora definitiva.'
  ],
  checks:[
   ['¿Para cuándo se propuso inicialmente la visita?','mañana en la mañana','La visita quedó confirmada para esta misma noche.'],
   ['¿Qué detalle de la visita sigue sin resolverse?','confirmar la hora de la visita','El horario exacto de la visita ya está confirmado.'],
   ['¿La cita tiene ya una hora establecida?','todavía no hay una hora definitiva','El técnico ya prometió llegar a una hora concreta.']
  ],
  spokenFollowUp:'Explica una avería doméstica ficticia, solicita una revisión y distingue una visita posible de una cita confirmada.',
  noMicAlternative:'Escribe una solicitud ficticia de mantenimiento y una respuesta que indique qué horario todavía debe confirmarse.'
 },
 B1:{
  unitId:'handling-unexpected-situations',
  continuation:[
   '¿Podemos averiguar si la otra sala está libre y es accesible antes de convocar al grupo?',
   'Puedo preguntarle a coordinación, pero todavía no tenemos autorización.',
   '¿Qué deberíamos comunicar a las personas que asistirán mientras esperamos?',
   'Digamos que el lugar sigue sin decidirse; avisaremos al grupo cuando coordinación confirme la alternativa.'
  ],
  checks:[
   ['¿Bajo qué condición puede utilizarse otra sala?','si está disponible','La sala alternativa ya está reservada y aprobada.'],
   ['¿Existe autorización para utilizar la alternativa?','todavía no tenemos autorización','La coordinación ya autorizó el cambio definitivo.'],
   ['¿Cuándo se comunicará la ubicación definitiva?','cuando coordinación confirme','Se anunciará que la sala original está abierta y disponible.']
  ],
  spokenFollowUp:'Describe el cierre inesperado de un taller ficticio, evalúa alternativas y evita prometer una sala sin confirmación.',
  noMicAlternative:'Redacta un aviso ficticio para asistentes que separe el cierre confirmado de la nueva ubicación aún pendiente.'
 },
 B2:{
  unitId:'complex-instructions',
  continuation:[
   '¿Dónde tengo que buscar ese número antes de continuar con el trámite?',
   'Compara el número de la solicitud con el registro interno; no te bases únicamente en una estimación verbal.',
   'Si los dos números coinciden, ¿puedo omitir la autorización final?',
   'No. Esa coincidencia solo permite continuar con la revisión responsable; los números coincidentes no permiten aprobar por sí solos.'
  ],
  checks:[
   ['¿En qué caso debe detenerse el procedimiento inicial?','Si no coincide, detén el trámite','Una diferencia de números puede ignorarse si el formulario parece correcto.'],
   ['¿Con qué fuente debe contrastarse el número de solicitud?','registro interno','Basta una estimación verbal que nunca se haya documentado.'],
   ['¿Coincidir en el número equivale a una aprobación final?','no permiten aprobar por sí solos','La coincidencia concede automáticamente la autorización definitiva.']
  ],
  spokenFollowUp:'Explica un procedimiento ficticio de varios pasos y conserva tanto la condición de interrupción como el requisito de aprobación.',
  noMicAlternative:'Escribe una secuencia ficticia que diferencie comprobar números, detener una discrepancia y solicitar aprobación.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
