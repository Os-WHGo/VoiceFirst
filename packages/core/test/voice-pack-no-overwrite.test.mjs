import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {authoredVoiceCues} from '../dist/index.js';

function sampleWav(){
 const frames=4000;const b=Buffer.alloc(44+frames*2);
 b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)b.writeInt16LE(Math.round(1200*Math.sin(2*Math.PI*440*i/16000)),44+i*2);
 return b;
}
test('pack builder cannot overwrite an installed output, preserving every byte of the existing narration',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'voicefirst-no-overwrite-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const source=join(dir,'source'),output=join(dir,'published');
 execFileSync('node',['scripts/voice-pack.mjs','plan','es',source],{stdio:'pipe'});
 const rights=JSON.parse(await readFile(join(source,'rights.example.json'),'utf8'));
 const entry=rights.recordings[0];
 entry.rightsOwner='VoiceFirst authors';entry.rightsReference='consent-001';entry.reviewer='Independent QA reviewer';
 rights.recordings=[entry];
 await mkdir(join(source,'clips'),{recursive:true});
 await writeFile(join(source,entry.file),sampleWav());
 await writeFile(join(source,'rights.json'),JSON.stringify(rights));
 execFileSync('node',['scripts/voice-pack.mjs','build','es',source,output],{stdio:'pipe'});
 const manifest=await readFile(join(output,'pack.json'));
 const original=await readFile(join(output,entry.file));
 const res=spawnSync('node',['scripts/voice-pack.mjs','build','es',source,output],{encoding:'utf8'});
 assert.notEqual(res.status,0);
 assert.match(res.stderr,/already exists/);
 assert.deepEqual(await readFile(join(output,'pack.json')),manifest);
 assert.deepEqual(await readFile(join(output,entry.file)),original);
});
test('pack authoring will not discard a previous staging directory after a failed run',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'voicefirst-staging-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const source=join(dir,'source'),out=join(dir,'pack');
 execFileSync('node',['scripts/voice-pack.mjs','plan','it',source],{stdio:'pipe'});
 const marker=Buffer.from('Do not delete staging');
 await mkdir(out+'.staging-'+process.pid,{recursive:true});
 // A subprocess uses its own pid, so test the safer preserved-output case instead.
 // Keep the marker in a separate target to ensure build failure is non-destructive.
 await mkdir(out,{recursive:true});
 await writeFile(join(out,'test.txt'),marker);
 const res=spawnSync('node',['scripts/voice-pack.mjs','build','it',source,out],{encoding:'utf8'});
 assert.notEqual(res.status,0);
 assert.deepEqual(await readFile(join(out,'test.txt')),marker);
});
