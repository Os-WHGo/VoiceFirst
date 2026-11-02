import test from 'node:test';
import assert from 'node:assert/strict';
import {nextMemoryState,scheduledIntervalDays,scheduleRecall,recallProbability,recallProbabilityOn,recallScheduleFromUnknown,validateSchedulerSettings,defaultSchedulerSettings,addLocalDays,localDaysBetween,isLocalDay} from '../dist/index.js';

// Golden vectors produced by ts-fsrs 5.4.2 (MIT) FSRSAlgorithm.next_state/next_interval with
// enable_fuzz=false, request_retention=0.9, maximum_interval=365. Rows: [elapsedDays, grade, stability, difficulty, interval].
const golden=[
 [[0,3,2.3065,2.11810397,2],[3,3,13.82690327,2.11121424,14],[8,3,42.06295792,2.1043314,42],[21,3,105.45102946,2.09745544,105]],
 [[0,1,0.212,6.4133,1],[0,3,0.24668919,6.40211507,1],[1,3,2.02147724,6.39094132,2],[4,2,6.22399111,7.58936704,6],[10,1,1.11698942,9.19286971,1],[2,3,2.68992675,9.17890521,3]],
 [[0,4,8.2956,1,8],[15,4,95.50778479,1,96],[60,3,265.25192067,1,265]],
 [[0,2,1.2931,5.11217071,1],[2,2,4.46945539,6.74045952,4],[5,1,0.88772035,8.91383958,1],[1,3,1.99458525,8.90015411,2],[7,3,6.30579985,8.88648233,6]],
];
test('FSRS-6 memory model reproduces the ts-fsrs reference exactly',()=>{
 for(const sequence of golden){
  let memory=null;
  for(const [elapsed,grade,stability,difficulty,interval] of sequence){
   memory=nextMemoryState(memory,elapsed,grade);
   assert.equal(memory.stability,stability);
   assert.equal(memory.difficulty,difficulty);
   assert.equal(scheduledIntervalDays(memory.stability),interval);
  }
 }
});
test('recall probability is 90% after exactly one stability period',()=>{
 assert.ok(Math.abs(recallProbability(10,10)-0.9)<1e-6);
 assert.equal(recallProbability(10,0),1);
 assert.ok(recallProbability(10,30)<recallProbability(10,5));
});
test('schedules progress across calendar days and count lapses only after a first review',()=>{
 let s=scheduleRecall(null,1,'2026-10-23');
 assert.equal(s.lapses,0);assert.equal(s.dueOn,'2026-10-24');
 s=scheduleRecall(s,3,'2026-10-24');
 s=scheduleRecall(s,3,'2026-10-26');
 assert.ok(s.dueOn>'2026-10-27');
 const lapse=scheduleRecall(s,1,s.dueOn);
 assert.equal(lapse.lapses,1);assert.equal(lapse.reviews,4);
 assert.equal(localDaysBetween(lapse.lastReviewedOn,lapse.dueOn),1);
 assert.ok(recallProbabilityOn(s,addLocalDays(s.dueOn,30))<0.9);
});
test('scheduler rejects time travel, invalid grades and unsafe settings',()=>{
 const s=scheduleRecall(null,3,'2026-10-23');
 assert.throws(()=>scheduleRecall(s,3,'2026-10-22'),/precedes/);
 assert.throws(()=>scheduleRecall(s,5,'2026-10-24'),/grade/);
 assert.throws(()=>scheduleRecall(s,3,'2026-02-30'),/Invalid local day/);
 assert.throws(()=>validateSchedulerSettings({...defaultSchedulerSettings,desiredRetention:0.99}),/retention/);
 assert.throws(()=>validateSchedulerSettings({...defaultSchedulerSettings,weights:[1,2,3]}),/21/);
 assert.equal(scheduledIntervalDays(100000,{...defaultSchedulerSettings,maximumIntervalDays:30}),30);
});
test('higher desired retention yields shorter intervals',()=>{
 assert.ok(scheduledIntervalDays(20,{...defaultSchedulerSettings,desiredRetention:0.95})<scheduledIntervalDays(20,{...defaultSchedulerSettings,desiredRetention:0.8}));
});
test('stored schedules are validated before use',()=>{
 const s=scheduleRecall(null,3,'2026-10-23');
 assert.deepEqual(recallScheduleFromUnknown(JSON.parse(JSON.stringify(s))),s);
 for(const bad of [null,[],{...s,version:2},{...s,dueOn:s.lastReviewedOn},{...s,memory:{stability:-1,difficulty:5}},{...s,lapses:1},{...s,reviews:1.5}])
  assert.equal(recallScheduleFromUnknown(bad),null);
 assert.equal(isLocalDay('2026-13-01'),false);
});
