import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonDisplayPolicy,defaultExperiencePreferences} from '../dist/index.js';

test('calm presentation shows optional lesson navigation only on request',()=>{
 const initial=lessonDisplayPolicy(defaultExperiencePreferences.sensoryPresentation);
 assert.deepEqual(initial,{calm:true,showOptionalSections:false});
 assert.deepEqual(lessonDisplayPolicy('calm',true),{calm:true,showOptionalSections:true});
 assert.deepEqual(lessonDisplayPolicy('calm',false),initial);
});
test('standard presentation keeps optional navigation visible',()=>{
 assert.deepEqual(lessonDisplayPolicy('standard'),{calm:false,showOptionalSections:true});
 assert.deepEqual(lessonDisplayPolicy('standard',true),{calm:false,showOptionalSections:true});
});
