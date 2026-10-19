import test from 'node:test';
import assert from 'node:assert/strict';
import {newSkillRecord,recordSkillEvidence,skillRecordFromJSON} from '../dist/index.js';
test('audio-only practice does not invent reading or writing proficiency',()=>{
 const first=newSkillRecord('en-CA');
 const second=recordSkillEvidence(recordSkillEvidence(first,'listening','completed'),'speaking','uncertain');
 assert.equal(second.skills.listening.completed,1);
 assert.equal(second.skills.speaking.uncertain,1);
 assert.equal(second.skills.reading.attempted,0);
 assert.equal(second.skills.writing.attempted,0);
 assert.equal(first.skills.listening.attempted,0);
 assert.deepEqual(skillRecordFromJSON(JSON.stringify(second),'en-CA'),second);
 assert.equal(skillRecordFromJSON(JSON.stringify(second),'de'),null);
 assert.equal(skillRecordFromJSON(JSON.stringify({...second,skills:{...second.skills,writing:{attempted:0,completed:1,uncertain:0}}}),'en-CA'),null);
});
