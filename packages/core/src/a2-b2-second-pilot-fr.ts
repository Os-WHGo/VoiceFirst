/** Deuxièmes dialogues éditoriaux originaux en français canadien.
 * Scripts à réviser : aucune voix enregistrée ni approbation publique.
 */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const secondPilotFrench={
 A2:{
  unitId:'housing-and-services',
  continuation:[
   'Merci. Dois-je rester sur place pendant toute la matinée ?',
   'Pas nécessairement. Nous devons encore confirmer une plage horaire avec la personne responsable.',
   'Comment saurai-je quand la visite est prévue ?',
   'Nous vous enverrons un message quand l’heure sera confirmée. Aucun rendez-vous précis n’est fixé pour le moment.'
  ],
  checks:[
   ['À quel moment la visite a-t-elle été proposée initialement ?','demain matin','La visite a déjà été confirmée pour ce soir.'],
   ['Quel détail doit encore être établi ?','encore confirmer une plage horaire','Une heure exacte a déjà été fixée et communiquée.'],
   ['Un rendez-vous précis a-t-il été fixé ?','Aucun rendez-vous précis n’est fixé','La personne sait déjà à quelle minute arrivera le technicien.']
  ],
  spokenFollowUp:'Décrivez une panne domestique fictive, demandez une visite et distinguez un moment proposé d’un rendez-vous confirmé.',
  noMicAlternative:'Rédigez une demande de réparation fictive et une réponse qui indique clairement que l’heure reste à confirmer.'
 },
 B1:{
  unitId:'handling-unexpected-situations',
  continuation:[
   'Pourrait-on vérifier si la petite salle est libre et accessible avant d’y inviter le groupe ?',
   'Je peux demander à la coordination, mais nous n’avons pas encore l’autorisation.',
   'Que devrions-nous annoncer aux participantes et participants en attendant ?',
   'Précisons que le lieu reste à confirmer; nous informerons le groupe quand la coordination aura répondu.'
  ],
  checks:[
   ['À quelle condition la petite salle pourrait-elle servir ?','si elle est libre','La petite salle a déjà été réservée et approuvée.'],
   ['La solution de rechange a-t-elle reçu une autorisation ?','n’avons pas encore l’autorisation','La coordination a déjà approuvé le déménagement du groupe.'],
   ['Quand le groupe recevra-t-il l’information définitive ?','quand la coordination aura répondu','Le lieu est annoncé comme définitif avant toute confirmation.']
  ],
  spokenFollowUp:'Expliquez une fermeture inattendue dans un atelier fictif et présentez des solutions sans annoncer une salle non autorisée.',
  noMicAlternative:'Rédigez un avis fictif au groupe en séparant la fermeture confirmée de la solution qui attend encore une réponse.'
 },
 B2:{
  unitId:'complex-instructions',
  continuation:[
   'Où faut-il chercher le numéro avant de poursuivre la procédure ?',
   'Compare le numéro de la demande avec celui du registre interne, sans te fier uniquement à une estimation verbale.',
   'Et si les deux numéros correspondent, puis-je éviter la dernière vérification ?',
   'Non. Cette correspondance permet seulement de passer à la révision par la personne responsable; elle n’autorise pas l’approbation.'
  ],
  checks:[
   ['Quand faut-il suspendre la demande initiale ?',"S'il diffère, suspends la demande",'Une différence peut être ignorée si le formulaire semble correct.'],
   ['Quelle source faut-il consulter pour vérifier le numéro ?','registre interne','Un renseignement oral non vérifié suffit pour poursuivre.'],
   ['La correspondance des numéros constitue-t-elle une approbation ?','n’autorise pas l’approbation','La correspondance donne automatiquement le pouvoir de signer la demande.']
  ],
  spokenFollowUp:'Expliquez une procédure fictive à plusieurs étapes, préservez la condition d’arrêt et séparez comparaison et autorisation.',
  noMicAlternative:'Écrivez une procédure fictive précisant la vérification du numéro, l’arrêt en cas d’écart et l’approbation finale.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
