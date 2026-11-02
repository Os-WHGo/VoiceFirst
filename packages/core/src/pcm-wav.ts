/** Strict bounded WAV verification, shared by desktop pack authoring and mobile.
 * A filename, MIME hint, RIFF header and SHA-256 of a manifest-controlled file
 * do not by themselves prove valid, audible PCM narration.
 */
export type WavInspection={valid:true;durationMs:number;sampleRate:number;channels:number}|
 {valid:false;reason:string};
const PCM_RATES=new Set([16_000,22_050,24_000,44_100,48_000]);
const ascii=(b:Uint8Array,at:number,length:number)=>
 String.fromCharCode(...b.subarray(at,at+length));
export function inspectPcmWav(bytes:Uint8Array,expectedDurationMs?:number):WavInspection{
 const bad=(reason:string):WavInspection=>({valid:false,reason});
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<44||bytes.byteLength>8*1024*1024)return bad('Invalid WAV size');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(ascii(bytes,0,4)!=='RIFF'||ascii(bytes,8,4)!=='WAVE')return bad('Missing RIFF/WAVE marker');
 if(view.getUint32(4,true)!==bytes.byteLength-8)return bad('RIFF length mismatch');
 let pos=12;
 let fmt:{channels:number;sampleRate:number;bytesPerSecond:number;blockAlign:number}|null=null;
 let data:{offset:number;size:number}|null=null;
 while(pos+8<=bytes.byteLength){
  const name=ascii(bytes,pos,4);
  const size=view.getUint32(pos+4,true);
  const end=pos+8+size;
  if(end>bytes.byteLength)return bad('Truncated WAV chunk');
  if(name==='fmt '){
   if(fmt||size<16)return bad('Invalid or duplicate WAV format chunk');
   const codec=view.getUint16(pos+8,true),channels=view.getUint16(pos+10,true),
     sampleRate=view.getUint32(pos+12,true),bytesPerSecond=view.getUint32(pos+16,true),
     blockAlign=view.getUint16(pos+20,true),bits=view.getUint16(pos+22,true);
   if(codec!==1||channels<1||channels>2||!PCM_RATES.has(sampleRate)||bits!==16||
     blockAlign!==channels*2||bytesPerSecond!==sampleRate*blockAlign)return bad('Unsupported PCM format');
   fmt={channels,sampleRate,bytesPerSecond,blockAlign};
  }
  if(name==='data'){
   if(data||size===0)return bad('Invalid or duplicate data chunk');
   data={offset:pos+8,size};
  }
  pos=end+(size%2);
 }
 if(pos!==bytes.byteLength||!fmt||!data)return bad('Incomplete WAV chunks');
 if(data.size%fmt.blockAlign!==0)return bad('Incomplete PCM audio frame');
 const durationMs=Math.round(data.size/fmt.bytesPerSecond*1000);
 if(durationMs<150||durationMs>60_000)return bad('Duration outside 0.15 to 60 seconds');
 if(expectedDurationMs!==undefined&&(!Number.isSafeInteger(expectedDurationMs)||durationMs!==expectedDurationMs))
   return bad('Recorded duration does not match manifest');
 let peak=0;
 for(let at=data.offset;at<data.offset+data.size;at+=2)
  peak=Math.max(peak,Math.abs(view.getInt16(at,true)));
 if(peak<300)return bad('Muted or nearly silent recording');
 return {valid:true,durationMs,sampleRate:fmt.sampleRate,channels:fmt.channels};
}
