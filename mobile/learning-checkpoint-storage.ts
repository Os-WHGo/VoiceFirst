/** Same SQLite KV transaction pattern as the existing pack journal. No new DB or secrets.
 * A single key binds all learning evidence; byte comparison prevents stale writers/ABA.
 * Legacy keys are read once and retained, never deleted or rewritten by this adapter.
 */
import Storage from 'expo-sqlite/kv-store';
import {learningCheckpointFromJSON,learningCheckpointToJSON,newLearningCheckpoint,type LearningCheckpoint,type TargetLanguage} from '@voicefirst/core';
export const learningCheckpointKey=(target:TargetLanguage)=>`voicefirst.learning-checkpoint.v1.${target}`;
export async function loadLearningCheckpoint(target:TargetLanguage):Promise<{checkpoint:LearningCheckpoint;raw:string|null}>{
 const raw=await Storage.getItem(learningCheckpointKey(target));
 if(raw!==null){
  const checkpoint=learningCheckpointFromJSON(raw,target);
  if(!checkpoint)throw new Error('CHECKPOINT_UNREADABLE');
  return {checkpoint,raw};
 }
 const legacy=await Storage.getItem(`voicefirst.curriculum.v1.${target}`);
 return {checkpoint:newLearningCheckpoint(target,legacy),raw:null};
}
export async function saveLearningCheckpoint(next:LearningCheckpoint,expectedRaw:string|null):Promise<string>{
 const raw=learningCheckpointToJSON(next);
 if(!learningCheckpointFromJSON(raw,next.target))throw new Error('CHECKPOINT_INVALID');
 const prior=expectedRaw===null?null:learningCheckpointFromJSON(expectedRaw,next.target);
 if(expectedRaw!==null&&!prior||next.revision!==(prior?.revision??0)+1)throw new Error('CHECKPOINT_REVISION');
 await Storage.setItem(learningCheckpointKey(next.target),(current:string|null)=>{
  if(current!==expectedRaw)throw new Error('CHECKPOINT_CONFLICT');
  return raw;
 });
 return raw;
}
