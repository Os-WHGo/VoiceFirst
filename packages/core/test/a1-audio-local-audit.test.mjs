import test from 'node:test';
import assert from 'node:assert/strict';
import {a1AudioExpectedIds,auditA1LocalAudio} from '../dist/index.js';
const id=a1AudioExpectedIds[0];const [targetLanguage,unitId,role]=id.split('/');
const asset={id,targetLanguage,unitId,role,uri:'a1/audio.wav',sha256:'a'.repeat(64),bytes:128,reviewerId:'editor-01',rightsReference:'original-audio-license',accentTag:'en-CA'};
const native={fileSizeBytes:async()=>128,sha256File:async()=> 'a'.repeat(64)};
test('empty and partially verified audio inventories remain unavailable',async()=>{
 const empty=await auditA1LocalAudio([],native);
 assert.equal(empty.expected,24);assert.equal(empty.verified,0);assert.equal(empty.missing.length,24);assert.equal(empty.readyForEditorialPlayback,false);
 const partial=await auditA1LocalAudio([{asset,localUri:'file:///cache/a1.wav'}],native);
 assert.equal(partial.verified,1);assert.equal(partial.missing.length,23);assert.equal(partial.readyForEditorialPlayback,false);assert.equal(partial.readyForPublicRelease,false);
});
test('duplicate, corrupted and missing audio cannot silently pass',async()=>{
 const entry={asset,localUri:'file:///cache/a1.wav'};
 const duplicate=await auditA1LocalAudio([entry,entry],native);
 assert.equal(duplicate.rejected[0].reason,'unexpected-or-duplicate');assert.equal(duplicate.readyForEditorialPlayback,false);
 const bad=await auditA1LocalAudio([entry],{...native,sha256File:async()=> 'b'.repeat(64)});
 assert.equal(bad.verified,0);assert.equal(bad.rejected[0].reason,'checksum-mismatch');
});
