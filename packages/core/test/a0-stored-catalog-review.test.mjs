import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewA0StoredCatalog,newA0Journal,appendA0JournalEvent} from '../dist/index.js';
const help=Object.fromEntries(['fr-CA','es','pt-BR','de','it'].map(x=>[x,'Select the correct answer']));
const rawLesson=(id)=>({lesson_id:id,concept_id:id,target_language:'en-CA',sequence:1,prerequisites:[],editorial_status:'candidate',publishable:false,human_review_required:true,activity:{type:'single_choice',skill:'reading',audio_required:false,text_fallback:true,context_by_known_language:help,prompt_by_known_language:help,options:[{id:'yes',text:'Hello'},{id:'no',text:'Bye'}],correct_option_ids:['yes'],assessment:{scoring:'exact_match'}}});
const old={lessonId:'old',targetLanguage:'en-CA',options:[{id:'yes',text:'Hello'},{id:'no',text:'Bye'}],correctOptionId:'yes'};
const pack=id=>({schema_version:'voicefirst.lesson-candidate.v0.2',lessons:[rawLesson(id)]});
test('A0 stored catalog accepts valid first installation',async()=>{
 const port={read:async()=>null,write:async()=>{}};
 const result=await reviewA0StoredCatalog(port,pack('new'),'en-CA',[]);
 assert.equal(result.kind,'ready_candidate');assert.equal(result.publishable,false);
});
test('A0 stored catalog blocks missing historical lesson without erasing storage',async()=>{
 const saved=appendA0JournalEvent(newA0Journal('en-CA'),old,{eventId:'e1',lessonId:'old',selectedOptionId:'yes',attemptNumber:1});
 let writes=0;
 const port={read:async()=>JSON.stringify(saved),write:async()=>{writes++;}};
 const result=await reviewA0StoredCatalog(port,pack('new'),'en-CA',[old]);
 assert.equal(result.kind,'blocked');assert.equal(result.reason,'INCOMPATIBLE_PROGRESS');assert.equal(writes,0);
});
test('A0 stored catalog blocks corrupted data and read errors',async()=>{
 const broken={read:async()=>'{bad',write:async()=>{}};
 assert.equal((await reviewA0StoredCatalog(broken,pack('new'),'en-CA',[old])).reason,'UNREADABLE_PROGRESS');
 const unavailable={read:async()=>{throw Error('offline disk');},write:async()=>{}};
 assert.equal((await reviewA0StoredCatalog(unavailable,pack('new'),'en-CA',[old])).reason,'STORAGE_UNAVAILABLE');
});
