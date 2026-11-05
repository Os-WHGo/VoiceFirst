/** Private editorial manifest. Metadata only, not voice approval. */
import {File,Paths} from 'expo-file-system';
import {advancedListeningStoryboards,inspectAdvancedReviewManifest,type AdvancedAudioCandidate} from '@voicefirst/core';
import {privateAdvancedReviewUri} from './advanced-editorial-review-audio';
export type ReviewAssets={kind:'candidate';clips:readonly AdvancedAudioCandidate[];verified:false}|{kind:'missing'|'rejected';reason:string;verified:false};
export async function loadReviewAssets(sceneId:string):Promise<ReviewAssets>{
 const scene=advancedListeningStoryboards.find(s=>s.sceneId===sceneId);
 if(!scene)return{kind:'rejected',reason:'Unknown scene',verified:false};
 try{
  const file=new File(Paths.document,'voicefirst-advanced-review',...sceneId.split('/'),'manifest.json');
  if(!file.exists)return{kind:'missing',reason:'No local recordings installed',verified:false};
  if(file.size>16384||file.size<=0)return{kind:'rejected',reason:'Invalid manifest size',verified:false};
  const raw=await file.text();
  if(raw.length>16384)return{kind:'rejected',reason:'Manifest too large',verified:false};
  const data=inspectAdvancedReviewManifest(sceneId,JSON.parse(raw) as unknown);
  if(data.kind!=='candidate')return{kind:'rejected',reason:data.reason,verified:false};
  const clips=data.clips.map(c=>({...c,sceneId,localUri:privateAdvancedReviewUri(c.audioId)}));
  if(clips.some(c=>!c.localUri))return{kind:'rejected',reason:'Invalid local path',verified:false};
  return{kind:'candidate',clips:clips as AdvancedAudioCandidate[],verified:false};
 }catch{return{kind:'rejected',reason:'Cannot read private audio',verified:false};}
}
