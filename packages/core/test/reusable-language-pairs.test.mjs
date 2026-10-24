import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,a1LocalizedPreview,a1HelpTopics,a1HelpSkills,a1EditorialDrafts} from '../dist/index.js';

test('all six languages can act as known and target language without pair-specific curricula',()=>{
 const pairs=learningPairs();
 assert.equal(pairs.length,30);
 assert.equal(new Set(pairs.map(([known,target])=>known+'>'+target)).size,30);
 for(const [known,target] of pairs){
  assert.notEqual(known,target);
  for(const topic of a1HelpTopics){
   const preview=a1LocalizedPreview(known,target,topic);
   const source=a1EditorialDrafts.find(u=>u.targetLanguage===target&&u.unitId===topic);
   assert.ok(preview,known+'>'+target+'/'+topic);
   assert.ok(source);
   assert.equal(preview.knownLanguage,known);
   assert.equal(preview.targetLanguage,target);
   assert.deepEqual(preview.dialogue,source.dialogue);
   assert.equal(preview.grammarFocus,source.grammarFocus);
   assert.deepEqual(preview.activities.map(a=>a.skill),a1HelpSkills);
   assert.ok(preview.activities.every(a=>a.instruction.trim().length>0));
   assert.equal(preview.status,'editorial-only');
   assert.equal(preview.editorialStatus,'not-human-reviewed');
   assert.equal(preview.audioStatus,'not-recorded');
  }
 }
});
test('switching known language never changes target content or publishes it',()=>{
 for(const target of targetLanguages){
  const known=targetLanguages.filter(lang=>lang!==target);
  for(const topic of a1HelpTopics){
   const previews=known.map(lang=>a1LocalizedPreview(lang,target,topic));
   assert.ok(previews.every(Boolean));
   assert.ok(previews.every(p=>p.dialogue.join('|')===previews[0].dialogue.join('|')));
   assert.ok(previews.every(p=>p.grammarFocus===previews[0].grammarFocus));
   assert.ok(previews.every(p=>p.rightsStatus==='pending-editorial-clearance'));
   assert.equal(a1LocalizedPreview(target,target,topic),null);
  }
 }
});
