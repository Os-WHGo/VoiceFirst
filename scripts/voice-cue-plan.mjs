/** Produces an authoring queue, NOT synthesized audio. Node 22, no API, no credentials.
 * Output JSON is for consented human narrators or separately licensed offline TTS.
 */
import {writeFile,mkdir} from 'node:fs/promises';
import {authoredVoiceCues,authoringInventory,cueFingerprint} from '../packages/core/dist/index.js';
const out='build/voice-cue-plan.json';
const cues=authoredVoiceCues.map(x=>({...x,fingerprint:cueFingerprint(x.text),status:'needs-production',
  license:'voicefirst-original', recordingUri:null}));
await mkdir('build',{recursive:true});
await writeFile(out,JSON.stringify({schema:1,createdFrom:'curated-VoiceFirst-source',inventory:authoringInventory(),cues},null,2)+'\n','utf8');
console.log(`Planned ${cues.length} narrated questions/answers/lesson prompts across ${authoringInventory().length} languages in ${out}`);
