import test from 'node:test';
import assert from 'node:assert/strict';
import {EnergyVad,Endpointer,endpointPolicyFor,defaultEndpointPolicy,frameEnergyDb,resampleLinear,int16ToFloat32,bargeInAllowed,newTurnState,stepTurn,transcriptToSessionEvent} from '../dist/index.js';

const SR=16000;
let seed=3;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
const silence=(ms,level=0.0005)=>Float32Array.from({length:SR*ms/1000},()=>(rnd()*2-1)*level);
// Syllabic synthetic voice: 160 ms voiced, 50 ms gap, like real speech (a continuous tone is not speech-like).
const voice=(ms,amp=0.3,f=220)=>Float32Array.from({length:SR*ms/1000},(_,i)=>{const t=i/SR,inSyllable=(t%0.21)<0.16;return (inSyllable?amp*Math.sin(2*Math.PI*f*i/SR):0)+(rnd()*2-1)*0.0005;});
const join=(...parts)=>{const out=new Float32Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;};
const run=(audio,policy=defaultEndpointPolicy,chunk=777)=>{const e=new Endpointer(new EnergyVad(),policy);const out=[];for(let i=0;i<audio.length;i+=chunk)out.push(...e.push(audio.subarray(i,i+chunk)));out.push(...e.finish());return out;};

test('PCM helpers: levels, int16 conversion and resampling',()=>{
 assert.equal(frameEnergyDb(new Float32Array(480)),-120);
 assert.ok(Math.abs(frameEnergyDb(Float32Array.from({length:480},(_,i)=>Math.sin(i)))-(-3))<0.5);
 assert.deepEqual([...int16ToFloat32(Int16Array.from([0,16384,-32768]))],[0,0.5,-1]);
 const up=Float32Array.from({length:48000},(_,i)=>Math.sin(2*Math.PI*440*i/48000));
 const down=resampleLinear(up,48000,16000);
 assert.equal(down.length,16000);
 assert.ok(Math.abs(frameEnergyDb(down)-frameEnergyDb(up))<0.5);
 assert.throws(()=>resampleLinear(up,0,16000),/sample rate/);
});
test('one utterance keeps original audio before and after speech (PoC rule)',()=>{
 const events=run(join(silence(1000),voice(600),silence(1500)));
 const u=events.filter(e=>e.type==='utterance');
 assert.equal(u.length,1);assert.equal(events[0].type,'speech-start');
 const ms=u[0].samples.length*1000/SR;
 assert.ok(ms>=600+180&&ms<=600+200+400+60,`utterance ${ms} ms includes pre/post-roll`);
 assert.ok(u[0].startMs>=780&&u[0].startMs<=820,`starts ~200 ms before speech: ${u[0].startMs}`);
 assert.equal(u[0].truncated,false);
});
test('one-word answers are kept; clicks are discarded',()=>{
 assert.equal(run(join(silence(800),voice(150),silence(1500))).filter(e=>e.type==='utterance').length,1,'a 150 ms word survives');
 const click=run(join(silence(800),voice(40,0.8),silence(1500)));
 assert.ok(click.length>=1);
 assert.deepEqual(click.filter(e=>e.type!=='speech-start').map(e=>e.type),['discarded-short']);
});
test('a thinking pause inside an answer does not end the turn',()=>{
 const events=run(join(silence(500),voice(500),silence(900),voice(500),silence(1500)));
 assert.equal(events.filter(e=>e.type==='utterance').length,1,'900 ms pause < 1200 ms end silence');
 const quick=run(join(silence(500),voice(500),silence(900),voice(500),silence(1500)),{...defaultEndpointPolicy,endSilenceMs:600});
 assert.equal(quick.filter(e=>e.type==='utterance').length,2);
});
test('noise floor adapts to steady background noise',()=>{
 const noisy=level=>Float32Array.from({length:SR*2},()=>(rnd()*2-1)*level);
 // Background noise around -39 dBFS, louder than the -45 dB absolute minimum, continuous under the voice.
 const background=Float32Array.from({length:SR*4.2},()=>(rnd()*2-1)*0.02);
 const v=voice(600,0.3);for(let i=0;i<v.length;i++)background[SR*2+i]+=v[i];
 const vad=new EnergyVad();const e=new Endpointer(vad);
 const events=[...e.push(background),...e.finish()];
 assert.ok(vad.noiseFloorDb>-45,`floor followed the noise: ${vad.noiseFloorDb.toFixed(1)} dB`);
 assert.equal(events.filter(x=>x.type==='utterance').length,1);
});
test('long speech is cut at the maximum and flagged; timeouts only in timed mode',()=>{
 const long=run(voice(17000),{...defaultEndpointPolicy,maxUtteranceMs:15000});
 assert.ok(long.find(e=>e.type==='utterance').truncated);
 assert.equal(endpointPolicyFor({mode:'untimed'}).noSpeechTimeoutMs,null);
 const timed=endpointPolicyFor({mode:'timed',seconds:8});
 assert.equal(timed.noSpeechTimeoutMs,8000);
 const waited=run(silence(9000),timed);
 assert.deepEqual(waited.map(e=>e.type),['no-speech-timeout'],'reported once');
 assert.equal(run(silence(9000),endpointPolicyFor({mode:'untimed'})).length,0);
 assert.equal(endpointPolicyFor({mode:'untimed'},{endSilenceMs:100}).endSilenceMs,600,'never shorter than 600 ms');
});
test('barge-in only on echo-safe routes, after sustained speech',()=>{
 assert.equal(bargeInAllowed('speaker',false),false);assert.equal(bargeInAllowed('speaker',true),true);
 assert.equal(bargeInAllowed('bluetooth',false),true);assert.equal(bargeInAllowed('unknown',true),false);
 let s=newTurnState('wired-headset');
 let r=stepTurn(s,{type:'prompt',activityId:'a1',hasSpeech:true});s=r.state;
 assert.deepEqual(r.commands,[{type:'stop-listening'},{type:'speak',turnId:1}]);
 r=stepTurn(s,{type:'vad',speech:true,atMs:1000});s=r.state;assert.equal(r.commands.length,0);
 r=stepTurn(s,{type:'vad',speech:true,atMs:1100});s=r.state;assert.equal(r.commands.length,0,'100 ms is not enough');
 r=stepTurn(s,{type:'vad',speech:true,atMs:1250});s=r.state;
 assert.deepEqual(r.commands,[{type:'stop-speaking'},{type:'start-listening',turnId:1}]);
 let speaker=stepTurn(newTurnState('speaker'),{type:'prompt',activityId:'a1',hasSpeech:true}).state;
 for(const at of [0,300,600])speaker=stepTurn(speaker,{type:'vad',speech:true,atMs:at}).state;
 assert.equal(speaker.phase,'speaking','the lesson voice through the speaker cannot interrupt itself');
});
test('stale results never reach the current exercise',()=>{
 let s=stepTurn(newTurnState(),{type:'prompt',activityId:'a1',hasSpeech:false}).state;
 s=stepTurn(s,{type:'utterance',turnId:1}).state;
 const next=stepTurn(s,{type:'prompt',activityId:'a2',hasSpeech:false}).state;
 assert.deepEqual(stepTurn(next,{type:'transcript',turnId:1,text:'Hola',confidence:0.9}).commands,[{type:'discarded',reason:'stale-turn'}]);
 assert.deepEqual(stepTurn(next,{type:'tts-finished',turnId:1}).commands,[{type:'discarded',reason:'stale-turn'}]);
 const paused=stepTurn(s,{type:'pause'});
 assert.deepEqual(paused.commands,[{type:'stop-listening'}]);
 assert.deepEqual(stepTurn(paused.state,{type:'transcript',turnId:1,text:'Hola',confidence:0.9}).commands,[{type:'discarded',reason:'stale-turn'}]);
});
test('transcripts become session events; expected answers win over commands',()=>{
 let s=stepTurn(newTurnState(),{type:'prompt',activityId:'a1',hasSpeech:false}).state;
 s=stepTurn(s,{type:'utterance',turnId:1}).state;
 const r=stepTurn(s,{type:'transcript',turnId:1,text:'¿Me puedes ayudar?',confidence:undefined});
 assert.deepEqual(r.commands,[{type:'session-event',event:{type:'answer',response:'¿Me puedes ayudar?',source:{kind:'speech',confidence:'unknown'}}}],'no calibrated confidence → unknown');
 assert.deepEqual(transcriptToSessionEvent('repítelo',0.9,()=>false),{type:'session-event',event:{type:'replay'}});
 assert.deepEqual(transcriptToSessionEvent('más lento',0.9,()=>false),{type:'session-event',event:{type:'slower'}});
 assert.deepEqual(transcriptToSessionEvent('pausa',0.9,()=>true).event.type,'answer','an expected answer is not a command');
 assert.equal(transcriptToSessionEvent('switch to french',0.9,()=>false).type,'app-command');
 assert.equal(transcriptToSessionEvent('   ',0.9,()=>false),null);
 s=stepTurn(newTurnState(),{type:'prompt',activityId:'a1',hasSpeech:false}).state;s=stepTurn(s,{type:'utterance',turnId:1}).state;
 assert.deepEqual(stepTurn(s,{type:'asr-failed',turnId:1}).commands,[{type:'start-listening',turnId:1}],'a failed recognition just listens again');
});
