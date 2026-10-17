/* ============================================================
   progress.js — map and progress from METHODIKA §7–§9, §14
     §7  road map: 12 Files = 12 islands, 3 lesson circles each (grey / red / yellow / green / star), 📍 you are here,
         "My strengths" and "To improve"; lesson card from data/course-map.json
     §8  checkpoints: placement once, then every 8–12 weeks; before/after tests; unit mini-test before the lesson;
         one onboarding screen at the first visit
     §9  "My month": cards with ↑↓ to last month, 6-month chart, month card on the 1st, speech diary reminder
     §14 attempts older than 90 days are folded into monthly statistics
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('progress.js: main app not found');return}
const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const T=()=>window.TS_TRAINER,LV=()=>window.TS_LEVELS;
const mk=d=>dkey(d).slice(0,7);
const pct=(c,t)=>t?Math.round(c/t*100):0;

/* ---------- §14 fold old attempts into monthly stats ---------- */
function fold(){const p=P();const k=dkey();if(p.foldDay===k)return;p.foldDay=k;const cut=Date.now()-90*864e5;const keep=[];let n=0;p.attStats=p.attStats||{};
  S.attempts.forEach(a=>{if(new Date(a.date).getTime()>=cut)return keep.push(a);const m=a.date.slice(0,7);const st=p.attStats[m]=p.attStats[m]||{c:0,t:0,runs:0,topics:{}};st.runs++;
    (a.answers||[]).forEach(x=>{st.t++;if(x.ok)st.c++;if(x.topic){const tp=st.topics[x.topic]=st.topics[x.topic]||{c:0,t:0};tp.t++;if(x.ok)tp.c++}});n++});
  if(n){S.attempts=keep;save()}}
setTimeout(()=>{try{if(isStudent())fold()}catch(e){console.error(e)}},3000);

/* ---------- accuracy helpers ---------- */
function acc30(topic){const from=Date.now()-30*864e5;let c=0,t=0;S.attempts.forEach(a=>{if(new Date(a.date).getTime()<from)return;(a.answers||[]).forEach(x=>{if(x.topic===topic){t++;if(x.ok)c++}})});
  if(t)return {a:c/t,t};const s=S.topicStats[topic];return s&&s.t?{a:s.c/s.t,t:s.t}:null}
/* D41: accuracy of THIS lesson — questions tagged with the lesson code (field "lessons") or runs started from the lesson */
const lessonsOfTopic=t=>{const b=S.course.find(x=>x.id==='pi')||S.course[0];return b?b.files.flatMap(f=>f.lessons).filter(l=>l.grammar===t):[]};
function lessonAcc(l){const code=String(l.code).toUpperCase();const g=GRAMMAR[l.grammar];const tagged=g&&g.qs.some(q=>Array.isArray(q.lessons));const shared=lessonsOfTopic(l.grammar).length>1;
  if(!tagged&&!shared)return acc30(l.grammar);
  const from=Date.now()-30*864e5;let c=0,t=0;
  S.attempts.forEach(a=>{if(new Date(a.date).getTime()<from)return;const own=a.lessonId===l.id||String(a.lessonCode||'').toUpperCase()===code;
    if(a.lessonCode&&!own)return;   /* contrast questions inside another lesson's practice do not colour this lesson */
    (a.answers||[]).forEach(x=>{const q=ALLQ[x.qid];const ql=q&&Array.isArray(q.lessons)?q.lessons.map(v=>String(v).toUpperCase()):null;
      if(ql?ql.includes(code):(own&&x.topic===l.grammar)){t++;if(x.ok)c++}})});
  return t?{a:c/t,t}:null}
function lessonColor(l){const r=lessonAcc(l);const boss=LV()&&GRAMMAR[l.grammar]&&LV().bossDone(l.grammar);
  if(!r)return {c:'grey',lbl:'not started'};if(r.a>=0.8)return boss?{c:'star',lbl:'mastered + boss'}:{c:'green',lbl:'mastered'};if(r.a>=0.6)return {c:'yellow',lbl:'in progress'};return {c:'red',lbl:'weak'}}
function topicRanks(){const out=[];Object.keys(GRAMMAR).forEach(k=>{if(GRAMMAR[k].track==='work')return;const r=acc30(k);if(r&&r.t>=5)out.push({k,a:r.a,t:r.t})});out.sort((a,b)=>b.a-a.a);return out}
const curCode=()=>T()?T().unitCode():'7B';

/* ---------- §7 road map ---------- */
function vMap(){const b=S.course.find(x=>x.id==='pi')||S.course[0];const ranks=topicRanks();const strong=ranks.slice(0,3),weak=ranks.slice(-3).reverse().filter(x=>x.a<0.85);
  const cur=curCode();const lv=latestLevel();
  const island=f=>`<div class="island"><div class="island-h"><b>File ${f.n}</b><span class="small muted">${esc(f.title)}</span></div><div class="dots">${f.lessons.map(l=>{const col=lessonColor(l);const here=String(l.code).toUpperCase()===cur;
     return `<a class="dot d-${col.c} ${here?'here':''}" href="#/lesson/${l.id}" title="${esc(l.code+' · '+l.title+' — '+col.lbl)}"><span>${col.c==='star'?'⭐':esc(l.code)}</span>${here?'<i class="pin">📍</i>':''}</a>`}).join('')}</div></div>`;
  const rk=(list,good)=>list.length?list.map(x=>`<div class="list-item"><div><b>${esc(topicName(x.k))}</b><div class="small muted">${Math.round(x.a*100)}% · ${x.t} answers</div></div><a class="btn sm ${good?'ghost':''}" href="#/grammar/${x.k}">${good?'Keep it':'Train'}</a></div>`).join(''):'<div class="small muted">Appears after a few exercises.</div>';
  return `<div class="page-head"><h1>Map 🗺️</h1><div class="muted">${esc(b?b.title:'')} · level ${lv?cefr(lv.overall):'—'} · <b>Goal: ${esc(goalText())}</b></div><div class="ru-line">Путь по учебнику: 12 Files, в каждом 3 урока. 📍 — вы здесь. Нажмите на кружок, чтобы открыть урок.</div>
    <div class="legend small"><span class="dot-s d-grey"></span>not started <span class="dot-s d-red"></span>&lt;60% <span class="dot-s d-yellow"></span>60–79% <span class="dot-s d-green"></span>≥80% <span>⭐</span>+ boss</div></div>
   <div class="grid g3" style="margin-bottom:16px"><div class="card sk-reading"><h3>💪 My strengths</h3>${rk(strong,true)}</div><div class="card sk-speaking"><h3>🎯 To improve</h3>${rk(weak,false)}</div>
    <div class="card"><h3>🎯 Checkpoints</h3>${checkpointRows(true)}<a class="btn sm ghost" href="#/checkpoints" style="margin-top:8px">All checkpoints</a></div></div>
   <div class="path">${b?b.files.map(island).join(''):''}</div>`}

/* ---------- §7 lesson card ---------- */
const _vLesson=SV.lesson;
function vLesson(id){const l=findLesson(id);if(!l)return _vLesson?_vLesson.apply(this,arguments):'';const code=String(l.code).toUpperCase();const cm=(window.COURSE_MAP||{})[code]||{};
  const g=GRAMMAR[l.grammar];const r=lessonAcc(l);const page=pageOfLesson(l,cm);const col=lessonColor(l);const sm=LV()&&g?LV().summary(l.grammar):null;const isCur=code===curCode();
  const pack=cm.vocab?String(cm.vocab).replace(/^vocab-/,'').replace(/\.json$/,''):l.vocab;const words=VOCAB_LIB.filter(v=>v[4]===pack);const inDeck=new Set(S.vocab.map(c=>c.word));const missing=words.filter(v=>!inDeck.has(v[0])).length;
  const lvl=n=>{if(!LV()||!g)return '';const q=LV().qsOf(l.grammar,n).length;if(!q)return '';const b=LV().best(l.grammar,n);return `<div class="list-item"><div>${LV().LV[n].icon} Level ${n} · ${LV().LV[n].name} ${LV().starsHtml(LV().starsN(b))}</div><a class="btn sm ${b!=null&&b>=0.7?'plain':''}" href="#/grammar/${l.grammar}">${b==null?'Start':b>=0.7?'✓':'Continue'}</a></div>`};
  return `<div class="page-head"><a class="small" href="#/map">← Map</a><h1>${esc(l.code)} · ${esc(l.title)} ${isCur?'📍':''}</h1><div class="muted">${esc(l.book?l.book.title:'')} · File ${l.file?l.file.n:''} · ${page?'p. '+esc(page):'p. — fill in from your book'}</div></div>
   <div class="grid g2">
    <div class="card stack"><h2>📖 What you need to know</h2><div>${cm.know?esc(cm.know):g?esc(g.ru||''):'<span class="muted">Description is coming from the methodist.</span>'}</div>
     <div class="kpi-row" style="grid-template-columns:repeat(2,1fr)"><div><b>${r?Math.round(r.a*100)+'%':'—'}</b><span>last 30 days</span></div><div><b>${sm?sm.stars+'/'+sm.max+' ★':'—'}</b><span>${sm&&sm.boss?'boss defeated ⚔️':'stars'}</span></div></div>
     <div class="small muted">Status: ${col.lbl}</div>
     ${isCur?'<span class="badge acc">Current unit</span>':`<button class="btn ghost" onclick="A.tSetUnit(${jsq(code)})">📍 Make it my current unit</button>`}</div>
    <div class="card stack"><h2>✅ What to do</h2>
     <div class="list-item"><div>📕 Student's Book: lesson ${esc(l.code)}, ${page?'p. '+esc(page):'p. — fill in from your book'} <div class="small muted">Do it with ${esc(S.users.teacher.name)} or alone. Extra practice: Oxford Online Practice.</div></div><a class="btn sm plain" href="https://www.oxfordonlinepractice.com/" target="_blank" rel="noopener">Open ↗</a></div>
     ${(cm.todo||[]).map(t=>`<div class="list-item"><div>• ${esc(t)}</div></div>`).join('')}
     ${g?`<div class="small muted" style="margin-top:6px">Grammar on the site: ${esc(g.title)}</div>${[1,2,3].map(lvl).join('')}<div class="list-item"><div>⚔️ Boss</div><a class="btn sm ${LV()&&LV().bossDone(l.grammar)?'plain':''}" href="#/grammar/${l.grammar}">${LV()&&LV().bossDone(l.grammar)?'✓':'Open'}</a></div>`:''}
     ${extraLine(l,cm)}${bookBlock(l,cm)}
     ${g?`<div class="list-item"><div>🎯 Practice of this lesson <span class="small muted">${cm.questionFilter?'70% questions of '+esc(code)+' · 30% the rest of the topic':'questions of the topic'}</span></div><button class="btn sm" onclick="A.startLesson('${l.id}')">Practise</button></div>`:''}
     <div class="list-item"><div>🃏 Words of the lesson <span class="small muted">${words.length} words</span></div>${missing?`<button class="btn sm" onclick="A.addTopicWords(${jsq(pack)})">Add ${missing}</button>`:'<span class="small muted">in your cards ✓</span>'}</div>
     <div class="list-item"><div>🎙️ Speaking task</div><button class="btn sm" onclick="TS_SPEAK&&TS_SPEAK.start('question')">Record</button></div></div></div>`}

/* ---------- §8 checkpoints ---------- */
function plInfo(){const lp=lastPlacement();const next=lp?addDays(new Date(lp.date),56):null;return {lp,next,due:!lp||next<=new Date()}}
function checkpointRows(short){const pl=plInfo();const nl=nextLesson();const mini=nl?addDays(nl,-1):null;
  const bl=(window.TS_MATERIALS&&TS_MATERIALS.baseline)?Object.keys(TS_MATERIALS.baseline).length:0;
  const row=(ico,title,why,when,href,cta)=>`<div class="list-item"><div><b>${ico} ${title}</b>${short?'':`<div class="small">${why}</div>`}<div class="small muted">${when}</div></div><a class="btn sm" href="${href}">${cta}</a></div>`;
  return row('📏','Level test (placement)','Measures your overall level and shows growth. Once at the start, then every 8–12 weeks.',pl.lp?`Last: ${fmtD(pl.lp.date)} · next: ${pl.due?'<b>now</b>':fmtD(pl.next.toISOString())}`:'Not taken yet · ≈ 30 min','#/placement',pl.due?'Start':'Open')
   +row('🔬','Before / after tests','Checks whether the method works on specific words and topics: “before” at the start of a pack, “after” in 3–4 weeks.',bl?`${bl} test${bl>1?'s':''} available`:'No tests loaded','#/baseline','Open')
   +row('📝',`Unit mini-test · ${esc(curCode())}`,'Shows whether the unit is learned. Best the day before the lesson.',mini?`Next lesson: ${fmtD(nl.toISOString())} → mini-test on ${fmtD(mini.toISOString())}`:'Set the lesson day in Settings','#/today','Plan')}
function vCheckpoints(){return `<div class="page-head"><h1>Checkpoints 🎯</h1><p class="muted">Why each test exists and when the next one is.</p><div class="ru-line">Зачем нужен каждый тест и когда следующий.</div></div><div class="card">${checkpointRows(false)}</div>`}
function onboarding(){return `<div class="card center stack" style="max-width:640px;margin:0 auto;padding:30px"><div style="font-size:56px">👋</div><h1>Welcome, ${esc(S.users.student.name)}!</h1>
  <p>Let's take the level test <b>once</b> (≈ 30 min). It shows where you start, and in 8–12 weeks you will see your growth.</p><div class="ru-line">Пройдём тест уровня один раз (≈ 30 минут). Потом он скрыт до следующего срока — сайт напомнит.</div>
  <a class="btn lg block" href="#/placement" onclick="TS_PROGRESS.onboarded()">Start the level test</a><button class="btn lg block plain" onclick="TS_PROGRESS.onboarded();render()">Later</button></div>`}

/* ---------- §9 my month ---------- */
function monthStats(m){const p=P();const inM=iso=>iso&&iso.slice(0,7)===m;let mins=0,days=0;Object.entries(S.activity).forEach(([k,v])=>{if(k.slice(0,7)===m&&v>0){days++;mins+=v}});
  let c=0,t=0;S.attempts.forEach(a=>{if(inM(a.date))(a.answers||[]).forEach(x=>{t++;if(x.ok)c++})});const st=(p.attStats||{})[m];if(st){c+=st.c;t+=st.t}
  const learned=S.vocab.filter(v=>inM(v.learnedAt)).length,newW=S.vocab.filter(v=>inM(v.added)).length;
  const units=Object.values(p.boss||{}).filter(b=>inM(b.date)).length;const lv=[...S.levels].reverse().find(l=>l.date.slice(0,7)<=m);
  const sp=S.subs.filter(s=>s.type==='speaking'&&inM(s.date)&&s.wpm);const wpm=sp.length?Math.round(sp.reduce((a,s)=>a+s.wpm,0)/sp.length):null;
  return {m,mins:Math.round(mins),days,acc:t?c/t:null,t,learned,newW,units,level:lv?lv.overall:null,wpm}}
const prevM=(m,n=1)=>{const d=new Date(m+'-15');d.setMonth(d.getMonth()-n);return mk(d)};
const mName=m=>new Date(m+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
function arrow(a,b,fmt){if(a==null||b==null)return '';const d=a-b;if(Math.abs(d)<1e-9)return '<span class="ar same">→</span>';return `<span class="ar ${d>0?'up':'down'}">${d>0?'↑':'↓'} ${fmt?fmt(Math.abs(d)):Math.round(Math.abs(d))}</span>`}
function chart(){const ms=[5,4,3,2,1,0].map(n=>prevM(mk(new Date()),n));const st=ms.map(monthStats);const maxW=Math.max(5,...st.map(s=>s.newW));
  const W=600,H=220,pl=36,pb=28,pt=14,cw=(W-pl-12)/6;
  const bars=st.map((s,i)=>{const h=(H-pb-pt)*s.newW/maxW;return `<rect x="${pl+i*cw+cw*0.2}" y="${H-pb-h}" width="${cw*0.6}" height="${h}" rx="6" fill="var(--sk-words)" opacity=".85"><title>${s.newW} new words</title></rect><text x="${pl+i*cw+cw/2}" y="${H-pb-h-4}" text-anchor="middle" font-size="12" fill="var(--muted)">${s.newW||''}</text>`}).join('');
  const pts=st.map((s,i)=>s.acc==null?null:[pl+i*cw+cw/2,pt+(H-pb-pt)*(1-s.acc)]);
  const line=pts.filter(Boolean).map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="mchart" role="img" aria-label="New words per month and accuracy">
   ${[0,.5,1].map(f=>`<line x1="${pl}" x2="${W-12}" y1="${pt+(H-pb-pt)*(1-f)}" y2="${pt+(H-pb-pt)*(1-f)}" stroke="var(--border)"/><text x="${pl-6}" y="${pt+(H-pb-pt)*(1-f)+4}" text-anchor="end" font-size="11" fill="var(--sk-grammar)">${f*100}%</text>`).join('')}
   ${bars}${line?`<path d="${line}" fill="none" stroke="var(--sk-grammar)" stroke-width="3"/>`:''}${pts.map(p=>p?`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--sk-grammar)"/>`:'').join('')}
   ${st.map((s,i)=>`<text x="${pl+i*cw+cw/2}" y="${H-8}" text-anchor="middle" font-size="12" fill="var(--muted)">${new Date(s.m+'-15').toLocaleDateString('en-GB',{month:'short'})}</text>`).join('')}</svg>
   <div class="small muted"><span style="color:var(--sk-words)">■</span> new words · <span style="color:var(--sk-grammar)">●</span> accuracy</div>`}
function monthCards(m){const a=monthStats(m),b=monthStats(prevM(m));const card=(ico,lbl,v,ar)=>`<div class="mcard"><div class="small muted">${ico} ${lbl}</div><div class="mval">${v}</div>${ar}</div>`;
  return `<div class="mgrid">${card('🃏','Words learned',a.learned,arrow(a.learned,b.learned))}${card('⏱','Minutes',a.mins,arrow(a.mins,b.mins))}${card('📅','Days',a.days,arrow(a.days,b.days))}
   ${card('✅','Accuracy',a.acc==null?'—':Math.round(a.acc*100)+'%',arrow(a.acc,b.acc,d=>Math.round(d*100)+'%'))}${card('⚔️','Units closed',a.units,arrow(a.units,b.units))}${card('📈','Level',a.level==null?'—':cefr(a.level),'')}${a.wpm!=null?card('🎙️','Words / min',a.wpm,arrow(a.wpm,b.wpm)):''}</div>`}
function monthText(m){const a=monthStats(m),b=monthStats(prevM(m));const ar=(x,y)=>x==null||y==null?'':x>y?' ↑':x<y?' ↓':' →';
  return [`📅 ${S.users.student.name} · ${mName(m)}`,`🃏 Words learned: ${a.learned}${ar(a.learned,b.learned)}`,`⏱ Minutes: ${a.mins}${ar(a.mins,b.mins)} · days: ${a.days}`,`✅ Accuracy: ${a.acc==null?'—':Math.round(a.acc*100)+'%'}${ar(a.acc,b.acc)}`,`⚔️ Units closed: ${a.units}`,a.wpm!=null?`🎙️ Speaking: ${a.wpm} words/min${ar(a.wpm,b.wpm)}`:''].filter(Boolean).join('\n')}
function vMonth(arg){const now=mk(new Date());const m=arg==='card'?prevM(now):now;const diary=S.subs.filter(s=>s.type==='speaking'&&s.diary).sort((a,b)=>a.date.localeCompare(b.date));const diaryDue=!diary.some(d=>d.date.slice(0,7)===now);
  if(arg==='card')return `<div class="page-head no-print"><a class="small" href="#/month">← My month</a><h1>Month card 🗓️</h1><div class="ru-line">Сделайте скриншот и отправьте Айнуре.</div><div class="row" style="margin-top:8px"><button class="btn" onclick="TS_PROGRESS.copyMonth()">📋 Copy text</button></div></div>
    <div class="card month-card"><h2>📅 ${esc(S.users.student.name)} · ${mName(m)}</h2>${monthCards(m)}</div><textarea id="month-text" style="position:absolute;left:-9999px" aria-hidden="true">${esc(monthText(m))}</textarea>`;
  return `<div class="page-head"><h1>My month 📅</h1><div class="muted">${mName(m)} — like a season in a game. Arrows compare with last month.</div><div class="ru-line">Как «сезон» в игре: стрелки — сравнение с прошлым месяцем.</div></div>
   ${monthCards(m)}
   <div class="grid g2" style="margin-top:16px"><div class="card"><h2>6 months</h2>${chart()}</div>
    <div class="card"><h2>📔 Speech diary</h2><div class="ru-line">Раз в месяц одна тема. Слушайте подряд — слышно рост.</div>
     ${diary.length?diary.map(d=>`<div class="list-item"><div>${mName(d.date.slice(0,7))}<div class="small muted">${d.words||0} words · ${d.wpm||0} w/min</div></div><button class="btn sm ghost lazy-audio" data-key="${esc(d.audioKey||'')}" ${d.audioKey?'':'disabled'}>▶</button></div>`).join(''):'<p class="muted">No entries yet.</p>'}
     <div class="row" style="margin-top:10px">${diary.length>1?'<button class="btn ghost" onclick="TS_SPEAK.playDiary()">▶ Play all</button>':''}${diaryDue?`<button class="btn" onclick="TS_SPEAK.start('diary')">📔 Record ${new Date().toLocaleDateString('en-GB',{month:'long'})}</button>`:'<span class="badge ok">this month ✓</span>'}</div></div></div>
   <div class="card row between" style="margin-top:16px"><div><b>🗓️ Month card</b><div class="small muted">Last month in one picture for ${esc(S.users.teacher.name)}.</div></div><a class="btn ghost" href="#/month/card">Open</a></div>`}

/* ---------- Today banners: onboarding, placement due, month card, diary ---------- */
const _today=SV.today;
SV.today=function(){if(isStudent()&&!lastPlacement()&&!P().onboarded)return onboarding();
  const html=_today.apply(this,arguments);const d=new Date();const ban=[];const pl=plInfo();
  if(isStudent()&&pl.lp&&pl.due)ban.push(`<div class="card row between banner"><div><b>📏 Time for the level test</b><div class="small muted">Last one: ${fmtD(pl.lp.date)}. See how much you have grown.</div></div><a class="btn" href="#/placement">Start</a></div>`);
  if(d.getDate()<=3)ban.push(`<div class="card row between banner"><div><b>🗓️ Your month card is ready</b><div class="small muted">${mName(prevM(mk(d)))} in one picture.</div></div><a class="btn ghost" href="#/month/card">Open</a></div>`);
  const now=mk(d);if(d.getDate()<=7&&!S.subs.some(s=>s.type==='speaking'&&s.diary&&s.date.slice(0,7)===now))ban.push(`<div class="card row between banner"><div><b>📔 Speech diary for ${d.toLocaleDateString('en-GB',{month:'long'})}</b><div class="small muted">3 minutes: “Tell me about yourself and your job”.</div></div><button class="btn ghost" onclick="TS_SPEAK.start('diary')">Record</button></div>`);
  if(!ban.length)return html;const i=html.indexOf('<div class="mode-grid">');return i<0?ban.join('')+html:html.slice(0,i)+ban.join('')+html.slice(i)};

/* ---------- wiring ---------- */
/* D41: pages only when the teacher filled them in (course editor) or the methodist gave them */
function pageOfLesson(l,cm){return cm&&cm.page?cm.page:l.pageSet&&l.page?l.page:''}
if(A.ce){const _ce=A.ce;A.ce=(bi,fi,li,k,v)=>{_ce(bi,fi,li,k,v);if(k==='page'&&li!=null){const o=S.course[bi].files[fi].lessons[li];o.pageSet=!!String(v).trim();save()}}}
/* D40: grammar book units + "Done in the book" (both roles; +20 XP once for the student) */
const BOOKNAME=k=>{if(/blue|egu|essential/i.test(k))return 'Essential Grammar in Use';if(/red|gin|grammarinuse|english|murphy/i.test(k))return 'Grammar in Use';
  const t=(window.COURSE_MAP||{})._books;const x=t&&t[k];return x?(typeof x==='string'?x:x.title||x.name||k):k};
function bookUnits(v){if(v==null)return '';if(Array.isArray(v))return v.join(', ');if(typeof v==='object')return (v.units||v.unit||[]).toString().replace(/,/g,', ');return String(v)}
function bookLines(cm){const b=cm&&cm.books;if(!b)return [];return Object.entries(b).filter(([k,v])=>bookUnits(v)).map(([k,v])=>`${BOOKNAME(k)}: unit${/,/.test(bookUnits(v))?'s':''} ${bookUnits(v)}`)}
const shared=()=>S.shared||(S.shared={});
function bookBlock(l,cm){const lines=bookLines(cm);if(!lines.length)return '';const code=String(l.code).toUpperCase();const d=(shared().bookDone||{})[code];
  return `<div class="book-block"><b>📕 Grammar book</b>${lines.map(x=>`<div class="small">${esc(x)}</div>`).join('')}<div class="small muted">Exercises in the book, check with the key. ${isStudent()?'+20 XP once':''}</div>
   <label class="as-row"><input type="checkbox" ${d?'checked':''} onchange="TS_PROGRESS.bookDone('${code}',this.checked)"> Done in the book${d?` <span class="small muted">· ${fmtD(d.date)} · ${esc(d.by==='teacher'?S.users.teacher.name:S.users.student.name)}</span>`:''}</label></div>`}
function setBookDone(code,on){const sh=shared();sh.bookDone=sh.bookDone||{};if(on)sh.bookDone[code]={date:new Date().toISOString(),by:S.role};else delete sh.bookDone[code];bookXp();save();render()}
function bookXp(){if(!isStudent())return;const p=P();p.bookXp=p.bookXp||{};Object.keys((shared().bookDone)||{}).forEach(code=>{if(!p.bookXp[code]){p.bookXp[code]=new Date().toISOString();if(window.TS_PROGRAM)TS_PROGRAM.award(20,'grammar','Grammar book · '+code)}})}
/* D40: extra topic of the lesson — opens after ≥ 70% on level 1 of the main topic */
function extraOpen(l){return !LV()||LV().passed(l.grammar,1)}
function extraLine(l,cm){const ex=(cm&&cm.extraGrammar||[]).filter(k=>GRAMMAR[k]);if(!ex.length)return '';const op=extraOpen(l);
  return ex.map(k=>`<div class="list-item"><div>➕ For Intermediate: <b>${esc(GRAMMAR[k].title)}</b>${LV()?' '+LV().starsHtml(Math.round(LV().summary(k).stars/Math.max(1,LV().summary(k).levels))):''}<div class="small muted">${op?'open':'opens after 70% on level 1 of '+esc(topicName(l.grammar))}</div></div>${op?`<a class="btn sm" href="#/grammar/${k}">Open</a>`:'<span>🔒</span>'}</div>`).join('')}
/* D40: lesson practice — 70% questions of this lesson (field "lessons"), 30% the rest of the topic */
function lessonMix(qs,code,n){code=String(code||'').toUpperCase();const tagged=qs.some(q=>Array.isArray(q.lessons));if(!code||!tagged)return shuffle(qs).slice(0,n||qs.length);
  const own=shuffle(qs.filter(q=>Array.isArray(q.lessons)&&q.lessons.map(v=>String(v).toUpperCase()).includes(code))),rest=shuffle(qs.filter(q=>!(Array.isArray(q.lessons)&&q.lessons.map(v=>String(v).toUpperCase()).includes(code))));
  n=Math.min(n||12,qs.length,Math.max(5,Math.ceil(own.length/0.7)));const k=Math.min(own.length,Math.round(n*0.7));return shuffle(own.slice(0,k).concat(rest.slice(0,n-k)).concat(own.slice(k)).slice(0,n))}
A.startLesson=(id,hw)=>{const l=findLesson(id);const g=l&&GRAMMAR[l.grammar];if(!g)return toast('No grammar topic for this lesson');const code=String(l.code).toUpperCase();const cm=(window.COURSE_MAP||{})[code]||{};
  const qs=cm.questionFilter?lessonMix(g.qs,cm.questionFilter,12):shuffle(g.qs);
  listRun({title:`${l.code} · ${l.title}`,back:'/lesson/'+id,kind:'lesson',lessonId:id,lessonCode:code,hw:hw||null,reshuffle:true,onFinish:r=>{const sc=r.answers.filter(a=>a.ok).length/r.answers.length;const p=S.lessonProgress[id]||{best:0,done:false};p.best=Math.max(p.best,sc);p.done=p.done||sc>=0.6;S.lessonProgress[id]=p}},qs)};
/* D46: one Progress page — month → skills and topics → history */
function vProgressAll(){const now=mk(new Date());const lv=latestLevel();const r=topicRanks();const diary=S.subs.filter(s=>s.type==='speaking'&&s.diary).sort((a,b)=>a.date.localeCompare(b.date));
  const hist=S.attempts.slice().reverse().slice(0,40);
  return `<div class="page-head"><h1>Progress 📈</h1><div class="muted">${mName(now)} · level ${lv?cefr(lv.overall):'—'} · goal: ${esc(goalText())}</div><div class="ru-line">Сверху — месяц, ниже — навыки и темы, внизу — история тестов.</div></div>
   <h2>1 · This month</h2>${monthCards(now)}
   <div class="grid g2" style="margin-top:16px"><div class="card"><h2>6 months</h2>${chart()}</div>
    <div class="card"><h2>📔 Speech diary</h2>${diary.length?diary.map(d=>`<div class="list-item"><div>${mName(d.date.slice(0,7))}<div class="small muted">${d.words||0} words · ${d.wpm||0} w/min</div></div><button class="btn sm ghost lazy-audio" data-key="${esc(d.audioKey||'')}" ${d.audioKey?'':'disabled'}>▶</button></div>`).join(''):'<p class="muted">No entries yet.</p>'}
     <div class="row" style="margin-top:10px">${diary.length>1?'<button class="btn ghost" onclick="TS_SPEAK.playDiary()">▶ Play all</button>':''}<a class="btn ghost" href="#/month/card">🗓️ Month card</a></div></div></div>
   <h2 style="margin-top:22px">2 · Skills and topics</h2>
   <div class="grid g2"><div class="card"><h3>Skill profile</h3>${typeof radar==='function'?radar(lv&&lv.skills):''}</div>
    <div class="card"><h3>💪 Strong</h3>${r.slice(0,3).map(x=>`<div class="list-item small"><a href="#/grammar/${x.k}">${esc(topicName(x.k))}</a><b>${Math.round(x.a*100)}%</b></div>`).join('')||'<div class="small muted">After a few exercises.</div>'}
     <h3 style="margin-top:10px">🎯 To improve</h3>${r.slice(-3).reverse().filter(x=>x.a<0.85).map(x=>`<div class="list-item small"><a href="#/grammar/${x.k}">${esc(topicName(x.k))}</a><b>${Math.round(x.a*100)}%</b></div>`).join('')||'<div class="small muted">—</div>'}</div></div>
   <div class="card" style="margin-top:16px"><h3>Accuracy by topic</h3>${typeof heatmap==='function'?heatmap():''}</div>
   <details class="card" style="margin-top:16px"><summary><b>3 · Test and practice history</b> <span class="small muted">(${S.attempts.length})</span></summary>
    ${hist.length?`<div class="tbl"><table><tr><th>Date</th><th>Activity</th><th>Score</th></tr>${hist.map(a=>`<tr><td>${fmtDT(a.date)}</td><td>${esc(a.title)}</td><td><b>${a.score}/${a.total}</b> (${Math.round(a.score/Math.max(1,a.total)*100)}%)</td></tr>`).join('')}</table></div>`:'<p class="muted">No tests yet.</p>'}</details>`}
function goalText(){const g=(window.COURSE_MAP||{})._goal;return typeof g==='string'?g:g&&g.text?g.text:'Intermediate (B1) by March 2027'}
SV.map=vMap;SV.lesson=vLesson;SV.checkpoints=vCheckpoints;SV.progress=vProgressAll;
SV.month=arg=>{if(arg==='card')return vMonth('card');setTimeout(()=>location.replace('#/progress'),0);return ''};
setTimeout(()=>{try{bookXp()}catch(e){}},3500);
window.TS_PROGRESS={lessonAcc,lessonMix,bookDone:setBookDone,bookLines,extraOpen,topicRanks,monthStats,monthText,fold,acc30,lessonColor,onboarded(){P().onboarded=new Date().toISOString();save()},
  copyMonth(){const t=$('#month-text');if(!t)return;(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(()=>toast('Copied'),()=>{t.select();document.execCommand('copy');toast('Copied')})}};
try{render()}catch(e){console.error(e)}
})();
