/** Portable, rights-gated lexical metadata for educational and audiovisual apps.
 * No network, ASR inference, translations, training or community content.
 * A syntactically valid review reference is NOT evidence that review occurred.
 */
import {lexicalSeed} from './lexical-seed.js';
import {lessonsFor} from './course.js';
import {targetLanguages} from './types.js';
import {a1EditorialDrafts} from './course-content-a1-drafts.js';

export type LexiconUse='lesson'|'subtitle-hint'|'speech-hint';
export type LexiconReview='draft'|'reviewed';
export type LexiconRights='pending'|'granted';
export interface PortableLexicalRecord{
 id:string;
 /** BCP 47 locale or approved community language tag; never assume a dialect. */
 locale:string;
 /** ISO 15924 script such as Latn, Cyrl or Cans. */
 script:string;
 kind:'word'|'phrase';
 /** Original spelling. NFC/NFD matching may be used, but export preserves bytes. */
 form:string;
 alternatives:readonly string[];
 senseId:string;
 /** Optional exact source linkage, not a dictionary translation or CEFR claim. */
 sourceLessonId?:string;
 band?:'A0'|'A1';
 register:'neutral'|'polite'|'informal'|'vulgar';
 review:{status:LexiconReview;evidenceRef?:string};
 rights:{
  status:LexiconRights;
  rightsHolder:string;
  licenseRef:string;
  allowedUses:readonly LexiconUse[];
  communityControlled:boolean;
  /** Additional explicit authorization is mandatory for community-controlled data. */
  communityAuthorizationRef?:string;
 };
}
export interface PortableLexiconBundle{
 schema:'voicefirst.lexicon.v1';
 locale:string;
 use:LexiconUse;
 /** Only records with explicit review and usage rights may be exported. */
 entries:readonly PortableLexicalRecord[];
}
export type LexiconBuildResult=
 |{status:'blocked';errors:readonly string[]}
 |{status:'ok';bundle:PortableLexiconBundle;notExported:number};

const uses:readonly LexiconUse[]=['lesson','subtitle-hint','speech-hint'];
const localeRE=/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
const idRE=/^[a-z0-9][a-z0-9._-]{0,99}$/;
const scriptRE=/^[A-Z][a-z]{3}$/;
const safeText=(value:unknown,max:number):value is string=>
 typeof value==='string'&&value.trim().length>0&&value.length<=max&&
 !/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u.test(value);
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const goodRef=(v:unknown)=>safeText(v,250)&&v===v.trim();
const isLexiconUse=(v:unknown):v is LexiconUse=>uses.includes(v as LexiconUse);

/** Reject contradictory and incomplete metadata. Editorial/legal review remains human. */
export function validatePortableLexicalRecord(value:unknown):string|null{
 if(!plain(value))return 'Record must be an object';
 const r=value;
 if(typeof r.id!=='string'||!idRE.test(r.id))return 'Invalid record ID';
 if(typeof r.locale!=='string'||!localeRE.test(r.locale))return 'Invalid locale';
 if(typeof r.script!=='string'||!scriptRE.test(r.script))return 'Invalid script';
 if(r.kind!=='word'&&r.kind!=='phrase')return 'Invalid entry kind';
 if(!safeText(r.form,600)||r.form!==r.form.trim())return 'Invalid original form';
 if(typeof r.senseId!=='string'||!idRE.test(r.senseId))return 'Invalid sense ID';
 if(r.sourceLessonId!==undefined&&(typeof r.sourceLessonId!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/).test(r.sourceLessonId)))return 'Invalid source lesson';
 if(r.band!==undefined&&r.band!=='A0'&&r.band!=='A1')return 'Invalid course band';
 if(!['neutral','polite','informal','vulgar'].includes(r.register as string))return 'Invalid register';
 if(!Array.isArray(r.alternatives)||r.alternatives.length>20||
    r.alternatives.some((v:unknown)=>!safeText(v,600)||v!==v.trim()))return 'Invalid alternatives';
 if(!plain(r.review)||!['draft','reviewed'].includes(r.review.status as string))return 'Invalid review status';
 if(r.review.status==='reviewed'&&!goodRef(r.review.evidenceRef))return 'Missing review evidence reference';
 if(!plain(r.rights)||!['pending','granted'].includes(r.rights.status as string))return 'Invalid rights status';
 const rights=r.rights;
 if(!Array.isArray(rights.allowedUses)||rights.allowedUses.length>uses.length||
    rights.allowedUses.some((use:unknown)=>!isLexiconUse(use))||
    new Set(rights.allowedUses).size!==rights.allowedUses.length)return 'Invalid reuse permissions';
 if(typeof rights.communityControlled!=='boolean')return 'Missing community control flag';
 if(rights.status==='granted'&&(!goodRef(rights.rightsHolder)||!goodRef(rights.licenseRef)||
    rights.allowedUses.length===0))return 'Missing license and rights evidence';
 if(rights.communityControlled&&rights.status==='granted'&&!goodRef(rights.communityAuthorizationRef))
    return 'Missing community authorization';
 // Deliberately no automatic fallback from script, related language or presumed rights.
 return null;
}

/** Project seed remains DRAFT. It cannot be silently republished as a dictionary
 * or speech-model vocabulary, even though phrases are authored in the project.
 */
export function portableLexiconDraftsFromSeed():readonly PortableLexicalRecord[]{
 return lexicalSeed.map(row=>({
  id:'seed-'+row.id,locale:row.locale,script:'Latn' as const,kind:'phrase' as const,
  form:row.canonical,alternatives:[...row.alternatives],
  senseId:'intent-'+row.intent,register:row.register,
  review:{status:'draft' as const},
  rights:{status:'pending' as const,rightsHolder:'VoiceFirst - verification pending',
   licenseRef:'pending',allowedUses:[] as LexiconUse[],communityControlled:false}
 }));
}

/** Link all 84 existing micro-lessons to a portable editorial lexicon queue.
 * Only first authored exercise phrases and their already-authored alternatives.
 * No tokenizing, invention of translations, automatic CEFR advancement or rights claim.
 */
export function portableLexiconDraftsFromCourse():readonly PortableLexicalRecord[]{
 return targetLanguages.flatMap(locale=>lessonsFor(locale).map(lesson=>{
  const first=lesson.exercises[0]!;
  const alternatives=[...new Set(first.alternatives.filter(text=>text!==first.utterance))];
  return{
   id:'course-'+lesson.id.toLowerCase(),locale,script:'Latn',kind:'phrase' as const,
   form:first.utterance,alternatives,senseId:'context-'+lesson.focusTag,
   sourceLessonId:lesson.id,band:lesson.band,register:'neutral' as const,
   review:{status:'draft' as const},
   rights:{status:'pending' as const,rightsHolder:'VoiceFirst - verification pending',
    licenseRef:'pending',allowedUses:[] as LexiconUse[],communityControlled:false}
  };
 }));
}

/** Semantic A1 phrase patterns from the new human-authored curriculum drafts.
 * These are NOT dictionary translations, recorded audio or lesson releases.
 * Every item remains rights-pending and cannot enter a production subtitle pack.
 */
export function portableLexiconDraftsFromA1Authoring():readonly PortableLexicalRecord[]{
 return a1EditorialDrafts.flatMap(unit=>unit.lexemes.map(phrase=>({
  id:['a1',unit.targetLanguage.toLowerCase(),unit.unitId,phrase.conceptId].join('-'),
  locale:unit.targetLanguage,
  script:'Latn',
  kind:'phrase' as const,
  form:phrase.form,
  alternatives:[] as string[],
  senseId:'concept-'+phrase.conceptId,
  band:'A1' as const,
  register:phrase.conceptId==='ask-repeat'?'polite' as const:
   phrase.conceptId==='hello'&&unit.targetLanguage==='it'?'informal' as const:'neutral' as const,
  review:{status:'draft' as const},
  rights:{status:'pending' as const,rightsHolder:'VoiceFirst - verification pending',
    licenseRef:'pending',allowedUses:[] as LexiconUse[],communityControlled:false}
 })));
}

/** Safe, JSON-serializable cross-app export: only explicitly reviewed,
 * explicitly licensed, per-use records in the EXACT requested locale.
 */
export function buildPortableLexiconBundle(input:unknown,use:LexiconUse,locale:string):LexiconBuildResult{
 if(!isLexiconUse(use)||typeof locale!=='string'||!localeRE.test(locale)||
    !Array.isArray(input)||input.length>10000)return{status:'blocked',errors:['Invalid request']};
 const errors:string[]=[],ids=new Set<string>();
 const entries:PortableLexicalRecord[]=[];let notExported=0;
 for(const [i,r] of input.entries()){
  const reason=validatePortableLexicalRecord(r);
  if(reason){errors.push('Entry '+i+': '+reason);continue;}
  const record=r as PortableLexicalRecord;
  if(ids.has(record.id)){errors.push('Duplicate record ID '+record.id);continue;}
  ids.add(record.id);
  if(record.locale!==locale||record.review.status!=='reviewed'||record.rights.status!=='granted'||
     !record.rights.allowedUses.includes(use)){notExported++;continue;}
  // Clone allow-listed data. Do not export unknown fields, tokens or editorial notes.
  entries.push({
   id:record.id,locale:record.locale,script:record.script,kind:record.kind,
   form:record.form,alternatives:[...record.alternatives],senseId:record.senseId,
   ...(record.sourceLessonId?{sourceLessonId:record.sourceLessonId}:{}),
   ...(record.band?{band:record.band}:{}),
   register:record.register,review:{status:'reviewed',evidenceRef:record.review.evidenceRef},
   rights:{status:'granted',rightsHolder:record.rights.rightsHolder,
    licenseRef:record.rights.licenseRef,allowedUses:[...record.rights.allowedUses],
    communityControlled:record.rights.communityControlled,
    ...(record.rights.communityControlled?{communityAuthorizationRef:record.rights.communityAuthorizationRef}:{})}
  });
 }
 if(errors.length)return{status:'blocked',errors};
 return{status:'ok',bundle:{schema:'voicefirst.lexicon.v1',locale,use,entries},notExported};
}


/** Strict import boundary for another app. No network, disk or code execution.
 * JSON from third parties is NOT trusted simply because it claims to be reviewed.
 * Real signature/licensing checks remain a separate integrator responsibility.
 */
export function parsePortableLexiconBundle(raw:unknown):LexiconBuildResult{
 if(typeof raw!=='string'||raw.length===0||raw.length>1_000_000)
  return{status:'blocked',errors:['Invalid serialized bundle size']};
 let decoded:unknown;
 try{decoded=JSON.parse(raw);}catch{return{status:'blocked',errors:['Invalid JSON']};}
 if(!plain(decoded)||decoded.schema!=='voicefirst.lexicon.v1'||
    !isLexiconUse(decoded.use)||typeof decoded.locale!=='string')
  return{status:'blocked',errors:['Unsupported lexical schema']};
 const result=buildPortableLexiconBundle(decoded.entries,decoded.use,decoded.locale);
 if(result.status!=='ok')return result;
 // Published bundles must contain only permitted and reviewed records. Internal
 // draft queues may be loaded by the editor separately, never by consumers.
 if(result.notExported!==0)return{status:'blocked',errors:['Unapproved entry in exported bundle']};
 return result;
}

/** Subtitle suggestions are optional exact hints, never a correction of ASR output.
 * Normalization preserves orthographic distinctions, accents and punctuation.
 */
export function findPortableLexicalHints(bundle:PortableLexiconBundle,phrase:string):readonly PortableLexicalRecord[]{
 if(!safeText(phrase,600)||bundle.schema!=='voicefirst.lexicon.v1'||bundle.use!=='subtitle-hint')return [];
 const normalized=phrase.normalize('NFC').toLocaleLowerCase(bundle.locale);
 return bundle.entries.filter(r=>r.locale===bundle.locale&&
  r.review.status==='reviewed'&&r.rights.status==='granted'&&
  r.rights.allowedUses.includes('subtitle-hint')&&
  (!r.rights.communityControlled||!!r.rights.communityAuthorizationRef)&&
  validatePortableLexicalRecord(r)===null&&
  [r.form,...r.alternatives].some(f=>f.normalize('NFC').toLocaleLowerCase(bundle.locale)===normalized));
}
