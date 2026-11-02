/** Synthetic fixtures test the contract, NOT the contents of an inaccessible historical ZIP. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHistoricalNormalizedCurriculum} from '../dist/index.js';

const langs=['en-CA','fr-CA','es','pt-BR','de','it'];
const levels=['A0','A1','A2','B1'];
const unit=(level,i,language)=>{
 const objective_id=`${level}.${String(i).padStart(2,'0')}`;
 const id=`${objective_id}.${language}`;
 return {id,objective_id,level,language,editorial_status:'draft-requires-native-review',
  stages:Array.from({length:level==='A0'?3:4},()=>({kind:'listening',source_task:{prompt_text_fallback:'Author-review required'}})),
  source_payload:{id,level,target_language:language}};
};
const packageFor=(items)=>({
 schema:'voicefirst.curriculum-content.normalized.v1',
 status:'draft-requires-native-review',
 items,
 counts:{variants:items.length,stage_instances:items.reduce((n,x)=>n+x.stages.length,0),
  by_level:Object.fromEntries(levels.map(level=>[level,items.filter(x=>x.level===level).length]))}
});
test('historical A0–B1 180-variant, 684-stage inventory is structurally reconcilable, never importable',()=>{
 // Historical totals as specified in the original inventory, but no source bytes duplicated.
 const items=levels.flatMap(level=>langs.flatMap(language=>
  Array.from({length:level==='A0'?6:8},(_,i)=>unit(level,i+1,language))));
 const result=inspectHistoricalNormalizedCurriculum(packageFor(items));
 assert.equal(result.valid,true,JSON.stringify(result.issues));
 assert.equal(result.variants,180);
 assert.equal(result.stageInstances,684);
 assert.deepEqual(result.byLevel,{A0:36,A1:48,A2:48,B1:48});
 assert.ok(langs.every(lang=>result.byLanguage[lang]===30));
 assert.equal(result.readyForImport,0);
 assert.equal(result.publicAvailable,false);
});
test('historical normalized candidates cannot claim publication, changed sources or fabricated totals',()=>{
 const item=unit('A1',1,'fr-CA'),source=packageFor([item]);
 assert.equal(inspectHistoricalNormalizedCurriculum(source).valid,true);
 const invalid=[
  {...source,status:'published'},
  {...source,counts:{...source.counts,variants:180}},
  {...source,counts:{...source.counts,stage_instances:684}},
  {...source,counts:{...source.counts,by_level:{A0:0,A1:2,A2:0,B1:0}}},
  {...source,items:[item,item]},
  {...source,items:[{...item,source_payload:{...item.source_payload,language:'de',target_language:undefined}}]},
  {...source,items:[{...item,editorial_status:'reviewed'}]},
  {...source,items:[{...item,stages:[{kind:'listening'}]}]},
  {...source,items:[{...item,id:'A1.01.de'}]},
  {...source,items:[{...item,level:'C2'}]},
 ];
 for(const specimen of invalid){
  const report=inspectHistoricalNormalizedCurriculum(specimen);
  assert.equal(report.valid,false,JSON.stringify(specimen).slice(0,120));
  assert.equal(report.readyForImport,0);
  assert.equal(report.publicAvailable,false);
 }
});
test('inspector never returns learner answers or editable curricular content',()=>{
 const item=unit('B1',1,'it');
 const raw=packageFor([item]);
 const report=inspectHistoricalNormalizedCurriculum(raw);
 assert.equal(report.valid,true);
 assert.equal('items' in report,false);
 assert.equal('source_payload' in report,false);
 assert.deepEqual(raw.items[0].source_payload,item.source_payload,'source stays unmodified');
});
