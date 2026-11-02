import test from 'node:test';
import assert from 'node:assert/strict';
import {planSpeechStack,measuredSpeechCandidates} from '../dist/index.js';

const catalog=measuredSpeechCandidates.map(entry=>({...entry,pack:{...entry.pack,licenseReviewed:true}}));
const device={platform:'android',totalRamMb:8192,freeDiskBytes:0,osOnDeviceAsrLocales:['es'],osVoiceLocales:['de']};
const find=(term)=>catalog.find(e=>e.pack.id.includes(term));

test('no free installation space does not disable an already installed local recognizer',()=>{
 const asr=find('canary'),vad=find('silero'),tts=find('piper-de');
 const plan=planSpeechStack({target:'de',device,catalog,installedIds:[asr.pack.id,vad.pack.id,tts.pack.id]});
 assert.equal(plan.asr.source,'installed-model');
 assert.equal(plan.asr.modelId,asr.pack.id);
 assert.equal(plan.tts.source,'installed-model');
 assert.equal(plan.vad.source,'installed-model');
 assert.deepEqual(plan.suggestedDownloads,[]);
});
test('zero disk still blocks recommendations for new downloads',()=>{
 const plan=planSpeechStack({target:'de',device,catalog,installedIds:[]});
 assert.equal(plan.asr.source,'none');
 assert.deepEqual(plan.suggestedDownloads,[]);
});
test('installed model still fails closed with inadequate RAM or unreviewed license',()=>{
 const asr=find('canary');
 const badRam=planSpeechStack({target:'de',device:{...device,totalRamMb:100},catalog,installedIds:[asr.pack.id]});
 assert.equal(badRam.asr.source,'none');
 const unreviewed=catalog.map(e=>e.pack.id===asr.pack.id?{...e,pack:{...e.pack,licenseReviewed:false}}:e);
 const badLicense=planSpeechStack({target:'de',device,catalog:unreviewed,installedIds:[asr.pack.id]});
 assert.equal(badLicense.asr.source,'none');
});
