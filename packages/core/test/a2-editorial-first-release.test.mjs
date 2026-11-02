import test from 'node:test';
import assert from 'node:assert/strict';
import {
 a2DraftTopics,a2EditorialDrafts,a2VocabularyConcepts,a2LocalizedPreview,
 a2AudioExpectedIds,a2AudioBaseline,auditA2EditorialDrafts,
 firstReleaseLanguages,comingSoonLanguages,firstReleaseLanguagePairs,
 curriculumUnitBlueprint,courseSkills,lessonsFor,a1EditorialDrafts,
 auditCurriculumProduction,firstPublicReleaseReadiness
} from '../dist/index.js';

test('A2 has eight original, distinct, situational authoring briefs per first-release target',()=>{
 assert.deepEqual(a2DraftTopics,curriculumUnitBlueprint.A2);
 assert.equal(a2EditorialDrafts.length,24);
 assert.deepEqual(auditA2EditorialDrafts(),{
  valid:true,errors:[],plannedFirstReleaseUnits:24,actualDrafts:24,
  approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false
 });
 const ids=new Set(),dialogues=new Set();
 for(const language of firstReleaseLanguages){
  const units=a2EditorialDrafts.filter(u=>u.targetLanguage===language);
  assert.deepEqual(units.map(u=>u.unitId),a2DraftTopics);
  for(const unit of units){
   const key=language+'/'+unit.unitId;
   assert.equal(ids.has(key),false,key);ids.add(key);
   assert.equal(unit.level,'A2');
   assert.equal(unit.status,'draft');
   assert.equal(unit.publicAvailable,false);
   assert.equal(unit.editorialStatus,'not-human-reviewed');
   assert.equal(unit.audioStatus,'not-recorded');
   assert.equal(unit.rightsStatus,'pending-editorial-clearance');
   assert.ok(unit.outcomes[0].trim().length>25);
   assert.ok(unit.grammarFocus.trim().length>=25);
   assert.equal(unit.dialogue.length,2);
   assert.ok(unit.dialogue.every(line=>line.trim().length>=12));
   const dialogueKey=language+'/'+unit.dialogue.join(' | ');
   assert.equal(dialogues.has(dialogueKey),false,dialogueKey);
   dialogues.add(dialogueKey);
   assert.deepEqual(unit.activities.map(a=>a.skill),courseSkills);
   assert.equal(unit.activities.length,6);
   assert.ok(unit.activities.every(a=>a.prompt.length>=25));
   assert.deepEqual(unit.lexemes.map(x=>x.conceptId),a2VocabularyConcepts[unit.unitId]);
   assert.equal(new Set(unit.lexemes.map(x=>x.conceptId)).size,4);
   assert.ok(unit.lexemes.every(x=>x.form.trim().length>2));
  }
  assert.equal(lessonsFor(language).length,14,'A2 editorial text never enters the live course');
 }
 assert.deepEqual(new Set(a2EditorialDrafts.map(u=>u.targetLanguage)),new Set(firstReleaseLanguages));
 for(const language of comingSoonLanguages){
  assert.equal(a2EditorialDrafts.some(u=>u.targetLanguage===language),false);
  assert.equal(lessonsFor(language).length,14,'historical six-language foundations remain intact');
 }
 assert.equal(a1EditorialDrafts.length,48,'earlier six-language A1 drafts are retained');
});

test('A2 offers only six authorized directed pairs times eight topics, always non-public',()=>{
 assert.equal(firstReleaseLanguagePairs.length,6);
 let previews=0;
 for(const {known,target} of firstReleaseLanguagePairs){
  for(const unitId of a2DraftTopics){
   const p=a2LocalizedPreview(known,target,unitId);
   assert.ok(p,known+'>'+target+'/'+unitId);
   assert.equal(p.status,'editorial-only');
   assert.equal(p.audioStatus,'not-recorded');
   assert.equal(p.editorialStatus,'not-human-reviewed');
   assert.equal(p.rightsStatus,'pending-editorial-clearance');
   assert.equal(p.publicAvailable,false);
   assert.equal(p.readyForListening,false);
   assert.equal(p.activities.length,6);
   assert.deepEqual(p.activities.map(x=>x.skill),courseSkills);
   assert.ok(p.activities.every(x=>x.instruction.length>15&&x.draftPrompt.length>=25));
   assert.ok(p.topicHelp.length>15);
   assert.equal(p.dialogue.length,2);
   previews++;
  }
 }
 assert.equal(previews,48);
 assert.equal(a2LocalizedPreview('es','es','past-experiences'),null);
 assert.equal(a2LocalizedPreview('pt-BR','es','past-experiences'),null);
 assert.equal(a2LocalizedPreview('es','de','past-experiences'),null);
 assert.equal(a2LocalizedPreview('en-CA','it','past-experiences'),null);
});
test('48 A2 audio turns are missing, and editing cannot silently certify release',()=>{
 assert.equal(a2AudioExpectedIds.length,48);
 assert.equal(new Set(a2AudioExpectedIds).size,48);
 assert.equal(a2AudioBaseline.expected,48);
 assert.equal(a2AudioBaseline.verified,0);
 assert.equal(a2AudioBaseline.missing.length,48);
 assert.equal(a2AudioBaseline.readyForEditorialPlayback,false);
 assert.equal(a2AudioBaseline.readyForPublicRelease,false);
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
 const tampered=a2EditorialDrafts.map(x=>({...x}));
 tampered[0]={...tampered[0],publicAvailable:true};
 assert.equal(auditA2EditorialDrafts(tampered).valid,false);
 assert.ok(auditA2EditorialDrafts(tampered).errors.some(x=>x.includes('PREMATURE_A2_PUBLICATION')));
 const missing=a2EditorialDrafts.slice(1);
 assert.equal(auditA2EditorialDrafts(missing).valid,false);
 const production=auditCurriculumProduction([...a1EditorialDrafts,...a2EditorialDrafts]);
 assert.equal(production.valid,true);
 assert.equal(production.levels.filter(x=>firstReleaseLanguages.includes(x.targetLanguage)&&x.level==='A2')
  .reduce((n,x)=>n+x.drafts,0),24);
 assert.equal(production.levels.some(x=>x.documentedReviews>0),false);
});
