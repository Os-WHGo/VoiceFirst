/** Deterministic offline tutoring selector over reviewed dialogue content.
 * Personal priorities reorder practice; they never remove foundation coverage.
 * No arbitrary speech is graded semantically and no child safety gate is bypassed.
 */
import type {TargetLanguage} from './types.js';
import type {AgeStage} from './learning-paths.js';
import {selectGuidedDialogues,type LearningFocus,type DialogueTurn,type DialogueDomain} from './guided-dialogues.js';

export interface TutorPracticeHistory {
  /** Number of successfully demonstrated turns, keyed by authored turn ID. */
  successes:Readonly<Record<string,number>>;
  /** Number of confidently observed retries, keyed by authored turn ID. */
  retries:Readonly<Record<string,number>>;
  /** Most recent practiced turn, to avoid immediate repetition where possible. */
  lastTurnId?:string;
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
