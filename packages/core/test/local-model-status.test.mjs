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
