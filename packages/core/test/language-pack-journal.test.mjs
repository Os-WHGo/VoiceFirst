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
