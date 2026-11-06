/** Scènes A1 originales en français canadien, non révisées et sans audio. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsFrench:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
 'numbers-time-and-dates':{
  continuation:[
   "Le cours est dans la salle trois ou dans la salle quatre ?",
   "Le cours est dans la salle trois lundi.",
   "Pouvez-vous répéter le jour et l’heure pour mon amie ?",
   "Bien sûr. Lundi à deux heures, dans la salle trois.",
  ],
  checks:[
   ["À quelle heure le cours commence-t-il ?", "deux heures de l’après-midi.", "Le cours commence à neuf heures du matin."],
   ["Dans quelle salle aura lieu le cours ?", "dans la salle trois lundi.", "Le cours du lundi aura lieu dans la salle quatre."],
   ["Quelles informations sont répétées pour l’amie ?", "Lundi à deux heures, dans la salle trois.", "On lui indique le mardi à seize heures."],
  ],
  spokenFollowUp:"Confirmez le jour, l’heure et la salle d’un cours fictif, puis demandez poliment de répéter ces informations.",
  noMicAlternative:"Écrivez deux messages fictifs confirmant le jour du cours, son heure de début et son numéro de salle.",
  mediationPrompt:"Expliquez à une personne fictive qui a manqué le cours le jour, l’heure et la salle, sans utiliser un vrai horaire."
 },
 'family-and-people':{
  continuation:[
   "Est-ce que Sam aime visiter le jardin communautaire ?",
   "Oui, Sam aime le jardin et apporte un petit carnet.",
   "Puis-je inviter Sam à notre rencontre fictive ?",
   "Oui, Sam peut venir samedi après-midi.",
  ],
  checks:[
   ["Quel est le lien de parenté entre Sam et la personne ?", "mon cousin.", "Sam est présenté comme son professeur."],
   ["Qu’est-ce que Sam apporte au jardin ?", "un petit carnet.", "Sam apporte une grande valise au jardin."],
   ["Quand Sam peut-il venir à la rencontre fictive ?", "samedi après-midi.", "Sam ne peut venir que mercredi matin."],
  ],
  spokenFollowUp:"Présentez un cousin fictif avec respect, décrivez une activité appréciée et invitez cette personne à une rencontre.",
  noMicAlternative:"Écrivez une courte description fictive de Sam et deux messages au sujet d’une invitation au groupe.",
  mediationPrompt:"Expliquez à une personne fictive qui est Sam, son activité préférée et le moment prévu pour la rencontre."
 },
 'daily-routines':{
  continuation:[
   "Est-ce que l’autobus part avant huit heures ?",
   "Oui, il part à sept heures et demie de l’arrêt.",
   "Que faites-vous quand vous arrivez au travail ?",
   "Je lis un livre avant de commencer à neuf heures.",
  ],
  checks:[
   ["Quelle activité suit le déjeuner ?", "puis je prends l’autobus.", "La personne retourne se coucher après le déjeuner."],
   ["À quelle heure l’autobus part-il ?", "à sept heures et demie", "L’autobus part à neuf heures trente."],
   ["Que fait la personne avant de commencer le travail ?", "Je lis un livre avant de commencer à neuf heures.", "La personne va faire du sport après sa journée."],
  ],
  spokenFollowUp:"Décrivez trois actions d’une matinée fictive avec leurs heures, puis demandez à quelle heure passe l’autobus.",
  noMicAlternative:"Écrivez un horaire fictif de trois phrases avec déjeuner, trajet en autobus et début du travail.",
  mediationPrompt:"Présentez dans l’ordre le déjeuner, l’autobus et la lecture d’un personnage fictif à une autre personne."
 },
 'basic-needs-and-help':{
  continuation:[
   "Merci. Où se trouve la date sur le billet ?",
   "La date est inscrite en haut, à côté du numéro.",
   "Pouvez-vous répéter cela un peu plus lentement ?",
   "Oui. Regardez en haut du billet, à côté du numéro.",
  ],
  checks:[
   ["Comment la personne propose-t-elle d’expliquer le billet ?", "expliquer doucement.", "La personne refuse de donner des explications."],
   ["Où se trouve la date sur le billet ?", "en haut, à côté du numéro.", "La date se trouve derrière le billet sous le code-barres."],
   ["Que doit-on regarder à nouveau ?", "en haut du billet, à côté du numéro.", "La personne doit regarder sous le billet par terre."],
  ],
  spokenFollowUp:"Demandez poliment de l’aide avec un billet fictif, cherchez la date et demandez une explication plus lente.",
  noMicAlternative:"Écrivez une courte demande d’aide fictive et une deuxième phrase pour demander de répéter lentement.",
  mediationPrompt:"Expliquez simplement à un visiteur fictif où se trouve la date sur son billet sans recueillir de données personnelles."
 },
 'personal-information':{
  continuation:[
   'Merci. Parlez-vous français au centre communautaire ?',
   'Oui, je parle français et j’apprends l’anglais cette année.',
   'Voulez-vous que je répète l’heure de notre cours fictif ?',
   'Oui, s’il vous plaît. Pouvez-vous répéter l’heure plus lentement ?'
  ],
  checks:[
   ['Dans quelle ville habite cette personne ?','J’habite à Montréal.','La personne affirme habiter à Québec.'],
   ['Quelle autre langue apprend la personne ?','j’apprends l’anglais cette année.','La personne affirme apprendre l’italien.'],
   ['Que demande la personne à la fin ?','répéter l’heure plus lentement ?','La personne demande une adresse résidentielle précise.']
  ],
  spokenFollowUp:'Présentez un personnage fictif avec son pays et sa ville, puis demandez poliment de répéter l’heure du cours.',
  noMicAlternative:'Écrivez deux phrases sur un pays et une ville imaginaires, puis une demande polie pour répéter l’heure.',
  mediationPrompt:'Indiquez à un personnage fictif la ville et la langue étudiée, sans lui demander d’adresse privée.'
 },
 'food-and-shopping':{
  continuation:[
   'Oui, merci. Je voudrais deux pommes, pas une seule.',
   'Deux pommes coûtent quatre dollars en tout.',
   'Est-ce que je peux aussi avoir un petit sac, s’il vous plaît ?',
   'Bien sûr. Le petit sac est gratuit aujourd’hui.'
  ],
  checks:[
   ['Combien coûte une seule pomme ?','deux dollars.','Une pomme coûte cinq dollars.'],
   ['Combien coûtent les deux pommes ?','quatre dollars en tout.','Les deux pommes coûtent trois dollars.'],
   ['Quel est le prix du petit sac ?','gratuit aujourd’hui.','Le petit sac coûte deux dollars.']
  ],
  spokenFollowUp:'Dans un magasin fictif, demandez deux pommes, vérifiez le prix total et demandez poliment un sac.',
  noMicAlternative:'Rédigez un échange fictif indiquant la quantité de deux pommes, leur prix et une demande de sac.',
  mediationPrompt:'Expliquez à un personnage fictif le prix d’une pomme, des deux pommes et du sac sans achat réel.'
 },
 'places-and-directions':{
  continuation:[
   'Après avoir tourné à gauche, la bibliothèque est-elle près du parc ?',
   'Oui. Elle est à côté du parc, en face d’un petit café.',
   'Dois-je traverser la rue au coin pour y aller ?',
   'Non. Restez de ce côté de la rue et suivez les panneaux.'
  ],
  checks:[
   ['Quelle est la deuxième instruction après avoir continué tout droit ?','tournez à gauche au coin.','Il faut tourner à droite sur le pont.'],
   ['Où est la bibliothèque par rapport au parc ?','à côté du parc,','La bibliothèque est loin du parc.'],
   ['Faut-il traverser la rue ?','Restez de ce côté de la rue','La personne doit traverser immédiatement la rue.']
  ],
  spokenFollowUp:'Demandez le chemin vers une bibliothèque fictive, reformulez deux instructions et vérifiez la traversée.',
  noMicAlternative:'Écrivez deux indications simples et une question pour confirmer si une traversée est nécessaire.',
  mediationPrompt:'Reformulez les deux étapes et la consigne de traversée pour un personnage fictif qui n’a pas entendu.'
 }
};
