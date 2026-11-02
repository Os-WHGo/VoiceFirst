import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../../mobile/modules/voicefirst-audio-route/'+p,import.meta.url),'utf8');

test('local Expo microphone observer has both platforms but requests no new permissions or recording',()=>{
 const conf=JSON.parse(read('expo-module.config.json'));
 assert.deepEqual(conf.platforms,['apple','android']);
 assert.deepEqual(conf.apple.modules,['VoiceFirstAudioRouteModule']);
 assert.deepEqual(conf.android.modules,['expo.modules.voicefirstaudioroute.VoiceFirstAudioRouteModule']);
 assert.match(read('android/build.gradle'),/useCoreDependencies\(\)/);
 assert.doesNotMatch(read('android/src/main/AndroidManifest.xml'),/uses-permission/);
});
test('iOS observes current input only and never configures or activates an audio session',()=>{
 const source=read('ios/VoiceFirstAudioRouteModule.swift');
 assert.match(source,/AVAudioSession\.sharedInstance\(\)\.currentRoute\.inputs/);
 assert.match(source,/AVAudioSession\.routeChangeNotification/);
 assert.match(source,/OnStartObserving/);
 assert.match(source,/OnStopObserving/);
 assert.doesNotMatch(source,/setActive\s*\(/);
 assert.doesNotMatch(source,/setCategory\s*\(/);
 assert.doesNotMatch(source,/AVAudioRecorder/);
 assert.doesNotMatch(source,/\.currentRoute\.outputs/);
});
test('Android enumerates input inventory and never substitutes a connected headset as ASR input',()=>{
 const source=read('android/src/main/java/expo/modules/voicefirstaudioroute/VoiceFirstAudioRouteModule.kt');
 assert.match(source,/AudioManager\.GET_DEVICES_INPUTS/);
 assert.match(source,/AudioDeviceInfo\.TYPE_BLUETOOTH_SCO/);
 assert.match(source,/"activeInputId"\s+to\s+null/);
 assert.match(source,/registerAudioDeviceCallback/);
 assert.match(source,/unregisterAudioDeviceCallback/);
 assert.doesNotMatch(source,/GET_DEVICES_OUTPUTS/);
 assert.doesNotMatch(source,/AudioRecord\(/);
 assert.doesNotMatch(source,/MediaRecorder\(/);
 assert.doesNotMatch(source,/startBluetoothSco/);
});
