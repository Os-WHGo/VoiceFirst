import test from 'node:test';
import assert from 'node:assert/strict';
import {temporaryFilesToDelete} from '../dist/index.js';

test('Expo file URIs select only completed temporary model files',()=>{
 const root='file:///app/cache/models/';
 const files=[
  {path:root+'ready.part',packId:'ready',kind:'download'},
  {path:root+'pending.part',packId:'pending',kind:'download'},
  {path:root+'installed.bin',packId:'ready',kind:'installed'},
  {path:root+'folder/',packId:'ready',kind:'staging'},
  {path:'file:///app/cache/other/ready.part',packId:'ready',kind:'download'}
 ];
 const journal={ready:{phase:'failed'},pending:{phase:'verified'}};
 assert.deepEqual(temporaryFilesToDelete(files,journal,root),[root+'ready.part']);
});
test('cache roots must be absolute local directories',()=>{
 assert.throws(()=>temporaryFilesToDelete([],{},'relative/'),/Root/);
 assert.throws(()=>temporaryFilesToDelete([],{},'/'),/Root/);
 assert.deepEqual(temporaryFilesToDelete([{path:'/app/cache/temp.bin',packId:'x',kind:'download'}],{},'/app/cache/'),['/app/cache/temp.bin']);
});
