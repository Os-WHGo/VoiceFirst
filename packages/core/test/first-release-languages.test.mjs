import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 targetLanguages,learningPairs,a1EditorialDrafts,
 firstReleaseLanguages,comingSoonLanguages,
 firstReleaseLanguageStatus,canSelectFirstReleaseLanguage,
 canSelectFirstReleasePair,firstReleaseLanguagePairs,
 firstPublicReleaseReadiness
} from '../dist/index.js';

test('three first-release languages and three visible coming-soon languages partition existing six',()=>{
 assert.deepEqual(firstReleaseLanguages,['en-CA','fr-CA','es']);
 assert.deepEqual(comingSoonLanguages,['pt-BR','de','it']);
 assert.deepEqual(new Set([...firstReleaseLanguages,...comingSoonLanguages]),new Set(targetLanguages));
 assert.equal(new Set([...firstReleaseLanguages,...comingSoonLanguages]).size,6);
 for(const lang of firstReleaseLanguages){
  assert.equal(firstReleaseLanguageStatus(lang),'selected-for-first-release');
  assert.equal(canSelectFirstReleaseLanguage(lang),true);
 }
 for(const lang of comingSoonLanguages){
  assert.equal(firstReleaseLanguageStatus(lang),'coming-soon');
  assert.equal(canSelectFirstReleaseLanguage(lang),false);
 }
 assert.equal(canSelectFirstReleaseLanguage('unknown'),false);
});

test('first-release pairs are exactly six directed help/target routes, without deleting any of the 30 core pairs',()=>{
 assert.equal(firstReleaseLanguagePairs.length,6);
 const keys=new Set();
 for(const pair of firstReleaseLanguagePairs){
  const key=pair.known+'>'+pair.target;
  assert.ok(!keys.has(key));keys.add(key);
  assert.equal(canSelectFirstReleasePair(pair.known,pair.target),true);
 }
 for(const known of targetLanguages){
  for(const target of targetLanguages){
   assert.equal(canSelectFirstReleasePair(known,target),
    known!==target&&firstReleaseLanguages.includes(known)&&firstReleaseLanguages.includes(target));
  }
 }
 assert.equal(learningPairs().length,30);
 assert.equal(a1EditorialDrafts.length,48);
 assert.deepEqual(new Set(a1EditorialDrafts.map(x=>x.targetLanguage)),new Set(targetLanguages));
});

test('private beta selectability never represents C2 or public-release approval',()=>{
 assert.equal(firstPublicReleaseReadiness.status,'not-ready');
 assert.deepEqual(firstPublicReleaseReadiness.requiredLevels,['A0','A1','A2','B1','B2','C1','C2']);
 assert.ok(firstPublicReleaseReadiness.blockers.includes('approved-complete-curriculum-through-C2-for-three-languages'));
 assert.ok(firstPublicReleaseReadiness.blockers.includes('verified-local-audio-and-rights'));
 assert.ok(firstPublicReleaseReadiness.blockers.includes('speech-session-and-offline-real-device-validation'));
 assert.ok(firstPublicReleaseReadiness.blockers.includes('resolved-or-formally-reviewed-dependency-security-gate'));
});

test('mobile selectors visibly mark but disable coming-soon choices in both directions',()=>{
 const app=readFileSync(new URL('../../../mobile/App.tsx',import.meta.url),'utf8');
 assert.match(app,/targetLanguages\.map\(lang=>\{/);
 assert.match(app,/targetLanguages\.filter\(lang=>lang!==nativeLanguage\)\.map\(lang=>\{/);
 assert.match(app,/canSelectFirstReleaseLanguage\(lang\)/);
 assert.match(app,/canSelectFirstReleasePair\(nativeLanguage,lang\)/);
 assert.match(app,/disabled=\{!available\}/);
 assert.match(app,/disabled=\{disabled\}/);
 assert.match(app,/languageNames\[lang\]\+' · Próximamente'/);
 assert.match(app,/Lanzamiento público solo con los tres cursos completos hasta C2/);
});
