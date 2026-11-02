import test from 'node:test';
import assert from 'node:assert/strict';
import {planLanguagePackRecovery} from '../dist/index.js';
const sha='c'.repeat(64);
const state=(phase,verifiedSha256)=>({id:'en-ca',version:'1.0.0',phase,expectedSha256:sha,...(verifiedSha256===undefined?{}:{verifiedSha256})});
test('recovery preserves verified installed packs and rechecks interrupted staging',()=>{
 assert.deepEqual(planLanguagePackRecovery(state('installed',sha)),{action:'keep-installed',id:'en-ca',version:'1.0.0'});
 assert.equal(planLanguagePackRecovery(state('staging')).action,'retry-verification');
 assert.equal(planLanguagePackRecovery(state('verified',sha)).action,'retry-verification');
});
test('recovery rejects corrupted state and discards only failed staging',()=>{
 assert.equal(planLanguagePackRecovery(state('failed')).action,'discard-staging');
 assert.equal(planLanguagePackRecovery(state('installed')).action,'reject');
 assert.equal(planLanguagePackRecovery(state('verified','d'.repeat(64))).action,'reject');
 assert.equal(planLanguagePackRecovery({...state('staging'),id:'../outside'}).action,'reject');
 assert.equal(planLanguagePackRecovery(null).action,'reject');
});
