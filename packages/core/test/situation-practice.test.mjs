import test from 'node:test';
import assert from 'node:assert/strict';
import {availableSituations,situationPractice,lessonsFor,placementItems,scorePlacement} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('quick situations are catalog-backed and offline in six languages',()=>{
 let checked=0;
 for(const language of languages){
  const lessons=lessonsFor(language);
  for(const situation of availableSituations(language)){
   const lesson=lessons.find(x=>x.id===situation.lessonId);
   assert.ok(lesson);
   assert.equal(situation.offline,true);
   assert.equal(situation.certification,false);
   assert.ok(lesson.exercises.some(x=>x.id===situation.exerciseId));
   assert.ok(situation.alternatives.includes(situation.phrase));
   assert.deepEqual(situationPractice(language,situation.situation),situation);
   checked++;
  }
  const items=placementItems(language,6);
  const perfect=scorePlacement(language,items.map(x=>({itemId:x.id,response:x.accepted[0],kind:'answered'})),6);
  assert.equal(perfect.correct,6);
  assert.equal(perfect.provisional,true);
  assert.equal(perfect.certification,false);
 }
 assert.ok(checked>=24);
});
