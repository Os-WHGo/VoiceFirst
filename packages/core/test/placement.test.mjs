import test from 'node:test';
import assert from 'node:assert/strict';
import {placementItems,scorePlacement} from '../dist/index.js';
const languages=['en-CA','fr-CA','es','pt-BR','de','it'];
test('optional placement gives six-locale provisional profiles without penalizing uncertainty',()=>{
 for(const language of languages){
  const items=placementItems(language);
  assert.equal(items.length,6);
  const all=scorePlacement(language,items.map(item=>({itemId:item.id,response:item.accepted[0],kind:'answered'})));
  assert.equal(all.correct,6);
  assert.equal(all.certification,false);
  assert.equal(all.provisional,true);
  const uncertain=scorePlacement(language,[{itemId:items[0].id,response:'',kind:'uncertain'}]);
  assert.equal(uncertain.answered,0);
  assert.equal(uncertain.uncertain,1);
  assert.equal(uncertain.skipped,5);
  assert.equal(uncertain.recommendedLessonId,items[0].lessonId);
  assert.throws(()=>scorePlacement(language,[{itemId:'forged',response:'hello',kind:'answered'}]),/Invalid placement answers/);
 }
});
