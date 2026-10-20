/** Editorial-only A1 preview adapter. Never feeds unreviewed lessons into the live tutor. */
import {a1EditorialDrafts,type A1EditorialDraft} from './course-content-a1-drafts.js';
import {a1HelpFor,a1HelpSkills,type A1HelpLanguage,type A1HelpSkill,type A1HelpTopic} from './a1-known-language-help.js';
import type {TargetLanguage} from './types.js';

export type A1PreviewStatus='editorial-only';
export interface A1LocalizedPreview {
 knownLanguage:A1HelpLanguage;
 targetLanguage:TargetLanguage;
 unitId:A1HelpTopic;
 status:A1PreviewStatus;
 revision:string;
 outcome:string;
 grammarFocus:string;
 dialogue:readonly [string,string];
 activities:readonly {skill:A1HelpSkill;instruction:string;draftPrompt:string}[];
 audioStatus:'not-recorded';
 rightsStatus:'pending-editorial-clearance';
 editorialStatus:'not-human-reviewed';
 editorialWarning:string;
 audioFallback:string;
}
/** Returns null rather than pretending an absent or unreviewed pair is a lesson. */
export function a1LocalizedPreview(knownLanguage:A1HelpLanguage,targetLanguage:TargetLanguage,unitId:A1HelpTopic):A1LocalizedPreview|null {
 const seed:A1EditorialDraft|undefined=a1EditorialDrafts.find(row=>row.targetLanguage===targetLanguage&&row.unitId===unitId);
 if(!seed||seed.status!=='draft'||seed.audioStatus!=='not-recorded'||seed.rightsStatus!=='pending-editorial-clearance'||seed.editorialStatus!=='not-human-reviewed')return null;
 const intro=a1HelpFor(knownLanguage,targetLanguage,unitId,'listening');
 if(!intro)return null;
 const activities=a1HelpSkills.map(skill=>{
  const help=a1HelpFor(knownLanguage,targetLanguage,unitId,skill);
  const activity=seed.activities.find(row=>row.skill===skill);
  if(!help||!activity)return null;
  return {skill,instruction:help.instruction,draftPrompt:activity.prompt};
 });
 if(activities.some(row=>!row))return null;
 return {
  knownLanguage,targetLanguage,unitId,status:'editorial-only',revision:seed.revision,
  outcome:seed.outcomes[0]??'',grammarFocus:seed.grammarFocus,
  dialogue:seed.dialogue,activities:activities as A1LocalizedPreview['activities'],
  audioStatus:seed.audioStatus,rightsStatus:seed.rightsStatus,editorialStatus:seed.editorialStatus,
  editorialWarning:intro.editorialWarning,audioFallback:intro.audioFallback
 };
}
