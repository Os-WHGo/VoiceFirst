import test from 'node:test';
import assert from 'node:assert/strict';
import {a1AudioBaseline,a1AudioExpectedIds,auditA1AudioAssets} from '../dist/index.js';
test('24 A1 dialogue turns are absent until recordings are verified',()=>{assert.equal(a1AudioExpectedIds.length,24);assert.equal(new Set(a1AudioExpectedIds).size,24);assert.equal(a1AudioBaseline.expected,24);assert.equal(a1AudioBaseline.verified,0);assert.equal(a1AudioBaseline.missing.length,24);assert.equal(a1AudioBaseline.readyForEditorialPlayback,false);assert.equal(a1AudioBaseline.readyForPublicRelease,false);});
test('rejects incomplete and repeated manifest entries',()=>{assert.equal(auditA1AudioAssets([{id:a1AudioExpectedIds[0]}]).verified,0);assert.ok(auditA1AudioAssets([{id:a1AudioExpectedIds[0]}]).errors.length>0);assert.equal(auditA1AudioAssets([null]).readyForEditorialPlayback,false);});
