/** Exercises the actual TS/TSX adapters with deterministic hook/native boundaries.
 * Does not emulate SQLite, an OS microphone, React Native layout or a physical device.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as core from '../dist/index.js';

function hooks(){
 const slots=[],effects=[];let cursor=0;
 const react={
  createElement:(type,props,...children)=>({type,props:{...props,children}}),Fragment:'Fragment',
  useState(initial){const id=cursor++;if(!(id in slots))slots[id]=typeof initial==='function'?initial():initial;return [slots[id],v=>{slots[id]=typeof v==='function'?v(slots[id]):v;}];},
  useRef(initial){const id=cursor++;return slots[id]??(slots[id]={current:initial});},
  useMemo(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i]))slots[id]={deps,value:fn()};return slots[id].value;},
  useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
  useEffect(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i])){const entry={deps,cleanup:old?.cleanup};slots[id]=entry;effects.push(()=>{entry.cleanup?.();entry.cleanup=fn();return entry.cleanup;});}},
 };
 return {react:{__esModule:true,default:react,...react},render(fn){cursor=0;return fn();},mount(){return effects.splice(0).map(fn=>fn());}};
}
function compile(path,modules){
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>{assert.ok(name in modules,`unknown module ${name}`);return modules[name];},module,module.exports);
 return module.exports;
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('course control vocabulary covers Portuguese, German and Italian with strict matching',()=>{
 for(const [type,phrases] of Object.entries({PAUSE:['pausar aula','Lektion pausieren','metti in pausa'],RESUME:['retomar aula','Lektion fortsetzen','riprendi la lezione'],STOP:['encerrar aula','Lektion beenden','termina la lezione'],SLOWER:['mais devagar','langsamer bitte','più lentamente'],HELP:['uma dica','gib mir einen Hinweis','dammi un indizio'],SUMMARY:['o que aprendi','Zusammenfassung','cosa ho imparato']})){
  for(const phrase of phrases){assert.equal(core.parseVoiceCommand(phrase)?.type,type);assert.equal(core.parseVoiceCommand(`I said ${phrase}`),null);}
 }
});
test('actual hook serializes rapid start taps and never advances UI before durable save',async()=>{
 const h=hooks();let saves=0,release;
 const pending=new Promise(resolve=>{release=resolve;});
 const api=compile('../../../mobile/use-learning-session.ts',{
  react:h.react,'@voicefirst/core':core,'./learning-checkpoint-storage':{
   loadLearningCheckpoint:async()=>({checkpoint:core.newLearningCheckpoint('en-CA'),raw:null}),
   saveLearningCheckpoint:async value=>{saves++;await pending;return core.learningCheckpointToJSON(value);},
  },
 });
 const render=()=>h.render(()=>api.useLearningSession('en-CA','es',core.defaultExperiencePreferences));
 render();h.mount();await tick();let view=render();
 const first=view.transition('start');await view.transition('start');
 assert.equal(saves,1);assert.equal(render().value.session,null);assert.equal(render().busy,true);
 release();await first;view=render();assert.equal(view.value.session.status,'active');assert.equal(view.busy,false);
});
test('actual hook keeps last committed snapshot and blocks writes after storage failure',async()=>{
 const h=hooks();let saves=0;
 const api=compile('../../../mobile/use-learning-session.ts',{react:h.react,'@voicefirst/core':core,'./learning-checkpoint-storage':{
  loadLearningCheckpoint:async()=>({checkpoint:core.newLearningCheckpoint('de'),raw:null}),
  saveLearningCheckpoint:async()=>{saves++;throw Error('storage unavailable');},
 }});
 const render=()=>h.render(()=>api.useLearningSession('de','it',core.defaultExperiencePreferences));
 render();h.mount();await tick();await render().transition('start');
 assert.equal(render().blocked,true);assert.equal(render().value.session,null);
 await render().transition('start');assert.equal(saves,1);
});
const a0Lesson={lessonId:'a0.fr.1',conceptId:'a0.greeting',targetLanguage:'fr-CA',sequence:1,prerequisites:[],skill:'reading',contextByKnownLanguage:{},promptByKnownLanguage:{},options:[{id:'a',text:'Bonjour'},{id:'b',text:'Bonsoir'}],correctOptionId:'a',publishable:false,humanReviewRequired:true};
const a0Lessons=[a0Lesson];
function a0HookHarness(port){
 const h=hooks();
 const api=compile('../../../mobile/use-a0-session.ts',{react:h.react,'@voicefirst/core':core,'./a0-device-storage':{a0DeviceStorage:port}});
 return {render:()=>h.render(()=>api.useA0Session('fr-CA',a0Lessons)),mount:()=>h.mount()};
}
test('A0 hook stops already queued writes after a storage failure, including stale submit closures',async()=>{
 let writes=0;
 const port={read:async()=>null,write:async()=>assert.fail('blind write'),compareAndWrite:async()=>{writes++;throw Error('disk full');}};
 const h=a0HookHarness(port);h.render();h.mount();await tick();
 const ready=h.render();assert.equal(ready.status,'ready');
 const first=ready.submit(a0Lesson,{eventId:'first',lessonId:a0Lesson.lessonId,selectedOptionId:'b',attemptNumber:1});
 const queued=ready.submit(a0Lesson,{eventId:'queued',lessonId:a0Lesson.lessonId,selectedOptionId:'a',attemptNumber:2});
 assert.equal(await first,false);assert.equal(await queued,false);
 assert.equal(writes,1);assert.equal(h.render().status,'blocked');assert.equal(h.render().journal.revision,0);
 assert.equal(await ready.submit(a0Lesson,{eventId:'stale',lessonId:a0Lesson.lessonId,selectedOptionId:'a',attemptNumber:1}),false);
 assert.equal(writes,1);
});
test('A0 hook passes exact snapshots across concurrent instances and recovers only by a new read',async()=>{
 let raw=null;
 const port={read:async()=>raw,write:async()=>assert.fail('blind write'),compareAndWrite:async(_key,expected,next)=>{if(expected!==raw)return false;raw=next;return true;}};
 const first=a0HookHarness(port),second=a0HookHarness(port);
 first.render();second.render();first.mount();second.mount();await tick();
 assert.equal(await first.render().submit(a0Lesson,{eventId:'first',lessonId:a0Lesson.lessonId,selectedOptionId:'b',attemptNumber:1}),true);
 const saved=raw;
 assert.equal(await second.render().submit(a0Lesson,{eventId:'other',lessonId:a0Lesson.lessonId,selectedOptionId:'a',attemptNumber:1}),false);
 assert.equal(second.render().status,'blocked');assert.equal(raw,saved);
 const reopened=a0HookHarness(port);reopened.render();reopened.mount();await tick();
 assert.equal(reopened.render().journal.revision,1);
 assert.equal(await reopened.render().submit(a0Lesson,{eventId:'reopened',lessonId:a0Lesson.lessonId,selectedOptionId:'a',attemptNumber:2}),true);
 assert.equal(JSON.parse(raw).events.length,2);
});
function elements(node){
 if(node===null||node===undefined||typeof node==='boolean')return [];
 if(Array.isArray(node))return node.flatMap(elements);
 if(typeof node!=='object')return [];
 return [node,...elements(node.props?.children)];
}
function textOf(node){return typeof node==='string'?node:Array.isArray(node)?node.map(textOf).join(''):node&&typeof node==='object'?textOf(node.props?.children):'';}
function voiceHarness(){
 const h=hooks(),activities=core.courseActivities('en-CA');
 let checkpoint=core.newLearningCheckpoint('en-CA');
 const session=core.planLearningSession({sessionId:'guided-ui',target:'en-CA',known:'es',today:'2026-10-31',activities,model:checkpoint.model,completedLessons:[],preferences:core.defaultSessionPreferences});
 checkpoint=core.checkpointWithSession(checkpoint,session);
 const events=[],audio=[],answerStarts=[],commandStarts=[],callbacks=new Map();let appStateCallback;
 const runtime={value:checkpoint,activities,outputs:core.sessionOpening(session,activities),busy:false,blocked:false,
  async transition(event){events.push(event);const next=core.stepLearningCheckpoint(runtime.value,event,activities);runtime.value=next.checkpoint;runtime.outputs=next.outputs;}};
 const mic={available:true,listening:false,issue:'',stop(){mic.listening=false;},async start(id){answerStarts.push(id);mic.listening=true;return true;}};
 const commandMic={available:true,listening:false,issue:'',stop(){commandMic.listening=false;},async start(id){commandStarts.push(id);commandMic.listening=true;return true;}};
 const appState={currentState:'active',addEventListener:(_name,cb)=>{appStateCallback=cb;return {remove(){}};}};
 const api=compile('../../../mobile/LearningSessionCourse.tsx',{
  react:h.react,'react-native':{AppState:appState,Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View',StyleSheet:{create:x=>x}},
  '@voicefirst/core':core,'./use-learning-session':{useLearningSession:()=>runtime},
  './use-on-device-answer':{useOnDeviceAnswer:(language,cb)=>{callbacks.set(language,cb);return language==='en-CA'?mic:commandMic;}},
  './curated-voice-output':{stopCuratedVoice:async()=>{},playCuratedVoice:async(cue,rate,done,error)=>{audio.push({cue,rate,done,error,settled:false});}},
 });
 const render=()=>h.render(()=>api.LearningSessionCourse({target:'en-CA',nativeLanguage:'es'}));
 const flush=async()=>{const tree=render();h.mount();await tick();return tree;};
 const press=(tree,label)=>{
  const button=elements(tree).find(e=>e.type==='Pressable'&&textOf(e)===label);
  assert.ok(button,`missing button ${label}`);assert.equal(button.props.disabled,false,`disabled button ${label}`);button.props.onPress();
 };
 const drain=async()=>{
  for(let n=0;n<50;n++){
   const call=audio.find(c=>!c.settled);if(!call){await tick();return;}
   call.settled=true;call.done();await tick();
  }
  assert.fail('unbounded narration');
 };
 return {runtime,events,audio,answerStarts,commandStarts,callbacks,render,flush,press,drain,
  background:()=>{appState.currentState='background';appStateCallback('background');}};
}
test('guided mobile session narrates before capture, waits for choices and never auto-confirms ASR',async()=>{
 const h=voiceHarness();let tree=await h.flush();
 assert.equal(h.audio.length,0,'guide is opt-in');
 h.press(tree,'Activar guía de voz');await h.flush();
 assert.equal(h.audio[0].cue.language,'es');assert.equal(h.commandStarts.length,0);
 await h.drain();assert.equal(h.commandStarts.length,1,'listen stage accepts a separate command turn');
 h.callbacks.get('es')({text:'reanudar clase',confidence:'unknown'},h.commandStarts[0]);
 tree=await h.flush();assert.equal(h.events.length,0,'uncalibrated command waits for confirmation');
 h.press(tree,'Confirmar respuesta propuesta');await h.flush();await h.drain();
 assert.equal(h.runtime.value.session.current.activityId,'en-CA-a0-greeting-comprehension');
 assert.equal(h.answerStarts.length,0,'choice is never auto-scored by an uncertain recognizer');
 const prompt=core.sessionOpening(h.runtime.value.session,h.runtime.activities).find(o=>o.kind==='prompt');
 const activity=h.runtime.activities.find(a=>a.id===prompt.activityId);
 const option=prompt.options.find(o=>o.id===activity.correctOptionId);
 tree=await h.flush();h.press(tree,option.text);await h.flush();
 assert.equal(h.answerStarts.length,0,'target microphone must wait for narration');
 await h.drain();assert.equal(h.answerStarts.length,1);
 const before=h.runtime.value.session.results.length;
 h.callbacks.get('en-CA')({text:'Hello!',confidence:'high'},h.answerStarts[0]);
 tree=await h.flush();await h.drain();
 assert.deepEqual(h.events.at(-1).source,{kind:'speech',confidence:'unknown'});
 assert.equal(h.runtime.value.session.results.length,before);
 assert.equal(h.runtime.value.session.current.pendingConfirmation,'Hello!');
 assert.equal(h.answerStarts.length,1,'confirmation narration must not reopen capture');
 tree=await h.flush();h.press(tree,'Confirmar respuesta propuesta');
 assert.equal(h.runtime.value.session.results.at(-1).achievement,'learner-confirmed');
 // Dispose the last pending utterance before the test exits.
 tree=await h.flush();h.press(tree,'Detener voz y micrófono');
});
test('background during guided narration revokes queued audio and prevents a late microphone start',async()=>{
 const h=voiceHarness();let tree=await h.flush();h.press(tree,'Activar guía de voz');await h.flush();
 const late=h.audio[0];h.background();await h.flush();
 late.done();await tick();await h.flush();
 assert.equal(h.answerStarts.length,0);assert.equal(h.commandStarts.length,0);
 assert.equal(h.audio.length,1);assert.equal(h.runtime.value.session.status,'paused');
 assert.ok(elements(h.render()).some(e=>e.type==='Pressable'&&textOf(e)==='Activar guía de voz'),'foreground permission is not silently restored');
});
test('stopping a guided utterance cannot unlock comprehension via a late callback',async()=>{
 const h=voiceHarness();let tree=await h.flush();h.press(tree,'Continuar');await h.flush();
 tree=await h.flush();h.press(tree,'Activar guía de voz');await h.flush();
 const late=h.audio[0];tree=await h.flush();h.press(tree,'Detener voz y micrófono');
 late.done();await tick();tree=await h.flush();
 const prompt=core.sessionOpening(h.runtime.value.session,h.runtime.activities).find(o=>o.kind==='prompt');
 const option=prompt.options[0];
 const button=elements(tree).find(e=>e.type==='Pressable'&&textOf(e)===option.text);
 assert.equal(button.props.disabled,true);assert.equal(h.answerStarts.length,0);
});
test('actual course UI requires completed listening before a comprehension choice and preserves uncertain ASR source',async()=>{
 const h=hooks();const activities=core.courseActivities('en-CA');
 let cp=core.newLearningCheckpoint('en-CA');
 const state=core.planLearningSession({sessionId:'ui-session',target:'en-CA',known:'es',today:'2026-10-30',activities,model:cp.model,completedLessons:[],preferences:core.defaultSessionPreferences});
 cp=core.checkpointWithSession(cp,state);cp=core.stepLearningCheckpoint(cp,{type:'continue'},activities).checkpoint;
 let onDictation,onDone;const events=[];
 const runtime={value:cp,activities,outputs:core.sessionOpening(cp.session,activities),busy:false,blocked:false,transition:e=>events.push(e)};
 const mic={stop(){},available:true,listening:false,issue:'',start:async()=>true};
 const api=compile('../../../mobile/LearningSessionCourse.tsx',{
  react:h.react,'react-native':{AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Pressable:'Pressable',Text:'Text',TextInput:'TextInput',View:'View',StyleSheet:{create:x=>x}},
  '@voicefirst/core':core,'./use-learning-session':{useLearningSession:()=>runtime},
  './use-on-device-answer':{useOnDeviceAnswer:(_target,cb)=>{if(_target==='en-CA')onDictation=cb;return mic;}},
  './curated-voice-output':{stopCuratedVoice:async()=>{},playCuratedVoice:async(_cue,_rate,done)=>{onDone=done;}},
 });
 const render=()=>h.render(()=>api.LearningSessionCourse({target:'en-CA',nativeLanguage:'es'}));
 let tree=render();
 const button=(tree,label)=>elements(tree).find(e=>e.type==='Pressable'&&textOf(e)===label);
 const option=runtime.outputs.find(o=>o.kind==='prompt').options[0].text;
 assert.equal(button(tree,option).props.disabled,true,'no listening evidence before playback');
 button(tree,'Repetir').props.onPress();assert.equal(typeof onDone,'function');onDone();await tick();
 tree=render();assert.equal(button(tree,option).props.disabled,false);
 const a=activities.find(a=>a.id===cp.session.current.activityId);
 const response=runtime.outputs.find(o=>o.kind==='prompt').options[0].text;
 onDictation({text:response,confidence:'high'},`${a.id}:${cp.session.revision}`);
 assert.equal(events.length,0,'native result never auto-grades');
 tree=render();button(tree,'Comprobar').props.onPress();
 assert.deepEqual(events[0].source,{kind:'speech',confidence:'unknown'});
});
