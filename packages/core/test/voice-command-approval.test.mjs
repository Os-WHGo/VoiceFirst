import test from 'node:test';
import assert from 'node:assert/strict';
import {spokenCommandApproval,voiceCommandProposalPrompt,targetLanguages,parseVoiceCommand} from '../dist/index.js';

const phrases={
 es:['confirmar comando de voz','cancelar comando de voz'],
 'en-CA':['confirm voice command','cancel voice command'],
 'fr-CA':['confirmer la commande vocale','annuler la commande vocale'],
 'pt-BR':['confirmar comando de voz','cancelar comando de voz'],
 de:['Sprachbefehl bestätigen','Sprachbefehl abbrechen'],
 it:['conferma comando vocale','annulla comando vocale']
};
test('every help language requires a distinct complete two-turn spoken navigation approval',()=>{
 for(const language of targetLanguages){
  const [approve,cancel]=phrases[language];
  assert.equal(spokenCommandApproval(approve,language),'approve');
  assert.equal(spokenCommandApproval(cancel,language),'cancel');
  assert.equal(spokenCommandApproval(approve.toUpperCase(),language),'approve');
  assert.equal(spokenCommandApproval(cancel.toUpperCase(),language),'cancel');
  const prompt=voiceCommandProposalPrompt(language,{type:'NEXT'});
  assert.ok(prompt.includes(approve),language);
  assert.ok(prompt.includes(cancel),language);
  assert.ok(prompt.length>50,language);
  assert.equal(parseVoiceCommand(approve),null,'navigation approval is not a normal lesson command');
  assert.equal(parseVoiceCommand(cancel),null,'cancellation is not a lesson command');
 }
});
test('isolated affirmations, background talk and grading confirmations never approve navigation',()=>{
 for(const language of targetLanguages){
  for(const phrase of ['sí','yes','oui','sim','ja','sì','confirmar mi respuesta',
   'confirm my answer','confirmer ma réponse','confirmar minha resposta','Antwort bestätigen',
   'conferma la mia risposta','pausa','siguiente ejercicio','I said confirm voice command',
   'yes confirm voice command','confirm voice command please','repeat confirm voice command',
   '',' '.repeat(30)]){
   assert.equal(spokenCommandApproval(phrase,language),null,language+':'+phrase);
  }
  assert.equal(spokenCommandApproval(null,language),null);
  assert.equal(spokenCommandApproval({text:phrases[language][0]},language),null);
  assert.equal(spokenCommandApproval(phrases[language][0].repeat(20),language),null);
 }
});
test('the same written transcript cannot silently approve every language',()=>{
 assert.equal(spokenCommandApproval('confirm voice command','es'),null);
 assert.equal(spokenCommandApproval('confirmar comando de voz','fr-CA'),null);
 assert.equal(spokenCommandApproval('annuler la commande vocale','en-CA'),null);
});
