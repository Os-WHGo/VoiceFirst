import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryA0Curriculum} from '../dist/index.js';
const unit={unit_id:'a0-first_contact-enca',concept_id:'concept.a0.first_contact',target_language:'en-CA',level:'A0',skills:{listening:{audio_status:'not_recorded'}},vocabulary:[{lemma:'hello'}]};
test('A0 authored unit is inventoried without inventing interactive lessons or audio',()=>{
 const result=inventoryA0Curriculum({units:[unit]});
 assert.equal(result.units.length,1);assert.deepEqual(result.issues,[]);
 assert.equal(result.interactiveLessonsReady,0);assert.equal(result.publishable,false);assert.equal(result.units[0].hasRecordedAudio,false);
});
test('A0 curriculum inventory rejects duplicate and unverified audio',()=>{
 const result=inventoryA0Curriculum({units:[unit,unit,{...unit,unit_id:'other',skills:{listening:{audio_status:'recorded'}}}]});
 assert.deepEqual(result.issues.map(x=>x.code),['DUPLICATE_UNIT','UNVERIFIED_AUDIO_STATUS']);
});
