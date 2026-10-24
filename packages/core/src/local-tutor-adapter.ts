/** Pure bridge between verified local-model metadata and a native inference runtime.
 * The caller supplies a native adapter. This module never contacts a server. */
import type {TargetLanguage} from './types.js';
import type {AgeStage} from './learning-paths.js';
import type {TutorRequest} from './local-tutor-scope.js';
import {authorizeTutorInference} from './tutor-inference-gate.js';
import {selectLocalTextModel,type LocalTextCandidate} from './local-inference-selection.js';
export interface NativeLocalTutor {modelId:string;infer(prompt:string,input:string,limitTokens:number):Promise<string>}
export type LocalTutorResult={status:'blocked';reason:string}|{status:'answered';text:string;modelId:string};
export async function runLocalTutor(args:{target:TargetLanguage;stage:AgeStage;request:TutorRequest;candidates:readonly LocalTextCandidate[];availableMemoryMb:number;adapter:NativeLocalTutor|null;maxOutputTokens?:number}):Promise<LocalTutorResult>{
 const selection=selectLocalTextModel(args.target,args.candidates,args.availableMemoryMb);
 if(selection.status!=='ready')return {status:'blocked',reason:selection.status};
 if(!args.adapter||args.adapter.modelId!==selection.candidate.id)return {status:'blocked',reason:'native-adapter-unavailable'};
 const scope=authorizeTutorInference({target:args.target,stage:args.stage,request:args.request,modelReady:true,guardianApproved:false,networkConsent:false,execution:'local'});
 if(scope.status!=='ready')return {status:'blocked',reason:scope.reason};
 const requested=args.maxOutputTokens??128;
 if(!Number.isInteger(requested)||requested<1)return {status:'blocked',reason:'invalid-token-limit'};
 const maxTokens=Math.min(requested,Math.min(256,selection.candidate.contextTokens));
 try{
  const response=await args.adapter.infer(scope.instruction,scope.learnerText,maxTokens);
  if(typeof response!=='string'||!response.trim()||response.length>2000)return {status:'blocked',reason:'invalid-model-response'};
  return {status:'answered',text:response.trim(),modelId:selection.candidate.id};
 }catch{return {status:'blocked',reason:'native-inference-failed'};}
}
