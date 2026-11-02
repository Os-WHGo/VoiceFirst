import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaybackRequestOwnership,curatedPlaybackTimeoutMs} from '../dist/index.js';
test('new request invalidates prior owner before asynchronous work',async()=>{
 const owner=new PlaybackRequestOwnership();const first=owner.claim();
 const delayed=Promise.resolve().then(()=>owner.isCurrent(first));
 const next=owner.claim();
 assert.equal(await delayed,false);
 assert.equal(owner.isCurrent(next),true);
});
test('only active resources are retained and released once',()=>{
 const owner=new PlaybackRequestOwnership();let released=0;
 const first=owner.claim();owner.attach(first,()=>{released++;});
 const next=owner.claim();
 assert.equal(released,1);
 assert.equal(owner.attach(first,()=>{released++;}),false);
 owner.attach(next,()=>{released++;});
 assert.equal(owner.finish(first),false);
 assert.equal(owner.finish(next),true);
 owner.stop();
 assert.equal(released,3);
});
test('timeout respects slowed playback rate',()=>{
 assert.equal(curatedPlaybackTimeoutMs(30000,0.65),Math.ceil(30000/0.65+10000));
 assert.ok(curatedPlaybackTimeoutMs(30000,0.65)>40000);
 assert.equal(curatedPlaybackTimeoutMs(30000,1),40000);
});
