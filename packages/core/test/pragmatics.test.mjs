import test from 'node:test';
import assert from 'node:assert/strict';
import {pragmaticsScenarios,explainPragmatics} from '../dist/index.js';
test('literal and implied meaning are explicit and uncertainty is preserved',()=>{
 assert.ok(pragmaticsScenarios.length>=3);
 for(const s of pragmaticsScenarios){
  assert.equal(s.ageSafe,true);
  for(const field of ['utterance','literal','possibleMeaning','observableCue','uncertainty','clarification'])assert.ok(s[field]?.trim());
  const brief=explainPragmatics(s.id,'brief');
  assert.equal(brief?.uncertainty,s.uncertainty);
  assert.ok(!('literal' in brief));
  assert.equal(explainPragmatics(s.id)?.literal,s.literal);
 }
 assert.equal(explainPragmatics('missing'),null);
});
