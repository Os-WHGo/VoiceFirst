import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importA0FunctionalCandidates,loadA0CandidateCatalog,evaluateA0Choice,summarizeA0Attempts,newA0Journal,appendA0JournalEvent,loadA0Journal,a0JournalProgress} from '../dist/index.js';
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

test('French and Italian farewell synonyms are accepted without incorrect A0 evidence',()=>{
 const asset=JSON.parse(readFileSync(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url),'utf8'));
 const catalog=loadA0CandidateCatalog(asset);
 assert.equal(catalog.kind,'candidate');
 for(const language of ['fr-CA','it']){
  const lesson=catalog.lessons.find(l=>l.lessonId===`vf.a0.functional.02.${language}`);
  const ambiguous=lesson.options.find(o=>o.id==='1');
  assert.equal(ambiguous.text,language==='it'?'Ciao':'Salut');
  const neutral={lessonId:lesson.lessonId,selectedOptionId:'1',attemptNumber:1,eventId:'regional'};
  const outcome=evaluateA0Choice(lesson,neutral);
  assert.equal(outcome.feedbackCode,'also_valid');
  assert.equal(outcome.correct,false);
  assert.equal(outcome.points,0);
  const clean=newA0Journal(language);
  assert.equal(appendA0JournalEvent(clean,lesson,neutral),clean,'new synonym attempt is not persisted');
  const completed=appendA0JournalEvent(clean,lesson,{eventId:'accepted',lessonId:lesson.lessonId,selectedOptionId:'2',attemptNumber:1});
  assert.equal(completed.revision,1);
  assert.deepEqual(a0JournalProgress(completed,[lesson]).masteredLessonIds,[lesson.lessonId]);
  const historical={...clean,revision:2,events:[neutral,{eventId:'correct-later',lessonId:lesson.lessonId,selectedOptionId:'2',attemptNumber:2}]};
  const reopened=loadA0Journal(JSON.stringify(historical),language,[lesson]);
  assert.equal(reopened.kind,'ok','previously recorded ambiguous answers must remain recoverable');
  const progress=a0JournalProgress(reopened.journal,[lesson]);
  assert.equal(progress.attemptCount,1,'the regional synonym does not use an assessed attempt');
  assert.equal(progress.correctCount,1);
  assert.deepEqual(progress.masteredLessonIds,[lesson.lessonId],'first scorable attempt retains first-try recognition');
  assert.equal(evaluateA0Choice(lesson,{lessonId:lesson.lessonId,selectedOptionId:'3',attemptNumber:1}).feedbackCode,'review_context');
 }
});

test('A0 mobile preview shows regional feedback before any persistence request',()=>{
 const code=readFileSync(new URL('../../../mobile/A0CandidatePreview.tsx',import.meta.url),'utf8');
 const evaluate=code.indexOf('const outcome=evaluateA0Choice(');
 const neutral=code.indexOf("outcome?.feedbackCode==='also_valid'",evaluate);
 const localized=code.indexOf('setFeedback(alsoValidNote[nativeLanguage])',neutral);
 const submitted=code.indexOf('await session.submit(',neutral);
 assert.ok(evaluate>=0&&neutral>evaluate&&localized>neutral&&submitted>localized);
 assert.match(code.slice(neutral,submitted),/return;/,'regional synonym must return before writing');
});
