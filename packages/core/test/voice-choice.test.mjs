import test from 'node:test';
import assert from 'node:assert/strict';
import {learningPairs,sessionNarration,voiceChoiceIndex,voiceChoiceLabel,voiceChoiceCommandHint,voiceChoiceConfirmation} from '../dist/index.js';

const phrases={
 'en-CA':['I choose the first option','I choose the second option','I choose the third option'],
 'fr-CA':['Je choisis la première option','Je choisis la deuxième option','Je choisis la troisième option'],
 es:['Elijo la primera opción','Elijo la segunda opción','Elijo la tercera opción'],
 'pt-BR':['Escolho a primeira opção','Escolho a segunda opção','Escolho a terceira opção'],
 de:['Ich wähle die erste Option','Ich wähle die zweite Option','Ich wähle die dritte Option'],
 it:['Scelgo la prima opzione','Scelgo la seconda opzione','Scelgo la terza opzione'],
};
test('numbered spoken selections are exact in six known languages and respect visible option count',()=>{
 for(const [known,spoken] of Object.entries(phrases)){
  for(const [i,text] of spoken.entries()){
   assert.equal(voiceChoiceIndex(text,known,3),i,known+' '+text);
   assert.equal(voiceChoiceIndex(text.toUpperCase()+'!',known,3),i);
   assert.ok(voiceChoiceLabel(known,i));
   assert.ok(voiceChoiceConfirmation(known,i,'A learner-visible meaning').includes('A learner-visible meaning'));
  }
  assert.equal(voiceChoiceIndex(spoken[2],known,2),null);
  assert.ok(voiceChoiceCommandHint(known).length>15);
 }
});
test('ASR snippets, bare numbers, unrelated text and malformed counts never select an option',()=>{
 for(const known of Object.keys(phrases)){
  const phrase=phrases[known][0];
  for(const candidate of ['1','one','primera','sí',`the person said ${phrase}`,`${phrase} tomorrow`,'']){
   assert.equal(voiceChoiceIndex(candidate,known,3),null,known+' '+candidate);
  }
  assert.equal(voiceChoiceIndex(null,known,3),null);
  assert.equal(voiceChoiceIndex(phrase,known,0),null);
  assert.equal(voiceChoiceIndex(phrase,known,5),null);
  assert.equal(voiceChoiceIndex(phrase,known,1.5),null);
 }
});
test('existing authored comprehension options are narrated in deterministic numbered order without changing data',()=>{
 for(const [known,target] of learningPairs()){
  const output={kind:'prompt',activityKind:'choice',activityId:'choice',instruction:'Listen',speech:{text:'Hello!',language:target},
    options:[{id:'b',text:'Other',language:known},{id:'a',text:'Greeting',language:known},{id:'c',text:'Goodbye',language:known}]};
  const snapshot=JSON.stringify(output);
  const lines=sessionNarration([output],known,target);
  assert.equal(lines[0].text,'Listen');
  assert.equal(lines[1].text,'Hello!');
  assert.deepEqual(lines.filter(x=>x.text==='Other'||x.text==='Greeting'||x.text==='Goodbye').map(x=>x.text),['Other','Greeting','Goodbye']);
  assert.deepEqual(lines.filter(x=>[0,1,2].some(i=>x.text===voiceChoiceLabel(known,i))).map(x=>x.text),
   [0,1,2].map(i=>voiceChoiceLabel(known,i)));
  assert.equal(lines.at(-1).text,voiceChoiceCommandHint(known));
  assert.equal(JSON.stringify(output),snapshot,'authored option IDs and order remain untouched');
 }
});
