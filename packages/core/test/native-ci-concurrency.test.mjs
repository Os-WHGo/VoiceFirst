import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../../../.github/workflows/expo-native-readiness.yml',import.meta.url),'utf8');

test('native CI isolates manual runs by unique run ID',()=>{
 assert.match(workflow,/group: voicefirst-native-.*github\.workflow.*github\.event\.pull_request\.number \|\| github\.run_id/);
 assert.doesNotMatch(workflow,/github\.event\.pull_request\.number \|\| github\.ref/);
});
test('automatic cancellation applies to pull requests only',()=>{
 assert.match(workflow,/cancel-in-progress:.*github\.event_name == 'pull_request'/);
 assert.match(workflow,/workflow_dispatch:/);
});

const jsWorkflow=readFileSync(new URL('../../../.github/workflows/expo-js-bundle.yml',import.meta.url),'utf8');

test('B0 native readiness compiles Kotlin without generating Android APK or AAB',()=>{
 assert.match(workflow,/:app:compileDebugKotlin :app:compileReleaseKotlin/);
 assert.doesNotMatch(workflow,/:app:assemble(?:Release|Debug)/);
 assert.doesNotMatch(workflow,/actions\/upload-artifact@/);
 assert.match(workflow,/no Android installable was generated/);
 assert.match(workflow,/name '\*\.apk'/);
 assert.match(workflow,/name '\*\.aab'/);
 assert.doesNotMatch(workflow,/^\s+- 'packages\/core\/\*\*'$/m,'core-only edits should not trigger native builds');
});
test('Metro still checks both platforms on core and mobile changes, without native packaging',()=>{
 assert.match(jsWorkflow,/'packages\/core\/\*\*'/);
 assert.match(jsWorkflow,/'mobile\/\*\*'/);
 assert.match(jsWorkflow,/npm run check:mobile-bundle/);
 assert.match(jsWorkflow,/npm run build:core/);
 assert.doesNotMatch(jsWorkflow,/gradlew|xcodebuild|assembleRelease|upload-artifact/);
 assert.match(jsWorkflow,/cancel-in-progress:.*github\.event_name == 'pull_request'/);
});

test('native change gate is required for all native jobs and unknown revisions compile conservatively',async()=>{
 const {requiresNativeCompile,inspectNativeChange}=await import('../../../scripts/native-ci-change-gate.mjs');
 assert.match(workflow,/native-change-gate:/);
 assert.equal((workflow.match(/needs: native-change-gate/g)||[]).length,3);
 assert.match(workflow,/github\.event\.before/);
 assert.match(workflow,/fetch-depth: 0/);
 assert.equal(requiresNativeCompile(['packages/core/src/learning-session.ts']),false);
 assert.equal(requiresNativeCompile(['docs/ci/native-batch-request.md']),true);
 assert.equal(requiresNativeCompile(['docs/ci/notes-only.md']),false);
 assert.match(workflow,/'docs\/ci\/native-batch-request\.md'/);
 assert.equal(requiresNativeCompile(['packages/core/test/learning-session.test.mjs']),false);
 assert.equal(requiresNativeCompile(['mobile/modules/voicefirst-audio-route/ios/VoiceFirstAudioRouteModule.swift']),true);
 assert.equal(requiresNativeCompile(['mobile/App.tsx']),true);
 assert.equal(requiresNativeCompile(['package-lock.json']),true);
 assert.equal(requiresNativeCompile(['.github/workflows/expo-native-readiness.yml']),true);
 assert.equal(requiresNativeCompile(['scripts/native-ci-change-gate.mjs']),true);
 assert.equal(requiresNativeCompile(null),true);
 const before='a'.repeat(40),after='b'.repeat(40);
 const env={eventName:'pull_request',action:'synchronize',before,after};
 const fake=paths=>args=>args[0]==='diff'?paths:'';
 assert.deepEqual(inspectNativeChange(env,fake('packages/core/src/course.ts\n')),{required:false,reason:'validated-commit-diff',changed:1});
 assert.deepEqual(inspectNativeChange(env,fake('mobile/App.tsx\n')),{required:true,reason:'validated-commit-diff',changed:1});
 assert.equal(inspectNativeChange({...env,before:''},fake('')).required,true);
 assert.equal(inspectNativeChange({...env,eventName:'workflow_dispatch'},fake('')).required,true);
 assert.deepEqual(inspectNativeChange(env,()=>{throw Error('git unavailable');}),{required:true,reason:'unavailable-history'});
});
