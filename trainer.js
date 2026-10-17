/* ============================================================
   trainer.js — the personal trainer described in METHODIKA.md
   Loaded after hub.js. Adds:
     D1  current English File unit chosen by the student; day plan from it
     D4  day rhythm: Mon/Wed/Fri sprint 45–60 min, other days 30 min
     D6  "tr" questions (translate from Russian) + smarter answer normalisation
     D2  student adds Ainura's WhatsApp homework as a reminder
     D3  weekly report for a screenshot / WhatsApp
     D10 background listening minutes (no XP)
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('trainer.js: main app not found');return}

const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const pct=(c,t)=>t?Math.round(c/t*100):0;
const DEFAULT_UNIT='7B';
const LADDER={mc:1,tf:1,gap:2,order:3,fix:4,tr:5};

/* ---------- D6: answer normalisation (contractions = full forms) ---------- */
const _norm=norm;
norm=function(s){let x=String(s||'').toLowerCase().replace(/[’‘`]/g,"'")
  .replace(/\b(it|that|what|there|here|he|she|who|where|how)'s\b/g,'$1 is')
  .replace(/\blet's\b/g,'let us').replace(/\bcan not\b/g,'cannot');
  return _norm(x)};

/* ---------- D1: current unit ---------- */
const piBook=()=>Array.isArray(S.course)?S.course.find(b=>b.id==='pi'):null;
const units=()=>{const b=piBook();return b?b.files.flatMap(f=>f.lessons):[]};
const unitCode=()=>String(P().unit||DEFAULT_UNIT).toUpperCase();
const unitLesson=(code=unitCode())=>{const l=units().find(x=>String(x.code).toUpperCase()===code);return l?findLesson(l.id):null};
function unitModule(code=unitCode()){
  const fromData=Object.entries(GRAMMAR).find(([k,g])=>g.unit===code&&g.track!=='work');
  if(fromData)return fromData[0];
  const l=unitLesson(code);return l&&GRAMMAR[l.grammar]?l.grammar:null}
function unitQs(code=unitCode()){const m=unitModule(code);return m?GRAMMAR[m].qs:[]}
const SHARE={mc:.15,tf:0,gap:.2,order:.2,fix:.2,tr:.25};
function pickLadder(qs,n){const by={};shuffle(qs).forEach(q=>(by[q.type]=by[q.type]||[]).push(q));const out=[];
  Object.keys(SHARE).forEach(t=>{if(by[t])out.push(...by[t].splice(0,Math.round(n*SHARE[t])))});
  const rest=shuffle(Object.values(by).flat());while(out.length<n&&rest.length)out.push(rest.shift());return ladder(out.slice(0,n))}
const ladder=qs=>qs.slice().sort((a,b)=>(LADDER[a.type]||3)-(LADDER[b.type]||3));
function pastQs(){/* debts first, then earlier units */
  const cur=unitCode(),ls=units(),i=ls.findIndex(l=>String(l.code).toUpperCase()===cur);
  const debts=(P().debts||[]).filter(id=>!(P().debtsDone||{})[id]).map(id=>findLesson(id)).filter(Boolean).map(l=>l.grammar);
  const earlier=ls.slice(0,Math.max(0,i)).map(l=>l.grammar);
  const mods=[...new Set(debts.concat(earlier.reverse()))].filter(k=>GRAMMAR[k]&&k!==unitModule());
  return shuffle(mods.flatMap(k=>GRAMMAR[k].qs))}
A.tSetUnit=code=>{P().unit=String(code).toUpperCase();save();toast('Current unit: '+P().unit);render()};
if(window.TS_PROGRAM)TS_PROGRAM.sprintLesson=()=>unitLesson();

/* ---------- plan tracking ---------- */
function today(){const p=P();p.plan=p.plan||{};const k=dkey();if(!p.plan[k])p.plan[k]={done:{}};
  const ks=Object.keys(p.plan).sort();while(ks.length>21)delete p.plan[ks.shift()];return p.plan[k]}
function markBlock(id){if(!isStudent()||!id)return;const t=today();if(!t.done[id]){t.done[id]=new Date().toISOString();save()}}
const _finish=finishRun;
finishRun=function(){const r=RUN;_finish();try{if(r&&r.planBlock){markBlock(r.planBlock);render()}}catch(e){console.error(e)}};
const _endReview=A.endReview;A.endReview=function(){const r=_endReview.apply(this,arguments);markBlock('cards');render();return r};
function startBlock(id,fn){fn();if(RUN)Object.assign(RUN,{planBlock:id,back:'/today'})}
A.tCards=()=>{if(!dueCards().length){markBlock('cards');toast('No cards due today — block done ✓');return render()}A.startReview()};
A.tMistakes=()=>{if(!S.mistakes.length){markBlock('mist');toast('Mistakes bank is empty — block done ✓');return render()}startBlock('mist',()=>A.reviewMistakes())};
A.tUnit=()=>{const qs=unitQs();if(!qs.length)return toast('No exercises for this unit yet');const m=unitModule();
  startBlock('unit',()=>listRun({title:`Unit ${unitCode()} · ${GRAMMAR[m].title}`,kind:'lesson',lessonId:(unitLesson()||{}).id,reshuffle:false},pickLadder(qs,15)))};
A.tMixed=()=>{const u=shuffle(unitQs()).slice(0,7),p=pastQs().slice(0,3);const qs=shuffle(u.concat(p));if(!qs.length)return toast('No exercises yet');
  startBlock('mixed',()=>listRun({title:'Mixed sentences · 70% unit, 30% review',kind:'practice'},qs))};
A.tMini=()=>{const qs=shuffle(unitQs()).slice(0,10);if(!qs.length)return toast('No exercises for this unit yet');const code=unitCode();
  startBlock('skill',()=>listRun({title:`Mini-test · unit ${code}`,mode:'test',kind:'minitest',showAnswers:true,onFinish:r=>{const c=r.answers.filter(a=>a.ok).length;const m=P().minitest=P().minitest||{};(m[code]=m[code]||[]).push({date:new Date().toISOString(),c,t:r.answers.length})}},qs))};
A.tRead=()=>{const keys=Object.keys(PASSAGES);const k=keys.find(x=>PASSAGES[x].src)||keys[1]||keys[0];startBlock('skill',()=>A.startReading(k))};
A.tListen=()=>{const keys=Object.keys(AUDIO);const k=keys.find(x=>AUDIO[x].src)||keys[1]||keys[0];startBlock('skill',()=>A.startListening(k))};
A.tWork=()=>{const mods=Object.keys(GRAMMAR).filter(k=>GRAMMAR[k].track==='work');
  if(mods.length)return startBlock(new Date().getDay()===6?'skill':'work',()=>listRun({title:'Work English',kind:'practice'},shuffle(mods.flatMap(k=>GRAMMAR[k].qs)).slice(0,10)));
  markBlock(new Date().getDay()===6?'skill':'work');UI.stask='s-placement';go('/speaking')};
A.tBoss=()=>{const l=unitLesson();if(!l)return toast('Choose your unit first');if(A.gSprintLesson)A.gSprintLesson(l.id);markBlock('boss');go('/sprint')};
A.tHwDone=()=>{markBlock('hw');go('/homework')};
A.tBg=n=>{const p=P();p.bg=p.bg||{};const k=dkey();p.bg[k]=(p.bg[k]||0)+n;save();toast(`🎧 +${n} min background listening (no XP)`);render()};

/* ---------- D4: the day plan ---------- */
const SPRINT_DAYS=[1,3,5];
function blocks(){const d=new Date().getDay(),sprint=SPRINT_DAYS.includes(d);const due=dueCards().length;
  const ownHw=S.homework.filter(h=>['active','overdue'].includes(hwStatus(h)));
  if(sprint)return {sprint,mins:'45–60',list:[
    {id:'cards',min:10,t:'🃏 Cards',sub:due?`${due} due · plus up to 8 new words`:'Nothing due today',js:'A.tCards()'},
    {id:'mist',min:5,t:'🔁 Mistakes bank',sub:S.mistakes.length?`${S.mistakes.length} to fix`:'Empty',js:'A.tMistakes()'},
    {id:'unit',min:15,t:`📐 Unit ${unitCode()} grammar`,sub:'Sentence ladder: choose → fill → order → fix → translate',js:'A.tUnit()'},
    {id:'hw',min:15,t:'📚 Ainura’s homework',sub:ownHw.length?`${ownHw.length} open · Workbook is done off the site, mark it here`:'No open homework — add it from WhatsApp',js:'A.tHwDone()'},
    {id:'boss',min:10,t:'✍️ Your own sentences',sub:'Boss task: 5–8 sentences about your work with this unit’s grammar',js:'A.tBoss()'}]};
  const skill=d===2?{t:'📖 Reading',js:'A.tRead()'}:d===4?{t:'🎧 Listening',js:'A.tListen()'}:d===6?{t:'💼 Work English',js:'A.tWork()'}:{t:'📝 Mini-test + weekly report',js:'A.tMini()'};
  return {sprint,mins:'30',list:[
    {id:'cards',min:10,t:'🃏 Cards',sub:due?`${due} due · plus up to 8 new words`:'Nothing due today',js:'A.tCards()'},
    {id:'mixed',min:10,t:'🔀 Mixed sentences',sub:`70% unit ${unitCode()}, 30% earlier units and debts`,js:'A.tMixed()'},
    {id:'skill',min:10,t:skill.t,sub:'Skill of the day',js:skill.js}]}}
function unitPicker(){const cur=unitCode();
  return `<select onchange="A.tSetUnit(this.value)" style="width:auto;display:inline-block">${units().map(l=>`<option value="${esc(l.code)}" ${String(l.code).toUpperCase()===cur?'selected':''}>${esc(l.code)} · ${esc(l.title)}</option>`).join('')}</select>`}
function vToday(){
  const B=blocks(),t=today();const doneN=B.list.filter(b=>t.done[b.id]).length;const m=unitModule();const g=m&&GRAMMAR[m];
  const bg=(P().bg||{})[dkey()]||0;const xp=S.game?S.game.xp:0;const st=calcStreak();
  const day=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  const sun=new Date().getDay()===0;
  return `<div class="page-head"><h1>Today ⚡</h1><p class="muted">${day} · ${B.sprint?'Sprint day':'Training day'} · ${B.mins} min ${ru(B.sprint?'Пн/Ср/Пт — спринт 45–60 минут. Блоки идут по порядку.':'Вт/Чт/Сб/Вс — тренировка 30 минут (до 60 по желанию).')}</p></div>
  <div class="grid g3" style="margin-bottom:16px">
   <div class="card"><div class="muted small">📍 Current unit (with Ainura)</div><div style="margin:8px 0">${unitPicker()}</div><div class="small muted">${g?esc(g.title)+' · '+g.qs.length+' exercises':'Exercises for this unit are coming from the methodist'}</div>${ru('После урока выберите новый юнит — план дня перестроится.')}</div>
   <div class="card"><div class="muted small">Today</div><div class="kpi">${doneN}/${B.list.length} <small>blocks</small></div><div class="bar" style="margin-top:8px"><i style="width:${pct(doneN,B.list.length)}%;background:var(--ok)"></i></div><div class="small muted" style="margin-top:6px">🔥 ${st} day${st===1?'':'s'} · 🎖️ ${xp} XP</div></div>
   <div class="card"><div class="muted small">🎧 Background listening (no XP)</div><div class="kpi">${Math.round(bg)} <small>min today</small></div><div class="row" style="margin-top:8px"><button class="btn sm plain" onclick="A.tBg(10)">+10</button><button class="btn sm plain" onclick="A.tBg(20)">+20</button><button class="btn sm plain" onclick="A.tBg(30)">+30</button></div></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="row between"><h2>Plan · ${B.mins} min</h2>${doneN===B.list.length?'<span class="badge ok">day complete ✓</span>':''}</div>
   ${B.list.map((b,i)=>`<div class="list-item"><div><div>${t.done[b.id]?'✅':'⬜'} <b>${i+1}. ${esc(b.t)}</b> <span class="badge">${b.min} min</span></div><div class="small muted">${esc(b.sub)}</div></div>${t.done[b.id]?`<button class="btn sm plain" onclick="${b.js}">Again</button>`:`<button class="btn sm" onclick="${b.js}">Start</button>`}</div>`).join('')}
   ${doneN===B.list.length?`<div class="fb ok" style="margin-top:10px"><b>Done for today.</b> More time? 10 more minutes of sentences → Work English → reading.<div class="row" style="margin-top:8px"><button class="btn sm" onclick="A.tMixed()">🔀 Sentences</button><button class="btn sm ghost" onclick="A.tWork()">💼 Work English</button><button class="btn sm ghost" onclick="A.tRead()">📖 Reading</button></div></div>`:''}</div>
  ${sun?`<div class="card row between" style="margin-bottom:16px"><div><b>🧾 Sunday: weekly report</b><div class="small muted">Take a screenshot and send it to ${esc(S.users.teacher.name)} in WhatsApp.</div></div><a class="btn" href="#/report">Open report</a></div>`:''}`}

/* ---------- D2: homework from WhatsApp ---------- */
function hwForm(){const nl=nextLesson();const due=nl?dkey(nl)+'T'+String(nl.getHours()).padStart(2,'0')+':'+String(nl.getMinutes()).padStart(2,'0'):dkey(addDays(new Date(),7))+'T09:00';
  return `<div class="card stack" style="margin-bottom:16px"><h2>➕ Add homework from WhatsApp</h2><p class="small muted">Copy ${esc(S.users.teacher.name)}’s message and set the deadline. It becomes a reminder in your plan. ${ru('Скопируйте текст ДЗ из WhatsApp и укажите срок.')}</p>
   <label class="f">Homework text<textarea id="whw-text" placeholder="e.g. Workbook p. 45 ex. 1–3, learn the words from 7B, retell the text"></textarea></label>
   <div class="grid g2"><label class="f">Deadline<input type="datetime-local" id="whw-due" value="${due}"></label><label class="f">Unit<input type="text" id="whw-unit" value="${esc(unitCode())}"></label></div>
   <div><button class="btn" onclick="A.tHwAdd()">Save homework</button></div></div>`}
A.tHwAdd=()=>{const text=($('#whw-text')||{}).value||'';const due=($('#whw-due')||{}).value;const unit=(($('#whw-unit')||{}).value||unitCode()).trim().toUpperCase();
  if(!text.trim())return toast('Paste the homework text first');if(!due)return toast('Set a deadline');
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const items=(lines.length>1?lines:[text.trim()]).slice(0,8).map(l=>({type:'textbook',ref:'',label:l.slice(0,140)}));
  const h={id:'hw-'+uid(),title:`Unit ${unit} · homework from WhatsApp`,instructions:text.trim(),due:new Date(due).toISOString(),est:30,priority:'normal',lesson:(unitLesson(unit)||{}).id||'',items,done:items.map(()=>false),status:'active',created:new Date().toISOString(),messages:[],feedback:'',source:'whatsapp',unit};
  S.homework.push(h);save();toast('Homework saved');go('/homework/'+h.id)};
const _hw=SV.homework;
SV.homework=function(id){const h=_hw.apply(this,arguments);if(id||!isStudent())return h;return h.replace('<div class="page-head"><h1>Homework</h1></div>','<div class="page-head"><h1>Homework</h1></div>'+hwForm())};

/* ---------- D3: weekly report ---------- */
function weekData(){const from=addDays(new Date(),-6);from.setHours(0,0,0,0);const inWeek=d=>new Date(d)>=from;
  let days=0,mins=0,bg=0;for(let i=0;i<7;i++){const k=dkey(addDays(new Date(),-i));if(S.activity[k]){days++;mins+=S.activity[k]}bg+=(P().bg||{})[k]||0}
  const ans=S.attempts.filter(a=>inWeek(a.date)).flatMap(a=>a.answers||[]);const c=ans.filter(a=>a.ok).length;
  const code=unitCode(),um=unitModule();const uAns=ans.filter(a=>a.topic===um);const uc=uAns.filter(a=>a.ok).length;
  const top=S.mistakes.slice().sort((a,b)=>b.count-a.count||new Date(b.date)-new Date(a.date)).slice(0,5).map(m=>{const q=ALLQ[m.qid];return q?{q:q.q,given:m.given,right:answerText(q),topic:topicName(q.topic),n:m.count}:null}).filter(Boolean);
  const newWords=S.vocab.filter(v=>inWeek(v.added)).length,learned=S.vocab.filter(v=>v.reps>=2).length;
  const hws=S.homework.filter(h=>inWeek(h.created)||inWeek(h.due)||(h.submittedAt&&inWeek(h.submittedAt)));
  const mini=((P().minitest||{})[code]||[]).slice(-1)[0];
  const weakTopic=(()=>{const cnt={};S.mistakes.forEach(m=>{if(GRAMMAR[m.topic])cnt[m.topic]=(cnt[m.topic]||0)+m.count});const k=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];return k?topicName(k):null})();
  return {from,days,mins,bg,ans:ans.length,c,code,um,uAns:uAns.length,uc,top,newWords,learned,hws,mini,weakTopic}}
function reportText(w){const L=[];
  L.push(`📊 Weekly report · ${S.users.student.name} · ${fmtD(w.from.toISOString())} – ${fmtD(new Date().toISOString())}`);
  L.push(`📅 Days: ${w.days}/7 · ⏱ ${Math.round(w.mins)} min${w.bg?` (+${Math.round(w.bg)} min background)`:''}`);
  L.push(`📍 Unit ${w.code}: accuracy ${w.uAns?pct(w.uc,w.uAns)+'%':'—'}${w.mini?` · mini-test ${pct(w.mini.c,w.mini.t)}%`:''}`);
  L.push(`✅ All exercises: ${w.ans?pct(w.c,w.ans)+'%':'—'} (${w.c}/${w.ans})`);
  L.push(`🃏 New words: ${w.newWords} · learned in total: ${w.learned}`);
  if(w.top.length){L.push('❌ Top mistakes:');w.top.forEach((m,i)=>L.push(`${i+1}. ${m.q} — I wrote “${m.given}”, correct: “${m.right}”`))}
  if(w.hws.length){L.push('📚 Homework:');w.hws.forEach(h=>L.push(`• ${h.instructions?h.instructions.split('\n')[0].slice(0,80):h.title} — ${['submitted','reviewed'].includes(hwStatus(h))?'done ✅':h.done.some(Boolean)?`${h.done.filter(Boolean).length}/${h.items.length}`:'not done'}`))}
  L.push(`🔁 Please review in class: ${w.weakTopic||'—'}`);return L.join('\n')}
function vReport(){const w=weekData();const T=reportText(w);
  const row=(l,v)=>`<div class="list-item"><div>${l}</div><b>${v}</b></div>`;
  return `<div class="page-head no-print"><h1>Weekly report 🧾</h1><p class="muted">One page for a screenshot, or copy the text into WhatsApp. ${ru('Сделайте скриншот или нажмите «Copy text» и вставьте в WhatsApp Айнуре.')}</p><div class="row"><button class="btn" onclick="A.tCopyReport()">📋 Copy text for WhatsApp</button><button class="btn plain" onclick="window.print()">🖨️ Print / PDF</button></div></div>
  <div class="card" style="max-width:560px" id="report-card">
   <h2>📊 ${esc(S.users.student.name)} · week ${fmtD(w.from.toISOString())} – ${fmtD(new Date().toISOString())}</h2>
   ${row('📅 Days of practice',`${w.days}/7`)}${row('⏱ Minutes',`${Math.round(w.mins)}${w.bg?` <span class="small muted">+${Math.round(w.bg)} background</span>`:''}`)}
   ${row(`📍 Unit ${esc(w.code)} accuracy`,w.uAns?pct(w.uc,w.uAns)+'%':'—')}${row('📝 Mini-test',w.mini?pct(w.mini.c,w.mini.t)+'%':'—')}
   ${row('✅ All exercises',w.ans?`${pct(w.c,w.ans)}% <span class="small muted">${w.c}/${w.ans}</span>`:'—')}${row('🃏 New words / learned',`${w.newWords} / ${w.learned}`)}
   <h3 style="margin-top:12px">❌ Top mistakes</h3>${w.top.length?w.top.map((m,i)=>`<div class="small" style="margin:6px 0">${i+1}. ${esc(m.q)}<br><span style="color:var(--bad)">${esc(m.given)}</span> → <b style="color:var(--ok)">${esc(m.right)}</b> <span class="muted">· ${esc(m.topic)}</span></div>`).join(''):'<div class="small muted">No mistakes this week.</div>'}
   <h3 style="margin-top:12px">📚 Homework</h3>${w.hws.length?w.hws.map(h=>`<div class="small" style="margin:4px 0">${['submitted','reviewed'].includes(hwStatus(h))?'✅':'⬜'} ${esc(h.instructions?h.instructions.split('\n')[0].slice(0,90):h.title)}</div>`).join(''):'<div class="small muted">No homework this week.</div>'}
   <div class="fb ok" style="margin-top:12px"><b>🔁 Please review in class:</b> ${esc(w.weakTopic||'—')}</div></div>
  <textarea id="report-text" style="position:absolute;left:-9999px" aria-hidden="true">${esc(T)}</textarea>`}
A.tCopyReport=()=>{const t=$('#report-text');if(!t)return;const v=t.value;
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast('Copied — paste it into WhatsApp'),()=>{t.select();try{document.execCommand('copy');toast('Copied — paste it into WhatsApp')}catch(e){toast('Select the text manually')}})};

/* ---------- wire in ---------- */
SV.today=vToday;SV.report=vReport;TV.report=vReport;
const desc=Object.getOwnPropertyDescriptor(window,'NAV_OVERRIDE');
if(desc&&desc.get)Object.defineProperty(window,'NAV_OVERRIDE',{configurable:true,get(){const o=desc.get.call(window);if(!o)return o;
  const add=(list,after,item)=>{if(list.some(n=>n&&n[0]===item[0]))return;const i=list.findIndex(n=>n&&n[0]===after);list.splice(i<0?list.length:i+1,0,item)};
  add(o.student,'history',['report','Weekly report','🧾']);add(o.teacher,'history',['report','Weekly report','🧾']);return o}});
try{render()}catch(e){console.error(e)}
window.TS_TRAINER={unitCode,unitModule,unitQs,blocks,weekData,reportText};
})();
