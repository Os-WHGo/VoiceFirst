/** Original, offline micro-lessons authored for VoiceFirst. Not CEFR-certified. */
import {targetLanguages,type TargetLanguage} from './types.js';
import type {OfflineLesson,LocalizedText,CourseStage,CourseExercise} from './course.js';
const t=(en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
type Topic='water'|'thanks'|'directions'|'clarify'|'introduce'|'price'|'hours'|'work';
const goals:Record<Topic,LocalizedText>={
 water:t('Order water politely','Demander de l’eau poliment','Pedir agua con cortesía','Pedir água com educação','Höflich Wasser bestellen','Chiedere acqua con cortesia'),
 thanks:t('Thank someone and respond','Remercier et répondre','Agradecer y responder','Agradecer e responder','Sich bedanken und antworten','Ringraziare e rispondere'),
 directions:t('Ask for directions','Demander son chemin','Pedir indicaciones','Pedir orientações','Nach dem Weg fragen','Chiedere indicazioni'),
 clarify:t('Ask someone to repeat','Demander de répéter','Pedir que repitan','Pedir para repetir','Um Wiederholung bitten','Chiedere di ripetere'),
 introduce:t('Introduce yourself','Se présenter','Presentarse','Apresentar-se','Sich vorstellen','Presentarsi'),
 price:t('Ask the price','Demander le prix','Preguntar el precio','Perguntar o preço','Nach dem Preis fragen','Chiedere il prezzo'),
 hours:t('Ask opening hours','Demander les heures d’ouverture','Preguntar el horario','Perguntar o horário','Nach Öffnungszeiten fragen','Chiedere gli orari'),
 work:t('Ask about a work shift','Demander son quart de travail','Preguntar por el turno de trabajo','Perguntar sobre o turno','Nach der Arbeitsschicht fragen','Chiedere del turno di lavoro')
};
const examples:Record<TargetLanguage,Record<Topic,readonly string[]>>={
 'en-CA':{price:['How much does this cost?','What is the price of this?'],hours:['What time do you open?','When do you open?'],work:['What time does my shift start?','When does my shift begin?'],introduce:['My name is Alex.','I am Alex.'],water:['Could I have some water, please?','Can I have some water, please?'],thanks:['Thank you very much.','Thanks a lot.'],directions:['Where is the bus stop?','Could you tell me where the bus stop is?'],clarify:['Could you say that again, please?','Could you repeat that, please?']},
 'fr-CA':{price:['Combien ça coûte ?','Quel est le prix ?'],hours:['À quelle heure ouvrez-vous ?','Vous ouvrez à quelle heure ?'],work:['À quelle heure commence mon quart de travail ?','Quand est-ce que mon quart commence ?'],introduce:['Je m’appelle Alex.','Moi, c’est Alex.'],water:["Est-ce que je pourrais avoir de l’eau, s’il vous plaît ?","Je voudrais de l’eau, s’il vous plaît."],thanks:['Merci beaucoup.','Merci bien.'],directions:["Où est l’arrêt d’autobus ?","Pourriez-vous me dire où se trouve l’arrêt d’autobus ?"],clarify:['Pourriez-vous répéter, s’il vous plaît ?','Est-ce que vous pourriez redire ça ?']},
 es:{price:['¿Cuánto cuesta esto?','¿Cuál es el precio?'],hours:['¿A qué hora abren?','¿Cuál es su horario?'],work:['¿A qué hora empieza mi turno?','¿Cuándo comienza mi turno?'],introduce:['Me llamo Alex.','Soy Alex.'],water:['¿Me puede traer agua, por favor?','Quisiera agua, por favor.'],thanks:['Muchas gracias.','Te lo agradezco.'],directions:['¿Dónde está la parada de autobús?','¿Me puede indicar dónde está la parada de autobús?'],clarify:['¿Puede repetirlo, por favor?','¿Me lo puede decir otra vez?']},
 'pt-BR':{price:['Quanto custa isso?','Qual é o preço?'],hours:['Que horas vocês abrem?','Qual é o horário de funcionamento?'],work:['Que horas começa meu turno?','Quando começa meu turno?'],introduce:['Meu nome é Alex.','Eu sou Alex.'],water:['Pode me trazer água, por favor?','Eu gostaria de água, por favor.'],thanks:['Muito obrigado.','Agradeço muito.'],directions:['Onde fica o ponto de ônibus?','Você pode me dizer onde fica o ponto de ônibus?'],clarify:['Pode repetir, por favor?','Você pode falar de novo?']},
 de:{price:['Wie viel kostet das?','Was kostet das?'],hours:['Wann öffnen Sie?','Um wie viel Uhr machen Sie auf?'],work:['Wann beginnt meine Schicht?','Um wie viel Uhr fängt meine Schicht an?'],introduce:['Ich heiße Alex.','Mein Name ist Alex.'],water:['Könnte ich bitte Wasser bekommen?','Ich hätte gern Wasser, bitte.'],thanks:['Vielen Dank.','Danke schön.'],directions:['Wo ist die Bushaltestelle?','Könnten Sie mir sagen, wo die Bushaltestelle ist?'],clarify:['Könnten Sie das bitte wiederholen?','Können Sie das noch einmal sagen?']},
 it:{price:['Quanto costa questo?','Qual è il prezzo?'],hours:['A che ora aprite?','Qual è il vostro orario?'],work:['A che ora inizia il mio turno?','Quando comincia il mio turno?'],introduce:['Mi chiamo Alex.','Sono Alex.'],water:["Potrei avere dell’acqua, per favore?","Vorrei dell’acqua, per favore."],thanks:['Grazie mille.','La ringrazio molto.'],directions:["Dov’è la fermata dell’autobus?","Mi può dire dov’è la fermata dell’autobus?"],clarify:['Può ripetere, per favore?','Può dirlo di nuovo?']}
};
const topics:readonly Topic[]=['water','thanks','directions','clarify','introduce','price','hours','work'];
const stages:readonly CourseStage[]=['listen','repeat','recall','checkpoint'];
export const extendedOfflineLessons:readonly OfflineLesson[]=targetLanguages.flatMap(language=>topics.map((topic,index)=>{
 const alternatives=examples[language][topic];
 const exercises:CourseExercise[]=stages.map((stage,n)=>({id:`${language}-${topic}-${stage}-${n+1}`,type:stage,utterance:alternatives[0]!,alternatives,meaning:goals[topic]}));
 return {id:`${language}-a1-${topic}`,language,band:'A1',goal:goals[topic],context:topic,exercises,
  prerequisite:index===0?`${language}-a1-help`:`${language}-a1-${topics[index-1]}`,focusTag:topic,attribution:'original' as const};
}));
