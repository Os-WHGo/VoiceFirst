/** Pedagogical parameters used by the offline engine, in one versioned object.
 * Curriculum and assessment criteria are ChatGPT's decision (VoiceFirst prompt V3, 23-10-2026). The values below are
 * PROVISIONAL engineering defaults so the engine can run and be tested; ChatGPT can approve or replace them without
 * code changes. Nothing here is a CEFR level, an exam score or a pronunciation measure.
 */
export type PolicyStatus='provisional-pending-chatgpt-approval'|'approved-by-chatgpt';
export interface PedagogyPolicy {
 id:string;
 version:string;
 status:PolicyStatus;
 /** Who approved it and when, once approved (ISO day). */
 approval?:{by:string;on:string};
 mastery:{
  /** Distinct days with an independent success needed for `consolidating`. */
  consolidatingDays:number;
  /** Minimum gap between two independent successes for `secure`. */
  secureGapDays:number;
  /** Recall probability needed to stay `secure`. */
  secureRecall:number;
  /** Below this recall probability a consolidated objective needs review. */
  reviewRecall:number;
 };
 activity:{
  /** Form or meaning errors that close an activity as not achieved. */
  maxErrors:number;
  /** Errors after which the model answer is offered (immediate and after-activity correction only). */
  offerModelAfterErrors:number;
  /** Share of a session reserved for due reviews. */
  reviewShare:number;
 };
 /** FSRS grade per achievement (1 again, 2 hard, 3 good); null means no schedule update. */
 grades:{independent:1|2|3;learnerConfirmed:1|2|3;afterRetry:1|2|3;assisted:1|2|3;notAchieved:1|2|3};
}
export const provisionalPedagogyPolicy:PedagogyPolicy=Object.freeze({
 id:'voicefirst-offline-engine',version:'0.1.0',status:'provisional-pending-chatgpt-approval' as const,
 mastery:Object.freeze({consolidatingDays:2,secureGapDays:7,secureRecall:0.85,reviewRecall:0.7}),
 activity:Object.freeze({maxErrors:3,offerModelAfterErrors:2,reviewShare:0.4}),
 grades:Object.freeze({independent:3,learnerConfirmed:3,afterRetry:2,assisted:2,notAchieved:1} as const),
});
/** Decisions taken provisionally by the engineering side that ChatGPT must confirm or change. */
export const pendingPedagogicalDecisions:readonly {id:string;where:string;summary:string}[]=Object.freeze([
 {id:'mastery-thresholds',where:'pedagogy-policy.ts mastery',summary:'Days and recall probabilities that separate practicing, consolidating, secure and needs-review.'},
 {id:'activity-retries',where:'pedagogy-policy.ts activity',summary:'Errors before closing an activity, when to offer the model answer, share of reviews per session.'},
 {id:'grade-mapping',where:'pedagogy-policy.ts grades',summary:'How independent, confirmed, assisted and failed results map to review scheduling.'},
 {id:'comprehension-checks',where:'learning-session.ts courseActivities',summary:'Listening-comprehension choice inserted after each listen step (can be disabled with comprehension:false).'},
 {id:'accepted-variants',where:'extended-course.ts variants/patterns',summary:'Gendered, regional and own-name answers accepted in the micro-course (es, pt-BR, it; six-language name slots).'},
 {id:'register-alternatives',where:'choice-activities.ts multiFunction',summary:'Options valid by register or region are reviewed, not marked wrong (e.g. Salut, Ciao as farewells).'},
 {id:'a0-asset-fixes',where:'mobile/assets A0 catalog',summary:'Proposed: replace the ambiguous farewell distractors and vary answer positions.'},
]);
export function validatePedagogyPolicy(p:PedagogyPolicy):PedagogyPolicy{
 const fail=(why:string)=>{throw new Error(`Invalid pedagogy policy: ${why}`);};
 if(!p||typeof p.id!=='string'||!/^[\w.-]{1,80}$/.test(p.id)||typeof p.version!=='string'||!/^\d+\.\d+\.\d+$/.test(p.version))fail('identity');
 if(p.status!=='provisional-pending-chatgpt-approval'&&p.status!=='approved-by-chatgpt')fail('status');
 if(p.status==='approved-by-chatgpt'&&!(p.approval&&typeof p.approval.by==='string'&&p.approval.by.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(p.approval.on)))fail('approval record');
 const m=p.mastery,a=p.activity,g=p.grades;
 const int=(n:unknown,min:number,max:number)=>Number.isSafeInteger(n)&&(n as number)>=min&&(n as number)<=max;
 const prob=(n:unknown)=>typeof n==='number'&&n>0&&n<1;
 if(!m||!int(m.consolidatingDays,1,30)||!int(m.secureGapDays,1,365)||!prob(m.secureRecall)||!prob(m.reviewRecall)||m.reviewRecall>m.secureRecall)fail('mastery');
 if(!a||!int(a.maxErrors,1,10)||!int(a.offerModelAfterErrors,1,10)||a.offerModelAfterErrors>a.maxErrors||typeof a.reviewShare!=='number'||a.reviewShare<0||a.reviewShare>1)fail('activity');
 if(!g||![g.independent,g.learnerConfirmed,g.afterRetry,g.assisted,g.notAchieved].every(x=>x===1||x===2||x===3))fail('grades');
 return p;
}
