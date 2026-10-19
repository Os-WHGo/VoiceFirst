/** VoiceFirst offline curriculum metadata. This module stores neither identity nor date of birth.
 * Age-sensitive access is intentionally conservative; child-facing distribution requires
 * consent/security/product review beyond this stateless course selector.
 */
import type { CefrBand, TargetLanguage, LearnerPreferences } from './types.js';

export const officialCefrBands = ['A1','A2','B1','B2','C1','C2'] as const;
export type AgeStage = 'preschool' | 'primary' | 'preteen' | 'teen' | 'adult';
export type TopicFamily = 'songs-and-stories'|'everyday-games'|'adventures'|'teen-interests'|'everyday-and-professional';

export interface AgeCourseProfile {
  stage: AgeStage;
  label: string;
  topicFamily: TopicFamily;
  /** Child-directed profiles require additional review and cannot use unrestricted AI. */
  guardianRequired: boolean;
  unrestrictedConversationEnabled: false;
  recommendedLessonMinutes: readonly number[];
  needsHumanReview: true;
}

/** The product asks for an age range, not a full birth date; no medical labels are required. */
export const ageCourseProfiles: Readonly<Record<AgeStage, AgeCourseProfile>> = {
  preschool: {stage:'preschool',label:'3–5',topicFamily:'songs-and-stories',guardianRequired:true,unrestrictedConversationEnabled:false,recommendedLessonMinutes:[3,5],needsHumanReview:true},
  primary: {stage:'primary',label:'6–9',topicFamily:'everyday-games',guardianRequired:true,unrestrictedConversationEnabled:false,recommendedLessonMinutes:[5,10],needsHumanReview:true},
  preteen: {stage:'preteen',label:'10–12',topicFamily:'adventures',guardianRequired:true,unrestrictedConversationEnabled:false,recommendedLessonMinutes:[5,10,15],needsHumanReview:true},
  teen: {stage:'teen',label:'13–17',topicFamily:'teen-interests',guardianRequired:false,unrestrictedConversationEnabled:false,recommendedLessonMinutes:[5,10,15],needsHumanReview:true},
  adult: {stage:'adult',label:'18+',topicFamily:'everyday-and-professional',guardianRequired:false,unrestrictedConversationEnabled:false,recommendedLessonMinutes:[5,10,15,30],needsHumanReview:true},
};

export interface LearnerCourseRoute {
  ageStage: AgeStage;
  knownLanguage: TargetLanguage;
  targetLanguage: TargetLanguage;
  cefr: CefrBand;
  preferredMinutes: number;
  accessibility: Pick<LearnerPreferences,'speechRate'|'answerWaitMode'|'correctionMode'|'interactionStyle'|'lowStimulation'>;
  guardianRequired: boolean;
  /** Availability only means curriculum supports this level conceptually, not authored course completeness. */
  curriculumStatus: 'planned';
}

export function planCourseRoute(ageStage: AgeStage, level: CefrBand, prefs: LearnerPreferences): LearnerCourseRoute {
  const age = ageCourseProfiles[ageStage];
  if (!age) throw new Error('Unknown age stage');
  if (prefs.nativeLanguage===prefs.target)throw new Error('Known and target language must differ');
  const minutes = age.recommendedLessonMinutes.reduce((best,n)=>Math.abs(n-prefs.microLessonMinutes)<Math.abs(best-prefs.microLessonMinutes)?n:best,age.recommendedLessonMinutes[0]!);
  return {ageStage, knownLanguage:prefs.nativeLanguage,targetLanguage:prefs.target,cefr:level,
    preferredMinutes:minutes,accessibility:{speechRate:prefs.speechRate,answerWaitMode:prefs.answerWaitMode,
    correctionMode:prefs.correctionMode,interactionStyle:prefs.interactionStyle,lowStimulation:prefs.lowStimulation},
    guardianRequired:age.guardianRequired,curriculumStatus:'planned'};
}

export type ExamPurpose = 'canada-express-entry'|'general'|'study'|'school';
export interface ExamPreparationTrack {
  id: string;
  language: TargetLanguage;
  label: string;
  purposes: readonly ExamPurpose[];
  url: string;
  /** We never issue official certificates or claim endorsement. */
  officialExamAffiliation: false;
  preparation: 'original-practice-planned';
  notes?: string;
}
const exam = (id:string,language:TargetLanguage,label:string,purposes:readonly ExamPurpose[],url:string,notes?:string):ExamPreparationTrack=>
  ({id,language,label,purposes,url,notes,officialExamAffiliation:false,preparation:'original-practice-planned'});
/** Verified official-program references. Exam practice content has not been authored or validated yet. */
export const examPreparationCatalog: readonly ExamPreparationTrack[] = [
  exam('celpip-general','en-CA','CELPIP-General',['canada-express-entry'],'https://www.celpip.ca/'),
  exam('ielts-general','en-CA','IELTS General Training',['canada-express-entry','general'],'https://ielts.org/'),
  exam('pte-core','en-CA','PTE Core',['canada-express-entry'],'https://www.pearsonpte.com/pte-core'),
  exam('ielts-academic','en-CA','IELTS Academic',['study'],'https://ielts.org/'),
  exam('toefl-ibt','en-CA','TOEFL iBT',['study'],'https://www.ets.org/toefl.html'),
  exam('cambridge','en-CA','Cambridge English A2–C2',['general','study','school'],'https://www.cambridgeenglish.org/exams-and-tests/qualifications/preparation/'),
  exam('tef-canada','fr-CA','TEF Canada',['canada-express-entry'],'https://www.lefrancaisdesaffaires.fr/tests-diplomes/test-evaluation-francais-tef/tef-canada/'),
  exam('tcf-canada','fr-CA','TCF Canada',['canada-express-entry'],'https://www.france-education-international.fr/test/tcf-canada'),
  exam('delf-dalf','fr-CA','DELF / DALF',['general','study','school'],'https://www.france-education-international.fr/diplome/delf-tout-public'),
  exam('dele','es','DELE A1–C2',['general','study','school'],'https://examenes.cervantes.es/es/dele/que-es'),
  exam('siele','es','SIELE',['general','study'],'https://siele.org/'),
  exam('celpe-bras','pt-BR','Celpe-Bras',['general','study'],'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/celpe-bras', 'Brazilian Portuguese; uses its own performance levels, not CEFR A1–C2.'),
  exam('caple','pt-BR','CAPLE (European Portuguese)',['general','study'],'https://caple.letras.ulisboa.pt/exames','European Portuguese; distinct from pt-BR. Informational reference only.'),
  exam('goethe','de','Goethe-Zertifikat A1–C2',['general','study','school'],'https://www.goethe.de/en/spr/prf.html'),
  exam('testdaf','de','TestDaF',['study'],'https://www.testdaf.de/'),
  exam('cils','it','CILS',['general','study'],'https://cils.unistrasi.it/'),
  exam('celi','it','CELI',['general','study'],'https://cvcl.unistrapg.it/'),
  exam('plida','it','PLIDA',['general','study'],'https://plida.it/'),
];
export function preparationFor(language: TargetLanguage, purpose?: ExamPurpose): ExamPreparationTrack[] {
  return examPreparationCatalog.filter(e=>e.language===language && (!purpose||e.purposes.includes(purpose)));
}

/** Content-first curriculum roadmap, independent from speech recognition.
 * These are authoring targets, NOT completed lessons or CEFR accreditation.
 * A0 onboarding is handled separately from the six official CEFR bands.
 */
export const curriculumUnitBlueprint = {
 A1:['greetings-and-introductions','personal-information','numbers-time-and-dates','family-and-people','daily-routines','food-and-shopping','places-and-directions','basic-needs-and-help'],
 A2:['past-experiences','plans-and-invitations','housing-and-services','health-and-wellbeing','work-and-study','travel-problems','opinions-and-preferences','everyday-storytelling'],
 B1:['narrating-events','explaining-opinions','workplace-collaboration','media-and-culture','handling-unexpected-situations','personal-goals','community-and-society','extended-conversations'],
 B2:['argument-and-evidence','complex-instructions','professional-communication','abstract-topics','negotiation','critical-reading','extended-writing','discussion-and-debate'],
 C1:['nuance-and-register','implicit-meaning','academic-argument','professional-presentations','advanced-text-analysis','intercultural-pragmatics','complex-synthesis','precision-and-style'],
 C2:['idiomatic-mastery','subtle-implications','specialized-discourse','multi-source-synthesis','rhetorical-control','literary-interpretation','high-stakes-communication','near-native-flexibility'],
} as const satisfies Record<(typeof officialCefrBands)[number],readonly string[]>;
export type CurriculumUnitStatus='planned'|'draft'|'reviewed'|'published';
export interface CurriculumUnitPlan{
 targetLanguage:TargetLanguage;
 level:(typeof officialCefrBands)[number];
 unitId:string;
 status:CurriculumUnitStatus;
}
/** Generates a transparent planning inventory without pretending content exists. */
export function curriculumPlanFor(targetLanguage:TargetLanguage):CurriculumUnitPlan[]{
 return officialCefrBands.flatMap(level=>curriculumUnitBlueprint[level].map(unitId=>({
  targetLanguage,level,unitId,status:'planned' as const
 })));
}


/** Editorial production audit. It measures documented content work, NOT language
 * proficiency, accuracy of reviewer claims, device delivery or CEFR certification.
 * An authored unit is never automatically published or attributed to a reviewer.
 */
export type CourseSkill='listening'|'speaking'|'reading'|'writing'|'interaction'|'mediation';
export const courseSkills:readonly CourseSkill[]=['listening','speaking','reading','writing','interaction','mediation'];
export interface ProductionActivity {id:string; skill:CourseSkill; prompt:string;}
export interface ProductionUnit {
 targetLanguage:TargetLanguage;
 level:(typeof officialCefrBands)[number];
 unitId:string;
 revision:string;
 status:'draft'|'reviewed';
 outcomes:readonly string[];
 activities:readonly ProductionActivity[];
 review?:{linguisticReviewer:string;educationalReviewer:string;rightsReference:string};
}
export interface LevelProductionReport {
 targetLanguage:TargetLanguage;
 level:(typeof officialCefrBands)[number];
 plannedUnits:number;
 drafts:number;
 documentedReviews:number;
 missingUnits:number;
 skillCoverage:readonly CourseSkill[];
 /** Only a structural editorial gate. It is NOT permission to announce a full level. */
 allUnitsDocumentedAsReviewed:boolean;
}
export function auditCurriculumProduction(input:unknown):{
 valid:boolean;errors:readonly string[];levels:readonly LevelProductionReport[];
}{
 const errors:string[]=[];
 if(!Array.isArray(input)||input.length>500)return{valid:false,errors:['Invalid authoring inventory'],levels:[]};
 const expected=new Set(targetLanguages.flatMap(lang=>curriculumPlanFor(lang).map(unit=>[lang,unit.level,unit.unitId].join('/'))));
 const rows=new Map<string,ProductionUnit>();
 for(const [index,raw] of input.entries()){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){errors.push('Invalid unit row '+index);continue;}
  const r=raw as Partial<ProductionUnit>;
  const id=[r.targetLanguage,r.level,r.unitId].join('/');
  if(!expected.has(id)||rows.has(id)){errors.push('Unknown or duplicate unit '+id);continue;}
  if(r.status!=='draft'&&r.status!=='reviewed'){errors.push('Invalid status '+id);continue;}
  if(typeof r.revision!=='string'||!/^\d+\.\d+\.\d+$/.test(r.revision)){errors.push('Missing revision '+id);continue;}
  if(!Array.isArray(r.outcomes)||r.outcomes.length>12||
    r.outcomes.some(t=>typeof t!=='string'||!t.trim()||t.length>500)){
   errors.push('Invalid outcomes '+id);continue;
  }
  if(!Array.isArray(r.activities)||r.activities.length>100){errors.push('Invalid activities '+id);continue;}
  const ids=new Set<string>();let malformed=false;
  for(const activity of r.activities){
   if(!activity||typeof activity!=='object'||typeof activity.id!=='string'||
     !/^[a-z0-9][a-z0-9-]{0,79}$/.test(activity.id)||ids.has(activity.id)||
     !courseSkills.includes(activity.skill)||typeof activity.prompt!=='string'||
     !activity.prompt.trim()||activity.prompt.length>2000){malformed=true;break;}
   ids.add(activity.id);
  }
  if(malformed){errors.push('Invalid activities '+id);continue;}
  if(r.status==='reviewed'){
   const review=r.review;
   if(r.outcomes.length===0||r.activities.length<2||!review||
      ['linguisticReviewer','educationalReviewer','rightsReference'].some(key=>{
       const text=review[key as keyof typeof review];return typeof text!=='string'||text.trim().length<3||text.length>200;
      })){errors.push('Review evidence missing '+id);continue;}
  }
  rows.set(id,r as ProductionUnit);
 }
 const levels:LevelProductionReport[]=targetLanguages.flatMap(lang=>officialCefrBands.map(level=>{
  const planned=curriculumPlanFor(lang).filter(row=>row.level===level);
  const authored=planned.map(row=>rows.get([lang,level,row.unitId].join('/'))).filter((x):x is ProductionUnit=>!!x);
  const reviewed=authored.filter(x=>x.status==='reviewed');
  const skills=new Set<CourseSkill>(reviewed.flatMap(x=>x.activities.map(a=>a.skill)));
  return{targetLanguage:lang,level,plannedUnits:planned.length,drafts:authored.length-reviewed.length,
    documentedReviews:reviewed.length,missingUnits:planned.length-authored.length,
    skillCoverage:courseSkills.filter(skill=>skills.has(skill)),
    allUnitsDocumentedAsReviewed:reviewed.length===planned.length&&courseSkills.every(skill=>skills.has(skill))};
 }));
 return{valid:errors.length===0,errors,levels};
}
