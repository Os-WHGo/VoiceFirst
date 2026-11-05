import test from 'node:test';
import assert from 'node:assert/strict';
import {
 advancedEditorialDrafts,advancedAudioExpectedIds,advancedAudioBaseline,
 advancedLocalizedPreview,auditAdvancedEditorialDrafts,
 curriculumUnitBlueprint,firstReleaseLanguages,comingSoonLanguages,
 firstReleaseLanguagePairs,courseSkills,lessonsFor,firstPublicReleaseReadiness,
 auditCurriculumProduction
} from '../dist/index.js';

test('C1/C2: 48 topic-specific drafts, none human-approved, recorded or playable',()=>{
 const report=auditAdvancedEditorialDrafts();
 assert.deepEqual(report,{valid:true,errors:[],plannedFirstReleaseUnits:48,actualDrafts:48,
  approvedUnits:0,recordedAudioTurns:0,readyForPublicRelease:false});
 const ids=new Set();
 for(const language of firstReleaseLanguages){
  for(const level of ['C1','C2']){
   const rows=advancedEditorialDrafts.filter(row=>row.targetLanguage===language&&row.level===level);
   assert.equal(rows.length,8);
   assert.deepEqual(rows.map(row=>row.unitId),curriculumUnitBlueprint[level]);
   for(const row of rows){
    const id=language+'/'+level+'/'+row.unitId;
    assert.equal(ids.has(id),false);ids.add(id);
    assert.equal(row.status,'draft');
    assert.equal(row.publicAvailable,false);
    assert.equal(row.editorialStatus,'not-human-reviewed');
    assert.equal(row.audioStatus,'not-recorded');
    assert.equal(row.rightsStatus,'pending-editorial-clearance');
    assert.equal(row.dialogue.length,2);
    assert.ok(row.dialogue.every(text=>text.trim().length>=35),id);
    assert.ok(row.dialogue[1].includes(row.explicitEvidence),id);
    assert.notEqual(row.supportedInference,row.rejectedInference,id);
    assert.equal(row.activities.length,6);
    assert.deepEqual(row.activities.map(activity=>activity.skill),courseSkills);
    assert.ok(row.activities.every(activity=>activity.prompt.length>=35));
   }
  }
  assert.equal(lessonsFor(language).length,14,'editorial authoring must not add playable lessons');
 }
 assert.equal(ids.size,48);
 for(const lang of comingSoonLanguages){
  assert.equal(advancedEditorialDrafts.some(row=>row.targetLanguage===lang),false);
  assert.equal(lessonsFor(lang).length,14,'preserve earlier six-language catalog');
 }
 assert.equal(advancedAudioBaseline.expected,96);
 assert.equal(advancedAudioBaseline.verified,0);
 assert.equal(advancedAudioExpectedIds.length,96);
 assert.equal(new Set(advancedAudioExpectedIds).size,96);
 assert.equal(advancedAudioBaseline.readyForEditorialPlayback,false);
 assert.equal(advancedAudioBaseline.readyForPublicRelease,false);
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
});

test('96 help/learning previews stay editorial with inference and no score',()=>{
 let checked=0;
 for(const {known,target} of firstReleaseLanguagePairs)for(const level of ['C1','C2'])
  for(const unitId of curriculumUnitBlueprint[level]){
   const preview=advancedLocalizedPreview(known,target,level,unitId);
   assert.ok(preview);
   assert.equal(preview.status,'editorial-only');
   assert.equal(preview.publicAvailable,false);
   assert.equal(preview.readyForListening,false);
   assert.equal(preview.readyForAssessment,false);
   assert.equal(preview.readyForCertification,false);
   assert.equal(preview.instructions.length,6);
   assert.ok(preview.dialogue[1].includes(preview.explicitEvidence));
   checked++;
  }
 assert.equal(checked,96);
 assert.equal(advancedLocalizedPreview('es','es','C1','implicit-meaning'),null);
 assert.equal(advancedLocalizedPreview('pt-BR','es','C1','implicit-meaning'),null);
 assert.equal(advancedLocalizedPreview('en-CA','it','C1','implicit-meaning'),null);
 assert.equal(advancedLocalizedPreview('en-CA','fr-CA','A1','implicit-meaning'),null);
 assert.equal(advancedLocalizedPreview('en-CA','fr-CA','C1','invented-topic'),null);
});

test('C1/C2 fail closed on missing, duplicated, false approval and weak evidence',()=>{
 const original=advancedEditorialDrafts[0];
 const badEvidence=advancedEditorialDrafts.map((row,i)=>i===0?
  {...row,explicitEvidence:'the answer does not actually contain this phrase'}:row);
 assert.ok(auditAdvancedEditorialDrafts(badEvidence).errors.some(x=>x.includes('UNGROUNDED_ADVANCED_EVIDENCE')));
 const premature=advancedEditorialDrafts.map((row,i)=>i===0?
  {...row,publicAvailable:true,audioStatus:'recorded',editorialStatus:'reviewed'}:row);
 assert.ok(auditAdvancedEditorialDrafts(premature).errors.some(x=>x.includes('PREMATURE_ADVANCED_PUBLICATION')));
 const implausible=advancedEditorialDrafts.map((row,i)=>i===0?
  {...row,rejectedInference:row.supportedInference}:row);
 assert.ok(auditAdvancedEditorialDrafts(implausible).errors.some(x=>x.includes('INCOMPLETE_ADVANCED_PRAGMATICS')));
 const short=advancedEditorialDrafts.slice(1);
 assert.ok(auditAdvancedEditorialDrafts(short).errors.some(x=>x.includes('MISSING_ADVANCED_DRAFT')));
 assert.ok(auditAdvancedEditorialDrafts([...advancedEditorialDrafts,original]).errors.some(x=>x.includes('DUPLICATE_ADVANCED')));
 assert.equal(auditAdvancedEditorialDrafts(null).valid,false);
 assert.equal(auditAdvancedEditorialDrafts([null]).valid,false);
 const structure=auditCurriculumProduction(advancedEditorialDrafts);
 assert.equal(structure.valid,true);
 assert.equal(structure.levels.filter(row=>
  firstReleaseLanguages.includes(row.targetLanguage)&&['C1','C2'].includes(row.level))
  .reduce((n,row)=>n+row.drafts,0),48);
 assert.equal(structure.levels.some(row=>row.documentedReviews>0),false);
});
