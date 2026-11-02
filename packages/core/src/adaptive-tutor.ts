/** Deterministic offline tutoring selector over reviewed dialogue content.
 * Personal priorities reorder practice; they never remove foundation coverage.
 * No arbitrary speech is graded semantically and no child safety gate is bypassed.
 */
import type {TargetLanguage} from './types.js';
import type {AgeStage} from './learning-paths.js';
import type {LocalLearningProgress} from './learning-progress.js';
import {selectGuidedDialogues,type LearningFocus,type DialogueTurn,type DialogueDomain} from './guided-dialogues.js';

export interface TutorPracticeHistory {
  /** Number of successfully demonstrated turns, keyed by authored turn ID. */
  successes:Readonly<Record<string,number>>;
  /** Number of confidently observed retries, keyed by authored turn ID. */
  retries:Readonly<Record<string,number>>;
  /** Most recent practiced turn, to avoid immediate repetition where possible. */
  lastTurnId?:string;
}
/** Derive tutor selection evidence from the persisted, versioned dialogue snapshot. */
export function practiceHistoryFromProgress(progress:LocalLearningProgress):TutorPracticeHistory {
 const successes:Record<string,number>={};
 const retries:Record<string,number>={};
 for(const saved of Object.values(progress.dialogues)){
  for(const id of saved.run.acceptedTurnIds)successes[id]=(successes[id]||0)+1;
  for(const [id,n] of Object.entries(saved.run.attempts)){
   retries[id]=(retries[id]||0)+Math.max(0,n-(saved.run.acceptedTurnIds.includes(id)?1:0));
  }
 }
 return {successes,retries,lastTurnId:progress.lastDialogueId ? (()=>{const ids=Object.values(progress.dialogues).find(x=>x.run.dialogueId===progress.lastDialogueId)?.run.acceptedTurnIds;return ids?.[ids.length-1];})():undefined};
}
export type NextTutorPractice=
 |{status:'requires-child-safety-review'|'no-authored-content'}
 |{status:'ready';turn:DialogueTurn;domain:DialogueDomain;reason:'reinforce'|'priority'|'coverage'|'variation'};
export function selectNextTutorPractice(target:TargetLanguage,focus:LearningFocus,ageStage:AgeStage,history:TutorPracticeHistory):NextTutorPractice{
 const selection=selectGuidedDialogues(target,focus,ageStage);
 if(selection.status!=='available')return {status:'requires-child-safety-review'};
 const options=selection.dialogues.flatMap(d=>d.turns.map(turn=>({turn,domain:d.domain})));
 if(!options.length)return {status:'no-authored-content'};
 const preferred=focus==='work'?'work':focus==='travel'?'travel':focus==='daily-life'?'foundation':undefined;
 const score=(item:typeof options[number]):number=>{
  const successes=Math.max(0,history.successes[item.turn.id]||0);
  const retries=Math.max(0,history.retries[item.turn.id]||0);
  // Gaps dominate interest: every skill remains reachable as practice progresses.
  return successes*100-retries*12-(item.domain===preferred?15:0)+(item.turn.id===history.lastTurnId?20:0);
 };
 const ranked=[...options].sort((a,b)=>score(a)-score(b)||a.turn.id.localeCompare(b.turn.id));
 const chosen=ranked[0]!;
 const successes=history.successes[chosen.turn.id]||0;
 const retries=history.retries[chosen.turn.id]||0;
 return {status:'ready',turn:chosen.turn,domain:chosen.domain,
  reason:retries>successes?'reinforce':successes===0?(chosen.domain===preferred?'priority':'coverage'):'variation'};
}
