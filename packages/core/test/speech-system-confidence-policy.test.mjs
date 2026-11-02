import test from 'node:test';
import assert from 'node:assert/strict';
import {planSpeechStack,measuredSpeechCandidates,voiceTranscriptDisposition} from '../dist/index.js';

const device={platform:'ios',totalRamMb:8192,freeDiskBytes:1000000000,
 osOnDeviceAsrLocales:['en-CA'],osVoiceLocales:['en-CA']};
test('device-reported recognition locale does not imply calibrated confidence',()=>{
 const plan=planSpeechStack({target:'en-CA',device,catalog:[],installedIds:[]});
 assert.equal(plan.asr.source,'os-on-device');
 assert.equal(plan.asr.confidencePolicy,'confirm-every-answer');
 assert.equal(plan.nonSpeechFallback,true);
});
test('unreviewed local model never bypasses confirmation through OS fallback',()=>{
 const plan=planSpeechStack({target:'en-CA',device,catalog:measuredSpeechCandidates,installedIds:measuredSpeechCandidates.map(m=>m.pack.id)});
 assert.equal(plan.asr.source,'os-on-device');
 assert.equal(plan.asr.confidencePolicy,'confirm-every-answer');
});
test('uncalibrated recognized speech never auto-grades even with auto-after-silence preference',()=>{
 assert.equal(voiceTranscriptDisposition({text:'Good morning',confidence:'unknown',
  answerControl:'auto-after-silence',final:true}),'confirm');
});
