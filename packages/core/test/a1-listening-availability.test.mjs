import test from 'node:test';
import assert from 'node:assert/strict';
import {a1ListeningAvailability,a1AudioExpectedIds} from '../dist/index.js';
test('listening activities remain unpublished with no local audio',()=>{
 const result=a1ListeningAvailability({expected:24,verified:0,missing:a1AudioExpectedIds,rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.equal(result.length,12);assert.ok(result.every(x=>x.verifiedCount===0&&!x.editorialPreviewAvailable&&!x.publicPlaybackAvailable));
});
test('both verified dialogue utterances are required for editorial preview',()=>{
 const [first,second]=a1AudioExpectedIds.slice(0,2);
 const missing=a1AudioExpectedIds.filter(x=>x!==first);
 const partial=a1ListeningAvailability({expected:24,verified:1,missing,rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.equal(partial.find(x=>x.required.includes(first)).editorialPreviewAvailable,false);
 const both=a1ListeningAvailability({expected:24,verified:2,missing:a1AudioExpectedIds.filter(x=>x!==first&&x!==second),rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.equal(both.find(x=>x.required.includes(first)).editorialPreviewAvailable,true);
 assert.ok(both.every(x=>x.publicPlaybackAvailable===false));
});
test('rejected inventory entry blocks editorial preview',()=>{
 const result=a1ListeningAvailability({expected:24,verified:24,missing:[],rejected:[{id:'unknown',reason:'unexpected-or-duplicate'}],readyForEditorialPlayback:false,readyForPublicRelease:false});
 assert.ok(result.every(x=>!x.editorialPreviewAvailable));
});

test('forged inventory counts and unknown IDs cannot unlock editorial previews',()=>{
 const first=a1AudioExpectedIds[0],second=a1AudioExpectedIds[1];
 const base={expected:24,verified:2,missing:a1AudioExpectedIds.filter(id=>id!==first&&id!==second),rejected:[],readyForEditorialPlayback:false,readyForPublicRelease:false};
 const variants=[
  {...base,verified:24},
  {...base,expected:12},
  {...base,missing:[...base.missing,'unknown']},
  {...base,missing:[...base.missing,base.missing[0]]},
  {...base,verified:NaN},
 ];
 for(const audit of variants){
  const cards=a1ListeningAvailability(audit);
  assert.ok(cards.every(card=>!card.editorialPreviewAvailable&&card.verifiedCount===0));
 }
});
