import test from 'node:test';
import assert from 'node:assert/strict';
import {a1HelpFor,a1HelpPairs,a1HelpTopics,a1HelpSkills} from '../dist/index.js';
test('30 unique directed pairs',()=>{assert.equal(a1HelpPairs.length,30);assert.equal(new Set(a1HelpPairs.map(p=>p.known+'/'+p.target)).size,30);});
test('draft-only instructions for all combinations',()=>{for(const p of a1HelpPairs){for(const topic of a1HelpTopics){for(const skill of a1HelpSkills){const v=a1HelpFor(p.known,p.target,topic,skill);assert.ok(v);assert.equal(v.publicationStatus,'draft-only');assert.ok(v.instruction.length>10);}}}});
test('same language is rejected',()=>{assert.equal(a1HelpFor('es','es','personal-information','speaking'),null);});
