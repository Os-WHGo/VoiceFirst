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
