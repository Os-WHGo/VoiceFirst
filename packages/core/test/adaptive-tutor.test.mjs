import test from 'node:test';
import assert from 'node:assert/strict';
import {selectNextTutorPractice,targetLanguages} from '../dist/index.js';
const empty={successes:{},retries:{}};
test('all six targets can select authored adult practice offline',()=>{
 for(const target of targetLanguages){
  const result=selectNextTutorPractice(target,'work','adult',empty);
  assert.equal(result.status,'ready');
  assert.equal(result.domain,'work');
 }
});
test('age safety gate is preserved',()=>{
 for(const age of ['preschool','primary','preteen','teen']){
  assert.equal(selectNextTutorPractice('en-CA','work',age,empty).status,'requires-child-safety-review');
 }
});
test('priority never permanently excludes other domains',()=>{
 const initial=selectNextTutorPractice('en-CA','work','adult',empty);
 assert.equal(initial.status,'ready');
 const history={successes:{'en-CA-offer':2,'en-CA-request':2},retries:{}};
 const next=selectNextTutorPractice('en-CA','work','adult',history);
 assert.equal(next.status,'ready');
 assert.notEqual(next.domain,'work');
});
test('retries make a previously attempted skill eligible for reinforcement',()=>{
 const history={successes:{'en-CA-offer':1,'en-CA-request':1,'en-CA-water':1,'en-CA-thanks':1,'en-CA-bus':1,'en-CA-ticket':1,'en-CA-price':1,'en-CA-card':1},retries:{'en-CA-ticket':3}};
 const next=selectNextTutorPractice('en-CA','balanced','adult',history);
 assert.equal(next.status,'ready');
 assert.equal(next.turn.id,'en-CA-ticket');
 assert.equal(next.reason,'reinforce');
});
