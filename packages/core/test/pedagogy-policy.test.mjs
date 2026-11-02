import test from 'node:test';
import assert from 'node:assert/strict';
import {provisionalPedagogyPolicy,pendingPedagogicalDecisions,validatePedagogyPolicy,masteryThresholds,newLearnerModel,recordActivityResult,assessRecord,recordKey,gradeForAchievement,
 planLearningSession,stepSession,courseActivities,defaultSessionPreferences,localDayAt,deviceLocalDay} from '../dist/index.js';

const clone=x=>JSON.parse(JSON.stringify(x));
test('the engine ships a provisional policy that names every pending pedagogical decision',()=>{
 assert.equal(provisionalPedagogyPolicy.status,'provisional-pending-chatgpt-approval');
 assert.equal(masteryThresholds,provisionalPedagogyPolicy.mastery);
 assert.deepEqual(pendingPedagogicalDecisions.map(d=>d.id),['mastery-thresholds','activity-retries','grade-mapping','comprehension-checks','accepted-variants','register-alternatives','a0-asset-fixes']);
 assert.equal(validatePedagogyPolicy(provisionalPedagogyPolicy),provisionalPedagogyPolicy);
});
test('approval must be recorded and values stay in safe ranges',()=>{
 assert.throws(()=>validatePedagogyPolicy({...clone(provisionalPedagogyPolicy),status:'approved-by-chatgpt'}),/approval/);
 const approved={...clone(provisionalPedagogyPolicy),status:'approved-by-chatgpt',approval:{by:'ChatGPT',on:'2026-10-24'}};
 assert.equal(validatePedagogyPolicy(approved).status,'approved-by-chatgpt');
 for(const bad of [p=>{p.mastery.reviewRecall=0.9},p=>{p.activity.offerModelAfterErrors=5},p=>{p.grades.assisted=4},p=>{p.version='1'}]){
  const p=clone(provisionalPedagogyPolicy);bad(p);assert.throws(()=>validatePedagogyPolicy(p),/Invalid pedagogy policy/);
 }
});
test('an approved policy changes mastery and grading without code changes',()=>{
 const policy={...clone(provisionalPedagogyPolicy),status:'approved-by-chatgpt',approval:{by:'ChatGPT',on:'2026-10-24'},mastery:{consolidatingDays:2,secureGapDays:3,secureRecall:0.8,reviewRecall:0.6},grades:{independent:3,learnerConfirmed:2,afterRetry:2,assisted:1,notAchieved:1}};
 const r=(day)=>({activityId:'es-a1-water-recall-3',objectiveId:'es-a1-water',kind:'recall',modality:'speech',achievement:'independent',minorErrors:0,meaningErrors:0,replays:0,hints:0,modelShown:false,day});
 let m=newLearnerModel('es');for(const d of ['2026-10-01','2026-10-02','2026-10-05'])m=recordActivityResult(m,r(d),undefined,policy);
 const rec=m.records[recordKey('es-a1-water','spoken-production')];
 assert.equal(assessRecord(rec,'2026-10-05',policy).state,'secure');
 assert.equal(assessRecord(rec,'2026-10-05').state,'consolidating','provisional policy still needs a 7-day gap');
 assert.equal(gradeForAchievement('assisted',policy),1);assert.equal(gradeForAchievement('assisted'),2);
});
test('activity retry limits follow the policy',()=>{
 const policy={...clone(provisionalPedagogyPolicy),activity:{maxErrors:2,offerModelAfterErrors:1,reviewShare:0.4}};
 const activities=courseActivities('es',{comprehension:false});
 let state=planLearningSession({sessionId:'p-1',target:'es',known:'en-CA',today:'2026-10-23',activities,model:newLearnerModel('es'),completedLessons:[],preferences:{...defaultSessionPreferences,correctionTiming:'immediate'},policy});
 const step=e=>{const r=stepSession(state,e,activities,policy);state=r.state;return r.outputs;};
 step({type:'continue'});step({type:'answer',response:'¡Hola!',source:{kind:'speech',confidence:'high'}});
 assert.ok(step({type:'answer',response:'Adiós',source:{kind:'typed'}}).some(o=>o.kind==='model'),'model after the first error');
 step({type:'answer',response:'Gracias',source:{kind:'typed'}});
 assert.equal(state.results.at(-1).achievement,'not-achieved','closed after two errors');
});
test('local day follows the learner time zone across midnight, DST and the date line',()=>{
 const instant=new Date('2026-11-01T06:30:00Z');
 assert.equal(localDayAt(instant,-420),'2026-10-31','Vancouver PDT');
 assert.equal(localDayAt(instant,-480),'2026-10-31','after the DST change');
 assert.equal(localDayAt(instant,60),'2026-11-01','Rome');
 assert.equal(localDayAt(new Date('2026-10-23T23:30:00Z'),14*60),'2026-10-24','Kiribati');
 assert.equal(localDayAt(new Date('2026-10-23T09:00:00Z'),-12*60),'2026-10-22','Baker Island');
 assert.throws(()=>localDayAt(instant,15*60),/offset/);
 assert.throws(()=>localDayAt(new Date('x'),0),/instant/);
 assert.match(deviceLocalDay(),/^\d{4}-\d{2}-\d{2}$/);
});
