import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {targetLanguages,learningPairs,loadA0CandidateCatalog,auditChoiceItems,a0AuditItems,a0ChoiceActivities,courseComprehensionActivities,courseActivities,seededOptionOrder,servesFunction,
 planLearningSession,stepSession,sessionOpening,sessionToJSON,sessionFromJSON,completeSession,defaultSessionPreferences,newLearnerModel,newCourseProgress,recordKey} from '../dist/index.js';

const asset=JSON.parse(readFileSync(new URL('../../../mobile/assets/VoiceFirst_A0_Functional_6Langs_v0.2.json',import.meta.url),'utf8'));
const a0=loadA0CandidateCatalog(asset).lessons;
const today='2026-10-23';
function session(target,known,activities,prefs={},id='c-1'){
 return {activities,state:planLearningSession({sessionId:id,target,known,today,activities,model:newLearnerModel(target),completedLessons:[],preferences:{...defaultSessionPreferences,...prefs}})};
}
function run(ctx,events){const out=[];for(const e of events){const r=stepSession(ctx.state,e,ctx.activities);ctx.state=r.state;out.push(...r.outputs);}return out;}

test('seeded option order is a stable permutation that differs between sessions',()=>{
 const items=['a','b','c','d'];
 const one=seededOptionOrder(items,'s1:x');
 assert.deepEqual(seededOptionOrder(items,'s1:x'),one);
 assert.deepEqual([...one].sort(),items);
 const orders=new Set(Array.from({length:20},(_,i)=>seededOptionOrder(items,`s${i}:x`).join('')));
 assert.ok(orders.size>5);
});
test('the audit finds the real A0 defects: a repeating answer position and two ambiguous distractors',()=>{
 assert.equal(a0.length,36);
 const issues=auditChoiceItems(a0AuditItems(a0));
 assert.deepEqual(issues.filter(i=>i.code==='ANSWER_POSITION_PATTERN').map(i=>i.language).sort(),[...targetLanguages].sort());
 assert.deepEqual(issues.filter(i=>i.code==='AMBIGUOUS_DISTRACTOR').map(i=>i.itemId).sort(),['vf.a0.functional.02.fr-CA','vf.a0.functional.02.it']);
 assert.equal(issues.length,8,'no false positives for time-specific greetings');
 assert.equal(servesFunction('it','Ciao','farewell'),true);
 assert.equal(servesFunction('en-CA','Good evening','greeting-morning'),false);
 assert.equal(servesFunction('en-CA','Hello','greeting-morning'),true);
});
test('shuffled presentation removes the A0 position pattern',()=>{
 for(const lang of targetLanguages){
  const lessons=a0.filter(l=>l.targetLanguage===lang);
  const acts=a0ChoiceActivities(lessons);
  const shown=acts.map(a=>({id:a.id,language:lang,options:seededOptionOrder(a.options,`learner-7:${a.id}`).map(o=>({id:o.id,text:o.text})),correctOptionId:a.correctOptionId}));
  assert.equal(auditChoiceItems(shown).filter(i=>i.code==='ANSWER_POSITION_PATTERN').length,0,lang);
 }
});
test('A0 recognition runs as a session in every directed pair and records reading comprehension',()=>{
 for(const [known,target] of learningPairs()){
  const ctx=session(target,known,a0ChoiceActivities(a0.filter(l=>l.targetLanguage===target)),{maxNewLessons:1},`a0-${known}-${target}`);
  const [goal,prompt]=sessionOpening(ctx.state,ctx.activities);
  assert.equal(goal.code,'goal');assert.equal(prompt.activityKind,'choice');
  assert.ok(prompt.instruction.trim()&&!/[{}]/.test(prompt.instruction));
  assert.equal(prompt.options.length,3);assert.ok(prompt.options.every(o=>o.language===target));
  const a=ctx.activities.find(x=>x.id===prompt.activityId);
  run(ctx,[{type:'choose',optionId:a.correctOptionId}]);
  assert.equal(ctx.state.status,'finished');
  const done=completeSession(ctx.state,newLearnerModel(target),newCourseProgress(target));
  assert.ok(done.model.records[recordKey(a.objectiveId,'reading-comprehension')],`${known}->${target}`);
  assert.equal(done.progress.completed.length,0,'A0 candidates do not alter course progress');
 }
});
test('an option that is also valid is reviewed, not counted as an error',()=>{
 const acts=a0ChoiceActivities(a0.filter(l=>l.targetLanguage==='it'));
 const farewell=acts.find(a=>a.objectiveId==='vf.a0.functional.02.it');
 assert.deepEqual(farewell.acceptableOptions.map(x=>x.optionId),['1']);
 const ctx={activities:acts,state:planLearningSession({sessionId:'c-2',target:'it',known:'es',today,activities:acts,model:newLearnerModel('it'),completedLessons:['vf.a0.functional.01.it'],preferences:defaultSessionPreferences})};
 assert.equal(ctx.state.current.activityId,farewell.id,'prerequisites gate A0 items too');
 const out=run(ctx,[{type:'choose',optionId:'1'}]);
 assert.equal(out[0].outcome,'needs-review');assert.match(out[0].text,/No cuenta como error/);
 assert.equal(ctx.state.current.meaningErrors,0);
 run(ctx,[{type:'choose',optionId:'3'}]);
 // Grazie is the only real error; what remains could be won by guessing, so the activity closes.
 assert.deepEqual([ctx.state.results.at(-1).achievement,ctx.state.results.at(-1).meaningErrors],['not-achieved',1]);
 const again={activities:acts,state:planLearningSession({sessionId:'c-3',target:'it',known:'es',today,activities:acts,model:newLearnerModel('it'),completedLessons:['vf.a0.functional.01.it'],preferences:defaultSessionPreferences})};
 run(again,[{type:'choose',optionId:'1'},{type:'choose',optionId:'2'}]);
 assert.equal(again.state.results.at(-1).achievement,'independent','a reviewed alternative before the expected answer is not an error');
});
test('course listening comprehension: options in the known language, hint removes a wrong option',()=>{
 for(const target of targetLanguages){
  const checks=courseComprehensionActivities(target);
  assert.equal(checks.length,14);
  for(const c of checks){
   assert.equal(c.options.length,3);assert.equal(new Set(c.options.map(o=>o.id)).size,3);
   for(const k of targetLanguages)assert.equal(new Set(c.options.map(o=>o.text[k])).size,3,`${c.id} ${k}`);
  }
 }
 const ctx=session('de','pt-BR',courseActivities('de'),{correctionTiming:'immediate'});
 run(ctx,[{type:'continue'}]);
 const a=ctx.activities.find(x=>x.id===ctx.state.current.activityId);
 assert.equal(a.kind,'choice');
 const prompt=run(ctx,[{type:'continue'}]).find(o=>o.kind==='prompt');
 assert.ok(prompt.options.every(o=>o.language==='pt-BR'));
 const hint=run(ctx,[{type:'hint'}])[0].text;
 const correctText=a.options.find(o=>o.id===a.correctOptionId).text['pt-BR'];
 assert.match(hint,/^Dica: não é/);assert.ok(!hint.includes(correctText));
 const model=run(ctx,[{type:'hint'}])[0];
 assert.equal(model.kind,'model');assert.ok(model.text.includes(correctText));assert.equal(model.speech.language,'de');
 run(ctx,[{type:'answer',response:correctText,source:{kind:'speech',confidence:'high'}}]);
 assert.equal(ctx.state.results.at(-1).achievement,'assisted');
 assert.equal(ctx.state.results.at(-1).skill,'listening-comprehension');
});
test('wrong choices are corrected by option and the activity closes before guessing is exhausted',()=>{
 const ctx=session('es','en-CA',courseActivities('es'),{correctionTiming:'after-activity'});
 run(ctx,[{type:'continue'}]);
 const a=ctx.activities.find(x=>x.id===ctx.state.current.activityId);
 const wrong=a.options.filter(o=>o.id!==a.correctOptionId);
 assert.equal(run(ctx,[{type:'choose',optionId:wrong[0].id}])[0].text,'Let’s try that once more.');
 const restored=sessionFromJSON(sessionToJSON(ctx.state),ctx.activities);
 assert.deepEqual(restored.pendingCorrections[0],{activityId:a.id,outcome:'meaning-error',findings:[],correctOptionId:a.correctOptionId});
 const tampered=JSON.parse(sessionToJSON(ctx.state));tampered.pendingCorrections[0].correctOptionId=wrong[1].id;
 assert.equal(sessionFromJSON(JSON.stringify(tampered),ctx.activities),null);
 const out=run(ctx,[{type:'choose',optionId:wrong[1].id}]);
 assert.equal(ctx.state.results.at(-1).achievement,'not-achieved');
 assert.ok(out.find(o=>o.kind==='corrections').items[0].includes(a.options.find(o=>o.id===a.correctOptionId).text['en-CA']));
 assert.equal(run(ctx,[{type:'choose',optionId:'nonexistent'}]).length,0);
});
test('unclear or non-matching speech never chooses an option',()=>{
 const ctx=session('fr-CA','it',courseActivities('fr-CA'));
 run(ctx,[{type:'continue'}]);
 const a=ctx.activities.find(x=>x.id===ctx.state.current.activityId);
 const right=a.options.find(o=>o.id===a.correctOptionId).text.it;
 assert.equal(run(ctx,[{type:'answer',response:right,source:{kind:'speech',confidence:'low'}}])[0].code,'not-heard');
 assert.equal(run(ctx,[{type:'answer',response:'qualcosa',source:{kind:'typed'}}])[0].code,'not-heard');
 assert.equal(ctx.state.current.meaningErrors,0);assert.equal(ctx.state.results.length,1);
});
