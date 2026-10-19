/** Offline model package manifest validation. This does not install or execute a model. */
import {targetLanguages,type TargetLanguage} from './types.js';
import type {LocalTextRuntime} from './local-inference-selection.js';
export interface LocalModelPackage {id:string;runtime:LocalTextRuntime;locales:readonly TargetLanguage[];bytes:number;sha256:string;licenseId:string;licenseReviewed:boolean;sourceUrl:string;contextTokens:number}
export type PackageCheck={status:'valid'}|{status:'invalid';reason:'identity'|'languages'|'size'|'checksum'|'license'|'source'|'context'};
export function validateLocalModelPackage(pkg:LocalModelPackage):PackageCheck{
 if(!pkg||typeof pkg.id!=='string'||!(/^[a-zA-Z0-9._-]{1,100}$/).test(pkg.id)||!['llama.cpp','executorch','onnxruntime'].includes(pkg.runtime))return {status:'invalid',reason:'identity'};
 if(!Array.isArray(pkg.locales)||!pkg.locales.length||pkg.locales.some(l=>!targetLanguages.includes(l)))return {status:'invalid',reason:'languages'};
 if(!Number.isSafeInteger(pkg.bytes)||pkg.bytes<=0)return {status:'invalid',reason:'size'};
 if(typeof pkg.sha256!=='string'||!(/^[a-fA-F0-9]{64}$/).test(pkg.sha256))return {status:'invalid',reason:'checksum'};
 if(!pkg.licenseReviewed||typeof pkg.licenseId!=='string'||!pkg.licenseId.trim())return {status:'invalid',reason:'license'};
 if(typeof pkg.sourceUrl!=='string'||!pkg.sourceUrl.startsWith('https://'))return {status:'invalid',reason:'source'};
 if(!Number.isInteger(pkg.contextTokens)||pkg.contextTokens<512)return {status:'invalid',reason:'context'};
 return {status:'valid'};
}
