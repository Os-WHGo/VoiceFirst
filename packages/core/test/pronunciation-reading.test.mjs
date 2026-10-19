import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pronunciationReadingFor,prototypePronunciationReadings,readingAidCopy,consistentPronunciationReading,courseReadingLocale,lessonsFor,targetLanguages,learningPairs} from '../dist/index.js';

test('pilot readings are per exact target and learner language, not fake 30-pair coverage',()=>{
 assert.equal(prototypePronunciationReadings.length,6);
 assert.equal(learningPairs().length,30);
 for(const item of prototypePronunciationReadings){
  assert.ok(targetLanguages.includes(item.target));
  assert.ok(targetLanguages.includes(item.known));
  assert.notEqual(item.target,item.known);
  assert.equal(item.status,'prototype-unreviewed');
  assert.equal(item.attribution,'voicefirst-original');
  assert.equal(item.noteLanguage,item.known);
  assert.equal(consistentPronunciationReading(item),true);
  assert.equal(item.reading,item.approximateSyllables.join('-'));
  assert.ok(item.prominentSyllableIndex===null||Number.isSafeInteger(item.prominentSyllableIndex));
  assert.ok(item.reading.length>2);
  assert.ok(item.stressAndArticulation.length>15);
  assert.ok(lessonsFor(item.target).some(l=>l.exercises.some(e=>e.utterance===item.phrase)));
  assert.deepEqual(pronunciationReadingFor(item.phrase,item.target,item.known,item.targetLocale),item);
 }
 assert.equal(new Set(prototypePronunciationReadings.map(g=>[g.target,g.known,g.targetLocale,g.phrase].join('|'))).size,prototypePronunciationReadings.length);
});

test('unsupported locales, learners and altered utterances fail closed without guesses',()=>{
 assert.equal(pronunciationReadingFor('Hello!','en-CA','fr-CA','en-CA'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','en-CA','en-CA'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','es','en-US'),null);
 assert.equal(pronunciationReadingFor('Hello!','en-CA','es','en-GB'),null);
 assert.equal(pronunciationReadingFor('Bonjour!','fr-CA','en-CA','fr-CA'),null);
 assert.equal(pronunciationReadingFor('Hello there!','en-CA','es','en-CA'),null);
 assert.equal(pronunciationReadingFor('Hi!','en-CA','es','en-CA'),null);
 assert.equal(pronunciationReadingFor(' ','en-CA','es','en-CA'),null);
});

test('orthographic normalization is safe but does not generate or score speech',()=>{
 assert.equal(pronunciationReadingFor('  ¡Hola!  ','es','en-CA','es-ES')?.reading,'OH-lah');
 assert.equal(pronunciationReadingFor('hola','es','en-CA','es-ES'),null);
 assert.equal(pronunciationReadingFor('Olá!','pt-BR','es','pt-BR')?.reading,'o-LÁ');
 assert.equal(pronunciationReadingFor('Olá!','pt-BR','en-CA','pt-BR'),null);
});

test('UI limits phonetic drafts to voluntary listening/repeating; recall has no answer leak',()=>{
 const source=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(source,/pronunciationReadingFor\(current\.utterance,target,nativeLanguage,guideLocale\)/);
 assert.match(source,/current\.type==='listen'\|\|current\.type==='repeat'/);
 assert.match(source,/setShowReading\(false\)/);
 assert.match(source,/readingCopy\.heading/);
 assert.match(source,/readingCopy\.disclaimer/);
 assert.match(source,/readingCopy\.unavailable/);
});

test('pronunciation help controls and messages are localized for all six known languages',()=>{
 assert.deepEqual(Object.keys(readingAidCopy).sort(),[...targetLanguages].sort());
 for(const known of targetLanguages){
  const v=readingAidCopy[known];
  for(const field of ['show','hide','heading','syllables','emphasis','unavailable','disclaimer']){
   assert.equal(typeof v[field],'string');
   assert.ok(v[field].length>10,`${known}: ${field} must be substantive`);
  }
 }
 assert.match(readingAidCopy['en-CA'].heading,/reading/i);
 assert.match(readingAidCopy.es.heading,/lectura/i);
 assert.equal(prototypePronunciationReadings.find(r=>r.target==='es')?.noteLanguage,'en-CA');
 assert.match(prototypePronunciationReadings.find(r=>r.target==='es')?.stressAndArticulation,/Spanish h is silent/);
});
test('helper text cannot leak to scoring stages or stay opened after pause',()=>{
 const source=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(source,/setShowReading\(false\);playbackEpoch\.current\+\+;mic\.stop\(\)/);
 assert.match(source,/reading=current&&guideLocale&&\(current\.type==='listen'\|\|current\.type==='repeat'\)/);
 assert.match(source,/readingAidCopy\[nativeLanguage\]/);
 assert.doesNotMatch(source,/phoneticScore|pronunciationGrade/);
});

test('inconsistent reading chunks and prominent group are never silently accepted',()=>{
 const item=prototypePronunciationReadings[0];
 const tampered=[
  {...item,approximateSyllables:[]},
  {...item,approximateSyllables:['he','LOU']},
  {...item,approximateSyllables:['he-','LÓU']},
  {...item,approximateSyllables:['he','LÓU'],prominentSyllableIndex:2},
  {...item,approximateSyllables:['he','LÓU'],prominentSyllableIndex:-1},
  {...item,approximateSyllables:['he','LÓU'],prominentSyllableIndex:1.2},
  {...item,noteLanguage:'it'},
  {...item,status:'verified'},
  {...item,attribution:'licensed-third-party'}
 ];
 for(const t of tampered)assert.equal(consistentPronunciationReading(t),false,JSON.stringify(t));
 assert.equal(consistentPronunciationReading({...item,prominentSyllableIndex:null}),true);
});
test('exact current reading guide exposes learner-localized approximate groups, never graded pronunciation',()=>{
 const ui=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(ui,/readingCopy\.syllables/);
 assert.match(ui,/reading\.approximateSyllables\.join\(' · '\)/);
 assert.match(ui,/reading\.prominentSyllableIndex!==null/);
 assert.match(ui,/readingCopy\.emphasis/);
 for(const native of targetLanguages){
  assert.ok(readingAidCopy[native].syllables.length>10);
  assert.ok(readingAidCopy[native].emphasis.length>10);
 }
 assert.doesNotMatch(ui,/phoneticScore|pronunciationGrade/);
});

test('consistency accepts r/n sounds and rejects control characters in authored groups',()=>{
 const base=prototypePronunciationReadings[0];
 const valid={...base,reading:'nur',approximateSyllables:['nur'],prominentSyllableIndex:0};
 assert.equal(consistentPronunciationReading(valid),true);
 assert.equal(consistentPronunciationReading({...valid,reading:'nur\n',approximateSyllables:['nur\n']}),false);
 assert.equal(consistentPronunciationReading({...valid,reading:'nu·r',approximateSyllables:['nu·r']}),false);
});

test('all six core targets have a small unreviewed Spanish-assisted A0 pronunciation pilot',()=>{
 const targets=new Set(prototypePronunciationReadings.map(r=>r.target));
 assert.deepEqual([...targets].sort(),[...targetLanguages].sort());
 assert.equal(pronunciationReadingFor('Bonjour!','fr-CA','es','fr-CA')?.status,'prototype-unreviewed');
 assert.equal(pronunciationReadingFor('Hallo!','de','es','de-DE')?.prominentSyllableIndex,null);
 assert.equal(pronunciationReadingFor('Bonjour!','fr-CA','es','fr-FR'),null);
 assert.equal(pronunciationReadingFor('Hallo!','de','es','de-AT'),null);
});
test('regional preference never leaks a Canadian cue into a British or French-from-France lesson',()=>{
 assert.equal(courseReadingLocale('en-CA',null),null);
 assert.equal(courseReadingLocale('fr-CA',null),null);
 assert.equal(courseReadingLocale('en-CA','en-US'),null);
 assert.equal(courseReadingLocale('en-CA','en-GB'),null);
 assert.equal(courseReadingLocale('fr-CA','fr-FR'),null);
 assert.equal(courseReadingLocale('en-CA','en-CA'),'en-CA');
 assert.equal(courseReadingLocale('fr-CA','fr-CA'),'fr-CA');
 assert.equal(courseReadingLocale('es',null),'es-ES');
 assert.equal(pronunciationReadingFor('Hello!','en-CA','es',courseReadingLocale('en-CA','en-US')??''),null);
});
test('mobile region preference propagates to reading lookup but not to ASR or core lesson locale',()=>{
 const app=readFileSync(new URL('../../../mobile/App.tsx',import.meta.url),'utf8');
 const regional=readFileSync(new URL('../../../mobile/RegionalComparisons.tsx',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../../../mobile/OfflineCourse.tsx',import.meta.url),'utf8');
 assert.match(app,/courseReadingLocale\(target,/);
 assert.match(app,/onPrimaryChange=\{onPrimaryRegion\}/);
 assert.match(app,/guideLocale=\{guideLocale\}/);
 assert.match(regional,/onPrimaryChange\?\.\(null\)/);
 assert.match(regional,/onPrimaryChange\?\.\(resolved\.primary\)/);
 assert.match(regional,/onPrimaryChange\?\.\(next\.primary\)/);
 assert.match(ui,/pronunciationReadingFor\(current\.utterance,target,nativeLanguage,guideLocale\)/);
 assert.match(ui,/\[target,nativeLanguage,guideLocale,chosenId,step\]/);
});
