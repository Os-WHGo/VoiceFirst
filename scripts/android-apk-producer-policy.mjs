/** Verify that an internal Android APK originated from the exact checked-out
 * VoiceFirst source and an approved candidate workflow, not a stale artifact.
 * Pure policy. No GitHub tokens, signing secrets, or APK binaries are required.
 */
import {readFileSync} from 'node:fs';

export function inspectAndroidCandidateProducer(run,{runId,sourceSha,repository}){
 const errors=[];
 if(!Number.isSafeInteger(runId)||runId<=0)errors.push('Invalid candidate run ID');
 if(typeof sourceSha!=='string'||!/^[a-f0-9]{40}$/.test(sourceSha))errors.push('Source SHA must contain 40 lowercase hexadecimal characters');
 if(typeof repository!=='string'||!/^[-\w.]+\/[-\w.]+$/.test(repository))errors.push('Invalid repository');
 if(!run||typeof run!=='object'||Array.isArray(run))return {ok:false,errors:[...errors,'Missing producer run metadata']};
 if(run.id!==runId)errors.push('Producer run ID mismatch');
 if(run.head_sha!==sourceSha)errors.push('APK producer source does not match expected commit');
 if(run.head_repository?.full_name!==repository)errors.push('Producer came from another repository or fork');
 if(run.head_branch!=='codex/voicefirst-initial-source')errors.push('Producer branch is not authorized');
 if(run.status!=='completed'||run.conclusion!=='success')errors.push('APK producer run did not finish successfully');
 const allowedPaths=new Set([
  '.github/workflows/android-standalone-candidate-once.yml',
  '.github/workflows/android-standalone-candidate-manual.yml'
 ]);
 if(!allowedPaths.has(run.path))errors.push('Producer was not an approved standalone candidate workflow');
 if(!['push','workflow_dispatch'].includes(run.event))errors.push('Unexpected producer workflow event');
 return {ok:errors.length===0,errors};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [file,sha,id,repo]=process.argv.slice(2);
 if(!file||!sha||!id||!repo){console.error('Usage: node scripts/android-apk-producer-policy.mjs metadata.json SOURCE_SHA RUN_ID OWNER/REPO');process.exit(2);}
 try{
  const result=inspectAndroidCandidateProducer(JSON.parse(readFileSync(file,'utf8')),{runId:Number(id),sourceSha:sha,repository:repo});
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
 }catch(error){console.error('Cannot verify Android APK provenance:',error instanceof Error?error.message:String(error));process.exitCode=1;}
}
