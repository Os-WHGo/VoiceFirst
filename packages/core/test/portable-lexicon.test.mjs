import test from 'node:test';
import assert from 'node:assert/strict';
import {
 targetLanguages,lexicalSeed,portableLexiconDraftsFromSeed,
 validatePortableLexicalRecord,buildPortableLexiconBundle,findPortableLexicalHints
} from '../dist/index.js';

const approved=(overrides={})=>({
 id:'original-greeting-1',locale:'es-CL',script:'Latn',kind:'phrase',
 form:'¡Buenos días!',alternatives:['Buen día'],senseId:'greeting-morning',
 register:'neutral',
 review:{status:'reviewed',evidenceRef:'review-ledger-2026-001'},
 rights:{status:'granted',rightsHolder:'Authorized original author',
  licenseRef:'reuse-agreement-001',allowedUses:['lesson','subtitle-hint'],
  communityControlled:false},
 ...overrides
});

test('existing six-language lexical seed produces exactly twelve DRAFT items',()=>{
 const drafts=portableLexiconDraftsFromSeed();
 assert.equal(drafts.length,12);
 assert.equal(drafts.length,lexicalSeed.length);
 assert.deepEqual([...new Set(drafts.map(x=>x.locale))].sort(),[...targetLanguages].sort());
 assert.ok(drafts.every(d=>d.review.status==='draft'&&d.rights.status==='pending'));
 assert.ok(drafts.every(d=>!validatePortableLexicalRecord(d)));
 for(const use of ['lesson','subtitle-hint','speech-hint']){
  const result=buildPortableLexiconBundle(drafts,use,'en-CA');
  assert.equal(result.status,'ok');
  assert.equal(result.bundle.entries.length,0);
  assert.equal(result.notExported,12);
 }
});

test('licensed original reviewed vocabulary is selected by exact target locale and purpose',()=>{
 const items=[approved(),approved({id:'english',locale:'en-CA',form:'Hello',alternatives:[],senseId:'greet'})];
 const r=buildPortableLexiconBundle(items,'subtitle-hint','es-CL');
 assert.equal(r.status,'ok');
 assert.equal(r.bundle.schema,'voicefirst.lexicon.v1');
 assert.equal(r.bundle.entries.length,1);
 assert.equal(r.notExported,1);
 assert.equal(r.bundle.entries[0].form,'¡Buenos días!');
 assert.equal(findPortableLexicalHints(r.bundle,'¡BUENOS DÍAS!').length,1);
 assert.equal(findPortableLexicalHints(r.bundle,'buen día').length,1);
 assert.equal(findPortableLexicalHints(r.bundle,'buenos dias').length,0);
 assert.equal(findPortableLexicalHints(r.bundle,'¡Buenos días').length,0);
 assert.equal(buildPortableLexiconBundle(items,'speech-hint','es-CL').bundle.entries.length,0);
 assert.equal(buildPortableLexiconBundle(items,'subtitle-hint','es-ES').bundle.entries.length,0);
});

test('community-controlled records cannot export without a distinct community approval',()=>{
 const sensitive=approved({
  id:'community-synthetic-test',form:'example placeholder',locale:'en-CA',
  rights:{...approved().rights,communityControlled:true}
 });
 assert.match(validatePortableLexicalRecord(sensitive),/community authorization/i);
 const fail=buildPortableLexiconBundle([sensitive],'subtitle-hint','en-CA');
 assert.equal(fail.status,'blocked');
 const allowed={...sensitive,rights:{...sensitive.rights,communityAuthorizationRef:'explicit-community-agreement-ref'}};
 const res=buildPortableLexiconBundle([allowed],'subtitle-hint','en-CA');
 assert.equal(res.status,'ok');
 assert.equal(res.bundle.entries.length,1);
 assert.equal(res.bundle.entries[0].rights.communityAuthorizationRef,'explicit-community-agreement-ref');
});

test('Unicode NFC/NFD are compared without destroying original graphemes or text',()=>{
 const original='a\u0301ʔ'; // synthetic Unicode test string, not community vocabulary
 const item=approved({id:'unicode-glyph-test',form:original,alternatives:['ŋa'],locale:'und-Latn'});
 const r=buildPortableLexiconBundle([item],'subtitle-hint','und-Latn');
 assert.equal(r.status,'ok');
 const copy=JSON.parse(JSON.stringify(r.bundle));
 assert.equal(copy.entries[0].form,original);
 assert.equal(findPortableLexicalHints(copy,'áʔ').length,1);
 assert.equal(findPortableLexicalHints(copy,'ŋa').length,1);
 assert.equal(findPortableLexicalHints(copy,'aʔ').length,0);
});

test('invalid, duplicate and unauthorized content is blocked rather than leaked to other apps',()=>{
 const good=approved();
 assert.equal(buildPortableLexiconBundle([good,good],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([approved({id:'with a space'})],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([approved({form:'bad\u202Etext'})],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([approved({alternatives:['bad\nline']})],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([approved({review:{status:'reviewed'}})],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([approved({rights:{...good.rights,licenseRef:''}})],'subtitle-hint','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([good],'another-purpose','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle(null,'lesson','es-CL').status,'blocked');
 assert.equal(buildPortableLexiconBundle([good],'lesson','not a locale').status,'blocked');
 const pending=approved({rights:{...good.rights,status:'pending'}});
 assert.equal(buildPortableLexiconBundle([pending],'lesson','es-CL').bundle.entries.length,0);
});

test('portable format excludes unrecognized metadata and never performs ASR or subtitle corrections',()=>{
 const input=approved({privateToken:'must-not-export',editorPrivateNotes:'internal only'});
 const result=buildPortableLexiconBundle([input],'subtitle-hint','es-CL');
 assert.equal(result.status,'ok');
 const JSONText=JSON.stringify(result.bundle);
 assert.equal(JSONText.includes('privateToken'),false);
 assert.equal(JSONText.includes('editorPrivateNotes'),false);
 assert.equal(findPortableLexicalHints(result.bundle,'¡Buenos días!')[0].form,'¡Buenos días!');
 assert.equal(findPortableLexicalHints({...result.bundle,use:'speech-hint'},'¡Buenos días!').length,0);
});
