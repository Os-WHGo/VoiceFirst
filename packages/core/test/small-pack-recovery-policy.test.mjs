import test from 'node:test';
import assert from 'node:assert/strict';
import {decideSmallPackRecovery} from '../dist/index.js';
const hash='a'.repeat(64);
const base={id:'en-ca',version:'1.0.0',expectedSha256:hash,verifiedSha256:hash,phase:'verified'};
test('recovery distinguishes safe promotion from ambiguous or corrupt folders',()=>{
 assert.equal(decideSmallPackRecovery(base,'destination-valid'),'promotion-interrupted');
 assert.equal(decideSmallPackRecovery({...base,phase:'installed'},'destination-valid'),'installed-verified');
 for(const presence of ['both','destination-invalid','staging-invalid'])assert.equal(decideSmallPackRecovery(base,presence),'blocked');
 assert.equal(decideSmallPackRecovery(base,'staging-valid'),'staging-interrupted');
 assert.equal(decideSmallPackRecovery(base,'none'),'missing-files');
});
test('recovery never finalizes unverified or staging-only journal',()=>{
 assert.equal(decideSmallPackRecovery({...base,phase:'staging',verifiedSha256:undefined},'destination-valid'),'blocked');
 assert.equal(decideSmallPackRecovery({...base,verifiedSha256:'b'.repeat(64)},'destination-valid'),'blocked');
 assert.equal(decideSmallPackRecovery({...base,phase:'failed'},'destination-valid'),'blocked');
});

test('malformed journal metadata cannot authorize recovery',()=>{
 for(const state of [
  {...base,id:'../outside'},
  {...base,version:'not-semver'},
  {...base,expectedSha256:'broken'},
  {...base,phase:'unexpected'},
  null
 ]){
  assert.equal(decideSmallPackRecovery(state,'destination-valid'),'blocked');
 }
});
