import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredSpeechCandidates,validateSpeechCatalog,assessModelFit,planSpeechStack,planPackRemoval,temporaryFilesToDelete} from '../dist/index.js';

const phone=(over={})=>({platform:'android',totalRamMb:6144,freeDiskBytes:4e9,osOnDeviceAsrLocales:[],osVoiceLocales:[],...over});
const reviewed=e=>({...e,pack:{...e.pack,licenseReviewed:true}});
test('measured candidates are structurally valid but never usable before license review',()=>{
 const v=validateSpeechCatalog(measuredSpeechCandidates);
 assert.deepEqual(v.problems,[]);assert.equal(v.licensesPending.length,measuredSpeechCandidates.length);
 for(const e of measuredSpeechCandidates){assert.match(e.pack.sha256,/^[a-f0-9]{64}$/);assert.equal(assessModelFit(e,phone()).usable,false);}
});
test('device fit checks memory, storage (archive plus extracted) and platform',()=>{
 const parakeet=reviewed(measuredSpeechCandidates.find(e=>e.pack.id.includes('parakeet')));
 assert.ok(assessModelFit(parakeet,phone({totalRamMb:2048})).problems.includes('memory'));
 assert.ok(assessModelFit(parakeet,phone({freeDiskBytes:9e8})).problems.includes('storage'));
 const fit=assessModelFit(parakeet,phone());
 assert.equal(fit.usable,true);assert.deepEqual(fit.problems,['not-device-tested']);
 assert.ok(fit.requiredDiskBytes>parakeet.pack.bytes+parakeet.installedBytes);
});
test('stack: installed model first, then OS recognizer, typing always available',()=>{
 const catalog=measuredSpeechCandidates.map(reviewed);
 const canary=catalog.find(e=>e.pack.id.includes('canary'));
 let plan=planSpeechStack({target:'es',device:phone({osOnDeviceAsrLocales:['es']}),catalog,installedIds:[canary.pack.id]});
 assert.deepEqual(plan.asr,{source:'installed-model',modelId:canary.pack.id,confidencePolicy:'confirm-every-answer',languageLock:true});
 plan=planSpeechStack({target:'es',device:phone({osOnDeviceAsrLocales:['es']}),catalog,installedIds:[]});
 assert.equal(plan.asr.source,'os-on-device');
 plan=planSpeechStack({target:'it',device:phone(),catalog,installedIds:[]});
 assert.equal(plan.asr.source,'none');assert.equal(plan.nonSpeechFallback,true);
 assert.ok(plan.suggestedDownloads.every(d=>!d.id.includes('canary')),'Canary has no Italian');
 assert.equal(plan.vad.source,'energy');assert.equal(plan.tts.source,'recorded-audio-only');
});
test('removal protects dependents and models in use; cleanup never touches installed files',()=>{
 const packs=[{id:'asr-a',dependencies:[],bytes:10},{id:'tts-b',dependencies:['asr-a'],bytes:5}];
 assert.deepEqual(planPackRemoval(packs,['asr-a','tts-b'],['asr-a'],[]),{status:'blocked',reason:'required-by-installed',ids:['tts-b']});
 assert.deepEqual(planPackRemoval(packs,['asr-a','tts-b'],['tts-b'],['tts-b']),{status:'blocked',reason:'in-use',ids:['tts-b']});
 assert.deepEqual(planPackRemoval(packs,['asr-a','tts-b'],['tts-b'],[]),{status:'ok',remove:['tts-b'],freedBytes:5});
 const files=[{path:'/data/packs/tmp/a.part',packId:'a',kind:'download'},{path:'/data/packs/a/model.onnx',packId:'a',kind:'installed'},{path:'/data/packs/tmp/b.part',packId:'b',kind:'staging'},{path:'/etc/passwd',packId:'a',kind:'download'},{path:'/data/packs/../x',packId:'a',kind:'download'}];
 assert.deepEqual(temporaryFilesToDelete(files,{a:{phase:'failed'},b:{phase:'staging'}},'/data/packs/'),['/data/packs/tmp/a.part']);
 assert.throws(()=>temporaryFilesToDelete(files,{},'data'),/Root/);
});
