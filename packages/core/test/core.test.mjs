import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVoiceCommand, initialSession, transition, scheduleReview, dueReviews, missionsFor, defaultPreferences, validatePreferences, learningPairs, targetLanguages, languageNames } from '../dist/index.js';
test('Spanish accents and politeness', () => { assert.deepEqual(parseVoiceCommand('Por favor, repítelo'),{ type:'REPEAT' }); assert.deepEqual(parseVoiceCommand('Más lento'), {type:'SLOWER'}); });
test('English and French commands', () => { assert.deepEqual(parseVoiceCommand('Please, repeat that'), { type:'REPEAT' }); assert.deepEqual(parseVoiceCommand('parle plus lentement'), { type:'SLOWER' }); });
test('No accidental commands in ordinary utterances', () => { assert.equal(parseVoiceCommand('I said pause while talking to the teacher'), null); assert.equal(parseVoiceCommand('The word pause is interesting'), null); assert.equal(parseVoiceCommand(''), null); });
test('Language switching', () => { assert.deepEqual(parseVoiceCommand('Cambia a francés'), { type:'TARGET', language:'fr-CA' }); assert.deepEqual(parseVoiceCommand('Explain in Spanish'), {type:'EXPLAIN_IN',language:'es'}); });
test('Session happy path', () => { let s=initialSession(); s=transition(s,{type:'START'}); assert.equal(s.phase,'listening'); s=transition(s,{type:'USER_UTTERANCE', transcript:'Hello'}); assert.equal(s.phase,'thinking'); s=transition(s,{type:'ANSWER_READY',turnId:s.turnId}); assert.equal(s.phase,'speaking'); s=transition(s,{type:'SPEECH_DONE'}); assert.equal(s.phase,'listening'); });
test('Stale LLM response discarded after pause', () => { let s=transition(initialSession(),{type:'START'}); s=transition(s,{type:'USER_UTTERANCE',transcript:'A sentence'}); const turn=s.turnId; s=transition(s,{type:'PAUSE'}); s=transition(s,{type:'ANSWER_READY',turnId:turn}); assert.equal(s.phase,'paused'); });
test('Interruption and recovery', () => { let s=transition(initialSession(),{type:'START'}); s=transition(s,{type:'INTERRUPTED'}); assert.equal(s.phase,'interrupted'); s=transition(s,{type:'RECOVER'}); assert.equal(s.phase,'listening'); });
test('Barge in invalidates turn', () => { let s=transition(initialSession(),{type:'START'}); s=transition(s,{type:'USER_UTTERANCE',transcript:'A'}); s=transition(s,{type:'ANSWER_READY',turnId:s.turnId}); const turn=s.turnId; s=transition(s,{type:'BARGE_IN'}); assert.equal(s.phase,'listening'); assert.ok(s.turnId>turn); });
test('Resume inactive is no-op', () => { const s=initialSession(); assert.deepEqual(transition(s,{type:'RESUME'}), s); });
test('An empty utterance leaves listening', () => { const s=transition(initialSession(),{type:'START'}); assert.deepEqual(transition(s,{type:'USER_UTTERANCE',transcript:'   '}),s); });
test('SM-2 review schedule and due filtering',()=> { const now=new Date('2026-10-16T00:00:00.000Z'); const item={id:'a',intervalDays:1,ease:2.5,repetitions:0,dueAt:now.toISOString()}; const next=scheduleReview(item,5,now); assert.equal(next.intervalDays,1); assert.equal(next.repetitions,1); assert.deepEqual(dueReviews([item,next],now).map(x=>x.id),['a']); });
test('Review failure resets repetitions and clamps ease',()=> { const now=new Date('2026-10-16T00:00:00Z'); const out=scheduleReview({id:'x',intervalDays:100,ease:1.3,repetitions:5,dueAt:now.toISOString()},0,now); assert.equal(out.repetitions,0); assert.equal(out.intervalDays,1); assert.ok(out.ease>=1.3); });
test('Original mission samples span A0 through C2 in both languages',()=> { for(const lang of targetLanguages) { const m=missionsFor(lang); assert.equal(m.length,7); assert.deepEqual(m.map(x=>x.level),['A0','A1','A2','B1','B2','C1','C2']); } });
test('Individual preferences validate input ranges',()=> { assert.equal(validatePreferences({...defaultPreferences,speechRate:8}).speechRate,1.2); assert.equal(validatePreferences({...defaultPreferences,answerWaitSeconds:-2}).answerWaitSeconds,1); });

test('Six languages generate 30 distinct native-target routes',()=>{ const pairs=learningPairs(); assert.equal(pairs.length,30); assert.equal(new Set(pairs.map(([a,b])=>`${a}>${b}`)).size,30); for(const [a,b] of pairs){ assert.notEqual(a,b); assert.ok(languageNames[a] && languageNames[b]); } });
test('Five new target voices and help languages parse commands',()=>{ for(const [phrase,lang] of [['cambia a español','es'],['switch to portuguese','pt-BR'],['cambia a alemán','de'],['switch to italian','it']]){ assert.deepEqual(parseVoiceCommand(phrase),{type:'TARGET',language:lang}); } assert.deepEqual(parseVoiceCommand('explica en italiano'),{type:'EXPLAIN_IN',language:'it'}); });
test('Same language as native language is rejected',()=>{ assert.throws(()=>validatePreferences({...defaultPreferences,target:'es',nativeLanguage:'es'}),/must differ/); });
import { buildTutorInstructions, createRealtimeSecretRequest, isEphemeralSecretResponse } from '../dist/index.js';
test('tutor explains slang by contextual meaning, not literal translation',()=>{
  const instructions=buildTutorInstructions(defaultPreferences,{level:'B1'});
  assert.match(instructions,/slang, idioms/);
  assert.match(instructions,/Do not translate literally/);
  assert.match(instructions,/uncertain ASR transcript/);
});
test('six native-target pairs produce correctly targeted tutor instructions',()=>{
  for (const [nativeLanguage,target] of learningPairs()) {
    const text=buildTutorInstructions({...defaultPreferences,nativeLanguage,target});
    assert.ok(text.includes(`(${nativeLanguage})`));assert.ok(text.includes(`(${target})`));
  }
});
test('custom learner choices change tutor policy without diagnostic assumptions',()=>{
  const text=buildTutorInstructions({...defaultPreferences,correctionMode:'on-request',interactionStyle:'flexible',lowStimulation:true});
  assert.match(text,/Correct only when the learner explicitly asks/);
  assert.match(text,/Allow free conversation/);
  assert.match(text,/no surprise quizzes/);
  assert.doesNotMatch(text, /you have ADHD|you are autistic/i);
});
test('realtime session request uses short-lived secret, limited model and no silent auto-answer in until-ready mode',()=>{
  const r=createRealtimeSecretRequest(defaultPreferences);
  assert.equal(r.session.model,'gpt-realtime-2.1-mini');
  assert.equal(r.expires_after.seconds,60);
  assert.equal(r.session.audio.input.turn_detection,null);
  assert.equal(r.session.output_modalities[0],'audio');
});
test('automatic response mode supports speech interruptions and bounded silence',()=>{
  const r=createRealtimeSecretRequest({...defaultPreferences,answerWaitMode:'automatic',answerWaitSeconds:60}, {model:'gpt-realtime-2.1'});
  assert.equal(r.session.audio.input.turn_detection.type,'server_vad');
  assert.equal(r.session.audio.input.turn_detection.silence_duration_ms,2000);
  assert.equal(r.session.audio.input.turn_detection.interrupt_response,true);
});
test('unapproved model and invalid ephemeral payloads are rejected',()=>{
  assert.throws(()=>createRealtimeSecretRequest(defaultPreferences,{model:'something-else'}),/Unsupported/);
  assert.equal(isEphemeralSecretResponse({value:'sk_permanent',expires_at:4}),false);
  assert.equal(isEphemeralSecretResponse({value:'ek_example',expires_at:1700000000}),true);
});
