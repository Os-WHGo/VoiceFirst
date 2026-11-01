/** Real A0 TSX adapter with deterministic fake TTS and AppState callbacks.
 * This is not a claim that OS voices work offline on physical devices.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as core from '../dist/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function hooks(){
 const slots=[],effects=[];let cursor=0;
 const react={
  createElement:(type,props,...children)=>({type,props:{...props,children}}),Fragment:'Fragment',
  useState(initial){const id=cursor++;if(!(id in slots))slots[id]=typeof initial==='function'?initial():initial;return [slots[id],v=>{slots[id]=typeof v==='function'?v(slots[id]):v;}];},
  useRef(initial){const id=cursor++;return slots[id]??(slots[id]={current:initial});},
  useMemo(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i]))slots[id]={deps,value:fn()};return slots[id].value;},
  useEffect(fn,deps){const id=cursor++,old=slots[id];if(!old||!deps||deps.some((v,i)=>v!==old.deps?.[i])){const entry={deps,cleanup:old?.cleanup};slots[id]=entry;effects.push(()=>{entry.cleanup?.();entry.cleanup=fn();});}}
 };
 return {react:{__esModule:true,default:react,...react},render(fn){cursor=0;return fn();},mount(){effects.splice(0).forEach(fn=>fn());},cleanup(){for(const slot of slots)slot?.cleanup?.();}};
}
function elements(node){
 if(node===undefined||node===null||typeof node==='boolean')return [];
 if(Array.isArray(node))return node.flatMap(elements);
 if(typeof node!=='object')return [];
 return [node,...elements(node.props?.children)];
}
function textOf(node){return typeof node==='string'?node:Array.isArray(node)?node.map(textOf).join(''):node&&typeof node==='object'?textOf(node.props?.children):'';}
function harness(target='en-CA',known='es',rate=0.75){
 const h=hooks(),calls=[],stops=[];
 let appChange,appState='active';
 const app={get currentState(){return appState;},addEventListener(name,fn){assert.equal(name,'change');appChange=fn;return {remove(){appChange=null;}};}};
 const script=readFileSync(new URL('../../../mobile/A0TextOrientation.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const result={exports:{}};
 const mods={
  react:h.react,'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:x=>x},AppState:app},
  '@voicefirst/core':core,'./curated-voice-output':{
   playCuratedVoice(cue,rate,done,error){calls.push({cue,rate,done,error});},
   stopCuratedVoice(){stops.push('stop');}
  }
 };
 new Function('require','module','exports',code)(name=>{assert.ok(name in mods,'unknown import: '+name);return mods[name];},result,result.exports);
 let props={target,nativeLanguage:known,rate};
 const render=()=>h.render(()=>result.exports.A0TextOrientation(props));
 const flush=()=>{let tree=render();h.mount();return tree;};
 const press=(label)=>{
  const t=render(),item=elements(t).find(e=>e.type==='Pressable'&&textOf(e)===label);
  assert.ok(item,'missing control: '+label);
  assert.notEqual(item.props.disabled,true,'button must be enabled: '+label);
  item.props.onPress();return render();
 };
 return {calls,stops,render,flush,press,elements,appState:(value)=>{appState=value;assert.ok(appChange);appChange(value);},
  props:(next)=>{props={...props,...next};},cleanup:h.cleanup};
}

test('first-contact audio is opt-in, uses the target language and inherited pace for all six targets',async()=>{
 const targets=['en-CA','fr-CA','es','pt-BR','de','it'];
 for(const target of targets){
  const known=target==='es'?'en-CA':'es';
  const h=harness(target,known,0.74);
  let tree=h.flush();
  assert.equal(h.calls.length,0);
  assert.match(textOf(tree),/A0/);
  h.press(known==='es'?'Ver palabras':'Show words');
  tree=h.render();
  const listen=elements(tree).find(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith(known==='es'?'Escuchar: ':'Listen to: '));
  assert.ok(listen,target);
  listen.props.onPress();
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].cue.language,target);
  assert.equal(h.calls[0].rate,0.74);
  assert.equal(h.calls[0].cue.source,'voicefirst-original');
  assert.equal(h.calls[0].cue.text,String(listen.props.accessibilityLabel).split(': ').slice(1).join(': '));
  h.calls[0].done();await tick();
  assert.equal(h.calls.length,1,'listening does not advance or replay automatically');
  assert.equal(elements(h.render()).some(x=>x.type==='Text'&&textOf(x).includes('puntuación')),known==='es');
  h.cleanup();
 }
});
test('changing preview word cancels previous narration and late native callbacks are ignored',async()=>{
 const h=harness();h.flush();h.press('Ver palabras');
 const buttons=()=>elements(h.render()).filter(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith('Escuchar: '));
 const [first,second]=buttons();first.props.onPress();
 assert.equal(h.calls.length,1);
 second.props.onPress();
 assert.equal(h.calls.length,2);
 assert.ok(h.stops.length>=2);
 h.calls[0].done();await tick();
 assert.match(textOf(h.render()),/Detener audio/);
 h.calls[1].done();await tick();
 assert.equal(elements(h.render()).some(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith('Detener audio:')),false);
 h.cleanup();
});
test('hidden orientation, background and unmount revoke preview audio and prevent replay',async()=>{
 const h=harness();h.flush();h.press('Ver palabras');
 const first=elements(h.render()).find(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith('Escuchar: '));
 first.props.onPress();
 h.appState('background');
 assert.equal(h.calls.length,1);
 h.calls[0].done();await tick();
 const button=elements(h.render()).find(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith('Escuchar: '));
 assert.equal(button.props.disabled,true);
 h.appState('active');
 h.press('Ocultar palabras');
 assert.equal(h.calls.length,1);
 h.cleanup();
 assert.ok(h.stops.length>0);
});
test('TTS error displays a localized fallback without generating learning evidence',async()=>{
 const h=harness('fr-CA','es');
 h.flush();h.press('Ver palabras');
 elements(h.render()).find(e=>e.type==='Pressable'&&String(e.props.accessibilityLabel).startsWith('Escuchar: ')).props.onPress();
 h.calls[0].error();await tick();
 assert.match(textOf(h.render()),/No hay una voz compatible disponible/);
 assert.equal(h.calls.length,1);
 h.cleanup();
});
