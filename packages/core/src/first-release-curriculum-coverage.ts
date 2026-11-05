/** Honest first-release authoring coverage, separate from learner/course availability.
 * A0 is an internal onboarding track and intentionally excluded from CEFR A1–C2 math.
 * Counts editorial drafts only. It cannot approve audio, review, assessments or launch.
 */
import {firstReleaseLanguages} from './first-release-languages.js';
import {officialCefrBands,curriculumUnitBlueprint,auditCurriculumProduction,type ProductionUnit} from './learning-paths.js';
import {a1EditorialDrafts} from './course-content-a1-drafts.js';
import {a2EditorialDrafts} from './a2-editorial-contract.js';
import {b1EditorialDrafts} from './b1-editorial-contract.js';
import {b2EditorialDrafts} from './b2-editorial-contract.js';
import {advancedEditorialDrafts} from './advanced-editorial-contract.js';
type FirstTarget=(typeof firstReleaseLanguages)[number];
type Level=(typeof officialCefrBands)[number];
export interface FirstReleaseEditorialCell{
 targetLanguage:FirstTarget;level:Level;plannedUnits:number;
 draftUnits:number;missingUnits:number;documentedReviews:number;
 verifiedAudioTurns:0;publicAvailable:false;
}
const originals:readonly ProductionUnit[]=[
 ...a1EditorialDrafts,...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts,...advancedEditorialDrafts
];
/** Even a structurally valid report is NOT a licence to publish or claim B2/C2 mastery. */
export function auditFirstReleaseEditorialCoverage(input:unknown=originals){
 const generic=auditCurriculumProduction(input);
 const rows=Array.isArray(input)?input.filter((row):row is ProductionUnit=>
  row!==null&&typeof row==='object'&&!Array.isArray(row)&&
  typeof row.targetLanguage==='string'&&typeof row.level==='string'&&
  typeof row.unitId==='string'&&(row.status==='draft'||row.status==='reviewed')):[];
 const errors=[...generic.errors];
 const cells:FirstReleaseEditorialCell[]=firstReleaseLanguages.flatMap(targetLanguage=>
  officialCefrBands.map(level=>{
   const planned=curriculumUnitBlueprint[level];
   const found=rows.filter(row=>row.targetLanguage===targetLanguage&&row.level===level&&
    planned.some(id=>id===row.unitId));
   const drafts=found.filter(row=>row.status==='draft');
   const reviewed=found.filter(row=>row.status==='reviewed');
   return {targetLanguage,level,plannedUnits:planned.length,draftUnits:drafts.length,
    missingUnits:Math.max(0,planned.length-found.length),
    documentedReviews:reviewed.length,verifiedAudioTurns:0 as const,publicAvailable:false as const};
  }));
 const expected=cells.reduce((n,c)=>n+c.plannedUnits,0);
 const drafted=cells.reduce((n,c)=>n+c.draftUnits,0);
 const reviewed=cells.reduce((n,c)=>n+c.documentedReviews,0);
 const missing=cells.reduce((n,c)=>n+c.missingUnits,0);
 return {valid:errors.length===0,errors,cells,expectedCefrUnits:expected,
  editorialDraftUnits:drafted,documentedReviewUnits:reviewed,missingUnits:missing,
  editorialCoveragePercent:expected>0?Math.round(1000*drafted/expected)/10:0,
  verifiedAudioTurns:0 as const,readyForPublicRelease:false as const,
  note:'Draft coverage is NOT student progress, approved curriculum, audio availability, or certification.' as const};
}
