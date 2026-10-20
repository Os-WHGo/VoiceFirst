import test from 'node:test';
import assert from 'node:assert/strict';
import {auditA0JournalCompatibility,newA0Journal,appendA0JournalEvent} from '../dist/index.js';
const lesson={lessonId:'first',targetLanguage:'en-CA',correctOptionId:'yes',options:[{id:'yes',text:'Hello'},{id:'no',text:'Bye'}]};
test('A0 progress survives compatible catalog and flags removed or changed options',()=>{
 const original=newA0Journal('en-CA');
 const saved=appendA0JournalEvent(original,lesson,{eventId:'a1',lessonId:'first',selectedOptionId:'yes',attemptNumber:1});
 assert.deepEqual(auditA0JournalCompatibility(saved,[lesson]),[]);
 assert.equal(auditA0JournalCompatibility(saved,[])[0].code,'REMOVED_LESSON');
 assert.equal(auditA0JournalCompatibility(saved,[{...lesson,options:[{id:'new',text:'Hello'}]}])[0].code,'CHANGED_ANSWER_OPTIONS');
});
