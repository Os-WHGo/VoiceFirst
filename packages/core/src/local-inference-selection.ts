/** Select an explicitly installed, licensed, device-tested local text model. No downloads or API calls. */
import {targetLanguages,type TargetLanguage} from './types.js';
export type LocalTextRuntime='llama.cpp'|'executorch'|'onnxruntime';
export interface LocalTextCandidate {id:string;runtime:LocalTextRuntime;languages:readonly TargetLanguage[];installed:boolean;licenseVerified:boolean;deviceTested:boolean;memoryMb:number;contextTokens:number}
export type LocalTextSelection={status:'ready';candidate:LocalTextCandidate}|{status:'unavailable'|'unsupported-language'|'needs-installation'|'needs-license-review'|'needs-device-test'|'insufficient-memory'};
export function selectLocalTextModel(target:TargetLanguage,candidates:readonly LocalTextCandidate[],availableMemoryMb:number):LocalTextSelection {
 if(!targetLanguages.includes(target)||candidates.length===0)return {status:'unavailable'};
 const compatible=candidates.filter(c=>c.languages.includes(target)&&c.id.trim()&&Number.isFinite(c.memoryMb)&&c.memoryMb>0&&Number.isInteger(c.contextTokens)&&c.contextTokens>=512);
 if(!compatible.length)return {status:'unsupported-language'};
 const installed=compatible.filter(c=>c.installed);
 if(!installed.length)return {status:'needs-installation'};
 const licensed=installed.filter(c=>c.licenseVerified);
 if(!licensed.length)return {status:'needs-license-review'};
 const tested=licensed.filter(c=>c.deviceTested);
 if(!tested.length)return {status:'needs-device-test'};
 if(!Number.isFinite(availableMemoryMb)||availableMemoryMb<=0)return {status:'insufficient-memory'};
 const fitting=tested.filter(c=>c.memoryMb<=availableMemoryMb).sort((a,b)=>a.memoryMb-b.memoryMb);
 return fitting.length?{status:'ready',candidate:fitting[0]!}:{status:'insufficient-memory'};
}
