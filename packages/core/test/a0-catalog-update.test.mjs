import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewA0CatalogUpdate,newA0Journal,appendA0JournalEvent} from '../dist/index.js';
const help=Object.fromEntries(['fr-CA','es','pt-BR','de','it'].map(x=>[x,'Select the correct answer']));
const make=(id='a0.one')=>({lesson_id:id,concept_id:id,target_language:'en-CA',sequence:1,prerequisites:[],editorial_status:'candidate',publishable:false,human_review_required:true,activity:{type:'single_choice',skill:'reading',audio_required:false,text_fallback:true,context_by_known_language:help,prompt_by_known_language:help,options:[{id:'yes',text:'Hello'},{id:'no',text:'Bye'}],correct_option_ids:['yes'],assessment:{scoring:'exact_match'}}});
const pack=lessons=>({schema_version:'voicefirst.lesson-candidate.v0.2',lessons});
test('A0 catalog update accepts valid candidate without saved progress',()=>{
 const result=reviewA0CatalogUpdate(pack([make()]),[]);
 assert.equal(result.kind,'compatible_candidate');assert.equal(result.publishable,false);
});
test('A0 catalog update blocks when old saved lesson is removed',()=>{
 const old={lessonId:'a0.one',targetLanguage:'en-CA',options:[{id:'yes',text:'Hello'},{id:'no',text:'Bye'}],correctOptionId:'yes'};
 const saved=appendA0JournalEvent(newA0Journal('en-CA'),old,{eventId:'saved',lessonId:'a0.one',selectedOptionId:'yes',attemptNumber:1});
 const result=reviewA0CatalogUpdate(pack([make('a0.other')]),[saved]);
 assert.equal(result.kind,'blocked');assert.equal(result.reason,'INCOMPATIBLE_PROGRESS');
 assert.equal(result.progressIssues[0].code,'REMOVED_LESSON');
});
test('A0 catalog update blocks invalid curriculum',()=>{
 const result=reviewA0CatalogUpdate(pack([]),[]);
 assert.equal(result.kind,'blocked');assert.equal(result.reason,'INVALID_CATALOG');
});

test('A0 update with saved answers requires previous catalog to preserve meaning',()=>{
 const before=load();
 const saved=appendA0JournalEvent(newA0Journal('en-CA'),before,{eventId:'answered',lessonId:before.lessonId,selectedOptionId:'yes',attemptNumber:1});
 const unchanged=pack([make()]);
 assert.equal(reviewA0CatalogUpdate(unchanged,[saved]).reason,'MISSING_BASELINE');
 assert.equal(reviewA0CatalogUpdate(unchanged,[saved],[before]).kind,'compatible_candidate');
 const reordered=make();reordered.activity.options.reverse();
 assert.equal(reviewA0CatalogUpdate(pack([reordered]),[saved],[before]).kind,'compatible_candidate','reordering without changing meanings is harmless');
});
test('A0 update rejects changed keys, labels, removed options, and missing old baseline',()=>{
 const prior=load();
 const saved=appendA0JournalEvent(newA0Journal('en-CA'),prior,{eventId:'answered',lessonId:prior.lessonId,selectedOptionId:'yes',attemptNumber:1});
 const cases=[
  [item=>{item.activity.correct_option_ids=['no'];},'CHANGED_CORRECT_OPTION'],
  [item=>{item.activity.options[0].text='Bye';},'CHANGED_ANSWER_OPTIONS'],
  [item=>{item.activity.options[1].text='Hello';},'CHANGED_ANSWER_OPTIONS'],
  [item=>{item.activity.options[1].id='later';},'CHANGED_ANSWER_OPTIONS'],
  [item=>{item.concept_id='a0.other';},'CHANGED_LESSON_CONCEPT']
 ];
 for(const [change,code] of cases){
  const next=make();change(next);
  const result=reviewA0CatalogUpdate(pack([next]),[saved],[prior]);
  assert.equal(result.kind,'blocked',code);
  assert.equal(result.reason,'INCOMPATIBLE_PROGRESS');
  assert.ok(result.progressIssues.some(issue=>issue.code===code),code);
 }
 const missing=reviewA0CatalogUpdate(pack([make()]),[saved],[]);
 assert.equal(missing.reason,'INVALID_SAVED_HISTORY','the old journal cannot be authenticated against a missing original catalog');
});
function load(){
 const result=reviewA0CatalogUpdate(pack([make()]),[]);
 assert.equal(result.kind,'compatible_candidate');
 return result.lessons[0];
}

test('A0 update blocks corrupt saved revisions and altered history rather than reinterpreting them',()=>{
 const old=load();
 const saved=appendA0JournalEvent(newA0Journal('en-CA'),old,{eventId:'done',lessonId:old.lessonId,selectedOptionId:'yes',attemptNumber:1});
 const request=pack([make()]);
 const verify=journal=>reviewA0CatalogUpdate(request,[journal],[old]);
 assert.equal(verify(saved).kind,'compatible_candidate');
 assert.equal(verify({...saved,revision:99}).reason,'INVALID_SAVED_HISTORY');
 assert.equal(verify({...saved,events:[...saved.events,saved.events[0]]}).reason,'INVALID_SAVED_HISTORY');
 assert.equal(verify({...saved,events:[{...saved.events[0],selectedOptionId:'unknown'}]}).reason,'INVALID_SAVED_HISTORY');
 const afterCompleted={...saved,revision:2,events:[...saved.events,{eventId:'late',lessonId:old.lessonId,selectedOptionId:'no',attemptNumber:2}]};
 assert.equal(verify(afterCompleted).reason,'INVALID_SAVED_HISTORY');
});
