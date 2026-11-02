import test from 'node:test';
import assert from 'node:assert/strict';
import {
 b1DraftTopics,b1EditorialDrafts,b1VocabularyConcepts,b1LocalizedPreview,
 b1AudioExpectedIds,b1AudioBaseline,auditB1EditorialDrafts,
 a1EditorialDrafts,a2EditorialDrafts,
 firstReleaseLanguages,comingSoonLanguages,firstReleaseLanguagePairs,
 curriculumUnitBlueprint,courseSkills,lessonsFor,firstPublicReleaseReadiness,
 auditCurriculumProduction
} from '../dist/index.js';

test('first-release B1 contains eight original dialogue-and-task briefs in each of three languages',()=>{
 assert.deepEqual(b1DraftTopics,curriculumUnitBlueprint.B1);
 assert.equal(b1EditorialDrafts.length,24);
 assert.deepEqual(auditB1EditorialDrafts(),{
  valid:true,errors:[],plannedFirstReleaseUnits:24,actualDrafts:24,
  approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false
 });
 const ids=new Set(),dialogues=new Set();
 for(const language of firstReleaseLanguages){
  const units=b1EditorialDrafts.filter(x=>x.targetLanguage===language);
  assert.deepEqual(units.map(x=>x.unitId),b1DraftTopics);
  for(const unit of units){
   const key=language+'/'+unit.unitId;
   assert.equal(ids.has(key),false,key);ids.add(key);
   assert.equal(unit.level,'B1');
   assert.equal(unit.status,'draft');
   assert.equal(unit.publicAvailable,false);
   assert.equal(unit.editorialStatus,'not-human-reviewed');
   assert.equal(unit.audioStatus,'not-recorded');
   assert.equal(unit.rightsStatus,'pending-editorial-clearance');
   assert.ok(unit.outcomes[0].length>25);
   assert.ok(unit.grammarFocus.length>=25);
   assert.equal(unit.dialogue.length,2);
   assert.ok(unit.dialogue.every(line=>line.trim().length>=12));
   const dialogueKey=language+'/'+unit.dialogue.join(' | ');
   assert.equal(dialogues.has(dialogueKey),false,dialogueKey);
   dialogues.add(dialogueKey);
   assert.deepEqual(unit.activities.map(a=>a.skill),courseSkills);
   assert.equal(unit.activities.length,6);
   assert.ok(unit.activities.every(a=>a.prompt.trim().length>=25));
   assert.deepEqual(unit.lexemes.map(x=>x.conceptId),b1VocabularyConcepts[unit.unitId]);
   assert.equal(new Set(unit.lexemes.map(x=>x.conceptId)).size,4);
   assert.ok(unit.lexemes.every(x=>x.form.trim().length>2));
  }
  assert.equal(lessonsFor(language).length,14,'B1 briefs never become playable courses');
 }
 assert.deepEqual(new Set(b1EditorialDrafts.map(x=>x.targetLanguage)),new Set(firstReleaseLanguages));
 for(const language of comingSoonLanguages){
  assert.equal(b1EditorialDrafts.some(x=>x.targetLanguage===language),false);
  assert.equal(lessonsFor(language).length,14,'later-language foundations are not removed');
 }
 assert.equal(a1EditorialDrafts.length,48);
 assert.equal(a2EditorialDrafts.length,24);
});
test('48 help-target-topic B1 previews remain editorial and unavailable to learners',()=>{
 assert.equal(firstReleaseLanguagePairs.length,6);
 let count=0;
 for(const {known,target} of firstReleaseLanguagePairs)for(const topic of b1DraftTopics){
  const p=b1LocalizedPreview(known,target,topic);
  assert.ok(p,known+'>'+target+'/'+topic);
  assert.equal(p.status,'editorial-only');
  assert.equal(p.publicAvailable,false);
  assert.equal(p.readyForListening,false);
  assert.equal(p.audioStatus,'not-recorded');
  assert.equal(p.editorialStatus,'not-human-reviewed');
  assert.equal(p.rightsStatus,'pending-editorial-clearance');
  assert.equal(p.activities.length,6);
  assert.deepEqual(p.activities.map(x=>x.skill),courseSkills);
  assert.ok(p.activities.every(x=>x.instruction.length>15&&x.draftPrompt.length>=25));
  assert.ok(p.topicHelp.length>15);
  count++;
 }
 assert.equal(count,48);
 assert.equal(b1LocalizedPreview('es','es','narrating-events'),null);
 assert.equal(b1LocalizedPreview('pt-BR','es','narrating-events'),null);
 assert.equal(b1LocalizedPreview('es','de','narrating-events'),null);
 assert.equal(b1LocalizedPreview('en-CA','it','narrating-events'),null);
});
test('48 B1 audio cues remain missing; tampering cannot mark a public or certified B1 course',()=>{
 assert.equal(b1AudioExpectedIds.length,48);
 assert.equal(new Set(b1AudioExpectedIds).size,48);
 assert.equal(b1AudioBaseline.expected,48);
 assert.equal(b1AudioBaseline.verified,0);
 assert.equal(b1AudioBaseline.missing.length,48);
 assert.equal(b1AudioBaseline.readyForEditorialPlayback,false);
 assert.equal(b1AudioBaseline.readyForPublicRelease,false);
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
 const tampered=b1EditorialDrafts.map(x=>({...x}));
 tampered[0]={...tampered[0],publicAvailable:true};
 assert.equal(auditB1EditorialDrafts(tampered).valid,false);
 assert.ok(auditB1EditorialDrafts(tampered).errors.some(e=>e.includes('PREMATURE_B1_PUBLICATION')));
 assert.equal(auditB1EditorialDrafts(b1EditorialDrafts.slice(1)).valid,false);
 const audit=auditCurriculumProduction([...a1EditorialDrafts,...a2EditorialDrafts,...b1EditorialDrafts]);
 assert.equal(audit.valid,true);
 assert.equal(audit.levels.filter(x=>firstReleaseLanguages.includes(x.targetLanguage)&&x.level==='B1')
  .reduce((n,x)=>n+x.drafts,0),24);
 assert.equal(audit.levels.some(x=>x.documentedReviews>0),false);
});
