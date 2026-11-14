import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,unlinkSync,symlinkSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 expandedA1GreetingPilots,inspectA1SixTurnAudioManifest
} from '../dist/index.js';

const script=fileURLToPath(new URL('../../../scripts/a1-original-review-pack.mjs',import.meta.url));
const scene=expandedA1GreetingPilots[0];
const folder=scene.targetLanguage+'/a1/'+scene.unitId;
const target=dir=>join(dir,'build/a1-review-packages/voicefirst-a1-review',folder);
function sample(frequency=320){
 const rate=16000,frames=rate/4,b=new Uint8Array(44+frames*2),view=new DataView(b.buffer);
 for(const [at,word] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])
  for(let i=0;i<4;i++)b[at+i]=word.charCodeAt(i);
 view.setUint32(4,b.length-8,true);view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);
 view.setUint32(40,frames*2,true);
 for(let i=0;i<frames;i++)
  view.setInt16(44+i*2,Math.round(1550*Math.sin(2*Math.PI*frequency*i/rate)),true);
 return b;
}
function fixture(){
 const work=mkdtempSync(join(tmpdir(),'voicefirst-a1-authoring-'));
 const src=join(work,'source');
 mkdirSync(src);
 for(let i=1;i<=6;i++)writeFileSync(join(src,'turn-'+i+'.wav'),sample(300+i*20));
 writeFileSync(join(src,'rights.json'),JSON.stringify({
  accentTag:scene.targetLanguage,rightsReference:'editorial-review-pending',
  sourceReference:'test-original-local-pilot'
 }));
 return{work,src,dest:target(work),dispose(){rmSync(work,{recursive:true,force:true});}};
}
function run(work,...args){
 return spawnSync(process.execPath,[script,...args],{cwd:work,encoding:'utf8',timeout:15000});
}
test('plan writes the exact six source texts and empty rights notes, never recordings',()=>{
 const f=fixture();try{
  const result=run(f.work,'plan',scene.sceneId);
  assert.equal(result.status,0,result.stderr);
  const dir=join(f.work,'build/a1-recording-briefs',folder);
  const brief=JSON.parse(readFileSync(join(dir,'script.json'),'utf8'));
  assert.equal(brief.status,'not-recorded');
  assert.equal(brief.canPublish,false);
  assert.equal(brief.turns.length,6);
  assert.deepEqual(brief.turns.map(t=>t.text),scene.turns.map(t=>t.text));
  const rights=JSON.parse(readFileSync(join(dir,'rights.example.json'),'utf8'));
  assert.equal(rights.rightsReference,'');
  assert.equal(readdirSync(dir).some(n=>n.endsWith('.wav')),false);
  assert.notEqual(run(f.work,'plan',scene.sceneId).status,0,'never replace authoring brief');
 }finally{f.dispose();}
});
test('build validates exactly six real WAV and creates a private manifest, not a learner package',()=>{
 const f=fixture();try{
  const built=run(f.work,'build',scene.sceneId,f.src);
  assert.equal(built.status,0,built.stderr);
  const mf=JSON.parse(readFileSync(join(f.dest,'manifest.json'),'utf8'));
  assert.equal(inspectA1SixTurnAudioManifest(scene.sceneId,mf).kind,'candidate');
  assert.equal(mf.status,'editorial-candidate');
  assert.equal(mf.clips.length,6);
  assert.equal(mf.clips[0].sourceFingerprint.length,8);
  assert.equal(mf.clips[0].durationMs,250);
  assert.equal(mf.clips[0].sha256.length,64);
  assert.equal(JSON.parse(built.stdout).rightsCleared,false);
  assert.equal(JSON.parse(built.stdout).publicAvailable,false);
  assert.equal(JSON.parse(built.stdout).verified,6);
  assert.deepEqual(readdirSync(f.dest).sort(),
   ['manifest.json',...scene.turns.map(t=>t.id+'.wav')].sort());
  const checked=run(f.work,'verify',scene.sceneId);
  assert.equal(checked.status,0,checked.stderr);
  assert.equal(JSON.parse(checked.stdout).verified,6);
  const rereun=run(f.work,'build',scene.sceneId,f.src);
  assert.notEqual(rereun.status,0,'build must not overwrite a candidate');
 }finally{f.dispose();}
});
test('missing, corrupt, muted or extra clips never publish a partial package',()=>{
 for(const mutate of [
  f=>unlinkSync(join(f.src,'turn-6.wav')),
  f=>writeFileSync(join(f.src,'turn-3.wav'),new Uint8Array(400)),
  f=>{const wav=sample();wav.fill(0,44);writeFileSync(join(f.src,'turn-2.wav'),wav);},
  f=>writeFileSync(join(f.src,'turn-7.wav'),sample()),
 ]){
  const f=fixture();try{
   mutate(f);
   const result=run(f.work,'build',scene.sceneId,f.src);
   assert.notEqual(result.status,0,'invalid source rejected');
   assert.equal(existsSync(f.dest),false,'no partial final directory');
  }finally{f.dispose();}
 }
});
test('forged rights clearance, wrong accent and symlink WAV all fail before packaging',()=>{
 for(const mutate of [
  f=>writeFileSync(join(f.src,'rights.json'),JSON.stringify({
   accentTag:scene.targetLanguage,rightsReference:'review-pending',
   sourceReference:'test-original',publicAvailable:true
  })),
  f=>writeFileSync(join(f.src,'rights.json'),JSON.stringify({
   accentTag:'de',rightsReference:'review-pending',sourceReference:'test-original'
  })),
  f=>{unlinkSync(join(f.src,'turn-2.wav'));symlinkSync(join(f.src,'turn-1.wav'),join(f.src,'turn-2.wav'));}
 ]){
  const f=fixture();try{
   mutate(f);
   assert.notEqual(run(f.work,'build',scene.sceneId,f.src).status,0);
   assert.equal(existsSync(f.dest),false);
  }finally{f.dispose();}
 }
});
test('verification refuses changed bytes without deleting prior work',()=>{
 const f=fixture();try{
  assert.equal(run(f.work,'build',scene.sceneId,f.src).status,0);
  const file=join(f.dest,'turn-3.wav');
  const changed=readFileSync(file);
  changed[130]^=1;
  writeFileSync(file,changed);
  const status=run(f.work,'verify',scene.sceneId);
  assert.notEqual(status.status,0);
  assert.equal(existsSync(join(f.dest,'manifest.json')),true,
   'failed QA must preserve the existing private package for investigation');
 }finally{f.dispose();}
});
test('unknown scenes fail with no filesystem effects',()=>{
 const f=fixture();try{
  assert.notEqual(run(f.work,'plan','es/A1/not-a-scene').status,0);
  assert.notEqual(run(f.work,'build','../../private',f.src).status,0);
  assert.equal(existsSync(f.dest),false);
 }finally{f.dispose();}
});
