import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {
 expandedA1GreetingPilots,expandedA1SituationalPilots,
 a1SixTurnAudioFormat,cueFingerprint,sha256Bytes,
 auditA1SixTurnAudio
} from '../dist/index.js';
import * as core from '../dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const scene=scenes[0];
const sourceText=readFileSync('mobile/install-a1-editorial-audio.ts','utf8');
const output=ts.transpileModule(sourceText,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;

function pcmWav(frequency=360){
 const sampleRate=16000,frames=sampleRate/4;
 const bytes=new Uint8Array(44+frames*2),view=new DataView(bytes.buffer);
 for(const [at,word] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])
  for(let i=0;i<4;i++)bytes[at+i]=word.charCodeAt(i);
 view.setUint32(4,bytes.length-8,true);view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 view.setUint32(40,frames*2,true);
 for(let i=0;i<frames;i++)view.setInt16(44+2*i,Math.round(
  1300*Math.sin(2*Math.PI*frequency*i/sampleRate)),true);
 return bytes;
}
const manifest=(scene,clips)=>({
 format:a1SixTurnAudioFormat,sceneId:scene.sceneId,status:'editorial-candidate',
 clips:scene.turns.map((t,i)=>({
  audioId:t.audioId,sourceFingerprint:cueFingerprint(t.text),
  bytes:clips[i].length,durationMs:250,sha256:sha256Bytes(clips[i]),
  accentTag:scene.targetLanguage,rightsReference:'original-human-review-pending',
  sourceReference:'internal-a1-review-pilot'
 }))
});
function fakeRuntime(development=true){
 const directories=new Set(['documents','picked']);
 const files=new Map();
 const pathOf=(...parts)=>parts.map(x=>
  typeof x==='string'?x:x.uri).join('/');
 let tamperCopy=false,pickerCalls=0,selected='picked',cancel=false;
 const ensure=(uri)=>{if(!directories.has(uri))throw Error('Missing parent directory '+uri);};
 class Directory{
  constructor(...parts){this.uri=pathOf(...parts);this.name=this.uri.split('/').at(-1);}
  get exists(){return directories.has(this.uri);}
  create({intermediates=false,idempotent=false}={}){
   if(this.exists){if(!idempotent)throw Error('Existing directory');return;}
   const segments=this.uri.split('/');
   let path='';
   for(let i=0;i<segments.length;i++){
    path+=(i?'/':'')+segments[i];
    if(i===segments.length-1)directories.add(path);
    else if(!directories.has(path)){
     if(!intermediates)throw Error('Missing parent');
     directories.add(path);
    }
   }
  }
  list(){
   ensure(this.uri);
   const prefix=this.uri+'/';
   const result=[];
   for(const key of [...directories,...files.keys()]){
    if(!key.startsWith(prefix))continue;
    const rest=key.slice(prefix.length);
    if(rest&&!rest.includes('/'))result.push({name:rest});
   }
   return result;
  }
  async move(destination,{overwrite=false}={}){
   if(destination.exists&&!overwrite)throw Error('Refuse overwrite');
   const current=this.uri,next=destination.uri;
   const sourceFiles=[...files].filter(([name])=>name.startsWith(current+'/'));
   const sourceDirs=[...directories].filter(name=>name===current||name.startsWith(current+'/'));
   for(const [name] of sourceFiles)files.delete(name);
   for(const name of sourceDirs)directories.delete(name);
   for(const name of sourceDirs)directories.add(next+name.slice(current.length));
   for(const [name,bytes] of sourceFiles)files.set(next+name.slice(current.length),bytes);
   this.uri=next;
  }
  delete(){
   const here=this.uri;
   for(const key of [...files.keys()])if(key.startsWith(here+'/'))files.delete(key);
   for(const key of [...directories])if(key===here||key.startsWith(here+'/'))directories.delete(key);
  }
  static async pickDirectoryAsync(){
   pickerCalls++;
   if(cancel)throw Error('User cancelled');
   return new Directory(selected);
  }
 }
 class File{
  constructor(...parts){this.uri=pathOf(...parts);this.name=this.uri.split('/').at(-1);}
  get exists(){return files.has(this.uri);}
  get size(){return files.get(this.uri)?.length??0;}
  async text(){
   const bytes=files.get(this.uri);if(!bytes)throw Error('Missing file');
   return new TextDecoder().decode(bytes);
  }
  async bytes(){
   const bytes=files.get(this.uri);if(!bytes)throw Error('Missing file');
   return new Uint8Array(bytes);
  }
  async copy(target,{overwrite=false}={}){
   const bytes=files.get(this.uri);
   if(!bytes)throw Error('Missing source');
   if(files.has(target.uri)&&!overwrite)throw Error('Refuse overwrite');
   ensure(target.uri.slice(0,target.uri.lastIndexOf('/')));
   const copy=new Uint8Array(bytes);
   if(tamperCopy&&target.uri.endsWith('turn-3.wav'))copy[170]^=1;
   files.set(target.uri,copy);
  }
 }
 const module={exports:{}};
 const localRequire=(id)=>{
  if(id==='expo-file-system')return {Directory,File,Paths:{document:{uri:'documents'}}};
  if(id==='@voicefirst/core')return core;
  throw Error('Unexpected native module '+id);
 };
 new Function('require','module','exports','__DEV__',output)(
  localRequire,module,module.exports,development);
 const dest=s=>'documents/voicefirst-a1-review/'+s.targetLanguage+'/a1/'+s.unitId;
 const makeSource=(s=scene)=>{
  const root='picked';
  const wav=s.turns.map((_,i)=>pcmWav(310+30*i));
  files.set(root+'/manifest.json',new TextEncoder().encode(JSON.stringify(manifest(s,wav))));
  for(let i=0;i<6;i++)files.set(root+'/'+s.turns[i].id+'.wav',wav[i]);
  return wav;
 };
 const countInstalled=()=>[...files.keys()].filter(x=>x.startsWith('documents/voicefirst-a1-review/'));
 return {api:module.exports,files,directories,dest,makeSource,countInstalled,
  async select(){return module.exports.selectAndInstallA1EditorialAudio(scene.sceneId);},
  corruptCopy(){tamperCopy=true;},cancelPicker(){cancel=true;},
  get pickerCalls(){return pickerCalls;}
 };
}
test('manual private A1 import installs six truly verified WAV bytes, never grants rights or public course access',async()=>{
 const fx=fakeRuntime(),wav=fx.makeSource();
 const result=await fx.select();
 assert.deepEqual(result,{kind:'installed',sceneId:scene.sceneId,verified:6,
  publicAvailable:false,rightsCleared:false});
 assert.equal(fx.pickerCalls,1);
 assert.equal(fx.countInstalled().length,7);
 assert.equal(fx.files.has(fx.dest(scene)+'/manifest.json'),true);
 for(let i=0;i<6;i++)assert.deepEqual(
  fx.files.get(fx.dest(scene)+'/'+scene.turns[i].id+'.wav'),wav[i]);
 const value=JSON.parse(new TextDecoder().decode(fx.files.get(fx.dest(scene)+'/manifest.json')));
 const audit=await auditA1SixTurnAudio(scene.sceneId,value,{
  async checkOwnedClip(id,duration){
   const turn=scene.turns.find(t=>t.audioId===id);
   const bytes=fx.files.get(fx.dest(scene)+'/'+turn.id+'.wav');
   return{bytes:bytes.length,sha256:sha256Bytes(bytes),validPcmWav:duration===250};
  }
 });
 assert.equal(audit.readyForEditorialPlayback,true);
 assert.equal(audit.rightsCleared,false);
 assert.equal(audit.publicAvailable,false);
 const repeated=await fx.select();
 assert.equal(repeated.kind,'rejected');
 assert.match(repeated.reason,/No se sobrescribirá/);
 assert.equal(fx.countInstalled().length,7);
});
test('modified or missing sibling WAV, forged scene, extra files never create an installed package',async()=>{
 for(const modify of [
  f=>{f.files.get('picked/turn-2.wav')[160]^=1;},
  f=>f.files.delete('picked/turn-4.wav'),
  f=>f.files.set('picked/turn-7.wav',pcmWav()),
  f=>{const raw=JSON.parse(new TextDecoder().decode(f.files.get('picked/manifest.json')));
   raw.sceneId='es/A1/forged';f.files.set('picked/manifest.json',new TextEncoder().encode(JSON.stringify(raw)));},
  f=>{const raw=JSON.parse(new TextDecoder().decode(f.files.get('picked/manifest.json')));
   raw.publicAvailable=true;f.files.set('picked/manifest.json',new TextEncoder().encode(JSON.stringify(raw)));},
 ]){
  const fx=fakeRuntime();fx.makeSource();modify(fx);
  const result=await fx.select();
  assert.equal(result.kind,'rejected');
  assert.equal(fx.countInstalled().length,0);
 }
});
test('a changed WAV during staging fails second audit, cleans only new staging and preserves originals',async()=>{
 const fx=fakeRuntime();fx.makeSource();fx.corruptCopy();
 const original=fx.files.get('picked/turn-3.wav').slice();
 const result=await fx.select();
 assert.equal(result.kind,'rejected');
 assert.equal(fx.countInstalled().length,0);
 assert.equal(fx.directories.has(fx.dest(scene)),false);
 assert.equal(fx.directories.has('documents/voicefirst-a1-review/'+scene.targetLanguage+'/a1/.incoming-'+scene.unitId),false);
 assert.deepEqual(fx.files.get('picked/turn-3.wav'),original);
});
test('previous incomplete staging is never overwritten or deleted by another import',async()=>{
 const fx=fakeRuntime();fx.makeSource();
 const staging='documents/voicefirst-a1-review/'+scene.targetLanguage+'/a1/.incoming-'+scene.unitId;
 fx.directories.add('documents/voicefirst-a1-review');
 fx.directories.add('documents/voicefirst-a1-review/'+scene.targetLanguage);
 fx.directories.add('documents/voicefirst-a1-review/'+scene.targetLanguage+'/a1');
 fx.directories.add(staging);
 fx.files.set(staging+'/preserve.txt',new TextEncoder().encode('do not touch'));
 const result=await fx.select();
 assert.equal(result.kind,'rejected');
 assert.equal(fx.files.has(staging+'/preserve.txt'),true);
 assert.equal(fx.directories.has(staging),true);
});
test('folder picker cancel returns cancelled and does not create app files',async()=>{
 const fx=fakeRuntime();fx.makeSource();fx.cancelPicker();
 assert.deepEqual(await fx.select(),{kind:'cancelled'});
 assert.equal(fx.countInstalled().length,0);
});
test('release code cannot start import or open picker, even with valid authored scene',async()=>{
 const fx=fakeRuntime(false);fx.makeSource();
 assert.equal((await fx.select()).kind,'rejected');
 assert.equal(fx.pickerCalls,0);
 assert.equal(fx.countInstalled().length,0);
});
test('the private import remains in DEV-only A1 UI and public pack code never points to its directory',()=>{
 const screen=readFileSync('mobile/A1EditorialPractice.tsx','utf8');
 const app=readFileSync('mobile/App.tsx','utf8');
 const importCode=readFileSync('mobile/install-a1-editorial-audio.ts','utf8');
 assert.match(screen,/selectAndInstallA1EditorialAudio\(sceneId\)/);
 assert.match(screen,/importLock\.current/);
 assert.match(app,/\{__DEV__ && <View style=\{styles\.mission\}>/);
 assert.match(importCode,/if\(!__DEV__\)return/);
 assert.match(importCode,/auditA1SixTurnAudio/);
 assert.match(importCode,/verifyFolder\(staging,scene\)/);
 assert.match(importCode,/overwrite:false/);
 assert.doesNotMatch(importCode,/https?:\/\//);
 assert.doesNotMatch(importCode,/fetch\(/);
 assert.doesNotMatch(importCode,/voicefirst-voices/);
});
