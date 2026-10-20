import test from 'node:test';
import assert from 'node:assert/strict';
import {a1AudioExpectedIds,a1ListeningCards} from '../dist/index.js';
test('A1 listening cards never expose editorial audio to public playback or assessment',()=>{
 const empty=a1ListeningCards({expected:24,verified:0,missing:a1AudioExpectedIds,rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.equal(empty.length,12);
 assert.ok(empty.every(card=>card.state==='missing-audio'&&card.canPlayInPublicApp===false&&card.canAssessListening===false));
 const all=a1ListeningCards({expected:24,verified:24,missing:[],rejected:[],readyForEditorialPlayback:true,readyForPublicRelease:false});
 assert.ok(all.every(card=>card.state==='editorial-preview-only'&&card.canPlayInPublicApp===false&&card.canAssessListening===false));
});
