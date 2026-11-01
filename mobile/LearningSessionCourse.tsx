/** Mobile integration of the existing authored course and Claude's pure session engine.
 * Foreground, explicit playback/capture, no cloud fallback or acoustic grading.
 */
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {courseLessonStatus,defaultExperiencePreferences,deviceLocalDay,dueObjectiveReviews,lessonsFor,parseVoiceCommand,pronunciationReadingFor,readingAidCopy,sessionOpening,sessionNarration,SessionNarrator,resolveSessionVoiceCommand,fasterSessionPlaybackRate,effectivePlaybackRate,voiceChoiceIndex,voiceChoiceConfirmation,voiceChoiceCommandHint,voiceChoiceLabel,summarizeSession,type ExperiencePreferences,type LearningSessionEvent,type TargetLanguage,type VoiceCommand} from '@voicefirst/core';
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
const offlineModelCopy:Record<TargetLanguage,{target:string;command:string;installed:string;missing:string;unknown:string;prepare:string;check:string}>={
 es:{target:'Voz para responder',command:'Voz para comandos',installed:'modelo local instalado (sin prueba de micrófono)',missing:'falta modelo local',unknown:'modelo local sin verificar',prepare:'Preparar modelo para comandos',check:'Comprobar modelo para comandos'},
 'en-CA':{target:'Answer recognition',command:'Voice commands',installed:'local model installed (mic not tested)',missing:'local model missing',unknown:'local model unverified',prepare:'Prepare command model',check:'Check command model'},
 'fr-CA':{target:'Reconnaissance des réponses',command:'Commandes vocales',installed:'modèle local installé (micro non testé)',missing:'modèle local manquant',unknown:'modèle local non vérifié',prepare:'Préparer le modèle de commandes',check:'Vérifier le modèle de commandes'},
 'pt-BR':{target:'Reconhecimento de respostas',command:'Comandos de voz',installed:'modelo local instalado (microfone não testado)',missing:'modelo local ausente',unknown:'modelo local não verificado',prepare:'Preparar modelo de comandos',check:'Verificar modelo de comandos'},
 de:{target:'Antworterkennung',command:'Sprachbefehle',installed:'lokales Modell installiert (Mikrofon ungeprüft)',missing:'lokales Modell fehlt',unknown:'lokales Modell nicht geprüft',prepare:'Befehlsmodell vorbereiten',check:'Befehlsmodell prüfen'},
 it:{target:'Riconoscimento risposte',command:'Comandi vocali',installed:'modello locale installato (microfono non testato)',missing:'modello locale mancante',unknown:'modello locale non verificato',prepare:'Prepara modello comandi',check:'Verifica modello comandi'},
};
const modelActions:Record<TargetLanguage,readonly [string,string]>={es:['Preparar modelo local (Android)','Comprobar modelo local'],'en-CA':['Prepare local model (Android)','Check local model'],'fr-CA':['Préparer le modèle local (Android)','Vérifier le modèle local'],'pt-BR':['Preparar modelo local (Android)','Verificar modelo local'],de:['Lokales Modell vorbereiten (Android)','Lokales Modell prüfen'],it:['Prepara modello locale (Android)','Verifica modello locale']};
/** Full-sentence, non-ambiguous opt-in spoken confirmation, with a visual fallback. */
const answerConfirmationCopy:Record<TargetLanguage,string>={
 es:'Para aceptar, di confirmar mi respuesta. Para repetir, di rechazar mi respuesta. También puedes usar los botones.',
 'en-CA':'To accept, say confirm my answer. To retry, say reject my answer. You can also use the buttons.',
 'fr-CA':'Pour accepter, dites confirmer ma réponse. Pour recommencer, dites refuser ma réponse. Vous pouvez aussi utiliser les boutons.',
 'pt-BR':'Para aceitar, diga confirmar minha resposta. Para tentar novamente, diga rejeitar minha resposta. Você também pode usar os botões.',
 de:'Zum Bestätigen sage Antwort bestätigen. Zum Wiederholen sage Antwort ablehnen. Du kannst auch die Tasten verwenden.',
 it:'Per accettare, di conferma la mia risposta. Per riprovare, di rifiuta la mia risposta. Puoi anche usare i pulsanti.',
};
const guideCopy:Record<TargetLanguage,{enable:string;disable:string;notice:string;speaking:string;listening:string;unavailable:string}>={
 es:{enable:'Activar guía de voz',disable:'Detener guía de voz',notice:'La guía lee la sesión y puede activar el micrófono al terminar de hablar. Solo funciona con la app abierta. Confirma respuestas inciertas mediante una orden de voz explícita o usando la pantalla.',speaking:'El tutor está hablando',listening:'Micrófono activo',unavailable:'La voz no está disponible. Puedes continuar por texto o volver a activar la guía.'},
 'en-CA':{enable:'Enable voice guide',disable:'Stop voice guide',notice:'The guide reads the session and may start the microphone after speaking. It works only while the app is open. Confirm uncertain answers with an explicit voice command or on screen.',speaking:'The tutor is speaking',listening:'Microphone active',unavailable:'Voice is unavailable. Continue with text or enable the guide again.'},
 'fr-CA':{enable:'Activer le guide vocal',disable:'Arrêter le guide vocal',notice:'Le guide lit la séance et peut activer le micro après avoir parlé. L’application doit rester ouverte. Confirmez les réponses incertaines par commande vocale explicite ou à l’écran.',speaking:'Le tuteur parle',listening:'Micro actif',unavailable:'La voix est indisponible. Continuez par écrit ou réactivez le guide.'},
 'pt-BR':{enable:'Ativar guia de voz',disable:'Parar guia de voz',notice:'O guia lê a sessão e pode ativar o microfone depois de falar. O aplicativo deve permanecer aberto. Confirme respostas incertas com um comando de voz explícito ou na tela.',speaking:'O tutor está falando',listening:'Microfone ativo',unavailable:'Voz indisponível. Continue por texto ou ative o guia novamente.'},
 de:{enable:'Sprachführung aktivieren',disable:'Sprachführung stoppen',notice:'Die Führung liest die Sitzung vor und kann danach das Mikrofon aktivieren. Die App muss geöffnet bleiben. Unsichere Antworten mit einem ausdrücklichen Sprachbefehl oder am Bildschirm bestätigen.',speaking:'Der Tutor spricht',listening:'Mikrofon aktiv',unavailable:'Sprache nicht verfügbar. Per Text fortfahren oder die Führung erneut aktivieren.'},
 it:{enable:'Attiva guida vocale',disable:'Ferma guida vocale',notice:'La guida legge la sessione e può attivare il microfono dopo aver parlato. L’app deve restare aperta. Conferma le risposte incerte con un comando vocale esplicito oppure sullo schermo.',speaking:'Il tutor sta parlando',listening:'Microfono attivo',unavailable:'Voce non disponibile. Continua per iscritto o riattiva la guida.'},
};
export function LearningSessionCourse({nativeLanguage,target,guideLocale=null,rate=0.88,experience=defaultExperiencePreferences}:{nativeLanguage:TargetLanguage;target:TargetLanguage;guideLocale?:string|null;rate?:number;experience?:ExperiencePreferences}){
 const runtime=useLearningSession(target,nativeLanguage,experience);
 const session=runtime.value?.session;
 const known=session?.status!=='finished'&&session?session.known:nativeLanguage;
 const c=labels[known];
 const [answer,setAnswer]=useState(''),[speechAnswer,setSpeechAnswer]=useState(false),[audioIssue,setAudioIssue]=useState('');
 const [showReading,setShowReading]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active');
 const [heardActivity,setHeardActivity]=useState<string|null>(null);
 const [showLibrary,setShowLibrary]=useState(false);
 const [pendingCommand,setPendingCommand]=useState<{command:VoiceCommand;text:string;sessionId:string;revision:number}|null>(null);
 const [proposedChoice,setProposedChoice]=useState<{sessionId:string;revision:number;activityId:string;optionId:string;optionText:string;index:number}|null>(null);
 const [choiceRetry,setChoiceRetry]=useState(0);
 const [guided,setGuided]=useState(false),[narrating,setNarrating]=useState(false);
 const [playbackRate,setPlaybackRate]=useState(()=>effectivePlaybackRate(rate));
 useEffect(()=>setPlaybackRate(effectivePlaybackRate(rate)),[rate]);
 const guidedRef=useRef(false);guidedRef.current=guided;
 const narrator=useMemo(()=>new SessionNarrator({play:playCuratedVoice,stop:stopCuratedVoice}),[]);
 const epoch=useRef(0),live=useRef(true);
 const requestedNarration=useRef(false);
 const ready=!!session&&session.status==='active'&&!runtime.busy&&!runtime.blocked&&foreground;
 const activity=runtime.activities.find(a=>a.id===session?.current?.activityId);
 const current=useRef({ready,id:activity?.id,revision:session?.revision,kind:activity?.kind});current.current={ready,id:activity?.id,revision:session?.revision,kind:activity?.kind};
 const mic=useOnDeviceAnswer(target,(result,id)=>{
  const now=current.current;
  if(!now.ready||id!==`${now.id}:${now.revision}`)return;
  setAnswer(result.text);setSpeechAnswer(true);
  // Native confidence is uncalibrated: submit explicitly as uncertain speech.
  if(guidedRef.current&&now.kind!=='choice'){
   void runtime.transition({type:'answer',response:result.text,source:{kind:'speech',confidence:'unknown'}});
  }
 });
 const commandState=useRef({enabled:false,id:''});
 commandState.current={enabled:!!session&&!runtime.busy&&!runtime.blocked&&foreground,id:`${session?.sessionId}:${session?.revision}:command`};
 const commandMic=useOnDeviceAnswer(known,(result,id)=>{
  if(!commandState.current.enabled||id!==commandState.current.id)return;
  if(!session)return;
  const command=parseVoiceCommand(result.text);
  const proposed=proposedChoice&&proposedChoice.sessionId===session.sessionId&&
    proposedChoice.revision===session.revision&&proposedChoice.activityId===activity?.id&&
    session.status==='active'&&heardActivity===activity.id;
  // A voice selection is a proposal until the learner explicitly confirms it.
  if(proposed){
   if(command?.type==='CONFIRM_ANSWER'){send({type:'choose',optionId:proposedChoice.optionId});return;}
   if(command?.type==='REJECT_ANSWER'){commandMic.stop();setProposedChoice(null);setChoiceRetry(n=>n+1);return;}
   return;
  }
  if(session.status==='active'&&activity?.kind==='choice'&&heardActivity===activity.id&&
    prompt?.kind==='prompt'&&prompt.activityId===activity.id){
   const index=voiceChoiceIndex(result.text,known,prompt.options?.length??0);
   const option=index!==null?prompt.options?.[index]:undefined;
   if(index!==null&&option){
    setProposedChoice({sessionId:session.sessionId,revision:session.revision,activityId:activity.id,
     optionId:option.id,optionText:option.text,index});
    return;
   }
  }
  if(!command)return;
  const decision=resolveSessionVoiceCommand(command,session.status,deviceLocalDay(),!!session.current?.pendingConfirmation);
  if(decision.kind==='unsupported')return;
  // A second, explicit full-sentence spoken act confirms the *proposal*.
  // The original transcript never auto-grades itself. Screen buttons remain available.
  if(guidedRef.current&&decision.kind==='event'&&
    (decision.event.type==='confirm'||decision.event.type==='reject')){
   send(decision.event);return;
  }
  setPendingCommand({command,text:result.text,sessionId:session.sessionId,revision:session.revision});
 });
 const stop=()=>{epoch.current++;narrator.cancel();mic.stop();commandMic.stop();setNarrating(false);};
 const halt=()=>{guidedRef.current=false;setGuided(false);stop();};
 useEffect(()=>{
  live.current=true;
  const sub=AppState.addEventListener('change',state=>{
   const active=state==='active';setForeground(active);
   if(!active){epoch.current++;guidedRef.current=false;setGuided(false);setNarrating(false);narrator.cancel();mic.stop();commandMic.stop();setPendingCommand(null);setProposedChoice(null);setChoiceRetry(0);}
  });
  return()=>{live.current=false;epoch.current++;guidedRef.current=false;narrator.cancel();mic.stop();commandMic.stop();sub.remove();};
 },[mic.stop,commandMic.stop,narrator]);
 useEffect(()=>{stop();setAnswer('');setSpeechAnswer(false);setShowReading(false);setHeardActivity(null);setPendingCommand(null);setProposedChoice(null);setChoiceRetry(0);},[activity?.id,session?.sessionId,nativeLanguage]);
 // A just-committed transition can finish after the app moved to the background.
 useEffect(()=>{if(!foreground&&!runtime.busy&&session?.status==='active')void runtime.transition({type:'pause'});},[foreground,runtime.busy,session?.revision]);
 const send=(event:LearningSessionEvent)=>{stop();requestedNarration.current=['replay','slower','hint'].includes(event.type);setPendingCommand(null);setProposedChoice(null);setChoiceRetry(0);setAnswer('');setSpeechAnswer(false);void runtime.transition(event);};
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
  halt();setAudioIssue('');setNarrating(true);const token=epoch.current;
  void narrator.run([{text,language,purpose:'target-cue',slower:slow}],playbackRate,()=>{
   if(live.current&&token===epoch.current&&activity?.kind==='choice'&&text===activity.cue&&language===target)setHeardActivity(activity.id);
  }).then(result=>{
   if(!live.current||token!==epoch.current)return;
   setNarrating(false);if(result.kind==='failed')setAudioIssue(guideCopy[known].unavailable);
  });
 };
 const reading=activity&&guideLocale&&(activity.kind==='listen'||activity.kind==='repeat')?pronunciationReadingFor(activity.model,target,known,guideLocale):null;
 useEffect(()=>{
  if(runtime.busy||!session)return;
  const automatic=guidedRef.current;
  if(!automatic&&!requestedNarration.current)return;
  requestedNarration.current=false;
  if(runtime.blocked||!foreground||session.status==='paused')return;
  const originalOutputs=runtime.outputs.length?runtime.outputs:sessionOpening(session,runtime.activities);
  // Failed answers, hints, replay and explicit rejection must leave a listening
  // opportunity. Previously these output-only transitions could strand the guide.
  const repeatRequested=session.status==='active'&&!session.current?.pendingConfirmation&&originalOutputs.some(o=>
   o.kind==='replay'||o.kind==='hint'||o.kind==='model'||
   o.kind==='feedback'&&o.outcome!=='correct'||
   o.kind==='message'&&o.code==='not-heard');
  const followUp=repeatRequested?sessionOpening(session,runtime.activities).find(o=>o.kind==='prompt'):undefined;
  // After rejection, restate the original prompt before listening again.
  const restate=originalOutputs.some(o=>o.kind==='message'&&o.code==='not-heard');
  const outputs=restate&&followUp?[...originalOutputs,followUp]:originalOutputs;
  const lines=sessionNarration(outputs,session.known,target);
  if(session.current?.pendingConfirmation)lines.push({
   text:answerConfirmationCopy[session.known],language:session.known,purpose:'instruction'
  });
  if(!lines.length)return;
  const token=++epoch.current,revision=session.revision;
  mic.stop();commandMic.stop();setAudioIssue('');setNarrating(true);
  void narrator.run(lines,playbackRate,line=>{
   if(!live.current||token!==epoch.current)return;
   if(line.purpose==='target-cue'&&line.activityId===activity?.id&&activity?.kind==='choice'&&line.text===activity.cue&&line.language===target)setHeardActivity(activity.id);
  }).then(result=>{
   if(!live.current||token!==epoch.current)return;
   setNarrating(false);
   if(result.kind==='failed'){
    guidedRef.current=false;setGuided(false);setAudioIssue(guideCopy[session.known].unavailable);return;
   }
   if(result.kind!=='completed'||!automatic||!guidedRef.current||!current.current.ready||current.current.revision!==revision)return;
   if(session.current?.pendingConfirmation){
    // Open a separate local command turn only after the answer proposal and
    // its confirmation instructions have finished playing.
    if(commandMic.available)void commandMic.start(commandState.current.id);
    return;
   }
   const nextPrompt=outputs.find(o=>o.kind==='prompt')??followUp;
   if(!nextPrompt||nextPrompt.kind!=='prompt')return;
   // One explicit foreground turn. An uncertain result is proposed, never auto-graded.
   if(nextPrompt.activityKind==='listen'||nextPrompt.activityKind==='choice'){
    if(commandMic.available&&commandMic.model!=='missing')void commandMic.start(commandState.current.id);
   }else if(mic.available&&mic.model!=='missing')void mic.start(`${activity?.id}:${revision}`);
  });
 },[runtime.outputs,runtime.busy,guided]);
 // A separately heard, explicit numbered choice is only a *proposal*.
 // Its spoken confirmation must complete before opening a second ASR command turn.
 useEffect(()=>{
  if(!proposedChoice||!guidedRef.current||!foreground||runtime.busy||runtime.blocked||
     !session||session.status!=='active'||session.sessionId!==proposedChoice.sessionId||
     session.revision!==proposedChoice.revision||activity?.id!==proposedChoice.activityId||
     heardActivity!==activity.id)return;
  const token=++epoch.current;
  commandMic.stop();setNarrating(true);
  void narrator.run([{text:voiceChoiceConfirmation(known,proposedChoice.index,proposedChoice.optionText),
   language:known,purpose:'instruction'}],playbackRate).then(result=>{
   if(!live.current||token!==epoch.current)return;
   setNarrating(false);
   if(result.kind==='failed'){setAudioIssue(guideCopy[known].unavailable);return;}
   if(result.kind==='completed'&&guidedRef.current&&current.current.ready&&
      current.current.revision===proposedChoice.revision&&commandMic.available&&commandMic.model!=='missing')
      void commandMic.start(commandState.current.id);
  });
 },[proposedChoice]);
 useEffect(()=>{
  if(!choiceRetry||!guidedRef.current||!foreground||runtime.busy||runtime.blocked||
     !session||session.status!=='active'||activity?.kind!=='choice')return;
  const token=++epoch.current;
  setNarrating(true);
  void narrator.run([{text:voiceChoiceCommandHint(known),language:known,purpose:'instruction'}],playbackRate).then(result=>{
   if(!live.current||token!==epoch.current)return;
   setNarrating(false);
   if(result.kind==='failed'){setAudioIssue(guideCopy[known].unavailable);return;}
   if(result.kind==='completed'&&guidedRef.current&&current.current.ready&&
      current.current.revision===session.revision&&commandMic.available&&commandMic.model!=='missing')
      void commandMic.start(commandState.current.id);
  });
 },[choiceRetry]);
 const action=(label:string,fn:()=>void,disabled=runtime.busy||runtime.blocked||!foreground)=><Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} style={[s.button,disabled&&s.disabled]} onPress={fn}><Text style={s.text}>{label}</Text></Pressable>;
 return <View style={s.wrap}>
  <Text style={s.title}>{c[0]}</Text>
  {!runtime.value&&!runtime.blocked&&<Text style={s.text}>{c[20]}</Text>}
  {runtime.blocked&&<Text accessibilityRole="alert" style={s.warning}>{c[19]}</Text>}
  {runtime.value&&<>
   {action(guided?guideCopy[known].disable:guideCopy[known].enable,()=>{if(guided){halt();return;}stop();guidedRef.current=true;setGuided(true);})}
   <Text style={s.note}>{guideCopy[known].notice} · {playbackRate.toFixed(2)}×</Text>
  </>}
  <Text accessibilityLiveRegion="polite" style={s.text}>{mic.listening||commandMic.listening?guideCopy[known].listening:narrating?guideCopy[known].speaking:''}</Text>
  {runtime.value&&<Text style={s.text}>{c[24]}: {runtime.value.progress.completed.length} / {new Set(runtime.activities.map(a=>a.lessonId)).size} · {c[25]}: {dueObjectiveReviews(runtime.value.model,deviceLocalDay()).length}</Text>}
  {session&&session.known!==nativeLanguage&&session.status!=='finished'&&<Text style={s.warning}>{c[27]}: {session.known}</Text>}
  {runtime.value&&(!session||session.status==='finished')&&action(c[1]!,()=>{stop();void runtime.transition('start');})}
  {runtime.value&&(!session||session.status==='finished')&&<>
   {action('A0 / A1',()=>setShowLibrary(v=>!v))}
   {(showLibrary||experience.sensoryPresentation==='standard')&&<View style={s.row}>{lessonsFor(target).map(lesson=><React.Fragment key={lesson.id}>{action(`${lesson.band} · ${lesson.goal[nativeLanguage]}${runtime.value!.progress.completed.includes(lesson.id)?' ✓':''}`,()=>{stop();void runtime.transition({type:'start-lesson',lessonId:lesson.id});},runtime.busy||runtime.blocked||!foreground||courseLessonStatus(runtime.value!.progress,lesson)==='locked')}</React.Fragment>)}</View>}
  </>}
  {session?.status==='paused'&&action(c[2]!,()=>send({type:'resume',day:deviceLocalDay()}))}
  {session&&session.status!=='finished'&&action(commandLabel[known],()=>{stop();setPendingCommand(null);void commandMic.start(commandState.current.id);},runtime.busy||runtime.blocked||!foreground||!commandMic.available||commandMic.model==='missing')}
  {pendingCommand&&pendingCommand.sessionId===session?.sessionId&&pendingCommand.revision===session?.revision&&<>
   <Text style={s.text}>{commandLabel[known]}: {pendingCommand.text}</Text>
   <View style={s.row}>{action(c[14]!,()=>{
    // Revalidate against the current session: recognition and confirmation may be separated by a state change.
    const decision=resolveSessionVoiceCommand(pendingCommand.command,session?.status??'finished',deviceLocalDay(),!!session?.current?.pendingConfirmation);
    setPendingCommand(null);
    switch(decision.kind){
     case 'event':send(decision.event);return;
     case 'speed-up':stop();setPlaybackRate(previous=>fasterSessionPlaybackRate(previous));return;
     case 'play-summary':if(summary&&session)play(summary.statements.join(' '),session.known);return;
     case 'play-current':if(activity)play(activity.cue??activity.model,target);return;
     case 'unsupported':return;
    }
   })}{action(c[15]!,()=>{stop();setPendingCommand(null);})}</View>
  </>}
  {session?.status==='active'&&<>
   <Text style={s.text}>{session.position+1} / {session.queue.length} · {activity?.goal[known]}</Text>
   <Text style={s.phrase}>{instruction}</Text>
   {(activity?.kind==='listen'||activity?.kind==='repeat')&&<Text style={s.phrase}>{activity.model}</Text>}
   <View style={s.row}>{action(c[3]!,()=>send({type:'pause'}))}{action(c[16]!,()=>play(instruction,known))}{action(c[4]!,()=>send({type:'continue'}))}</View>
   {narration&&<View style={s.row}>{action(c[9]!,()=>play(narration.text,narration.language))}{action(c[10]!,()=>play(narration.text,narration.language,true))}</View>}
   {activity?.kind==='choice'&&<View style={s.row}>{(prompt?.kind==='prompt'?prompt.options:undefined)?.map((o,i)=><React.Fragment key={o.id}>{action(`${voiceChoiceLabel(known,i)}: ${o.text}`,()=>send({type:'choose',optionId:o.id}),!ready||heardActivity!==activity.id)}</React.Fragment>)}</View>}
   {activity?.kind==='choice'&&<Text style={s.note}>{voiceChoiceCommandHint(known)}</Text>}
   {proposedChoice&&proposedChoice.sessionId===session.sessionId&&proposedChoice.revision===session.revision&&
    activity?.id===proposedChoice.activityId&&<View>
     <Text accessibilityLiveRegion="polite" style={s.phrase}>{voiceChoiceConfirmation(known,proposedChoice.index,proposedChoice.optionText)}</Text>
     <View style={s.row}>
      {action(c[14]!,()=>send({type:'choose',optionId:proposedChoice.optionId}),!ready)}
      {action(c[15]!,()=>{commandMic.stop();setProposedChoice(null);setChoiceRetry(n=>n+1);},!ready)}
     </View>
    </View>}
   {activity&&activity.kind!=='listen'&&<>
    <TextInput accessibilityLabel={c[5]} style={s.input} value={answer} onChangeText={text=>{setAnswer(text);setSpeechAnswer(false);}} autoCorrect={false}/>
    <View style={s.row}>
     {action(c[6]!,()=>send({type:'answer',response:answer,source:speechAnswer?{kind:'speech',confidence:'unknown'}:{kind:'typed'}}),!ready||!answer.trim()||activity.kind==='choice'&&heardActivity!==activity.id)}
     {action(mic.listening?c[8]!:c[7]!,()=>{if(mic.listening){stop();return;}stop();void mic.start(`${activity.id}:${session.revision}`);},!ready||!mic.available||mic.model==='missing')}
    </View>
   </>}
   {session.current?.pendingConfirmation&&<>
    <Text style={s.phrase}>{session.current.pendingConfirmation}</Text>
    <Text style={s.note}>{answerConfirmationCopy[known]}</Text>
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
  <View style={s.row}>{action(c[8]!,halt,false)}</View>
  {mic.canDownload&&<View>
   <Text style={s.note}>{offlineModelCopy[known].target} ({target}): {offlineModelCopy[known][mic.model]}</Text>
   <View style={s.row}>{action(modelActions[known][0],()=>{stop();void mic.downloadModel();})}{action(modelActions[known][1],()=>void mic.checkModel())}</View>
  </View>}
  {commandMic.canDownload&&known!==target&&<View>
   <Text style={s.note}>{offlineModelCopy[known].command} ({known}): {offlineModelCopy[known][commandMic.model]}</Text>
   <View style={s.row}>{action(offlineModelCopy[known].prepare,()=>{stop();void commandMic.downloadModel();})}{action(offlineModelCopy[known].check,()=>void commandMic.checkModel())}</View>
  </View>}
  {!!mic.issue&&<Text accessibilityRole="alert" style={s.warning}>{mic.issue}</Text>}
  {!!commandMic.issue&&known!==target&&<Text accessibilityRole="alert" style={s.warning}>{commandMic.issue}</Text>}
  {!!audioIssue&&<Text style={s.warning}>{audioIssue}</Text>}
  <Text style={s.note}>{c[21]}</Text>
 </View>;
}
const s=StyleSheet.create({wrap:{backgroundColor:'#142339',borderColor:'#2B435A',borderWidth:1,borderRadius:18,padding:20,gap:12,marginTop:12},title:{color:'#F2F7FC',fontSize:20,fontWeight:'700'},text:{color:'#F2F7FC',fontSize:15,lineHeight:22},phrase:{color:'#F3DFC1',fontSize:18,lineHeight:26},warning:{color:'#FFE19C',fontSize:14,lineHeight:21},note:{color:'#A6BBD0',fontSize:12,lineHeight:18},row:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{backgroundColor:'#22414A',borderColor:'#89D4C5',borderWidth:1,borderRadius:12,padding:12,minHeight:44},disabled:{opacity:0.45},input:{borderColor:'#567284',borderWidth:1,borderRadius:12,padding:12,minHeight:55,color:'#F2F7FC',fontSize:16}});
