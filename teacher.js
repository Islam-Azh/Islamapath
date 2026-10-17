/* ============================================================
   teacher.js — one site for Ainura and Islam (METHODIKA v2.2 §2, task D52)
     • the same menu, addresses, pages and numbers for both roles; only action buttons differ
     • the teacher cannot start lessons and never writes the student's progress (see D51)
     • Home: "Waiting for review" + "Student's week" (teacher) / "My week" (student) + "About me: site / teacher"
     • one record page /review/:id for both: teacher reviews with timed comments and mistake tags, student sees "Review"
     • set homework in 2 taps: Home → "＋ Set homework" → "Set"
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('teacher.js: main app not found');return}
const P=()=>S.program||(S.program={});
const isT=()=>S&&S.role==='teacher',isS=()=>S&&S.role==='student';
const stu=()=>S.users.student.name,tea=()=>S.users.teacher.name;
const pct=(c,t)=>t?Math.round(c/t*100):0;
const T=()=>window.TS_TRAINER,PG=()=>window.TS_PROGRESS,SP=()=>window.TS_SPEAK,LV=()=>window.TS_LEVELS;
const SK6=[['words','🃏','Words','vocab'],['grammar','📐','Grammar','grammar'],['reading','📖','Reading','reading'],['listening','🎧','Listening','listening'],['speaking','🎙️','Speaking','speaking'],['writing','✍️','Writing','writing']];
const deny=()=>{toast(`This is ${stu()}'s lesson — only he can start it.`);return false};

/* ---------- 1. the teacher never starts lessons ---------- */
const _startRun=startRun;startRun=function(o,r){if(isT())return deny();return _startRun(o,r)};
function guardModules(){
  if(window.TS_WORDS&&!TS_WORDS._g){TS_WORDS._g=1;const f=TS_WORDS.start;TS_WORDS.start=function(){if(isT())return deny();return f.apply(this,arguments)}}
  if(window.TS_SPEAK&&!TS_SPEAK._g){TS_SPEAK._g=1;const f=TS_SPEAK.start;TS_SPEAK.start=function(){if(isT())return deny();return f.apply(this,arguments)}}
  if(window.TS_LEVELS&&!TS_LEVELS._g){TS_LEVELS._g=1;const f=TS_LEVELS.bossStart;TS_LEVELS.bossStart=function(){if(isT())return deny();return f.apply(this,arguments)}}}
guardModules();

/* ---------- 2. minutes per skill (for the week card) ---------- */
function ctxSkill(){if(UI.sk)return 'speaking';if(UI.wq)return 'vocab';if(UI.boss||UI.write)return 'writing';if(UI.sounds||UI.mp)return 'listening';
  if(typeof RUN!=='undefined'&&RUN){if(RUN.kind==='reading')return 'reading';if(RUN.kind==='listening')return 'listening';const q=RUN.q;if(q&&q.skill==='vocabulary')return 'vocab';return 'grammar'}return null}
const _lm=logMinutes;logMinutes=function(m){_lm(m);try{if(!isS()||!(m>0))return;const sk=ctxSkill();if(!sk)return;const p=P();p.skillMin=p.skillMin||{};const k=dkey();const d=p.skillMin[k]=p.skillMin[k]||{};d[sk]=Math.round(((d[sk]||0)+m)*10)/10;
  const ks=Object.keys(p.skillMin).sort();while(ks.length>60)delete p.skillMin[ks.shift()]}catch(e){}};

/* ---------- 3. data for the week card and "About me" ---------- */
const reviewed=()=>S.subs.filter(s=>s.review&&s.review.at).sort((a,b)=>a.review.at.localeCompare(b.review.at));
const waiting=()=>S.subs.filter(s=>s.status==='submitted');
function teacherTags(days){const from=Date.now()-days*864e5;const cnt={};reviewed().filter(s=>new Date(s.review.at).getTime()>=from).forEach(s=>(s.review.comments||[]).forEach(c=>{if(c.tag)cnt[c.tag]=(cnt[c.tag]||0)+1}));return cnt}
function topTopics(n){const cnt={};S.mistakes.forEach(m=>{if(m.topic)cnt[m.topic]=(cnt[m.topic]||0)+(m.count||1)});const tt=teacherTags(14);Object.entries(tt).forEach(([k,v])=>cnt[k]=(cnt[k]||0)+v);
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>({k,v,name:tagName(k),grammar:!!GRAMMAR[k],fromTeacher:tt[k]||0}))}
function ranks(){const out=[];Object.keys(GRAMMAR).forEach(k=>{const r=PG()?PG().acc30(k):null;if(r&&r.t>=5)out.push({k,a:r.a})});return out.sort((a,b)=>b.a-a.a)}
function hardWords(n){return S.vocab.map(c=>({c,n:(c.hist||[]).filter(h=>h[1]===0).length})).filter(x=>x.n>=3).sort((a,b)=>b.n-a.n).slice(0,n).map(x=>x.c)}
function weekData(){const days=[];for(let i=6;i>=0;i--){const d=addDays(new Date(),-i),k=dkey(d);const ss=(P().sess||{})[k]||[];
    const modes=[...new Set(ss.filter(s=>s.blocks.some(b=>b.status==='done')).map(s=>s.mode))];days.push({k,d,min:Math.round(S.activity[k]||0),modes})}
  const sm={};for(let i=0;i<7;i++){const x=(P().skillMin||{})[dkey(addDays(new Date(),-i))]||{};Object.entries(x).forEach(([k,v])=>sm[k]=(sm[k]||0)+v)}
  const from=addDays(new Date(),-6);from.setHours(0,0,0,0);const inW=d=>d&&new Date(d)>=from;
  const hws=S.homework.filter(h=>inW(h.created)||inW(h.due)||inW(h.submittedAt));
  const sent=S.subs.filter(s=>inW(s.date)&&['submitted','reviewed'].includes(s.status)).length;
  const lastRetell=S.subs.filter(s=>s.type==='speaking'&&(s.kind==='retell'||s.taskId==='retell')).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const r=ranks();return {days,sm,hws,sent,top:topTopics(5),weak:r.slice(-2).reverse(),lastRetell,hard:hardWords(3),active:days.filter(d=>d.min>0).length}}
const MODE_ICO={minute:'⚡',micro:'⚡',focus:'🟢',short:'🟢',training:'🟡',standard:'🟡',full:'🔴'};
function weekCard(){const w=weekData();const maxM=Math.max(5,...SK6.map(s=>w.sm[s[3]]||0));const title=isT()?`${stu()}'s week`:'My week';
  const rt=T()?T().reportText(T().weekData()):'';
  return `<div class="card week-card"><div class="row between"><h2>📊 ${esc(title)}</h2><button class="btn sm ghost" onclick="A.tCopyReport()">📋 Copy for WhatsApp</button></div><div class="ru-line">${isT()?'Неделя ученика: дни, навыки, ошибки, что обсудить на уроке.':'Моя неделя: дни, навыки, ошибки.'}</div>
   <div class="week-days">${w.days.map(d=>`<div class="wd ${d.min?'on':''}"><b>${d.d.toLocaleDateString('en-GB',{weekday:'short'})}</b><span>${d.min?d.min+'′':'—'}</span><span class="wd-m">${d.modes.map(m=>MODE_ICO[m]||'').join('')}</span></div>`).join('')}</div>
   <div class="small muted" style="margin:6px 0">Active days: <b>${w.active}/7</b> · homework: <b>${w.hws.filter(h=>['submitted','reviewed'].includes(hwStatus(h))).length}/${w.hws.length}</b> done · recordings and texts sent: <b>${w.sent}</b></div>
   <div class="sk-bars">${SK6.map(([k,i,n,x])=>`<div class="skb"><span>${i} ${n}</span><div class="bar"><i class="bg-${k}" style="width:${Math.round((w.sm[x]||0)/maxM*100)}%"></i></div><b>${Math.round(w.sm[x]||0)}′</b></div>`).join('')}</div>
   <div class="grid g2" style="margin-top:12px"><div><h3>❌ Top 5 topics with mistakes</h3>${w.top.length?w.top.map((t,i)=>`<div class="list-item small"><div>${i+1}. ${t.grammar?`<a href="#/grammar/${esc(t.k)}">${esc(t.name)}</a>`:esc(t.name)}${t.fromTeacher?` <span class="badge tag">🏷 ${t.fromTeacher}</span>`:''}</div><b>${t.v}</b></div>`).join(''):'<div class="small muted">No mistakes yet.</div>'}</div>
    <div><h3>💬 What to discuss in class</h3><div class="small">• Weak topics: ${w.weak.length?w.weak.map(x=>`<a href="#/grammar/${esc(x.k)}">${esc(topicName(x.k))}</a> (${Math.round(x.a*100)}%)`).join(', '):'—'}</div>
     <div class="small">• Last retell: ${w.lastRetell?`<a href="#/review/${esc(w.lastRetell.id)}">${esc(String(w.lastRetell.prompt||'').slice(0,50))}</a> · ${fmtD(w.lastRetell.date)}`:'—'}</div>
     <div class="small">• Words he often doesn't know: ${w.hard.length?w.hard.map(c=>`<b>${esc(c.word)}</b>`).join(', '):'—'}</div></div></div>
   <textarea id="report-text" style="position:absolute;left:-9999px" aria-hidden="true">${esc(rt)}</textarea></div>`}
function aboutCard(){const lv=latestLevel();const r=ranks();const strong=r.slice(0,3),weak=r.slice(-3).reverse().filter(x=>!strong.includes(x));
  const learned=S.vocab.filter(c=>c.learned).length;const sp=S.subs.filter(s=>s.type==='speaking'&&s.wpm&&Date.now()-new Date(s.date)<30*864e5);const wpm=sp.length?Math.round(sp.reduce((a,s)=>a+s.wpm,0)/sp.length):null;
  const last=reviewed().slice(-1)[0];const tags=Object.entries(teacherTags(60)).sort((a,b)=>b[1]-a[1]).slice(0,3);const none='<span class="muted">not yet</span>';
  return `<div class="card about-card"><h2>🙋 ${isT()?'About '+esc(stu()):'About me'}</h2><div class="grid g2">
   <div class="about-col"><h3>🤖 What the site thinks</h3><div class="small">Level: <b>${lv?cefr(lv.overall):'not tested yet'}</b></div>
    <div class="small">Strong: ${strong.length?strong.map(x=>esc(topicName(x.k))).join(', '):none}</div><div class="small">Weak: ${weak.length?weak.map(x=>esc(topicName(x.k))).join(', '):none}</div>
    <div class="small">Words learned: <b>${learned}</b></div><div class="small">Speaking: <b>${wpm==null?'—':wpm+' words/min'}</b></div></div>
   <div class="about-col"><h3>👩‍🏫 What ${esc(tea())} thinks</h3>${last?`<div class="small">“${esc((last.review.general||'').slice(0,160))||'—'}”</div><div class="small">Level from her last review: <b>${esc(last.review.cefr||'—')}</b></div>
    <div class="small">Frequent tags: ${tags.length?tags.map(([k,v])=>`<span class="badge tag">${esc(tagName(k))} · ${v}</span>`).join(' '):none}</div><div class="small muted">Reviewed ${fmtD(last.review.at)}</div>`:`<div class="small">${none}</div>`}</div></div></div>`}
function waitCard(){const w=waiting();return `<div class="card wait-card"><div class="row between"><h2>⏳ Waiting for review: ${w.length}</h2>${w.length?`<a class="btn" href="#/review/${esc(w[0].id)}">Review the first</a>`:''}</div>
  ${w.slice(0,5).map(s=>`<div class="list-item"><div>${s.type==='writing'?'✍️':'🎙️'} ${esc(String(s.prompt||'').slice(0,70))}<div class="small muted">${fmtDT(s.date)}${s.secs?' · '+mmss(s.secs):''}</div></div><a class="btn sm" href="#/review/${esc(s.id)}">Review</a></div>`).join('')||'<div class="small muted">Nothing to review — well done!</div>'}</div>`}

/* ---------- 4. Home for both ---------- */
const _today=SV.today;
SV.today=function(){guardModules();const h=_today.apply(this,arguments);
  if(isT()){const top=`<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap"><a class="btn lg" href="#/assign">＋ Set homework</a><a class="btn lg ghost" href="#/review">⏳ Review (${waiting().length})</a></div>${waitCard()}${weekCard()}`;
    const i=h.indexOf('<div class="mode-grid');return (i<0?top+h:h.slice(0,i)+top+h.slice(i))+aboutCard()}
  return h+aboutCard()+weekCard()};

/* ---------- 5. Speaking & writing lists, record page ---------- */
const KIND_TABS=[['retell','🔁 Retells'],['question','🙋 Answers'],['interview','💼 Interview'],['diary','📔 Diary']];
const kindOf=s=>s.kind||(s.taskId==='retell'||s.hwId?'retell':'question');
function statusBadge(s){return s.status==='reviewed'?'<span class="badge ok">✅ reviewed</span>':s.status==='submitted'?'<span class="badge warn">⏳ waiting</span>':'<span class="badge">saved</span>'}
function recList(type){const tab=UI.recTab||'all';const list=S.subs.filter(s=>s.type===type&&(type!=='speaking'||tab==='all'||kindOf(s)===tab)).slice().reverse();
  const tabs=type==='speaking'?`<div class="tabs"><button class="chip ${tab==='all'?'on':''}" onclick="UI.recTab='all';render()">All</button>${KIND_TABS.map(([k,l])=>`<button class="chip ${tab===k?'on':''}" onclick="UI.recTab='${k}';render()">${l} (${S.subs.filter(s=>s.type==='speaking'&&kindOf(s)===k).length})</button>`).join('')}</div>`:'';
  return `<div class="card"><div class="row between"><h2>${type==='speaking'?(isT()?'Recordings':'My recordings'):(isT()?'Texts':'My texts')}</h2>${isT()?`<span class="badge warn">⏳ ${S.subs.filter(s=>s.type===type&&s.status==='submitted').length} waiting</span>`:''}</div>${tabs}
   ${list.length?list.slice(0,40).map(s=>`<div class="list-item"><div><div>${esc(String(s.prompt||'').slice(0,80))}</div><div class="small muted">${fmtDT(s.date)}${s.secs?' · '+mmss(s.secs):''}${s.words!=null?' · '+s.words+' words':''}${s.type==='writing'&&s.text?' · '+wc(s.text)+' words':''}</div></div>
     <div class="row">${s.type==='speaking'&&s.audioKey?`<button class="btn sm ghost lazy-audio" data-key="${esc(s.audioKey)}">▶</button>`:''}${statusBadge(s)}<a class="btn sm ${isT()&&s.status==='submitted'?'':'ghost'}" href="#/review/${esc(s.id)}">${isT()?(s.status==='reviewed'?'Open':'Review'):(s.review?'See review':'Open')}</a></div></div>`).join(''):'<p class="muted">Nothing yet.</p>'}</div>`}
const _speak=SV.speak;
SV.speak=function(sub){guardModules();if(sub==='do')return _speak.apply(this,arguments);let h=_speak.apply(this,arguments);
  const a=h.indexOf('<div class="card"><h2>My recordings</h2>');if(a>=0){const b=h.indexOf('<div class="card"><h2>📔 Speech diary</h2>');if(b>a)h=h.slice(0,a)+recList('speaking')+h.slice(b)}
  if(isT())h=h.replace('<div class="mode-grid">','<div class="mode-grid readonly">')+`<div class="small muted center">Tasks are started by ${esc(stu())}. You review recordings: “Review”.</div>`;
  const st=SP()&&SP().ivStats?SP().ivStats():null;if(st)h=h.replace('</h1>',`</h1><div class="small muted">Interview: answered ${st.answered} of ${st.total}, open now ${st.avail}</div>`);
  return h};
const _writing=SV.writing;
function vWritingT(){return `<div class="page-head"><h1>Writing ✍️</h1><div class="ru-line">Тексты ${esc(stu())}: Босс, письмо по ситуации, ДЗ.</div></div>${recList('writing')}`}
function srcPanel(s){if(s.type!=='speaking')return '';const d=SP()?SP().data():{tasks:[],interview:[]};
  if(s.items){return `<div class="card stack"><h2>💼 Interview · ${s.items.length} answers</h2>${s.items.map((x,i)=>{const q=d.interview.find(q=>q.id===x.qid)||{};
      const prev=S.subs.filter(o=>o!==s&&o.items&&o.date<s.date).flatMap(o=>o.items.filter(y=>y.qid===x.qid).map(y=>Object.assign({date:o.date},y))).slice(-1)[0];
      return `<div class="iv-ans"><b>${i+1}. ${esc(x.q)}</b>${x.audioKey?`<button class="btn sm ghost lazy-audio" data-key="${esc(x.audioKey)}">▶ Play</button>`:'<span class="small muted">audio deleted after 90 days</span>'}<div class="small">${esc(x.transcript||'(no transcript)')}</div>
        ${prev?`<div class="small muted">Before (${fmtD(prev.date)}): ${prev.audioKey?`<button class="btn sm plain lazy-audio" data-key="${esc(prev.audioKey)}">▶ was</button>`:''} ${esc((prev.transcript||'').slice(0,120))}</div>`:''}
        ${q.sample?`<details><summary class="small">Sample answer</summary><div class="small">${esc(q.sample)}</div></details>`:''}</div>`}).join('')}</div>`}
  const k=kindOf(s);const t=d.tasks.find(x=>x.id===s.taskId)||(SP()?SP().retellSources().find(x=>x.id===s.taskId):null);
  if(k==='retell'){const hw=s.hwId&&S.homework.find(h=>h.id===s.hwId);const txt=t&&t.text||hw&&hw.items[s.idx]&&hw.items[s.idx].text||'';
    return `<div class="card stack"><h2>🔁 Text to retell</h2>${t&&t.title?`<b>${esc(t.title)}</b>`:''}<div class="small">${txt?esc(txt):'<span class="muted">Text from the lesson (book).</span>'}</div></div>`}
  if(t)return `<div class="card stack"><h2>🙋 Question</h2><b>${esc(t.q||'')}</b>${t.ru?`<div class="ru-line">${esc(t.ru)}</div>`:''}${t.sample?`<details open><summary class="small">Sample answer</summary><div class="small">${esc(t.sample)}</div></details>`:''}</div>`;
  return ''}
function attemptsPanel(s){if(s.type!=='speaking'||s.items)return '';const same=S.subs.filter(o=>o!==s&&o.type==='speaking'&&o.taskId===s.taskId).sort((a,b)=>a.date.localeCompare(b.date));if(!same.length)return '';
  return `<div class="card stack"><h2>🔁 Other tries of this task</h2>${same.map(o=>`<div class="list-item small"><div>${fmtDT(o.date)} · ${o.words||0} words${o.review?' · '+esc(o.review.cefr):''}</div><a class="btn sm ghost" href="#/review/${esc(o.id)}">Open</a></div>`).join('')}</div>`}
function vRecord(id){const s=S.subs.find(x=>x.id===id);if(!s)return '<div class="card empty">Not found.</div>';
  let h=isT()?TV.review(id):vSubmission(id);
  if(isS()){h=h.replace(/<h1>(Writing|Speaking) · /,'<h1>Review · $1 · ').replace("Teacher's feedback",esc(tea())+"'s review");
    const again=s.type==='speaking'&&!s.items&&SP()?`<button class="btn" onclick="TS_SPEAK.start('${kindOf(s)==='diary'?'diary':kindOf(s)}',{taskId:${jsq(s.taskId)},back:'/review/${esc(s.id)}'})">🎙️ Record again</button>`:'';
    h=h.replace('<div class="grid g2">',`<div class="row" style="margin-bottom:12px">${again}${s.status==='saved'&&isS()?`<button class="btn ghost" onclick="TS_TEACHER.send('${esc(s.id)}')">Send to ${esc(tea())}</button>`:''}</div><div class="grid g2">`)}
  return h+`<div class="grid g2" style="margin-top:16px">${srcPanel(s)}${attemptsPanel(s)}</div>`}
const TOOLS=[['tests','📝','Tests & questions'],['course','🗺️','Course editor'],['notes','🗒️','Private notes'],['materials','📦','Materials'],['analytics','📈','Analytics (detailed)']];
function vTools(sub,...a){if(sub&&sub!=='materials'&&TV[sub])return TV[sub](...a);if(sub==='materials'&&TV.materials)return TV.materials();
  return `<div class="page-head"><h1>Teacher tools 🧰</h1><div class="ru-line">Инструменты только для учителя.</div></div><div class="grid g3">${TOOLS.map(([k,i,n])=>`<a class="card tile-link" href="#/tools/${k}"><span style="font-size:30px">${i}</span><h3>${n}</h3></a>`).join('')}</div>`}

/* ---------- 6. set homework in 2 taps ---------- */
function curLesson(){return T()?findLesson('pi-'+T().unitCode()):null}
function assignDefaults(){const l=curLesson();const nl=nextLesson();const due=nl?dkey(nl)+'T'+String(nl.getHours()).padStart(2,'0')+':'+String(nl.getMinutes()).padStart(2,'0'):dkey(addDays(new Date(),7))+'T09:00';
  return {lesson:l?l.id:'',due}}
function bookLine(code){const cm=(window.COURSE_MAP||{})[code]||{};const b=cm.books||{};const parts=[];
  const red=b.red||b.gin||b.grammarInUse||b['English Grammar in Use'],blue=b.blue||b.egu||b.essential||b['Essential Grammar in Use'];
  const fmt=v=>Array.isArray(v)?v.join(', '):v&&typeof v==='object'?(v.units||[]).join(', '):String(v||'');
  if(red)parts.push('Grammar in Use, units '+fmt(red));if(blue)parts.push('Essential Grammar in Use, units '+fmt(blue));return parts.join(' · ')}
function vAssign(){if(!isT())return '<div class="card">Only the teacher sets homework here. You can add homework from WhatsApp on the Homework page.</div>';
  const d=assignDefaults();const ls=(S.course.find(b=>b.id==='pi')||S.course[0]).files.flatMap(f=>f.lessons);const l=findLesson(UI.asgLesson||d.lesson)||ls[0];const code=String(l.code).toUpperCase();
  const g=GRAMMAR[l.grammar];const nx=g&&LV()?LV().next(l.grammar):{lvl:1};const qs=(SP()?SP().data().tasks:[]).filter(t=>t.kind==='question'&&t.unit===code);const book=bookLine(code);
  return `<div class="page-head"><a class="small" href="#/today">← Home</a><h1>＋ Set homework</h1><div class="ru-line">Всё уже подставлено: урок ${esc(code)}, срок — следующий урок. Отметьте пункты и нажмите «Set».</div></div>
  <div class="card stack assign">
   <div class="grid g2"><label class="f">Lesson<select id="as-lesson" onchange="UI.asgLesson=this.value;render()">${ls.map(x=>`<option value="${x.id}" ${x.id===l.id?'selected':''}>${esc(x.code)} · ${esc(x.title)}</option>`).join('')}</select></label>
    <label class="f">Deadline<input type="datetime-local" id="as-due" value="${d.due}"></label></div>
   <label class="as-row"><input type="checkbox" id="as-tb" checked> 📕 Student's Book / Workbook <input type="text" id="as-tbt" placeholder="p. / ex." value="Workbook ${esc(code)}"></label>
   <label class="as-row"><input type="checkbox" id="as-book" ${book?'':'disabled'}> 📗 ${book?esc(book):'Grammar in Use — units appear when the course map has them'}</label>
   <label class="as-row"><input type="checkbox" id="as-g" ${g?'checked':'disabled'}> 📐 Site topic: <b>${esc(g?g.title:'—')}</b>, level <select id="as-gl">${[1,2,3].map(n=>`<option ${n===(nx.lvl||1)?'selected':''}>${n}</option>`).join('')}</select></label>
   <label class="as-row"><input type="checkbox" id="as-rt"> 🔁 Retell <input type="text" id="as-rtt" placeholder="text to retell (empty = from the lesson)"></label>
   <label class="as-row"><input type="checkbox" id="as-sq" ${qs.length?'':'disabled'}> 🙋 Speaking question <select id="as-sqq">${qs.map(q=>`<option value="${esc(q.id)}">${esc(q.q.slice(0,70))}</option>`).join('')||'<option value="">—</option>'}</select></label>
   <label class="as-row"><input type="checkbox" id="as-wr"> ✍️ Writing <input type="text" id="as-wrt" value="${esc(g&&g.boss&&g.boss.situation||'Write 60–100 words about your working week.')}"></label>
   <button class="btn lg block" onclick="TS_TEACHER.assign()">Set</button><div class="small muted">${esc(stu())} will see it on his Home page. WhatsApp still works — this form is optional.</div></div>`}
function doAssign(){const l=findLesson($('#as-lesson').value);const code=String(l.code).toUpperCase();const due=$('#as-due').value;if(!due)return toast('Set a deadline');const items=[];
  const on=id=>{const e=$('#'+id);return e&&e.checked&&!e.disabled};
  if(on('as-tb'))items.push({type:'textbook',ref:'',label:$('#as-tbt').value||('Workbook '+code)});
  if(on('as-book'))items.push({type:'textbook',ref:'book',label:bookLine(code)+' — exercises, check with the key'});
  if(on('as-g')){const lvl=+$('#as-gl').value;items.push({type:'glevel',ref:l.grammar,lvl,label:`${topicName(l.grammar)} · level ${lvl} (site)`})}
  if(on('as-rt')){const t=$('#as-rtt').value.trim();items.push({type:'retell',ref:'',text:t,label:t?'Retell: '+t.slice(0,60)+(t.length>60?'…':''):'Retell the text from lesson '+code})}
  if(on('as-sq')){const id=$('#as-sqq').value;const q=(SP().data().tasks||[]).find(x=>x.id===id);if(q)items.push({type:'speakq',ref:id,label:'Answer: '+q.q})}
  if(on('as-wr'))items.push({type:'writeq',ref:'',label:'Write 60–100 words: '+$('#as-wrt').value});
  if(!items.length)return toast('Tick at least one item');
  const h={id:'hw-'+uid(),title:`Lesson ${code} · homework`,instructions:items.map(i=>'• '+i.label).join('\n'),due:new Date(due).toISOString(),est:30,priority:'normal',lesson:l.id,items,done:items.map(()=>false),status:'active',created:new Date().toISOString(),messages:[],feedback:'',source:'site',unit:code};
  S.homework.push(h);notify('student',`${tea()} set homework: lesson ${code}`,'/homework/'+h.id);save();if(Cloud.flushNow)Cloud.flushNow();toast('Homework set ✓');UI.asgLesson=null;go('/today')}
/* student side of the new homework item types */
const _hwStart=A.hwStart;A.hwStart=(id,i)=>{const h=S.homework.find(x=>x.id===id);const it=h&&h.items[i];if(!it)return;const ref={id,idx:i};
  if(it.type==='glevel'&&LV()){CTX.hw=ref;return LV().startLevel(it.ref,it.lvl||1,{force:true,hw:ref,back:'/homework/'+id})}
  if(it.type==='speakq'&&SP())return SP().start('question',{taskId:it.ref,back:'/homework/'+id,onDone:res=>{if(res&&res.ok)completeHwItem(ref);save();go('/homework/'+id)}});
  if(it.type==='writeq'){UI.hwWrite=ref;return go('/hwwrite')}
  if(it.type==='retell'&&SP())return A.hwRecStart(id,i);
  return _hwStart(id,i)};
function vHwWrite(){const r=UI.hwWrite;const h=r&&S.homework.find(x=>x.id===r.id);if(!h)return '<div class="card">Open the homework first.</div>';const it=h.items[r.idx];
  return `<div class="page-head"><a class="small" href="#/homework/${h.id}">← Homework</a><h1>✍️ ${esc(it.label)}</h1></div><div class="card stack"><textarea id="hw-wr" style="min-height:220px"></textarea><button class="btn lg" onclick="TS_TEACHER.hwWriteSend()">Send to ${esc(tea())}</button></div>`}
function hwWriteSend(){const r=UI.hwWrite;const h=S.homework.find(x=>x.id===r.id);const text=($('#hw-wr')||{}).value||'';if(wc(text)<30)return toast('Write a bit more (30+ words)');const id='w-'+uid();
  S.subs.push({id,type:'writing',taskId:'hw-'+h.id,prompt:h.items[r.idx].label,text,pre:[],status:'submitted',date:new Date().toISOString(),hwId:h.id,idx:r.idx});notify('teacher',`New text from ${stu()}`,'/review/'+id);completeHwItem(r);UI.hwWrite=null;save();go('/homework/'+h.id)}
function sendSub(id){const s=S.subs.find(x=>x.id===id);if(!s)return;s.status='submitted';notify('teacher',`${stu()} sent: ${s.prompt}`,'/review/'+s.id);save();toast('Sent to '+tea());render()}

/* teacher buttons on shared pages */
const _lesson=SV.lesson;SV.lesson=function(id){const h=_lesson.apply(this,arguments);if(!isT())return h;return h.replace('<div class="grid g2">',`<div class="row" style="margin-bottom:12px"><button class="btn" onclick="UI.asgLesson='${esc(id)}';go('/assign')">📚 Set this lesson as homework</button></div><div class="grid g2">`)};
const _grammar=SV.grammar;SV.grammar=function(t){const h=_grammar.apply(this,arguments);if(!isT()||!t||!GRAMMAR[t])return h;const l=(S.course.find(b=>b.id==='pi')||{files:[]}).files.flatMap(f=>f.lessons).find(x=>x.grammar===t);
  return h.replace('<div class="card theory">',`<div class="row" style="margin-bottom:12px"><button class="btn" onclick="UI.asgLesson='${l?l.id:''}';go('/assign')">📚 Set as homework</button></div><div class="card theory">`)};
const _words=SV.words;SV.words=function(){const h=_words.apply(this,arguments);if(UI.wq)return h;const hw=hardWords(12);
  return h+`<div class="card" style="margin-top:16px"><h2>😓 Hard words <span class="small muted">(“Don't know” 3+ times)</span></h2>${hw.length?hw.map(c=>`<span class="chip">${esc(c.word)} — ${esc(c.ru)}</span>`).join(' '):'<p class="muted">None yet.</p>'}</div>`};

/* ---------- 7. routes and the single menu ---------- */
SV.review=id=>id?vRecord(id):`<div class="page-head"><h1>My reviews</h1></div>${recList('speaking')}${recList('writing')}`;
SV.hwwrite=vHwWrite;
window.TEACHER_ROUTES={review:id=>id?vRecord(id):`<div class="page-head"><h1>Waiting for review ⏳</h1><div class="ru-line">Записи и тексты ${esc(stu())}.</div></div>${waitCard()}${recList('speaking')}${recList('writing')}`,
  homework:TV.homework,tools:vTools,assign:vAssign,writing:vWritingT,run:TV.run,today:SV.today};
Object.defineProperty(window.TEACHER_ROUTES,'today',{get(){return SV.today},enumerable:true});
const sharedNav=()=>{const w=waiting().length;const cnt=t=>{const n=S.subs.filter(s=>s.type===t&&s.status==='submitted').length;return isT()&&n?` · ${n}⏳`:''};
  const nav=[{h:'Learn'},['today','Home','🏠'],['map','Map','🗺️'],['speak','Speaking'+cnt('speaking'),'🎙️'],['writing','Writing'+cnt('writing'),'✍️'],['words','Words','🃏'],['grammar','Grammar','📐'],['homework','Homework','📚'],
    {h:'Progress'},['progress','Progress','📈'],['report','Weekly report','🧾'],['mistakes','Mistakes bank','🔁'],['achievements','Achievements','🏆'],
    {h:'More'},['checkpoints','Checkpoints','🎯'],['history','Homework history','🗂️'],['self','Self-study','🎒'],['settings','Settings','⚙️'],['about','About','ℹ️']];
  if(isT())nav.splice(nav.findIndex(n=>n[0]==='checkpoints'),0,['review','Waiting for review'+(w?' · '+w:''),'⏳'],['assign','Set homework','＋'],['tools','Teacher tools','🧰']);
  return nav.filter(n=>n.h||SV[n[0]]||(isT()&&window.TEACHER_ROUTES[n[0]]))};
Object.defineProperty(window,'NAV_OVERRIDE',{configurable:true,get(){return S&&S.role?{student:sharedNav(),teacher:sharedNav()}:null}});
const AL={vocabulary:'words',speaking:'speak',submission:'speak',session:'today',choose:'today',boss:'grammar',lesson:'map',course:'map',placement:'checkpoints','placement-result':'checkpoints',baseline:'checkpoints',month:'progress',hwwrite:'homework',run:'today',reading:'self',listening:'self',pronunciation:'self',tests:'checkpoints',sprint:'today',program:'map',materials:'tools'};
window.NAV_ALIAS={student:AL,teacher:Object.assign({},AL,{assign:'assign'})};
window.TS_TEACHER={assign:doAssign,send:sendSub,hwWriteSend,weekData,topTopics,teacherTags,hardWords,waiting};
try{render()}catch(e){console.error(e)}
})();
