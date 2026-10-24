/** Device-side benchmark harness for native local inference adapters. Never runs remotely. */
import type {NativeLocalTutor} from './local-tutor-adapter.js';
export type LocalBenchmarkResult={status:'measured';modelId:string;elapsedMs:number;characters:number;tokensLimit:number}|{status:'failed';reason:'invalid-input'|'inference-error'|'invalid-output'};
export async function benchmarkLocalInference(adapter:NativeLocalTutor,clock:()=>number,prompt:string,input:string,tokensLimit=64):Promise<LocalBenchmarkResult>{
 if(!adapter.modelId.trim()||!Number.isInteger(tokensLimit)||tokensLimit<1||tokensLimit>256||!prompt.trim()||!input.trim())return {status:'failed',reason:'invalid-input'};
 try{
  const start=clock();
  const output=await adapter.infer(prompt,input,tokensLimit);
  const end=clock();
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||typeof output!=='string'||!output.trim())return {status:'failed',reason:'invalid-output'};
  return {status:'measured',modelId:adapter.modelId,elapsedMs:end-start,characters:output.length,tokensLimit};
 }catch{return {status:'failed',reason:'inference-error'};}
}
