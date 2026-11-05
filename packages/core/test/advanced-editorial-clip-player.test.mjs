import test from 'node:test';
import assert from 'node:assert/strict';
import {AdvancedEditorialClipPlayer,startAdvancedRehearsal,advancedListeningStoryboards} from '../dist/index.js';
const s=advancedListeningStoryboards[0];
const state=startAdvancedRehearsal('fr-CA',s.targetLanguage,s.level,s.unitId);
const clips=s.turns.map((turn,i)=>({audioId:turn.audioId,sceneId:s.sceneId,localUri:'file:///review/clip'+i+'.wav',bytes:100+i,sha256:'a'.repeat(64),accentTag:s.targetLanguage,rightsReference:'editorial-only',sourceReference:'internal-review'}));
test('missing six files never start editorial playback',async()=>{
 let played=0;
 const player=new AdvancedEditorialClipPlayer({fileSizeBytes:async()=>0,sha256File:async()=>''},{prepareForeground:async()=>{},createLocalClip:()=>{played++;return{start(){},stop(){}};}});
 assert.deepEqual(await player.play(state,[]),{status:'unavailable'});
 assert.deepEqual(await player.play(state,clips.slice(0,5)),{status:'unavailable'});
 assert.equal(played,0);
});
