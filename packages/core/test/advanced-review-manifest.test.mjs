import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAdvancedReviewManifest,advancedReviewManifestFormat} from '../dist/advanced-review-manifest.js';
import {advancedListeningStoryboards} from '../dist/advanced-listening-storyboards.js';
const scene=advancedListeningStoryboards[0];
const clips=scene.turns.map(turn=>({audioId:turn.audioId,bytes:1024,sha256:'a'.repeat(64),accentTag:scene.targetLanguage,rightsReference:'review-pending',sourceReference:'original-test-audio'}));
const manifest={format:advancedReviewManifestFormat,sceneId:scene.sceneId,status:'candidate-only',clips};
test('original editorial manifest stays unreviewed',()=>{
 const result=inspectAdvancedReviewManifest(scene.sceneId,manifest);
 assert.equal(result.kind,'candidate');
 assert.equal(result.audioVerified,false);
 assert.equal(result.publicAvailable,false);
});
