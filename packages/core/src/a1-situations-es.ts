/** Situaciones originales A1 en español, sin grabaciones ni aprobación docente. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsSpanish:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
 'numbers-time-and-dates':{
  continuation:[
   "¿La clase es en la sala tres o en la cuatro?",
   "La clase es en la sala tres el lunes.",
   "¿Me repite el día y la hora para mi amiga?",
   "Claro. El lunes a las dos de la tarde, en la sala tres.",
  ],
  checks:[
   ["¿A qué hora comienza la clase?", "a las dos de la tarde.", "La clase comienza a las nueve de la mañana."],
   ["¿En qué sala se hace la clase del lunes?", "en la sala tres el lunes.", "La clase del lunes se hace en la sala cuatro."],
   ["¿Qué información le repiten a la amiga?", "El lunes a las dos de la tarde, en la sala tres.", "Le indican que vaya el martes a las cuatro."],
  ],
  spokenFollowUp:"Confirma el día, la hora y la sala de una clase ficticia y pide que repitan la información con amabilidad.",
  noMicAlternative:"Escribe dos mensajes ficticios para confirmar el día de una clase, la hora de inicio y el número de sala.",
  mediationPrompt:"Explica a una compañera ficticia el día, la hora y la sala de la clase sin usar un horario de una escuela real."
 },
 'family-and-people':{
  continuation:[
   "¿A Sam le gusta visitar el jardín comunitario?",
   "Sí, a Sam le gusta el jardín y lleva un cuaderno pequeño.",
   "¿Puedo invitar a Sam a nuestra reunión ficticia?",
   "Sí, Sam puede venir el sábado por la tarde.",
  ],
  checks:[
   ["¿Qué parentesco tiene Sam con la persona?", "mi primo.", "Sam es el profesor de la persona."],
   ["¿Qué objeto lleva Sam al jardín?", "un cuaderno pequeño.", "Sam lleva una maleta grande al jardín."],
   ["¿Cuándo puede venir Sam a la reunión?", "el sábado por la tarde.", "Sam solo puede venir el miércoles por la mañana."],
  ],
  spokenFollowUp:"Presenta a un primo ficticio con respeto, describe una actividad que le gusta e invítalo a una reunión.",
  noMicAlternative:"Escribe una descripción ficticia de Sam y dos mensajes breves para invitarlo a una reunión.",
  mediationPrompt:"Explica a una persona ficticia quién es Sam, qué le gusta y cuándo puede asistir a la reunión."
 },
 'daily-routines':{
  continuation:[
   "¿El autobús sale antes de las ocho?",
   "Sí, sale a las siete y media desde la parada.",
   "¿Qué haces cuando llegas al trabajo?",
   "Leo un libro antes de empezar a trabajar a las nueve.",
  ],
  checks:[
   ["¿Qué hace la persona después de desayunar?", "luego tomo el autobús.", "La persona vuelve a dormir después del desayuno."],
   ["¿A qué hora sale el autobús?", "a las siete y media", "El autobús sale a las nueve y media."],
   ["¿Qué hace antes de empezar a trabajar?", "Leo un libro antes de empezar a trabajar a las nueve.", "La persona corre después de terminar su trabajo."],
  ],
  spokenFollowUp:"Describe tres acciones de una mañana ficticia con sus horarios y pregunta a qué hora sale el autobús.",
  noMicAlternative:"Escribe tres frases sobre un horario imaginario con desayuno, transporte y comienzo del trabajo.",
  mediationPrompt:"Ordena el desayuno, el autobús y la lectura de un personaje ficticio para alguien que no oyó la conversación."
 },
 'basic-needs-and-help':{
  continuation:[
   "Gracias. ¿En qué parte del boleto aparece la fecha?",
   "La fecha está arriba, junto al número.",
   "¿Me lo puede repetir un poco más despacio?",
   "Sí. Mire la parte de arriba del boleto, junto al número.",
  ],
  checks:[
   ["¿Cómo explica la persona el boleto?", "Se lo explico más despacio.", "La persona se niega a explicar el boleto."],
   ["¿En qué parte del boleto aparece la fecha?", "arriba, junto al número.", "La fecha está en la parte de atrás del boleto."],
   ["¿Qué debe mirar otra vez?", "la parte de arriba del boleto, junto al número.", "La persona debe mirar debajo de una mesa."],
  ],
  spokenFollowUp:"Pide ayuda cortésmente con un boleto ficticio, encuentra la fecha y solicita una explicación más lenta.",
  noMicAlternative:"Escribe una petición breve para recibir ayuda con un boleto y otra frase para pedir que repitan más despacio.",
  mediationPrompt:"Explica con palabras sencillas dónde está la fecha en un boleto ficticio sin solicitar información privada."
 },
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
