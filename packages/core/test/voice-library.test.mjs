import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authoredVoiceCues,authoringInventory,voiceCueById,audioCueForDialogue,answerAudioCuesForDialogue,
  cueFingerprint,planVoiceOutput,targetLanguages,guidedDialogues,lessonsFor
} from '../dist/index.js';
const first=authoredVoiceCues[0];
const asset={cueId:first.id,fingerprint:cueFingerprint(first.text),language:first.language,locale:first.locale,
  path:'voices/en-CA/example.m4a',format:'m4a',sha256:'a'.repeat(64),license:'voicefirst-original'};
const offline=new Set([asset.path]);
test('every authored question and micro-lesson prompt has a unique stable audio cue',()=>{
  assert.equal(new Set(authoredVoiceCues.map(c=>c.id)).size,authoredVoiceCues.length);
  assert.ok(authoredVoiceCues.length>180); // questions, reviewed answer alternatives and lesson prompts
  assert.equal(authoredVoiceCues.filter(c=>c.kind==='dialogue-question').length,48);
  assert.deepEqual(authoringInventory().map(x=>x.language),targetLanguages);
  for(const d of guidedDialogues)for(const turn of d.turns)
    {assert.equal(audioCueForDialogue(d.id,turn.id).text,turn.teacherCue);
    assert.deepEqual(answerAudioCuesForDialogue(d.id,turn.id).map(x=>x.text),turn.acceptedReplies);}
  assert.equal(voiceCueById('not-a-cue'),undefined);
});
test('a locally verified original recording takes precedence over on-device speech',()=>{
  const result=planVoiceOutput({cue:first,assets:[asset],installedAssets:offline,
    voices:[{identifier:'os',locale:first.locale,offlineVerified:true}],requireOffline:true});
  assert.equal(result.kind,'asset');
});
test('declared assets are not playable unless a local verified copy is installed',()=>{
  const result=planVoiceOutput({cue:first,assets:[asset],installedAssets:new Set(),requireOffline:true});
  assert.deepEqual([result.kind,result.reason],['unavailable','no-verified-offline-voice']);
});
test('recording invalidated when author changes the question or changes locale',()=>{
  const modified={...first,text:first.text+' changed'};
  const result=planVoiceOutput({cue:modified,assets:[asset],installedAssets:offline,requireRecorded:true});
  assert.deepEqual([result.kind,result.reason],['unavailable','asset-required']);
  assert.equal(planVoiceOutput({cue:first,assets:[{...asset,locale:'en-US'}],installedAssets:offline,requireRecorded:true}).kind,'unavailable');
});
test('rejects path traversal, URLs, invalid checksums and incompatible format',()=>{
  for(const change of [{path:'../escape.mp3'},{path:'https://example.org/audio.m4a'},
    {path:'voices/../escape.m4a'},{sha256:'fake'},{format:'mp3'}, {license:'licensed-third-party'}]){
    assert.equal(planVoiceOutput({cue:first,assets:[{...asset,...change}],installedAssets:new Set([asset.path,change.path]),requireRecorded:true}).kind,'unavailable');
  }
});
test('licensed assets require an explicit permission reference',()=>{
  const licensed={...asset,license:'licensed-third-party',permissionReference:'contract-a-2026'};
  assert.equal(planVoiceOutput({cue:first,assets:[licensed],installedAssets:offline,requireRecorded:true}).kind,'asset');
});
test('offline strict mode refuses an unverified system voice and never contacts a server',()=>{
  const v=[{identifier:'candidate',locale:first.locale,offlineVerified:false}];
  assert.equal(planVoiceOutput({cue:first,voices:v,requireOffline:true}).kind,'unavailable');
  const p=planVoiceOutput({cue:first,voices:v,requireOffline:false});
  assert.equal(p.kind,'native-tts');assert.equal(p.offlineGuaranteed,false);
});
test('exact regional accent takes priority over a general language fallback',()=>{
  const line=authoredVoiceCues.find(x=>x.language==='fr-CA');
  const p=planVoiceOutput({cue:line,voices:[
    {identifier:'fr-FR',locale:'fr-FR',offlineVerified:true,quality:'Enhanced'},
    {identifier:'fr-CA',locale:'fr-CA',offlineVerified:true,quality:'Default'}],requireOffline:true});
  assert.equal(p.kind,'native-tts');assert.equal(p.voice.identifier,'fr-CA');
});
test('an enhanced voice wins between voices of same region',()=>{
  const p=planVoiceOutput({cue:first,voices:[
    {identifier:'standard',locale:first.locale,offlineVerified:true,quality:'Default'},
    {identifier:'enhanced',locale:first.locale,offlineVerified:true,quality:'Enhanced'}]});
  assert.equal(p.voice.identifier,'enhanced');
});
test('the planner rejects invalid cue metadata',()=>{
  assert.throws(()=>planVoiceOutput({cue:{...first,locale:'zz-ZZ'}}),/Invalid voice cue/);
});

test('all authored exercises have stable cue metadata in all six languages',()=>{
 const cues=authoredVoiceCues.filter(c=>c.kind==='lesson-phrase');
 assert.equal(cues.length,336);
 assert.equal(authoredVoiceCues.length,518);
 assert.equal(new Set(cues.map(c=>c.id)).size,336);
 for(const language of targetLanguages){
  const lessons=lessonsFor(language);
  assert.equal(lessons.length,14);
  assert.equal(cues.filter(c=>c.language===language).length,56);
  for(const lesson of lessons){
   for(const exercise of lesson.exercises){
    const cue=voiceCueById(`lesson/${lesson.id}/${exercise.id}`);
    assert.ok(cue,'missing authored exercise cue '+exercise.id);
    assert.equal(cue.text,exercise.utterance);
    assert.equal(cue.locale,authoringInventory().find(x=>x.language===language).locale);
    assert.equal(cue.source,'voicefirst-original');
   }
  }
 }
});
test('newly indexed course cues do not claim offline speech without a verified voice',()=>{
 for(const language of targetLanguages){
  const last=lessonsFor(language).at(-1);
  for(const exercise of last.exercises){
   const cue=voiceCueById(`lesson/${last.id}/${exercise.id}`);
   const plan=planVoiceOutput({cue,voices:[],assets:[],installedAssets:new Set(),requireOffline:true});
   assert.equal(plan.kind,'unavailable');
  }
 }
});
