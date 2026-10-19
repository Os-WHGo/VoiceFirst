import test from 'node:test';
import assert from 'node:assert/strict';
import {planLanguagePackUpdate} from '../dist/index.js';
const pack={id:'english',kind:'course',version:'1.2.0',bytes:400,dependencies:[],locales:['en-CA'],sha256:'a'.repeat(64),licenseId:'test',licenseReviewed:true,sourceUrl:'https://example.org/english'};
test('upgrade planner distinguishes install, current, upgrade and downgrade',()=>{
 assert.deepEqual(planLanguagePackUpdate(pack,null),{status:'download',id:'english',fromVersion:null,toVersion:'1.2.0',bytes:400});
 assert.equal(planLanguagePackUpdate(pack,'1.2.0').status,'current');
 assert.equal(planLanguagePackUpdate(pack,'1.1.9').status,'download');
 assert.deepEqual(planLanguagePackUpdate(pack,'2.0.0'),{status:'rejected',reason:'downgrade'});
});
test('upgrade planner requires dependencies and valid manifest',()=>{
 assert.deepEqual(planLanguagePackUpdate({...pack,dependencies:['shared']},'1.0.0'),{status:'rejected',reason:'dependencies'});
 assert.deepEqual(planLanguagePackUpdate({...pack,licenseReviewed:false},'1.0.0'),{status:'rejected',reason:'manifest'});
 assert.deepEqual(planLanguagePackUpdate(pack,'bogus'),{status:'rejected',reason:'installed-version'});
});
