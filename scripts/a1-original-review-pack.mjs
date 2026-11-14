#!/usr/bin/env node
/** Offline A1 original-voice EDITORIAL package preparation. No synthesizer,
 * network, backend, microphone, user data or publishing.
 *
 * node scripts/a1-original-review-pack.mjs plan "en-CA/A1/greetings-and-introductions"
 * node scripts/a1-original-review-pack.mjs build "en-CA/A1/greetings-and-introductions" ./original-six-wav
 * node scripts/a1-original-review-pack.mjs verify "en-CA/A1/greetings-and-introductions"
 *
 * Requires "rights.json" metadata + six turn-1.wav ... turn-6.wav in src.
 * Rights references are NOTES awaiting human clearance, not a license grant.
 */
import {readFile,writeFile,mkdir,readdir,lstat,rename,rm} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {
 expandedA1GreetingPilots,expandedA1SituationalPilots,
 a1SixTurnAudioFormat,inspectA1SixTurnAudioManifest,auditA1SixTurnAudio,
 sha256Bytes,inspectPcmWav,cueFingerprint
} from '../packages/core/dist/index.js';

const scenes=[...expandedA1GreetingPilots,...expandedA1SituationalPilots];
const maybeStat=path=>lstat(path).catch(error=>{
 if(error?.code==='ENOENT')return null;
 throw error;
});
function fail(reason){throw Error(reason);}
function sceneById(id){
 const scene=scenes.find(s=>s.sceneId===id);
 if(!scene)fail('Unknown original A1 scene; use one of 24 source-locked scenes');
 return scene;
}
const base=()=>resolve('build');
const slug=scene=>[scene.targetLanguage,'a1',scene.unitId];
const finalDir=scene=>join(base(),'a1-review-packages','voicefirst-a1-review',...slug(scene));
const briefDir=scene=>join(base(),'a1-recording-briefs',...slug(scene));
const validRef=value=>typeof value==='string'&&value===value.trim()&&value.length>=3&&value.length<=160;

async function writeNew(path,contents){
 if(await maybeStat(path))fail('Output already exists; choose a fresh workspace');
 await mkdir(dirname(path),{recursive:true});
 await writeFile(path,contents,{flag:'wx'});
}
async function plan(scene){
 const out=briefDir(scene);
 if(await maybeStat(out))fail('An existing editorial brief cannot be replaced');
 await mkdir(out,{recursive:true});
 const brief={
  sceneId:scene.sceneId,language:scene.targetLanguage,status:'not-recorded',
  instructions:'Record six original PCM16 WAV clips with human consent; no AI voice automatically generated.',
  turns:scene.turns.map(t=>({id:t.id,audioId:t.audioId,speaker:t.speaker,text:t.text,file:t.id+'.wav'})),
  canPublish:false,canAssessListening:false
 };
 const rights={accentTag:scene.targetLanguage,rightsReference:'',sourceReference:''};
 await writeNew(join(out,'script.json'),JSON.stringify(brief,null,2)+'\n');
 await writeNew(join(out,'rights.example.json'),JSON.stringify(rights,null,2)+'\n');
 console.log('A1 editorial brief prepared:',out,'No audio generated.');
}
async function readClip(dir,turn){
 const file=join(dir,turn+'.wav');
 const st=await maybeStat(file);
 if(!st||!st.isFile()||st.isSymbolicLink()||!Number.isSafeInteger(st.size)||st.size<=0||st.size>8*1024*1024)
  fail('Missing, symlinked or oversized original clip: '+turn);
 const bytes=await readFile(file);
 if(bytes.length!==st.size)fail('Original audio changed during read: '+turn);
 const parsed=inspectPcmWav(bytes);
 if(!parsed.valid||parsed.durationMs<250)fail('Invalid or too short PCM WAV: '+turn);
 return {bytes,parsed};
}
async function checkFolder(scene,dir,manifest){
 const checked=inspectA1SixTurnAudioManifest(scene.sceneId,manifest);
 if(checked.kind!=='candidate')fail('Rejected A1 manifest: '+checked.reason);
 const files=(await readdir(dir)).filter(name=>name.endsWith('.wav')).sort();
 const expected=scene.turns.map(t=>t.id+'.wav').sort();
 if(files.length!==6||files.some((name,i)=>name!==expected[i]))
  fail('Extra, missing or unrecognized WAV file');
 const report=await auditA1SixTurnAudio(scene.sceneId,manifest,{
  async checkOwnedClip(audioId,durationMs){
   const turn=scene.turns.find(t=>t.audioId===audioId);
   if(!turn)fail('Unexpected A1 original ID');
   const {bytes,parsed}=await readClip(dir,turn.id);
   return{bytes:bytes.length,sha256:sha256Bytes(bytes),
    validPcmWav:parsed.valid&&parsed.durationMs===durationMs};
  }
 });
 if(!report.readyForEditorialPlayback)fail('A1 six-recording byte verification failed');
 return{sceneId:scene.sceneId,verified:report.verified,
  rightsCleared:false,publicAvailable:false,proofPersistent:false};
}
async function build(scene,srcArg){
 const src=resolve(srcArg),info=await maybeStat(src);
 if(!info||!info.isDirectory()||info.isSymbolicLink())
  fail('Source must be an existing real folder of original WAV files');
 const rightsFile=join(src,'rights.json'),rs=await maybeStat(rightsFile);
 if(!rs||!rs.isFile()||rs.isSymbolicLink()||rs.size<=0||rs.size>8192)
  fail('Missing or invalid local rights.json notes');
 let rights;
 try{rights=JSON.parse(await readFile(rightsFile,'utf8'));}
 catch{fail('Unreadable rights.json');}
 if(!rights||Array.isArray(rights)||typeof rights!=='object'||
  Object.keys(rights).length!==3||
  !Object.hasOwn(rights,'accentTag')||!Object.hasOwn(rights,'rightsReference')||
  !Object.hasOwn(rights,'sourceReference')||
  !validRef(rights.rightsReference)||!validRef(rights.sourceReference))
  fail('Rights notes require exact accentTag, rightsReference and sourceReference; no approval claims');
 const clips=[];
 for(const turn of scene.turns){
  const {bytes,parsed}=await readClip(src,turn.id);
  clips.push({
   audioId:turn.audioId,sourceFingerprint:cueFingerprint(turn.text),
   bytes:bytes.length,durationMs:parsed.durationMs,sha256:sha256Bytes(bytes),
   accentTag:rights.accentTag,rightsReference:rights.rightsReference,
   sourceReference:rights.sourceReference
  });
 }
 const manifest={format:a1SixTurnAudioFormat,sceneId:scene.sceneId,
  status:'editorial-candidate',clips};
 if(inspectA1SixTurnAudioManifest(scene.sceneId,manifest).kind!=='candidate')
  fail('Source, dialect or metadata is not an approved editorial candidate shape');
 // Reject any unlisted recordings before touching the output.
 const files=(await readdir(src)).filter(n=>n.endsWith('.wav')).sort();
 const required=scene.turns.map(t=>t.id+'.wav').sort();
 if(files.length!==6||files.some((name,i)=>name!==required[i]))
  fail('Original source must have exactly the six authored WAV filenames');
 const final=finalDir(scene);
 if(await maybeStat(final))fail('Already prepared: previous output must never be overwritten');
 await mkdir(dirname(final),{recursive:true});
 const staged=final+'.staging-'+process.pid;
 if(await maybeStat(staged))fail('Staging destination already exists');
 await mkdir(staged);
 try{
  for(let i=0;i<6;i++){
   // Copy the SAME bounded bytes that were validated, not a changed source.
   const {bytes}=await readClip(src,scene.turns[i].id);
   if(sha256Bytes(bytes)!==clips[i].sha256)fail('Source changed during packaging');
   await writeFile(join(staged,scene.turns[i].id+'.wav'),bytes,{flag:'wx'});
  }
  const json=JSON.stringify(manifest,null,2)+'\n';
  if(json.length>16384)fail('Manifest exceeds mobile size limit');
  await writeFile(join(staged,'manifest.json'),json,{flag:'wx'});
  const proof=await checkFolder(scene,staged,manifest);
  if(await maybeStat(final))fail('Destination created concurrently; cannot replace');
  await rename(staged,final);
  console.log(JSON.stringify({...proof,localFolder:final,
   note:'Private editorial files only. Narrator permissions/quality still require human review.'}));
 }catch(error){await rm(staged,{recursive:true,force:true});throw error;}
}
async function verify(scene){
 const dir=finalDir(scene),st=await maybeStat(dir);
 if(!st||!st.isDirectory()||st.isSymbolicLink())fail('No prepared local editorial scene');
 const mf=join(dir,'manifest.json'),ms=await maybeStat(mf);
 if(!ms||!ms.isFile()||ms.isSymbolicLink()||ms.size<=0||ms.size>16384)
  fail('Missing or oversized review manifest');
 const value=JSON.parse(await readFile(mf,'utf8'));
 console.log(JSON.stringify(await checkFolder(scene,dir,value)));
}
const [mode,id,source]=process.argv.slice(2);
try{
 if(mode==='plan'&&id&&!source)await plan(sceneById(id));
 else if(mode==='build'&&id&&source)await build(sceneById(id),source);
 else if(mode==='verify'&&id&&!source)await verify(sceneById(id));
 else fail('Usage: a1-original-review-pack.mjs plan SCENE | build SCENE SOURCE_DIRECTORY | verify SCENE');
}catch(error){console.error('A1 REVIEW PACK ERROR:',error?.message??'unknown');process.exitCode=1;}
