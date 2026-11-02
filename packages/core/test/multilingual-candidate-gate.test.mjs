import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMultilingualCandidate} from '../dist/multilingual-candidate-gate.js';
test('accepts draft Portuguese units without publishing',()=>{const r=auditMultilingualCandidate({meta:{language:'pt-BR'},units:[{id:'ptbr-a1-u01',level:'A1',editorial_status:'not-human-reviewed'}]},'pt-BR');assert.equal(r.acceptedForReview,true);assert.equal(r.readyForPublicRelease,false);assert.equal(r.units[0].publishable,false)});
test('rejects locale mismatch, duplicates, release flags and false review claims',()=>{const r=auditMultilingualCandidate({meta:{language:'en-CA'},units:[{id:'abc',level:'A1',publishable:true},{id:'abc',level:'A2',editorial_status:'human-reviewed'}]},'fr-CA');assert.equal(r.acceptedForReview,false);assert.ok(r.errors.length>=4)});
test('rejects malformed candidates',()=>{assert.equal(auditMultilingualCandidate({},'de').acceptedForReview,false)});

test('accepts B1 and B2 drafts for review only',()=>{for(const level of ['B1','B2']){const r=auditMultilingualCandidate({meta:{language:'pt-BR'},units:[{id:`ptbr-${level.toLowerCase()}-u01`,level,editorial_status:'not-human-reviewed',publishable:false}]},'pt-BR');assert.equal(r.acceptedForReview,true);assert.equal(r.readyForPublicRelease,false);assert.equal(r.units[0].publishable,false);assert.equal(r.units[0].level,level)}});
test('rejects unsupported C1 candidate level',()=>{const r=auditMultilingualCandidate({units:[{id:'ptbr-c1-u01',level:'C1'}]},'pt-BR');assert.equal(r.acceptedForReview,false)});
