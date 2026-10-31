import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionNarrator,sessionNarration,narrationVoiceCue,learningPairs,newLearnerModel,courseActivities,planLearningSession,defaultSessionPreferences,sessionOpening,voiceCueById} from '../dist/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const line=(text,language='en-CA')=>({text,language,purpose:'target-cue'});
function harness(){
 const calls=[],deadlines=[];let stops=0;
 const port={play(cue,rate,done,error){calls.push({cue,rate,done,error});},stop(){stops++;}};
 const narrator=new SessionNarrator(port,(callback,ms)=>{const job={callback,ms,cleared:false};deadlines.push(job);return ()=>{job.cleared=true;};});
 return {narrator,calls,deadlines,stops:()=>stops};
}
test('opening narration uses the known language for goal and instruction, target for its authored model in all 30 pairs',()=>{
 for(const [known,target] of learningPairs()){
  const activities=courseActivities(target),state=planLearningSession({sessionId:'narration-test',known,target,today:'2026-10-31',activities,model:newLearnerModel(target),completedLessons:[],preferences:defaultSessionPreferences});
  const outputs=sessionOpening(state,activities),lines=sessionNarration(outputs,known,target);
  assert.equal(lines[0].text,outputs[0].text);assert.equal(lines[0].language,known);
  assert.equal(lines[1].text,outputs[1].instruction);assert.equal(lines[1].language,known);
  assert.equal(lines[2].text,outputs[1].speech.text);assert.equal(lines[2].language,target);
  assert.equal(lines[2].activityId,state.current.activityId);
  const cue=narrationVoiceCue(lines[2]);assert.equal(voiceCueById(cue.id)?.text,lines[2].text,'existing voice-pack ID reused');
 }
});
test('feedback, model, confirmation, corrections, slower replay and summary are spoken from actual outputs only',()=>{
 const outputs=[{kind:'feedback',outcome:'needs-review',text:'Revisa la frase.'},{kind:'model',text:'Modelo.',speech:{text:'Hello!',language:'en-CA'}},
  {kind:'confirm-request',text:'Confirma en pantalla.',closestAnswer:'Hello!'},
  {kind:'corrections',items:['Una corrección.']},
  {kind:'replay',rate:'slower',instruction:'Escucha.',speech:{text:'Hello!',language:'en-CA'}},
  {kind:'summary',summary:{statements:['Una actividad practicada.','No es una calificación oficial.']}}];
 const lines=sessionNarration(outputs,'es','en-CA');
 assert.deepEqual(lines.map(x=>x.text),['Revisa la frase.','Modelo.','Hello!','Confirma en pantalla.','Hello!','Una corrección.','Escucha.','Hello!','Una actividad practicada.','No es una calificación oficial.']);
 assert.equal(lines[6].slower,true);assert.equal(lines[7].slower,true);
 assert.equal(lines.at(-1).purpose,'summary');
});
test('queue serializes native completion callbacks and acknowledges only completed cues',async()=>{
 const h=harness(),heard=[];
 const result=h.narrator.run([line('Hello!'),line('Merci.','fr-CA')],0.88,l=>heard.push(l.text));
 assert.equal(h.calls.length,1);assert.deepEqual(heard,[]);
 h.calls[0].done();await tick();assert.equal(h.calls.length,2);assert.deepEqual(heard,['Hello!']);
 h.calls[1].done();assert.deepEqual(await result,{kind:'completed'});assert.deepEqual(heard,['Hello!','Merci.']);
 assert.ok(h.deadlines.every(j=>j.cleared));
});
test('stop promptly cancels the queue and late completion cannot unlock comprehension',async()=>{
 const h=harness(),heard=[];
 const result=h.narrator.run([line('Hello!'),line('Next')],1,l=>heard.push(l.text));
 h.narrator.cancel();assert.deepEqual(await result,{kind:'cancelled'});
 h.calls[0].done();await tick();assert.deepEqual(heard,[]);assert.equal(h.calls.length,1);assert.equal(h.stops(),1);
});
test('new narration revokes the previous queue even when callbacks arrive out of order',async()=>{
 const h=harness(),heard=[];
 const old=h.narrator.run([line('Old'),line('Old next')],1,l=>heard.push(l.text));
 const fresh=h.narrator.run([line('New')],1,l=>heard.push(l.text));
 h.calls[0].done();h.calls[1].done();
 assert.deepEqual(await old,{kind:'cancelled'});assert.deepEqual(await fresh,{kind:'completed'});
 assert.deepEqual(heard,['New']);assert.equal(h.calls.length,2);
});
test('missing native terminal callback times out and stops audio without acknowledging a cue',async()=>{
 const h=harness(),heard=[];
 const result=h.narrator.run([line('Hello!'),line('Next')],1,l=>heard.push(l.text));
 h.deadlines[0].callback();
 assert.deepEqual(await result,{kind:'failed',reason:'timeout'});assert.deepEqual(heard,[]);assert.equal(h.calls.length,1);assert.equal(h.stops(),1);
 h.calls[0].done();assert.deepEqual(heard,[]);
});
test('native errors, synchronous throws and rejected native promises are non-progressing failures',async()=>{
 const h=harness(),result=h.narrator.run([line('Hello!')],1);
 h.calls[0].error();assert.deepEqual(await result,{kind:'failed',reason:'playback'});
 for(const play of [()=>{throw Error('native unavailable');},()=>Promise.reject(Error('native unavailable'))]){
  const n=new SessionNarrator({play,stop(){}});
  assert.deepEqual(await n.run([line('Hello!')],1),{kind:'failed',reason:'playback'});
 }
});
test('an empty plan cancels previous narration and speech rate remains bounded',async()=>{
 const h=harness(),pending=h.narrator.run([{...line('Slow'),slower:true}],0.65);
 assert.equal(h.calls[0].rate,0.65);
 assert.deepEqual(await h.narrator.run([],1),{kind:'completed'});assert.deepEqual(await pending,{kind:'cancelled'});
});
