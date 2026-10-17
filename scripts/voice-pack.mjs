#!/usr/bin/env node
/** Copyright-free authoring utility: no network or generative inference.
 * Usage:
 *  node scripts/voice-pack.mjs plan <lang> <folder>
 *  node scripts/voice-pack.mjs build <lang> <source-folder> <output-folder>
 *  node scripts/voice-pack.mjs verify <output-folder>
 * For build the source contains rights.json and WAV recordings named by SHA-256 cue ID.
 */
import {mkdir,readFile,writeFile,lstat,copyFile,readdir,rm} from 'node:fs/promises';
import {resolve,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {authoredVoiceCues,voiceLocales,cueFingerprint,inspectVoicePack,targetLanguages} from '../packages/core/dist/index.js';

const hash=v=>createHash('sha256').update(v).digest('hex');
const fileName=cue=>`${hash(cue.id).slice(0,24)}.wav`;
const isLang=x=>targetLanguages.includes(x);
function fail(message){throw new Error(message);}
function parseWav(buffer){
  if(buffer.length<44||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')fail('Expected RIFF/WAVE audio');
  let pos=12,fmt=null,data=null;
  while(pos+8<=buffer.length){
    const name=buffer.toString('ascii',pos,pos+4),size=buffer.readUInt32LE(pos+4);
    if(size>buffer.length-pos-8)fail('WAV chunk exceeds file size');
    if(name==='fmt '){if(size<16)fail('Invalid WAV fmt chunk');fmt={codec:buffer.readUInt16LE(pos+8),channels:buffer.readUInt16LE(pos+10),rate:buffer.readUInt32LE(pos+12),bytesPerSec:buffer.readUInt32LE(pos+16),bits:buffer.readUInt16LE(pos+22)};}
    if(name==='data')data={offset:pos+8,size};
    pos+=8+size+(size%2);
  }
  if(!fmt||!data||fmt.codec!==1||fmt.channels<1||fmt.channels>2||![16000,22050,24000,44100,48000].includes(fmt.rate)||fmt.bits!==16||fmt.bytesPerSec!==fmt.rate*fmt.channels*2)fail('Unsupported WAV: use PCM16 mono/stereo 16/22.05/24/44.1/48 kHz');
  const durationMs=Math.round(data.size/fmt.bytesPerSec*1000);
  if(durationMs<150||durationMs>60000)fail('Clip must last 0.15 to 60 seconds');
  // Avoid accepting a muted or all-silence clip as a finished narration.
  let maximum=0;for(let p=data.offset;p+1<data.offset+data.size;p+=2){maximum=Math.max(maximum,Math.abs(buffer.readInt16LE(p)));}
  if(maximum<300)fail('Audio is silent or too quiet; review the original recording');
  return durationMs;
}
async function verify(dir){
  const pack=JSON.parse(await readFile(join(dir,'pack.json'),'utf8'));
  const parsed=inspectVoicePack(pack);
  if(!parsed.valid)fail(parsed.errors.join('; '));
  const listing=(await readdir(join(dir,'clips'))).filter(x=>x.endsWith('.wav')).sort();
  if(listing.length!==parsed.recordings.length)fail('Orphan or missing WAV audio in clips folder');
  for(const r of parsed.recordings){
    const name=basename(r.path);
    if(!listing.includes(name))fail(`Missing recording: ${r.path}`);
    const bytes=await readFile(join(dir,r.path));
    if(bytes.length!==r.bytes||hash(bytes)!==r.sha256)fail(`Corrupt recorded audio: ${r.cueId}`);
    if(parseWav(bytes)!==r.durationMs)fail(`Invalid duration: ${r.cueId}`);
  }
  return {id:pack.id,count:parsed.recordings.length,missing:parsed.missingCueIds.length};
}
async function plan(lang,dir){
  if(!isLang(lang))fail('Choose one of '+targetLanguages.join(', '));
  await mkdir(dir,{recursive:true});
  const cues=authoredVoiceCues.filter(c=>c.language===lang).map(c=>({id:c.id,file:`clips/${fileName(c)}`,text:c.text,locale:c.locale,fingerprint:cueFingerprint(c.text),rightsOwner:'',rightsReference:'',reviewer:''}));
  const rights={schema:1,language:lang,recordings:cues.map(c=>({cueId:c.id,file:c.file,rightsOwner:c.rightsOwner,rightsReference:c.rightsReference,reviewer:c.reviewer,license:'voicefirst-original'}))};
  await writeFile(join(dir,'script.json'),JSON.stringify({language:lang,cues},null,2)+'\n');
  await writeFile(join(dir,'rights.example.json'),JSON.stringify(rights,null,2)+'\n');
  console.log(`Prepared ${cues.length} original narration lines in ${dir}. Record WAV files, add rights.json with real permissions; no audio generated.`);
}
async function build(lang,src,out){
  if(!isLang(lang))fail('Invalid language');
  if(resolve(src)===resolve(out))fail('Input and output must differ');
  const rights=JSON.parse(await readFile(join(src,'rights.json'),'utf8'));
  if(rights.schema!==1||rights.language!==lang||!Array.isArray(rights.recordings))fail('Invalid rights.json');
  const sourceRights=new Map();
  for(const r of rights.recordings){if(typeof r.cueId!=='string'||sourceRights.has(r.cueId))fail('Invalid or duplicate permission');sourceRights.set(r.cueId,r);}
  const cues=authoredVoiceCues.filter(c=>c.language===lang);
  if([...sourceRights.keys()].some(id=>!cues.some(c=>c.id===id)))fail('Unknown cue in rights manifest');
  const tmp=`${resolve(out)}.staging-${process.pid}`;
  await rm(tmp,{recursive:true,force:true});await mkdir(join(tmp,'clips'),{recursive:true});
  try {
    const recordings=[];
    for(const c of cues){
      const rightsEntry=sourceRights.get(c.id);if(!rightsEntry)continue; // explicitly partial pack
      const file=`clips/${fileName(c)}`;
      if(rightsEntry.file!==file)fail('Permission entry does not match authored cue path');
      const original=join(src,file);const info=await lstat(original);
      if(!info.isFile()||info.isSymbolicLink()||info.size>8*1024*1024)fail('Missing or oversized original WAV');
      const buffer=await readFile(original);
      const durationMs=parseWav(buffer);
      await copyFile(original,join(tmp,file));
      recordings.push({cueId:c.id,fingerprint:cueFingerprint(c.text),language:lang,locale:voiceLocales[lang],path:file,format:'wav',sha256:hash(buffer),bytes:buffer.length,durationMs,
        license:rightsEntry.license,rightsOwner:rightsEntry.rightsOwner,rightsReference:rightsEntry.rightsReference,reviewer:rightsEntry.reviewer,
        ...(rightsEntry.license==='licensed-third-party'?{permissionReference:rightsEntry.permissionReference}:{})});
    }
    const result={schema:1,id:`voicefirst-${lang}-v1`,language:lang,locale:voiceLocales[lang],complete:recordings.length===cues.length,recordings};
    const v=inspectVoicePack(result);if(!v.valid)fail(v.errors.join('; '));
    const extra=await readdir(join(src,'clips')).catch(()=>[]);
    const expected=new Set(recordings.map(x=>basename(x.path)));
    if(extra.some(x=>x.endsWith('.wav')&&!expected.has(x)))fail('Unregistered WAV recording in source folder');
    await writeFile(join(tmp,'pack.json'),JSON.stringify(result,null,2)+'\n');
    await verify(tmp);
    await rm(out,{recursive:true,force:true});
    await mkdir(dirname(resolve(out)),{recursive:true});
    const {rename}=await import('node:fs/promises');await rename(tmp,resolve(out));
    console.log(`Verified ${recordings.length} WAV recordings for ${lang} in ${out}; missing ${v.missingCueIds.length} cues.`);
  }catch(e){await rm(tmp,{recursive:true,force:true});throw e;}
}
const [mode,first,second,third]=process.argv.slice(2);
try{
  if(mode==='plan'&&first&&second)await plan(first,second);
  else if(mode==='build'&&first&&second&&third)await build(first,second,third);
  else if(mode==='verify'&&first)console.log('Verified pack:',await verify(first));
  else fail('Usage: voice-pack.mjs plan LANG DIRECTORY | build LANG SOURCE OUTPUT | verify PACK_DIRECTORY');
}catch(e){console.error('VOICE PACK ERROR:',e.message);process.exitCode=1;}
