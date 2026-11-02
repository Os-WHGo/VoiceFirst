import test from 'node:test';
import assert from 'node:assert/strict';
import {selectOfflineSpeechCandidate} from '../dist/offline-speech-selection.js';

const model=(overrides={})=>({
 engine:'whisper-cpp',modelId:'test-model',supportedLocales:['en-CA'],
 readiness:'installed',licenseVerified:true,deviceTested:true,...overrides,
});

test('no model and blank locale never claim readiness',()=>{
 assert.equal(selectOfflineSpeechCandidate('en-CA',[]).status,'no-candidates');
 assert.equal(selectOfflineSpeechCandidate(' ',[model()]).status,'no-candidates');
});
test('language mismatch does not silently fall back to another locale',()=>{
 assert.equal(selectOfflineSpeechCandidate('fr-CA',[model()]).status,'unsupported-language');
 assert.equal(selectOfflineSpeechCandidate('en',[model()]).status,'unsupported-language');
});
test('uninstalled, unlicensed and untested models fail closed',()=>{
 assert.equal(selectOfflineSpeechCandidate('en-CA',[model({readiness:'not-installed'})]).status,'needs-installation');
 assert.equal(selectOfflineSpeechCandidate('en-CA',[model({licenseVerified:false})]).status,'needs-license-review');
 assert.equal(selectOfflineSpeechCandidate('en-CA',[model({deviceTested:false})]).status,'needs-device-test');
});
test('selects only a tested, installed and licensed matching candidate',()=>{
 const candidate=model({engine:'sherpa-onnx',modelId:'verified'});
 const result=selectOfflineSpeechCandidate('EN-ca',[
  model({engine:'moonshine',licenseVerified:false}),
  candidate,
 ]);
 assert.equal(result.status,'ready');
 assert.equal(result.candidate?.modelId,'verified');
});
test('cannot use unverified metadata to claim installation',()=>{
 assert.equal(selectOfflineSpeechCandidate('en-CA',[model({readiness:'unverified'})]).status,'needs-installation');
});
