import test from 'node:test';
import assert from 'node:assert/strict';
import {localModelState} from '../dist/index.js';
test('exact installed regional model is recognized, without claiming another dialect',()=>{
 const x={locales:['en-CA','en-US','fr-CA'],installedLocales:['en-US','fr-CA']};
 assert.equal(localModelState('en-US',x),'installed');
 assert.equal(localModelState('fr-CA',x),'installed');
 assert.equal(localModelState('en-CA',x),'missing');
 assert.equal(localModelState('en-GB',x),'unknown');
});
test('empty/unsupported device lists cannot be interpreted as positive model evidence',()=>{
 for(const x of [null,undefined,{},[],{locales:[],installedLocales:[]},
 {locales:['en-CA'],installedLocales:null},{locales:['en-CA'],installedLocales:['en-CA',null]}])
  assert.equal(localModelState('en-CA',x),'unknown');
});
test('case-insensitive BCP47 inventory does not collapse distinct locales',()=>{
 assert.equal(localModelState('pt-BR',{locales:['PT-br'],installedLocales:['pt-BR']}),'installed');
 assert.equal(localModelState('fr-CA',{locales:['fr-CA'],installedLocales:['fr-FR']}),'missing');
});

test('late inventory for the previous dialect never overwrites the new choice',async()=>{
 const {queryLocalModelState}=await import('../dist/index.js');
 let finish;let current=true;
 const pending=queryLocalModelState('en-CA',()=>new Promise(r=>{finish=r;}),()=>current);
 current=false;
 finish({locales:['en-CA'],installedLocales:['en-CA']});
 assert.equal(await pending,null);
 const latest=await queryLocalModelState('fr-CA',async()=>({locales:['fr-CA'],installedLocales:[]}),()=>true);
 assert.equal(latest,'missing');
});
test('a rejected query is unknown only if it still belongs to the active locale',async()=>{
 const {queryLocalModelState}=await import('../dist/index.js');
 assert.equal(await queryLocalModelState('de-DE',async()=>{throw Error('native unavailable');},()=>true),'unknown');
 assert.equal(await queryLocalModelState('de-DE',async()=>{throw Error('old request');},()=>false),null);
});
test('locale and installed inventory must match exactly after async resolution',async()=>{
 const {queryLocalModelState}=await import('../dist/index.js');
 const inventory={locales:['en-CA','en-US'],installedLocales:['en-US']};
 assert.equal(await queryLocalModelState('en-CA',async()=>inventory,()=>true),'missing');
 assert.equal(await queryLocalModelState('en-US',async()=>inventory,()=>true),'installed');
});
