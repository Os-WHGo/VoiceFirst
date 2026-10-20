import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptMetaCurriculumCandidate,auditConceptCoverage} from '../dist/index.js';
const unit={id:'en-ca-b2-01',level:'B2',objectives:['Negotiate respectfully'],vocabulary:[{lemma:'negotiation'}],skills:Object.fromEntries(['listening','speaking','reading','writing','interaction','mediation'].map(k=>[k,{instructions:'Practice'}]))};
const dialogues={dialogues:[{unitId:unit.id,turns:[{speaker:'A',text:'Could we discuss the offer?'}]}]};
const supports={translations:{es:{[unit.id]:{objectives_explained:'Practica la negociación'}},'fr-CA':{[unit.id]:{objectives_explained:'Pratique la négociation'}},'pt-BR':{[unit.id]:{objectives_explained:'Pratique a negociação'}},de:{[unit.id]:{objectives_explained:'Verhandlung üben'}},it:{[unit.id]:{objectives_explained:'Pratica la negoziazione'}}}};
test('Meta B2 candidate adapter retains 5 known-language supports and blocks publication',()=>{
 const r=adaptMetaCurriculumCandidate('en-CA',{units:[unit]},dialogues,supports);
 assert.deepEqual(r.issues,[]);assert.equal(r.units.length,1);assert.equal(r.supports.length,5);assert.equal(r.readyForPublicRelease,false);
 const coverage=auditConceptCoverage(r.concepts[0],r.units,r.supports);
 assert.equal(coverage.candidatePairs,5);assert.equal(coverage.missingPairs,25);
});
test('Meta adapter reports missing dialogue and missing support without inventing data',()=>{
 const missing=adaptMetaCurriculumCandidate('en-CA',{units:[unit]},{dialogues:[]},supports);
 assert.ok(missing.issues.some(i=>i.code==='INCOMPLETE_UNIT'));
 const partial=adaptMetaCurriculumCandidate('en-CA',{units:[unit]},dialogues,{translations:{es:supports.translations.es}});
 assert.equal(partial.supports.length,1);assert.equal(partial.issues.filter(i=>i.code==='MISSING_SUPPORT').length,4);
});
test('Meta adapter handles French unit-indexed translation layout',()=>{
 const french={...unit,id:'fr-ca-b2-01'};
 const r=adaptMetaCurriculumCandidate('fr-CA',{units:[french]},{dialogues:[{unitId:french.id,turns:[{speaker:'A',text:'Bonjour'}]}]},{translations:{[french.id]:{'en-CA':'Hello',es:'Hola','pt-BR':'Olá',de:'Hallo',it:'Ciao'}}});
 assert.equal(r.supports.length,5);assert.equal(r.issues.length,0);
});
