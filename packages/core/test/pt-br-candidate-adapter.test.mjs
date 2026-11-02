import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPortugueseCandidate} from '../dist/index.js';
const skills=['listening','speaking','reading','writing','interaction','mediation'];
const u={id:'ptbr-a1-u01',level:'A1',editorial_status:'not-human-reviewed',vocabulary:[{id:'voc-a1-u01-01'}],activities:Object.fromEntries(skills.map(s=>[s,[{id:s}]]))};
const c={meta:{language:'pt-BR',editorial_status:'not-human-reviewed'},units:[u]};
const d={meta:{language:'pt-BR',editorial_status:'not-human-reviewed'},dialogues:[{id:'ptbr-a1-dlg-01',unit_ref:u.id,vocabulary_refs:['voc-a1-u01-01'],editorial_status:'not-human-reviewed'}]};
test('PT-BR candidate is review-only and preserves identifiers',()=>{const r=inspectPortugueseCandidate(c,d);assert.equal(r.acceptedForReview,true);assert.equal(r.unitCount,1);assert.equal(r.dialogueCount,1);assert.equal(r.entries[0].sourceId,u.id);assert.equal(r.entries[0].publicAvailable,false);assert.equal(r.readyForPublicRelease,false)});
test('rejects missing listening and bad dialogue references',()=>{const broken={...c,units:[{...u,activities:{...u.activities,listening:[]}}]};assert.equal(inspectPortugueseCandidate(broken,d).acceptedForReview,false);assert.equal(inspectPortugueseCandidate(c,{...d,dialogues:[{...d.dialogues[0],unit_ref:'absent'}]}).acceptedForReview,false)});
