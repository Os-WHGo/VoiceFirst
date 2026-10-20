import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePortableLexiconBundle,buildPortableLexiconBundle} from '../dist/index.js';

const sample={
 id:'editorial-example',locale:'es-CL',script:'Latn',kind:'phrase',
 form:'Buen día',alternatives:[],senseId:'greeting',
 register:'neutral',review:{status:'reviewed',evidenceRef:'review-reference'},
 rights:{status:'granted',rightsHolder:'Sample author',
 licenseRef:'sample-grant',allowedUses:['subtitle-hint'],communityControlled:false}
};
test('portable v1 JSON roundtrips across an app boundary',()=>{
 const built=buildPortableLexiconBundle([sample],'subtitle-hint','es-CL');
 assert.equal(built.status,'ok');
 const decoded=parsePortableLexiconBundle(JSON.stringify(built.bundle));
 assert.equal(decoded.status,'ok');
 assert.deepEqual(decoded.bundle,built.bundle);
});
test('portable imports reject invalid schema or unauthorized rows',()=>{
 const built=buildPortableLexiconBundle([sample],'subtitle-hint','es-CL');
 assert.equal(parsePortableLexiconBundle('{').status,'blocked');
 assert.equal(parsePortableLexiconBundle(null).status,'blocked');
 assert.equal(parsePortableLexiconBundle(JSON.stringify({...built.bundle,schema:'future-v2'})).status,'blocked');
 assert.equal(parsePortableLexiconBundle(JSON.stringify({...built.bundle,locale:'fr-CA'})).status,'blocked');
 assert.equal(parsePortableLexiconBundle(JSON.stringify({...built.bundle,entries:[{...sample,review:{status:'draft'}}]})).status,'blocked');
});
