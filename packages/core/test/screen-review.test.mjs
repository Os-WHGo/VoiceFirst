import test from 'node:test';
import assert from 'node:assert/strict';
import {newCourseProgress,newSkillRecord,screenReviewTasks} from '../dist/index.js';
test('no oral completion produces no screen followup',()=>{
 const progress=newCourseProgress('en-CA');
 assert.deepEqual(screenReviewTasks(progress,newSkillRecord('en-CA')),[]);
 assert.throws(()=>screenReviewTasks(progress,newSkillRecord('de')),/Language mismatch/);
});
test('oral completion offers reading and writing without granting proficiency',()=>{
 const progress={...newCourseProgress('en-CA'),completed:['en-CA-a0-greeting']};
 const skills=newSkillRecord('en-CA');
 const tasks=screenReviewTasks(progress,skills);
 assert.deepEqual(tasks.map(x=>x.kind),['reading','writing']);
 assert.ok(tasks.every(x=>x.sourcePhrase&&x.assessment==='practice-only'));
 assert.equal(skills.skills.reading.completed,0);
 assert.equal(skills.skills.writing.completed,0);
});
