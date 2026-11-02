import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewA0StoredCatalog,restoreA0CatalogSession,newA0Journal,appendA0JournalEvent,loadA0CandidateCatalog} from '../dist/index.js';
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

test('A0 stored catalog reopens unchanged saved progress with the original authored baseline',async()=>{
 const source=pack('same');
 const original=loadA0CandidateCatalog(source).lessons;
 const journal=appendA0JournalEvent(newA0Journal('en-CA'),original[0],{eventId:'saved-correct',lessonId:'same',selectedOptionId:'yes',attemptNumber:1});
 const raw=JSON.stringify(journal),writes=[];
 const port={read:async()=>raw,write:async(...args)=>{writes.push(args);}};
 const result=await reviewA0StoredCatalog(port,source,'en-CA',original);
 assert.equal(result.kind,'ready_candidate');
 assert.equal(result.lessons[0].lessonId,'same');
 assert.equal(result.publishable,false);
 assert.deepEqual(writes,[],'catalog validation must never rewrite learner history');
});
test('A0 stored catalog blocks changed answer meaning despite identical IDs and unchanged journal',async()=>{
 const previous=loadA0CandidateCatalog(pack('same')).lessons;
 const journal=appendA0JournalEvent(newA0Journal('en-CA'),previous[0],{eventId:'saved',lessonId:'same',selectedOptionId:'yes',attemptNumber:1});
 const raw=JSON.stringify(journal),writes=[];
 const updated=pack('same');
 updated.lessons[0].activity.correct_option_ids=['no'];
 const port={read:async()=>raw,write:async(...args)=>{writes.push(args);}};
 const result=await reviewA0StoredCatalog(port,updated,'en-CA',previous);
 assert.equal(result.kind,'blocked');
 assert.equal(result.reason,'INCOMPATIBLE_PROGRESS');
 assert.deepEqual(writes,[],'incompatible progress must be retained byte-for-byte');
});

test('protected A0 mount reads a single snapshot and returns it for exact CAS',async()=>{
 const source=pack('same');
 const previousLessons=loadA0CandidateCatalog(source).lessons;
 const journal=appendA0JournalEvent(newA0Journal('en-CA'),previousLessons[0],{
  eventId:'record-1',lessonId:'same',selectedOptionId:'yes',attemptNumber:1
 });
 const raw=JSON.stringify(journal);
 let reads=0;
 const port={read:async()=>{reads++;return raw;},write:async()=>assert.fail('no writes during restore')};
 const restored=await restoreA0CatalogSession(port,source,'en-CA',previousLessons);
 assert.equal(restored.kind,'ok');
 assert.equal(reads,1,'must not read once for preflight and again for restore');
 assert.equal(restored.raw,raw,'return exactly the verified snapshot');
 assert.deepEqual(restored.journal,journal);
 assert.equal(restored.publishable,false);
});
test('protected A0 mount blocks altered scenarios before showing or writing historical results',async()=>{
 const source=pack('same'),previous=loadA0CandidateCatalog(source).lessons;
 const journal=appendA0JournalEvent(newA0Journal('en-CA'),previous[0],{
  eventId:'record-1',lessonId:'same',selectedOptionId:'no',attemptNumber:1
 });
 const candidate=pack('same');
 candidate.lessons[0].activity.prompt_by_known_language.es='Choose a different situation';
 let reads=0;
 const port={read:async()=>{reads++;return JSON.stringify(journal);},write:async()=>assert.fail('must preserve history')};
 const result=await restoreA0CatalogSession(port,candidate,'en-CA',previous);
 assert.equal(reads,1);
 assert.deepEqual(result,{kind:'blocked',reason:'INCOMPATIBLE_PROGRESS',publishable:false});
});
test('protected A0 mount accepts first install but blocks untrusted saved bytes',async()=>{
 const catalog=pack('new'),previous=loadA0CandidateCatalog(catalog).lessons;
 const blank=await restoreA0CatalogSession({read:async()=>null,write:async()=>{}},catalog,'en-CA',previous);
 assert.equal(blank.kind,'ok');assert.equal(blank.raw,null);assert.equal(blank.journal.revision,0);
 const invalid=await restoreA0CatalogSession({read:async()=>'{oops',write:async()=>{}},catalog,'en-CA',previous);
 assert.equal(invalid.reason,'UNREADABLE_PROGRESS');
 const missing=await restoreA0CatalogSession({read:async()=>{throw Error('disk error');},write:async()=>{}},catalog,'en-CA',previous);
 assert.equal(missing.reason,'STORAGE_UNAVAILABLE');
});
