/** Continuations originales en français canadien, brouillons non validés. */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const expandedPilotFrench={
 A2:{
  unitId:'plans-and-invitations',
  continuation:[
   'Dimanche, ça me convient. Est-ce que le musée est ouvert en après-midi ?',
   'Selon l’horaire affiché, il ouvre à treize heures. On pourrait se retrouver à l’entrée à quatorze heures.',
   'Quatorze heures, ça marche, mais vérifions que les heures d’ouverture n’ont pas changé.',
   'D’accord. Je vais vérifier l’horaire avant de confirmer et t’aviser si nous devons modifier le plan.'
  ],
  checks:[
   ['Quel autre jour a été proposé après la première invitation ?','dimanche','La visite du samedi est définitivement confirmée.'],
   ['À quelle heure la rencontre est-elle proposée ?','à quatorze heures','Les deux personnes se retrouveront à neuf heures du matin.'],
   ['Que faut-il vérifier avant de confirmer la visite ?','vérifier l’horaire avant de confirmer','Les horaires du musée ne jouent aucun rôle dans le plan.']
  ],
  spokenFollowUp:'Invitez un personnage fictif, expliquez un conflit d’horaire et convenez d’une solution sous condition.',
  noMicAlternative:'Écrivez deux messages fictifs : une invitation et une réponse proposant un autre jour et une heure.'
 },
 B1:{
  unitId:'workplace-collaboration',
  continuation:[
   'Je peux préparer la salle avant la réunion, mais peux-tu préciser quel matériel tu vérifieras ?',
   'Je vais tester le projecteur et les microphones après le dîner, puis t’envoyer un compte rendu avant l’arrivée du groupe.',
   'Si le projecteur ne fonctionne pas, dois-je installer un écran de secours ou attendre ton message ?',
   'Prépare l’écran de secours si le test échoue. Je te confirmerai le résultat, sans présumer que tout fonctionne.'
  ],
  checks:[
   ['Quand la vérification du matériel est-elle prévue ?','après le dîner','Les tests sont déjà terminés et tous les appareils fonctionnent.'],
   ['Quel matériel doit être vérifié ?','projecteur et les microphones','La personne va réparer la connexion électrique du bâtiment.'],
   ['Dans quel cas faut-il préparer un écran de secours ?','si le test échoue','Il faut utiliser l’écran de secours même si le projecteur fonctionne.']
  ],
  spokenFollowUp:'Confirmez la répartition des tâches, le moment des vérifications et la condition du plan de secours.',
  noMicAlternative:'Rédigez une note de relève fictive précisant les responsables et la condition pour utiliser un écran de secours.'
 },
 B2:{
  unitId:'argument-and-evidence',
  continuation:[
   'Quelles données permettraient une décision plus juste pour les personnes qui voyagent en dehors des heures habituelles ?',
   'Demandons l’avis des voyageurs en soirée et comparons l’achalandage de plusieurs jours de semaine, pas d’un seul soir.',
   'Ces chiffres suffiraient-ils à prouver qu’il faut conserver le service en permanence ?',
   'Non. Il faut aussi évaluer les coûts et l’accessibilité. Notre recommandation restera provisoire jusqu’à la fin de l’analyse.'
  ],
  checks:[
   ['Quel groupe n’a pas participé au premier sondage ?','personnes qui voyagent en soirée','Tous les usagers du service tardif ont participé au sondage.'],
   ['Quelles données supplémentaires sont suggérées ?','plusieurs jours de semaine','Une seule soirée très occupée est une preuve suffisante.'],
   ['Quel statut doit garder la recommandation ?','restera provisoire','Le service permanent est déjà autorisé sans conditions.']
  ],
  spokenFollowUp:'Formulez une recommandation prudente qui distingue la représentativité, les données manquantes et les compromis.',
  noMicAlternative:'Écrivez un avis fictif distinguant les observations vérifiées, les limites du sondage et la décision conditionnelle.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
