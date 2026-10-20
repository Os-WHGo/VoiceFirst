/** Pure APK release artifact verification. Caller provides tool outputs and archive entries. */
export function inspectReleaseApk({entries,signature,packageBadging,manifest}){
 const errors=[];
 if(!Array.isArray(entries)||!entries.some(x=>/^assets\/(?:index\.android\.bundle|[^/]+\.hbc)$/.test(x)))errors.push('Missing embedded Android JS/Hermes bundle');
 if(typeof signature!=='string'||!/Verified using v[123] scheme[^\n]*:\s*true\b/i.test(signature))errors.push('No verified APK signing scheme');
 if(typeof packageBadging!=='string'||!/^package: name='com\.oswhgo\.voicefirst'(?=\s|$)/m.test(packageBadging))errors.push('Unexpected Android application ID');
 if(typeof manifest!=='string'||!manifest.trim()||!/E:\\s*(?:manifest|application)\\b/.test(manifest))errors.push('Missing parseable Android manifest inspection output');
 else if(/android:debuggable[^\n]*(?:0xffffffff|\(type 0x12\)0x1\b|true\b)/i.test(manifest))errors.push('Android release manifest is debuggable');
 return {ok:errors.length===0,errors};
}
