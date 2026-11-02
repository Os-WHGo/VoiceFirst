import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLocalModelPackage} from '../dist/index.js';
test('local model package requires manifest identity, license and sha256 metadata',()=>{
 const pkg={id:'sample-model',runtime:'llama.cpp',locales:['en-CA','fr-CA'],bytes:1000000,sha256:'a'.repeat(64),licenseId:'Apache-2.0',licenseReviewed:true,sourceUrl:'https://example.org/model',contextTokens:2048};
 assert.equal(validateLocalModelPackage(pkg).status,'valid');
 for(const patch of [{id:'../unsafe'},{locales:['xx']},{bytes:-1},{sha256:'bad'},{licenseReviewed:false},{sourceUrl:'http://example.org/model'},{contextTokens:100}])assert.equal(validateLocalModelPackage({...pkg,...patch}).status,'invalid');
});
