import {createHash} from 'node:crypto';
import {a1ListeningAvailability} from '../dist/index.js';
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

test('24 unique A1 local audio candidates can be inspected without granting public playback',async()=>{
 const entries=a1AudioExpectedIds.map((candidate,index)=>{
  const [targetLanguage,unitId,role]=candidate.split('/');
  return {
   asset:{id:candidate,targetLanguage,unitId,role,uri:'a1/test-'+index+'.wav',
    sha256:createHash('sha256').update(candidate).digest('hex'),
    bytes:Buffer.byteLength(candidate),reviewerId:'editor-01',
    rightsReference:'fictional-test-license',accentTag:targetLanguage},
   localUri:'file:///cache/voicefirst/test-'+index+'.wav'
  };
 });
 const files=new Map(entries.map(entry=>[entry.localUri,entry.asset]));
 const simulatedVerifier={
  fileSizeBytes:async uri=>files.get(uri)?.bytes??-1,
  sha256File:async uri=>files.get(uri)?.sha256??''
 };
 const audit=await auditA1LocalAudio(entries,simulatedVerifier);
 assert.equal(audit.expected,24);
 assert.equal(audit.verified,24);
 assert.equal(audit.missing.length,0);
 assert.deepEqual(audit.rejected,[]);
 assert.equal(audit.readyForEditorialPlayback,true);
 assert.equal(audit.readyForPublicRelease,false);
 const cards=a1ListeningAvailability(audit);
 assert.equal(cards.length,12);
 assert.ok(cards.every(card=>card.editorialPreviewAvailable&&card.publicPlaybackAvailable===false));
 // Mismatching one verified file cannot be silently treated as installed content.
 const badVerifier={...simulatedVerifier,sha256File:async uri=>
  uri===entries[0].localUri?'b'.repeat(64):simulatedVerifier.sha256File(uri)};
 const damaged=await auditA1LocalAudio(entries,badVerifier);
 assert.equal(damaged.verified,23);
 assert.equal(damaged.rejected.length,1);
 assert.equal(damaged.readyForEditorialPlayback,false);
 assert.ok(a1ListeningAvailability(damaged).every(card=>!card.editorialPreviewAvailable));
});

test('A1 inventory preflight blocks oversized, repeated-ID or reused-file batches before I/O',async()=>{
 let nativeCalls=0;
 const counting={fileSizeBytes:async()=>{nativeCalls++;return 128;},
  sha256File:async()=>{nativeCalls++;return 'a'.repeat(64);}};
 const first={asset,localUri:'file:///cache/a1.wav'};
 const [otherId]=a1AudioExpectedIds.filter(x=>x!==id);
 const [targetLanguage2,unitId2,role2]=otherId.split('/');
 const other={asset:{...asset,id:otherId,targetLanguage:targetLanguage2,unitId:unitId2,role:role2,accentTag:targetLanguage2},localUri:first.localUri};
 const reused=await auditA1LocalAudio([first,other],counting);
 assert.equal(reused.verified,0);
 assert.equal(reused.rejected[0].reason,'duplicate-local-uri');
 assert.equal(nativeCalls,0);
 const repeated=await auditA1LocalAudio([first,first],counting);
 assert.equal(repeated.rejected[0].reason,'unexpected-or-duplicate');
 assert.equal(nativeCalls,0);
 const oversized=await auditA1LocalAudio(Array.from({length:25},()=>first),counting);
 assert.equal(oversized.rejected[0].reason,'invalid-or-oversized-inventory');
 assert.equal(nativeCalls,0);
 const malformed=await auditA1LocalAudio(null,counting);
 assert.equal(malformed.readyForEditorialPlayback,false);
 assert.equal(nativeCalls,0);
});
