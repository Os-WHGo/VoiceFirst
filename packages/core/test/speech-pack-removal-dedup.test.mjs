import test from 'node:test';
import assert from 'node:assert/strict';
import {planPackRemoval} from '../dist/index.js';

test('repeated requests do not double count freed storage',()=>{
 const catalog=[
  {id:'speech-fr',bytes:20,dependencies:[]},
  {id:'speech-en',bytes:10,dependencies:[]}
 ];
 const plan=planPackRemoval(catalog,['speech-fr','speech-en'],
  ['speech-fr','speech-fr','speech-en','speech-fr'],[]);
 assert.deepEqual(plan,{status:'ok',remove:['speech-fr','speech-en'],freedBytes:30});
});
test('repeated requests still respect in-use protection',()=>{
 const catalog=[{id:'speech-en',bytes:10,dependencies:[]}];
 assert.deepEqual(planPackRemoval(catalog,['speech-en'],['speech-en','speech-en'],['speech-en']),
  {status:'blocked',reason:'in-use',ids:['speech-en']});
});
