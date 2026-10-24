import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueExternalCurriculum} from '../dist/index.js';
const skills=Object.fromEntries(['listening','speaking','reading','writing','interaction','mediation'].map(k=>[k,{}]));
const status={publishable:false};
test('catalogue preserves source and canonical identifiers without publishing',()=>{
 const units=[{id:'en-ca-a1-01-greetings',unitId:'greetings-and-introductions',level:'A1',targetLanguage:'en-CA',skills,status},
 {id:'en-ca-a2-01-new',unitId:'new-a2-topic',level:'A2',targetLanguage:'en-CA',skills,status}];
 const r=catalogueExternalCurriculum({units});
 assert.equal(r.acceptedForReview,true);assert.equal(r.entries.length,2);
 assert.equal(r.entries[0].conflictsWithExistingDraft,true);
 assert.equal(r.entries[1].conflictsWithExistingDraft,false);
 assert.equal(r.entries[0].sourceId,'en-ca-a1-01-greetings');
 assert.ok(r.entries.every(x=>x.reviewState==='candidate-only'&&!x.publicAvailable));
 assert.equal(r.readyForPublicRelease,false);
});
test('invalid candidate yields no catalogue entries',()=>{
 const r=catalogueExternalCurriculum({units:[{id:'broken'}]});
 assert.equal(r.acceptedForReview,false);assert.equal(r.entries.length,0);
});
