// VoiceFirst research script (not part of the app, CI or dependencies).
// Offline loop on a desktop CPU: Piper TTS -> 16 kHz -> Silero VAD (pre/post-roll) -> offline ASR -> VoiceFirst evaluateAnswer.
// Reproduce (outside the repo, in a temporary folder):
//   npm init -y && npm install sherpa-onnx-node@1.13.8
//   download into ./models from https://github.com/k2-fsa/sherpa-onnx/releases (asr-models, tts-models):
//     silero_vad.onnx, sherpa-onnx-whisper-{tiny,base}, sherpa-onnx-nemo-canary-180m-flash-en-es-de-fr-int8,
//     sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8, vits-piper-{en_US-amy-low,fr_FR-siwis-medium,es_ES-davefx-medium,
//     pt_BR-faber-medium,de_DE-thorsten-medium,it_IT-paola-medium}
//   node voice-engine-poc.cjs <path to packages/core/dist/index.js> <noiseSnrDb|-> vadroll <tiny|base|canary|parakeet> 0.1
// Results of 2026-10-23 are in docs/VOICE_ENGINE_RESEARCH_2026_10_23.md. Says nothing about phones.
const sherpa = require('sherpa-onnx-node');
const path = require('path');
const M = path.join(__dirname, 'models');
const voices = {'en-CA':['en_US-amy-low','en'],'fr-CA':['fr_FR-siwis-medium','fr'],es:['es_ES-davefx-medium','es'],'pt-BR':['pt_BR-faber-medium','pt'],de:['de_DE-thorsten-medium','de'],it:['it_IT-paola-medium','it']};
const snr = process.argv[3] && process.argv[3]!=='-' ? Number(process.argv[3]) : null;
const mode = process.argv[4] || 'vad';   // vad | novad | vadtail
const size = process.argv[5] || 'tiny';
const minSpeech = Number(process.argv[6] || 0.25);
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
function addNoise(x, snrDb) {
  const p = x.reduce((a, v) => a + v * v, 0) / x.length, n = Math.sqrt(p / 10 ** (snrDb / 10));
  return Float32Array.from(x, v => v + n * (Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd())));
}
(async () => {
  const core = await import(process.argv[2]);
  const results = [];
  for (const [target, [voice, lang]] of Object.entries(voices)) {
    const dir = path.join(M, 'vits-piper-' + voice);
    const tts = new sherpa.OfflineTts({model: {vits: {model: path.join(dir, voice + '.onnx'), tokens: path.join(dir, 'tokens.txt'), dataDir: path.join(dir, 'espeak-ng-data')}, numThreads: 2, provider: 'cpu', debug: false}, maxNumSentences: 1});
    const canaryLangs = {en:'en',es:'es',de:'de',fr:'fr'};
    if (size === 'canary' && !canaryLangs[lang]) continue;
    const asr = size === 'parakeet' ? new sherpa.OfflineRecognizer({featConfig: {sampleRate: 16000, featureDim: 80}, modelConfig: {transducer: {encoder: path.join(M, 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/encoder.int8.onnx'), decoder: path.join(M, 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/decoder.int8.onnx'), joiner: path.join(M, 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/joiner.int8.onnx')}, modelType: 'nemo_transducer', tokens: path.join(M, 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/tokens.txt'), numThreads: 2, provider: 'cpu', debug: 0}})
      : size === 'canary' ? new sherpa.OfflineRecognizer({featConfig: {sampleRate: 16000, featureDim: 128}, modelConfig: {canary: {encoder: path.join(M, 'sherpa-onnx-nemo-canary-180m-flash-en-es-de-fr-int8/encoder.int8.onnx'), decoder: path.join(M, 'sherpa-onnx-nemo-canary-180m-flash-en-es-de-fr-int8/decoder.int8.onnx'), srcLang: lang, tgtLang: lang, usePnc: 1}, tokens: path.join(M, 'sherpa-onnx-nemo-canary-180m-flash-en-es-de-fr-int8/tokens.txt'), numThreads: 2, provider: 'cpu', debug: 0}})
      : new sherpa.OfflineRecognizer({featConfig: {sampleRate: 16000, featureDim: 80}, modelConfig: {whisper: {encoder: path.join(M, 'sherpa-onnx-whisper-'+size+'/'+size+'-encoder.int8.onnx'), decoder: path.join(M, 'sherpa-onnx-whisper-'+size+'/'+size+'-decoder.int8.onnx'), language: lang, task: 'transcribe'}, tokens: path.join(M, 'sherpa-onnx-whisper-'+size+'/'+size+'-tokens.txt'), numThreads: 2, provider: 'cpu', debug: 0}});
    const lessons = core.lessonsFor(target).slice(0, 6);
    for (const lesson of lessons) {
      const ex = lesson.exercises.find(e => e.type === 'recall');
      const t0 = Date.now();
      const audio = tts.generate({text: ex.utterance, sid: 0, speed: 1.0});
      const tTts = Date.now() - t0;
      const rs = new sherpa.LinearResampler(audio.sampleRate, 16000);
      let pcm = rs.resample(audio.samples, true);
      // Pad with 0.6 s silence on each side, as a microphone turn would have.
      const pad = new Float32Array(9600); pcm = Float32Array.from([...pad, ...pcm, ...pad]);
      if (snr !== null) pcm = addNoise(pcm, snr);
      const vad = new sherpa.Vad({sileroVad: {model: path.join(M, 'silero_vad.onnx'), threshold: 0.5, minSpeechDuration: minSpeech, minSilenceDuration: 0.5, windowSize: 512}, sampleRate: 16000, debug: false, numThreads: 1}, 30);
      const segments = [];
      for (let i = 0; i + 512 <= pcm.length; i += 512) { vad.acceptWaveform(pcm.subarray(i, i + 512)); while (!vad.isEmpty()) { segments.push(vad.front()); vad.pop(); } }
      vad.flush(); while (!vad.isEmpty()) { segments.push(vad.front()); vad.pop(); }
      const tail = new Float32Array(mode === 'vadtail' ? 4800 : 0);
      const roll = () => { const first = segments[0], last = segments[segments.length - 1];
        return pcm.slice(Math.max(0, first.start - 3200), Math.min(pcm.length, last.start + last.samples.length + 6400)); };
      const speech = mode === 'vadroll' && segments.length ? roll() : mode === 'novad' || !segments.length ? pcm : Float32Array.from([...new Float32Array(mode === 'vadtail' ? 1600 : 0), ...segments.flatMap(s => Array.from(s.samples)), ...tail]);
      const t1 = Date.now();
      const stream = asr.createStream(); stream.acceptWaveform({sampleRate: 16000, samples: speech}); asr.decode(stream);
      const text = asr.getResult(stream).text.trim();
      const tAsr = Date.now() - t1;
      const evaluation = core.evaluateAnswer(core.answerKeyForExercise(ex, target), text, {kind: 'speech', confidence: 'high'});
      results.push({target, lesson: lesson.id, said: ex.utterance, heard: text, outcome: evaluation.outcome, segments: segments.length,
        audioSec: +(audio.samples.length / audio.sampleRate).toFixed(2), ttsRtf: +(tTts / 1000 / (audio.samples.length / audio.sampleRate)).toFixed(3), asrRtf: +(tAsr / 1000 / (speech.length / 16000)).toFixed(3)});
    }
  }
  for (const r of results) console.log([r.target, r.outcome.padEnd(18), `seg=${r.segments}`, `tts=${r.ttsRtf}`, `asr=${r.asrRtf}`, JSON.stringify(r.said), '->', JSON.stringify(r.heard)].join(' '));
  const by = {}; for (const r of results) by[r.outcome] = (by[r.outcome] || 0) + 1;
  console.log('SUMMARY', JSON.stringify({mode, size, minSpeech, noiseSnrDb: snr, items: results.length, outcomes: by, rssMiB: Math.round(process.memoryUsage().rss / 1048576),
    meanAsrRtf: +(results.reduce((a, r) => a + r.asrRtf, 0) / results.length).toFixed(3), meanTtsRtf: +(results.reduce((a, r) => a + r.ttsRtf, 0) / results.length).toFixed(3)}));
})().catch(e => { console.error(e); process.exit(1); });
