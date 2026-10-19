import test from 'node:test';
import assert from 'node:assert/strict';
import {beginLanguagePackInstall,advanceLanguagePackInstall} from '../dist/index.js';
const hash='b'.repeat(64);
const pack={id:'en-ca-core',kind:'course',version:'1.0.0',bytes:1024,dependencies:[],locales:['en-CA'],sha256:hash,licenseId:'test-only',licenseReviewed:true,sourceUrl:'https://example.org/pack'};
test('pack must verify matching hash before commit',()=>{
 const started=beginLanguagePackInstall(pack);
 assert.equal(started.status,'ok');
 const state=started.state;
 assert.equal(advanceLanguagePackInstall(state,'commit').status,'rejected');
 assert.equal(advanceLanguagePackInstall(state,'verify','a'.repeat(64)).status,'rejected');
 const verified=advanceLanguagePackInstall(state,'verify',hash.toUpperCase());
 assert.equal(verified.status,'ok');
 const committed=advanceLanguagePackInstall(verified.state,'commit');
 assert.equal(committed.status,'ok');
 assert.equal(committed.state.phase,'installed');
 assert.equal(advanceLanguagePackInstall(committed.state,'abort').status,'rejected');
});
test('abort prevents promotion and invalid manifest fails closed',()=>{
 const started=beginLanguagePackInstall(pack);
 const aborted=advanceLanguagePackInstall(started.state,'abort');
 assert.equal(aborted.status,'ok');
 assert.equal(advanceLanguagePackInstall(aborted.state,'commit').status,'rejected');
 assert.equal(beginLanguagePackInstall({...pack,licenseReviewed:false}).status,'rejected');
 assert.equal(beginLanguagePackInstall({...pack,dependencies:['other']}).status,'rejected');
 assert.equal(advanceLanguagePackInstall({...started.state,phase:'verified',verifiedSha256:'c'.repeat(64)},'commit').status,'rejected');
 assert.equal(advanceLanguagePackInstall({...started.state,phase:'staging',verifiedSha256:hash},'verify',hash).status,'rejected');
});
