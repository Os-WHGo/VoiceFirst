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

test('malformed or incomplete side-loaded audio is refused before filesystem work',()=>{
 const cases=[
  {...manifest,clips:clips.slice(0,5)},
  {...manifest,clips:[clips[0],clips[0],...clips.slice(2)]},
  {...manifest,sceneId:'es/C1/unrelated'},
  {...manifest,status:'approved'},
  {...manifest,publicAvailable:true},
  {...manifest,clips:clips.map((c,i)=>i?c:{...c,sha256:'wrong'})},
  {...manifest,clips:clips.map((c,i)=>i?c:{...c,bytes:9*1024*1024})},
  {...manifest,clips:clips.map((c,i)=>i?c:{...c,accentTag:'it'})},
  {...manifest,clips:clips.map((c,i)=>i?c:{...c,uri:'https://remote.example/audio.wav'})}
 ];
 for(const item of cases)assert.equal(inspectAdvancedReviewManifest(scene.sceneId,item).kind,'rejected');
});
test('all twelve scenes accept only candidate metadata, never sound or rights proof',()=>{
 for(const s of advancedListeningStoryboards){
  const entries=s.turns.map(t=>({audioId:t.audioId,bytes:400,sha256:'e'.repeat(64),accentTag:s.targetLanguage,rightsReference:'still-to-review',sourceReference:'fictional-original-test'}));
  const data={format:advancedReviewManifestFormat,sceneId:s.sceneId,status:'candidate-only',clips:entries};
  const result=inspectAdvancedReviewManifest(s.sceneId,data);
  assert.equal(result.kind,'candidate');
  assert.equal(result.audioVerified,false);
  assert.equal(result.publicAvailable,false);
 }
});
