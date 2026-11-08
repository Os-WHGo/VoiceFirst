import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const policySource=readFileSync('mobile/voice-lab-development-policy.ts','utf8');
const js=ts.transpileModule(policySource,{compilerOptions:{
 target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS
}}).outputText;
const module={exports:{}};
new Function('module','exports','URL',js)(module,module.exports,URL);
const allow=module.exports.privateVoiceLabDevUrl;

test('release and missing consent-to-config boundary never enables remote voice lab',()=>{
 for(const value of ['http://127.0.0.1:9000','http://192.168.1.3:9000','http://10.0.2.2:9000']){
  assert.equal(allow(value,false),null);
 }
 for(const value of [undefined,null,{},'',123,'http://localhost:8000/unsafe','http://localhost:8000/?token=unsafe'])
  assert.equal(allow(value,true),null);
});
test('development lab accepts only bounded plain HTTP on loopback or private LAN',()=>{
 for(const [value,expected] of [
  ['http://127.0.0.1:9000','http://127.0.0.1:9000'],
  ['http://localhost:3000/','http://localhost:3000'],
  ['http://10.0.2.2:8080','http://10.0.2.2:8080'],
  ['http://192.168.1.4:8080','http://192.168.1.4:8080'],
  ['http://172.16.0.3:9000','http://172.16.0.3:9000'],
  ['http://172.31.255.255:8080','http://172.31.255.255:8080']
 ])assert.equal(allow(value,true),expected);
 for(const value of [
  'http://example.com','https://example.com','https://127.0.0.1:9000',
  'http://8.8.8.8:8080','http://172.32.0.1:9000','http://169.254.1.1',
  'http://192.169.1.1','http://10.123.8.999',
  'http://user:pass@localhost:9000',
  'http://localhost:9000/#secret','http://localhost:9000/?key=123',
  'http://localhost:9000/path','ftp://localhost:8080',
  ' http://localhost:8000','http://localhost:8000 '
 ])assert.equal(allow(value,true),null,value);
});
test('release build hides online recorder, disables env configuration and denies fetch',()=>{
 const app=readFileSync('mobile/App.tsx','utf8');
 const screen=readFileSync('mobile/VoicePractice.tsx','utf8');
 assert.match(app,/\{__DEV__ && <VoicePractice /);
 assert.doesNotMatch(app,/\n\s*<VoicePractice /);
 assert.match(screen,/privateVoiceLabDevUrl\(process\.env\.EXPO_PUBLIC_VOICEFIRST_DEV_URL, __DEV__\)/);
 assert.match(screen,/if\(!__DEV__\|\|!DEV_URL\|\|phase!=='ready'/);
 assert.match(screen,/if\(!__DEV__\|\|!DEV_URL\|\|phase!=='recording'/);
 assert.match(screen,/if\(!__DEV__\)return null;/);
 assert.match(screen,/AppState\.addEventListener\('change'/);
 assert.match(screen,/if\(next!=='active'\)clearActiveLab\(\)/);
 assert.match(screen,/onlineConsentRef\.current=false/);
 assert.match(screen,/abort\.current\?\.abort\(\)/);
 assert.match(screen,/recorder\.stop\(\)/);
 assert.match(screen,/AppState\.currentState!=='active'/);
 assert.match(screen,/if\(!onlineConsentRef\.current\|\|AppState\.currentState!=='active'\)throw/);
});
