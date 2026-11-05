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
function command(binary,args){
 const result=spawnSync(binary,args,{encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
 if(result.error||result.signal||result.status!==0)throw Error('Simulator command failed');
 return result.stdout.trim();
}
export async function checkIOSStartup({appPath,outputDir,codeSha=null},
 {run=command,delay=ms=>new Promise(done=>setTimeout(done,ms))}={}){
 appPath=resolve(appPath);outputDir=resolve(outputDir);
 if(!appPath.endsWith('.app')||!existsSync(join(appPath,'Info.plist')))
  throw Error('Expected an already-built iOS Simulator app');
 mkdirSync(outputDir,{recursive:true});
 const report={codeSha:/^[a-f0-9]{40}$/.test(codeSha??'')?codeSha:null,
  stage:'metadata',passed:false,processAlive:false,renderedStartup:false,cleanedUp:false,
  interpretation:'Fresh iOS Simulator startup only; not physical iPhone, audio, offline-course or security approval.'};
 let device=null,primaryError=null;
 try{
  const plist=JSON.parse(run('plutil',['-convert','json','-o','-',join(appPath,'Info.plist')]));
  if(plist.CFBundleIdentifier!==bundleId||
   typeof plist.CFBundleExecutable!=='string'||!plist.CFBundleExecutable||basename(plist.CFBundleExecutable)!==plist.CFBundleExecutable||/[\x00-\x1f]/.test(plist.CFBundleExecutable))
   throw Error('Unexpected simulator app identity');
  const target=selectSimulator(
   JSON.parse(run('xcrun',['simctl','list','runtimes','--json'])),
   JSON.parse(run('xcrun',['simctl','list','devicetypes','--json'])));
  report.runtime=target.runtime;report.deviceType=target.deviceType;
  report.stage='create';
  device=run('xcrun',['simctl','create','VoiceFirstStartup-'+Date.now(),target.deviceType,target.runtime]);
  if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(device)){
   device=null;throw Error('Simulator create did not return a device identifier');
  }
  report.stage='boot';
  run('xcrun',['simctl','boot',device]);
  run('xcrun',['simctl','bootstatus',device,'-b']);
  report.stage='install';run('xcrun',['simctl','install',device,appPath]);
  report.stage='launch';
  const launched=run('xcrun',['simctl','launch','--terminate-running-process',device,bundleId]);
  const match=launched.match(/^com\.oswhgo\.voicefirst:\s*([1-9]\d*)\s*$/);
  if(!match)throw Error('Simulator launch did not return an application PID');
  const assertAlive=()=>{
   const process=run('ps',['-ww','-p',match[1],'-o','comm=']);
   if(!process.endsWith('/'+basename(appPath)+'/'+plist.CFBundleExecutable))
    throw Error('Launched simulator application is no longer alive');
  };
  report.stage='settle';await delay(15000);assertAlive();report.processAlive=true;
  report.stage='screenshot';const screenshot=join(outputDir,'startup.png');
  run('xcrun',['simctl','io',device,'screenshot',screenshot]);
  report.stage='render';
  run('xcrun',['swift',fileURLToPath(new URL('./check-ios-startup-screen.swift',import.meta.url)),screenshot]);
  report.stage='post-render-liveness';assertAlive();report.renderedStartup=true;
  report.stage='complete';report.passed=true;
 }catch(error){primaryError=error;}
 finally{
  if(device){
   try{run('xcrun',['simctl','shutdown',device]);}catch{/* Delete still required if boot failed. */}
   try{run('xcrun',['simctl','delete',device]);report.cleanedUp=true;}
   catch{if(!primaryError)primaryError=Error('Could not delete disposable Simulator');report.passed=false;}
  }
  writeFileSync(join(outputDir,'startup-report.json'),JSON.stringify(report,null,2)+'\n');
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
