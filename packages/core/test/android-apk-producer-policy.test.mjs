import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectAndroidCandidateProducer} from '../../../scripts/android-apk-producer-policy.mjs';

const sha='a'.repeat(40);
const source=()=>({id:123456,head_sha:sha,head_repository:{full_name:'Os-WHGo/VoiceFirst'},
 head_branch:'codex/voicefirst-initial-source',status:'completed',conclusion:'success',
 path:'.github/workflows/android-standalone-candidate-once.yml',event:'push'});
const args={runId:123456,sourceSha:sha,repository:'Os-WHGo/VoiceFirst'};
test('exact successful APK producer from development branch is trusted, including manual candidate',()=>{
 assert.deepEqual(inspectAndroidCandidateProducer(source(),args),{ok:true,errors:[]});
 const run=source();run.path='.github/workflows/android-standalone-candidate-manual.yml';run.event='workflow_dispatch';
 assert.equal(inspectAndroidCandidateProducer(run,args).ok,true);
});
test('old, forged, cancelled and unrelated builds fail closed',()=>{
 const changes=[
  r=>{r.id=12;},r=>{r.head_sha='b'.repeat(40);},r=>{r.head_repository.full_name='fork/VoiceFirst';},
  r=>{r.head_branch='main';},r=>{r.status='in_progress';},r=>{r.conclusion='failure';},
  r=>{r.path='.github/workflows/android-debug.yml';},r=>{r.event='pull_request';}
 ];
 for(const change of changes){const run=source();change(run);
  assert.equal(inspectAndroidCandidateProducer(run,args).ok,false,JSON.stringify(run));
 }
 for(const bad of [null,undefined,{},'success',[],{...source(),head_repository:null}]){
  assert.equal(inspectAndroidCandidateProducer(bad,args).ok,false);
 }
 assert.equal(inspectAndroidCandidateProducer(source(),{...args,sourceSha:sha.slice(0,7)}).ok,false);
 assert.equal(inspectAndroidCandidateProducer(source(),{...args,runId:-1}).ok,false);
});
test('CLI verifies exact source run, reports error and does not require signing keys',()=>{
 const dir=mkdtempSync(join(tmpdir(),'voicefirst-producer-'));
 try{
  const file=join(dir,'run.json'),script=fileURLToPath(new URL('../../../scripts/android-apk-producer-policy.mjs',import.meta.url));
  writeFileSync(file,JSON.stringify(source()));
  const good=spawnSync(process.execPath,[script,file,sha,'123456','Os-WHGo/VoiceFirst'],{encoding:'utf8'});
  assert.equal(good.status,0,good.stderr);assert.match(good.stdout,/"ok": true/);
  const wrong=spawnSync(process.execPath,[script,file,'b'.repeat(40),'123456','Os-WHGo/VoiceFirst'],{encoding:'utf8'});
  assert.equal(wrong.status,1);assert.match(wrong.stdout,/producer source does not match/i);
  writeFileSync(file,'<invalid json>');
  const broken=spawnSync(process.execPath,[script,file,sha,'123456','Os-WHGo/VoiceFirst'],{encoding:'utf8'});
  assert.equal(broken.status,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('emulator workflow is manual opt-in and never relies on a pinned stale APK run',()=>{
 const source=readFileSync(new URL('../../../.github/workflows/android-emulator-apk-smoke-once.yml',import.meta.url),'utf8');
 assert.match(source,/workflow_dispatch:/);
 assert.doesNotMatch(source,/^  push:/m);
 assert.match(source,/inputs\.confirm_internal_smoke == 'RUN_OFFLINE_SMOKE'/);
 assert.match(source,/inputs\.candidate_run_id/);
 assert.match(source,/inputs\.expected_sha/);
 assert.match(source,/android-apk-producer-policy\.mjs/);
 assert.match(source,/sha256sum -c SHA256SUMS-local\.txt/);
 assert.match(source,/reactivecircus\/android-emulator-runner@v2/);
 assert.doesNotMatch(source,/39514938027/);
});
