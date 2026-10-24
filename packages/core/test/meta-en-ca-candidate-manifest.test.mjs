import test from 'node:test';
import assert from 'node:assert/strict';
import {metaEnCaCandidateSource,metaEnCaCandidateUnitIds} from '../dist/index.js';
test('Meta EN-CA candidate has 16 distinct stable mappings and pinned checksums',()=>{
 assert.equal(metaEnCaCandidateUnitIds.length,16);
 assert.equal(new Set(metaEnCaCandidateUnitIds.map(u=>u[0])).size,16);
 assert.equal(new Set(metaEnCaCandidateUnitIds.map(u=>u[1])).size,16);
 assert.equal(metaEnCaCandidateUnitIds.filter(u=>u[2]==='A1').length,8);
 assert.equal(metaEnCaCandidateUnitIds.filter(u=>u[2]==='A2').length,8);
 assert.match(metaEnCaCandidateSource.zipSha256,/^[0-9a-f]{64}$/);
 assert.match(metaEnCaCandidateSource.curriculumJsonSha256,/^[0-9a-f]{64}$/);
 assert.equal(metaEnCaCandidateSource.reviewState,'candidate-only');
});
