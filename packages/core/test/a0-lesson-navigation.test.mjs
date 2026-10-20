import test from 'node:test';
import assert from 'node:assert/strict';
import {a0LessonRoutes,nextA0LessonId,newA0Journal,appendA0JournalEvent} from '../dist/index.js';
const mk=(id,sequence,prerequisites=[],targetLanguage='en-CA')=>({
 lessonId:id,conceptId:id,targetLanguage,sequence,prerequisites,skill:'reading',
 contextByKnownLanguage:{},promptByKnownLanguage:{},
 options:[{id:'yes',text:'Yes'},{id:'no',text:'No'}],correctOptionId:'yes',
 publishable:false,humanReviewRequired:true
});
test('A0 route unlocks next lesson only after correct completion',()=>{
 const lessons=[mk('second',2,['first']),mk('first',1),mk('third',3,['second'])];
 const empty=newA0Journal('en-CA');
 assert.equal(nextA0LessonId(lessons,empty),'first');
 assert.equal(a0LessonRoutes(lessons,empty)[1].available,false);
 const wrong=appendA0JournalEvent(empty,lessons[1],{eventId:'e1',lessonId:'first',selectedOptionId:'no',attemptNumber:1});
 assert.equal(nextA0LessonId(lessons,wrong),'first');
 const correct=appendA0JournalEvent(wrong,lessons[1],{eventId:'e2',lessonId:'first',selectedOptionId:'yes',attemptNumber:2});
 assert.equal(nextA0LessonId(lessons,correct),'second');
 assert.equal(a0LessonRoutes(lessons,correct)[2].available,false);
});
test('A0 route excludes other languages and blocks missing prerequisites',()=>{
 const lessons=[mk('start',1),mk('orphan',2,['not-in-pack']),mk('french',1,[],'fr-CA')];
 const routes=a0LessonRoutes(lessons,newA0Journal('en-CA'));
 assert.deepEqual(routes.map(x=>x.lessonId),['start','orphan']);
 assert.deepEqual(routes[1].missingPrerequisites,['not-in-pack']);
});
