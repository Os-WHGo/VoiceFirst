import test from 'node:test';
import assert from 'node:assert/strict';
import {a1AudioExpectedIds,verifyA1AudioFile} from '../dist/index.js';
const [targetLanguage,unitId,role]=a1AudioExpectedIds[0].split('/');
const asset={id:a1AudioExpectedIds[0],targetLanguage,unitId,role,uri:'a1/audio.wav',sha256:'a'.repeat(64),bytes:128,reviewerId:'editor-01',rightsReference:'original-audio-license',accentTag:'en-CA'};
const native={fileSizeBytes:async()=>128,sha256File:async()=> 'a'.repeat(64)};
test('actual local size and checksum are both required',async()=>{
 assert.equal((await verifyA1AudioFile(asset,'file:///cache/a1.wav',native)).status,'verified');
 assert.equal((await verifyA1AudioFile(asset,'file:///cache/a1.wav',{...native,fileSizeBytes:async()=>127})).reason,'size-mismatch');
 assert.equal((await verifyA1AudioFile(asset,'file:///cache/a1.wav',{...native,sha256File:async()=> 'b'.repeat(64)})).reason,'checksum-mismatch');
});
test('rejects untrusted paths, incomplete metadata and native errors',async()=>{
 assert.equal((await verifyA1AudioFile(asset,'https://example.org/a1.wav',native)).reason,'invalid-uri');
 assert.equal((await verifyA1AudioFile(asset,'file:///cache/../a1.wav',native)).reason,'invalid-uri');
 assert.equal((await verifyA1AudioFile({...asset,rightsReference:''},'file:///cache/a1.wav',native)).reason,'invalid-manifest');
 assert.equal((await verifyA1AudioFile(asset,'file:///cache/a1.wav',{...native,sha256File:async()=>{throw Error('offline');}})).reason,'native-verification-failed');
});
