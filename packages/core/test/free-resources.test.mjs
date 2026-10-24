import test from 'node:test';import assert from 'node:assert/strict';
import{freeLearningResources,targetLanguages,findFreeResources}from '../dist/index.js';
test('directory has linked public material for all six languages',()=>{
 for(const l of targetLanguages)assert.ok(findFreeResources(l).length>0,l);
 assert.ok(freeLearningResources.every(x=>x.reuse==='external-link-only'&&x.needsInternet));
});
test('local resource lookup handles accents, topic and publishers',()=>{
 assert.equal(findFreeResources('fr-CA','Québec').length,1);
 assert.ok(findFreeResources('en-CA','', 'speaking').length>0);
 assert.equal(findFreeResources('de','made-up-search').length,0);
});
test('portuguese university course is marked limited enrollment, not universally open',()=>{
 assert.equal(findFreeResources('pt-BR')[0].access,'free-course-enrollment-varies');
});
