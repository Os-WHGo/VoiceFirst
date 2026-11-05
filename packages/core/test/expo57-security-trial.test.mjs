import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,compareSnapshots,versionNumbers,monitored} from '../../../scripts/expo57-security-trial.mjs';

const installed=Object.fromEntries(monitored.map(n=>[n,'1.0.0']));
Object.assign(installed,{
 expo:'57.0.30','@expo/cli':'57.0.31','@expo/config':'57.0.10',
 '@expo/config-plugins':'57.0.10','@expo/fingerprint':'0.20.14',
 '@expo/metro-config':'57.0.13','react-native':'0.86.0',
 zod:'3.25.76',glob:'13.0.6',minimatch:'10.2.6',
 deepmerge:'4.3.1',uuid:'7.0.3'
});
const audit=(counts={critical:0,high:2,moderate:11,low:2,total:15},roots=['zod','glob'])=>({
 metadata:{vulnerabilities:counts},
 vulnerabilities:Object.fromEntries(roots.map((n,i)=>[n,{via:[{url:'https://github.com/advisories/GHSA-'+n}]}]))
});
const lock=(entries=installed)=>({lockfileVersion:3,packages:
 Object.fromEntries(Object.entries(entries).map(([name,version])=>['node_modules/'+name,{version}]))});
test('trial snapshot validates lockfile and root advisory schema without counting inherited parents',()=>{
 const result=snapshot(lock(),audit());
 assert.equal(result.installed.expo,'57.0.30');
 assert.equal(result.counts.total,15);
 assert.deepEqual(result.roots,['glob','zod']);
 assert.equal(result.advisories.length,2);
 assert.throws(()=>snapshot({lockfileVersion:2,packages:{}},audit()),/lockfile v3/);
 assert.throws(()=>snapshot(lock(),{metadata:{}}),/Invalid audit/);
 const missing=lock();delete missing.packages['node_modules/zod'];
 assert.equal(snapshot(missing,audit()).installed.zod,null,'removed transitive advisory packages may be beneficial');
 const missingEssential=lock();delete missingEssential.packages['node_modules/expo'];
 assert.throws(()=>snapshot(missingEssential,audit()),/Missing essential SDK/);
 const invalid=audit();invalid.vulnerabilities.zod.via[0].url='https://wrong.example';
 assert.throws(()=>snapshot(lock(),invalid),/Unknown npm security advisory/);
});
test('non-breaking Expo SDK 57 patch trial reports which advisories truly cleared',()=>{
 const before=snapshot(lock(),audit());
 const next={...installed,expo:'57.0.31','@expo/cli':'57.0.32'};
 const after=snapshot(lock(next),audit({critical:0,high:2,moderate:10,low:2,total:14},['zod']));
 const out=compareSnapshots(before,after);
 assert.equal(out.improved,true);
 assert.equal(out.clean,false);
 assert.equal(out.regression,false);
 assert.equal(out.changed.length,2);
 assert.deepEqual(out.resolved,['https://github.com/advisories/GHSA-glob']);
 assert.equal(out.delta.total,-1);
 assert.equal(out.remaining.length,1);
 const withoutUuid=lock(next);
 delete withoutUuid.packages['node_modules/uuid'];
 const removal=compareSnapshots(before,snapshot(withoutUuid,audit({critical:0,high:2,moderate:10,low:2,total:14},['zod'])));
 assert.ok(removal.changed.some(x=>x.package==='uuid'&&x.after===null));
 assert.equal(removal.regression,false);
});
test('trial refuses major Expo and React Native migration or false security improvement',()=>{
 const before=snapshot(lock(),audit());
 for(const versions of [
  {...installed,expo:'58.0.2'},
  {...installed,'@expo/cli':'58.1.0'},
  {...installed,'react-native':'0.88.0'},
  {...installed,'@expo/config':'58.0.0'}]){
  assert.throws(()=>compareSnapshots(before,snapshot(lock(versions),audit())),/escaped supported/);
 }
 const unchanged=compareSnapshots(before,before);
 assert.equal(unchanged.improved,false);
 assert.equal(unchanged.clean,false);
 assert.equal(unchanged.regression,false);
});
test('trial rejects any newly introduced GHSA source or higher severity',()=>{
 const before=snapshot(lock(),audit());
 const after=snapshot(lock(),audit({critical:0,high:3,moderate:11,low:2,total:16},['zod','glob','new']));
 const out=compareSnapshots(before,after);
 assert.equal(out.regression,true);
 assert.equal(out.newAdvisories.length,1);
 assert.equal(out.delta.high,1);
});
test('trial accepts only complete semantic package versions',()=>{
 assert.deepEqual(versionNumbers('57.0.32'),[57,0,32]);
 assert.deepEqual(versionNumbers('0.86.0'),[0,86,0]);
 assert.throws(()=>versionNumbers('latest'),/Invalid package/);
 assert.throws(()=>versionNumbers('57'),/Invalid package/);
});

test('snapshot retains vulnerable nested copies beside a fixed hoisted package',()=>{
 const nested=lock({...installed,glob:'14.0.3'});
 const path='node_modules/@expo/fingerprint/node_modules/glob';
 nested.packages[path]={version:'13.0.6'};
 const result=snapshot(nested,audit());
 assert.equal(result.installed.glob,'14.0.3');
 assert.deepEqual(result.instances.glob,[
  {path,version:'13.0.6'},
  {path:'node_modules/glob',version:'14.0.3'}
 ]);
 assert.equal(result.advisories.includes('https://github.com/advisories/GHSA-glob'),true);
 const removed=lock({...installed,glob:'14.0.3'});
 delete removed.packages['node_modules/zod'];
 removed.packages['node_modules/@expo/cli/node_modules/zod']={version:'3.25.76'};
 assert.equal(snapshot(removed,audit()).instances.zod.length,1);
});
