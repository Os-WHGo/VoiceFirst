import test from 'node:test';
import assert from 'node:assert/strict';
import {targetLanguages,lessonPackageFromCourse,lessonPackageFromDialogues,validateLessonPackage,lessonPackageDigest,canonicalJSON,packageVariantsFor} from '../dist/index.js';

const clone=x=>JSON.parse(JSON.stringify(x));
const reseal=p=>({...p,contentSha256:lessonPackageDigest(p.lessons)});
const codes=v=>v.issues.filter(i=>i.severity==='error').map(i=>i.code);
const base=()=>clone(lessonPackageFromCourse('es'));

test('the built-in course and dialogues validate in all six languages, but are never publishable',()=>{
 let lessons=0,activities=0;
 for(const lang of targetLanguages)for(const pkg of [lessonPackageFromCourse(lang),lessonPackageFromDialogues(lang)]){
  const v=validateLessonPackage(clone(pkg));
  assert.equal(v.structurallyValid,true,`${pkg.packageId}: ${JSON.stringify(v.issues.slice(0,3))}`);
  assert.deepEqual(v.issues,[]);
  assert.equal(v.readyForPublication,false);
  assert.deepEqual(v.publicationBlockers,['asr-not-validated','audio-not-verified','editorial-review-pending']);
  lessons+=v.lessons;activities+=v.activities;
 }
 assert.equal(lessons,108);assert.equal(activities,468,'384 authored activities plus 84 listening-comprehension checks');
});
test('integrity digest detects any content change and is key-order independent',()=>{
 const p=base();
 p.lessons[0].activities[2].accepted=['¡Adiós!','Buenos días.'];
 assert.deepEqual(codes(validateLessonPackage(p)),['INTEGRITY','MODEL_NOT_ACCEPTED']);
 assert.deepEqual(codes(validateLessonPackage(reseal(p))),['MODEL_NOT_ACCEPTED'],'resealing fixes integrity, not coherence');
 const q=base();q.lessons[0].activities[2].accepted=['¡Hola!','Buenas.'];
 assert.deepEqual(codes(validateLessonPackage(q)),['INTEGRITY']);
 assert.equal(canonicalJSON({b:1,a:[{d:2,c:'é'}]}),canonicalJSON({a:[{c:'é',d:2}],b:1}));
 assert.equal(lessonPackageDigest(base().lessons),base().contentSha256);
});
test('identity, language, variant and version are checked',()=>{
 for(const [mutate,code] of [[p=>{p.packageId='bad id'},'PACKAGE_ID'],[p=>{p.version='1.0'},'VERSION'],[p=>{p.variant='es-ES'},'VARIANT'],[p=>{p.format='zip'},'FORMAT']]){
  const p=base();mutate(p);assert.ok(codes(validateLessonPackage(p)).includes(code),code);
 }
 assert.deepEqual(packageVariantsFor('fr-CA'),['fr-CA','fr-FR']);
 const fr=clone(lessonPackageFromCourse('fr-CA'));fr.variant='fr-FR';
 assert.equal(validateLessonPackage(fr).structurallyValid,true);
 const p=base();p.targetLanguage='ja';assert.deepEqual(codes(validateLessonPackage(p)),['TARGET_LANGUAGE']);
 assert.deepEqual(codes(validateLessonPackage({...base(),schemaVersion:2})),['SCHEMA_VERSION']);
});
test('duplicate ids, prerequisite gaps and cycles are rejected',()=>{
 let p=base();p.lessons[1].activities[0].id=p.lessons[0].activities[0].id;
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('DUPLICATE_ID'));
 p=base();p.lessons[1].prerequisites=['es-missing'];
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('PREREQUISITE_UNKNOWN'));
 p=base();p.lessons[0].prerequisites=[p.lessons[2].id];
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('PREREQUISITE_CYCLE'));
});
test('objectives, levels and six-language support are required; copied support is flagged',()=>{
 let p=base();delete p.lessons[0].objective.goal.de;
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('SUPPORT_MISSING'));
 p=base();p.lessons[0].band='C3';
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('BAND'));
 p=base();for(const k of ['fr-CA','pt-BR','it'])p.lessons[0].objective.goal[k]=p.lessons[0].objective.goal.es;
 const v=validateLessonPackage(reseal(p));
 assert.equal(v.structurallyValid,true);assert.ok(v.issues.some(i=>i.code==='SUPPORT_NOT_LOCALIZED'));
});
test('answers must be coherent with the instruction and the evaluator',()=>{
 let p=base();p.lessons[0].activities[2].model='Algo distinto.';
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('MODEL_NOT_ACCEPTED'));
 p=base();p.lessons[0].activities[2].accepted=['¿¡!?'];p.lessons[0].activities[2].model='¿¡!?';
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('EMPTY_ANSWER'));
 p=clone(lessonPackageFromCourse('it'));p.lessons[0].activities[2].accepted=['Eh, ciao!'];p.lessons[0].activities[2].model='Eh, ciao!';
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('INCOHERENT_ANSWER'),'a spoken authored answer must be accepted');
 p=base();p.lessons[0].activities[2].patterns=['Me llamo {nombre}.'];
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('PATTERNS'));
 p=base();p.lessons[0].activities[2].accepted=['¡Hola!','hola'];p.lessons[0].activities[2].model='¡Hola!';
 assert.ok(validateLessonPackage(reseal(p)).issues.some(i=>i.code==='DUPLICATE_ANSWER'));
});
test('offline packages may not depend on network resources; audio references are local and hashed',()=>{
 let p=base();p.lessons[0].activities[0].prompt.target='Escucha https://example.com/hola.mp3';
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('EXTERNAL_DEPENDENCY'));
 p=base();p.lessons[0].rights={status:'rights-cleared',source:'https://example.org/licence'};
 assert.equal(validateLessonPackage(reseal(p)).structurallyValid,true,'attribution URLs are metadata, not runtime dependencies');
 for(const audio of [{ref:'../secret.wav',sha256:'a'.repeat(64)},{ref:'audio/hola.mp3',sha256:'a'.repeat(64)},{ref:'audio/hola.wav',sha256:'xyz'}]){
  p=base();p.lessons[0].activities[0].audio=audio;
  assert.equal(validateLessonPackage(reseal(p)).structurallyValid,false,JSON.stringify(audio));
 }
 p=base();p.lessons[0].activities[0].audio={ref:'audio/es-greet-listen-1.wav',sha256:'a'.repeat(64)};
 assert.equal(validateLessonPackage(reseal(p)).structurallyValid,true);
});
test('every answerable activity keeps a non-oral path and flexible time',()=>{
 let p=base();p.lessons[0].activities[2].responseModes=['speech'];
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('NO_NON_ORAL_PATH'));
 p=base();p.lessons[0].activities[2].timeLimitSeconds=5;
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('TIME_LIMIT'));
 p=base();p.lessons[0].activities[2].timeLimitSeconds=15;
 const v=validateLessonPackage(reseal(p));
 assert.equal(v.structurallyValid,true);assert.ok(v.issues.some(i=>i.code==='TIME_LIMIT'&&i.severity==='warning'));
});
test('choice activities need distinct options and a valid answer; review statuses block publication',()=>{
 const p=base();
 p.lessons[0].activities.push({id:'es-greet-choice-5',kind:'choice',prompt:{support:p.lessons[0].objective.goal},options:[{id:'a',text:'Hola'},{id:'b',text:'Adiós'}],correctOptionId:'c',responseModes:['choice']});
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('CHOICE_ANSWER'));
 p.lessons[0].activities.find(a=>a.id==='es-greet-choice-5').correctOptionId='a';
 assert.equal(validateLessonPackage(reseal(p)).structurallyValid,true);
 const reviewed=base();for(const l of reviewed.lessons)Object.assign(l,{editorialStatus:'final',audioStatus:'audio-verified',asrStatus:'asr-validated'});
 const v=validateLessonPackage(reseal(reviewed));
 assert.deepEqual(v.publicationBlockers,[]);assert.equal(v.readyForPublication,false,'only an external editorial decision can publish');
});
test('malformed input never throws',()=>{
 for(const input of [null,42,'x',[],{format:'voicefirst.lesson-package',schemaVersion:1,targetLanguage:'es',lessons:[null,{}]}]){
  const v=validateLessonPackage(input);assert.equal(v.structurallyValid,false);
 }
});
test('choice options may be localized meanings and must read differently in every known language',()=>{
 const p=JSON.parse(JSON.stringify(lessonPackageFromCourse('pt-BR')));
 const check=p.lessons[0].activities.find(a=>a.kind==='choice');
 assert.equal(typeof check.options[0].text,'object');
 check.options[1].text={...check.options[1].text,de:check.options[0].text.de};
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('DUPLICATE_OPTION'));
 delete check.options[1].text.it;
 assert.ok(codes(validateLessonPackage(reseal(p))).includes('CHOICE_OPTIONS'));
});
