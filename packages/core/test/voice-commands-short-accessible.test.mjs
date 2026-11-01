import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceCommand} from '../dist/index.js';

const examples=[
 ['suivant','NEXT'],['próxima atividade','NEXT'],['nächste aufgabe','NEXT'],['avanti','NEXT'],
 ['écouter seulement','ONLY_LISTEN'],['nur anhören','ONLY_LISTEN'],['ascolta soltanto','ONLY_LISTEN'],
 ['plus vite','FASTER'],['più in fretta','FASTER'],
 ['un indice','HELP'],['hilfe bitte','HELP'],['aiutami','HELP']
];
test('short commands work with Unicode accents in French Portuguese German and Italian',()=>{
 for(const [text,type] of examples)assert.equal(parseVoiceCommand(text)?.type,type,text);
});
test('short commands never trigger inside ordinary sentences',()=>{
 for(const text of ['She said suivant to me','I need help with avanti tomorrow','he said plus vite']){
  assert.equal(parseVoiceCommand(text),null,text);
 }
});
