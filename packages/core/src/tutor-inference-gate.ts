/** Fail-closed boundary for optional generative tutoring. No model or network is invoked here. */
import {lessonsFor} from './course.js';
import {checkTutorScope,buildScopedTutorInstruction,type TutorRequest,type TutorScopeDecision} from './local-tutor-scope.js';
import {type TargetLanguage,targetLanguages} from './types.js';
import type {AgeStage} from './learning-paths.js';
export interface TutorInferenceRequest {target:TargetLanguage;stage:AgeStage;request:TutorRequest;modelReady:boolean;guardianApproved:boolean;networkConsent:boolean;execution:'local'|'online'}
export type TutorInferenceDecision={status:'blocked';reason:'invalid-language'|'minor-review'|'no-guardian-consent'|'model-not-ready'|'online-consent-required'|'outside-curriculum'|'scope-rejected'}|{status:'ready';instruction:string;learnerText:string;execution:'local'|'online';lessonId:string};
export function authorizeTutorInference(input:TutorInferenceRequest):TutorInferenceDecision {
 if(!targetLanguages.includes(input.target))return {status:'blocked',reason:'invalid-language'};
 if(input.stage!=='adult')return {status:'blocked',reason:input.guardianApproved?'minor-review':'no-guardian-consent'};
 if(!input.modelReady)return {status:'blocked',reason:'model-not-ready'};
 if(input.execution==='online'&&!input.networkConsent)return {status:'blocked',reason:'online-consent-required'};
 const scope: TutorScopeDecision=checkTutorScope(input.request);
 if(!scope.allowed)return {status:'blocked',reason:'scope-rejected'};
 const lesson=lessonsFor(input.target).find(l=>l.id===scope.lessonId);
 if(!lesson)return {status:'blocked',reason:'outside-curriculum'};
 const context=lesson.goal[input.target]+'; '+lesson.exercises.map(e=>e.utterance).join('; ');
 return {status:'ready',instruction:buildScopedTutorInstruction(scope,context),learnerText:scope.learnerText,execution:input.execution,lessonId:lesson.id};
}
