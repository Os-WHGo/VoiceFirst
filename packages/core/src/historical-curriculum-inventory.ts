/** Read-only quarantine of older A0–B1 normalized curricular drafts.
 * The source files are not installed, reproduced or automatically promoted.
 * This inspector only checks identity, declared counts and lossless source linkage.
 * Passing never means editorial approval, speech support or lesson readiness.
 */
import {targetLanguages,type TargetLanguage} from './types.js';

export type HistoricalCurriculumLevel='A0'|'A1'|'A2'|'B1';
export interface HistoricalCurriculumInventory {
 valid:boolean;
 issues:readonly string[];
 variants:number;
 stageInstances:number;
 byLevel:Readonly<Record<HistoricalCurriculumLevel,number>>;
 byLanguage:Readonly<Record<TargetLanguage,number>>;
 readyForImport:0;
 publicAvailable:false;
}
const levels=['A0','A1','A2','B1'] as const;
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const safeCount=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;
const emptyCounts=()=>({A0:0,A1:0,A2:0,B1:0});
const emptyLocales=()=>Object.fromEntries(targetLanguages.map(language=>[language,0])) as Record<TargetLanguage,number>;
/** A read-only inventory; do not migrate content or mutate learner journals. */
export function inspectHistoricalNormalizedCurriculum(input:unknown):HistoricalCurriculumInventory {
 const issues:string[]=[];
 const byLevel=emptyCounts(),byLanguage=emptyLocales();
 let stageInstances=0,variants=0;
 const result=():HistoricalCurriculumInventory=>({valid:issues.length===0,issues,variants,stageInstances,
  byLevel,byLanguage,readyForImport:0,publicAvailable:false});
 if(!record(input)||input.schema!=='voicefirst.curriculum-content.normalized.v1'||
  input.status!=='draft-requires-native-review'||!Array.isArray(input.items)||!record(input.counts)){
  issues.push('INVALID_NORMALIZED_ROOT');return result();
 }
 const ids=new Set<string>();
 for(const [i,raw] of input.items.entries()){
  const prefix='items['+i+']';
  if(!record(raw)){issues.push(prefix+':INVALID_ITEM');continue;}
  const level=raw.level,locale=raw.language;
  if(!levels.includes(level as HistoricalCurriculumLevel)||!targetLanguages.includes(locale as TargetLanguage)){
   issues.push(prefix+':UNSUPPORTED_LEVEL_OR_LANGUAGE');continue;
  }
  if(typeof raw.id!=='string'||typeof raw.objective_id!=='string'||
   raw.id!==raw.objective_id+'.'+locale||raw.objective_id!==level+'.'+raw.objective_id.split('.')[1]||
   !/^A0\.[0-9]{2}$|^A1\.[0-9]{2}$|^A2\.[0-9]{2}$|^B1\.[0-9]{2}$/.test(raw.objective_id)){
   issues.push(prefix+':INVALID_ORIGINAL_ID');continue;
  }
  if(ids.has(raw.id)){issues.push(prefix+':DUPLICATE_ORIGINAL_ID');continue;}
  ids.add(raw.id);
  if(raw.editorial_status!=='draft-requires-native-review'||!Array.isArray(raw.stages)||
     !record(raw.source_payload)||
     raw.source_payload.id!==raw.id||raw.source_payload.level!==level||
     (raw.source_payload.target_language??raw.source_payload.language)!==locale){
   issues.push(prefix+':MISSING_OR_CHANGED_SOURCE');continue;
  }
  if(raw.stages.some(stage=>!record(stage)||typeof stage.kind!=='string'||!stage.kind.trim()||
    !record(stage.source_task))){
   issues.push(prefix+':INVALID_STAGE');continue;
  }
  variants++;
  byLevel[level as HistoricalCurriculumLevel]++;
  byLanguage[locale as TargetLanguage]++;
  stageInstances+=raw.stages.length;
 }
 if(!safeCount(input.counts.variants)||input.counts.variants!==variants||
   !safeCount(input.counts.stage_instances)||input.counts.stage_instances!==stageInstances)
  issues.push('TOTALS_MISMATCH');
 if(!record(input.counts.by_level)||levels.some(l=>!safeCount((input.counts as {by_level:Record<string,unknown>}).by_level[l])||
   input.counts.by_level[l]!==byLevel[l])||
   Object.keys(input.counts.by_level).some(key=>!levels.includes(key as HistoricalCurriculumLevel)))
  issues.push('LEVEL_TOTALS_MISMATCH');
 return result();
}
