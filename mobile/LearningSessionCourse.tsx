/** Mobile integration of the existing authored course and Claude's pure session engine.
 * Foreground, explicit playback/capture, no cloud fallback or acoustic grading.
 */
import React,{useEffect,useRef,useState} from 'react';
import {AppState,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {courseLessonStatus,defaultExperiencePreferences,deviceLocalDay,dueObjectiveReviews,lessonsFor,parseVoiceCommand,pronunciationReadingFor,readingAidCopy,sessionOpening,summarizeSession,voiceCueById,voiceLocales,type ExperiencePreferences,type LearningSessionEvent,type TargetLanguage,type VoiceCommand} from '@voicefirst/core';
import {useLearningSession} from './use-learning-session';
import {useOnDeviceAnswer} from './use-on-device-answer';
import {playCuratedVoice,stopCuratedVoice} from './curated-voice-output';

// Original draft UI copy, pending native-language review like the session engine's copy.
const labels:Record<TargetLanguage,readonly string[]>={
 es:['Curso local A0–A1 · muestras','Empezar sesión','Reanudar','Pausar','Continuar','Responder','Comprobar','Hablar','Detener voz y micrófono','Repetir','Más lento','Pista','Saltar sin penalización','Terminar y guardar','Confirmar respuesta propuesta','Rechazar y repetir','Escuchar instrucciones','Pedir correcciones','Escuchar resumen','Datos locales no disponibles. Se conservaron. Cierra y vuelve a abrir la aplicación para releerlos.','Recuperando progreso…','Pronunciación no evaluada. Política de repaso provisional. Voces del sistema y micrófono requieren validación física offline.','Mostrar ayuda fonética','Ocultar ayuda fonética','Progreso guardado','Repasos vencidos','Modelo','Sesión guardada en el idioma de ayuda'],
 'en-CA':['Local A0–A1 course · samples','Start session','Resume','Pause','Continue','Answer','Check','Speak','Stop voice and microphone','Repeat','Slower','Hint','Skip without penalty','Finish and save','Confirm proposed answer','Reject and repeat','Hear instructions','Request corrections','Hear summary','Local data unavailable. Preserved. Close and reopen the app to read it again.','Restoring progress…','Pronunciation is not assessed. Provisional review policy. Offline system voices and microphone need physical validation.','Show pronunciation aid','Hide pronunciation aid','Progress saved','Due reviews','Model','Session saved in the help language'],
 'fr-CA':['Cours local A0–A1 · exemples','Commencer','Reprendre','Pause','Continuer','Réponse','Vérifier','Parler','Arrêter la voix et le micro','Répéter','Plus lentement','Indice','Passer sans pénalité','Terminer et enregistrer','Confirmer la réponse proposée','Refuser et répéter','Écouter les consignes','Demander les corrections','Écouter le résumé','Données locales indisponibles, conservées. Fermez puis rouvrez l’application pour les relire.','Restauration…','Prononciation non évaluée. Politique de révision provisoire. Voix et micro hors ligne à valider sur appareil.','Afficher l’aide phonétique','Masquer l’aide phonétique','Progrès enregistré','Révisions dues','Modèle','Séance enregistrée dans la langue d’aide'],
 'pt-BR':['Curso local A0–A1 · exemplos','Iniciar sessão','Retomar','Pausar','Continuar','Resposta','Verificar','Falar','Parar voz e microfone','Repetir','Mais devagar','Dica','Pular sem penalidade','Terminar e salvar','Confirmar resposta proposta','Rejeitar e repetir','Ouvir instruções','Pedir correções','Ouvir resumo','Dados locais indisponíveis, preservados. Feche e reabra o aplicativo para reler.','Restaurando…','Pronúncia não avaliada. Política de revisão provisória. Voz e microfone offline precisam de validação física.','Mostrar ajuda fonética','Ocultar ajuda fonética','Progresso salvo','Revisões pendentes','Modelo','Sessão salva no idioma de apoio'],
 de:['Lokaler A0–A1-Kurs · Beispiele','Sitzung starten','Fortsetzen','Pause','Weiter','Antwort','Prüfen','Sprechen','Stimme und Mikrofon stoppen','Wiederholen','Langsamer','Hinweis','Ohne Nachteil überspringen','Beenden und speichern','Vorgeschlagene Antwort bestätigen','Ablehnen und wiederholen','Anweisungen hören','Korrekturen anfordern','Zusammenfassung hören','Lokale Daten nicht verfügbar, aber erhalten. App schließen und erneut öffnen.','Fortschritt laden…','Aussprache nicht bewertet. Vorläufige Wiederholungsregeln. Offline-Stimme und Mikrofon müssen am Gerät geprüft werden.','Aussprachehilfe zeigen','Aussprachehilfe verbergen','Fortschritt gespeichert','Fällige Wiederholungen','Beispiel','Sitzung in der Hilfssprache gespeichert'],
 it:['Corso locale A0–A1 · esempi','Inizia sessione','Riprendi','Pausa','Continua','Risposta','Verifica','Parla','Ferma voce e microfono','Ripeti','Più lentamente','Indizio','Salta senza penalità','Termina e salva','Conferma risposta proposta','Rifiuta e ripeti','Ascolta istruzioni','Chiedi correzioni','Ascolta riepilogo','Dati locali non disponibili, conservati. Chiudi e riapri l’app per rileggerli.','Ripristino…','Pronuncia non valutata. Regole di ripasso provvisorie. Voce e microfono offline da verificare sul dispositivo.','Mostra aiuto fonetico','Nascondi aiuto fonetico','Progresso salvato','Ripassi dovuti','Modello','Sessione salvata nella lingua di aiuto'],
};
const commandLabel:Record<TargetLanguage,string>={es:'Comando de voz', 'en-CA':'Voice command','fr-CA':'Commande vocale','pt-BR':'Comando de voz',de:'Sprachbefehl',it:'Comando vocale'};
const modelActions:Record<TargetLanguage,readonly [string,string]>={es:['Preparar modelo local (Android)','Comprobar modelo local'],'en-CA':['Prepare local model (Android)','Check local model'],'fr-CA':['Préparer le modèle local (Android)','Vérifier le modèle local'],'pt-BR':['Preparar modelo local (Android)','Verificar modelo local'],de:['Lokales Modell vorbereiten (Android)','Lokales Modell prüfen'],it:['Prepara modello locale (Android)','Verifica modello locale']};
export function LearningSessionCourse({nativeLanguage,target,guideLocale=null,rate=0.88,experience=defaultExperiencePreferences}:{nativeLanguage:TargetLanguage;target:TargetLanguage;guideLocale?:string|null;rate?:number;experience?:ExperiencePreferences}){
 const runtime=useLearningSession(target,nativeLanguage,experience);
 const session=runtime.value?.session;
 const known=session?.status!=='finished'&&session?session.known:nativeLanguage;
 const c=labels[known];
 const [answer,setAnswer]=useState(''),[speechAnswer,setSpeechAnswer]=useState(false),[audioIssue,setAudioIssue]=useState('');
 const [showReading,setShowReading]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active');
 const [heardActivity,setHeardActivity]=useState<string|null>(null);
 const [showLibrary,setShowLibrary]=useState(false);
 const [pendingCommand,setPendingCommand]=useState<{command:VoiceCommand;text:string}|null>(null);
 const epoch=useRef(0),live=useRef(true);
 const requestedNarration=useRef(false);
 const ready=!!session&&session.status==='active'&&!runtime.busy&&!runtime.blocked&&foreground;
 const activity=runtime.activities.find(a=>a.id===session?.current?.activityId);
 const current=useRef({ready,id:activity?.id,revision:session?.revision});current.current={ready,id:activity?.id,revision:session?.revision};
 const mic=useOnDeviceAnswer(target,(result,id)=>{
  const now=current.current;
  if(!now.ready||id!==`${now.id}:${now.revision}`)return;
  setAnswer(result.text);setSpeechAnswer(true);
  // Native confidence is uncalibrated: submit explicitly as uncertain speech.
 });
 const commandState=useRef({enabled:false,id:''});
 commandState.current={enabled:!!session&&!runtime.busy&&!runtime.blocked&&foreground,id:`${session?.sessionId}:${session?.revision}:command`};
 const commandMic=useOnDeviceAnswer(known,(result,id)=>{
  if(!commandState.current.enabled||id!==commandState.current.id)return;
  const command=parseVoiceCommand(result.text);
  if(command&&['STOP','PAUSE','RESUME','REPEAT','SLOWER','HELP','NEXT','SUMMARY'].includes(command.type))setPendingCommand({command,text:result.text});
 });
 const stop=()=>{epoch.current++;mic.stop();commandMic.stop();void stopCuratedVoice();};
 useEffect(()=>{
  live.current=true;
  const sub=AppState.addEventListener('change',state=>{
   const active=state==='active';setForeground(active);
   if(!active){epoch.current++;mic.stop();commandMic.stop();setPendingCommand(null);void stopCuratedVoice();}
  });
  return()=>{live.current=false;epoch.current++;mic.stop();commandMic.stop();void stopCuratedVoice();sub.remove();};
 },[mic.stop,commandMic.stop]);
 useEffect(()=>{stop();setAnswer('');setSpeechAnswer(false);setShowReading(false);setHeardActivity(null);setPendingCommand(null);},[activity?.id,session?.sessionId,nativeLanguage]);
 // A just-committed transition can finish after the app moved to the background.
 useEffect(()=>{if(!foreground&&!runtime.busy&&session?.status==='active')void runtime.transition({type:'pause'});},[foreground,runtime.busy,session?.revision]);
 const send=(event:LearningSessionEvent)=>{stop();requestedNarration.current=['replay','slower','hint'].includes(event.type);setPendingCommand(null);setAnswer('');setSpeechAnswer(false);void runtime.transition(event);};
 const summary=session?summarizeSession(session,runtime.activities,runtime.value?.model):null;
 const prompt=session?sessionOpening(session,runtime.activities).find(o=>o.kind==='prompt'):undefined;
 // Reconstruct the visible prompt after corrections, or immediately after restore.
 const fallback=activity?(activity.instruction?.[known]??activity.meaning[known]):'';
 const instruction=prompt?.kind==='prompt'&&prompt.activityId===activity?.id?prompt.instruction:fallback;
 const messages=runtime.outputs.flatMap(o=>o.kind==='feedback'||o.kind==='message'||o.kind==='hint'||o.kind==='model'||o.kind==='confirm-request'?[o.text]:o.kind==='corrections'?[...o.items]:[]);
 const speech=[...runtime.outputs].reverse().find(o=>'speech' in o&&o.speech);
 const narration=speech&&'speech' in speech?speech.speech:prompt?.kind==='prompt'?prompt.speech:undefined;
 const play=(text:string,language:TargetLanguage,slow=false)=>{
  if(!foreground||runtime.blocked||runtime.busy)return;
  stop();setAudioIssue('');const token=epoch.current;
  const authored=activity?voiceCueById(`lesson/${activity.lessonId}/${activity.id}`):undefined;
  const cue=authored?.text===text&&authored.language===language?authored:{id:`session/${language}/instruction`,text,language,locale:voiceLocales[language],kind:'dialogue-help' as const,source:'voicefirst-original' as const};
  void playCuratedVoice(cue,slow?Math.max(0.65,rate-0.15):rate,()=>{
   if(live.current&&token===epoch.current&&activity?.kind==='choice'&&text===activity.cue&&language===target)setHeardActivity(activity.id);
  },message=>{if(live.current&&token===epoch.current)setAudioIssue(message);});
 };
 const reading=activity&&guideLocale&&(activity.kind==='listen'||activity.kind==='repeat')?pronunciationReadingFor(activity.model,target,known,guideLocale):null;
 useEffect(()=>{
  if(!requestedNarration.current||runtime.busy)return;
  requestedNarration.current=false;
  if(runtime.blocked||!foreground)return;
  const output=runtime.outputs.find(o=>o.kind==='replay'||o.kind==='hint'||o.kind==='model');
  if(output?.kind==='replay'){
   if(output.speech)play(output.speech.text,output.speech.language,output.rate==='slower');
   else play(output.instruction,known,output.rate==='slower');
  }else if(output?.kind==='hint')play(output.text,known);
  else if(output?.kind==='model')play(output.speech.text,output.speech.language);
 },[runtime.outputs,runtime.busy]);
 const action=(label:string,fn:()=>void,disabled=runtime.busy||runtime.blocked||!foreground)=><Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} style={[s.button,disabled&&s.disabled]} onPress={fn}><Text style={s.text}>{label}</Text></Pressable>;
 return <View style={s.wrap}>
  <Text style={s.title}>{c[0]}</Text>
  {!runtime.value&&!runtime.blocked&&<Text style={s.text}>{c[20]}</Text>}
  {runtime.blocked&&<Text accessibilityRole="alert" style={s.warning}>{c[19]}</Text>}
  {runtime.value&&<Text style={s.text}>{c[24]}: {runtime.value.progress.completed.length} / {new Set(runtime.activities.map(a=>a.lessonId)).size} · {c[25]}: {dueObjectiveReviews(runtime.value.model,deviceLocalDay()).length}</Text>}
  {session&&session.known!==nativeLanguage&&session.status!=='finished'&&<Text style={s.warning}>{c[27]}: {session.known}</Text>}
  {runtime.value&&(!session||session.status==='finished')&&action(c[1]!,()=>{stop();void runtime.transition('start');})}
  {runtime.value&&(!session||session.status==='finished')&&<>
   {action('A0 / A1',()=>setShowLibrary(v=>!v))}
   {(showLibrary||experience.sensoryPresentation==='standard')&&<View style={s.row}>{lessonsFor(target).map(lesson=><React.Fragment key={lesson.id}>{action(`${lesson.band} · ${lesson.goal[nativeLanguage]}${runtime.value!.progress.completed.includes(lesson.id)?' ✓':''}`,()=>{stop();void runtime.transition({type:'start-lesson',lessonId:lesson.id});},runtime.busy||runtime.blocked||!foreground||courseLessonStatus(runtime.value!.progress,lesson)==='locked')}</React.Fragment>)}</View>}
  </>}
  {session?.status==='paused'&&action(c[2]!,()=>send({type:'resume',day:deviceLocalDay()}))}
  {session&&session.status!=='finished'&&action(commandLabel[known],()=>{stop();setPendingCommand(null);void commandMic.start(commandState.current.id);},runtime.busy||runtime.blocked||!foreground||!commandMic.available)}
  {pendingCommand&&<>
   <Text style={s.text}>{commandLabel[known]}: {pendingCommand.text}</Text>
   <View style={s.row}>{action(c[14]!,()=>{
    const type=pendingCommand.command.type;
    if(type==='SUMMARY'){setPendingCommand(null);if(summary)play(summary.statements.join(' '),session!.known);return;}
    const event:LearningSessionEvent=type==='STOP'?{type:'finish'}:type==='PAUSE'?{type:'pause'}:type==='RESUME'?(session?.status==='paused'?{type:'resume',day:deviceLocalDay()}:{type:'continue'}):type==='REPEAT'?{type:'replay'}:type==='SLOWER'?{type:'slower'}:type==='HELP'?{type:'hint'}:{type:'skip'};
    send(event);
   })}{action(c[15]!,()=>{stop();setPendingCommand(null);})}</View>
  </>}
  {session?.status==='active'&&<>
   <Text style={s.text}>{session.position+1} / {session.queue.length} · {activity?.goal[known]}</Text>
   <Text style={s.phrase}>{instruction}</Text>
   {(activity?.kind==='listen'||activity?.kind==='repeat')&&<Text style={s.phrase}>{activity.model}</Text>}
   <View style={s.row}>{action(c[3]!,()=>send({type:'pause'}))}{action(c[16]!,()=>play(instruction,known))}{action(c[4]!,()=>send({type:'continue'}))}</View>
   {narration&&<View style={s.row}>{action(c[9]!,()=>play(narration.text,narration.language))}{action(c[10]!,()=>play(narration.text,narration.language,true))}</View>}
   {activity?.kind==='choice'&&<View style={s.row}>{(prompt?.kind==='prompt'?prompt.options:undefined)?.map(o=><React.Fragment key={o.id}>{action(o.text,()=>send({type:'choose',optionId:o.id}),!ready||heardActivity!==activity.id)}</React.Fragment>)}</View>}
   {activity&&activity.kind!=='listen'&&<>
    <TextInput accessibilityLabel={c[5]} style={s.input} value={answer} onChangeText={text=>{setAnswer(text);setSpeechAnswer(false);}} autoCorrect={false}/>
    <View style={s.row}>
     {action(c[6]!,()=>send({type:'answer',response:answer,source:speechAnswer?{kind:'speech',confidence:'unknown'}:{kind:'typed'}}),!ready||!answer.trim()||activity.kind==='choice'&&heardActivity!==activity.id)}
     {action(mic.listening?c[8]!:c[7]!,()=>{if(mic.listening){stop();return;}stop();void mic.start(`${activity.id}:${session.revision}`);},!ready||!mic.available)}
    </View>
   </>}
   {session.current?.pendingConfirmation&&<>
    <Text style={s.phrase}>{session.current.pendingConfirmation}</Text>
    <View style={s.row}>{action(c[14]!,()=>send({type:'confirm'}))}{action(c[15]!,()=>send({type:'reject'}))}</View>
   </>}
   <View style={s.row}>{action(c[11]!,()=>send({type:'hint'}))}{action(c[12]!,()=>send({type:'skip'}))}{action(c[17]!,()=>send({type:'request-corrections'}))}{action(c[13]!,()=>send({type:'finish'}))}</View>
   {activity&&(activity.kind==='listen'||activity.kind==='repeat')&&<>
    {action(showReading?c[23]!:c[22]!,()=>setShowReading(v=>!v))}
    {showReading&&<Text style={s.text}>{reading?`${reading.reading}\n${reading.approximateSyllables.join(' · ')}\n${reading.prominentSyllableIndex!==null?readingAidCopy[known].emphasis+': '+reading.approximateSyllables[reading.prominentSyllableIndex]+'\n':''}${reading.stressAndArticulation}\n${readingAidCopy[known].disclaimer}`:readingAidCopy[known].unavailable}</Text>}
   </>}
  </>}
  <View accessibilityLiveRegion="polite">{messages.map((text,i)=><Text style={s.text} key={i}>{text}</Text>)}</View>
  {session&&summary&&<>{session.status==='finished'&&summary.statements.map((text,i)=><Text style={s.text} key={i}>{text}</Text>)}{action(c[18]!,()=>play(summary.statements.join(' '),session.known))}</>}
  <View style={s.row}>{action(c[8]!,stop,false)}</View>
  {mic.canDownload&&<View style={s.row}>{action(modelActions[known][0],()=>{stop();void mic.downloadModel();})}{action(modelActions[known][1],()=>void mic.checkModel())}</View>}
  {!!mic.issue&&<Text style={s.warning}>{mic.issue}</Text>}
  {!!audioIssue&&<Text style={s.warning}>{audioIssue}</Text>}
  <Text style={s.note}>{c[21]}</Text>
 </View>;
}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:12,marginTop:12},title:{color:'#F2F7FC',fontSize:20,fontWeight:'700'},text:{color:'#F2F7FC',fontSize:15,lineHeight:22},phrase:{color:'#F3DFC1',fontSize:18,lineHeight:26},warning:{color:'#FFE19C',fontSize:14,lineHeight:21},note:{color:'#A6BBD0',fontSize:12,lineHeight:18},row:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,padding:12,minHeight:44},disabled:{opacity:0.45},input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:55,color:'#F2F7FC',fontSize:16}});
