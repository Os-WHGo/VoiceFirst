/** Fail-closed URL boundary for the OPTIONAL, cost-bearing development voice lab.
 * Private address does not equal user consent or guarantee a trustworthy server.
 * Public builds must not read EXPO_PUBLIC_VOICEFIRST_DEV_URL or allow this route.
 */
function privateIPv4(hostname:string):boolean {
 const pieces=hostname.split('.');
 if(pieces.length!==4||pieces.some(p=>!/^(0|[1-9][0-9]{0,2})$/.test(p)||Number(p)>255))return false;
 const [a,b]=pieces.map(Number);
 return a===127||a===10||(a===172&&b>=16&&b<=31)||(a===192&&b===168);
}
export function privateVoiceLabDevUrl(raw:unknown,development:boolean):string|null {
 if(development!==true||typeof raw!=='string'||raw.length===0||raw.length>200||
  raw.trim()!==raw)return null;
 try {
  const url=new URL(raw);
  if(url.protocol!=='http:'||url.username||url.password||url.search||url.hash||
   (url.pathname!==''&&url.pathname!=='/')||
   !(url.hostname==='localhost'||url.hostname==='[::1]'||privateIPv4(url.hostname)))return null;
  return url.origin;
 }catch{return null;}
}
/** Never store API keys, learner data or external host approval in this module. */
