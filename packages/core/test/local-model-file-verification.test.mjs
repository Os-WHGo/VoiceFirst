import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLocalModelFile,advanceLocalModelInstall} from '../dist/index.js';
test('file verification requires bytes and independently computed native digest',async()=>{
 const pkg={id:'sample',runtime:'llama.cpp',locales:['en-CA'],bytes:2048,sha256:'a'.repeat(64),licenseId:'Apache-2.0',licenseReviewed:true,sourceUrl:'https://example.org/model',contextTokens:1024};
 const native={fileSizeBytes:async()=>2048,sha256File:async()=>('a'.repeat(64))};
 const ok=await verifyLocalModelFile(pkg,'file:///models/sample.gguf',native);
 assert.equal(ok.status,'verified');assert.equal(ok.state.phase,'verified');
 assert.equal(advanceLocalModelInstall(ok.state,'commit').state.phase,'installed');
 assert.equal((await verifyLocalModelFile(pkg,'https://example.org/model',native)).reason,'invalid-uri');
 assert.equal((await verifyLocalModelFile(pkg,'file:///models/../unsafe',native)).reason,'invalid-uri');
 assert.equal((await verifyLocalModelFile(pkg,'file:///models/sample.gguf',{...native,fileSizeBytes:async()=>1})).reason,'size-mismatch');
 assert.equal((await verifyLocalModelFile(pkg,'file:///models/sample.gguf',{...native,sha256File:async()=>('b'.repeat(64))})).reason,'checksum-mismatch');
 assert.equal((await verifyLocalModelFile(pkg,'file:///models/sample.gguf',{...native,sha256File:async()=>{throw Error('unavailable')}})).reason,'native-verification-failed');
});
