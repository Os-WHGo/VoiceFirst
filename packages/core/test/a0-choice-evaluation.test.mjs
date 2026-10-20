import test from 'node:test';
import assert from 'node:assert/strict';
import {importA0FunctionalCandidates,evaluateA0Choice,summarizeA0Attempts} from '../dist/index.js';
const target='fr-CA';
const langs=['en-CA','es','pt-BR','de','it'];
const strings=Object.fromEntries(langs.map(x=>[x,'Choose the appropriate expression']));
const pack={schema_version:'voicefirst.lesson-candidate.v0.2',lessons:[{lesson_id:'a0.fr.1',concept_id:'a0.morning',target_language:target,sequence:1,prerequisites:[],editorial_status:'candidate',publishable:false,human_review_required:true,activity:{type:'single_choice',skill:'reading',audio_required:false,text_fallback:true,context_by_known_language:strings,prompt_by_known_language:strings,options:[{id:'a',text:'Bonjour'},{id:'b',text:'Bonsoir'}],correct_option_ids:['a'],assessment:{scoring:'exact_match'}}}]};
test('A0 scoring works offline, rejects invalid choices, and first-try mastery is explicit',()=>{
 const imported=importA0FunctionalCandidates(pack);assert.deepEqual(imported.issues,[]);
 const lesson=imported.lessons[0];
 assert.equal(evaluateA0Choice(lesson,{lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:1}).mastered,true);
 assert.equal(evaluateA0Choice(lesson,{lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:2}).mastered,false);
 assert.equal(evaluateA0Choice(lesson,{lessonId:lesson.lessonId,selectedOptionId:'b',attemptNumber:1}).points,0);
 assert.equal(evaluateA0Choice(lesson,{lessonId:lesson.lessonId,selectedOptionId:'z',attemptNumber:1}),null);
 const p=summarizeA0Attempts([lesson],[{lessonId:lesson.lessonId,selectedOptionId:'b',attemptNumber:1},{lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:2}]);
 assert.equal(p.attemptCount,2);assert.equal(p.correctCount,1);assert.deepEqual(p.completedLessonIds,[lesson.lessonId]);assert.deepEqual(p.masteredLessonIds,[]);
});
