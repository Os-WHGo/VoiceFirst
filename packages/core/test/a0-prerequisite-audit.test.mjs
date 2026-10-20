import test from 'node:test';
import assert from 'node:assert/strict';
import {auditA0Prerequisites} from '../dist/index.js';
const lesson=(lessonId,prerequisites=[],targetLanguage='en-CA')=>({lessonId,prerequisites,targetLanguage});
test('A0 graph audit accepts ordered valid chains',()=>{
 assert.deepEqual(auditA0Prerequisites([lesson('a'),lesson('b',['a']),lesson('c',['b'])]),[]);
});
test('A0 graph audit identifies missing, cross-language, duplicate, self and cyclic links',()=>{
 const items=[lesson('a',['b']),lesson('b',['a']),lesson('self',['self']),lesson('missing',['gone']),lesson('fr',[],'fr-CA'),lesson('cross',['fr']),lesson('a')];
 const issues=auditA0Prerequisites(items);
 for(const code of ['CYCLIC_PREREQUISITE','SELF_PREREQUISITE','MISSING_PREREQUISITE','CROSS_LANGUAGE_PREREQUISITE','DUPLICATE_LESSON'])
  assert.ok(issues.some(i=>i.code===code),code);
});
