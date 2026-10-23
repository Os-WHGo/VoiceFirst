import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,lessonsFor,dialoguesFor,evaluateAnswer,answerKeyForExercise,answerKeyForDialogueTurn,answerFeedbackText,answerOutcomeCopy,answerFindingCopy,checkUtterance,recordCourseAttempt,newCourseProgress,matchesAnswerPattern,normalizedUtterance} from '../dist/index.js';

const typed={kind:'typed'},spoken={kind:'speech',confidence:'high'},unsure={kind:'speech',confidence:'low'};
const exercise=(lang,topic,stage='recall')=>lessonsFor(lang).flatMap(l=>l.exercises).find(e=>e.id.startsWith(`${lang}-${topic}-${stage}`));
const evaluate=(lang,topic,text,source=typed)=>evaluateAnswer(answerKeyForExercise(exercise(lang,topic),lang),text,source);
const codes=e=>e.findings.map(f=>f.code);

test('every authored answer in all six languages evaluates as correct, typed and spoken',()=>{
 let checked=0;
 for(const lang of targetLanguages){
  for(const lesson of lessonsFor(lang))for(const ex of lesson.exercises){
   const key=answerKeyForExercise(ex,lang);
   for(const answer of [...ex.alternatives,...(ex.acceptedVariants??[])])for(const source of [typed,spoken]){
    const r=evaluateAnswer(key,answer,source);
    assert.equal(r.outcome,'correct',`${ex.id}: ${answer}`);assert.equal(r.countsAsSuccess,true);checked++;
   }
  }
  for(const dialogue of dialoguesFor(lang))for(const turn of dialogue.turns)for(const reply of turn.acceptedReplies){
   assert.equal(evaluateAnswer(answerKeyForDialogueTurn(turn,lang),reply,spoken).outcome,'correct',`${turn.id}: ${reply}`);checked++;
  }
 }
 assert.ok(checked>1000);
});
test('harmless differences are accepted and explained as valid variants',()=>{
 assert.equal(evaluate('en-CA','water','can i have some water please').outcome,'correct');
 const contraction=evaluate('en-CA','allergy',"I'm allergic to peanuts");
 assert.equal(contraction.outcome,'correct');
 const expanded=evaluate('en-CA','clarify','Could you repeat that please');
 assert.equal(expanded.outcome,'correct');
 const variant=evaluateAnswer({language:'en-CA',models:['I cannot find it.']},"I can't find it",typed);
 assert.equal(variant.outcome,'correct-variant');assert.deepEqual(codes(variant),['contraction']);
 const accents=evaluate('es','allergy','Soy alergica al mani');
 assert.equal(accents.outcome,'correct-variant');assert.ok(codes(accents).includes('accent-marks'));
 assert.equal(evaluate('es','allergy','soy alergica al mani',spoken).outcome,'correct','speech spelling is not the learner\'s');
 const umlaut=evaluate('de','allergy','Ich bin allergisch gegen Erdnuesse.');
 assert.equal(umlaut.outcome,'correct-variant');assert.deepEqual(codes(umlaut),['umlaut-spelling']);
 const digits=evaluateAnswer({language:'fr-CA',models:['J’ai deux billets.']},'j ai 2 billets',spoken);
 assert.equal(digits.outcome,'correct-variant');assert.ok(codes(digits).includes('number-form'));
 const spokenPt=evaluateAnswer({language:'pt-BR',models:['Eu vou para casa.']},'eu vou pra casa',spoken);
 assert.equal(spokenPt.outcome,'correct-variant');assert.deepEqual(codes(spokenPt),['colloquial-form']);
 const quebec=evaluateAnswer({language:'fr-CA',models:['Je ne peux pas venir.']},'Je peux pas venir',spoken);
 assert.equal(quebec.outcome,'correct-variant');
 assert.equal(evaluate('en-CA','payment','um can I pay by card',spoken).outcome,'correct');
 assert.equal(evaluate('en-CA','thanks','Thank you very much, really.').outcome,'correct-variant');
});
test('gendered and regional forms are valid answers in the micro-course',()=>{
 for(const [lang,topic,answer] of [['es','allergy','Soy alérgica a los cacahuetes.'],['es','allergy','Soy alérgico al maní.'],['pt-BR','allergy','Sou alérgica a amendoim.'],['pt-BR','thanks','Muito obrigada.'],['it','allergy','Sono allergica alle arachidi.']]){
  const ex=exercise(lang,topic);
  assert.equal(evaluateAnswer(answerKeyForExercise(ex,lang),answer,spoken).outcome,'correct');
  assert.equal(checkUtterance(ex,answer,lang,'high').kind,'match');
  const p=recordCourseAttempt(newCourseProgress(lang),ex,{kind:'match',recognized:answer},'2026-10-23');
  assert.equal(p.correct[ex.id],1);
 }
 for(const lesson of lessonsFor('es'))assert.ok(lesson.exercises.every(e=>e.alternatives.length===2),'model examples unchanged');
});
test('self-introduction accepts the learner name without storing it',()=>{
 for(const [lang,answer] of [['en-CA','My name is Ana Lucia.'],['fr-CA','Je m’appelle Sam.'],['es','Me llamo Noor.'],['pt-BR','Meu nome é Jo.'],['de','Ich heiße Kim.'],['it','Mi chiamo Lea.']]){
  const r=evaluate(lang,'introduce',answer,spoken);
  assert.equal(r.outcome,'correct',answer);
  assert.ok(codes(r).includes('personal-detail'));
  assert.ok(!JSON.stringify(r).match(/Ana|Sam\b|Noor|Jo\b|Kim|Lea/),'captured name never returned');
  assert.equal(checkUtterance(exercise(lang,'introduce'),answer,lang,'high').kind,'match');
 }
 assert.equal(matchesAnswerPattern('My name is {name}.','My name is',t=>normalizedUtterance(t,'en-CA')),false);
 assert.equal(matchesAnswerPattern('My name is {name}.','My name is a b c d',t=>normalizedUtterance(t,'en-CA')),false);
});
test('meaning changes are distinguished from form errors',()=>{
 for(const [lang,topic,answer] of [['en-CA','allergy','I am not allergic to peanuts.'],['de','allergy','Ich bin nicht allergisch gegen Erdnüsse.'],['es','payment','¿Puedo no pagar con tarjeta?'],['fr-CA','allergy','Je ne suis pas allergique aux arachides.']]){
  const r=evaluate(lang,topic,answer);
  assert.equal(r.outcome,'meaning-error',answer);assert.deepEqual(codes(r),['negation-changed']);assert.equal(r.countsAsError,true);
 }
 const missing=evaluateAnswer({language:'en-CA',models:['I do not eat meat.']},'I do eat meat',spoken);
 assert.equal(missing.outcome,'meaning-error');assert.deepEqual(codes(missing),['negation-missing']);
 const swap=evaluate('en-CA','payment','Can I pay by cash?');
 assert.equal(swap.outcome,'meaning-error');assert.equal(swap.findings[0].expected,'card');
 assert.equal(evaluate('en-CA','payment','pizza',spoken).findings[0].code,'unrelated');
 const spelling=evaluate('en-CA','payment','Can I pay by crad?');
 assert.equal(spelling.outcome,'minor-error');assert.deepEqual(spelling.findings,[{code:'spelling',expected:'card',received:'crad'}]);
 assert.equal(evaluate('en-CA','payment','I pay can by card?').findings[0].code,'word-order');
 const missingWord=evaluate('en-CA','water','Could I have water, please?');
 assert.equal(missingWord.outcome,'minor-error');assert.deepEqual(missingWord.findings,[{code:'missing-word',expected:'some'}]);
 assert.equal(missingWord.countsAsSuccess,false);
});
test('speech near-misses ask for confirmation and never count against the learner',()=>{
 for(const text of ['Can I pay by crad?','Can I pay','Can I pay by the card?']){
  const r=evaluate('en-CA','payment',text,spoken);
  assert.equal(r.outcome,'needs-confirmation',text);assert.equal(r.countsAsError,false);assert.equal(r.countsAsSuccess,false);
  assert.equal(r.closestAnswer,'Can I pay by card?');
 }
 const low=evaluate('en-CA','payment','Can I pay by card?',unsure);
 assert.equal(low.outcome,'needs-confirmation');assert.equal(low.matchedAnswer,undefined);
 assert.equal(evaluate('en-CA','payment','Something else entirely',unsure).outcome,'no-evidence');
 assert.equal(evaluate('en-CA','payment','   ',spoken).outcome,'no-evidence');
 for(const [lang,topic,answer] of [['es','payment','¿No puedo pagar con tarjeta?'],['it','payment','Non posso pagare con la carta?']])
  assert.equal(evaluate(lang,topic,answer).outcome,'needs-review','a negation before a complete answer is never auto-scored');
 const ambiguous=evaluate('en-CA','thanks','No, thank you very much.');
 assert.equal(ambiguous.outcome,'needs-review');assert.equal(ambiguous.countsAsError,false);assert.equal(ambiguous.countsAsSuccess,false);
});
test('pronunciation is never inferred from text',()=>{
 for(const text of ['Hello!','helo','xyz'])for(const source of [typed,spoken,unsure])
  assert.equal(evaluate('en-CA','greet',text,source)?.pronunciation??evaluateAnswer({language:'en-CA',models:['Hello!']},text,source).pronunciation,'not-assessed');
});
test('feedback is localized for all 30 directed pairs with every placeholder filled',()=>{
 assert.equal(learningPairs().length,30);
 const samples=[evaluate('en-CA','payment','Can I pay by crad?'),evaluate('en-CA','payment','Can I pay by crad?',spoken),evaluate('en-CA','allergy','I am not allergic to peanuts.'),evaluate('en-CA','thanks','No, thank you very much.'),evaluate('en-CA','water','Could I have water, please?')];
 for(const [known,target] of learningPairs()){
  const r=evaluateAnswer(answerKeyForExercise(lessonsFor(target)[0].exercises[2],target),'zzz qqq',typed);
  for(const e of [r,...samples]){
   const text=answerFeedbackText(e,known);
   assert.ok(text.length>5);assert.ok(!/[{}]/.test(text),text);
  }
 }
 for(const copy of [...Object.values(answerOutcomeCopy),...Object.values(answerFindingCopy)]){
  assert.deepEqual(Object.keys(copy).sort(),[...targetLanguages].sort());
  assert.ok(new Set(Object.values(copy)).size===6,'each language has its own wording');
 }
});
test('evaluator rejects unsupported languages and empty keys',()=>{
 assert.throws(()=>evaluateAnswer({language:'ja',models:['はい']},'はい',typed),/Unsupported/);
 assert.throws(()=>evaluateAnswer({language:'es',models:[' ']},'hola',typed),/no authored/);
});
test('real offline ASR output: recognizer word boundaries are not learner errors (PoC 2026-10-23)',()=>{
 // Transcripts produced by sherpa-onnx Whisper/Parakeet for correct synthetic speech in the voice-engine PoC.
 assert.equal(evaluate('de','clarify','könnten Sie das bitte wieder holen?',spoken).outcome,'correct');
 assert.equal(evaluate('de','directions','Wo ist die Bus halte Stelle?',spoken).outcome,'correct');
 assert.equal(evaluate('de','directions','Wo ist die Bushalte stelle?',spoken).outcome,'correct');
 const typedSplit=evaluate('de','clarify','Könnten Sie das bitte wieder holen?');
 assert.notEqual(typedSplit.outcome,'correct','typed word boundaries remain the learner\'s');
 // A cut-off tail never becomes an error when spoken.
 assert.equal(evaluate('es','directions','¿Dónde está la parada de aut',spoken).outcome,'needs-confirmation');
 // Short answers: recognizers drift to another language; ask instead of penalizing.
 for(const [lang,topic,heard] of [['pt-BR','greet','Hulk.'],['it','greet','So.'],['en-CA','greet','the Love.'],['es','greet','Well then.']]){
  const ex=lessonsFor(lang).flatMap(l=>l.exercises).find(e=>e.id===`${lang}-greet-recall-3`);
  const r=evaluateAnswer(answerKeyForExercise(ex,lang),heard,spoken);
  assert.equal(r.outcome,'needs-confirmation',`${lang}: ${heard}`);assert.equal(r.countsAsError,false);
 }
 assert.equal(evaluateAnswer({language:'es',models:['¡Hola!']},'Adiós',typed).outcome,'meaning-error','typed short answers are still checked');
 // Without calibrated confidence (Whisper reports none), mismatches are never errors.
 assert.equal(evaluate('fr-CA','directions','ou elle a redotobis',{kind:'speech',confidence:'unknown'}).outcome,'no-evidence');
});
