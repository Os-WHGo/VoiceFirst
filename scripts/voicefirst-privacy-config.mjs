/** Source-config guard. Prevents accidental privilege escalation to
 * background recording/playback or unexpected background location access.
 * Does not prove runtime permission behavior on physical devices.
 */
export function auditVoiceFirstPrivacyConfig(input){
 const expo=input?.expo;
 const errors=[];
 if(!expo||typeof expo!=='object'||Array.isArray(expo))
  return {ok:false,errors:['Missing Expo app configuration']};
 if(!Array.isArray(expo.plugins))
  return {ok:false,errors:['Missing Expo plugin configuration']};
 const lookup=name=>expo.plugins.filter(p=>(Array.isArray(p)?p[0]:p)===name);
 const audio=lookup('expo-audio'),speech=lookup('expo-speech-recognition');
 if(audio.length!==1||!Array.isArray(audio[0])||!audio[0][1]||
    typeof audio[0][1]!=='object')
  errors.push('Expo audio requires one explicit permission and background-mode configuration');
 else{
  const p=audio[0][1];
  if(p.enableBackgroundRecording!==false)errors.push('Background recording must remain disabled');
  if(p.enableBackgroundPlayback!==false)errors.push('Background playback needs separate B2 authorization');
  if(typeof p.microphonePermission!=='string'||p.microphonePermission.trim().length<20)
   errors.push('Missing visible microphone consent purpose');
 }
 if(speech.length!==1||!Array.isArray(speech[0])||!speech[0][1]||
    typeof speech[0][1]!=='object')
  errors.push('Explicit speech-recognition permissions required');
 else{
  const p=speech[0][1];
  for(const key of ['microphonePermission','speechRecognitionPermission']){
   if(typeof p[key]!=='string'||p[key].trim().length<20)
    errors.push('Missing speech-recognition consent purpose '+key);
  }
 }
 const modes=expo.ios?.infoPlist?.UIBackgroundModes;
 if(modes!==undefined&&(!Array.isArray(modes)||modes.length>0))
  errors.push('iOS background modes need separate B2 approval and device tests');
 const permissions=expo.android?.permissions;
 if(permissions!==undefined){
  if(!Array.isArray(permissions)||permissions.some(x=>typeof x!=='string'))
   errors.push('Malformed Android permissions');
  else if(permissions.some(x=>/^(?:android\.permission\.)?(?:ACCESS_BACKGROUND_LOCATION|FOREGROUND_SERVICE|FOREGROUND_SERVICE_MICROPHONE|FOREGROUND_SERVICE_MEDIA_PLAYBACK)$/.test(x)))
   errors.push('Android foreground service/background privileges need separate B2 approval');
 }
 return {ok:errors.length===0,errors};
}
