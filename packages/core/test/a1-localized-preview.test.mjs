import test from 'node:test';
import assert from 'node:assert/strict';
import {a1HelpPairs,a1DraftTopics,a1LocalizedPreview} from '../dist/index.js';
test('every A1 draft has localized editorial preview in each different known language',()=>{let count=0;for(const pair of a1HelpPairs){for(const topic of a1DraftTopics){const preview=a1LocalizedPreview(pair.known,pair.target,topic);assert.ok(preview);assert.equal(preview.status,'editorial-only');assert.equal(preview.audioStatus,'not-recorded');assert.equal(preview.rightsStatus,'pending-editorial-clearance');assert.equal(preview.editorialStatus,'not-human-reviewed');assert.equal(preview.activities.length,6);assert.ok(preview.activities.every(x=>x.instruction&&x.draftPrompt));count++;}}assert.equal(count,60);});
test('same-language route cannot be previewed',()=>{assert.equal(a1LocalizedPreview('es','es','personal-information'),null);});
