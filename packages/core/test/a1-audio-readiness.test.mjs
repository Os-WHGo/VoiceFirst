import test from 'node:test';
import assert from 'node:assert/strict';
import {a1AudioBaseline,a1AudioExpectedIds,auditA1AudioAssets,a1AccentMatchesTarget} from '../dist/index.js';
test('24 A1 dialogue turns are absent until recordings are verified',()=>{assert.equal(a1AudioExpectedIds.length,24);assert.equal(new Set(a1AudioExpectedIds).size,24);assert.equal(a1AudioBaseline.expected,24);assert.equal(a1AudioBaseline.verified,0);assert.equal(a1AudioBaseline.missing.length,24);assert.equal(a1AudioBaseline.readyForEditorialPlayback,false);assert.equal(a1AudioBaseline.readyForPublicRelease,false);});
test('rejects incomplete and repeated manifest entries',()=>{assert.equal(auditA1AudioAssets([{id:a1AudioExpectedIds[0]}]).verified,0);assert.ok(auditA1AudioAssets([{id:a1AudioExpectedIds[0]}]).errors.length>0);assert.equal(auditA1AudioAssets([null]).readyForEditorialPlayback,false);});

test('A1 manifests cannot assign another language accent to a dialogue',()=>{
 const ids=a1AudioExpectedIds.filter(id=>id.endsWith('/dialogue-first'));
 assert.equal(ids.length,12);
 for(const id of ids){
  const [targetLanguage,unitId,role]=id.split('/');
  const asset={id,targetLanguage,unitId,role,uri:'a1/audio.wav',sha256:'a'.repeat(64),bytes:128,reviewerId:'editor-01',rightsReference:'original-audio-license',accentTag:targetLanguage};
  assert.equal(auditA1AudioAssets([asset]).verified,1,id);
  const other=targetLanguage==='fr-CA'?'de':'fr-CA';
  assert.equal(auditA1AudioAssets([{...asset,accentTag:other}]).verified,0,id);
  assert.equal(auditA1AudioAssets([{...asset,accentTag:'fake-locale'}]).readyForEditorialPlayback,false,id);
 }
 assert.equal(a1AccentMatchesTarget('en-CA','en-US'),true);
 assert.equal(a1AccentMatchesTarget('fr-CA','fr-FR'),true);
 assert.equal(a1AccentMatchesTarget('es','es-CL'),true);
 assert.equal(a1AccentMatchesTarget('pt-BR','pt-PT'),false);
 assert.equal(a1AccentMatchesTarget('pt-BR','pt-BR'),true);
 assert.equal(a1AccentMatchesTarget('en-CA','en-'),false);
});
