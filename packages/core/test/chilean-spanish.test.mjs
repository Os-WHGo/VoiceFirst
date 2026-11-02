import test from 'node:test';
import assert from 'node:assert/strict';
import {chileanSpanishLaunchExpressions,chileanSpanishRoutes,chileanSpanishExample,learningPairs} from '../dist/index.js';
test('Chilean Spanish launches as a distinct course without changing 30 language pairs',()=>{
 assert.equal(learningPairs().length,30);
 assert.deepEqual(chileanSpanishRoutes.map(x=>x.id),['from-zero','spanish-speaker']);
 assert.ok(chileanSpanishLaunchExpressions.length>=5);
 assert.equal(new Set(chileanSpanishLaunchExpressions.map(x=>x.id)).size,chileanSpanishLaunchExpressions.length);
 for(const e of chileanSpanishLaunchExpressions){
  assert.ok(e.standard&&e.chilean&&e.meaningEn&&e.context);
  assert.equal(typeof e.avoidInFormal,'boolean');
 }
 assert.equal(chileanSpanishExample('work')?.chilean,'Voy a la pega.');
 assert.equal(chileanSpanishExample('missing'),null);
});
