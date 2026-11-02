import test from 'node:test';
import assert from 'node:assert/strict';
import {
 targetLanguages,a1DraftTopics,a1EditorialDrafts,a1HelpPairs,a1LocalizedPreview,
 a1AudioBaseline,a1AudioExpectedIds,a1ListeningCards,
 courseSkills,lessonsFor,portableLexiconDraftsFromA1Authoring,
 buildPortableLexiconBundle
} from '../dist/index.js';

test('eight A1 topics are distinct authored briefs in every launch language',()=>{
 assert.equal(a1DraftTopics.length,8);
 assert.equal(a1EditorialDrafts.length,48);
 assert.equal(new Set(a1DraftTopics).size,8);
 const ids=new Set(),lexicalKeys=new Set(),dialogueKeys=new Set();
 for(const language of targetLanguages){
  const rows=a1EditorialDrafts.filter(unit=>unit.targetLanguage===language);
  assert.deepEqual(rows.map(unit=>unit.unitId),a1DraftTopics);
  for(const row of rows){
   const key=language+'/'+row.unitId;
   assert.ok(!ids.has(key),key);ids.add(key);
   assert.equal(row.level,'A1');assert.equal(row.status,'draft');
   assert.equal(row.editorialStatus,'not-human-reviewed');
   assert.equal(row.audioStatus,'not-recorded');
   assert.equal(row.rightsStatus,'pending-editorial-clearance');
   assert.equal(row.dialogue.length,2);
   assert.ok(row.dialogue.every(line=>line.trim().length>=12));
   assert.notEqual(row.dialogue[0],row.dialogue[1]);
   const dialogueKey=language+':'+row.dialogue.join('|');
   assert.ok(!dialogueKeys.has(dialogueKey),dialogueKey);
   dialogueKeys.add(dialogueKey);
   assert.deepEqual(row.activities.map(activity=>activity.skill),courseSkills);
   assert.equal(row.lexemes.length,4);
   for(const lexeme of row.lexemes){
    const lexemeKey=key+'/'+lexeme.conceptId;
    assert.ok(!lexicalKeys.has(lexemeKey),lexemeKey);
    assert.ok(lexeme.form.trim().length>2);
    lexicalKeys.add(lexemeKey);
   }
  }
  // Editorial expansion is not a claim that the existing foreground course changed.
  assert.equal(lessonsFor(language).length,14);
 }
 assert.equal(lexicalKeys.size,192);
});

test('all 240 ordered help-target-topic editorial previews remain non-public',()=>{
 assert.equal(a1HelpPairs.length,30);
 let previews=0;
 for(const {known,target} of a1HelpPairs){
  assert.notEqual(known,target);
  for(const topic of a1DraftTopics){
   const result=a1LocalizedPreview(known,target,topic);
   assert.ok(result,known+'/'+target+'/'+topic);
   assert.equal(result.activities.length,6);
   assert.ok(result.activities.every(a=>a.instruction.length>10&&a.draftPrompt.length>20));
   assert.equal(result.status,'editorial-only');
   assert.equal(result.audioStatus,'not-recorded');
   assert.equal(result.rightsStatus,'pending-editorial-clearance');
   assert.equal(result.editorialStatus,'not-human-reviewed');
   previews++;
  }
 }
 assert.equal(previews,240);
});

test('new editorial coverage never unlocks audio or a reusable third-party lexicon',()=>{
 assert.equal(a1AudioExpectedIds.length,96);
 assert.equal(new Set(a1AudioExpectedIds).size,96);
 assert.equal(a1AudioBaseline.missing.length,96);
 assert.equal(a1AudioBaseline.verified,0);
 assert.equal(a1AudioBaseline.readyForPublicRelease,false);
 const cards=a1ListeningCards({expected:96,verified:0,missing:a1AudioExpectedIds,
   rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.equal(cards.length,48);
 assert.ok(cards.every(card=>!card.canPlayInPublicApp&&!card.canAssessListening));
 const drafts=portableLexiconDraftsFromA1Authoring();
 assert.equal(drafts.length,192);
 for(const language of targetLanguages){
  for(const use of ['lesson','speech-hint','subtitle-hint']){
   const output=buildPortableLexiconBundle(drafts,use,language);
   assert.equal(output.status,'ok');
   assert.equal(output.bundle.entries.length,0);
   assert.equal(output.notExported,192);
  }
 }
});
