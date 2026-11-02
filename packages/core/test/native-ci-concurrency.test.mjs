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
