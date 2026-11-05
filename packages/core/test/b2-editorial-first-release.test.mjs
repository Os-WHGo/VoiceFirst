import test from 'node:test';
import assert from 'node:assert/strict';
import {
 b2DraftTopics,b2EditorialDrafts,b2AudioExpectedIds,b2AudioBaseline,
 auditB2EditorialDrafts,b2LocalizedPreview,
 firstReleaseLanguages,comingSoonLanguages,firstReleaseLanguagePairs,
 curriculumUnitBlueprint,courseSkills,lessonsFor,firstPublicReleaseReadiness,
 auditCurriculumProduction
} from '../dist/index.js';

test('B2 contains 24 distinct, evidence-grounded, unreviewed dialogue briefs',()=>{
 assert.deepEqual(b2DraftTopics,curriculumUnitBlueprint.B2);
 assert.equal(b2EditorialDrafts.length,24);
 assert.deepEqual(auditB2EditorialDrafts(),{
  valid:true,errors:[],plannedFirstReleaseUnits:24,actualDrafts:24,
  approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false
 });
 const ids=new Set(),dialogues=new Set();
 for(const target of firstReleaseLanguages){
  const rows=b2EditorialDrafts.filter(x=>x.targetLanguage===target);
  assert.deepEqual(rows.map(x=>x.unitId),b2DraftTopics);
  for(const row of rows){
   const id=target+'/'+row.unitId;
   assert.equal(ids.has(id),false,id);ids.add(id);
   assert.equal(row.level,'B2');
   assert.equal(row.status,'draft');
   assert.equal(row.publicAvailable,false);
   assert.equal(row.editorialStatus,'not-human-reviewed');
   assert.equal(row.audioStatus,'not-recorded');
   assert.equal(row.rightsStatus,'pending-editorial-clearance');
   assert.ok(row.outcomes[0].length>=25,id);
   assert.equal(row.dialogue.length,2);
   assert.ok(row.dialogue.every(line=>line.trim().length>=25),id);
   assert.ok(row.dialogue[1].includes(row.answerEvidence),id);
   assert.ok(row.listeningQuestion.trim().length>=15,id);
   assert.equal(row.activities.length,6);
   assert.deepEqual(row.activities.map(x=>x.skill),courseSkills);
   assert.ok(row.activities.every(a=>a.prompt.trim().length>=25),id);
   const dialogueKey=target+'/'+row.dialogue.join(' | ');
   assert.equal(dialogues.has(dialogueKey),false,dialogueKey);
   dialogues.add(dialogueKey);
  }
  assert.equal(lessonsFor(target).length,14,'editorial briefs cannot become playable lessons');
 }
 for(const lang of comingSoonLanguages){
  assert.equal(b2EditorialDrafts.some(x=>x.targetLanguage===lang),false);
  assert.equal(lessonsFor(lang).length,14,'preserve legacy content for later languages');
 }
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
 assert.equal(new Set(b2AudioExpectedIds).size,48);
 assert.equal(b2AudioExpectedIds.length,48);
 assert.equal(b2AudioBaseline.verified,0);
 assert.equal(b2AudioBaseline.readyForEditorialPlayback,false);
 assert.equal(b2AudioBaseline.readyForPublicRelease,false);
});

test('48 directed preview cases are editorial, never playable or scoreable',()=>{
 let total=0;
 for(const {known,target} of firstReleaseLanguagePairs)for(const topic of b2DraftTopics){
  const preview=b2LocalizedPreview(known,target,topic);
  assert.ok(preview);
  assert.equal(preview.status,'editorial-only');
  assert.equal(preview.readyForListening,false);
  assert.equal(preview.readyForAssessment,false);
  assert.equal(preview.publicAvailable,false);
  assert.equal(preview.helpInstructions.length,6);
  assert.ok(preview.dialogue[1].includes(preview.answerEvidence));
  total++;
 }
 assert.equal(total,48);
 assert.equal(b2LocalizedPreview('es','es','negotiation'),null);
 assert.equal(b2LocalizedPreview('pt-BR','es','negotiation'),null);
 assert.equal(b2LocalizedPreview('en-CA','it','negotiation'),null);
});

test('fail closed on ungrounded listening, missing content, duplicates and false approval',()=>{
 const tampered=b2EditorialDrafts.map(x=>({...x}));
 tampered[0]={...tampered[0],answerEvidence:'this phrase was never said'};
 assert.ok(auditB2EditorialDrafts(tampered).errors.some(x=>x.includes('UNGROUNDED_B2_LISTENING')));
 tampered[0]={...b2EditorialDrafts[0],publicAvailable:true};
 assert.ok(auditB2EditorialDrafts(tampered).errors.some(x=>x.includes('PREMATURE_B2_PUBLICATION')));
 assert.ok(auditB2EditorialDrafts(b2EditorialDrafts.slice(1)).errors.some(x=>x.includes('MISSING_B2_DRAFT')));
 assert.ok(auditB2EditorialDrafts([...b2EditorialDrafts,b2EditorialDrafts[0]]).errors.some(x=>x.includes('DUPLICATE_B2')));
 const report=auditCurriculumProduction(b2EditorialDrafts);
 assert.equal(report.valid,true);
 assert.equal(report.levels.filter(x=>firstReleaseLanguages.includes(x.targetLanguage)&&x.level==='B2')
   .reduce((total,x)=>total+x.drafts,0),24);
 assert.equal(report.levels.some(x=>x.documentedReviews>0),false);
});
