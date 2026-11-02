import test from 'node:test';
import assert from 'node:assert/strict';
import {learningPairs,courseActivities,dialogueActivities,planLearningSession,sessionOpening,stepSession,summarizeSession,completeSession,sessionToJSON,sessionFromJSON,sessionPreferencesFrom,validateSessionPreferences,defaultSessionPreferences,defaultExperiencePreferences,newLearnerModel,newCourseProgress,recordActivityResult,assessRecord,recordKey} from '../dist/index.js';

const today='2026-10-23';
const typed={kind:'typed'},spoken={kind:'speech',confidence:'high'},unsure={kind:'speech',confidence:'low'};
function start(target='en-CA',known='es',prefs={},extra={}){
 const activities=extra.activities??courseActivities(target,{comprehension:false});
 const model=extra.model??newLearnerModel(target);
 const state=planLearningSession({sessionId:extra.id??'s-1',target,known,today,activities,model,completedLessons:extra.completed??[],preferences:{...defaultSessionPreferences,...prefs}});
 return {state,activities,model};
}
function run(ctx,events){
 const all=[];
 for(const e of events){const r=stepSession(ctx.state,e,ctx.activities);ctx.state=r.state;all.push(...r.outputs);}
 return all;
}
const answer=(response,source=typed)=>({type:'answer',response,source});
const texts=outputs=>outputs.flatMap(o=>[o.text,o.instruction,...(o.items??[]),...(o.summary?.statements??[])]).filter(Boolean);

test('a new learner gets the first unlocked lesson with a stated goal and a comprehension check',()=>{
 const ctx=start('en-CA','es',{},{activities:courseActivities('en-CA')});
 assert.deepEqual(ctx.state.queue.map(q=>q.activityId),['en-CA-greet-listen-1','en-CA-a0-greeting-comprehension','en-CA-greet-repeat-2','en-CA-greet-recall-3','en-CA-greet-checkpoint-4']);
 const open=sessionOpening(ctx.state,ctx.activities);
 assert.equal(open[0].code,'goal');assert.match(open[0].text,/Saludar con naturalidad/);
 assert.equal(open[1].kind,'prompt');assert.deepEqual(open[1].speech,{text:'Hello!',language:'en-CA'});
});
test('due reviews come first, most forgotten first, then the next unlocked lesson',()=>{
 let model=newLearnerModel('en-CA');
 const r=(objectiveId,activityId,achievement,day)=>({activityId,objectiveId,kind:'checkpoint',modality:'speech',achievement,minorErrors:0,meaningErrors:0,replays:0,hints:0,modelShown:false,day});
 model=recordActivityResult(model,r('en-CA-a0-greeting','en-CA-greet-checkpoint-4','independent','2026-10-10'));
 model=recordActivityResult(model,r('en-CA-a1-help','en-CA-help-checkpoint-4','assisted','2026-10-12'));
 const ctx=start('en-CA','fr-CA',{},{model,completed:['en-CA-a0-greeting','en-CA-a1-help']});
 assert.deepEqual(ctx.state.queue.slice(0,2).map(q=>q.reason),['review','review']);
 assert.equal(ctx.state.queue[2].activityId,'en-CA-water-listen-1');
 assert.ok(ctx.state.queue.length<=defaultSessionPreferences.maxActivities);
 const flexible=start('en-CA','fr-CA',{predictableStructure:false},{model,completed:['en-CA-a0-greeting','en-CA-a1-help']});
 assert.deepEqual(flexible.state.queue.slice(0,3).map(q=>q.reason),['new','new','review'],'reviews are interleaved for flexible structure');
});
test('one-step instructions are revealed one at a time; full context gives all at once',()=>{
 const ctx=start('de','it');
 run(ctx,[{type:'continue'},answer('Hallo!',spoken)]);
 const steps=run(ctx,[{type:'continue'},{type:'continue'}]).map(o=>o.step.index);
 assert.deepEqual(steps,[1,2]);
 const full=start('de','it',{instructionFormat:'full-context'});
 const p=sessionOpening(full.state,full.activities)[1];
 assert.equal(p.step.total,1);assert.ok(p.instruction.split('. ').length>=2);
});
test('immediate corrections explain the specific error',()=>{
 const ctx=start('en-CA','es',{correctionTiming:'immediate'});
 run(ctx,[{type:'continue'},answer('Hello!',spoken)]);
 const out=run(ctx,[answer('Helo')]);
 assert.equal(out[0].outcome,'minor-error');assert.match(out[0].text,/ortografía: «hello» \(escribiste «helo»\)/);
});
test('deferred corrections arrive after the activity and never store learner words',()=>{
 const ctx=start('en-CA','es',{correctionTiming:'after-activity'});
 run(ctx,[{type:'continue'},answer('Hello!',spoken)]);
 const during=run(ctx,[answer('Helo')]);
 assert.equal(during[0].text,'Intentémoslo una vez más.');
 assert.ok(!sessionToJSON(ctx.state).includes('helo'),'learner text is not persisted');
 const after=run(ctx,[answer('Hi!')]);
 const corrections=after.find(o=>o.kind==='corrections');
 assert.deepEqual(corrections.items,['Una respuesta correcta: «Hello!». Revisa la ortografía: «hello».']);
 assert.equal(ctx.state.results.at(-1).achievement,'after-retry');
});
test('end-of-session and on-request corrections are held back',()=>{
 const eos=start('en-CA','fr-CA',{correctionTiming:'end-of-session'});
 const out=run(eos,[{type:'continue'},answer('Hello!',spoken),answer('Helo'),answer('Hello!'),answer('Hello!'),]);
 const summaryAt=out.findIndex(o=>o.kind==='summary'),correctionsAt=out.findIndex(o=>o.kind==='corrections');
 assert.ok(summaryAt>=0&&correctionsAt>summaryAt,'corrections only arrive with the end-of-session summary');
 assert.equal(eos.state.pendingCorrections.length,0);
 const asked=start('en-CA','fr-CA',{correctionTiming:'on-request'});
 run(asked,[{type:'continue'},answer('Hello!',spoken),answer('Helo'),answer('Hello!')]);
 const summary=stepSession(asked.state,{type:'finish'},asked.activities);
 assert.ok(summary.outputs[0].summary.statements.some(s=>/1 corrections sont disponibles/.test(s)));
 const request=stepSession(summary.state,{type:'request-corrections'},asked.activities);
 assert.equal(request.outputs[0].kind,'corrections');
 assert.equal(stepSession(request.state,{type:'request-corrections'},asked.activities).outputs[0].code,'no-corrections');
});
test('after two errors a model is offered; after three, remediation steps back once',()=>{
 const ctx=start('es','en-CA',{correctionTiming:'immediate'});
 run(ctx,[{type:'continue'},answer('¡Hola!',spoken)]);
 const second=run(ctx,[answer('Adiós'),answer('Gracias')]);
 assert.ok(second.some(o=>o.kind==='model'));
 const third=run(ctx,[answer('Perro')]);
 assert.ok(third.some(o=>o.code==='later'));assert.ok(third.some(o=>o.code==='step-back'));
 assert.equal(ctx.state.results.at(-1).achievement,'not-achieved');
 assert.deepEqual(ctx.state.queue.slice(3,5).map(q=>[q.activityId,q.reason]),[['es-greet-repeat-2','remediation'],['es-greet-recall-3','remediation']]);
 run(ctx,[answer('¡Hola!',spoken),answer('Perro'),answer('Gato'),answer('Casa')]);
 assert.equal(ctx.state.remediated.length,1,'remediation happens at most once per objective');
 assert.equal(ctx.state.queue.filter(q=>q.reason==='remediation').length,2);
});
test('on-request mode does not push a model answer unasked',()=>{
 const ctx=start('es','en-CA',{correctionTiming:'on-request'});
 run(ctx,[{type:'continue'},answer('¡Hola!',spoken)]);
 assert.ok(!run(ctx,[answer('Adiós'),answer('Gracias')]).some(o=>o.kind==='model'));
});
test('replays never lower a result; hints and models make it assisted',()=>{
 const ctx=start('it','pt-BR');
 run(ctx,[{type:'replay'},{type:'slower'},{type:'continue'},{type:'replay'},answer('Ciao!',spoken)]);
 assert.equal(ctx.state.results[1].achievement,'independent');assert.equal(ctx.state.results[1].replays,1);
 const hint=run(ctx,[{type:'hint'}]);
 assert.match(hint[0].text,/Dica: começa com «?Ciao/);
 assert.equal(run(ctx,[{type:'hint'}])[0].kind,'model');
 run(ctx,[answer('Ciao!',spoken)]);
 assert.equal(ctx.state.results[2].achievement,'assisted');
});
test('uncertain recognition is confirmed or rejected and never counts as an error',()=>{
 const ctx=start('fr-CA','de');
 run(ctx,[{type:'continue'},answer('Bonjour!',spoken),answer('Salut!',spoken)]);
 const ask=run(ctx,[answer('Bonjour',unsure)]);
 assert.equal(ask[0].kind,'confirm-request');assert.equal(ask[0].closestAnswer,'Bonjour!');
 run(ctx,[{type:'reject'},answer('zzz',unsure),answer('   ',spoken)]);
 assert.equal(ctx.state.current.minorErrors+ctx.state.current.meaningErrors,0);
 run(ctx,[answer('Bonjour',unsure),{type:'confirm'}]);
 assert.equal(ctx.state.results.at(-1).achievement,'learner-confirmed');
});
test('skipping is free and response time is flexible',()=>{
 const ctx=start('pt-BR','es',{responseWindow:{mode:'timed',seconds:8}});
 run(ctx,[{type:'continue'}]);
 assert.equal(run(ctx,[{type:'timeout'}])[0].code,'no-rush');
 run(ctx,[{type:'more-time'}]);
 const prompt=run(ctx,[{type:'continue'}]).find(o=>o.kind==='prompt');
 assert.deepEqual(prompt.responseWindow,{mode:'timed',seconds:16});
 const skipped=run(ctx,[{type:'skip'}]);
 assert.equal(skipped[0].code,'skipped');assert.equal(ctx.state.results.at(-1).achievement,'no-evidence');
 const untimed=start('pt-BR','es');
 assert.deepEqual(stepSession(untimed.state,{type:'timeout'},untimed.activities).outputs,[]);
});
test('pause, interruption and resume keep the exact position',()=>{
 const ctx=start('de','en-CA');
 run(ctx,[{type:'continue'},answer('Hallo!',spoken),{type:'pause'}]);
 assert.equal(run(ctx,[answer('Hallo!')])[0].code,'still-paused');
 const restored=sessionFromJSON(sessionToJSON(ctx.state),ctx.activities);
 assert.deepEqual(restored,ctx.state);
 const resumed=stepSession(restored,{type:'resume',day:'2026-10-24'},ctx.activities);
 assert.match(resumed.outputs[0].text,/Activity 3 of 4/);
 assert.equal(resumed.state.lastActiveOn,'2026-10-24');
 // A session interrupted while active (app closed) restores as paused.
 const active=start('de','en-CA');run(active,[{type:'continue'}]);
 assert.equal(sessionFromJSON(sessionToJSON(active.state),active.activities).status,'paused');
});
test('restoring rejects tampered or foreign session data',()=>{
 const ctx=start('es','it',{correctionTiming:'on-request'});
 run(ctx,[{type:'continue'},answer('¡Hola!',spoken),answer('Adiós')]);
 const v=JSON.parse(sessionToJSON(ctx.state));
 const bad=[x=>{x.queue[0].activityId='nope'},x=>{x.position=99},x=>{x.preferences.maxActivities=0},x=>{x.target='it'},
  x=>{x.pendingCorrections[0].findings.push({code:'spelling',received:'secret'})},x=>{x.pendingCorrections[0].closestAnswer='Invented'},
  x=>{x.current.pendingConfirmation='free text'},x=>{x.results[0].day='2026-01-01'},x=>{x.results[0].kind='checkpoint'}];
 for(const mutate of bad){const copy=JSON.parse(JSON.stringify(v));mutate(copy);assert.equal(sessionFromJSON(JSON.stringify(copy),ctx.activities),null,mutate.toString());}
 assert.equal(sessionFromJSON(JSON.stringify(v),courseActivities('de')),null,'activities from another language');
 assert.equal(sessionFromJSON('nope',ctx.activities),null);
});
test('the summary reports only what was done and never claims a level',()=>{
 const empty=start('en-CA','es');
 const s0=summarizeSession(empty.state,empty.activities);
 assert.equal(s0.activitiesDone,0);assert.equal(s0.cefrClaim,null);assert.match(s0.statements[0],/No se completó ninguna actividad/);
 const ctx=start('en-CA','es');
 run(ctx,[{type:'continue'},answer('Hello!',spoken),{type:'skip'}]);
 const {state,outputs}=stepSession(ctx.state,{type:'finish'},ctx.activities);
 const summary=outputs[0].summary;
 assert.equal(summary.activitiesDone,3);assert.equal(summary.independent,1);assert.equal(summary.notCounted,1);
 assert.equal(summary.pronunciation,'not-assessed');
 assert.ok(summary.statements.some(s=>/Sin contar \(audio poco claro u omitido\): 1/.test(s)));
 assert.equal(state.status,'finished');
});
test('completing a session updates the learner model and course progress exactly once',()=>{
 const ctx=start('es','en-CA');
 run(ctx,[{type:'continue'},answer('¡Hola!',spoken),answer('Buenos días.'),answer('¡Hola!',spoken)]);
 assert.equal(ctx.state.status,'finished');
 const first=completeSession(ctx.state,ctx.model,newCourseProgress('es'));
 assert.equal(first.applied,true);assert.deepEqual(first.progress.completed,['es-a0-greeting']);
 assert.equal(assessRecord(first.model.records[recordKey('es-a0-greeting','spoken-production')],today).state,'practicing','one day is not mastery');
 const again=completeSession(ctx.state,first.model,first.progress);
 assert.equal(again.applied,false);assert.equal(again.model,first.model);
});
test('dialogue turns are practised as spoken interaction',()=>{
 const activities=dialogueActivities('fr-CA');
 const ctx=start('fr-CA','en-CA',{},{activities});
 const first=ctx.state.queue.map(q=>activities.find(a=>a.id===q.activityId));
 assert.ok(first.every(a=>a.kind==='dialogue-turn'&&a.objectiveId===first[0].objectiveId));
 const out=sessionOpening(ctx.state,activities);
 assert.equal(out[1].speech.language,'fr-CA');
 run(ctx,first.map(a=>answer(a.model,spoken)));
 const done=completeSession(ctx.state,ctx.model,newCourseProgress('fr-CA'));
 assert.ok(done.model.records[recordKey(first[0].objectiveId,'spoken-interaction')]);
});
test('all 30 directed pairs complete a session with localized, filled-in text',()=>{
 for(const [known,target] of learningPairs()){
  const ctx=start(target,known,{correctionTiming:'after-activity'},{id:`pair-${known}-${target}`,activities:courseActivities(target)});
  const outputs=[...sessionOpening(ctx.state,ctx.activities)];
  for(let guard=0;ctx.state.status!=='finished'&&guard<20;guard++){
   const a=ctx.activities.find(x=>x.id===ctx.state.current.activityId);
   outputs.push(...run(ctx,[a.kind==='listen'?{type:'continue'}:a.kind==='choice'?{type:'choose',optionId:a.correctOptionId}:answer(a.model,spoken)]));
  }
  assert.equal(ctx.state.status,'finished',`${known}->${target}`);
  const done=completeSession(ctx.state,ctx.model,newCourseProgress(target));
  assert.equal(done.progress.completed.length,1,`${known}->${target}`);
  for(const t of texts(outputs))assert.ok(t.trim()&&!/[{}]/.test(t),`${known}->${target}: ${t}`);
 }
});
test('session preferences derive from stored experience preferences without diagnosis',()=>{
 const p=sessionPreferencesFrom({...defaultExperiencePreferences,correctionTiming:'after-each-answer',answerControl:'auto-after-silence',instructionFormat:'full-context'},{answerWaitSeconds:12,microLessonMinutes:15,interactionStyle:'flexible'});
 assert.deepEqual([p.correctionTiming,p.responseWindow,p.instructionFormat,p.maxActivities,p.predictableStructure],['immediate',{mode:'timed',seconds:12},'full-context',14,false]);
 assert.equal(sessionPreferencesFrom(defaultExperiencePreferences,{correctionMode:'end-of-session'}).correctionTiming,'end-of-session');
 assert.equal(sessionPreferencesFrom(defaultExperiencePreferences).responseWindow.mode,'untimed');
 assert.throws(()=>validateSessionPreferences({...defaultSessionPreferences,responseWindow:{mode:'timed',seconds:1}}),/window/);
});
test('a paused session completed after a later session never crashes or rewinds time',()=>{
 const a=start('it','es',{},{id:'session-a'});
 run(a,[{type:'continue'},answer('Ciao!',spoken),{type:'pause'}]);
 const b=start('it','es',{},{id:'session-b'});
 b.state={...b.state,startedOn:'2026-10-25',lastActiveOn:'2026-10-25'};
 run(b,[{type:'continue'},answer('Ciao!',spoken),answer('Ciao!'),answer('Ciao!',spoken)]);
 let model=completeSession(b.state,newLearnerModel('it'),newCourseProgress('it')).model;
 run(a,[{type:'resume',day:'2026-10-23'},answer('Buongiorno!'),answer('Ciao!',spoken)]);
 const done=completeSession(a.state,model,newCourseProgress('it'));
 assert.equal(done.applied,true);
 for(const r of Object.values(done.model.records))assert.ok(r.lastPracticedOn>='2026-10-25');
});
