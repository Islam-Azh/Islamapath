/* ============================================================
   speak.js — "🎙️ Speaking" from METHODIKA §10 (v2.1)
     one section, four kinds: 🔁 Retell · 🙋 Answer a question · 💼 Interview simulator · 📔 Speech diary
     every task: prepare (hints + 30 s) → record → transcript + auto hints → sample → record again (best attempt) → share
     interview: 5 questions read aloud, 20 s to prepare, up to 90 s per answer, summary with samples; only the last session per set is kept
     limits: retell 5 min · question and diary 3 min · interview answer 90 s (teacher voice comment 2 min — in the core)
     audio: loads only when ▶ is pressed; deleted after 90 days (diary is kept forever); transcripts stay
   Data: data/speaking-*.json → window.SPEAK_DATA (materials.js). Built-in tasks are used until the methodist's files arrive.
   Public: TS_SPEAK.start(kind,{onDone,back,hw,taskId,set})
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('speak.js: main app not found');return}
const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const LIMIT={retell:300,question:180,diary:180,interview:90};
const PREP={retell:30,question:30,diary:30,interview:20};
const KINDS={retell:{icon:'🔁',name:'Retell',ru:'Пересказ текста своими словами',sub:'up to 5 min'},
  question:{icon:'🙋',name:'Answer a question',ru:'Ответ на вопрос о себе по теме юнита',sub:'up to 3 min'},
  interview:{icon:'💼',name:'Interview simulator',ru:'Симулятор собеседования: 5 вопросов голосом',sub:'6–8 min'},
  diary:{icon:'📔',name:'Speech diary',ru:'Раз в месяц, всегда одна тема — слышно рост',sub:'once a month · 3 min'}};
const FILLERS=/\b(um+|uh+|er+|erm|ah+|like|you know|i mean)\b/gi;

/* ---------- built-in tasks (original; replaced by data/speaking-*.json) ---------- */
const BUILTIN={tasks:[
  {id:'sp-7b-q1',kind:'question',unit:'7B',q:'What do you enjoy doing at work? What do you avoid doing?',ru:'Что вам нравится делать на работе? Чего вы избегаете?',
   hints:["I enjoy …ing","I don't mind …ing","I avoid …ing","I'm good at …ing","I'm interested in …ing"],check:['\\b(enjoy|love|like|hate|avoid|mind|finish|stop|start)\\s+\\w+ing\\b','\\b(at|in|of|about|for|before|after)\\s+\\w+ing\\b'],secs:180,
   sample:"I really enjoy working with people and solving problems. I'm good at checking documents and finding mistakes. I don't mind writing reports, but I try to avoid staying late every day. I'm interested in learning new methods of internal control."},
  {id:'sp-q-day',kind:'question',q:'Tell me about your typical working day.',ru:'Расскажите о своём обычном рабочем дне.',hints:['I usually start at …','First, I …','After that, I …','In the afternoon …','At the end of the day …'],secs:180,
   sample:"I usually start work at eight. First, I check my emails and plan the day. After that, I have short meetings with colleagues. In the afternoon I work with documents and risk reports. At the end of the day I write a short summary of what I did."},
  {id:'sp-q-problem',kind:'question',q:'Describe a problem you solved at work.',ru:'Опишите проблему, которую вы решили на работе.',hints:['Last year / Last month …','The problem was that …','I decided to …','In the end …'],secs:180,
   sample:"Last month we found that some documents were signed late. The problem was that nobody controlled the deadlines. I decided to make a simple table with all deadlines and owners. In the end the delays stopped and my manager was happy."}],
 diary:{id:'diary',kind:'diary',q:'Tell me about yourself and your job.',ru:'Расскажите о себе и своей работе.',hints:['My name is …','I live in …','I work as …','My job is to …','In the future I want to …'],secs:180,
   sample:"My name is Islam. I live in Atyrau and I work at an oil refinery. I'm a specialist in internal control and business continuity. My job is to find risks and make sure that processes are safe. In the future I want to work for an international company and use English every day."},
 interview:[
  ['Basics','Tell me about yourself.','Расскажите о себе.',"My name is Islam. I'm from Kazakhstan and I live in Atyrau. I work in internal control at an oil refinery. I like learning new things, and now I'm improving my English."],
  ['Basics','What do you do in your current job?','Чем вы занимаетесь на текущей работе?',"I work with risks and controls. I check how processes work, I find weak points and I help departments fix them. I also prepare reports for management."],
  ['Basics','What do you enjoy about your work?','Что вам нравится в вашей работе?',"I enjoy solving problems and working with different people. I like seeing that a process becomes safer and clearer after our work."],
  ['Basics','What are your strengths?','Каковы ваши сильные стороны?',"I'm organised and careful with details. I'm good at analysing information and explaining it simply. I always finish my tasks on time."],
  ['Basics','Why do you want to work for our company?','Почему вы хотите работать в нашей компании?',"Your company is international and has high safety standards. I want to grow professionally, use English every day and learn from experienced colleagues."],
  ['Work','Tell me about a problem you solved at work.','Расскажите о проблеме, которую вы решили.',"We had delays with signing documents. I made a table of deadlines and owners and sent weekly reminders. After two months the delays stopped."],
  ['Work','How do you organise your working day?','Как вы организуете свой рабочий день?',"In the morning I make a list of tasks and choose the most important ones. I check emails at fixed times so I can focus on my work."],
  ['Work','How do you work in a team?','Как вы работаете в команде?',"I listen to my colleagues and share information openly. If there is a disagreement, I try to find facts and a solution that works for everyone."],
  ['Work','Describe a report you prepared recently.','Опишите отчёт, который вы недавно подготовили.',"Recently I prepared a report about risks in our procurement process. I collected data, found three main problems and suggested simple controls to fix them."],
  ['Work','How do you deal with deadlines?','Как вы справляетесь со сроками?',"I plan my work backwards from the deadline. I split big tasks into small steps, and if there is a problem, I tell my manager early."],
  ['Future','Why do you want to change your job?','Почему вы хотите сменить работу?',"I have good experience now, and I want a new challenge. I'd like to work in an international team and develop my professional skills."],
  ['Future','Where do you see yourself in five years?','Где вы видите себя через пять лет?',"In five years I see myself as an experienced specialist in an international company. I hope to lead small projects and speak English fluently."],
  ['Future','What do you know about the oil and gas industry?','Что вы знаете о нефтегазовой отрасли?',"I've worked at a refinery for several years, so I know how important safety, reliability and control are. Small mistakes can be very expensive in this industry."],
  ['Future','How are you improving your English?','Как вы улучшаете английский?',"I have lessons with a teacher every week and I practise every day on my own: words, grammar and speaking. I also listen to podcasts."],
  ['Future','Do you have any questions for us?','Есть ли у вас вопросы к нам?',"Yes, thank you. What does a typical day look like in this role? And what training do you offer to new employees?"]
 ].map((r,i)=>({id:'iv-b'+(i+1),set:r[0],q:r[1],ru:r[2],sample:r[3],secs:90}))};
const data=()=>{const d=window.SPEAK_DATA||{tasks:[],interview:[]};return {tasks:d.tasks.length?d.tasks:BUILTIN.tasks,interview:d.interview.length?d.interview:BUILTIN.interview,diary:d.tasks.find(t=>t.kind==='diary')||BUILTIN.diary}};
const unitCode=()=>window.TS_TRAINER?TS_TRAINER.unitCode():String(P().unit||'7B').toUpperCase();
function questionTask(){const d=data(),u=unitCode();const qs=d.tasks.filter(t=>t.kind==='question');
  const forUnit=qs.filter(t=>t.unit===u);const pool=forUnit.length?forUnit:qs.filter(t=>!t.unit).concat(qs);
  const done=new Set(S.subs.filter(s=>s.type==='speaking').map(s=>s.taskId));return pool.find(t=>!done.has(t.id))||pool[Math.floor(Math.random()*pool.length)]}
function retellSources(){const d=data();const out=[];
  d.tasks.filter(t=>t.kind==='retell').forEach(t=>{const src=String(t.source||'');const [kind,key]=src.split(':');const txt=t.text||(kind==='reading'&&PASSAGES[key]?PASSAGES[key].text:kind==='listening'&&AUDIO[key]?AUDIO[key].text:'');
    out.push({id:t.id,q:t.q,ru:t.ru,title:t.title||(kind==='reading'&&PASSAGES[key]?PASSAGES[key].title:kind==='listening'&&AUDIO[key]?AUDIO[key].title:t.q||'Retell'),text:txt,hints:t.hints||[],check:t.check||[],sample:t.sample||'',unit:t.unit,from:'methodist'})});
  const u=unitCode();out.sort((a,b)=>(b.unit===u)-(a.unit===u));
  Object.entries(PASSAGES).forEach(([k,p])=>out.push({id:'rt-r-'+k,title:'📖 '+p.title,text:p.text,hints:[],check:[],sample:'',from:'reading'}));
  Object.entries(AUDIO).forEach(([k,p])=>out.push({id:'rt-l-'+k,title:'🎧 '+p.title,text:p.text,hints:[],check:[],sample:'',from:'listening'}));
  return out}

/* ---------- analysis ---------- */
function analyse(tr,secs,task){const w=wc(tr);const wpm=secs?Math.round(w/(secs/60)):0;const fil=((tr||'').match(FILLERS)||[]).length;
  const checks=(task&&task.check)||[];const hits=checks.map(re=>{try{return ((tr||'').match(new RegExp(re,'gi'))||[]).length}catch(e){return 0}});
  return {words:w,wpm,fillers:fil,gram:checks.length?hits.reduce((a,b)=>a+b,0):null,checks:checks.length}}
function hintsHtml(a,limit){const tips=[];
  if(a.words<25)tips.push('Try to say more: at least 5–6 sentences.');
  if(a.wpm&&a.wpm<70)tips.push('Speak a little faster — aim for 80–110 words a minute.');
  if(a.fillers>3)tips.push('Fewer fillers (um, like) — pause silently instead.');
  if(a.gram===0)tips.push('Use the unit grammar at least 2 times.');
  return `<div class="grid g4 sp-stats"><div><b>${a.words}</b><span>words</span></div><div><b>${a.wpm}</b><span>words/min</span></div><div><b>${a.fillers}</b><span>fillers</span></div><div><b>${a.gram==null?'—':a.gram?'✓ '+a.gram:'✗'}</b><span>unit grammar</span></div></div>
   ${tips.length?`<div class="small">${tips.map(t=>'• '+esc(t)).join('<br>')}</div>`:'<div class="small ok-text">Good job! 👍</div>'}`}

/* ---------- flow ---------- */
let prepTimer=null;
function clearPrep(){clearInterval(prepTimer);prepTimer=null}
function start(kind,o={}){if(Rec.active)return toast('Another recording is in progress');clearPrep();
  const st={kind,attempts:[],best:-1,back:o.back||'/speak',onDone:o.onDone||null,hw:o.hw||null,phase:'prep',t0:Date.now()};
  if(kind==='question'){const d=data();st.task=(o.taskId&&d.tasks.find(t=>t.id===o.taskId))||questionTask()}
  else if(kind==='diary')st.task=data().diary;
  else if(kind==='retell'){const srcs=retellSources();const t=o.taskId&&srcs.find(x=>x.id===o.taskId);
    const unitT=srcs.find(x=>x.unit===unitCode()&&x.from==='methodist');
    if(o.hw){st.task={id:'retell-hw',title:o.hw.label,text:o.hw.text||'',hints:[],check:[],sample:''}}else if(t)st.task=t;else if(o.onDone&&unitT)st.task=unitT;else st.phase='pick'}
  else if(kind==='interview'){if(o.set)st.iv=newIv(o.set);else st.phase='pick'}
  UI.sk=st;go('/speak/do');if(st.phase==='prep')beginPrep()}
function newIv(set){const qs=data().interview.filter(q=>q.set===set).slice(0,5);return {set,qs,i:0,answers:[]}}
function curQ(){const s=UI.sk;if(!s)return null;if(s.kind==='interview')return s.iv&&s.iv.qs[s.iv.i];return s.task}
function beginPrep(){const s=UI.sk;if(!s)return;s.phase='prep';s.prepT0=Date.now();const secs=PREP[s.kind];
  if(s.kind==='interview'){const q=curQ();if(q)setTimeout(()=>speak(q.q,0.95),300)}
  clearPrep();prepTimer=setInterval(()=>{const left=Math.max(0,secs-(Date.now()-s.prepT0)/1000);const el=$('#prep-t');if(el)el.textContent=Math.ceil(left)+' s';
    if(left<=0){clearPrep();if(UI.sk===s&&s.phase==='prep'&&location.hash.startsWith('#/speak/do'))recStart()}},250);render()}
async function recStart(){const s=UI.sk;if(!s||Rec.active)return;clearPrep();try{speechSynthesis.cancel()}catch(e){}
  s.phase='rec';render();const lim=LIMIT[s.kind];
  const ok=await Rec.start(t=>{const el=$('#sk-rt');if(el)el.textContent=mmss(t)+' / '+mmss(lim);const b=$('#sk-bar');if(b)b.style.width=Math.min(100,t/lim*100)+'%'},lim,true);
  if(!ok){s.phase='prep';render()}}
async function recStop(){const s=UI.sk;if(!s||s.phase!=='rec')return;const r=await Rec.stop();if(!r){s.phase='prep';return render()}
  logMinutes(r.secs/60);const tr=Rec.transcript||'';
  if(s.kind==='interview'){const q=curQ();s.iv.answers.push({q,blob:r.blob,url:URL.createObjectURL(r.blob),secs:r.secs,transcript:tr,a:analyse(tr,r.secs,q)});s.iv.i++;
    if(s.iv.i<s.iv.qs.length){save();return beginPrep()}s.phase='ivdone';save();return render()}
  const at={blob:r.blob,url:URL.createObjectURL(r.blob),secs:r.secs,transcript:tr};at.a=analyse(tr,r.secs,s.task);s.attempts.push(at);
  s.best=bestIdx(s);s.cur=s.attempts.length-1;s.phase='review';save();render()}
function bestIdx(s){let bi=0,bv=-1;s.attempts.forEach((a,i)=>{const v=a.a.words+10*(a.a.gram||0)-2*a.a.fillers;if(v>bv){bv=v;bi=i}});return bi}
function syncTr(){const s=UI.sk;const el=$('#sk-tr');if(s&&el&&s.attempts[s.cur]){const at=s.attempts[s.cur];at.transcript=el.value;at.a=analyse(at.transcript,at.secs,s.task)}}
A.skPick=id=>{const s=UI.sk;if(!s)return;if(s.kind==='retell'){s.task=retellSources().find(x=>x.id===id);if(!s.task)return}else if(s.kind==='interview')s.iv=newIv(id);beginPrep()};
A.skRec=()=>recStart();
A.skStop=()=>recStop();
A.skAgain=()=>{syncTr();beginPrep()};
A.skUse=i=>{syncTr();const s=UI.sk;s.best=i;s.cur=i;render()};
A.skShow=i=>{syncTr();UI.sk.cur=i;render()};
A.skSample=()=>{syncTr();UI.sk.showSample=true;render()};
A.skRetext=()=>{syncTr();UI.sk.showText=!UI.sk.showText;render()};
A.skSave=async()=>{syncTr();const s=UI.sk;if(!s)return;const at=s.attempts[s.best];if(!at)return;const id='s-'+uid();const t=s.task||{};
  let key;try{toast('Saving the recording…');key=await AudioStore.put('a-'+id,at.blob)}catch(e){console.error(e);return toast('Could not upload the recording. Check the connection and try again.')}
  const sub={id,type:'speaking',kind:s.kind,taskId:t.id||s.kind,prompt:(KINDS[s.kind].name)+' · '+(t.q||t.title||''),audioKey:key,transcript:at.transcript,secs:at.secs,words:at.a.words,wpm:at.a.wpm,fillers:at.a.fillers,gram:at.a.gram,attempts:s.attempts.length,status:'saved',date:new Date().toISOString(),unit:unitCode(),diary:s.kind==='diary'};
  if(s.hw){sub.hwId=s.hw.id;sub.idx=s.hw.idx;const h=S.homework.find(x=>x.id===s.hw.id);if(h){h.subs=h.subs||{};h.subs[s.hw.idx]=id;completeHwItem({id:s.hw.id,idx:s.hw.idx})}}
  if(s.hw){sub.status='submitted';notify('teacher',`New retelling from ${S.users.student.name}`,'/t/homework/'+s.hw.id)}
  S.subs.push(sub);s.saved=id;s.phase='saved';
  if(isStudent()&&window.TS_PROGRAM&&!s.onDone&&!s.hw)TS_PROGRAM.award(s.kind==='diary'?50:30,'speaking','Speaking: '+KINDS[s.kind].name);
  save();render()};
A.skIvSave=async()=>{const s=UI.sk;if(!s||!s.iv)return;const id='s-'+uid();toast('Saving the interview…');const items=[];
  for(const [i,a] of s.iv.answers.entries()){let key=null;try{key=await AudioStore.put('a-'+id+'-'+(i+1),a.blob)}catch(e){console.error(e)}items.push({q:a.q.q,qid:a.q.id,audioKey:key,transcript:a.transcript,secs:a.secs,words:a.a.words,wpm:a.a.wpm})}
  const old=S.subs.filter(x=>x.kind==='interview'&&x.set===s.iv.set);old.forEach(o=>removeAudio((o.items||[]).map(x=>x.audioKey).filter(Boolean)));S.subs=S.subs.filter(x=>!old.includes(x));
  S.subs.push({id,type:'speaking',kind:'interview',set:s.iv.set,taskId:'iv-'+s.iv.set,prompt:'Interview simulator · '+s.iv.set,items,transcript:items.map((x,i)=>`${i+1}. ${x.q}\n${x.transcript||'(no transcript)'}`).join('\n\n'),secs:items.reduce((a,x)=>a+x.secs,0),status:'saved',date:new Date().toISOString()});
  s.saved=id;s.phase='ivsaved';if(isStudent()&&window.TS_PROGRAM&&!s.onDone)TS_PROGRAM.award(50,'speaking','Interview simulator');save();render()};
A.skToTeacher=()=>{const s=UI.sk;const sub=s&&S.subs.find(x=>x.id===s.saved);if(!sub)return;sub.status='submitted';notify('teacher',`${S.users.student.name} shared a recording: ${sub.prompt}`,'/t/review/'+sub.id);save();toast('Sent to '+S.users.teacher.name);render()};
A.skShare=async idx=>{const s=UI.sk;let blob=null,text='';
  if(s&&s.kind==='interview'&&s.iv){const a=s.iv.answers[idx||0];blob=a&&a.blob;text=a?a.q.q:''}else if(s){const at=s.attempts[s.best];blob=at&&at.blob;text=(s.task&&(s.task.q||s.task.title))||''}
  if(blob)return shareBlob(blob,'🎙️ '+text)};
A.skDone=()=>{const s=UI.sk;clearPrep();UI.sk=null;if(s&&s.onDone)s.onDone({ok:!!s.saved});else go(s?s.back:'/speak')};
A.skQuit=async()=>{clearPrep();if(Rec.active){try{await Rec.stop()}catch(e){}}try{speechSynthesis.cancel()}catch(e){}const s=UI.sk;UI.sk=null;go(s?s.back:'/speak')};
A.skReplayQ=()=>{const q=curQ();if(q)speak(q.q,0.95)};
async function shareBlob(blob,text){const ext=/mp4/.test(blob.type)?'m4a':/ogg/.test(blob.type)?'ogg':'webm';const file=new File([blob],'speaking-'+dkey()+'.'+ext,{type:blob.type||'audio/webm'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();a.remove();toast('Saved to your downloads — send it in WhatsApp')}
A.skShareKey=async k=>{try{const u=await AudioStore.url(k);if(!u)return toast('This recording is no longer stored');const b=await (await fetch(u)).blob();shareBlob(b,'🎙️ My recording')}catch(e){toast('Could not load the recording')}};
const _recStop=A.recStop;A.recStop=function(){if(UI.sk&&UI.sk.phase==='rec')return recStop();return _recStop.apply(this,arguments)};
A.hwRecStart=(hwId,idx)=>{const h=S.homework.find(x=>x.id===hwId);const it=h&&h.items[idx];start('retell',{hw:{id:hwId,idx,label:it?it.label:'Retelling',text:''},back:'/homework/'+hwId})};

/* ---------- views ---------- */
const lazyAudio=(k,label)=>k?`<button class="btn sm ghost lazy-audio" data-key="${esc(k)}">▶ ${label||'Play'}</button>`:'<span class="small muted">audio deleted after 90 days</span>';
function vDo(){const s=UI.sk;if(!s){setTimeout(()=>go('/speak'),0);return ''}const K=KINDS[s.kind];
  const head=`<div class="row between" style="margin-bottom:12px"><div><b>${K.icon} ${K.name}</b>${s.kind==='interview'&&s.iv?` <span class="muted small">· question ${Math.min(s.iv.i+1,s.iv.qs.length)}/${s.iv.qs.length} · ${esc(s.iv.set)}</span>`:''}</div><button class="btn sm plain" onclick="A.skQuit()">Quit</button></div>`;
  if(s.phase==='pick'){
    if(s.kind==='interview'){const sets=[...new Set(data().interview.map(q=>q.set))];
      return head+`<div class="card"><h2>Choose a set of 5 questions</h2><div class="ru-line">Выберите набор из 5 вопросов. Вопрос звучит голосом, 20 секунд на подготовку, до 90 секунд на ответ.</div><div class="grid g3" style="margin-top:12px">${sets.map(st=>{const last=S.subs.find(x=>x.kind==='interview'&&x.set===st);return `<button class="tile" onclick="A.skPick(${jsq(st)})" style="text-align:left;cursor:pointer;font:inherit;color:var(--text)"><div class="tile-ico">💼</div><div class="tile-body"><b>${esc(st)}</b><div class="small muted">${data().interview.filter(q=>q.set===st).slice(0,5).length} questions${last?' · last: '+fmtD(last.date):''}</div></div></button>`}).join('')}</div></div>`}
    const srcs=retellSources();return head+`<div class="card"><h2>What will you retell?</h2><div class="ru-line">Выберите текст для пересказа: из урока, раздела Reading или Listening.</div><div class="stack" style="margin-top:12px">${srcs.map(x=>`<button class="tile" onclick="A.skPick(${jsq(x.id)})" style="text-align:left;cursor:pointer;font:inherit;color:var(--text)"><div class="tile-body"><b>${x.unit===unitCode()?'📍 ':''}${esc(x.title)}</b>${x.unit?` <span class="badge">${esc(x.unit)}</span>`:''}<div class="small muted">${x.text?esc(x.text.slice(0,110))+'…':'text from your lesson'}</div></div></button>`).join('')}</div></div>`}
  const q=curQ()||{};
  const qBox=s.kind==='retell'?`<div class="task-card"><b>Retell in your own words:</b> ${esc(q.title||'')}${q.text?`<div style="margin-top:8px"><button class="btn sm plain" onclick="A.skRetext()">${s.showText?'Hide':'Show'} the text</button></div>${s.showText?`<div class="small" style="margin-top:8px;max-height:220px;overflow:auto">${esc(q.text)}</div>`:''}`:''}</div>`
    :`<div class="task-card"><div class="sp-q">${esc(q.q||'')} ${s.kind==='interview'?`<button class="btn sm plain" onclick="A.skReplayQ()" aria-label="Listen again">🔊</button>`:''}</div>${q.ru?`<div class="ru-line">${esc(q.ru)}</div>`:''}</div>`;
  const hints=(q.hints||[]).length?`<div class="hint-chips">${q.hints.map(h=>`<span class="chip">${esc(h)}</span>`).join('')}</div>`:'';
  if(s.phase==='prep')return head+`<div class="card task-big stack">${qBox}${hints}<div class="center"><div class="small muted">Think first. Recording starts automatically in</div><div class="prep-t" id="prep-t">${PREP[s.kind]} s</div></div>
     <button class="btn lg block bad-btn" onclick="A.skRec()">🎙️ Start recording now</button><div class="small muted center">Up to ${mmss(LIMIT[s.kind])}</div></div>`;
  if(s.phase==='rec'){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    return head+`<div class="card task-big stack">${qBox}${hints}<div class="center"><span class="rec"></span> Recording · <b id="sk-rt">0:00 / ${mmss(LIMIT[s.kind])}</b></div><div class="bar"><i id="sk-bar" style="width:0%;background:var(--bad)"></i></div>
     <button class="btn lg block" onclick="A.skStop()">⏹ Stop</button><div class="small muted">Live transcript${SR?'':' is not supported in this browser — you can type it after recording'}:</div><div id="live" class="small"></div></div>`}
  if(s.phase==='ivdone'||s.phase==='ivsaved'){const iv=s.iv;
    return head+`<div class="card stack"><h2>Interview finished ✓</h2><div class="ru-line">Послушайте свои ответы и сравните с образцами.</div>
     ${iv.answers.map((a,i)=>`<div class="iv-ans"><b>${i+1}. ${esc(a.q.q)}</b><audio controls src="${a.url}" style="width:100%;margin:6px 0"></audio><div class="small">${a.transcript?esc(a.transcript):'<span class="muted">(no transcript)</span>'}</div><div class="small muted">${a.a.words} words · ${a.a.wpm} words/min · ${a.a.fillers} fillers</div>
       ${a.q.sample?`<details><summary class="small">Sample answer</summary><div class="small">${esc(a.q.sample)} <button class="btn sm plain" onclick="speak(${jsq(a.q.sample)})">🔊</button></div></details>`:''}<button class="btn sm plain" onclick="A.skShare(${i})">📤 Share</button></div>`).join('')}
     <div class="row">${s.phase==='ivdone'?'<button class="btn lg" onclick="A.skIvSave()">💾 Save this session</button>':'<span class="badge ok">saved ✓</span>'}<button class="btn lg ghost" onclick="A.skPick(${jsq(iv.set)})">Try again</button><button class="btn lg plain" onclick="A.skDone()">${s.onDone?'Next →':'Done'}</button></div>
     <div class="small muted">Only the last saved session of each set is kept.</div></div>`}
  const at=s.attempts[s.cur]||s.attempts[s.best];
  const atList=s.attempts.length>1?`<div class="row" style="flex-wrap:wrap">${s.attempts.map((a,i)=>`<button class="chip ${i===s.cur?'on':''}" onclick="A.skShow(${i})">Try ${i+1}${i===s.best?' ⭐':''} · ${a.a.words} w</button>`).join('')}</div>`:'';
  const sample=q.sample?(s.showSample?`<div class="card" style="background:var(--surface2)"><b>Sample answer</b> <button class="btn sm plain" onclick="speak(${jsq(q.sample)})">🔊 Listen</button><div>${esc(q.sample)}</div></div>`:`<button class="btn ghost" onclick="A.skSample()">👀 Show a sample answer</button>`):'';
  if(s.phase==='saved'){const sub=S.subs.find(x=>x.id===s.saved);
    return head+`<div class="card center stack"><div style="font-size:48px">✅</div><h2>Saved</h2><div class="muted">Best try: ${at.a.words} words · ${at.a.wpm} words/min</div>
     <div class="row" style="justify-content:center"><button class="btn lg" onclick="A.skDone()">${s.onDone?'Next →':'Done'}</button><button class="btn ghost" onclick="A.skShare()">📤 Share (WhatsApp)</button>
     <button class="btn ghost" ${sub&&sub.status==='submitted'?'disabled':''} onclick="A.skToTeacher()">${sub&&sub.status==='submitted'?'Sent ✓':'Send to '+esc(S.users.teacher.name)+' on the site'}</button></div>
     <div class="whats-next small muted">What next? Listen to the sample once more and repeat it aloud.</div></div>`}
  return head+`<div class="card stack">${qBox}${atList}<audio controls src="${at.url}" style="width:100%"></audio>
    <label class="f">Transcript — fix it if needed<textarea id="sk-tr" oninput="">${esc(at.transcript)}</textarea></label>
    ${hintsHtml(at.a,LIMIT[s.kind])}${sample}
    <div class="row" style="flex-wrap:wrap"><button class="btn lg" onclick="A.skSave()">💾 Save ${s.attempts.length>1?'the best try ⭐':''}</button><button class="btn lg ghost" onclick="A.skAgain()">🔁 Record again</button>${s.attempts.length>1&&s.cur!==s.best?`<button class="btn ghost" onclick="A.skUse(${s.cur})">⭐ Use this try</button>`:''}</div></div>`}
function vSpeak(sub){if(sub==='do')return vDo();
  const mine=S.subs.filter(s=>s.type==='speaking').slice().reverse();const diary=mine.filter(s=>s.diary).slice().reverse();
  const thisMonth=dkey().slice(0,7);const diaryDue=!diary.some(d=>d.date.slice(0,7)===thisMonth);
  const tile=k=>{const K=KINDS[k];return `<button class="mode-tile sk-speaking" onclick="TS_SPEAK.start('${k}')"><span class="mode-ico">${K.icon}</span><span class="mode-name" style="font-size:21px">${K.name}</span><span class="mode-time">${K.sub}</span><span class="ru-line">${K.ru}</span>${k==='diary'&&diaryDue?'<span class="badge warn rec-badge">due this month</span>':''}</button>`};
  return `<div class="page-head"><h1>Speaking 🎙️</h1><p class="muted">You speak alone, the site records. Live conversation is in class with ${esc(S.users.teacher.name)}.</p><div class="ru-line">Монолог: вы говорите, сайт записывает. Живой разговор — на уроке.</div></div>
   <div class="mode-grid">${['retell','question','interview','diary'].map(tile).join('')}</div>
   <div class="grid g2" style="margin-top:18px">
    <div class="card"><h2>My recordings</h2>${mine.length?mine.slice(0,15).map(s=>`<div class="list-item"><div><div>${esc(String(s.prompt||'').slice(0,80))}</div><div class="small muted">${fmtDT(s.date)}${s.words!=null?` · ${s.words} words · ${s.wpm} w/min`:''}${s.status==='submitted'?' · sent':''}${s.status==='reviewed'?' · reviewed ✓':''}</div></div><div class="row">${s.items?s.items.map((x,i)=>lazyAudio(x.audioKey,i+1)).join(''):lazyAudio(s.audioKey)}${s.audioKey?`<button class="btn sm plain" onclick="A.skShareKey(${jsq(s.audioKey)})" aria-label="Share">📤</button>`:''}</div></div>`).join(''):'<p class="muted">No recordings yet.</p>'}</div>
    <div class="card"><h2>📔 Speech diary</h2><div class="ru-line">Одна тема каждый месяц: «${esc(data().diary.q)}». Записи хранятся всегда.</div>
     ${diary.length?diary.map(d=>`<div class="list-item"><div>${new Date(d.date).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}<div class="small muted">${d.words||0} words · ${d.wpm||0} w/min</div></div>${lazyAudio(d.audioKey)}</div>`).join('')+(diary.length>1?`<button class="btn" style="margin-top:10px" onclick="TS_SPEAK.playDiary()">▶ Play all in a row</button>`:''):'<p class="muted">No diary entries yet.</p>'}
     ${diaryDue?`<button class="btn lg" style="margin-top:12px" onclick="TS_SPEAK.start('diary')">📔 Record this month</button>`:''}</div></div>`}

/* ---------- lazy audio (load only on ▶) ---------- */
document.addEventListener('click',async e=>{const b=e.target.closest('.lazy-audio');if(!b)return;e.preventDefault();const k=b.dataset.key;if(!k)return;b.disabled=true;b.textContent='Loading…';
  try{const u=await AudioStore.url(k);if(!u){b.textContent='Not available';return}
    let a=b.nextElementSibling&&b.nextElementSibling.tagName==='AUDIO'&&b.nextElementSibling.dataset.key===k?b.nextElementSibling:null;
    if(!a){a=document.createElement('audio');a.controls=true;a.style.maxWidth='260px';b.after(a)}
    a.src=u;a.style.display='';b.remove();a.play().catch(()=>{})}catch(err){b.textContent='Could not load'}});
/* existing <audio data-key> players (homework, teacher review) stay in place but load only on ▶ */
hydrateAudio=function(){$$('audio[data-key]').forEach(el=>{if(el.dataset.lazy)return;el.dataset.lazy='1';const k=el.dataset.key;
  if(!k||k==='undefined'||k==='null'){el.insertAdjacentHTML('afterend','<span class="small muted">audio deleted after 90 days</span>');el.style.display='none';return}
  if(el.getAttribute('src'))return;el.style.display='none';const b=document.createElement('button');b.className='btn sm ghost lazy-audio';b.dataset.key=k;b.textContent='▶ Play recording';el.before(b)})};
async function playDiary(){const keys=S.subs.filter(s=>s.type==='speaking'&&s.diary&&s.audioKey).sort((a,b)=>a.date.localeCompare(b.date)).map(s=>s.audioKey);
  toast('Playing '+keys.length+' diary entries…');for(const k of keys){try{const u=await AudioStore.url(k);if(!u)continue;await new Promise(res=>{const a=new Audio(u);a.onended=res;a.onerror=res;a.play().catch(res)})}catch(e){}}}

/* ---------- storage rule: delete audio after 90 days (diary is kept) ---------- */
async function removeAudio(keys){if(!keys.length)return true;if(!Cloud.on){try{for(const k of keys)await AudioDB.del?.(k)}catch(e){}return true}
  try{const {error}=await Cloud.sb.storage.from('audio').remove(keys);return !error}catch(e){return false}}
async function cleanup(){if(!S||!S.role)return;const p=P();const k=dkey();if(p.audioCleanup===k)return;p.audioCleanup=k;
  const old=iso=>iso&&(Date.now()-new Date(iso))>90*864e5;let changed=false;
  for(const s of S.subs){if(s.type!=='speaking'||s.diary)continue;const base=(s.review&&s.review.at)||s.date;if(!old(base))continue;
    const keys=[s.audioKey].concat((s.items||[]).map(x=>x.audioKey)).concat(s.review&&s.review.voiceKey?[s.review.voiceKey]:[]).filter(Boolean);if(!keys.length)continue;
    if(await removeAudio(keys)){s.audioKey=null;(s.items||[]).forEach(x=>x.audioKey=null);if(s.review)s.review.voiceKey=null;s.audioDeleted=new Date().toISOString();changed=true}}
  if(changed)toast('Old recordings (90+ days) were removed; transcripts are kept');save()}
setTimeout(()=>{cleanup().catch(e=>console.error(e))},4000);

/* ---------- wiring ---------- */
SV.speak=vSpeak;SV.speaking=()=>vSpeak();
window.TS_SPEAK={start,data,analyse,retellSources,playDiary,cleanup,LIMIT,KINDS};
})();
