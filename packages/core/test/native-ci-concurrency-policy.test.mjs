import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../../../.github/workflows/expo-native-readiness.yml',import.meta.url),'utf8');

test('native compile batches are keyed to immutable commit SHA, not only PR number',()=>{
 const group=text.split(/\r?\n/).find(line=>line.trim().startsWith('group: voicefirst-native-'));
 assert.ok(group,'native concurrency group must exist');
 assert.match(group,/github\.sha/,'documentation-only follow-up commits must not cancel an earlier native build');
 assert.match(group,/github\.event\.pull_request\.number/,'different PRs must be isolated');
});
test('natively sensitive changes can still trigger a compile-only workflow, no distributable',()=>{
 assert.match(text,/docs\/ci\/native-batch-request\.md/);
 assert.match(text,/compileDebugKotlin :app:compileReleaseKotlin/);
 assert.match(text,/CODE_SIGNING_ALLOWED=NO build/);
 assert.match(text,/Assert no Android installable was generated/);
});
