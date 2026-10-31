import test from 'node:test';
import assert from 'node:assert/strict';
import {commitA0Attempt,newA0Journal,restoreA0Session} from '../dist/index.js';

const lesson={lessonId:'a0.fr.cas',conceptId:'a0.greeting',targetLanguage:'fr-CA',sequence:1,prerequisites:[],skill:'reading',contextByKnownLanguage:{},promptByKnownLanguage:{},options:[{id:'a',text:'Bonjour'},{id:'b',text:'Bonsoir'}],correctOptionId:'a',publishable:false,humanReviewRequired:true};
const event=(id)=>({eventId:id,lessonId:lesson.lessonId,selectedOptionId:'a',attemptNumber:1});
const makePort=()=>{
 const data=new Map();
 return {data,port:{
  read:async key=>data.get(key)??null,
  write:async()=>{throw new Error('unsafe non-transactional write')},
  compareAndWrite:async(key,expected,next)=>{
   const current=data.get(key)??null;
   if(current!==expected)return false;
   data.set(key,next);return true;
  }
 }};
};
test('A0 compare-and-write permits exactly one competing writer',async()=>{
 const {port}=makePort();
 const first=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(first.kind,'ok');
 const results=await Promise.allSettled([
  commitA0Attempt(port,first.journal,lesson,event('one'),first.raw),
  commitA0Attempt(port,first.journal,lesson,event('two'),first.raw)
 ]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.message==='A0_STORAGE_CONFLICT').length,1);
 const restored=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(restored.kind,'ok');assert.equal(restored.journal.events.length,1);
});
test('A0 rejects stale snapshot without writing',async()=>{
 const {port}=makePort();
 const initial=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(initial.kind,'ok');
 const saved=await commitA0Attempt(port,initial.journal,lesson,event('first'),initial.raw);
 await assert.rejects(commitA0Attempt(port,saved,lesson,event('second'),initial.raw),/A0_SNAPSHOT_MISMATCH/);
 const restored=await restoreA0Session(port,'fr-CA',[lesson]);
 assert.equal(restored.kind,'ok');assert.equal(restored.journal.events.length,1);
});
test('A0 requires expected snapshot when CAS is available',async()=>{
 const {port}=makePort();
 await assert.rejects(commitA0Attempt(port,newA0Journal('fr-CA'),lesson,event('first')),/A0_SNAPSHOT_REQUIRED/);
});
