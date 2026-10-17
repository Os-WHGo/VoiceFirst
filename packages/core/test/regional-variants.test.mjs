import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,learningPairs,variantsFor,regionalSituations,defaultRegionalPreferences,validateRegionalPreferences,regionalExamplesFor} from '../dist/index.js';
test('English has CA US GB, French has CA FR; other four languages stay valid without invented regional variants',()=>{
  assert.deepEqual(variantsFor('en-CA'),['en-CA','en-US','en-GB']);
  assert.deepEqual(variantsFor('fr-CA'),['fr-CA','fr-FR']);
  for(const language of targetLanguages.filter(x=>x!=='en-CA'&&x!=='fr-CA'))assert.deepEqual(variantsFor(language),[]);
});
test('each regional scenario has a distinct phrase for every required country and references',()=>{
  for(const scenario of regionalSituations){
    assert.equal(new Set(scenario.examples.map(x=>x.locale)).size,scenario.examples.length);
    assert.ok(scenario.examples.every(x=>x.referenceUrl.startsWith('https://')&&x.sentence.length>8&&x.voice==='system-unverified'));
    assert.deepEqual(scenario.examples.map(x=>x.locale),scenario.language==='en'?['en-CA','en-US','en-GB']:['fr-CA','fr-FR']);
  }
});
test('comparison disabled by default and opt-in displays regional examples',()=>{
  const pref=defaultRegionalPreferences('en-CA');
  assert.deepEqual(regionalExamplesFor('en-CA',pref).map(x=>x.examples.length),[1,1,1]);
  assert.deepEqual(regionalExamplesFor('en-CA',pref,true).map(x=>x.examples.length),[3,3,3]);
});
test('settings only retain supported accents, never cross English and French',()=>{
  const p=validateRegionalPreferences('fr-CA',{primary:'en-GB',compare:['en-US','fr-FR','fr-FR','fr-CA'],display:'always'});
  assert.equal(p.primary,'fr-CA');assert.deepEqual(p.compare,['fr-FR']);
  assert.equal(regionalExamplesFor('fr-CA',p).length,1);
  assert.equal(validateRegionalPreferences('de',p),null);
});
test('all 30 directed learning pairs stay independent of regional preferences',()=>{
  assert.equal(learningPairs().length,30);
  for(const [native,target] of learningPairs()){
    assert.notEqual(native,target);
    const p=defaultRegionalPreferences(target);
    if(p)assert.ok(variantsFor(target).includes(p.primary));
  }
});
test('regional comparison cannot bypass curated examples or create claims of recorded accent',()=>{
  const p={...defaultRegionalPreferences('en-CA'),primary:'en-GB',compare:['en-US'],display:'always'};
  const sets=regionalExamplesFor('en-CA',p);
  assert.equal(sets[0].examples[0].locale,'en-GB');
  assert.equal(sets[0].examples[1].locale,'en-US');
  assert.equal(sets[0].examples.every(x=>x.voice==='system-unverified'),true);
});

test('five regional situations remain optional, with original register labels and no exclusive-country rules',()=>{
 assert.equal(regionalSituations.length,5);
 assert.equal(regionalSituations.reduce((n,s)=>n+s.examples.length,0),13);
 assert.ok(regionalSituations.every(s=>s.examples.every(e=>['neutral','informal','polite'].includes(e.register))));
 const en=defaultRegionalPreferences('en-CA');
 const partial=validateRegionalPreferences('en-CA',{...en,primary:'en-GB',compare:['en-CA'],display:'always'});
 const sets=regionalExamplesFor('en-CA',partial);
 assert.equal(sets.length,3);
 assert.ok(sets.every(s=>s.examples.length===2&&s.examples[0].locale==='en-GB'&&s.examples[1].locale==='en-CA'));
 assert.equal(regionalExamplesFor('fr-CA',defaultRegionalPreferences('fr-CA'),true).length,2);
});
