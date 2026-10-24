import test from 'node:test';
import assert from 'node:assert/strict';
import {
 targetLanguages,a1EditorialDrafts,portableLexiconDraftsFromA1Authoring,
 validatePortableLexicalRecord,buildPortableLexiconBundle,
 portableLexiconDraftsFromCourse,portableLexiconDraftsFromSeed
} from '../dist/index.js';

test('A1 editorial content contributes 48 explicitly draft phrase patterns across six languages',()=>{
 const rows=portableLexiconDraftsFromA1Authoring();
 assert.equal(rows.length,48);
 assert.equal(new Set(rows.map(x=>x.id)).size,48);
 for(const lang of targetLanguages){
  const entries=rows.filter(x=>x.locale===lang);
  assert.equal(entries.length,8);
  for(const entry of entries){
   const unit=a1EditorialDrafts.find(x=>x.targetLanguage===lang&&
     x.lexemes.some(word=>word.conceptId===entry.senseId.replace('concept-','')));
   assert.ok(unit);
   assert.ok(unit.lexemes.some(word=>word.form===entry.form));
   assert.equal(entry.band,'A1');
   assert.equal(entry.review.status,'draft');
   assert.equal(entry.rights.status,'pending');
   assert.equal(validatePortableLexicalRecord(entry),null);
  }
 }
});
test('unreviewed A1 phrase patterns cannot be exported to course, speech or subtitle consumers',()=>{
 const drafts=portableLexiconDraftsFromA1Authoring();
 for(const locale of targetLanguages){
  for(const use of ['lesson','speech-hint','subtitle-hint']){
   const exported=buildPortableLexiconBundle(drafts,use,locale);
   assert.equal(exported.status,'ok');
   assert.equal(exported.bundle.entries.length,0);
   assert.equal(exported.notExported,48);
  }
 }
});
test('A1 editorial linkage neither mutates existing seed nor pretends dictionaries are complete',()=>{
 assert.equal(portableLexiconDraftsFromCourse().length,84);
 assert.equal(portableLexiconDraftsFromSeed().length,12);
 assert.equal(portableLexiconDraftsFromA1Authoring().length,48);
 assert.equal(a1EditorialDrafts.length,12);
});
