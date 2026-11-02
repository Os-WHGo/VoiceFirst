import test from 'node:test';
import assert from 'node:assert/strict';
import {planSpeechStack} from '../dist/index.js';

const base={platform:'ios',totalRamMb:4096,freeDiskBytes:500000000,
 osOnDeviceAsrLocales:['fr-CA'],osVoiceLocales:['fr-CA']};
const plan=device=>planSpeechStack({target:'fr-CA',device,catalog:[],installedIds:[]});

test('valid OS locale inventory permits device recognition without claiming calibration',()=>{
 const result=plan(base);
 assert.equal(result.asr.source,'os-on-device');
 assert.equal(result.asr.confidencePolicy,'confirm-every-answer');
 assert.equal(result.tts.source,'os-voice');
});
test('malformed voice and ASR inventories fail closed rather than crashing learner session',()=>{
 const corrupted=[
  {...base,osOnDeviceAsrLocales:[null,'fr-CA'],osVoiceLocales:['fr-CA',false]},
  {...base,osOnDeviceAsrLocales:null,osVoiceLocales:null},
  {...base,osOnDeviceAsrLocales:[37],osVoiceLocales:['unknown',37]}
 ];
 for(const device of corrupted){
  const result=plan(device);
  assert.equal(result.asr.source,'none');
  assert.equal(result.tts.source,'recorded-audio-only');
  assert.equal(result.nonSpeechFallback,true);
 }
});
