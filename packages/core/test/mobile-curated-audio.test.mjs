import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {PlaybackRequestOwnership,effectivePlaybackRate,curatedPlaybackTimeoutMs} from '../dist/index.js';

function createAudioHarness(){
 const players=[];const stops=[];const timers=[];
 const Speech={
  stop:()=>new Promise(resolve=>{stops.push(resolve);}),
  getAvailableVoicesAsync:async()=>[],
  speak:()=>{}
 };
 const fixture={
  Speech,
  audio:{
   setAudioModeAsync:async()=>{},
   createAudioPlayer:()=>{const player={plays:0,releases:0,playbackRate:1,
    play(){this.plays++;},pause(){},release(){this.releases++;},
    addListener(_event,handler){this.handler=handler;return {remove:()=>{this.handler=null;}};}
   };players.push(player);return player;}
  },
  core:{PlaybackRequestOwnership,effectivePlaybackRate,curatedPlaybackTimeoutMs,planVoiceOutput:()=>({kind:'not-available'})},
  local:{findVerifiedRecordedCue:async()=>({kind:'verified',durationMs:30000,uri:'file:///recording.wav'})}
 };
 const source=readFileSync(new URL('../../../mobile/curated-voice-output.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 const injected=name=>({
  'expo-speech':fixture.Speech,
  'expo-audio':fixture.audio,
  '@voicefirst/core':fixture.core,
  './installed-voice-pack':fixture.local
 })[name];
 const run=new Function('require','module','exports','setTimeout','clearTimeout',compiled);
 run(injected,module,module.exports,(cb,ms)=>{const timer={cb,ms};timers.push(timer);return timer;},()=>{});
 return {api:module.exports,players,stops,timers,Speech};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('last request wins despite deferred native speech stop',async()=>{
 const h=createAudioHarness();
 const line={id:'line-1',language:'en-CA',text:'Hello'};
 const one=h.api.playCuratedVoice(line,1);
 const two=h.api.playCuratedVoice(line,1);
 await flush();assert.equal(h.stops.length,1);
 h.stops.shift()();await flush();
 assert.equal(h.stops.length,1);
 h.stops.shift()();
 await Promise.all([one,two]);
 assert.equal(h.players.length,1);
 assert.equal(h.players[0].plays,1);
 const stopped=h.api.stopCuratedVoice();
 await flush();assert.equal(h.players[0].releases,1);
 assert.equal(h.stops.length,1);
 h.stops.shift()();await stopped;
 assert.equal(h.players[0].releases,1);
});
test('slow local narration receives sufficient completion timeout',async()=>{
 const h=createAudioHarness();
 const pending=h.api.playCuratedVoice({id:'slow',language:'en-CA',text:'slow'},0.65);
 await flush();
 h.stops.shift()();
 await pending;
 assert.equal(h.players[0].playbackRate,0.65);
 assert.ok(h.timers[0].ms>40000);
});

test('native stop failure never permits overlapping new playback',async()=>{
 const h=createAudioHarness();
 h.Speech.stop=async()=>{throw Error('native-stop-failed');};
 const errors=[];
 await h.api.playCuratedVoice({id:'test',language:'en-CA',text:'text'},1,undefined,message=>errors.push(message));
 assert.equal(h.players.length,0);
 assert.equal(errors.length,1);
});
