#!/usr/bin/env node
/** Launch only the already-built Simulator .app on a fresh disposable iPhone.
 * No phone IPA, permission grant, UI tap, microphone or app test hook is used.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const bundleId='com.oswhgo.voicefirst';
export function selectSimulator(runtimes,deviceTypes){
 const available=runtimes?.runtimes?.filter(r=>r.isAvailable===true&&
  /^com\.apple\.CoreSimulator\.SimRuntime\.iOS-/.test(r.identifier)&&
  /^\d+(?:\.\d+)*$/.test(r.version)&&Number(r.version.split('.')[0])>=26)
  .sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
 for(const runtime of available??[]){
  const supported=runtime.supportedDeviceTypes?.map(t=>t.identifier);
  const screenRank=id=>id.includes('-Pro-Max')?2:id.includes('-Plus')?1:0;
  const type=deviceTypes?.devicetypes?.filter(t=>
   /\.iPhone-/.test(t.identifier)&&supported?.includes(t.identifier))
   .sort((a,b)=>screenRank(b.identifier)-screenRank(a.identifier)||
    b.identifier.localeCompare(a.identifier,undefined,{numeric:true}))[0];
  if(type)return {runtime:runtime.identifier,deviceType:type.identifier};
 }
 throw Error('No supported available iOS 26+ iPhone Simulator');
}
export function simulatorCommand(binary,args,timeoutMs=
 binary==='xcrun'&&args[0]==='simctl'&&['shutdown','delete'].includes(args[1])?30000:180000){
 const result=spawnSync(binary,args,{encoding:'utf8',timeout:timeoutMs,killSignal:'SIGKILL',maxBuffer:4*1024*1024});
 if(result.error||result.signal||result.status!==0)throw Error('Simulator command failed');
 return result.stdout.trim();
}
export async function checkIOSStartup({appPath,outputDir,codeSha=null},
 {run=simulatorCommand,delay=ms=>new Promise(done=>setTimeout(done,ms))}={}){
 appPath=resolve(appPath);outputDir=resolve(outputDir);
 if(!appPath.endsWith('.app')||!existsSync(join(appPath,'Info.plist')))
  throw Error('Expected an already-built iOS Simulator app');
 mkdirSync(outputDir,{recursive:true});
 const report={codeSha:/^[a-f0-9]{40}$/.test(codeSha??'')?codeSha:null,
  stage:'metadata',bootAttempts:0,passed:false,processAlive:false,renderedStartup:false,cleanedUp:false,
  interpretation:'Fresh iOS Simulator startup only; not physical iPhone, audio, offline-course or security approval.'};
 const persist=()=>writeFileSync(join(outputDir,'startup-report.json'),JSON.stringify(report,null,2)+'\n');
 const stage=name=>{report.stage=name;persist();console.log('iOS startup stage: '+name);};
 let device=null,primaryError=null;
 try{
  stage('metadata');
  const plist=JSON.parse(run('plutil',['-convert','json','-o','-',join(appPath,'Info.plist')]));
  if(plist.CFBundleIdentifier!==bundleId||
   typeof plist.CFBundleExecutable!=='string'||!plist.CFBundleExecutable||basename(plist.CFBundleExecutable)!==plist.CFBundleExecutable||/[\x00-\x1f]/.test(plist.CFBundleExecutable))
   throw Error('Unexpected simulator app identity');
  stage('runtime');
  const target=selectSimulator(
   JSON.parse(run('xcrun',['simctl','list','runtimes','--json'])),
   JSON.parse(run('xcrun',['simctl','list','devicetypes','--json'])));
  report.runtime=target.runtime;report.deviceType=target.deviceType;
  stage('create');
  device=run('xcrun',['simctl','create','VoiceFirstStartup-'+Date.now(),target.deviceType,target.runtime]);
  if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(device)){
   device=null;throw Error('Simulator create did not return a device identifier');
  }
  stage('boot');
  run('xcrun',['simctl','boot',device]);
  stage('bootstatus');
  // Hosted macOS runners can finish 'simctl boot' before CoreSimulator is
  // ready. Retry ONCE, bounded, and keep a hard failure if readiness never
  // succeeds. Never infer app startup from a simulator's booted state.
  let bootFailure=null;
  for(let attempt=1;attempt<=2;attempt++){
   report.bootAttempts=attempt;
   persist();
   try{
    run('xcrun',['simctl','bootstatus',device,'-b'],attempt===1?180000:120000);
    bootFailure=null;
    break;
   }catch(error){
    bootFailure=error;
    if(attempt===1){
     console.log('iOS simulator bootstatus not ready; bounded second attempt');
     await delay(5000);
    }
   }
  }
  if(bootFailure)throw Error('Simulator did not become boot-ready',{cause:bootFailure});
  stage('install');run('xcrun',['simctl','install',device,appPath]);
  stage('launch');
  const launched=run('xcrun',['simctl','launch','--terminate-running-process',device,bundleId]);
  const match=launched.match(/^com\.oswhgo\.voicefirst:\s*([1-9]\d*)\s*$/);
  if(!match)throw Error('Simulator launch did not return an application PID');
  const assertAlive=()=>{
   report.processAlive=false;
   const process=run('ps',['-ww','-p',match[1],'-o','comm=']);
   if(!process.endsWith('/'+basename(appPath)+'/'+plist.CFBundleExecutable))
    throw Error('Launched simulator application is no longer alive');
   report.processAlive=true;
  };
  stage('settle');await delay(15000);assertAlive();report.processAlive=true;
  stage('screenshot');const screenshot=join(outputDir,'startup.png');
  run('xcrun',['simctl','io',device,'screenshot',screenshot]);
  stage('render');
  run('xcrun',['swift',fileURLToPath(new URL('./check-ios-startup-screen.swift',import.meta.url)),screenshot]);
  stage('post-render-liveness');assertAlive();report.renderedStartup=true;
  stage('complete');report.passed=true;
 }catch(error){primaryError=error;}
 finally{
  if(device){
   console.log('iOS startup cleanup: shutdown');
   try{run('xcrun',['simctl','shutdown',device]);}catch{/* Delete still required if boot failed. */}
   console.log('iOS startup cleanup: delete');
   try{run('xcrun',['simctl','delete',device]);report.cleanedUp=true;}
   catch{if(!primaryError)primaryError=Error('Could not delete disposable Simulator');report.passed=false;}
  }
  persist();
  console.log('iOS startup result: passed='+report.passed+' stage='+report.stage+' cleanedUp='+report.cleanedUp);
 }
 if(primaryError)throw Error('iOS Simulator startup failed at '+report.stage,{cause:primaryError});
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.platform!=='darwin')throw Error('Requires macOS and Xcode; Linux tests do not prove simulator startup');
 if(process.argv.length!==4)throw Error('Usage: node check-ios-simulator-startup.mjs <app> <output-directory>');
 try{console.log(JSON.stringify(await checkIOSStartup({appPath:process.argv[2],outputDir:process.argv[3],
  codeSha:process.env.VOICEFIRST_CODE_SHA}),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
