/** Offline speech engine eligibility policy. No ASR model is installed by this module.
 * A runtime must supply verified model metadata after native integration.
 */
export type SpeechEngineId='whisper-cpp'|'sherpa-onnx'|'moonshine';
export type SpeechModelReadiness='installed'|'not-installed'|'unverified';
export interface OfflineSpeechCandidate {
  engine:SpeechEngineId;
  modelId:string;
  supportedLocales:readonly string[];
  readiness:SpeechModelReadiness;
  licenseVerified:boolean;
  deviceTested:boolean;
}
export type OfflineSpeechSelection=
 | {status:'ready';candidate:OfflineSpeechCandidate}
 | {status:'needs-device-test'|'needs-license-review'|'needs-installation'|'unsupported-language'|'no-candidates'};
/** Exact locale match only. A generic 'en' model must not silently claim en-CA
 * support. Do not infer performance or dialect accuracy from model metadata.
 */
export function selectOfflineSpeechCandidate(locale:string,candidates:readonly OfflineSpeechCandidate[]):OfflineSpeechSelection{
 if(!locale.trim()||candidates.length===0)return{status:'no-candidates'};
 const eligible=candidates.filter(c=>c.supportedLocales.some(l=>l.toLowerCase()===locale.toLowerCase()));
 if(eligible.length===0)return{status:'unsupported-language'};
 const installed=eligible.filter(c=>c.readiness==='installed');
 if(installed.length===0)return{status:'needs-installation'};
 const licensed=installed.filter(c=>c.licenseVerified);
 if(licensed.length===0)return{status:'needs-license-review'};
 const tested=licensed.find(c=>c.deviceTested);
 if(!tested)return{status:'needs-device-test'};
 return{status:'ready',candidate:tested};
}
