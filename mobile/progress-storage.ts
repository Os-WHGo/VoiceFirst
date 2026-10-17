/** Stores ONLY curated lesson IDs, attempt counts and review dates (no voice, transcripts,
 * names or medical categories). expo-sqlite kv-store is persisted locally but NOT encrypted.
 * Future sensitive data requires SQLCipher and key management; don't repurpose this store.
 */
import Storage from 'expo-sqlite/kv-store';
import {dialoguesFor,deserializeLearningProgress,newLearningProgress,serializeLearningProgress,
  type LocalLearningProgress,type TargetLanguage} from '@voicefirst/core';

function key(language:TargetLanguage){return `voicefirst.progress.v1.${language}`;}
export type StoredProgress = {kind:'ready';value:LocalLearningProgress} | {kind:'blocked';reason:string};
export async function loadLocalProgress(target:TargetLanguage):Promise<StoredProgress>{
  try {
    const raw=await Storage.getItem(key(target));
    if(raw===null)return {kind:'ready',value:newLearningProgress(target)};
    const result=deserializeLearningProgress(raw,target,dialoguesFor(target));
    if(result.kind!=='ok')return {kind:'blocked',reason:`Datos locales incompatibles o dañados (${result.reason}). No se borraron.`};
    return {kind:'ready',value:result.progress};
  }catch {return {kind:'blocked',reason:'No se pudo leer el almacenamiento local. Los datos existentes no se modificaron.'};}
}
export async function storeLocalProgress(p:LocalLearningProgress):Promise<void>{
  await Storage.setItem(key(p.target),serializeLearningProgress(p));
}
