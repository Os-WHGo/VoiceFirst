/** Simulated React hooks and native speech events.
 * This never tests a real microphone, permissions, or hardware audio routing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as core from '../dist/index.js';

function hooks(){
 const slots=[],effects=[];let cursor=0;
 const react={
  useState(initial){const id=cursor++;if(!(id in slots))slots[id]=typeof initial==='function'?initial():initial;return [slots[id],value=>{slots[id]=typeof value==='function'?value(slots[id]):value;}];},
  useRef(initial){const id=cursor++;return slots[id]??(slots[id]={current:initial});},
  useMemo(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i]))slots[id]={deps,value:fn()};return slots[id].value;},
  useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
  useEffect(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i])){const entry={deps,cleanup:old?.cleanup};slots[id]=entry;effects.push(()=>{entry.cleanup?.();entry.cleanup=fn();});}}
 };
 return {react,render:fn=>{cursor=0;return fn();},mount:()=>effects.splice(0).forEach(fn=>fn())};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({installed=true,allowed=true,routeSupport=false,android=false,immediateRouteChange=false}={}){
 const h=hooks(),listeners=new Map(),final=[],partial=[],starts=[],downloads=[];let permissionCount=0,abortCount=0,permissionGranted=allowed,modelInstalled=installed;
 let routeListener=null,routeSubscriptions=0;
 const appState={currentState:'active',addEventListener(){return {remove(){}};}};
 const native={
  isRecognitionAvailable:()=>true,supportsOnDeviceRecognition:()=>true,
  requestMicrophonePermissionsAsync:async()=>{permissionCount++;return {granted:permissionGranted};},
  addListener(name,callback){listeners.set(name,callback);return {remove(){listeners.delete(name);}};},
  start(opts){starts.push(opts);},abort(){abortCount++;},
  getSupportedLocales:async()=>({locales:['en-CA'],installedLocales:modelInstalled?['en-CA']:[]}),
  androidTriggerOfflineModelDownload:async options=>{downloads.push(options.locale);return {status:'download_scheduled'};}
 };
 const script=readFileSync(new URL('../../../mobile/use-on-device-answer.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const routeSnapshot=()=>android?{
  platform:'android',scope:'connected-inputs-only',activeInputId:null,
  connectedInputs:[{id:'phone',kind:'built-in'},{id:'headset',kind:'bluetooth-hfp'}],observedAtEpochMs:1780000100000
 }:{platform:'ios',scope:'app-audio-session',activeInputId:'phone',
  connectedInputs:[{id:'phone',kind:'built-in'},{id:'headset',kind:'bluetooth-hfp'}],observedAtEpochMs:1780000100000};
 const imports={
  react:h.react,'react-native':{AppState:appState,Platform:{OS:'android'}},
  '@voicefirst/core':core,'expo-speech-recognition':{ExpoSpeechRecognitionModule:native},
  './native-input-route':{
   readNativeInputSnapshot:async()=>routeSupport?routeSnapshot():null,
   observeNativeInputChanges:callback=>{
    routeListener=callback;routeSubscriptions++;
    if(immediateRouteChange)callback(android
      ?{...routeSnapshot(),connectedInputs:[{id:'phone',kind:'built-in'}],observedAtEpochMs:1780000100100}
      :{...routeSnapshot(),activeInputId:'headset',observedAtEpochMs:1780000100100});
    return ()=>{if(routeListener===callback)routeListener=null;};
   }
  }
 };
 new Function('require','module','exports',code)(name=>{assert.ok(name in imports,'unknown import '+name);return imports[name];},module,module.exports);
 const render=()=>h.render(()=>module.exports.useOnDeviceAnswer('en-CA',(r,id)=>final.push({r,id}),(value,id)=>partial.push({value,id})));
 const flush=async()=>{render();h.mount();await tick();return render();};
 return {render,flush,emit:(type,e={})=>{assert.ok(listeners.has(type),'missing listener '+type);listeners.get(type)(e);},native,
  final,partial,starts,downloads,setAllowed:x=>permissionGranted=x,setInstalled:x=>modelInstalled=x,
  permissions:()=>permissionCount,aborts:()=>abortCount,
  routeSnapshot,emitRoute:route=>{assert.ok(routeListener,'no active native route listener');routeListener(route);},
  routeWatchers:()=>routeSubscriptions,hasRouteWatcher:()=>!!routeListener};
}

test('current OS recognition does not claim headset or Meta glasses microphone provenance',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(h.render().audioInputEvidence,'unverified');
 assert.equal(await h.render().start('voice-check'),true);
 assert.equal(h.render().audioInputEvidence,'unverified','a successful native start cannot identify the microphone');
 h.emit('result',{isFinal:true,results:[{transcript:'hello',confidence:1}]});
 assert.equal(h.render().audioInputEvidence,'unverified','a transcript proves no particular Bluetooth route');
 h.emit('end');
});
test('offline model missing does not trigger permissions, cloud ASR or unsolicited downloads',async()=>{
 const h=setup({installed:false});
 let view=await h.flush();view=await h.flush();
 assert.equal(view.model,'missing');
 assert.equal(await view.start('question-a'),false);
 assert.equal(h.permissions(),0);
 assert.equal(h.starts.length,0);
 assert.equal(h.downloads.length,0);
 assert.match(h.render().issue,/no instalado/);
 // Download remains opt-in and a scheduled operation does not claim installation.
 await h.render().downloadModel();
 assert.deepEqual(h.downloads,['en-CA']);
 assert.equal(h.render().model,'missing');
 h.setInstalled(true);await h.render().checkModel();
 assert.equal(h.render().model,'installed');
 assert.equal(await h.render().start('question-a'),true);
 assert.equal(h.starts.length,1);
 assert.equal(h.starts[0].requiresOnDeviceRecognition,true);
 assert.equal(h.starts[0].recordingOptions.persist,false);
 h.emit('end');
});
test('permission denial keeps turn and progress unchanged; explicit retry can recover',async()=>{
 const h=setup({allowed:false});await h.flush();await h.flush();
 assert.equal(await h.render().start('question-a'),false);
 assert.equal(h.starts.length,0);
 assert.match(h.render().issue,/Autoriza el micrófono/);
 h.setAllowed(true);
 assert.equal(await h.render().start('question-a'),true);
 assert.equal(h.final.length,0);
 h.emit('end');
});
test('native no-speech error never submits an answer; gate remains closed until native end',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question-1'),true);
 h.emit('result',{isFinal:false,results:[{transcript:'partial'}]});
 assert.deepEqual(h.partial,[{value:'partial',id:'question-1'}]);
 h.emit('error',{error:'no-speech',message:'untrusted'});
 assert.equal(h.final.length,0);
 assert.match(h.render().issue,/No se detectó una respuesta/);
 assert.equal(await h.render().start('question-2'),false,'cannot attribute a late result to next turn');
 h.emit('result',{isFinal:true,results:[{transcript:'stale answer',confidence:1}]});
 assert.deepEqual(h.final,[],'error revokes the previous turn');
 h.emit('end');
 assert.equal(await h.render().start('question-2'),true);
 h.emit('result',{isFinal:true,results:[{transcript:'Hello',confidence:0.9}]});
 assert.deepEqual(h.final,[{id:'question-2',r:{text:'Hello',confidence:'high'}}]);
 h.emit('end');
});
test('native offline-service error offers text fallback without uploading voice',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question'),true);
 h.emit('error',{error:'network',message:'send me the recording'});
 assert.match(h.render().issue,/no enviará tu voz a Internet/);
 assert.deepEqual(h.final,[]);
 h.emit('end');
});

test('native audiostart and audioend show capture versus processing; late final result is still handled',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question-1'),true);
 assert.equal(h.render().capturePhase,'requested');
 h.emit('audiostart',{timestamp:1780000000100,uri:null});
 assert.equal(h.render().capturePhase,'capturing');
 assert.equal(h.render().listening,true);
 assert.equal(h.render().audioInputEvidence,'unverified','native audiostart is not proof of glasses mic');
 h.emit('audioend',{timestamp:1780000001100,uri:null});
 assert.equal(h.render().capturePhase,'processing');
 assert.equal(h.render().listening,false);
 assert.equal(await h.render().start('question-2'),false,'audioend cannot unlock session gate');
 h.emit('result',{isFinal:true,results:[{transcript:'Hello again',confidence:0.91}]});
 assert.deepEqual(h.final,[{id:'question-1',r:{text:'Hello again',confidence:'high'}}]);
 assert.equal(h.render().capturePhase,'idle');
 assert.equal(await h.render().start('question-2'),false,'final transcript is not native end');
 h.emit('end');
 assert.equal(await h.render().start('question-2'),true);
 h.emit('end');
});
test('native nomatch ends an attempt with no score and waits for end before new input',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question'),true);
 h.emit('audiostart',{timestamp:1800});
 h.emit('nomatch');
 assert.equal(h.final.length,0);
 assert.equal(h.render().capturePhase,'idle');
 assert.match(h.render().issue,/No se reconoció una respuesta/);
 assert.equal(await h.render().start('retry'),false);
 h.emit('result',{isFinal:true,results:[{transcript:'stale',confidence:1}]});
 assert.equal(h.final.length,0);
 h.emit('end');
 assert.equal(await h.render().start('retry'),true);
 h.emit('end');
});
test('native capture restart in one turn aborts safely and requires terminal end',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question'),true);
 h.emit('audiostart',{timestamp:1000});
 h.emit('audioend',{timestamp:1200});
 h.emit('audiostart',{timestamp:1300});
 assert.equal(h.aborts(),1);
 assert.match(h.render().issue,/reinició o cambió de ruta/);
 assert.equal(h.final.length,0);
 assert.equal(await h.render().start('other'),false);
 h.emit('result',{isFinal:true,results:[{transcript:'wrong turn',confidence:1}]});
 assert.equal(h.final.length,0,'route discontinuity cannot grade a stale transcript');
 h.emit('end');
 assert.equal(await h.render().start('other'),true);
 h.emit('end');
});
test('terminal native end without an ASR result reports recovery instead of phantom success',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('question'),true);
 h.emit('end');
 assert.match(h.render().issue,/micrófono no llegó a iniciar/);
 assert.equal(h.render().capturePhase,'idle');
 assert.equal(h.final.length,0);
 assert.equal(await h.render().start('retry'),true);
 h.emit('audiostart',{timestamp:9000});
 h.emit('end');
 assert.match(h.render().issue,/terminó sin respuesta reconocida/);
 assert.equal(h.final.length,0);
});


test('iOS route change after recognized audiostart aborts a proposed answer and waits for terminal end',async()=>{
 const h=setup({routeSupport:true});await h.flush();await h.flush();
 assert.equal(await h.render().start('answer-a'),true);
 h.emit('audiostart',{timestamp:1780000100000});
 await tick();
 assert.equal(h.hasRouteWatcher(),true);
 const changed={...h.routeSnapshot(),activeInputId:'headset',observedAtEpochMs:1780000100100};
 h.emitRoute(changed);
 assert.equal(h.aborts(),1);
 assert.match(h.render().issue,/Cambió la entrada de audio/);
 assert.equal(h.hasRouteWatcher(),false,'observer removed on interruption');
 h.emit('result',{isFinal:true,results:[{transcript:'stale',confidence:1}]});
 assert.deepEqual(h.final,[]);
 assert.equal(await h.render().start('answer-b'),false,'must await native end after route change');
 h.emit('end');
 assert.equal(await h.render().start('answer-b'),true);
 h.emit('end');
});
test('Android connected input changes abort cautiously without claiming it was ASR microphone',async()=>{
 const h=setup({routeSupport:true,android:true});await h.flush();await h.flush();
 assert.equal(await h.render().start('answer'),true);
 h.emit('audiostart',{timestamp:1780000100000});
 await tick();
 assert.equal(h.hasRouteWatcher(),true);
 h.emitRoute({...h.routeSnapshot(),connectedInputs:[{id:'phone',kind:'built-in'}],observedAtEpochMs:1780000101000});
 assert.equal(h.aborts(),1);
 assert.equal(h.render().audioInputEvidence,'unverified');
 h.emit('end');
});
test('unchanged route, including output-only activity, never interrupts local ASR',async()=>{
 const h=setup({routeSupport:true});await h.flush();await h.flush();
 assert.equal(await h.render().start('answer'),true);
 h.emit('audiostart',{timestamp:1780000100000});
 await tick();
 h.emitRoute({...h.routeSnapshot(),observedAtEpochMs:1780000100200});
 assert.equal(h.aborts(),0);
 h.emit('result',{isFinal:true,results:[{transcript:'Good morning',confidence:0.94}]});
 assert.deepEqual(h.final,[{id:'answer',r:{text:'Good morning',confidence:'high'}}]);
 assert.equal(h.hasRouteWatcher(),false);
 h.emit('end');
});
test('native observer unavailable never prevents basic phone microphone learning',async()=>{
 const h=setup();await h.flush();await h.flush();
 assert.equal(await h.render().start('answer'),true);
 h.emit('audiostart',{timestamp:1780000100000});
 await tick();
 assert.equal(h.hasRouteWatcher(),false);
 assert.equal(h.render().audioInputEvidence,'unverified');
 h.emit('result',{isFinal:true,results:[{transcript:'Hello',confidence:0.8}]});
 assert.equal(h.final.length,1);
 h.emit('end');
});

test('route change delivered synchronously while subscribing leaves no orphaned listener',async()=>{
 for(const android of [false,true]){
  const h=setup({routeSupport:true,immediateRouteChange:true,android});
  await h.flush();await h.flush();
  assert.equal(await h.render().start('answer-a'),true);
  h.emit('audiostart',{timestamp:1780000100000});
  await tick();
  assert.equal(h.aborts(),1,'interrupting notification must abort native recognition');
  assert.equal(h.hasRouteWatcher(),false,'synchronous listener must be unsubscribed');
  assert.deepEqual(h.final,[],'no interrupted answer can be scored');
  assert.equal(await h.render().start('answer-b'),false,'wait for native terminal end');
  h.emit('end');
  assert.equal(await h.render().start('answer-b'),true);
  h.emit('end');
 }
});
