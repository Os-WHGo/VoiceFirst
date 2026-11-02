import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditVoiceFirstPrivacyConfig} from '../../../scripts/voicefirst-privacy-config.mjs';

const source=JSON.parse(readFileSync(new URL('../../../mobile/app.json',import.meta.url),'utf8'));
const clone=()=>JSON.parse(JSON.stringify(source));
const plugin=(cfg,name)=>cfg.expo.plugins.find(p=>Array.isArray(p)&&p[0]===name)[1];

test('shipping VoiceFirst source app config keeps microphones foreground-only',()=>{
 assert.deepEqual(auditVoiceFirstPrivacyConfig(source),{ok:true,errors:[]});
});
test('background audio/recording privileges are blocked until separately authorized',()=>{
 for(const property of ['enableBackgroundRecording','enableBackgroundPlayback']){
  const c=clone();plugin(c,'expo-audio')[property]=true;
  const r=auditVoiceFirstPrivacyConfig(c);
  assert.equal(r.ok,false);
  assert.match(r.errors.join(' '),/Background/);
 }
 const ios=clone();ios.expo.ios.infoPlist={UIBackgroundModes:['audio']};
 assert.equal(auditVoiceFirstPrivacyConfig(ios).ok,false);
 const android=clone();android.expo.android.permissions=['android.permission.FOREGROUND_SERVICE_MICROPHONE'];
 assert.equal(auditVoiceFirstPrivacyConfig(android).ok,false);
});
test('missing or ambiguous microphone and speech permissions fail closed',()=>{
 for(const which of ['expo-audio','expo-speech-recognition']){
  const c=clone();c.expo.plugins=c.expo.plugins.filter(x=>x[0]!==which);
  assert.equal(auditVoiceFirstPrivacyConfig(c).ok,false);
 }
 for(const [which,key] of [
  ['expo-audio','microphonePermission'],['expo-speech-recognition','microphonePermission'],
  ['expo-speech-recognition','speechRecognitionPermission']
 ]){
  const c=clone();plugin(c,which)[key]='';
  assert.equal(auditVoiceFirstPrivacyConfig(c).ok,false);
 }
 const malformed=clone();malformed.expo.plugins=null;
 assert.equal(auditVoiceFirstPrivacyConfig(malformed).ok,false);
});
test('normal explicitly requested microphone permission remains available for foreground lessons',()=>{
 const c=clone();c.expo.android.permissions=['android.permission.RECORD_AUDIO'];
 assert.equal(auditVoiceFirstPrivacyConfig(c).ok,true);
});
