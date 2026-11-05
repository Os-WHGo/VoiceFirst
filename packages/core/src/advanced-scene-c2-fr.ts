/** Scènes C2 originales en français canadien; aucune approbation ni voix enregistrée. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c2ListeningFrench=[
 {
  level:'C2',unitId:'idiomatic-mastery',title:'Entente entre organismes',
  context:'Deux collègues interprètent des expressions imagées lors d’une réunion fictive.',
  turns:[
   ['speaker-a','Quand la présidente a dit qu’on risquait de couper les ponts, parlait-elle des infrastructures ?'],
   ['speaker-b','Non. Elle évoquait une rupture de partenariat qui pourrait empêcher une collaboration future.'],
   ['speaker-a','Une traduction littérale ferait donc perdre le sens de son avertissement.'],
   ['speaker-b','Dans le compte rendu, il faut parler du risque de compromettre les relations, pas de la sécurité d’un pont.'],
   ['speaker-a','Elle a aussi dit qu’il fallait garder une carte dans notre manche. De quoi s’agissait-il ?'],
   ['speaker-b','Ici, cela signifie conserver un argument décisif pour une discussion ultérieure, non cacher un véritable jeu de cartes.']
  ],
  checks:[
   [1,'Quelle conséquence relationnelle évoque la première expression ?','empêcher une collaboration future',
    'Une rupture brutale pourrait fermer la porte à de nouveaux accords.','Le personnel doit inspecter un ouvrage de génie civil.'],
   [3,'Quel risque doit figurer dans le compte rendu ?','compromettre les relations',
    'Le compte rendu doit exprimer une difficulté diplomatique.','Le compte rendu doit annoncer la fermeture du pont.'],
   [5,'Que signifie la seconde expression dans ce contexte ?','conserver un argument décisif',
    'Une ressource argumentative est gardée pour le bon moment.','Une personne garde secrètement des cartes de jeu.']
  ],
  spokenFollowUp:'Expliquez les deux images à une personne qui les prendrait au pied de la lettre.',
  noMicAlternative:'Rédigez un bref compte rendu fictif qui remplace les images par leur sens précis.'
 },
 {
  level:'C2',unitId:'subtle-implications',title:'Compte rendu du comité',
  context:'Deux collègues discutent des limites d’une interprétation de ton.',
  turns:[
   ['speaker-a','La présidente a qualifié notre projet d’audacieux, puis a suspendu l’échange. Est-ce un accord ?'],
   ['speaker-b','Après un silence prolongé, elle a demandé un nouvel examen au lieu d’organiser un vote.'],
   ['speaker-a','Devrait-on interpréter ce silence comme un rejet ?'],
   ['speaker-b','Il pourrait s’agir d’un report courtois, mais ce silence ne suffit pas à connaître ses intentions personnelles.'],
   ['speaker-a','Comment rédiger une synthèse fidèle sans lui attribuer un motif ?'],
   ['speaker-b','Indiquons simplement qu’aucun vote n’a eu lieu et qu’un nouvel examen a été demandé, sans inventer d’opposition cachée.']
  ],
  checks:[
   [1,'Quelle mesure a remplacé un vote ?','un nouvel examen au lieu d’organiser un vote',
    'La décision a été reportée plutôt que formellement approuvée.','Le comité a voté unanimement en faveur du projet.'],
   [3,'Que ne permet pas de savoir le silence observé ?','ne suffit pas à connaître ses intentions personnelles',
    'Un indice de ton ne prouve pas une intention privée.','Le silence confirme une opposition personnelle définitive.'],
   [5,'Quels faits le document officiel peut-il mentionner ?','aucun vote n’a eu lieu et qu’un nouvel examen a été demandé',
    'La synthèse doit distinguer les faits observés des suppositions.','Le procès-verbal doit inscrire un refus qui ne fut pas voté.']
  ],
  spokenFollowUp:'Résumez les faits observables puis, séparément, une interprétation avec réserve.',
  noMicAlternative:'Rédigez deux phrases factuelles et une hypothèse explicitement incertaine.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
