/** LOCAL DEVELOPMENT ONLY. No Internet-facing/mobile production auth is implemented. */
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer as nodeServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { defaultPreferences, createRealtimeSecretRequest, isEphemeralSecretResponse, validatePreferences } from '../../packages/core/dist/index.js';

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);
const BANDS = new Set(['A0','A1','A2','B1','B2','C1','C2']);
function constantTimeEquals(a, b) {
  const aa = Buffer.from(a ?? '', 'utf8');
  const bb = Buffer.from(b ?? '', 'utf8');
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function reply(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(JSON.stringify(data));
}
async function readCappedBody(req, limit = 4096) {
  const chunks=[];
  let bytes=0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limit) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function parseBody(req, limit = 4096) {
  const bytes = await readCappedBody(req, limit);
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error('INVALID_JSON'); }
}
async function parseMultipart(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('multipart/form-data;')) throw new Error('INVALID_CONTENT_TYPE');
  const bytes = await readCappedBody(req, 2_200_000);
  try {
    const request = new Request('http://localhost/voice', {method:'POST', headers:{'Content-Type':req.headers['content-type']}, body:bytes});
    return await request.formData();
  } catch { throw new Error('INVALID_MULTIPART'); }
}
function resultText(output) {
  if (!output || !Array.isArray(output.output)) return '';
  return output.output.flatMap(item=>Array.isArray(item?.content)?item.content:[])
    .filter(item=>item?.type==='output_text' && typeof item.text==='string')
    .map(item=>item.text).join(' ').trim().slice(0,2000);
}
function parseLimitedHistory(text) {
  let value;
  try { value=JSON.parse(text || '[]'); }catch {throw new Error('INVALID_HISTORY');}
  if (!Array.isArray(value) || value.length>6 || value.some(item => !item || !['user','assistant'].includes(item.role) || typeof item.text !== 'string' || item.text.length > 900)) throw new Error('INVALID_HISTORY');
  return value;
}
export function createVoiceFirstDevServer({
  apiKey = process.env.OPENAI_API_KEY,
  devToken = process.env.VOICEFIRST_DEV_TOKEN,
  host = '127.0.0.1',
  fetchImpl = globalThis.fetch,
  rateLimit = 4,
} = {}) {
  if (!LOOPBACK.has(host)) throw new Error('Public binding refused: replace development gateway with authenticated production service.');
  if (!devToken || devToken.length < 20) throw new Error('VOICEFIRST_DEV_TOKEN must contain at least 20 characters. Keep it server-side / dev-only.');
  const timestamps=[];
  const server = nodeServer(async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    if (pathname === '/health' && req.method === 'GET') return reply(res, 200, { ready: !!apiKey, mode: 'local-development' });
    if (!['/v1/voice/token','/v1/voice/turn'].includes(pathname) || req.method !== 'POST') return reply(res, 404, { error: 'NOT_FOUND' });
    if (!constantTimeEquals((req.headers.authorization ?? '').replace(/^Bearer /i, ''), devToken)) return reply(res, 401, { error: 'UNAUTHORIZED' });
    if (!apiKey) return reply(res, 503, { error: 'OPENAI_KEY_NOT_CONFIGURED' });
    const now=Date.now();
    while(timestamps.length && timestamps[0] <= now - 300_000) timestamps.shift();
    if(timestamps.length >= rateLimit) return reply(res, 429, { error: 'LOCAL_SESSION_LIMIT_REACHED' });
    if (pathname === '/v1/voice/turn') {
      let form, audio, prefs, history;
      try {
        form=await parseMultipart(req);
        audio=form.get('audio');
        if(!audio || typeof audio.arrayBuffer !== 'function' || audio.size<100 || audio.size>1_800_000 || !['audio/mp4','audio/m4a','audio/x-m4a','audio/wav','audio/mpeg'].includes(audio.type)) throw new Error('INVALID_AUDIO');
        const fields=JSON.parse(String(form.get('preferences') ?? '{}'));
        prefs=validatePreferences({...defaultPreferences,...fields});
        if(!BANDS.has(String(form.get('level') ?? 'A1')))throw new Error('INVALID_LEVEL');
        history=parseLimitedHistory(String(form.get('history') ?? '[]'));
      } catch(e) {return reply(res, e.message === 'BODY_TOO_LARGE' ? 413 : 400, {error:'INVALID_TURN_REQUEST'});}
      timestamps.push(now);
      try {
        const input = new FormData();
        input.append('model','gpt-transcribe');
        input.append('file', audio, 'utterance.m4a');
        input.append('languages[]', prefs.target.split('-')[0]);
        input.append('languages[]', prefs.nativeLanguage.split('-')[0]);
        const tr=await fetchImpl('https://api.openai.com/v1/audio/transcriptions', {
          method:'POST',headers:{'Authorization':`Bearer ${apiKey}`},body:input,signal:AbortSignal.timeout(20_000),
        });
        if(!tr.ok) return reply(res,502,{error:'TRANSCRIPTION_UNAVAILABLE'});
        const transcript=(await tr.json())?.text;
        if(typeof transcript !== 'string' || !transcript.trim() || transcript.length>2000) return reply(res,422,{error:'AUDIO_NOT_UNDERSTOOD'});
        const {buildTutorInstructions} = await import('../../packages/core/dist/index.js');
        const body={model:'gpt-6-luna',store:false,max_output_tokens:320,reasoning:{effort:'none'},
          instructions:buildTutorInstructions(prefs,{level: String(form.get('level') ?? 'A1')}),
          input:[...history.map(h=>({role:h.role,content:h.text})),{role:'user',content:transcript}],
        };
        const rr=await fetchImpl('https://api.openai.com/v1/responses', {method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20_000)});
        if(!rr.ok) return reply(res,502,{error:'TUTOR_UNAVAILABLE'});
        const answer=resultText(await rr.json());
        if(!answer) return reply(res,502,{error:'EMPTY_TUTOR_REPLY'});
        return reply(res,200,{transcript:transcript.trim(),answer,language:prefs.target,model:body.model});
      } catch { return reply(res,502,{error:'VOICE_TURN_UNAVAILABLE'}); }
    }
    let body;
    try {body=await parseBody(req);}catch(e){return reply(res, e.message === 'BODY_TOO_LARGE' ? 413 : 400, {error:e.message});}
    if (!body || typeof body !== 'object' || Array.isArray(body) || !body.preferences || typeof body.preferences !== 'object' || Array.isArray(body.preferences)) return reply(res, 400, {error:'INVALID_PREFERENCES'});
    let requestBody;
    try {
      const p=validatePreferences({ ...defaultPreferences, ...body.preferences });
      if(!BANDS.has(body.level ?? 'A1'))throw new Error('INVALID_LEVEL');
      requestBody=createRealtimeSecretRequest(p, {
        level: body.level ?? 'A1',
        missionId: typeof body.missionId === 'string' ? body.missionId.slice(0,80) : undefined,
        model: body.model ?? 'gpt-realtime-2.1-mini',
      });
    } catch {return reply(res, 400, {error:'INVALID_CONFIGURATION'});}
    timestamps.push(now);
    try {
      const upstream = await fetchImpl('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Safety-Identifier': createHash('sha256').update('voicefirst-local-development-user').digest('hex'),
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(12_000),
      });
      if (!upstream.ok) return reply(res, 502, {error: 'UPSTREAM_UNAVAILABLE'});
      const data = await upstream.json();
      if (!isEphemeralSecretResponse(data)) return reply(res, 502, {error: 'INVALID_UPSTREAM_RESPONSE'});
      return reply(res, 200, { client_secret: data.value, expires_at: data.expires_at, model: requestBody.session.model });
    } catch { return reply(res, 502, {error:'UPSTREAM_UNAVAILABLE'}); }
  });
  return { server, listen: (port = 8787) => new Promise(resolve => server.listen(port, host, () => resolve(server.address()))), close: () => new Promise(resolve => server.close(resolve)) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const gateway = createVoiceFirstDevServer();
  await gateway.listen(Number(process.env.PORT ?? 8787));
  console.log('VoiceFirst development gateway listening on http://127.0.0.1:' + (process.env.PORT ?? '8787'));
}
