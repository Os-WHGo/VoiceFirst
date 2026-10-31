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
  useMemo(fn){const id=cursor++;return slots[id]??(slots[id]=fn());},
  useEffect(fn){const id=cursor++;if(!(id in slots)){slots[id]=true;effects.push(fn);}},
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
function elements(node){
 if(node===null||node===undefined||typeof node==='boolean')return [];
 if(Array.isArray(node))return node.flatMap(elements);
 if(typeof node!=='object')return [];
 return [node,...elements(node.props?.children)];
}
function textOf(node){return typeof node==='string'?node:Array.isArray(node)?node.map(textOf).join(''):node&&typeof node==='object'?textOf(node.props?.children):'';}
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
 button(tree,'Repetir').props.onPress();assert.equal(typeof onDone,'function');onDone();
 tree=render();assert.equal(button(tree,option).props.disabled,false);
 const a=activities.find(a=>a.id===cp.session.current.activityId);
 const response=runtime.outputs.find(o=>o.kind==='prompt').options[0].text;
 onDictation({text:response,confidence:'high'},`${a.id}:${cp.session.revision}`);
 assert.equal(events.length,0,'native result never auto-grades');
 tree=render();button(tree,'Comprobar').props.onPress();
 assert.deepEqual(events[0].source,{kind:'speech',confidence:'unknown'});
});
