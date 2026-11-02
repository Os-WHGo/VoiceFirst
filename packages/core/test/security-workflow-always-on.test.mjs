import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../../../.github/workflows/dependency-vulnerability-inventory.yml',import.meta.url),'utf8');

test('security dependency inventory runs on every pull request without path filters',()=>{
 assert.match(workflow,/^on:\n  pull_request:\s*\n  workflow_dispatch:/m);
 assert.doesNotMatch(workflow,/^    paths:/m,'path filters may bypass a required security check');
 assert.doesNotMatch(workflow,/^    paths-ignore:/m,'ignored file sets may bypass a required security check');
 assert.match(workflow,/^permissions:\n  contents: read/m);
});
test('audit fails closed on fresh advisories and does not weaken baseline or mask errors',()=>{
 assert.match(workflow,/node scripts\/check-security-advisory-baseline\.mjs/);
 assert.match(workflow,/node scripts\/check-security-audit-regression\.mjs/);
 assert.match(workflow,/node scripts\/audit-root-advisories\.mjs/);
 assert.match(workflow,/npm ci --ignore-scripts/);
 assert.doesNotMatch(workflow,/npm audit fix --force/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
 assert.doesNotMatch(workflow,/\|\| true|\|\| :/);
});
test('checkout never retains repository write credentials during untrusted PR audit',()=>{
 assert.match(workflow,/uses: actions\/checkout@v4\n        with:\n          persist-credentials: false/);
});
