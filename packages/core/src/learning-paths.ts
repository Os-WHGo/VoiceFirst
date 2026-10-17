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
