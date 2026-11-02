#!/usr/bin/env node
/** Copyright-free authoring utility: no network or generative inference.
 * Usage:
 *  node scripts/voice-pack.mjs plan <lang> <folder>
 *  node scripts/voice-pack.mjs build <lang> <source-folder> <output-folder>
 *  node scripts/voice-pack.mjs verify <output-folder>
 * For build the source contains rights.json and WAV recordings named by SHA-256 cue ID.
 */
import {mkdir,readFile,writeFile,lstat,copyFile,readdir,rm,rename} from 'node:fs/promises';
import {resolve,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {authoredVoiceCues,voiceLocales,cueFingerprint,inspectVoicePack,targetLanguages,inspectPcmWav} from '../packages/core/dist/index.js';

const hash=v=>createHash('sha256').update(v).digest('hex');
const fileName=cue=>`${hash(cue.id).slice(0,24)}.wav`;
const isLang=x=>targetLanguages.includes(x);
function fail(message){throw new Error(message);}
function parseWav(buffer){
  const check=inspectPcmWav(buffer);
  if(!check.valid)fail(check.reason);
  return check.durationMs;
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
  // Previously this utility deleted the existing output with rm(out) before rename.
  // A finished, previously reviewed pack must never be silently replaced.
  if(await lstat(resolve(out)).then(()=>true,()=>false))fail('Output pack already exists; choose a new destination.');
  const rights=JSON.parse(await readFile(join(src,'rights.json'),'utf8'));
  if(rights.schema!==1||rights.language!==lang||!Array.isArray(rights.recordings))fail('Invalid rights.json');
  const sourceRights=new Map();
  for(const r of rights.recordings){if(typeof r.cueId!=='string'||sourceRights.has(r.cueId))fail('Invalid or duplicate permission');sourceRights.set(r.cueId,r);}
  const cues=authoredVoiceCues.filter(c=>c.language===lang);
  if([...sourceRights.keys()].some(id=>!cues.some(c=>c.id===id)))fail('Unknown cue in rights manifest');
  const tmp=`${resolve(out)}.staging-${process.pid}`;
  if(await lstat(tmp).then(()=>true,()=>false))fail('An unfinished staging directory already exists. Refusing to replace it.');
  await mkdir(join(tmp,'clips'),{recursive:true});
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
    await mkdir(dirname(resolve(out)),{recursive:true});
    if(await lstat(resolve(out)).then(()=>true,()=>false))fail('Output pack appeared during construction; refusing to replace it.');
    await rename(tmp,resolve(out));
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
