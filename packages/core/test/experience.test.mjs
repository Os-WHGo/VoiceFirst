import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultExperiencePreferences,validateExperiencePreferences,launchEligibility,explainPersonalization} from '../dist/index.js';
test('adults can customize independent of diagnoses without changing CEFR',()=>{
 const p=validateExperiencePreferences({...defaultExperiencePreferences,correctionTiming:'on-request',instructionFormat:'one-step',sensoryPresentation:'calm'});
 assert.equal(launchEligibility(p),'adult-preview');assert.equal(explainPersonalization(p).cefrCeiling,null);
 assert.equal(explainPersonalization(p).asksDiagnosis,false);
});
test('teen and younger profiles cannot be publicly launched from this metadata alone',()=>{
 for(const ageStage of ['preschool','primary','preteen','teen']){
  assert.equal(launchEligibility(validateExperiencePreferences({ageStage})),'child-profile-needs-review');
 }
});
test('unknown settings fall back safely, no forced streak pressure',()=>{
 const p=validateExperiencePreferences({correctionTiming:'disrupt-every-answer',ageStage:'fictitious',noStreakPressure:false,subtitles:false});
 assert.equal(p.ageStage,'adult');assert.equal(p.correctionTiming,'after-exercise');assert.equal(p.noStreakPressure,true);assert.equal(p.subtitles,false);
});
test('preference variants preserve learner control without diagnostic profiling',()=>{
 for(const timing of ['after-each-answer','after-exercise','on-request']){
  assert.equal(validateExperiencePreferences({correctionTiming:timing}).correctionTiming,timing);
 }
 const p=validateExperiencePreferences({returnToLastStep:false,answerControl:'auto-after-silence',sensoryPresentation:'standard'});
 assert.equal(p.returnToLastStep,false);assert.equal(p.answerControl,'auto-after-silence');
});

test('stored speech pace is clamped to safe allowed preferences without loss of adult controls',()=>{
 const baseline=validateExperiencePreferences({});
 assert.equal(baseline.speechRate,0.88);
 assert.equal(validateExperiencePreferences({...baseline,speechRate:0.75}).speechRate,0.75);
 for(const broken of [NaN,Infinity,-3,10,'0.8',null]){
  assert.equal(validateExperiencePreferences({...baseline,speechRate:broken}).speechRate,baseline.speechRate);
 }
 const old=validateExperiencePreferences({instructionFormat:'full-context',correctionTiming:'on-request'});
 assert.equal(old.instructionFormat,'full-context');
 assert.equal(old.speechRate,0.88);
});
