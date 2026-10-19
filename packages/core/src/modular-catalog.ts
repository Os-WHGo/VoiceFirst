/** Pure modular catalog prototype. No network or native installation. */
import {targetLanguages,type TargetLanguage} from './types.js';
export type PackKind='course'|'regional'|'asr'|'tts'|'tutor'|'exam';
export interface LanguagePack {id:string;kind:PackKind;locales:readonly TargetLanguage[];dependencies:readonly string[];bytes:number;sha256:string;licenseId:string;sourceUrl:string}
export type PlanResult={ok:true;install:readonly string[];totalBytes:number}|{ok:false;reason:'missing'|'cycle'|'invalid'};
const idPattern=/^[a-zA-Z0-9._-]{1,100}$/;
export function planLanguagePacks(catalog:readonly LanguagePack[],installed:readonly string[],requested:readonly string[]):PlanResult{
 const map=new Map<string,LanguagePack>();
 for(const p of catalog){
  if(!idPattern.test(p.id)||map.has(p.id)||!['course','regional','asr','tts','tutor','exam'].includes(p.kind)||!Number.isSafeInteger(p.bytes)||p.bytes<=0||!(/^[a-fA-F0-9]{64}$/).test(p.sha256)||!p.licenseId.trim()||!p.sourceUrl.startsWith('https://')||!p.locales.length||p.locales.some(l=>!targetLanguages.includes(l))||p.dependencies.some(d=>!idPattern.test(d)))return {ok:false,reason:'invalid'};
  map.set(p.id,p);
 }
 const existing=new Set(installed),visiting=new Set<string>(),visited=new Set<string>(),ordered:string[]=[];
 let reason:'missing'|'cycle'|null=null;
 function visit(id:string):boolean{
  if(visited.has(id))return true;
  if(visiting.has(id)){reason='cycle';return false;}
  const p=map.get(id);if(!p){reason='missing';return false;}
  visiting.add(id);
  for(const dep of p.dependencies)if(!visit(dep))return false;
  visiting.delete(id);visited.add(id);
  if(!existing.has(id))ordered.push(id);
  return true;
 }
 for(const id of requested)if(!visit(id))return {ok:false,reason:reason??'missing'};
 return {ok:true,install:ordered,totalBytes:ordered.reduce((n,id)=>n+map.get(id)!.bytes,0)};
}
