import test from 'node:test';
import assert from 'node:assert/strict';
import {newA0Journal,appendA0JournalEvent,loadA0Journal,a0JournalProgress} from '../dist/index.js';
const lesson={lessonId:'a0.fr.1',conceptId:'a0.greeting',targetLanguage:'fr-CA',sequence:1,prerequisites:[],skill:'reading',contextByKnownLanguage:{},promptByKnownLanguage:{},options:[{id:'a',text:'Bonjour'},{id:'b',text:'Bonsoir'}],correctOptionId:'a',publishable:false,humanReviewRequired:true};
test('A0 journal survives JSON round trip and deduplicates replayed events',()=>{
 const j=newA0Journal('fr-CA'),e={eventId:'evt-1',lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:1};
 const saved=appendA0JournalEvent(j,lesson,e);
 assert.equal(saved.revision,1);
 assert.equal(appendA0JournalEvent(saved,lesson,e),saved);
 const loaded=loadA0Journal(JSON.stringify(saved),'fr-CA',[lesson]);
 assert.equal(loaded.kind,'ok');
 assert.deepEqual(a0JournalProgress(loaded.journal,[lesson]).masteredLessonIds,[lesson.lessonId]);
});
test('A0 journal rejects missing or tampered events',()=>{
 const j=newA0Journal('fr-CA');
 assert.equal(appendA0JournalEvent(j,lesson,{eventId:'evt-2',lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:2}),j);
 assert.equal(loadA0Journal(JSON.stringify({...j,revision:1}),'fr-CA',[lesson]).kind,'invalid');
 assert.equal(loadA0Journal(JSON.stringify(j),'en-CA',[lesson]).kind,'invalid');
});
