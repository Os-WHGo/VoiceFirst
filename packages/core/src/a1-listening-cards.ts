/** Safe editorial listening view: verified local files do not imply publication rights. */
import {a1ListeningAvailability} from './a1-listening-availability.js';
import type {A1AudioLocalAudit} from './a1-audio-local-audit.js';
export type A1ListeningState='missing-audio'|'editorial-preview-only';
export interface A1ListeningCard {
 targetLanguage:string;unitId:string;state:A1ListeningState;
 verifiedUtterances:number;requiredUtterances:number;
 canPlayInPublicApp:false;canAssessListening:false;
}
export function a1ListeningCards(audit:A1AudioLocalAudit):readonly A1ListeningCard[]{
 return a1ListeningAvailability(audit).map(unit=>({
  targetLanguage:unit.targetLanguage,unitId:unit.unitId,
  state:unit.editorialPreviewAvailable?'editorial-preview-only':'missing-audio',
  verifiedUtterances:unit.verifiedCount,requiredUtterances:unit.required.length,
  canPlayInPublicApp:false,canAssessListening:false
 }));
}
