import test from 'node:test';
import assert from 'node:assert/strict';
import {importA0FunctionalCandidates} from '../dist/index.js';
const langs=['en-CA','fr-CA','es','pt-BR','de','it'];
const strings=Object.fromEntries(langs.map(x=>[x,'Choose the right greeting']));
const base={schema_version:'voicefirst.lesson-candidate.v0.2',lessons:[{
 lesson_id:'vf.a0.functional.01.en-CA',concept_id:'concept.a0.functional.morning',target_language:'en-CA',sequence:1,prerequisites:[],
 editorial_status:'candidate',publishable:false,human_review_required:true,
 activity:{type:'single_choice',skill:'reading',audio_required:false,text_fallback:true,context_by_known_language:strings,prompt_by_known_language:strings,
 options:[{id:'1',text:'Good morning'},{id:'2',text:'Good night'}],correct_option_ids:['1'],assessment:{scoring:'exact_match'}}
}]};
test('A0 candidate importer accepts explicit correct answer and remains nonpublishable',()=>{
 const r=importA0FunctionalCandidates(base);
 assert.deepEqual(r.issues,[]);assert.equal(r.lessons.length,1);assert.equal(r.readyForPublicRelease,false);
 assert.equal(r.lessons[0].correctOptionId,'1');assert.equal(r.lessons[0].publishable,false);
 assert.equal(Object.keys(r.lessons[0].contextByKnownLanguage).length,5);
});
test('A0 importer rejects missing translations, invalid answers and publishable claims',()=>{
 const copy=()=>structuredClone(base);
 let v=copy();delete v.lessons[0].activity.prompt_by_known_language.es;
 assert.equal(importA0FunctionalCandidates(v).issues[0].code,'MISSING_LOCALIZATION');
 v=copy();v.lessons[0].activity.correct_option_ids=['999'];
 assert.equal(importA0FunctionalCandidates(v).issues[0].code,'INVALID_ANSWER');
 v=copy();v.lessons[0].publishable=true;
 assert.equal(importA0FunctionalCandidates(v).issues[0].code,'INVALID_LESSON');
});
