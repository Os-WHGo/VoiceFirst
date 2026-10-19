import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// Compile only the isolated adapter. Its core dependency is type-only, so
// the test executes without downloading llama.rn or starting native modules.
const source=await readFile(new URL('../../mobile/llama-rn-adapter.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {openLlamaRnSession}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const uri='file:///private/voicefirst/models/test.gguf';
test('native bridge forwards bounded prompts, returns output and releases context',async()=>{
 let loaded,params,released=0;
 const session=await openLlamaRnSession({modelId:'test',verifiedFileUri:uri,contextTokens:1024,initLlama:async x=>{
  loaded=x;return {completion:async p=>{params=p;return{text:'Hello!'}},release:async()=>{released++}};
 }});
 assert.deepEqual(loaded,{model:uri,n_ctx:1024,n_gpu_layers:0});
 assert.equal(await session.adapter.infer('Tutor','Hi',24),'Hello!');
 assert.equal(params.n_predict,24);assert.equal(params.messages[0].role,'system');
 await session.close();await session.close();assert.equal(released,1);
 await assert.rejects(session.adapter.infer('Tutor','Hi',24),/unavailable/);
});
test('rejects unsafe paths and token budgets before native calls',async()=>{
 for(const bad of ['https://server/model.gguf','file:///a/../b','file:///a/%2e%2e/b','file:///a?b']){
  await assert.rejects(openLlamaRnSession({modelId:'test',verifiedFileUri:bad,contextTokens:1024,initLlama:async()=>{throw Error('must not call')}}),/Invalid/);
 }
 const session=await openLlamaRnSession({modelId:'test',verifiedFileUri:uri,contextTokens:1024,initLlama:async()=>({completion:async()=>({text:'ok'}),release:async()=>{}})});
 await assert.rejects(session.adapter.infer('Tutor','Hi',257),/token budget/);
 await assert.rejects(session.adapter.infer('','Hi',24),/input/);
 await session.close();
});
test('serializes inference and rejects malformed output',async()=>{
 let finish;
 const session=await openLlamaRnSession({modelId:'test',verifiedFileUri:uri,contextTokens:1024,initLlama:async()=>({
  completion:async()=>new Promise(resolve=>{finish=resolve}),release:async()=>{}
 })});
 const pending=session.adapter.infer('Tutor','Hi',10);
 await assert.rejects(session.adapter.infer('Tutor','Hi',10),/unavailable/);
 await assert.rejects(session.close(),/in progress/);
 finish({text:' '});
 await assert.rejects(pending,/output/);
 await session.close();
});
