/** Bridge to llama.rn's documented initLlama/completion API.
 * The native package is NOT bundled yet: inject its actual initLlama export from a
 * separately validated development build. No network requests or model downloads. */
import type {NativeLocalTutor} from '@voicefirst/core';
type ChatMessage={role:'system'|'user';content:string};
type LlamaContext={completion(params:{messages:ChatMessage[];n_predict:number;temperature:number;stop:string[]}):Promise<{text:string}>;release():Promise<void>};
export type LlamaInitializer=(params:{model:string;n_ctx:number;n_gpu_layers:number})=>Promise<LlamaContext>;
export interface LlamaSession {adapter:NativeLocalTutor;close():Promise<void>}
const STOP=['<|im_end|>','<|eot_id|>','</s>','<|endoftext|>'];
export async function openLlamaRnSession(args:{modelId:string;verifiedFileUri:string;initLlama:LlamaInitializer;contextTokens:number}):Promise<LlamaSession>{
 if(!/^[a-zA-Z0-9._-]{1,100}$/.test(args.modelId)||!args.verifiedFileUri.startsWith('file:///')||args.verifiedFileUri.includes('..')||args.verifiedFileUri.includes('%')||!Number.isInteger(args.contextTokens)||args.contextTokens<512||args.contextTokens>8192)throw Error('Invalid local model session');
 const context=await args.initLlama({model:args.verifiedFileUri,n_ctx:args.contextTokens,n_gpu_layers:0});
 let closed=false;let busy=false;
 return {adapter:{modelId:args.modelId,async infer(prompt,input,limitTokens){
  if(closed||busy)throw Error('Session unavailable');
  if(!Number.isInteger(limitTokens)||limitTokens<1||limitTokens>256)throw Error('Invalid token budget');
  busy=true;
  try{const result=await context.completion({messages:[{role:'system',content:prompt},{role:'user',content:input}],n_predict:limitTokens,temperature:0.2,stop:STOP});return result.text;}
  finally{busy=false;}
 }},async close(){if(closed)return;if(busy)throw Error('Inference in progress');closed=true;await context.release();}};
}
