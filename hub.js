/* ============================================================
   hub.js — site structure from SPEC.md: three blocks
     1. Map       — level, all topics, "you are here", problem topics
     2. Learning  — homework from the teacher + self-study
     3. Progress  — progress, mistakes, homework history, achievements
   Loaded after program.js. Adds the pages "map", "self", "history"
   and the grouped menu. Works with or without program.js/materials.js.
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('hub.js: main app not found');return}

const PR=()=>window.TS_PROGRAM||null;
const has=(role,key)=>!!(role==='student'?SV:TV)[key];

/* ---------- 1. Grouped menu ---------- */
function studentNav(){return [
  {h:'1 · Map'},
  ['today','Today','⚡'],['map','Map of topics','🗺️'],['placement','Placement test','🎯'],['baseline','Before / after tests','📏'],
  {h:'2 · Learning'},
  ['homework','Homework · '+S.users.teacher.name,'📚'],['self','Self-study','🎒'],['sprint','Sprint','🏃'],
  {h:'3 · Progress'},
  ['progress','Progress','📈'],['mistakes','Mistakes bank','🔁'],['history','Homework history','🗂️'],['achievements','Achievements','🏆'],['materials','Materials','📦'],['settings','Settings','⚙️'],['about','About','ℹ️']
].filter(n=>n.h||has('student',n[0]))}
function teacherNav(){return [
  {h:'Student'},
  ['dashboard','Dashboard','🏠'],['analytics','Analytics','📈'],['history','Homework history','🗂️'],['materials','Materials & pilot','📦'],
  {h:'Teaching'},
  ['homework','Homework','📚'],['review','Review queue','✅'],['tests','Tests & questions','📝'],['course','Course editor','🗺️'],
  {h:'Other'},
  ['notes','Private notes','🗒️'],['settings','Settings','⚙️'],['about','About','ℹ️']
].filter(n=>n.h||has('teacher',n[0]))}
Object.defineProperty(window,'NAV_OVERRIDE',{configurable:true,get(){return S&&S.role?{student:studentNav(),teacher:teacherNav()}:null}});
const SELF=['grammar','vocabulary','listening','reading','pronunciation','speaking','writing','tests','submission'];
window.NAV_ALIAS={student:Object.assign(Object.fromEntries(SELF.map(k=>[k,'self'])),{course:'map',program:'map',lesson:'map',dashboard:'map','placement-result':'placement'}),teacher:{}};

/* ---------- helpers ---------- */
const pct=(c,t)=>t?Math.round(c/t*100):0;
function curLesson(){try{return PR()&&PR().sprintLesson?PR().sprintLesson():null}catch(e){return null}}
function problemTopics(){
  const out={};
  Object.keys(GRAMMAR).forEach(k=>{const s=S.topicStats[k];if(s&&s.t>=3&&s.c/s.t<0.7)out[k]={k,why:`${pct(s.c,s.t)}% correct`,score:s.c/s.t}});
  const mc={};S.mistakes.forEach(m=>{if(GRAMMAR[m.topic])mc[m.topic]=(mc[m.topic]||0)+m.count});
  Object.entries(mc).forEach(([k,n])=>{if(n>=2){out[k]=out[k]||{k,why:'',score:0.69};out[k].why=(out[k].why?out[k].why+' · ':'')+`${n} mistakes in the bank`}});
  const lp=lastPlacement();if(lp&&lp.weak)lp.weak.forEach(w=>{const k=PL_GKEY[w];if(k&&GRAMMAR[k]&&!out[k])out[k]={k,why:'weak in the placement test',score:0.75}});
  return Object.values(out).sort((a,b)=>a.score-b.score).slice(0,6)}

/* ---------- 2. Map of topics ---------- */
function vMap(){
  const lv=latestLevel(),lp=lastPlacement(),cur=curLesson(),ns=PR()&&PR().nextStep?PR().nextStep():null,probs=problemTopics();
  const level=`<div class="card"><div class="muted small">My level</div>${lv?`<div class="kpi">${cefr(lv.overall)}</div><div class="small muted">${lp?`Book: English File ${esc(lp.book)}, from File ${lp.file}`:'Level from teacher reviews'}</div>`:`<div class="kpi">—</div><div class="small muted">Not tested yet.</div><a class="btn sm" style="margin-top:8px" href="#/placement">Take the placement test</a>`}
    <div class="small" style="margin-top:8px">Goal: <b>B1+</b> ${ru('Цель — уровень B1+ по грамматике, чтению и аудированию.')}</div></div>`;
  const here=`<div class="card"><div class="muted small">📍 You are here</div>${cur?`<div style="font-weight:700;margin:6px 0">${esc(cur.code)} · ${esc(cur.title)}</div><div class="small muted">${esc(cur.book?cur.book.title:'')} · ${esc(topicName(cur.grammar))}</div>
    <div class="row" style="margin-top:10px">${has('student','sprint')?`<a class="btn sm" href="#/sprint">Sprint on this lesson</a>`:''}<a class="btn sm ghost" href="#/grammar/${cur.grammar}">Rule</a></div>`:'<div class="small muted">Start with the placement test.</div>'}</div>`;
  const next=ns?`<div class="card"><div class="muted small">Next step</div><div style="font-weight:700;margin:6px 0">${esc(ns.label)}</div><div class="small muted">${esc(ns.hint||'')}</div><div style="margin-top:10px"><button class="btn sm" onclick="${ns.js}">Go →</button></div></div>`:'';
  const prob=`<div class="card" style="margin-bottom:16px"><div class="row between"><h2>⚠️ My problem topics</h2><a class="small" href="#/mistakes">Mistakes bank →</a></div>
    ${probs.length?probs.map(p=>`<div class="list-item"><div><b>${esc(topicName(p.k))}</b><div class="small muted">${esc(p.why)}</div></div><button class="btn sm" onclick="A.startTopic('${p.k}')">Practise</button></div>`).join(''):'<div class="empty">No problem topics yet — they appear after a few exercises.</div>'}</div>`;
  const books=S.course.map(b=>{const ls=b.files.flatMap(f=>f.lessons);const done=ls.filter(l=>['done','great'].includes(lessonStatus(l.id))).length;
    return `<div class="card" style="margin-bottom:16px"><div class="row between"><h2>${esc(b.title)} <span class="badge acc">${esc(b.cefr)}</span></h2><span class="small muted">${done}/${ls.length} lessons</span></div>
    <div class="bar" style="margin:6px 0 12px"><i style="width:${ls.length?done/ls.length*100:0}%"></i></div>
    <div class="files">${b.files.map(f=>`<div><b>File ${f.n}</b> <span class="muted small">${esc(f.title)}</span>${f.lessons.map(l=>{const a=topicAcc(l.grammar);const isCur=cur&&cur.id===l.id;
      return `<a class="lesson" href="#/lesson/${l.id}" style="${isCur?'border-color:var(--accent);background:var(--accent-soft)':''}"><span class="st ${lessonStatus(l.id)}"></span><b>${esc(l.code)}</b> <span style="flex:1">${esc(l.title)}</span>${isCur?'📍':''}${a!=null?`<span class="small" style="color:${a<0.7?'var(--bad)':'var(--ok)'}">${Math.round(a*100)}%</span>`:''}</a>`}).join('')}</div>`).join('')}</div></div>`}).join('');
  return `<div class="page-head"><h1>Map of topics 🗺️</h1><p class="muted">Your level, every topic you need to learn, where you are now and what needs work. ${ru('Карта: уровень, все темы, где вы сейчас и проблемные темы. 📍 — текущий урок, цифры — точность по теме.')}</p>
    <div class="row small muted"><span class="st"></span>not started <span class="st prog"></span>in progress <span class="st done"></span>completed <span class="st great"></span>≥80%</div></div>
    <div class="grid g3" style="margin-bottom:16px">${level}${here}${next}</div>${prob}${books}`}

/* ---------- 3. Self-study ---------- */
function vSelf(){
  const accs=Object.keys(GRAMMAR).map(topicAcc).filter(a=>a!=null);const gAcc=accs.length?Math.round(accs.reduce((a,b)=>a+b,0)/accs.length*100):null;
  const due=dueCards().length,learned=S.vocab.filter(c=>c.reps>=2).length;
  const sp=S.subs.filter(s=>s.type==='speaking'),wr=S.subs.filter(s=>s.type==='writing');
  const card=(href,ico,title,stat,desc,cta)=>`<a class="card" href="#${href}" style="text-decoration:none;color:var(--text)"><div class="row between"><span style="font-size:26px">${ico}</span><span class="badge">${stat}</span></div><h3 style="margin-top:8px">${title}</h3><div class="small muted">${desc}</div><div class="small" style="margin-top:8px;color:var(--accent);font-weight:600">${cta} →</div></a>`;
  return `<div class="page-head"><h1>Self-study 🎒</h1><p class="muted">Everything you practise on your own. Topics come from your map. ${ru('Самостоятельная работа по всем навыкам. Темы берутся из карты. Домашка от учителя — в разделе Homework.')}</p></div>
  ${has('student','today')?`<div class="card row between" style="margin-bottom:16px"><div><b>⚡ Not sure where to start?</b><div class="small muted">Today's 15-minute plan picks the right exercises for you.</div></div><a class="btn" href="#/today">Open Today</a></div>`:''}
  <div class="grid g3">
   ${card('/grammar','📐','Grammar',gAcc==null?Object.keys(GRAMMAR).length+' topics':gAcc+'% avg','Rules with examples and exercises with instant feedback.','Practise grammar')}
   ${card('/vocabulary','🃏','Vocabulary',due+' due today','Flashcards with spaced repetition · '+learned+' words learned.','Review words')}
   ${card('/reading','📖','Reading',Object.keys(PASSAGES).length+' texts','Click any word for a translation and add it to your cards.','Read')}
   ${card('/listening','🎧','Listening',Object.keys(AUDIO).length+' recordings','Recordings with questions, plus dictation.','Listen')}
   ${card('/pronunciation','👄','Pronunciation','3 trainers','Minimal pairs, word stress, shadowing.','Train')}
   ${card('/speaking','🎙️','Speaking',sp.length+' recordings','Record an answer; your teacher listens and comments.','Speak')}
   ${card('/writing','✍️','Writing',wr.length+' texts','Write, auto-check, send to your teacher.','Write')}
   ${card('/tests','📝','Tests',testsList().length+' tests','Timed tests — answers at the end.','Take a test')}
   ${card('/mistakes','🔁','Mistakes bank',S.mistakes.length+' to fix','Every wrong answer comes back until you fix it.','Fix mistakes')}
  </div>`}

/* ---------- 4. Homework history ---------- */
function vHistory(){
  const T=S.role==='teacher'?'/t':'';const tab=UI.histTab||'all';
  const all=S.homework.slice().sort((a,b)=>new Date(b.created)-new Date(a.created));
  const fin=all.filter(h=>['submitted','reviewed'].includes(hwStatus(h)));
  const onTime=fin.filter(h=>h.submittedAt&&new Date(h.submittedAt)<=new Date(h.due)).length;
  const xp=all.reduce((s,h)=>s+(h.xp||0),0);const retells=S.subs.filter(s=>s.taskId==='retell').length;
  const list=tab==='all'?all:tab==='open'?all.filter(h=>['active','overdue'].includes(hwStatus(h))):fin;
  const tiers=h=>{const c={easy:0,medium:0,boss:0};h.items.forEach(it=>c[hwTier(it)]++);return Object.entries(c).filter(([,n])=>n).map(([k,n])=>`${TIERS[k].icon}${n}`).join(' ')};
  return `<div class="page-head"><h1>Homework history 🗂️</h1><p class="muted">Every homework is kept here with its result and XP. ${ru('Вся история домашних заданий: сроки, выполнение, полученный опыт.')}</p></div>
  <div class="grid g4" style="margin-bottom:16px">
   <div class="card"><div class="muted small">Assignments</div><div class="kpi">${all.length}</div></div>
   <div class="card"><div class="muted small">Done on time</div><div class="kpi">${fin.length?pct(onTime,fin.length)+'%':'—'}</div><div class="small muted">${onTime}/${fin.length}</div></div>
   <div class="card"><div class="muted small">XP from homework</div><div class="kpi">${xp}</div></div>
   <div class="card"><div class="muted small">Retellings</div><div class="kpi">${retells}</div></div></div>
  <div class="tabs">${[['all','All'],['open','Open'],['done','Done']].map(t=>`<button class="chip ${tab===t[0]?'on':''}" onclick="UI.histTab='${t[0]}';render()">${t[1]}</button>`).join('')}</div>
  <div class="card">${list.length?`<div class="tbl"><table><tr><th>Homework</th><th>Due</th><th>Done</th><th>Difficulty</th><th>XP</th><th>Status</th></tr>${list.map(h=>`<tr><td><a href="#${T}/homework/${h.id}">${esc(h.title)}</a></td><td class="small">${fmtD(h.due)}</td><td>${h.done.filter(Boolean).length}/${h.items.length}</td><td class="small">${tiers(h)}</td><td><b>${h.xp||0}</b><span class="small muted"> / ${hwXpTotal(h)}</span></td><td>${hwBadge(h)}</td></tr>`).join('')}</table></div>`:'<div class="empty">Nothing here yet.</div>'}</div>
  <p class="small muted" style="margin-top:10px">Difficulty: 🟢 easy (${TIERS.easy.xp} XP) · 🟡 medium (${TIERS.medium.xp} XP) · ⚔️ boss level (${TIERS.boss.xp} XP). Set automatically from the task category and its level; +20% if done on time.</p>`}

SV.map=vMap;SV.self=vSelf;SV.history=vHistory;TV.history=vHistory;
try{render()}catch(e){console.error(e)}
})();
