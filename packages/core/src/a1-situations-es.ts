/** Situaciones originales A1 en español, sin grabaciones ni aprobación docente. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsSpanish:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
 'personal-information':{
  continuation:[
   'Gracias. ¿Hablas español en el centro comunitario?',
   'Sí, hablo español y este año estoy aprendiendo inglés.',
   '¿Quieres que repita el horario de nuestra clase ficticia?',
   'Sí, por favor. ¿Puedes repetir la hora más despacio?'
  ],
  checks:[
   ['¿En qué ciudad vive la persona?','Vivo en Temuco.','La persona dice que vive en Valdivia.'],
   ['¿Qué otro idioma está aprendiendo?','aprendiendo inglés.','La persona dice que está aprendiendo francés.'],
   ['¿Qué pide escuchar de nuevo?','repetir la hora más despacio?','La persona pide que le entreguen una dirección particular.']
  ],
  spokenFollowUp:'Presenta a un personaje ficticio, menciona un país y una ciudad y pide que repitan la hora de una clase.',
  noMicAlternative:'Escribe dos frases sobre un país y una ciudad ficticios, seguidas de una petición de repetir la hora.',
  mediationPrompt:'Explica a un compañero ficticio la ciudad mencionada y el idioma estudiado sin solicitar datos privados.'
 },
 'food-and-shopping':{
  continuation:[
   'Sí, por favor. Quisiera dos manzanas en lugar de una.',
   'Las dos manzanas cuestan cuatro dólares en total.',
   'Muchas gracias. ¿Me puede dar también una bolsa pequeña?',
   'Por supuesto. La bolsa pequeña es gratis hoy.'
  ],
  checks:[
   ['¿Cuánto cuesta una manzana?','dos dólares.','Una sola manzana cuesta cinco dólares.'],
   ['¿Cuánto cuestan las dos manzanas?','cuatro dólares en total.','Las dos manzanas cuestan seis dólares.'],
   ['¿Cuánto cuesta la bolsa pequeña?','gratis hoy.','La bolsa pequeña tiene un costo de dos dólares.']
  ],
  spokenFollowUp:'En una tienda ficticia, pide dos manzanas, confirma el precio total y solicita una bolsa de forma amable.',
  noMicAlternative:'Redacta una compra imaginaria con dos manzanas, el precio total y una solicitud cortés de bolsa.',
  mediationPrompt:'Explica a un personaje ficticio el costo de una manzana, de dos manzanas y de la bolsa sin realizar pagos.'
 },
 'places-and-directions':{
  continuation:[
   'Después de girar a la izquierda, ¿la biblioteca está junto al parque?',
   'Sí. Está al lado del parque, frente a una cafetería pequeña.',
   '¿Tengo que cruzar la calle en la esquina para llegar?',
   'No. Quédese de este lado de la calle y siga los letreros.'
  ],
  checks:[
   ['¿Qué giro debe realizarse después de seguir derecho?','gire a la izquierda en la esquina.','La indicación es girar a la derecha antes del puente.'],
   ['¿Dónde queda la biblioteca respecto del parque?','al lado del parque,','La biblioteca queda lejos del parque.'],
   ['¿La persona debe cruzar la calle?','Quédese de este lado de la calle','La persona debe cruzar inmediatamente la calle.']
  ],
  spokenFollowUp:'Pregunta por una biblioteca ficticia, confirma el orden de las indicaciones y aclara si debes cruzar.',
  noMicAlternative:'Escribe dos indicaciones hacia una biblioteca imaginaria y una pregunta para confirmar si debes cruzar.',
  mediationPrompt:'Repite las indicaciones de dos pasos y la instrucción sobre cruzar para otro visitante ficticio.'
 }
};
