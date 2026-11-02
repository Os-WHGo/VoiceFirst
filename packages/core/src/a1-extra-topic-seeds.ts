/** Original A1 authoring briefs, NOT public lessons, recordings or assessed exercises.
 * The examples use fictional persons and avoid personal addresses or birth dates.
 * Translation and cultural suitability still require human review.
 */
import type {TargetLanguage} from './types.js';
export const extraA1Topics=['numbers-time-and-dates','family-and-people'] as const;
export type ExtraA1Topic=(typeof extraA1Topics)[number];
export interface ExtraA1Seed {
 outcome:string;grammar:string;
 dialogue:readonly [string,string];
 vocabulary:readonly [string,string,string,string];
 tasks:readonly [string,string,string,string,string,string];
}
export const extraA1Authoring:Readonly<Record<TargetLanguage,Readonly<Record<ExtraA1Topic,ExtraA1Seed>>>>={
'en-CA':{
 'numbers-time-and-dates':{
  outcome:'Ask the time and agree on a simple day and time for a fictional meeting.',
  grammar:'Use What time is it? and at two o’clock; distinguish today from tomorrow and a day of the week.',
  dialogue:['What time is our class on Monday?','It starts at two o’clock in the afternoon.'],
  vocabulary:['What time is it?','At two o’clock','On Monday','What is the date?'],
  tasks:[
   'Listen to a verified class-time exchange and identify the day and hour.',
   'Say a fictional meeting time with the preposition at and a clear hour.',
   'Read two fictional schedules and locate the event planned for Monday.',
   'Write an imaginary class timetable with one day and one starting time.',
   'Ask another learner about a fictional appointment and confirm the answer.',
   'Restate the scheduled day and time in simple language for a partner.'
  ]
 },
 'family-and-people':{
  outcome:'Introduce a fictional family member and describe a person with simple language.',
  grammar:'Contrast This is my with He is or She is; avoid assuming someone’s gender or family structure.',
  dialogue:['Who is the person in this picture?','This is Sam, my cousin. Sam is very friendly.'],
  vocabulary:['This is my cousin','My family','A friendly person','Who is this?'],
  tasks:[
   'Listen to an approved fictional introduction and identify the relationship.',
   'Introduce a fictional relative using one clear sentence and a chosen name.',
   'Read a fictional family description and find one personal characteristic.',
   'Write a short imaginary description without sharing identifying details.',
   'Ask who a person is and respond using a respectful neutral description.',
   'Summarize the relationship and the descriptive word for another listener.'
  ]
 }
},
'fr-CA':{
 'numbers-time-and-dates':{
  outcome:'Demander une heure et confirmer un jour et un horaire de rencontre fictive.',
  grammar:'Employer Quelle heure est-il ? et à deux heures; distinguer lundi, aujourd’hui et demain.',
  dialogue:['À quelle heure commence le cours lundi ?','Il commence à deux heures de l’après-midi.'],
  vocabulary:['Quelle heure est-il ?','À deux heures','Lundi','Quelle est la date ?'],
  tasks:[
   'Écouter un dialogue approuvé et repérer le jour et l’heure du cours.',
   'Dire une heure de rendez-vous fictif avec une expression simple.',
   'Lire deux horaires imaginaires et repérer l’activité prévue lundi.',
   'Écrire une courte liste fictive avec un jour et une heure.',
   'Demander l’heure d’un événement et confirmer poliment la réponse.',
   'Reformuler le jour et l’heure pour une autre personne en français simple.'
  ]
 },
 'family-and-people':{
  outcome:'Présenter un membre d’une famille fictive et décrire une personne simplement.',
  grammar:'Employer Voici et C’est; distinguer un lien familial d’une qualité personnelle sans présumer du genre.',
  dialogue:['Qui est cette personne sur la photo ?','C’est Sam, mon cousin. Sam est très sympathique.'],
  vocabulary:['Voici mon cousin','Ma famille','Une personne sympathique','Qui est-ce ?'],
  tasks:[
   'Écouter une présentation fictive approuvée et repérer le lien familial.',
   'Présenter un personnage fictif en utilisant une phrase complète.',
   'Lire une description inventée et relever une qualité de caractère.',
   'Écrire une courte description fictive sans nom complet ni adresse.',
   'Demander qui est une personne et répondre avec respect et simplicité.',
   'Reformuler pour un partenaire le lien familial et une qualité citée.'
  ]
 }
},
es:{
 'numbers-time-and-dates':{
  outcome:'Preguntar la hora y confirmar el día de una actividad cotidiana ficticia.',
  grammar:'Distinguir ¿Qué hora es? de ¿A qué hora?; practicar el lunes y a las dos.',
  dialogue:['¿A qué hora empieza la clase del lunes?','Empieza a las dos de la tarde.'],
  vocabulary:['¿Qué hora es?','A las dos','El lunes','¿Cuál es la fecha?'],
  tasks:[
   'Escuchar un horario revisado e identificar el día y la hora mencionados.',
   'Decir en voz alta a qué hora empieza una clase imaginaria.',
   'Leer dos horarios ficticios y localizar la actividad del lunes.',
   'Escribir un pequeño calendario imaginario con un día y una hora.',
   'Preguntar el horario de una actividad ficticia y confirmar la respuesta.',
   'Explicar a otra persona a qué hora y qué día comienza la actividad.'
  ]
 },
 'family-and-people':{
  outcome:'Presentar a una persona ficticia y describir su relación familiar y carácter.',
  grammar:'Practicar este es y esta es, distinguiendo parentesco de características personales sin imponer una estructura familiar.',
  dialogue:['¿Quién es la persona de la foto?','Es Sam, mi primo. Sam es una persona amable.'],
  vocabulary:['Mi primo','Mi familia','Una persona amable','¿Quién es?'],
  tasks:[
   'Escuchar una presentación ficticia revisada y reconocer la relación familiar.',
   'Presentar a un familiar imaginario usando una oración sencilla.',
   'Leer una descripción de ficción e identificar un rasgo de carácter.',
   'Escribir una presentación inventada sin datos personales reales.',
   'Preguntar por una persona ficticia y responder con respeto y claridad.',
   'Explicar a un compañero quién es la persona y cómo se la describe.'
  ]
 }
},
'pt-BR':{
 'numbers-time-and-dates':{
  outcome:'Perguntar as horas e combinar o dia e horário de uma atividade fictícia.',
  grammar:'Distinguir Que horas são? e A que horas?; praticar na segunda-feira e às duas.',
  dialogue:['A que horas começa a aula na segunda-feira?','Começa às duas da tarde.'],
  vocabulary:['Que horas são?','Às duas horas','Na segunda-feira','Qual é a data?'],
  tasks:[
   'Ouvir um diálogo aprovado e identificar o dia e o horário da aula.',
   'Dizer em voz alta o horário de uma atividade imaginária.',
   'Ler dois horários fictícios e localizar o compromisso de segunda.',
   'Escrever um calendário inventado com um dia e um horário simples.',
   'Perguntar a hora de uma atividade fictícia e confirmar a resposta.',
   'Explicar o dia e o horário para uma pessoa que não ouviu o diálogo.'
  ]
 },
 'family-and-people':{
  outcome:'Apresentar uma pessoa fictícia e descrever parentesco e uma qualidade.',
  grammar:'Praticar Este é e Esta é, distinguindo parentesco e características sem pressupor a composição familiar.',
  dialogue:['Quem é a pessoa nesta foto?','É Sam, meu primo. Sam é uma pessoa muito gentil.'],
  vocabulary:['Meu primo','Minha família','Uma pessoa gentil','Quem é?'],
  tasks:[
   'Ouvir uma apresentação fictícia validada e reconhecer o parentesco.',
   'Apresentar um parente imaginário usando uma frase curta.',
   'Ler uma descrição inventada e identificar uma característica.',
   'Escrever uma apresentação fictícia sem endereço nem sobrenome real.',
   'Perguntar sobre uma pessoa imaginária e responder de forma respeitosa.',
   'Recontar para um colega o parentesco e a característica mencionada.'
  ]
 }
},
de:{
 'numbers-time-and-dates':{
  outcome:'Nach der Uhrzeit fragen und einen fiktiven Wochentag mit Uhrzeit bestätigen.',
  grammar:'Wie spät ist es? und um zwei Uhr unterscheiden; am Montag und heute korrekt einsetzen.',
  dialogue:['Um wie viel Uhr beginnt der Kurs am Montag?','Er beginnt um zwei Uhr nachmittags.'],
  vocabulary:['Wie spät ist es?','Um zwei Uhr','Am Montag','Welches Datum haben wir?'],
  tasks:[
   'Einen überprüften Beispieldialog hören und Tag sowie Uhrzeit erkennen.',
   'Die Uhrzeit eines erfundenen Termins deutlich in einem Satz sagen.',
   'Zwei fiktive Stundenpläne lesen und den Kurs am Montag finden.',
   'Einen kurzen erfundenen Wochenplan mit Tag und Beginn schreiben.',
   'Nach der Uhrzeit eines fiktiven Treffens fragen und sie bestätigen.',
   'Den vereinbarten Tag und die Uhrzeit für eine andere Person erklären.'
  ]
 },
 'family-and-people':{
  outcome:'Eine fiktive verwandte Person vorstellen und eine Eigenschaft beschreiben.',
  grammar:'Das ist und mein oder meine benutzen; Verwandtschaft und Eigenschaft ohne Familienannahmen trennen.',
  dialogue:['Wer ist die Person auf dem Bild?','Das ist Sam, mein Cousin. Sam ist sehr freundlich.'],
  vocabulary:['Mein Cousin','Meine Familie','Eine freundliche Person','Wer ist das?'],
  tasks:[
   'Eine geprüfte fiktive Vorstellung hören und die Verwandtschaft erkennen.',
   'Eine erfundene verwandte Person mit einem einfachen Satz vorstellen.',
   'Eine erfundene Personenbeschreibung lesen und ein Merkmal markieren.',
   'Zwei erfundene Sätze ohne echte private Angaben aufschreiben.',
   'Höflich nach einer fiktiven Person fragen und einfach antworten.',
   'Die Beziehung und eine Eigenschaft für einen Lernpartner wiedergeben.'
  ]
 }
},
it:{
 'numbers-time-and-dates':{
  outcome:'Chiedere l’ora e confermare giorno e orario di un incontro immaginario.',
  grammar:'Distinguere Che ore sono? da A che ora?; esercitare lunedì e alle due.',
  dialogue:['A che ora comincia il corso lunedì?','Comincia alle due del pomeriggio.'],
  vocabulary:['Che ore sono?','Alle due','Lunedì','Qual è la data?'],
  tasks:[
   'Ascoltare un dialogo revisionato e riconoscere giorno e ora del corso.',
   'Pronunciare l’orario di un appuntamento immaginario in una frase.',
   'Leggere due calendari inventati e trovare l’attività del lunedì.',
   'Scrivere un programma fittizio con un giorno e un orario semplice.',
   'Chiedere l’ora di una lezione immaginaria e confermare la risposta.',
   'Riferire il giorno e l’ora a un compagno usando parole semplici.'
  ]
 },
 'family-and-people':{
  outcome:'Presentare un personaggio immaginario e descrivere parentela e carattere.',
  grammar:'Usare questo è e questa è; distinguere il legame familiare dal carattere senza presupposti.',
  dialogue:['Chi è la persona nella foto?','È Sam, mio cugino. Sam è una persona gentile.'],
  vocabulary:['Mio cugino','La mia famiglia','Una persona gentile','Chi è?'],
  tasks:[
   'Ascoltare una presentazione fittizia revisionata e riconoscere la parentela.',
   'Presentare un parente immaginario con una frase semplice.',
   'Leggere una descrizione inventata e individuare una qualità personale.',
   'Scrivere due frasi immaginarie senza dati personali identificativi.',
   'Chiedere chi è una persona immaginaria e rispondere con cortesia.',
   'Riassumere per un compagno la relazione e una qualità della persona.'
  ]
 }
}
};
