/** Scènes A1 originales en français canadien, non révisées et sans audio. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsFrench:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
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
