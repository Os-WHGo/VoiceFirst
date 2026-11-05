import test from 'node:test';
import assert from 'node:assert/strict';
import {
 auditFirstReleaseEditorialCoverage,firstReleaseLanguages,
 officialCefrBands,b2EditorialDrafts,courseSkills,
 a1EditorialDrafts,a2EditorialDrafts,b1EditorialDrafts
} from '../dist/index.js';
test('A1–C2 inventory distinguishes draft coverage from complete playable courses',()=>{
 const report=auditFirstReleaseEditorialCoverage();
 assert.equal(report.valid,true,report.errors.join('; '));
 assert.equal(report.cells.length,18);
 assert.equal(report.expectedCefrUnits,144);
 assert.equal(report.editorialDraftUnits,96);
 assert.equal(report.missingUnits,48);
 assert.equal(report.documentedReviewUnits,0);
 assert.equal(report.verifiedAudioTurns,0);
 assert.equal(report.readyForPublicRelease,false);
 assert.equal(report.editorialCoveragePercent,66.7);
 for(const language of firstReleaseLanguages){
  for(const level of officialCefrBands){
   const row=report.cells.find(x=>x.targetLanguage===language&&x.level===level);
   assert.ok(row);
   assert.equal(row.plannedUnits,8);
   assert.equal(row.publicAvailable,false);
   assert.equal(row.verifiedAudioTurns,0);
   assert.equal(row.draftUnits,['A1','A2','B1','B2'].includes(level)?8:0);
   assert.equal(row.missingUnits,['C1','C2'].includes(level)?8:0);
  }
 }
 assert.equal(courseSkills.length,6);
});
test('missing data and synthetic approval cannot turn inventory into release readiness',()=>{
 const all=[...a1EditorialDrafts,...a2EditorialDrafts,...b1EditorialDrafts,...b2EditorialDrafts];
 const missing=auditFirstReleaseEditorialCoverage(all.filter(x=>x.level!=='B2'));
 assert.equal(missing.editorialDraftUnits,72);
 assert.equal(missing.missingUnits,72);
 assert.equal(missing.readyForPublicRelease,false);
 const damaged=auditFirstReleaseEditorialCoverage([...all,{...b2EditorialDrafts[0],unitId:'invented-topic'}]);
 assert.equal(damaged.valid,false);
 assert.ok(damaged.errors.some(x=>x.includes('Unknown or duplicate')));
 assert.equal(damaged.readyForPublicRelease,false);
 const malformed=auditFirstReleaseEditorialCoverage(null);
 assert.equal(malformed.valid,false);
 assert.equal(malformed.readyForPublicRelease,false);
});
