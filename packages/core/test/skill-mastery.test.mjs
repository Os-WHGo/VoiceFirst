import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,newLearnerModel,recordActivityResult,applySessionResults,assessRecord,assessObjective,dueObjectiveReviews,levelEvidence,evidenceSkill,gradeForAchievement,learnerModelFromJSON,learnerModelToJSON,recordKey,addLocalDays,masteryThresholds} from '../dist/index.js';

const result=(day,achievement,over={})=>({activityId:'es-a1-water-recall-3',objectiveId:'es-a1-water',kind:'recall',modality:'speech',achievement,minorErrors:0,meaningErrors:0,replays:0,hints:0,modelShown:false,day,...over});
const rec=(m,skill='spoken-production')=>m.records[recordKey('es-a1-water',skill)];
const fold=(m,list)=>list.reduce((x,r)=>recordActivityResult(x,r),m);

test('evidence is attributed to the skill actually used',()=>{
 assert.equal(evidenceSkill('recall','speech'),'spoken-production');
 assert.equal(evidenceSkill('checkpoint','typed'),'written-production');
 assert.equal(evidenceSkill('dialogue-turn','speech'),'spoken-interaction');
 assert.equal(evidenceSkill('dialogue-turn','typed'),'written-production');
 assert.equal(evidenceSkill('choice','choice'),'listening-comprehension');
 assert.equal(evidenceSkill('repeat','speech'),'pronunciation');
 assert.equal(evidenceSkill('repeat','typed'),null,'copying text is not evidence');
 assert.equal(evidenceSkill('listen','none'),null,'listening without a check is exposure only');
 assert.deepEqual(['independent','learner-confirmed','after-retry','assisted','not-achieved','no-evidence'].map(gradeForAchievement),[3,3,2,2,1,null]);
});
test('completing a lesson in one day is practice, not mastery',()=>{
 const day='2026-10-23';
 let m=fold(newLearnerModel('es'),[result(day,'independent'),result(day,'independent',{activityId:'es-a1-water-checkpoint-4',kind:'checkpoint'})]);
 const a=assessRecord(rec(m),day);
 assert.equal(a.state,'practicing');assert.equal(a.capReason,'needs-second-day');
 assert.equal(rec(m).successDays.length,1);
});
test('mastery needs success on separate days and a spaced retrieval',()=>{
 let m=newLearnerModel('es');
 m=fold(m,[result('2026-10-01','independent'),result('2026-10-03','independent')]);
 assert.equal(assessRecord(rec(m),'2026-10-03').state,'consolidating');
 assert.equal(assessRecord(rec(m),'2026-10-03').capReason,'needs-spaced-retrieval');
 m=recordActivityResult(m,result('2026-10-12','independent'));
 assert.ok(rec(m).maxRetrievalGapDays>=masteryThresholds.secureGapDays);
 assert.equal(assessRecord(rec(m),'2026-10-12').state,'secure');
 // Decay without practice brings it back to review.
 assert.equal(assessRecord(rec(m),addLocalDays('2026-10-12',400)).state,'needs-review');
});
test('learner-confirmed recognition counts, but secure needs one verified success',()=>{
 let m=fold(newLearnerModel('es'),[result('2026-10-01','learner-confirmed'),result('2026-10-03','learner-confirmed'),result('2026-10-12','learner-confirmed')]);
 const a=assessRecord(rec(m),'2026-10-12');
 assert.equal(a.state,'consolidating');assert.equal(a.capReason,'needs-verified-success');
 m=recordActivityResult(m,result('2026-10-12','independent',{modality:'speech'}));
 assert.equal(assessRecord(rec(m),'2026-10-12').state,'secure');
});
test('a failed retrieval after consolidation requires review; assisted success is not independent',()=>{
 let m=fold(newLearnerModel('es'),[result('2026-10-01','independent'),result('2026-10-04','independent'),result('2026-10-06','not-achieved',{meaningErrors:2,modelShown:true})]);
 assert.equal(assessRecord(rec(m),'2026-10-06').state,'needs-review');
 assert.equal(rec(m).schedule.lapses,1);
 const assisted=fold(newLearnerModel('es'),[result('2026-10-01','assisted',{hints:1}),result('2026-10-02','assisted',{hints:1})]);
 assert.equal(assessRecord(rec(assisted),'2026-10-02').state,'practicing');
});
test('pronunciation is capped: text cannot establish acoustic mastery',()=>{
 let m=newLearnerModel('es');
 for(const day of ['2026-10-01','2026-10-05','2026-10-20'])m=recordActivityResult(m,result(day,'independent',{kind:'repeat'}));
 const a=assessRecord(rec(m,'pronunciation'),'2026-10-20');
 assert.equal(a.state,'practicing');assert.equal(a.capReason,'acoustic-assessment-unavailable');
 assert.equal(rec(m,'pronunciation').schedule,null);
 assert.equal(dueObjectiveReviews(m,'2026-12-01').length,0);
});
test('uncertain or skipped activities count as exposure only and replays never matter',()=>{
 let m=recordActivityResult(newLearnerModel('es'),result('2026-10-01','no-evidence'));
 assert.equal(Object.keys(m.records).length,0);
 assert.equal(assessObjective(m,'es-a1-water','2026-10-01').exposed,true);
 const a=recordActivityResult(newLearnerModel('es'),result('2026-10-01','independent',{replays:0}));
 const b=recordActivityResult(newLearnerModel('es'),result('2026-10-01','independent',{replays:9}));
 assert.deepEqual(rec(a).schedule,rec(b).schedule);
});
test('due reviews are ordered by forgetting and sessions apply once',()=>{
 const results=[result('2026-10-01','independent'),result('2026-10-01','assisted',{objectiveId:'es-a1-price',activityId:'es-a1-price-recall-3'})];
 let m=applySessionResults(newLearnerModel('es'),'session-1',results);
 assert.equal(applySessionResults(m,'session-1',results),m);
 const due=dueObjectiveReviews(m,'2026-10-30');
 assert.equal(due.length,2);
 assert.ok(due[0].recallProbability<=due[1].recallProbability);
 assert.throws(()=>recordActivityResult(m,result('2026-09-01','independent')),/precedes/);
});
test('level evidence never claims a CEFR level',()=>{
 let m=fold(newLearnerModel('es'),[result('2026-10-01','independent'),result('2026-10-03','independent'),result('2026-10-12','independent')]);
 const [a1]=levelEvidence(m,{A1:['es-a1-water','es-a1-price','es-a1-water']},'2026-10-12');
 assert.deepEqual(a1,{band:'A1',objectives:2,secureObjectives:1,practicedObjectives:1,cefrClaim:null,note:'internal-indicative-evidence-only'});
});
test('learner model round-trips and rejects tampering for every target language',()=>{
 for(const lang of targetLanguages){
  let m=recordActivityResult(newLearnerModel(lang),{...result('2026-10-01','independent'),objectiveId:`${lang}-a1-water`});
  const raw=learnerModelToJSON(m);
  assert.deepEqual(learnerModelFromJSON(raw,lang),m);
  const other=targetLanguages.find(l=>l!==lang);
  assert.equal(learnerModelFromJSON(raw,other),null);
 }
 const m=recordActivityResult(newLearnerModel('es'),result('2026-10-01','independent'));
 const v=JSON.parse(learnerModelToJSON(m));const key=Object.keys(v.records)[0];
 for(const mutate of [x=>{x.version=2},x=>{x.records[key].independent=99},x=>{x.records[key].successDays=['2026-10-02','2026-10-01']},x=>{x.records[key].schedule.memory.stability=-1},x=>{x.records[key].skill='singing'},x=>{x.appliedSessions=['bad id!']},x=>{x.records[key].transcript='hola'}]){
  const copy=JSON.parse(JSON.stringify(v));mutate(copy);
  const restored=learnerModelFromJSON(JSON.stringify(copy),'es');
  assert.ok(restored===null||!('transcript' in restored.records[key]),'unknown fields are dropped, invalid ones rejected');
  if(!JSON.stringify(copy).includes('transcript'))assert.equal(restored,null);
 }
 assert.equal(learnerModelFromJSON('{',`es`),null);
});
