import test from 'node:test';
import assert from 'node:assert/strict';
import {readLanguagePackJournal} from '../dist/index.js';
const base={id:'en-ca',version:'1.0.0',phase:'staging',expectedSha256:'a'.repeat(64)};
test('journal revalidates interrupted staging without trusting a persisted commit',()=>{
 const result=readLanguagePackJournal(JSON.stringify(base));
 assert.equal(result.status,'ok');
 assert.equal(result.recovery.action,'retry-verification');
});
test('journal rejects corrupted or untrusted persisted records',()=>{
 assert.equal(readLanguagePackJournal('{').status,'rejected');
 assert.equal(readLanguagePackJournal('x'.repeat(4097)).reason,'too-large');
 assert.equal(readLanguagePackJournal(JSON.stringify({...base,id:'../outside'})).status,'rejected');
 assert.equal(readLanguagePackJournal(JSON.stringify({...base,verifiedSha256:'b'.repeat(64)})).status,'rejected');
 assert.equal(readLanguagePackJournal(JSON.stringify({...base,extra:true})).status,'rejected');
});

test('journal persists trusted payload size and rejects malformed sizes',()=>{
 const updated={...base,expectedBytes:100};
 const read=readLanguagePackJournal(JSON.stringify(updated));
 assert.equal(read.status,'ok');
 assert.equal(read.state.expectedBytes,100);
 for(const expectedBytes of [-1,0,1.2,'100']){
  assert.equal(readLanguagePackJournal(JSON.stringify({...updated,expectedBytes})).status,'rejected');
 }
 // Legacy journals are readable for diagnosis, but mobile activation requires size.
 assert.equal(readLanguagePackJournal(JSON.stringify(base)).status,'ok');
});

test('legacy journal remains readable while revision metadata is strictly bounded',()=>{
 assert.equal(readLanguagePackJournal(JSON.stringify(base)).status,'ok');
 for(const revision of [-1,0.5,'1',null,Number.MAX_SAFE_INTEGER+1]){
  assert.equal(readLanguagePackJournal(JSON.stringify({...base,revision})).status,'rejected');
 }
 const versioned=readLanguagePackJournal(JSON.stringify({...base,revision:17}));
 assert.equal(versioned.status,'ok');
 assert.equal(versioned.state.revision,17);
});
