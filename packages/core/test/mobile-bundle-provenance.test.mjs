import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMobileBundleSources} from '../../../scripts/inspect-mobile-bundle-sources.mjs';

test('source map inventory recognizes advisory packages only when bundled',()=>{
 const result=inspectMobileBundleSources([{sources:[
  '/project/node_modules/@expo/config-plugins/build/test.js',
  '/project/node_modules/glob/dist/index.js',
  '/project/node_modules/zod/lib/index.js',
  '/project/packages/core/src/session.ts'
 ]}]);
 assert.deepEqual(result.advisoryPackagesInJsBundle,['glob','zod']);
 assert.equal(result.sourcesInspected,4);
});
test('nested source maps and unrelated names avoid false positives',()=>{
 const result=inspectMobileBundleSources([{sections:[{map:{sources:[
  'node_modules/super-glob/index.js',
  'node_modules/minimatch/dist/index.js'
 ]}}]}]);
 assert.deepEqual(result.advisoryPackagesInJsBundle,['minimatch']);
});
test('missing source maps fail closed instead of claiming JS is clear',()=>{
 assert.throws(()=>inspectMobileBundleSources([]),/No Metro source maps/);
 assert.throws(()=>inspectMobileBundleSources([{sources:[]}]),/no module sources/);
});
