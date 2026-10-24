import test from 'node:test';
import assert from 'node:assert/strict';
import {newA0Journal,restoreA0Session,commitA0Attempt} from '../dist/index.js';
const lesson={lessonId:'a0.fr.1',conceptId:'a0.greeting',targetLanguage:'fr-CA',sequence:1,prerequisites:[],skill:'reading',contextByKnownLanguage:{},promptByKnownLanguage:{},options:[{id:'a',text:'Bonjour'},{id:'b',text:'Bonsoir'}],correctOptionId:'a',publishable:false,humanReviewRequired:true};
test('A0 persistence saves, resumes and prevents replayed writes',async()=>{
 const store=new Map();let writes=0;
 const port={read:async k=>store.get(k)??null,write:async(k,v)=>{writes++;store.set(k,v)}};
 const initial=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(initial.kind,'ok');
 const event={eventId:'attempt-1',lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:1};
 const saved=await commitA0Attempt(port,initial.journal,lesson,event);
 assert.equal(writes,1);
 const restored=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(restored.kind,'ok');assert.deepEqual(restored.journal,saved);
 assert.equal(await commitA0Attempt(port,saved,lesson,event),saved);assert.equal(writes,1);
});
test('A0 storage failures do not report committed progress and corrupt state is preserved',async()=>{
 const fail={read:async()=>null,write:async()=>{throw Error('disk full')}};
 await assert.rejects(commitA0Attempt(fail,newA0Journal('fr-CA'),lesson,{eventId:'e2',lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:1}));
 const invalid={read:async()=>'{bad json',write:async()=>{throw Error('must not overwrite')}};
 assert.equal((await restoreA0Session(invalid,'fr-CA',[lesson])).kind,'invalid');
});
