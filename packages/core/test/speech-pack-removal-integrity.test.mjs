import test from 'node:test';
import assert from 'node:assert/strict';
import {planPackRemoval} from '../dist/index.js';

const model=(id,bytes=10)=>({id,bytes,dependencies:[]});
const blocked={status:'blocked',reason:'invalid-catalog',ids:[]};

test('invalid model sizes and duplicate pack IDs never authorize removal',()=>{
 for(const catalog of [
  [model('a',0)],
  [model('a',-2)],
  [model('a',Number.NaN)],
  [model('a',Number.POSITIVE_INFINITY)],
  [model('a',1.5)],
  [model('a'),model('a',100)],
  [null],
  [{id:'a',bytes:10,dependencies:null}]
 ]){
  assert.deepEqual(planPackRemoval(catalog,['a'],['a'],[]),blocked);
 }
});
test('safe individual model sizes must not overflow aggregate freed bytes',()=>{
 const catalog=[model('a',5000000000000000),model('b',5000000000000000)];
 assert.deepEqual(planPackRemoval(catalog,['a','b'],['a','b'],[]),blocked);
});
test('valid catalog can still plan the exact space released',()=>{
 assert.deepEqual(planPackRemoval([model('a',100),model('b',50)],
  ['a','b'],['a','b'],[]),{status:'ok',remove:['a','b'],freedBytes:150});
});
