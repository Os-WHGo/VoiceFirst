import test from 'node:test';
import assert from 'node:assert/strict';
import {spanishSituationCandidates,auditSpanishSituationCandidates,lessonsFor} from '../dist/index.js';
test('Spanish A1 A2 situations are complete but review only',()=>{
 const audit=auditSpanishSituationCandidates();
 assert.equal(audit.valid,true);
 assert.equal(audit.readyForPublicRelease,false);
 assert.equal(spanishSituationCandidates.length,4);
 assert.deepEqual(spanishSituationCandidates.map(x=>x.level),['A1','A1','A2','A2']);
 assert.ok(spanishSituationCandidates.every(x=>x.locale==='es'&&x.publishable===false));
 assert.equal(lessonsFor('es').length,14);
});
test('Spanish candidates reject duplicate and unsafe publication flags',()=>{
 const first=spanishSituationCandidates[0];
 assert.equal(auditSpanishSituationCandidates([first,first]).valid,false);
 assert.equal(auditSpanishSituationCandidates([{...first,publishable:true}]).valid,false);
 assert.equal(auditSpanishSituationCandidates([{...first,audio:'available'}]).valid,false);
 assert.equal(auditSpanishSituationCandidates([{...first,dialogue:['','']}]).valid,false);
});
