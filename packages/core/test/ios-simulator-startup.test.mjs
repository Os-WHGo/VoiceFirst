import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkIOSStartup,selectSimulator,simulatorCommand} from '../../../scripts/check-ios-simulator-startup.mjs';
import {requiresNativeCompile} from '../../../scripts/native-ci-change-gate.mjs';
const runtime='com.apple.CoreSimulator.SimRuntime.iOS-26-6';
const type='com.apple.CoreSimulator.SimDeviceType.iPhone-17';
const uuid='ABCDEF01-2345-6789-ABCD-EF0123456789';
const runtimes={runtimes:[{identifier:runtime,version:'26.6',isAvailable:true,
 supportedDeviceTypes:[{identifier:type}]}]};
const types={devicetypes:[{identifier:type}]};
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'voicefirst-startup-test-'));
 const appPath=join(dir,'VoiceFirst.app');mkdirSync(appPath);writeFileSync(join(appPath,'Info.plist'),'fixture');
 return {dir,appPath,outputDir:join(dir,'evidence')};
}
function fakeRun(f,{failAt=null,deadAfterRender=false,wrongIdentity=false,bootstatusFailsOnce=false}={}){
 const calls=[];let rendered=false,bootChecks=0;
 const run=(binary,args)=>{
  calls.push([binary,...args]);
  if(binary==='plutil')return JSON.stringify({CFBundleIdentifier:wrongIdentity?'other.app':'com.oswhgo.voicefirst',CFBundleExecutable:'VoiceFirst'});
  if(binary==='ps'){
   if(deadAfterRender&&rendered)throw Error('process exited');
   return '/simulator/Applications/VoiceFirst.app/VoiceFirst';
  }
  if(args[0]==='swift'){
   if(failAt==='render')throw Error('OCR labels missing');
   rendered=true;return 'verified';
  }
  if(args[1]==='list')return JSON.stringify(args[2]==='runtimes'?runtimes:types);
  if(args[1]==='bootstatus'&&++bootChecks===1&&bootstatusFailsOnce)throw Error('runner not ready');
  if(args[1]===failAt)throw Error('native command failed');
  if(args[1]==='create')return uuid;
  if(args[1]==='launch')return 'com.oswhgo.voicefirst: 1234';
  return '';
 };
 return {run,calls};
}
test('only an explicitly supported available iPhone/iOS pair is selected',()=>{
 assert.deepEqual(selectSimulator(runtimes,types),{runtime,deviceType:type});
 const large=type+'-Pro-Max';
 assert.equal(selectSimulator({runtimes:[{...runtimes.runtimes[0],
  supportedDeviceTypes:[{identifier:type},{identifier:large}]}]},
  {devicetypes:[{identifier:type},{identifier:large}]}).deviceType,large);
 assert.throws(()=>selectSimulator({runtimes:[]},types),/No supported/);
 assert.throws(()=>selectSimulator({runtimes:[{...runtimes.runtimes[0],isAvailable:false}]},types),/No supported/);
 assert.throws(()=>selectSimulator(runtimes,{devicetypes:[]}),/No supported/);
});
test('startup success requires actual screen verification and same process still alive afterwards',async()=>{
 const f=fixture();try{
  const fake=fakeRun(f),delays=[];
  const report=await checkIOSStartup(f,{run:fake.run,delay:async ms=>delays.push(ms)});
  assert.equal(report.passed,true);assert.equal(report.renderedStartup,true);assert.equal(report.cleanedUp,true);
  assert.deepEqual(delays,[15000]);
  assert.equal(fake.calls.filter(c=>c[0]==='ps').length,2);
  assert.equal(fake.calls.filter(c=>c[1]==='swift').length,1);
  assert.ok(fake.calls.some(c=>c.includes('screenshot')));
  assert.deepEqual(fake.calls.at(-1),['xcrun','simctl','delete',uuid]);
  assert.ok(!fake.calls.some(c=>c.includes('grant')||c.includes('tap')),'no permissions/UI interaction');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('transient simulator bootstatus uses one bounded retry before checking real app UI',async()=>{
 const f=fixture();try{
  const fake=fakeRun(f,{bootstatusFailsOnce:true}),delays=[];
  const report=await checkIOSStartup(f,{run:fake.run,delay:async ms=>delays.push(ms)});
  assert.equal(report.passed,true);
  assert.equal(report.bootAttempts,2);
  assert.deepEqual(delays,[5000,15000]);
  assert.equal(fake.calls.filter(c=>c[1]==='simctl'&&c[2]==='bootstatus').length,2);
  assert.ok(fake.calls.some(c=>c.includes('screenshot')));
  assert.deepEqual(fake.calls.at(-1),['xcrun','simctl','delete',uuid]);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('boot, install, launch and render failures delete only the disposable Simulator and retain failure evidence',async()=>{
 for(const failAt of ['boot','bootstatus','install','launch','render']){
  const f=fixture();try{
   const fake=fakeRun(f,{failAt});
   await assert.rejects(checkIOSStartup(f,{run:fake.run,delay:async()=>{}}),/startup failed/);
   const report=JSON.parse(readFileSync(join(f.outputDir,'startup-report.json'),'utf8'));
   assert.equal(report.passed,false);assert.equal(report.cleanedUp,true);
   assert.deepEqual(fake.calls.at(-1),['xcrun','simctl','delete',uuid]);
  }finally{rmSync(f.dir,{recursive:true,force:true});}
 }
});
test('app dying during OCR or wrong bundle identity cannot produce startup approval',async()=>{
 for(const options of [{deadAfterRender:true},{wrongIdentity:true}]){
  const f=fixture();try{
   const fake=fakeRun(f,options);
   await assert.rejects(checkIOSStartup(f,{run:fake.run,delay:async()=>{}}),/startup failed/);
   assert.equal(JSON.parse(readFileSync(join(f.outputDir,'startup-report.json'),'utf8')).passed,false);
   if(options.wrongIdentity)assert.equal(fake.calls.length,1);
  }finally{rmSync(f.dir,{recursive:true,force:true});}
 }
});
test('cleanup failure cannot leave a successful startup report',async()=>{
 const f=fixture();try{
  const fake=fakeRun(f,{failAt:'delete'});
  await assert.rejects(checkIOSStartup(f,{run:fake.run,delay:async()=>{}}),/startup failed/);
  const report=JSON.parse(readFileSync(join(f.outputDir,'startup-report.json'),'utf8'));
  assert.equal(report.passed,false);assert.equal(report.cleanedUp,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('both real startup verifier files request native validation',()=>{
 assert.equal(requiresNativeCompile(['scripts/check-ios-simulator-startup.mjs']),true);
 assert.equal(requiresNativeCompile(['scripts/check-ios-startup-screen.swift']),true);
});

test('a CLI ignoring SIGTERM cannot defeat the command timeout',()=>{
 const started=performance.now();
 assert.throws(()=>simulatorCommand(process.execPath,['-e',
  "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],300),/Simulator command failed/);
 assert.ok(performance.now()-started<5000,'direct child timeout must remain bounded');
});
