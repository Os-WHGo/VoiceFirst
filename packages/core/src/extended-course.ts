/** Original, offline micro-lessons authored for VoiceFirst. Not CEFR-certified. */
import {targetLanguages,type TargetLanguage} from './types.js';
import type {OfflineLesson,LocalizedText,CourseStage,CourseExercise} from './course.js';
const t=(en:string,fr:string,es:string,pt:string,de:string,it:string):LocalizedText=>({'en-CA':en,'fr-CA':fr,es,'pt-BR':pt,de,it});
type Topic='water'|'thanks'|'directions'|'clarify'|'introduce';
const goals:Record<Topic,LocalizedText>={
 water:t('Order water politely','Demander de l’eau poliment','Pedir agua con cortesía','Pedir água com educação','Höflich Wasser bestellen','Chiedere acqua con cortesia'),
 thanks:t('Thank someone and respond','Remercier et répondre','Agradecer y responder','Agradecer e responder','Sich bedanken und antworten','Ringraziare e rispondere'),
 directions:t('Ask for directions','Demander son chemin','Pedir indicaciones','Pedir orientações','Nach dem Weg fragen','Chiedere indicazioni'),
 clarify:t('Ask someone to repeat','Demander de répéter','Pedir que repitan','Pedir para repetir','Um Wiederholung bitten','Chiedere di ripetere'),
 introduce:t('Introduce yourself','Se présenter','Presentarse','Apresentar-se','Sich vorstellen','Presentarsi')
};
const examples:Record<TargetLanguage,Record<Topic,readonly string[]>>={
 'en-CA':{introduce:['My name is Alex.','I am Alex.'],water:['Could I have some water, please?','Can I have some water, please?'],thanks:['Thank you very much.','Thanks a lot.'],directions:['Where is the bus stop?','Could you tell me where the bus stop is?'],clarify:['Could you say that again, please?','Could you repeat that, please?']},
 'fr-CA':{introduce:['Je m’appelle Alex.','Moi, c’est Alex.'],water:["Est-ce que je pourrais avoir de l’eau, s’il vous plaît ?","Je voudrais de l’eau, s’il vous plaît."],thanks:['Merci beaucoup.','Merci bien.'],directions:["Où est l’arrêt d’autobus ?","Pourriez-vous me dire où se trouve l’arrêt d’autobus ?"],clarify:['Pourriez-vous répéter, s’il vous plaît ?','Est-ce que vous pourriez redire ça ?']},
 es:{introduce:['Me llamo Alex.','Soy Alex.'],water:['¿Me puede traer agua, por favor?','Quisiera agua, por favor.'],thanks:['Muchas gracias.','Te lo agradezco.'],directions:['¿Dónde está la parada de autobús?','¿Me puede indicar dónde está la parada de autobús?'],clarify:['¿Puede repetirlo, por favor?','¿Me lo puede decir otra vez?']},
 'pt-BR':{introduce:['Meu nome é Alex.','Eu sou Alex.'],water:['Pode me trazer água, por favor?','Eu gostaria de água, por favor.'],thanks:['Muito obrigado.','Agradeço muito.'],directions:['Onde fica o ponto de ônibus?','Você pode me dizer onde fica o ponto de ônibus?'],clarify:['Pode repetir, por favor?','Você pode falar de novo?']},
 de:{introduce:['Ich heiße Alex.','Mein Name ist Alex.'],water:['Könnte ich bitte Wasser bekommen?','Ich hätte gern Wasser, bitte.'],thanks:['Vielen Dank.','Danke schön.'],directions:['Wo ist die Bushaltestelle?','Könnten Sie mir sagen, wo die Bushaltestelle ist?'],clarify:['Könnten Sie das bitte wiederholen?','Können Sie das noch einmal sagen?']},
 it:{introduce:['Mi chiamo Alex.','Sono Alex.'],water:["Potrei avere dell’acqua, per favore?","Vorrei dell’acqua, per favore."],thanks:['Grazie mille.','La ringrazio molto.'],directions:["Dov’è la fermata dell’autobus?","Mi può dire dov’è la fermata dell’autobus?"],clarify:['Può ripetere, per favore?','Può dirlo di nuovo?']}
};
const topics:readonly Topic[]=['water','thanks','directions','clarify','introduce'];
const stages:readonly CourseStage[]=['listen','repeat','recall','checkpoint'];
export const extendedOfflineLessons:readonly OfflineLesson[]=targetLanguages.flatMap(language=>topics.map((topic,index)=>{
 const alternatives=examples[language][topic];
 const exercises:CourseExercise[]=stages.map((stage,n)=>({id:`${language}-${topic}-${stage}-${n+1}`,type:stage,utterance:alternatives[0]!,alternatives,meaning:goals[topic]}));
 return {id:`${language}-a1-${topic}`,language,band:'A1',goal:goals[topic],context:topic,exercises,
  prerequisite:index===0?`${language}-a1-help`:`${language}-a1-${topics[index-1]}`,focusTag:topic,attribution:'original' as const};
}));
