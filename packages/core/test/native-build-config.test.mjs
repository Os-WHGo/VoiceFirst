import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=JSON.parse(readFileSync(new URL('../../../mobile/app.json',import.meta.url),'utf8')).expo;
const eas=JSON.parse(readFileSync(new URL('../../../mobile/eas.json',import.meta.url),'utf8'));

test('mobile native config enables on-device speech plugin with explicit microphone usage and no background recording',()=>{
 const voice=app.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-speech-recognition');
 const audio=app.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-audio');
 assert.ok(voice);assert.ok(audio);
 assert.ok(voice[1].microphonePermission.length>20);
 assert.ok(voice[1].speechRecognitionPermission.length>20);
 assert.equal(audio[1].enableBackgroundRecording,false);
 assert.equal(audio[1].enableBackgroundPlayback,false);
 assert.match(app.ios.bundleIdentifier,/^[a-z]+(\.[a-z0-9]+){2,}$/);
 assert.equal(app.ios.bundleIdentifier,app.android.package);
});
test('native preview profiles produce installable Android APK and simulator-only iOS build, no stores',()=>{
 assert.equal(eas.build['android-apk'].distribution,'internal');
 assert.equal(eas.build['android-apk'].android.buildType,'apk');
 assert.equal(eas.build['ios-simulator'].ios.simulator,true);
 assert.equal(eas.build.production,undefined);
});
