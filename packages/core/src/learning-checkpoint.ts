/** One atomic local checkpoint for session, learner model and legacy course evidence.
 * Contains IDs/counters and authored corrections only. Never stores a response or audio.
 * A catalog fingerprint prevents silently resuming against changed answer keys.
 */
import {courseActivities,completeSession,sessionFromJSON,sessionToJSON,stepSession,type LearningSessionState,type LearningSessionEvent,type LearningSessionOutput,type SessionActivity} from './learning-session.js';
import {learnerModelFromJSON,learnerModelToJSON,newLearnerModel,type LearnerModel} from './skill-mastery.js';
import {loadCourseState,courseStateToJSON} from './course-state.js';
import {newCourseProgress,type CourseProgress} from './course.js';
import {sha256Bytes} from './sha256-bytes.js';
import {canonicalJSON} from './content-validation.js';
import {isLocalDay} from './local-day.js';
import {provisionalPedagogyPolicy} from './pedagogy-policy.js';
import {targetLanguages,type TargetLanguage} from './types.js';

export interface LearningCheckpoint {
 version:1;
 target:TargetLanguage;
 revision:number;
 catalogSha256:string;
 model:LearnerModel;
 progress:CourseProgress;
 session:LearningSessionState|null;
}
export function learningCatalogDigest(activities:readonly SessionActivity[]):string{
 // ASCII JSON avoids requiring TextEncoder/Buffer on native JS runtimes.
 const ascii=canonicalJSON({activities,policy:provisionalPedagogyPolicy}).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 return sha256Bytes(Uint8Array.from(ascii,c=>c.charCodeAt(0)));
}
export function newLearningCheckpoint(target:TargetLanguage,legacyRaw:string|null=null):LearningCheckpoint{
 const legacy=legacyRaw===null?{kind:'ok' as const,progress:newCourseProgress(target)}:loadCourseState(legacyRaw,target);
 if(legacy.kind!=='ok')throw new Error('Legacy progress is unreadable; preserve it');
 return {version:1,target,revision:0,catalogSha256:learningCatalogDigest(courseActivities(target)),model:newLearnerModel(target),progress:legacy.progress,session:null};
}
export function learningCheckpointToJSON(value:LearningCheckpoint):string{
 return JSON.stringify({version:1,target:value.target,revision:value.revision,catalogSha256:value.catalogSha256,
  model:learnerModelToJSON(value.model),progress:courseStateToJSON(value.progress),session:value.session?sessionToJSON(value.session):null});
}
export function learningCheckpointFromJSON(raw:string,target:TargetLanguage,activities:readonly SessionActivity[]=courseActivities(target)):LearningCheckpoint|null{
 if(typeof raw!=='string'||raw.length>1500000||!targetLanguages.includes(target))return null;
 try{
  const v:unknown=JSON.parse(raw);
  if(!v||typeof v!=='object'||Array.isArray(v))return null;
  const x=v as Record<string,unknown>;
  if(x.version!==1||x.target!==target||!Number.isSafeInteger(x.revision)||(x.revision as number)<0||x.catalogSha256!==learningCatalogDigest(activities)||typeof x.model!=='string'||typeof x.progress!=='string')return null;
  const model=learnerModelFromJSON(x.model,target),progress=loadCourseState(x.progress,target);
  const session=typeof x.session==='string'?sessionFromJSON(x.session,activities):null;
  if(!model||progress.kind!=='ok'||(x.session!==null&&!session)||session&&session.target!==target)return null;
  return {version:1,target,revision:x.revision as number,catalogSha256:x.catalogSha256,model,progress:progress.progress,session};
 }catch{return null;}
}
/** Commit finished session evidence together, exactly once. No intermediate two-key writes. */
export function checkpointWithSession(prior:LearningCheckpoint,session:LearningSessionState):LearningCheckpoint{
 if(session.target!==prior.target||prior.revision>=Number.MAX_SAFE_INTEGER)throw new Error('Invalid checkpoint transition');
 const done=session.status==='finished'?completeSession(session,prior.model,prior.progress):{model:prior.model,progress:prior.progress};
 return {...prior,revision:prior.revision+1,session,model:done.model,progress:done.progress};
}
export function stepLearningCheckpoint(prior:LearningCheckpoint,event:LearningSessionEvent,activities:readonly SessionActivity[],today=prior.session?.lastActiveOn):{checkpoint:LearningCheckpoint;outputs:LearningSessionOutput[]}{
 if(!prior.session||prior.catalogSha256!==learningCatalogDigest(activities))throw new Error('Session or catalog mismatch');
 if(!isLocalDay(today))throw new Error('Invalid learning day');
 const state=today>prior.session.lastActiveOn?{...prior.session,lastActiveOn:today}:prior.session;
 const step=stepSession(state,event,activities);
 return {checkpoint:checkpointWithSession(prior,step.state),outputs:step.outputs};
}
