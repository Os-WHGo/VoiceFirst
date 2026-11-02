import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as core from '../dist/index.js';

function adapter(native){
 const src=readFileSync(new URL('../../../mobile/native-input-route.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const imports={expo:{requireOptionalNativeModule:()=>native},'@voicefirst/core':core};
 new Function('require','module','exports',js)(name=>{
  assert.ok(name in imports,'unknown native adapter import '+name);
  return imports[name];
 },module,module.exports);
 return module.exports;
}
const route=()=>({platform:'ios',scope:'app-audio-session',activeInputId:'phone',
 connectedInputs:[{id:'phone',kind:'built-in'}],observedAtEpochMs:1780000100000});
test('optional native route module preserves phone learning when missing',async()=>{
 const a=adapter(null);
 assert.equal(await a.readNativeInputSnapshot(),null);
 let called=false;
 const remove=a.observeNativeInputChanges(()=>{called=true;});
 remove();
 assert.equal(called,false);
});
test('route bridge validates native snapshots and tears down listeners safely',async()=>{
 const events=[],native={
  getInputSnapshotAsync:async()=>route(),
  addListener(name,handler){events.push({name,handler});return {remove(){events[0].removed=true;}};}
 };
 const a=adapter(native),observation=await a.readNativeInputSnapshot();
 assert.equal(observation.activeInputId,'phone');
 const received=[];
 const remove=a.observeNativeInputChanges(snapshot=>received.push(snapshot));
 assert.equal(events[0].name,'onInputRouteChanged');
 events[0].handler({...route(),activeInputId:'invalid'});
 assert.equal(received[0],null,'invalid native data cannot become a trusted input');
 events[0].handler({...route(),observedAtEpochMs:1780000100100});
 assert.equal(received[1].activeInputId,'phone');
 remove();
 assert.equal(events[0].removed,true);
});
test('native route throwing exceptions remains optional and never creates a microphone identity',async()=>{
 const a=adapter({getInputSnapshotAsync:async()=>{throw Error('platform unavailable');},
  addListener(){throw Error('not installed');}});
 assert.equal(await a.readNativeInputSnapshot(),null);
 assert.doesNotThrow(()=>a.observeNativeInputChanges(()=>{})());
});
