import test from 'node:test';
import assert from 'node:assert/strict';
import {loadA0CandidateCatalog} from '../dist/index.js';
const langs=['fr-CA','es','pt-BR','de','it'];
const local=Object.fromEntries(langs.map(x=>[x,'Choose the correct expression']));
const lesson=(id,sequence,prerequisites=[])=>({
 lesson_id:id,concept_id:id,target_language:'en-CA',sequence,prerequisites,
 editorial_status:'candidate',publishable:false,human_review_required:true,
 activity:{type:'single_choice',skill:'reading',audio_required:false,text_fallback:true,
 context_by_known_language:local,prompt_by_known_language:local,
 options:[{id:'yes',text:'Hello'},{id:'no',text:'Goodbye'}],correct_option_ids:['yes'],assessment:{scoring:'exact_match'}}
});
const pack=lessons=>({schema_version:'voicefirst.lesson-candidate.v0.2',lessons});
test('candidate catalog loads valid dependencies but remains unpublished',()=>{
 const result=loadA0CandidateCatalog(pack([lesson('one',1),lesson('two',2,['one'])]));
 assert.equal(result.kind,'candidate');
 assert.equal(result.publishable,false);
 assert.equal(result.lessons.length,2);
});
test('catalog blocks all lessons when one lesson is malformed',()=>{
 const invalid=lesson('bad',2,['one']);invalid.activity.options=[];
 const result=loadA0CandidateCatalog(pack([lesson('one',1),invalid]));
 assert.equal(result.kind,'blocked');assert.equal(result.lessons.length,0);
 assert.ok(result.issues.some(x=>x.code==='INVALID_ACTIVITY'));
});
test('catalog blocks cyclic graph and empty input',()=>{
 assert.equal(loadA0CandidateCatalog(pack([lesson('a',1,['b']),lesson('b',2,['a'])])).kind,'blocked');
 assert.ok(loadA0CandidateCatalog(pack([])).issues.some(x=>x.code==='EMPTY_CATALOG'));
});

test('candidate catalog resolves authored concept prerequisites within the target language',()=>{
 const first=lesson('first',1);
 first.concept_id='concept.a0.first';
 const second=lesson('second',2,['concept.a0.first']);
 const result=loadA0CandidateCatalog(pack([first,second]));
 assert.equal(result.kind,'candidate');
 assert.deepEqual(result.lessons[1].prerequisites,['first']);
});
test('candidate catalog blocks ambiguous concept references rather than guessing',()=>{
 const first=lesson('first',1);first.concept_id='concept.shared';
 const duplicate=lesson('other',2);duplicate.concept_id='concept.shared';
 const next=lesson('next',3,['concept.shared']);
 const result=loadA0CandidateCatalog(pack([first,duplicate,next]));
 assert.equal(result.kind,'blocked');
 assert.ok(result.issues.some(x=>x.code==='MISSING_PREREQUISITE'));
});
