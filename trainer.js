/* ============================================================
   trainer.js — the personal trainer from METHODIKA.md v2.1
     §3  Today: 4 modes (Micro 2–3 / Short 10 / Standard 30 / Full 60), recommended one by weekday
     §4  plans inside modes, task card before every block, XP per block (≥80% full, <80% half, unfinished 0),
         break + game in Full, "Day closed" screen with 3 buttons, no separate Sprint
     §6  mistakes bank 1 → 3 → 7 days, closed after 2 right answers on different days
     §11 homework from WhatsApp as a reminder
     §9  weekly report for WhatsApp; background listening minutes (no XP)
   Needs: words.js (cards), levels.js (grammar levels + boss); speak.js is optional.
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('trainer.js: main app not found');return}

const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const pct=(c,t)=>t?Math.round(c/t*100):0;
const DEFAULT_UNIT='7B';
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const W=()=>window.TS_WORDS,L=()=>window.TS_LEVELS,SP=()=>window.TS_SPEAK,PR=()=>window.TS_PROGRAM;
const award=(n,sk,why)=>{if(n&&PR())PR().award(n,sk,why)};

/* ---------- answers: contractions = full forms ---------- */
const _norm=norm;
norm=function(s){let x=String(s||'').toLowerCase().replace(/[’‘`]/g,"'")
  .replace(/\b(it|that|what|there|here|he|she|who|where|how)'s\b/g,'$1 is')
  .replace(/\blet's\b/g,'let us').replace(/\bcan not\b/g,'cannot');
  return _norm(x)};

/* ---------- current unit ---------- */
const piBook=()=>Array.isArray(S.course)?S.course.find(b=>b.id==='pi'):null;
const units=()=>{const b=piBook();return b?b.files.flatMap(f=>f.lessons):[]};
const unitCode=()=>String(P().unit||DEFAULT_UNIT).toUpperCase();
const unitLesson=(code=unitCode())=>{const l=units().find(x=>String(x.code).toUpperCase()===code);return l?findLesson(l.id):null};
function unitModule(code=unitCode()){
  {const l=unitLesson(code);if(l&&GRAMMAR[l.grammar]&&GRAMMAR[l.grammar].src)return l.grammar}
  const fromData=Object.entries(GRAMMAR).find(([k,g])=>g.track!=='work'&&(g.unit===code||(g.units||[]).includes(code)));if(fromData)return fromData[0];
  const l=unitLesson(code);return l&&GRAMMAR[l.grammar]?l.grammar:null}
function unitQs(code=unitCode()){const m=unitModule(code);return m?GRAMMAR[m].qs:[]}
function pastQs(){const cur=unitCode(),ls=units(),i=ls.findIndex(l=>String(l.code).toUpperCase()===cur);
  const debts=(P().debts||[]).filter(id=>!(P().debtsDone||{})[id]).map(id=>findLesson(id)).filter(Boolean).map(l=>l.grammar);
  const earlier=ls.slice(0,Math.max(0,i)).map(l=>l.grammar).reverse();
  const mods=[...new Set(debts.concat(earlier))].filter(k=>GRAMMAR[k]&&k!==unitModule());
  return shuffle(mods.flatMap(k=>GRAMMAR[k].qs))}
function sentences(n){const u=shuffle(unitQs()),p=pastQs();const nu=n>=10?Math.round(n*0.7):n;
  let out=u.slice(0,nu);out=out.concat(p.slice(0,n-out.length));if(out.length<n)out=out.concat(u.slice(nu,nu+n-out.length));return shuffle(out).slice(0,n)}
A.tSetUnit=code=>{P().unit=String(code).toUpperCase();save();toast('Current unit: '+P().unit);render()};
if(PR())PR().sprintLesson=()=>unitLesson();

/* ---------- mistakes bank: 1 → 3 → 7, closed after 2 right answers on different days ---------- */
const MSTEP=[1,3,7];
const dueMistakes=()=>{const t=dkey();return S.mistakes.filter(m=>!m.due||m.due<=t)};
const _submit=submit;
submit=function(g){const r=RUN,q=r&&r.q;const had=q?S.mistakes.find(m=>m.qid===q.id):null;const okDays0=had?(had.okDays||[]).slice():null;
  _submit(g);if(!q)return;const last=r.answers[r.answers.length-1];if(!last||last.qid!==q.id)return;
  const m=S.mistakes.find(x=>x.qid===q.id);
  if(!last.ok&&m){m.step=0;m.okDays=[];m.due=dkey(addDays(new Date(),MSTEP[0]))}
  else if(last.ok&&r.mistakeMode&&m){const t=dkey();m.okDays=(okDays0||[]).filter(d=>d!==t).concat([t]);
    if(m.okDays.length>=2){S.mistakes=S.mistakes.filter(x=>x!==m);r._fixed=(r._fixed||0)+1}
    else{m.step=Math.min(MSTEP.length-1,(m.step||0)+1);m.due=dkey(addDays(new Date(),MSTEP[m.step]))}
    if(isStudent()){award(15,q.skill==='vocabulary'?'vocab':'grammar');r._xp=(r._xp||0)+15}}
  save()};
function mistakesRun(n,extra){const qs=shuffle(dueMistakes().map(m=>ALLQ[m.qid]).filter(Boolean)).slice(0,n);
  if(!qs.length)return false;listRun(Object.assign({title:'Mistakes bank',back:'/mistakes',kind:'mistakes',mistakeMode:true,clearMistakes:false,record:false,blockXp:true},extra||{}),qs);return true}
A.reviewMistakes=()=>{if(!mistakesRun(20))toast('No mistakes due today ✓')};

/* ---------- sessions ---------- */
const MODES={
  micro:{icon:'⚡',name:'Micro',time:'2–3 min',ru:'Микро · в очереди, в перерыве',sub:'10 cards, 5 sentences or 1 rule',cls:'m-micro'},
  short:{icon:'🟢',name:'Short',time:'10 min',ru:'Короткая · занят, но не пропускаю день',sub:'20 cards + 5 sentences',cls:'m-short'},
  standard:{icon:'🟡',name:'Standard',time:'30 min',ru:'Стандарт · обычный день',sub:'Cards, sentences, skill of the day',cls:'m-std'},
  full:{icon:'🔴',name:'Full',time:'60 min',ru:'Полная · есть силы и время',sub:'Cards, mistakes, grammar, break, homework, speaking',cls:'m-full'}};
const REWARD={cards:20,sent:30,glevel:50,skill:30,speak:50,boss:100,micro:10,rule:10,mist:0,hw:0,brk:0};
const SKILL_OF={0:'mini',1:'reading',2:'reading',3:'listening',4:'listening',5:'work',6:'work'};
const FULL5={1:'retell',2:'question',3:'boss',4:'retell',5:'question',6:'boss',0:'retell'};
const recommended=(d=new Date().getDay())=>[1,3,5].includes(d)?'full':'standard';
function sessions(k=dkey()){const p=P();p.sess=p.sess||{};const ks=Object.keys(p.sess).sort();while(ks.length>21)delete p.sess[ks.shift()];return p.sess[k]=p.sess[k]||[]}
const current=()=>{const l=sessions();const s=l[l.length-1];return s&&!s.closed?s:null};
function blk(kind,o){const b=Object.assign({kind,status:'todo',reward:REWARD[kind]||0},o);b.id=b.id||kind+'-'+uid();return b}
function skillBlock(sk){const d={reading:['📖','Reading','Read a text and answer the questions.','Прочитай текст и ответь на вопросы.'],
  listening:['🎧','Listening','Listen to a text and answer the questions.','Послушай текст и ответь на вопросы.'],
  work:['💼','Work English + interview','Work English exercises, then the interview simulator if you have time.','Рабочий английский, потом симулятор собеседования.'],
  mini:['📝','Mini-test + weekly report',`10 questions on unit ${unitCode()}, then send the weekly report.`,'Мини-тест по юниту и недельный отчёт.']}[sk];
  return blk('skill',{sk,icon:d[0],title:d[1],task:d[2],ru:d[3],n:sk==='mini'?10:null,skill:sk==='work'?'grammar':sk==='mini'?'grammar':sk})}
function build(mode){const d=new Date().getDay(),u=unitCode(),m=unitModule();
  const cards=n=>blk('cards',{n,icon:'🃏',title:'Words',task:`Go through ${n} cards. Done when every card is answered.`,ru:`Пройди ${n} карточек: «Знаю» или «Не знаю».`,skill:'vocab'});
  const sent=n=>{const nu=n>=10?Math.round(n*0.7):n;return blk('sent',{n,icon:'🔀',title:'Sentences',task:n>=10?`Make ${n} sentences: ${nu} from unit ${u}, ${n-nu} from earlier units.`:`Make ${n} sentences on unit ${u}.`,ru:'Составь предложения: выбор, пропуск, порядок, исправление, перевод.',skill:'grammar'})};
  if(mode==='micro'){const k=sessions().filter(s=>s.mode==='micro').length;const opts=[];
    if(W()&&W().queue(10).length>=5)opts.push('cards');if(unitQs().length||pastQs().length)opts.push('sent');if(m)opts.push('rule');if(!opts.length)opts.push('cards');
    const pick=opts[k%opts.length];
    return [pick==='cards'?Object.assign(cards(10),{reward:REWARD.micro}):pick==='sent'?Object.assign(sent(5),{reward:REWARD.micro}):
      blk('rule',{icon:'📖',title:'1 rule + 3 questions',task:`Read the rule of unit ${u} and answer 3 questions.`,ru:'Прочитай правило и ответь на 3 вопроса.',n:3,reward:REWARD.micro,skill:'grammar'})]}
  if(mode==='short')return [cards(20),sent(5)];
  if(mode==='standard')return [cards(30),sent(10),skillBlock(SKILL_OF[d])];
  const out=[cards(30)];const dm=dueMistakes().length;
  if(dm)out.push(blk('mist',{n:Math.min(10,dm),icon:'🔁',title:'Mistakes',task:`Fix ${Math.min(10,dm)} mistakes that are due. +15 XP for each fixed one.`,ru:'Исправь ошибки, у которых наступил срок. +15 XP за каждую.',skill:'grammar'}));
  if(m){const nx=L()?L().next(m):{lvl:1};
    out.push(nx.boss?blk('boss',{icon:'⚔️',title:`Boss · ${GRAMMAR[m].title}`,task:'Write 5 sentences about your work with this grammar. Then compare with the samples.',ru:'Напиши 5 своих предложений о работе и сравни с образцами.',n:5,skill:'writing'})
      :blk('glevel',{icon:'📐',title:`Grammar ${u} · Level ${nx.lvl}`,lvl:nx.lvl,task:`Do ${L()?Math.min(L().qsOf(m,nx.lvl).length,L().LV[nx.lvl].size):10} tasks of level ${nx.lvl}. The next level opens at 70%.`,ru:'Следующий незакрытый уровень темы юнита.',n:L()?Math.min(L().qsOf(m,nx.lvl).length,L().LV[nx.lvl].size):10,skill:'grammar'}))}
  else out.push(sent(10));
  out.push(blk('brk',{icon:'☕',title:'Break + game',task:'Rest 5 minutes. Want to play? Pick a game.',ru:'Перерыв 5 минут. Можно поиграть.'}));
  out.push(blk('hw',{icon:'📚',title:`${S.users.teacher.name}’s homework`,task:'Do the Workbook off the site, then mark it done here.',ru:'Сделай Workbook вне сайта и отметь «сделано».'}));
  const f5=FULL5[d];
  out.push(f5==='boss'&&m?blk('boss',{icon:'⚔️',title:`Boss · ${GRAMMAR[m].title}`,task:'Write 5 of your own sentences about work with this grammar.',ru:'5 своих предложений о работе.',n:5,skill:'writing'})
    :blk('speak',{sk:f5==='boss'?'question':f5,icon:'🎙️',title:f5==='retell'?'Speaking · Retell':'Speaking · Answer a question',task:f5==='retell'?'Retell a text in your own words (up to 5 min).':'Answer a question about yourself (up to 3 min).',ru:f5==='retell'?'Перескажи текст своими словами.':'Ответь на вопрос о себе.',skill:'speaking'}));
  return out}
function startMode(mode,extra){const l=sessions();const s={id:'s-'+uid(),mode,start:new Date().toISOString(),xp0:S.game?S.game.xp:0,blocks:extra||build(mode),closed:false};
  if(current())current().closed=true;l.push(s);save();go('/session')}
A.tMode=m=>startMode(m);
A.tMore5=()=>{const s=current();if(s)s.closed=true;const dm=dueMistakes().length;
  const b=dm?blk('mist',{n:Math.min(5,dm),icon:'🔁',title:'5 more minutes · mistakes',task:'Fix your weakest points.',ru:'Самые слабые места.',reward:REWARD.micro,skill:'grammar'})
    :blk('cards',{n:10,icon:'🃏',title:'5 more minutes · words',task:'10 cards from your weakest boxes.',ru:'10 карточек.',reward:REWARD.micro,skill:'vocab'});
  startMode('micro',[b])};
A.tPlay=()=>{UI.vtab='match';UI.mg=null;go('/vocabulary')};
A.tFinish=()=>{const s=current()||sessions().slice(-1)[0];if(s){s.closed=true;s.finished=true}UI.dayEnd=true;save();go('/session')};
const curBlock=s=>s?s.blocks.find(b=>b.status==='todo'):null;
function complete(id,acc,extra){const s=current();if(!s)return;const b=s.blocks.find(x=>x.id===id);if(!b||b.status==='done')return;
  b.status='done';b.acc=acc;b.date=new Date().toISOString();
  b.xp=acc==null?0:Math.round(b.reward*(acc>=0.8?1:0.5));if(extra)Object.assign(b,extra);
  if(b.xp)award(b.xp,b.skill,'Block: '+b.title);
  if(!curBlock(s)){s.doneAt=new Date().toISOString();setTimeout(()=>{try{window.TS_FX&&TS_FX.confetti()}catch(e){}},200)}
  save()}
A.tSkip=id=>{const s=current();const b=s&&s.blocks.find(x=>x.id===id);if(!b)return;b.status='skipped';b.xp=0;if(!curBlock(s))s.doneAt=new Date().toISOString();save();render()};
const _finish=finishRun;
finishRun=function(){const r=RUN;_finish();try{if(r&&r.planBlock){const n=r.answers.length,c=r.answers.filter(a=>a.ok).length;complete(r.planBlock,n?c/n:null);render()}}catch(e){console.error(e)}};
function runOpts(b,o){return Object.assign({planBlock:b.id,blockXp:true,back:'/session'},o||{})}
A.tStart=id=>{const s=current();const b=s&&s.blocks.find(x=>x.id===id);if(!b)return;const m=unitModule();
  switch(b.kind){
  case 'cards':if(!W())return complete(b.id,null),render();
    if(!W().start(b.n,{block:true,back:'/session',title:b.title,onDone:res=>{complete(b.id,res.empty?null:res.acc);go('/session')}})){complete(b.id,null);render()}return;
  case 'sent':{const qs=sentences(b.n);if(!qs.length){toast('No exercises yet');complete(b.id,null);return render()}
    return listRun(runOpts(b,{title:b.title,kind:'practice'}),qs)}
  case 'mist':if(!mistakesRun(b.n,runOpts(b,{title:b.title}))){complete(b.id,null);render()}return;
  case 'glevel':if(!L()||!m){complete(b.id,null);return render()}return L().startLevel(m,b.lvl,runOpts(b,{force:true}));
  case 'boss':if(!L()||!m){complete(b.id,null);return render()}return L().bossStart(m,{back:'/session',onDone:()=>{complete(b.id,1);go('/session')}});
  case 'rule':UI.rule=b.id;return render();
  case 'brk':UI.brk={id:b.id,t0:Date.now()};return render();
  case 'hw':UI.hwBlock=b.id;return render();
  case 'speak':if(SP()&&SP().start)return SP().start(b.sk,{back:'/session',onDone:res=>{complete(b.id,res&&res.ok===false?null:1);go('/session')}});
    UI.spkBlock=b.id;return go('/speaking');
  case 'skill':return startSkill(b)}};
function startSkill(b){
  if(b.sk==='reading'){const ks=Object.keys(PASSAGES);const k=ks.find(x=>PASSAGES[x].src)||ks[Math.floor(Math.random()*ks.length)];A.startReading(k);return Object.assign(RUN,runOpts(b))}
  if(b.sk==='listening'){const ks=Object.keys(AUDIO);const k=ks.find(x=>AUDIO[x].src)||ks[Math.floor(Math.random()*ks.length)];A.startListening(k);return Object.assign(RUN,runOpts(b))}
  if(b.sk==='mini'){const qs=shuffle(unitQs()).slice(0,10);if(!qs.length){complete(b.id,null);return go('/report')}const code=unitCode();
    return listRun(runOpts(b,{title:`Mini-test · unit ${code}`,mode:'test',kind:'minitest',showAnswers:true,onFinish:r=>{const c=r.answers.filter(a=>a.ok).length;const mt=P().minitest=P().minitest||{};(mt[code]=mt[code]||[]).push({date:new Date().toISOString(),c,t:r.answers.length})}}),qs)}
  const mods=Object.keys(GRAMMAR).filter(k=>GRAMMAR[k].track==='work');
  if(mods.length)return listRun(runOpts(b,{title:'Work English',kind:'practice'}),shuffle(mods.flatMap(k=>GRAMMAR[k].qs)).slice(0,10));
  if(SP()&&SP().start)return SP().start('interview',{back:'/session',onDone:()=>{complete(b.id,1);go('/session')}});
  complete(b.id,null);render()}
A.tRuleGo=()=>{const s=current();const b=s&&s.blocks.find(x=>x.id===UI.rule);UI.rule=null;const m=unitModule();if(!b||!m)return render();
  const qs=shuffle(L()?L().qsOf(m,1):unitQs()).slice(0,3);if(!qs.length){complete(b.id,1);return render()}listRun(runOpts(b,{title:'Rule check · '+GRAMMAR[m].title,kind:'practice'}),qs)};
A.tBrkDone=()=>{if(UI.brk){complete(UI.brk.id,null);UI.brk=null}render()};
A.tHwMark=hid=>{const h=S.homework.find(x=>x.id===hid);if(!h)return;h.done=h.items.map(()=>true);h.status='submitted';h.submittedAt=new Date().toISOString();save();toast('Homework marked done ✓');render()};
A.tHwBlockDone=()=>{if(UI.hwBlock){complete(UI.hwBlock,null);UI.hwBlock=null}render()};
A.tSpkDone=()=>{if(UI.spkBlock){complete(UI.spkBlock,1);UI.spkBlock=null}go('/session')};

/* ---------- views ---------- */
function unitPicker(){const cur=unitCode();
  return `<select onchange="A.tSetUnit(this.value)" aria-label="Current unit">${units().map(l=>`<option value="${esc(l.code)}" ${String(l.code).toUpperCase()===cur?'selected':''}>${esc(l.code)} · ${esc(l.title)}</option>`).join('')}</select>`}
const openHw=()=>S.homework.filter(h=>['active','overdue'].includes(hwStatus(h)));
function todayStats(){const k=dkey();const l=sessions();const xp0=l.length?Math.min(...l.map(s=>s.xp0||0)):(S.game?S.game.xp:0);
  const bl=l.flatMap(s=>s.blocks).filter(b=>b.status==='done');const accs=bl.map(b=>b.acc).filter(a=>a!=null);
  return {mins:Math.round(S.activity[k]||0),xp:Math.max(0,(S.game?S.game.xp:0)-xp0),acc:accs.length?Math.round(accs.reduce((a,b)=>a+b,0)/accs.length*100):null,
    words:S.vocab.filter(v=>v.added&&v.added.slice(0,10)===k).length,blocks:bl.length}}
function vToday(){const rec=recommended(),s=current();const st=calcStreak(),xp=S.game?S.game.xp:0,ts=todayStats();
  const bg=(P().bg||{})[dkey()]||0;const m=unitModule();const g=m&&GRAMMAR[m];const hw=openHw();
  const day=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  const tile=k=>{const M=MODES[k];return `<button class="mode-tile ${M.cls} ${k===rec?'is-rec':''}" onclick="A.tMode('${k}')"><span class="mode-ico">${M.icon}</span><span class="mode-name">${M.name}</span><span class="mode-time">${M.time}</span><span class="mode-sub">${M.sub}</span><span class="ru-line">${M.ru}</span>${k===rec?'<span class="badge acc rec-badge">Recommended today</span>':''}</button>`};
  const cont=s&&curBlock(s)?(()=>{const done=s.blocks.filter(b=>b.status!=='todo').length;return `<div class="card cont-card"><div><div class="small muted">In progress</div><b>${MODES[s.mode].icon} ${MODES[s.mode].name} · ${done}/${s.blocks.length} blocks</b><div class="bar" style="margin-top:8px"><i style="width:${pct(done,s.blocks.length)}%"></i></div></div><a class="btn lg" href="#/session">Continue →</a></div>`})():'';
  return `<div class="page-head"><h1>Today ⚡</h1><div class="muted">${day} · 🔥 ${st} day${st===1?'':'s'} · 🎖️ ${xp} XP${ts.blocks?' · <span class="ok-text">day counted ✓</span>':''}</div><div class="ru-line">Выберите, сколько у вас времени. Засчитывается даже Микро.</div></div>
  ${cont}
  <div class="mode-grid">${['micro','short','standard','full'].map(tile).join('')}</div>
  <div class="grid g3" style="margin-top:18px">
   <div class="card"><div class="small muted">📍 Current unit (with ${esc(S.users.teacher.name)})</div><div style="margin:8px 0">${unitPicker()}</div><div class="small">${g?`${esc(g.title)} · ${g.qs.length} exercises`:'Exercises for this unit are coming from the methodist'}</div><div class="ru-line">После урока выберите новый юнит — план перестроится.</div></div>
   <div class="card"><div class="small muted">📚 Homework from WhatsApp</div><div class="kpi">${hw.length} <small>open</small></div>${hw.slice(0,2).map(h=>`<div class="small">• ${esc((h.instructions||h.title).split('\n')[0].slice(0,60))} <span class="muted">· ${relDue(h.due)}</span></div>`).join('')}<a class="btn sm ghost" style="margin-top:8px" href="#/homework">${hw.length?'Open':'Add homework'}</a></div>
   <div class="card"><div class="small muted">🎧 Background listening (no XP)</div><div class="kpi">${Math.round(bg)} <small>min today</small></div><div class="row" style="margin-top:8px"><button class="btn sm plain" onclick="A.tBg(10)">+10</button><button class="btn sm plain" onclick="A.tBg(20)">+20</button><button class="btn sm plain" onclick="A.tBg(30)">+30</button></div><div class="ru-line">Подкасты, сериалы — просто отметьте минуты.</div></div>
  </div>
  ${new Date().getDay()===0?`<div class="card row between" style="margin-top:16px"><div><b>🧾 Sunday: weekly report</b><div class="small muted">Take a screenshot or copy the text for ${esc(S.users.teacher.name)}.</div></div><a class="btn" href="#/report">Open report</a></div>`:''}`}
function blockRow(b,isCur){const st=b.status==='done'?'✅':b.status==='skipped'?'⏭️':isCur?'▶️':'⬜';
  return `<div class="blk-row ${isCur?'cur':''} ${b.status}"><span>${st}</span><span class="blk-ico">${b.icon}</span><span class="blk-t">${esc(b.title)}</span><span class="small muted">${b.status==='done'?(b.xp?`+${b.xp} XP`:'done')+(b.acc!=null?` · ${Math.round(b.acc*100)}%`:''):b.reward?`up to ${b.reward} XP`:''}</span></div>`}
function taskCard(b){const g=unitModule()&&GRAMMAR[unitModule()];
  if(UI.rule===b.id&&g)return `<div class="card task-big"><div class="small muted">📖 Rule · unit ${esc(unitCode())}</div><h2>${esc(g.title)}</h2><div class="theory">${g.en}</div>${g.ru?`<div class="ru-line">${esc(g.ru)}</div>`:''}<button class="btn lg block" onclick="A.tRuleGo()">Got it → 3 questions</button></div>`;
  if(UI.brk&&UI.brk.id===b.id){const left=Math.max(0,300-(Date.now()-UI.brk.t0)/1000);
    return `<div class="card task-big center"><div style="font-size:48px">☕</div><h2>Break · <span id="brk-t">${mmss(left)}</span></h2><p>Stand up, drink water. Or play a game:</p><div class="ru-line">Встаньте, попейте воды. Или поиграйте:</div>
     <div class="grid g3" style="margin:12px 0"><button class="btn lg ghost" onclick="A.tPlay()">🧩 Match pairs</button><button class="btn lg ghost" onclick="go('/listening')">✍️ Dictation</button><button class="btn lg ghost" onclick="go('/pronunciation')">👂 Minimal pairs</button></div>
     <button class="btn lg block" onclick="A.tBrkDone()">Continue the plan →</button></div>`}
  if(UI.hwBlock===b.id){const hw=openHw();
    return `<div class="card task-big"><h2>📚 ${esc(S.users.teacher.name)}’s homework</h2><div class="ru-line">Сделайте Workbook вне сайта и отметьте здесь.</div>
     ${hw.length?hw.map(h=>`<div class="list-item"><div><b>${esc((h.instructions||h.title).split('\n')[0].slice(0,90))}</b><div class="small muted">${relDue(h.due)}</div></div><button class="btn" onclick="A.tHwMark('${h.id}')">✓ Done</button></div>`).join(''):'<p class="muted">No open homework. You can add it from WhatsApp on the Homework page.</p>'}
     <div class="row" style="margin-top:12px"><button class="btn lg" onclick="A.tHwBlockDone()">Next →</button><a class="btn ghost" href="#/homework">Add homework</a></div></div>`}
  if(UI.spkBlock===b.id)return `<div class="card task-big"><h2>${b.icon} ${esc(b.title)}</h2><p>${esc(b.task)}</p><div class="row"><a class="btn lg" href="#/speaking">Open speaking</a><button class="btn lg ghost" onclick="A.tSpkDone()">I recorded it ✓</button></div></div>`;
  return `<div class="card task-big"><div class="task-ico">${b.icon}</div><h2>${esc(b.title)}</h2><p class="task-text">${esc(b.task)}</p><div class="ru-line">${esc(b.ru||'')}</div>
   <div class="task-meta">${b.reward?`<span>🎖️ Reward: <b>up to ${b.reward} XP</b></span>`:b.kind==='mist'?'<span>🎖️ <b>+15 XP</b> for each fixed mistake</span>':''}${b.n?`<span>Progress: <b>0/${b.n}</b></span>`:''}</div>
   <div class="small muted">≥ 80% correct → full reward · less → half · not finished → 0</div>
   <button class="btn lg block" style="margin-top:14px" onclick="A.tStart('${b.id}')">Start</button>
   <button class="btn sm plain" style="margin-top:8px" onclick="A.tSkip('${b.id}')">Skip this block</button></div>`}
function vDayClosed(s){const ts=todayStats();const tm=recommended(new Date(Date.now()+864e5).getDay());const tmD=DAYS[new Date(Date.now()+864e5).getDay()];
  if(UI.dayEnd)return `<div class="card center stack day-closed"><div style="font-size:56px">🌙</div><h1>See you tomorrow!</h1>
    <div class="kpi-row"><div><b>${ts.mins}</b><span>min</span></div><div><b>+${ts.xp}</b><span>XP</span></div><div><b>${ts.acc==null?'—':ts.acc+'%'}</b><span>accuracy</span></div><div><b>${ts.words}</b><span>new words</span></div></div>
    <p>Tomorrow (${tmD}): <b>${MODES[tm].icon} ${MODES[tm].name} · ${MODES[tm].time}</b> — ${esc(MODES[tm].sub)}.</p><div class="ru-line">Завтра вас ждёт режим «${MODES[tm].ru.split(' · ')[0]}».</div>
    <a class="btn lg" href="#/today" onclick="UI.dayEnd=false">Back to Today</a></div>`;
  return `<div class="card center stack day-closed"><div style="font-size:56px">🎉</div><h1>Day closed ✓</h1><div class="ru-line">День закрыт. Отличная работа!</div>
   <div class="kpi-row"><div><b>${ts.mins}</b><span>min</span></div><div><b>+${ts.xp}</b><span>XP</span></div><div><b>${ts.acc==null?'—':ts.acc+'%'}</b><span>accuracy</span></div><div><b>${ts.words}</b><span>new words</span></div></div>
   <div class="stack" style="max-width:420px;margin:0 auto;width:100%"><button class="btn lg block" onclick="A.tMore5()">⏱️ 5 more minutes</button><button class="btn lg block ghost" onclick="A.tPlay()">🎮 Play</button><button class="btn lg block plain" onclick="A.tFinish()">🌙 Finish for today</button></div>
   <div class="whats-next small muted">What next? A short game keeps words fresh. Or finish — tomorrow is ${MODES[tm].name}.</div></div>`}
function vSession(){const s=current()||(UI.dayEnd?sessions().slice(-1)[0]:null);
  if(!s){if(UI.dayEnd)return vDayClosed(null);setTimeout(()=>go('/today'),0);return ''}
  const b=curBlock(s);const M=MODES[s.mode];const done=s.blocks.filter(x=>x.status!=='todo').length;
  if(!b||UI.dayEnd)return vDayClosed(s);
  return `<div class="page-head row between"><div><a class="small" href="#/today">← Today</a><h1>${M.icon} ${M.name} · ${M.time}</h1><div class="muted">Block ${done+1} of ${s.blocks.length}</div></div></div>
   <div class="bar" style="margin-bottom:16px"><i style="width:${pct(done,s.blocks.length)}%"></i></div>
   <div class="sess-grid">${taskCard(b)}<div class="card"><h3>Plan</h3>${s.blocks.map(x=>blockRow(x,x===b)).join('')}</div></div>`}
setInterval(()=>{const el=document.getElementById('brk-t');if(el&&UI.brk)el.textContent=mmss(Math.max(0,300-(Date.now()-UI.brk.t0)/1000))},1000);

/* ---------- background minutes ---------- */
A.tBg=n=>{const p=P();p.bg=p.bg||{};const k=dkey();p.bg[k]=(p.bg[k]||0)+n;save();toast(`🎧 +${n} min background listening (no XP)`);render()};

/* ---------- homework from WhatsApp ---------- */
function hwForm(){const nl=nextLesson();const due=nl?dkey(nl)+'T'+String(nl.getHours()).padStart(2,'0')+':'+String(nl.getMinutes()).padStart(2,'0'):dkey(addDays(new Date(),7))+'T09:00';
  return `<div class="card stack" style="margin-bottom:16px"><h2>➕ Add homework from WhatsApp</h2><p class="small muted">Copy ${esc(S.users.teacher.name)}’s message and set the deadline. It becomes a reminder in your plan.</p><div class="ru-line">Скопируйте текст ДЗ из WhatsApp и укажите срок.</div>
   <label class="f">Homework text<textarea id="whw-text" placeholder="e.g. Workbook p. 45 ex. 1–3, learn the words from 7B, retell the text"></textarea></label>
   <div class="grid g2"><label class="f">Deadline<input type="datetime-local" id="whw-due" value="${due}"></label><label class="f">Unit<input type="text" id="whw-unit" value="${esc(unitCode())}"></label></div>
   <div><button class="btn" onclick="A.tHwAdd()">Save homework</button></div></div>`}
A.tHwAdd=()=>{const text=($('#whw-text')||{}).value||'';const due=($('#whw-due')||{}).value;const unit=(($('#whw-unit')||{}).value||unitCode()).trim().toUpperCase();
  if(!text.trim())return toast('Paste the homework text first');if(!due)return toast('Set a deadline');
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const items=(lines.length>1?lines:[text.trim()]).slice(0,8).map(l=>/пересказ|retell/i.test(l)?{type:'retell',ref:'',label:l.slice(0,140)}:{type:'textbook',ref:'',label:l.slice(0,140)});
  const h={id:'hw-'+uid(),title:`Unit ${unit} · homework from WhatsApp`,instructions:text.trim(),due:new Date(due).toISOString(),est:30,priority:'normal',lesson:(unitLesson(unit)||{}).id||'',items,done:items.map(()=>false),status:'active',created:new Date().toISOString(),messages:[],feedback:'',source:'whatsapp',unit};
  S.homework.push(h);save();toast('Homework saved');go('/homework/'+h.id)};
const _hw=SV.homework;
SV.homework=function(id){const h=_hw.apply(this,arguments);if(id||!isStudent())return h;return h.replace('<div class="page-head"><h1>Homework</h1></div>','<div class="page-head"><h1>Homework</h1></div>'+hwForm())};

/* ---------- weekly report ---------- */
function weekData(){const from=addDays(new Date(),-6);from.setHours(0,0,0,0);const inWeek=d=>d&&new Date(d)>=from;
  let days=0,mins=0,bg=0;for(let i=0;i<7;i++){const k=dkey(addDays(new Date(),-i));if(S.activity[k]){days++;mins+=S.activity[k]}bg+=(P().bg||{})[k]||0}
  const ans=S.attempts.filter(a=>inWeek(a.date)).flatMap(a=>a.answers||[]);const c=ans.filter(a=>a.ok).length;
  const code=unitCode(),um=unitModule();const uAns=ans.filter(a=>a.topic===um);const uc=uAns.filter(a=>a.ok).length;
  const top=S.mistakes.slice().sort((a,b)=>b.count-a.count||new Date(b.date)-new Date(a.date)).slice(0,5).map(m=>{const q=ALLQ[m.qid];return q?{q:q.q,given:m.given,right:answerText(q),topic:topicName(q.topic),n:m.count}:null}).filter(Boolean);
  const newWords=S.vocab.filter(v=>inWeek(v.added)).length,learned=S.vocab.filter(v=>v.learned).length;
  const hws=S.homework.filter(h=>inWeek(h.created)||inWeek(h.due)||inWeek(h.submittedAt));
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
  return `<div class="page-head no-print"><h1>Weekly report 🧾</h1><p class="muted">One page for a screenshot, or copy the text into WhatsApp.</p><div class="ru-line">Сделайте скриншот или нажмите «Copy text» и вставьте в WhatsApp.</div><div class="row" style="margin-top:10px"><button class="btn" onclick="A.tCopyReport()">📋 Copy text for WhatsApp</button><button class="btn plain" onclick="window.print()">🖨️ Print / PDF</button></div></div>
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
SV.today=vToday;SV.session=vSession;SV.report=vReport;TV.report=vReport;
try{render()}catch(e){console.error(e)}
window.TS_TRAINER={unitCode,unitModule,unitQs,pastQs,sentences,build,startMode,current,sessions,complete,recommended,dueMistakes,weekData,reportText,todayStats,MODES,REWARD};
})();
