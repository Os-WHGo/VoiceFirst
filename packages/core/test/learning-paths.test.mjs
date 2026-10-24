import test from 'node:test';
import assert from 'node:assert/strict';
import {ageCourseProfiles,officialCefrBands,planCourseRoute,defaultPreferences,examPreparationCatalog,preparationFor,targetLanguages,learningPairs,auditCurriculumProduction,curriculumPlanFor,courseSkills} from '../dist/index.js';
test('six official CEFR levels, never C3',()=>assert.deepEqual(officialCefrBands,['A1','A2','B1','B2','C1','C2']));
test('age stages independent from six target languages and achievement',()=>{for(const s of Object.keys(ageCourseProfiles)){const r=planCourseRoute(s,'C2',defaultPreferences);assert.equal(r.cefr,'C2');assert.equal(r.curriculumStatus,'planned');}});
test('youngest users require guardian and restrict free chat',()=>{for(const s of ['preschool','primary','preteen']){assert.equal(ageCourseProfiles[s].guardianRequired,true);assert.equal(ageCourseProfiles[s].unrestrictedConversationEnabled,false);}});
test('every age stage has unrestricted AI disabled pending review',()=>{for(const profile of Object.values(ageCourseProfiles))assert.equal(profile.unrestrictedConversationEnabled,false);});
test('a preschooler never receives a 30 minute default class',()=>assert.ok(planCourseRoute('preschool','A1',{...defaultPreferences,microLessonMinutes:30}).preferredMinutes<=5));
test('adult can keep a requested 30 minute session',()=>assert.equal(planCourseRoute('adult','A1',{...defaultPreferences,microLessonMinutes:30}).preferredMinutes,30));
test('accessibility preferences transfer without collecting a diagnosis',()=>{const route=planCourseRoute('adult','B1',{...defaultPreferences,lowStimulation:false,interactionStyle:'flexible'});assert.equal(route.accessibility.lowStimulation,false);assert.equal(route.accessibility.interactionStyle,'flexible');assert.ok(!('diagnosis' in route));});
test('all 30 ordered pairs keep their language identities',()=>{assert.equal(learningPairs().length,30);for(const [known,target] of learningPairs()){const r=planCourseRoute('teen','C1',{...defaultPreferences,nativeLanguage:known,target});assert.equal(r.knownLanguage,known);assert.equal(r.targetLanguage,target);}});
test('every initial language has an exam track but no official affiliation claims',()=>{for(const lang of targetLanguages){assert.ok(preparationFor(lang).length>0)}for(const item of examPreparationCatalog)assert.equal(item.officialExamAffiliation,false)});
test('Canada Express Entry catalog never includes TOEFL or IELTS Academic',()=>{assert.deepEqual(preparationFor('en-CA','canada-express-entry').map(x=>x.id).sort(),['celpip-general','ielts-general','pte-core'].sort());assert.deepEqual(preparationFor('fr-CA','canada-express-entry').map(x=>x.id).sort(),['tcf-canada','tef-canada']);});
test('Portuguese Brazil regional track warns about European Portuguese',()=>{const caple=preparationFor('pt-BR').find(e=>e.id==='caple');assert.match(caple.notes,/European Portuguese/);});
test('course refuses same known/target language',()=>assert.throws(()=>planCourseRoute('adult','B2',{...defaultPreferences,nativeLanguage:'it',target:'it'}),/differ/));

test('production board shows all 288 planned A1-C2 units, none invented as reviewed',()=>{
 const audit=auditCurriculumProduction([]);
 assert.equal(audit.valid,true);
 assert.equal(audit.levels.length,36);
 assert.equal(audit.levels.reduce((n,x)=>n+x.plannedUnits,0),288);
 for(const row of audit.levels){
  assert.equal(row.plannedUnits,8);
  assert.equal(row.documentedReviews,0);
  assert.equal(row.missingUnits,8);
  assert.equal(row.allUnitsDocumentedAsReviewed,false);
 }
});
test('only documented, reviewed content with multiple skill types passes structural gate',()=>{
 const plans=curriculumPlanFor('en-CA').filter(x=>x.level==='A1');
 const rows=plans.map((plan,i)=>({
  ...plan,revision:'1.0.0',status:'reviewed',
  outcomes:['Original learning outcome for unit '+i],
  activities:[
   {id:'activity-one',skill:courseSkills[i%6],prompt:'Original practice text one'},
   {id:'activity-two',skill:courseSkills[(i+1)%6],prompt:'Original practice text two'}
  ],
  review:{linguisticReviewer:'Reviewer A',educationalReviewer:'Reviewer B',rightsReference:'VoiceFirst original source '+i}
 }));
 const result=auditCurriculumProduction(rows);
 assert.equal(result.valid,true);
 const a1=result.levels.find(x=>x.targetLanguage==='en-CA'&&x.level==='A1');
 assert.equal(a1.documentedReviews,8);
 assert.equal(a1.missingUnits,0);
 assert.deepEqual(a1.skillCoverage,courseSkills);
 assert.equal(a1.allUnitsDocumentedAsReviewed,true);
 const a2=result.levels.find(x=>x.targetLanguage==='en-CA'&&x.level==='A2');
 assert.equal(a2.allUnitsDocumentedAsReviewed,false);
 assert.equal(result.levels.reduce((n,x)=>n+Number(x.allUnitsDocumentedAsReviewed),0),1);
});
test('production audit rejects duplicate, invented, unlicensed and fake-reviewed units',()=>{
 const one=curriculumPlanFor('fr-CA')[0];
 const draft={...one,revision:'1.0.0',status:'draft',outcomes:[],activities:[]};
 assert.equal(auditCurriculumProduction([draft]).valid,true);
 assert.equal(auditCurriculumProduction([draft,draft]).valid,false);
 assert.equal(auditCurriculumProduction([{...draft,unitId:'not-an-existing-unit'}]).valid,false);
 assert.equal(auditCurriculumProduction([{...draft,status:'published'}]).valid,false);
 assert.equal(auditCurriculumProduction([{...draft,status:'reviewed'}]).valid,false);
 assert.equal(auditCurriculumProduction([{...draft,revision:'unstable'}]).valid,false);
 assert.equal(auditCurriculumProduction(null).valid,false);
 const invalid={...draft,activities:[{id:'dup',skill:'listening',prompt:'a'},{id:'dup',skill:'reading',prompt:'b'}]};
 assert.equal(auditCurriculumProduction([invalid]).valid,false);
});
