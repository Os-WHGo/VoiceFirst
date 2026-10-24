/** Prototype only: dependency planning for optional course packs. No downloads or installations. */
import {targetLanguages,type TargetLanguage} from './types.js';
export type PackKind='course'|'variant'|'asr'|'tts'|'tutor'|'exam';
export interface LanguagePack {id:string;kind:PackKind;version:string;bytes:number;dependencies:readonly string[];locales:readonly TargetLanguage[];sha256:string;licenseId:string;licenseReviewed:boolean;sourceUrl:string}
export type PackPlan={status:'ready';install:readonly string[];bytes:number}|{status:'invalid';reason:string};
const validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id);
export function planLanguagePacks(catalog:readonly LanguagePack[],requested:readonly string[],installed:readonly string[]=[]):PackPlan{
 const map=new Map<string,LanguagePack>();
 if(!Array.isArray(catalog)||!Array.isArray(requested)||!Array.isArray(installed)||catalog.length>500||requested.length>100||installed.length>500)return {status:'invalid',reason:'Catalog limit'};
 for(const p of catalog){
  if(!p||typeof p!=='object'||!validId(p.id)||map.has(p.id)||!['course','variant','asr','tts','tutor','exam'].includes(p.kind)||typeof p.version!=='string'||!/^\d+\.\d+\.\d+$/.test(p.version)||!Number.isSafeInteger(p.bytes)||p.bytes<=0||!Array.isArray(p.dependencies)||p.dependencies.length>50||p.dependencies.some((d:unknown)=>!validId(d))||!Array.isArray(p.locales)||p.locales.length===0||p.locales.some((l:TargetLanguage)=>!targetLanguages.includes(l))||typeof p.sha256!=='string'||!(/^[a-f0-9]{64}$/i).test(p.sha256)||p.licenseReviewed!==true||typeof p.licenseId!=='string'||!p.licenseId.trim()||typeof p.sourceUrl!=='string'||!p.sourceUrl.startsWith('https://'))return {status:'invalid',reason:'Invalid manifest'};
  map.set(p.id,p);
 }
 const installedSet=new Set(installed);
 if([...requested,...installed].some(id=>typeof id!=='string'||!validId(id)||!map.has(id)))return {status:'invalid',reason:'Unknown pack'};
 const state=new Map<string,number>(),order:string[]=[];
 function visit(id:string):boolean{
  if(state.get(id)===1)return false;
  if(state.get(id)===2)return true;
  const p=map.get(id);if(!p)return false;
  state.set(id,1);
  for(const dep of p.dependencies)if(!visit(dep))return false;
  state.set(id,2);
  if(!installedSet.has(id))order.push(id);
  return true;
 }
 for(const id of requested)if(!visit(id))return {status:'invalid',reason:'Missing or cyclic dependency'};
 const bytes=order.reduce((sum,id)=>sum+map.get(id)!.bytes,0);
 if(!Number.isSafeInteger(bytes))return {status:'invalid',reason:'Download size overflow'};
 return {status:'ready',install:order,bytes};
}
