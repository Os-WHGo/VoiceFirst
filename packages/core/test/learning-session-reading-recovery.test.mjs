import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadA0CandidateCatalog,a0ChoiceActivities,courseActivities,planLearningSession,stepSession,sessionToJSON,sessionFromJSON,newLearnerModel,newCourseProgress,completeSession,defaultSessionPreferences,recordKey,targetLanguages} from '../dist/index.js';
const catalog=loadA0CandidateCatalog(JSON.parse(readFileSync(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url),'utf8')));
assert.equal(catalog.kind,'candidate');
function completed(target='en-CA'){
 const activities=a0ChoiceActivities(catalog.lessons.filter(l=>l.targetLanguage===target));
 const model=newLearnerModel(target),state=planLearningSession({sessionId:`reading-${target}`,target,known:target==='es'?'en-CA':'es',today:'2026-10-31',activities,model,completedLessons:[],preferences:defaultSessionPreferences});
 const a=activities.find(a=>a.id===state.current.activityId);
 return {activities,model,activity:a,state:stepSession(state,{type:'choose',optionId:a.correctOptionId},activities).state};
}
test('real A0 reading evidence survives a session round trip in all six targets',()=>{
 for(const target of targetLanguages){
  const ctx=completed(target),restored=sessionFromJSON(sessionToJSON(ctx.state),ctx.activities);
  assert.ok(restored);assert.equal(restored.results[0].skill,'reading-comprehension');
  const done=completeSession(restored,ctx.model,newCourseProgress(target));
  assert.equal(done.model.records[recordKey(ctx.activity.objectiveId,'reading-comprehension')].independent,1);
  assert.equal(done.model.records[recordKey(ctx.activity.objectiveId,'listening-comprehension')],undefined);
  assert.equal(done.model.records[recordKey(ctx.activity.objectiveId,'spoken-production')],undefined);
 }
});
test('legacy missing classification is recovered from authored activity without changing scores',()=>{
 const ctx=completed(),raw=JSON.parse(sessionToJSON(ctx.state));delete raw.results[0].skill;
 const restored=sessionFromJSON(JSON.stringify(raw),ctx.activities);
 assert.equal(restored.results[0].skill,'reading-comprehension');
 assert.equal(restored.results[0].achievement,ctx.state.results[0].achievement);
 assert.equal(restored.results[0].minorErrors,0);assert.equal(restored.results[0].meaningErrors,0);
});
test('a stored skill cannot contradict or invent the authored activity classification',()=>{
 const ctx=completed(),raw=JSON.parse(sessionToJSON(ctx.state));raw.results[0].skill='spoken-production';
 assert.equal(sessionFromJSON(JSON.stringify(raw),ctx.activities),null);
 const activities=courseActivities('en-CA');
 let state=planLearningSession({sessionId:'course-choice',target:'en-CA',known:'es',today:'2026-10-31',activities,model:newLearnerModel('en-CA'),completedLessons:[],preferences:defaultSessionPreferences});
 state=stepSession(state,{type:'continue'},activities).state;
 const activity=activities.find(a=>a.id===state.current.activityId);
 state=stepSession(state,{type:'choose',optionId:activity.correctOptionId},activities).state;
 const forged=JSON.parse(sessionToJSON(state));forged.results[1].skill='reading-comprehension';
 assert.equal(sessionFromJSON(JSON.stringify(forged),activities),null);
});
