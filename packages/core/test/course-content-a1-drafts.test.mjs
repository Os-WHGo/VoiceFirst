import test from 'node:test';
import assert from 'node:assert/strict';
import {
 targetLanguages,officialCefrBands,curriculumPlanFor,auditCurriculumProduction,courseSkills,
 a1EditorialDrafts,a1DraftTopics,a1VocabularyConcepts,auditA1EditorialDrafts,
 lessonsFor
} from '../dist/index.js';

test('six launch languages have eight substantive A1 drafts each without claiming a completed course',()=>{
 assert.equal(a1EditorialDrafts.length,48);
 assert.deepEqual(auditA1EditorialDrafts(),{
  valid:true,errors:[],plannedUnits:288,actualDrafts:48
 });
 for(const language of targetLanguages){
  const rows=a1EditorialDrafts.filter(x=>x.targetLanguage===language);
  assert.deepEqual(rows.map(x=>x.unitId),[...a1DraftTopics]);
  const expected=new Set(curriculumPlanFor(language).filter(x=>x.level==='A1').map(x=>x.unitId));
  for(const row of rows){
   assert.equal(row.level,'A1');
   assert.ok(expected.has(row.unitId));
   assert.equal(row.status,'draft');
   assert.equal(row.rightsStatus,'pending-editorial-clearance');
   assert.equal(row.editorialStatus,'not-human-reviewed');
   assert.equal(row.audioStatus,'not-recorded');
   assert.equal(row.revision,'0.1.0');
   assert.ok(row.outcomes[0].length>25);
   assert.ok(row.grammarFocus.length>30);
   assert.ok(row.dialogue.every(text=>text.length>=12));
   assert.equal(row.activities.length,6);
   assert.deepEqual(row.activities.map(x=>x.skill),courseSkills);
   assert.ok(row.activities.every(x=>x.prompt.length>=25));
   assert.equal(row.lexemes.length,4);
  }
  // Editorial drafts never bypass the existing lesson implementation and progress.
  assert.equal(lessonsFor(language).length,14);
 }
});
test('six-language semantic concept inventory has 192 authored phrase patterns',()=>{
 const cards=a1EditorialDrafts.flatMap(u=>u.lexemes.map(x=>({
  id:[u.targetLanguage,u.unitId,x.conceptId].join('/'),form:x.form
 })));
 assert.equal(cards.length,192);
 assert.equal(new Set(cards.map(x=>x.id)).size,192);
 for(const unit of a1EditorialDrafts){
  assert.deepEqual(unit.lexemes.map(x=>x.conceptId),
   a1VocabularyConcepts[unit.unitId]);
  assert.ok(unit.lexemes.every(x=>x.form.trim()===x.form&&x.form.length>2));
 }
 for(const concept of ['hello','state-name','meet-someone','farewell',
  'state-origin','state-residence','state-language','ask-repeat',
  'ask-time','say-hour','state-day','confirm-date',
  'introduce-family','state-relationship','describe-person','ask-who',
  'wake-up','have-breakfast','commute','morning',
  'ask-price','request-item','state-price','thank-shop',
  'ask-place','go-straight','turn-left','nearby-place',
  'ask-help','need-help','ask-slower','thank-helper']){
  assert.equal(a1EditorialDrafts.flatMap(x=>x.lexemes).filter(x=>x.conceptId===concept).length,6);
 }
});
test('production board identifies 48 A1 draft plans and retains 240 missing units',()=>{
 const audit=auditCurriculumProduction(a1EditorialDrafts);
 assert.equal(audit.valid,true);
 assert.equal(audit.levels.length,targetLanguages.length*officialCefrBands.length);
 assert.equal(audit.levels.reduce((n,x)=>n+x.plannedUnits,0),288);
 assert.equal(audit.levels.reduce((n,x)=>n+x.drafts,0),48);
 assert.equal(audit.levels.reduce((n,x)=>n+x.documentedReviews,0),0);
 assert.equal(audit.levels.reduce((n,x)=>n+x.missingUnits,0),240);
 assert.ok(audit.levels.every(x=>x.allUnitsDocumentedAsReviewed===false));
});
test('audit refuses premature signoff, missing six skills or incomplete lexical metadata',()=>{
 const base=a1EditorialDrafts[0];
 const replace=(patch)=>[Object.assign({},base,patch),...a1EditorialDrafts.slice(1)];
 assert.equal(auditA1EditorialDrafts(replace({status:'reviewed'})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({audioStatus:'available'})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({rightsStatus:'granted'})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({editorialStatus:'reviewed'})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({activities:base.activities.slice(1)})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({dialogue:['Hi']})).valid,false);
 assert.equal(auditA1EditorialDrafts(replace({lexemes:base.lexemes.slice(1)})).valid,false);
 assert.equal(auditA1EditorialDrafts([...a1EditorialDrafts,base]).valid,false);
});
