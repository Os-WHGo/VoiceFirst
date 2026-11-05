/** Dialogues originaux C1 en français canadien. Brouillons non révisés, audio absent. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c1ListeningFrench=[
 {
  level:'C1',unitId:'nuance-and-register',title:'Bilan de la bibliothèque',
  context:'Deux responsables préparent une présentation fictive aux résidents.',
  turns:[
   ['speaker-a','Pour le bilan public, peut-on dire que le nouvel horaire est une réussite complète ?'],
   ['speaker-b','Il y a moins d’attente, mais les visiteurs qui ont besoin d’un accès sans marches trouvent encore l’entrée latérale verrouillée.'],
   ['speaker-a','Affirmer que tout le monde est satisfait serait donc poli, mais trompeur.'],
   ['speaker-b','Soulignons les progrès sans cacher que l’accès universel reste à régler.'],
   ['speaker-a','Faut-il conserver nos termes techniques devant les bénévoles ?'],
   ['speaker-b','Non. Présentons les résultats en langage clair et gardons du temps pour les questions sur les obstacles.']
  ],
  checks:[
   [1,'Quel obstacle demeure pour certains visiteurs ?','l’entrée latérale verrouillée',
    'L’horaire a aidé certaines personnes sans régler toutes les entraves.','Tous les obstacles ont été éliminés grâce au projet.'],
   [3,'Quelle réserve faut-il conserver dans le bilan ?','l’accès universel reste à régler',
    'La présentation doit reconnaître un problème persistant.','L’accès universel a été intégralement assuré.'],
   [5,'Quel registre est conseillé aux bénévoles ?','en langage clair',
    'Une formulation accessible peut rester exacte et nuancée.','Le public doit accepter tous les termes techniques.']
  ],
  spokenFollowUp:'Présentez les progrès à une résidente en reconnaissant clairement le problème d’accès.',
  noMicAlternative:'Rédigez un court bilan fictif : un progrès mesurable et une difficulté non résolue.'
 },
 {
  level:'C1',unitId:'implicit-meaning',title:'Atelier de soirée',
  context:'Une équipe interprète la réponse prudente de sa directrice.',
  turns:[
   ['speaker-a','La directrice a-t-elle approuvé le nouvel atelier en soirée ?'],
   ['speaker-b','Elle a parlé d’une possibilité, mais souhaite en reparler après l’approbation du plan de dotation.'],
   ['speaker-a','Ce serait donc prématuré de publier une date précise ?'],
   ['speaker-b','Tout à fait. J’ai entendu de l’intérêt, pas un engagement; l’effectif nécessaire reste à confirmer.'],
   ['speaker-a','Peut-on expliquer aux participants que nous étudions la proposition ?'],
   ['speaker-b','Oui, pourvu que nous disions qu’aucune date n’est confirmée et que nous donnerons des nouvelles après la révision.']
  ],
  checks:[
   [1,'À quelle condition le dossier sera-t-il repris ?','après l’approbation du plan de dotation',
    'La directrice diffère une décision liée au personnel disponible.','La directrice a déjà annoncé la date officielle.'],
   [3,'Quel degré d’accord a réellement été exprimé ?','de l’intérêt, pas un engagement',
    'Un accueil favorable ne constitue pas une promesse ferme.','La directrice s’est engagée à lancer l’atelier.'],
   [5,'Quelle information ne peut pas encore être donnée ?','aucune date n’est confirmée',
    'La communication doit préserver le statut provisoire du projet.','La date de début est maintenant définitive.']
  ],
  spokenFollowUp:'Expliquez la différence entre intérêt, report et approbation sans prêter une intention cachée.',
  noMicAlternative:'Écrivez un message fictif indiquant la condition restante et la prochaine mise à jour.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
