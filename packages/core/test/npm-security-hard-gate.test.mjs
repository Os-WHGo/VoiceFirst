import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installedLocations,reverseParents,classifyExplainTarget} from '../../../scripts/audit-dependency-parents.mjs';
import {assessReleaseAudit} from '../../../scripts/npm-security-hard-gate.mjs';
const lock={lockfileVersion:3,packages:{
 '':{dependencies:{foo:'^1'}},
 'node_modules/foo':{version:'1.2.0',dependencies:{bar:'^2'}},
 'node_modules/bar':{version:'2.1.0'},
 'node_modules/@expo/cli':{version:'57.0.32',dependencies:{zod:'^3.25.76'}},
 'node_modules/zod':{version:'3.25.76'}
}};
const report=(total,vuln={})=>({metadata:{vulnerabilities:{critical:0,high:total,moderate:0,low:0,info:0,total}},vulnerabilities:vuln});
test('removed uuid never causes a false npm explain failure',()=>{
 assert.deepEqual(installedLocations(lock,'uuid'),[]);
 assert.equal(classifyExplainTarget(lock,'uuid').status,'not-installed');
 assert.deepEqual(reverseParents(lock,'zod'),[{parentPath:'node_modules/@expo/cli',parentVersion:'57.0.32',required:'^3.25.76'}]);
 assert.equal(classifyExplainTarget(lock,'zod').status,'installed');
 assert.deepEqual(installedLocations(lock,'zod'),[{path:'node_modules/zod',version:'3.25.76'}]);
});
test('dangling required dependency does not silently disappear',()=>{
 const invalid={lockfileVersion:3,packages:{'node_modules/tool':{version:'1.0.0',dependencies:{glob:'^13'}}}};
 assert.equal(classifyExplainTarget(invalid,'glob').status,'invalid-missing-required');
 assert.throws(()=>installedLocations({packages:{}},'glob'));
});
test('release gate passes only an internally consistent zero-vulnerability audit',()=>{
 const clean=assessReleaseAudit(report(0));
 assert.equal(clean.readyForMerge,true);
 assert.equal(clean.affectedPackages,0);
 const issue={zod:{via:[{url:'https://github.com/advisories/GHSA-synthetic-1'}]}};
 const unsafe=assessReleaseAudit(report(1,issue));
 assert.equal(unsafe.readyForMerge,false);
 assert.equal(unsafe.affectedPackages,1);
 assert.deepEqual(unsafe.rootPackages,['zod']);
 assert.equal(assessReleaseAudit(report(0,issue)).readyForMerge,false);
 assert.equal(assessReleaseAudit(report(1)).readyForMerge,false);
 assert.throws(()=>assessReleaseAudit({metadata:{vulnerabilities:{}}}));
 assert.throws(()=>assessReleaseAudit(report(1,{zod:{via:[{url:'http://unsafe.invalid'}]}})));
});
test('workflow retains mandatory npm zero gate and traces before failing',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/dependency-vulnerability-inventory.yml',import.meta.url),'utf8');
 assert.match(workflow,/node scripts\/npm-security-hard-gate\.mjs/);
 assert.match(workflow,/node scripts\/audit-dependency-parents\.mjs/);
 assert.match(workflow,/if:\s*\$\{\{\s*!cancelled\(\)\s*\}\}/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
