import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineMissions,missionReplyAccepted,contextualReview,branchingScenarios,inclusiveLearningMode,initialPlacement,scoreExperiencePlacement,lessonsFor} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('mission, contextual review, branching and inclusive mode matrix',()=>{
 let missions=0;
 for(const language of languages){
  const authored=lessonsFor(language);
  const tasks=offlineMissions(language);
  assert.equal(tasks.length,14);
  assert.deepEqual(tasks.map(t=>t.lessonId),authored.map(l=>l.id));
  for(const task of tasks){assert.equal(missionReplyAccepted(task,task.acceptedReplies[0]),true);missions++;}
  const reviewed=contextualReview(language,[authored[0].id,authored[1].id],5);
  assert.equal(reviewed.length,2);
  assert.equal(branchingScenarios(language,'adult').length,4);
  assert.equal(branchingScenarios(language,'primary').length,0);
  const items=initialPlacement(language,6);
  assert.equal(items.length,6);
  assert.equal(scoreExperiencePlacement(language,{},6).status,'exploratory-not-certified');
 }
 assert.equal(missions,84);
 assert.equal(inclusiveLearningMode({lowStimulation:true}).allowSkip,true);
});
