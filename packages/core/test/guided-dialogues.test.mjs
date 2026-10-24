import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,guidedDialogues,dialoguesFor,selectGuidedDialogues,dialogueAudioCue,
  newDialogueRun,evaluateDialogueTurn,recordDialogueResponse} from '../dist/index.js';

test('24 original guided dialogues across all six languages',()=>{
  assert.equal(guidedDialogues.length,24);
  for(const language of targetLanguages){const lessons=dialoguesFor(language);assert.equal(lessons.length,4);assert.equal(lessons[0].isFoundation,true);assert.ok(lessons.every(x=>x.turns.length===2&&x.original));}
});
test('all thirty directional language pairs have real native-language support and target voice cues',()=>{
  for(const [known,target] of learningPairs()){
    const d=dialoguesFor(target)[0];
    assert.ok(dialogueAudioCue(d,0,known,true).text);
    assert.equal(dialogueAudioCue(d,0,known,true).language,known);
    assert.equal(dialogueAudioCue(d,0,known,false).language,target);
  }
});
test('focus moves career tasks first but foundational and travel lessons remain',()=>{
  const p=selectGuidedDialogues('en-CA','work','adult');assert.equal(p.status,'available');
  assert.deepEqual(p.dialogues.map(x=>x.domain),['work','foundation','travel','shopping']);
});
test('child-facing paths stay gated until consent/pedagogical safety review',()=>{
  for(const age of ['preschool','primary','preteen','teen']){
    const p=selectGuidedDialogues('it','daily-life',age);
    assert.equal(p.status,'requires-child-safety-review');assert.equal(p.dialogues.length,0);
  }
});
test('multiple natural but human-curated correct responses are accepted, not translated copies',()=>{
  const d=dialoguesFor('en-CA').find(x=>x.domain==='work');const t=d.turns[0];
  assert.equal(evaluateDialogueTurn(t,'Do you need a hand?','en-CA','high').verdict,'accepted');
  assert.equal(evaluateDialogueTurn(t,'Can I help you?','en-CA','high').verdict,'accepted');
  assert.equal(evaluateDialogueTurn(t,'Your coworker is carrying a box','en-CA','high').verdict,'retry');
  assert.equal(evaluateDialogueTurn(t,'I cannot help you','en-CA','high').verdict,'retry');
});
test('uncertain speech cannot count as incorrect or correct; no forced progression',()=>{
  const d=dialoguesFor('fr-CA')[0];const t=d.turns[0];const p=newDialogueRun(d);
  assert.equal(evaluateDialogueTurn(t,'Je voudrais de l’eau','fr-CA','low').verdict,'uncertain');
  assert.equal(recordDialogueResponse(p,d,{verdict:'uncertain'}),p);
  assert.equal(recordDialogueResponse(p,d,{verdict:'retry'}).turnIndex,0);
});
test('two meaningful replies complete a conversation without replaying the teacher',()=>{
  const d=dialoguesFor('en-CA').find(x=>x.domain==='work');
  let p=newDialogueRun(d);
  let v=evaluateDialogueTurn(d.turns[0],'Can I help you?','en-CA','high');p=recordDialogueResponse(p,d,v);
  assert.equal(p.turnIndex,1);assert.equal(p.completed,false);
  v=evaluateDialogueTurn(d.turns[1],'Could you help me, please?','en-CA','high');p=recordDialogueResponse(p,d,v);
  assert.equal(p.completed,true);assert.equal(p.turnIndex,2);
  assert.equal(recordDialogueResponse(p,d,v),p);
});
test('a result is rejected if it belongs to another dialogue',()=>{
  const a=dialoguesFor('en-CA')[0],b=dialoguesFor('de')[0];
  assert.throws(()=>recordDialogueResponse(newDialogueRun(a),b,{verdict:'accepted'}),/mismatch/i);
});
test('support for selected level must not claim completed CEFR curriculum',()=>{
  assert.ok(guidedDialogues.every(x=>['A0','A1'].includes(x.level)));
  assert.equal(dialogueAudioCue(dialoguesFor('es')[0],99,'de',true),null);
});

test('teacher cues are questions or situations, not exact answer strings to echo',()=>{
 for(const d of guidedDialogues){for(const t of d.turns){
   assert.ok(!t.acceptedReplies.some(x=>x.toLocaleLowerCase()===t.teacherCue.toLocaleLowerCase()),t.id);
 }}
});
