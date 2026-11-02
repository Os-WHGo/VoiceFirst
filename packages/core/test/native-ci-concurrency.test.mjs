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
