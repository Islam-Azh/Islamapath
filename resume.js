/* ============================================================
   resume.js — METHODIKA §17 / D51: nothing is lost
     • an unfinished exercise (grammar run, word cards, boss, speaking) is saved after every answer
       in S.program.resume and continues from the same question on any device
     • the home page shows "Continue: … · question N of M"; after 24 h it offers "Start over"
     • red bar on the live site when the cloud is not connected; sync diagnostics in Settings
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('resume.js: main app not found');return}
const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const DAY=864e5;
const KEEP=['title','kind','mode','back','planBlock','blockXp','lessonId','glevel','mistakeMode','clearMistakes','record','showAnswers','testId','timeLimit','reshuffle'];
const plain=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function setResume(r){if(!isStudent())return;P().resume=Object.assign({at:new Date().toISOString()},r)}
function clearResume(){if(P().resume){delete P().resume}}

/* ---------- grammar / practice runs ---------- */
const _listRun=listRun;
listRun=function(o,qs){o=o||{};o._qids=(qs||[]).map(q=>q.id);return _listRun(o,qs)};
function snapRun(){const r=RUN;if(!r||!isStudent()||r.kind==='placement'||r.kind==='test'||!r._qids||r.state==='done')return;
  const opts={};KEEP.forEach(k=>{if(r[k]!==undefined&&typeof r[k]!=='function')opts[k]=plain(r[k])});
  if(r.hw&&typeof r.hw==='object')opts.hw=plain(r.hw);
  setResume({type:'run',title:r.title,i:r.answers.length,total:r._qids.length,qids:r._qids,answers:plain(r.answers),opts})}
const _submit=submit;
submit=function(g){_submit(g);try{if(RUN&&RUN.state!=='done')snapRun();save()}catch(e){console.error(e)}};
let RESUMING=false;
const _startRun=startRun;
startRun=function(o,restore){_startRun(o,restore);try{if(RUN&&!RESUMING){snapRun();save()}}catch(e){console.error(e)}};
const _finish=finishRun;
finishRun=function(){const r=RUN;
  if(r&&r._resumed&&r.kind==='lesson'&&r.lessonId&&r.answers.length&&isStudent()){const sc=r.answers.filter(a=>a.ok).length/r.answers.length;const p=S.lessonProgress[r.lessonId]||{best:0,done:false};p.best=Math.max(p.best,sc);p.done=p.done||sc>=0.6;S.lessonProgress[r.lessonId]=p}
  if(r&&r.kind==='minitest'&&r._resumed&&isStudent()){const code=window.TS_TRAINER?TS_TRAINER.unitCode():'';const c=r.answers.filter(a=>a.ok).length;const mt=P().minitest=P().minitest||{};(mt[code]=mt[code]||[]).push({date:new Date().toISOString(),c,t:r.answers.length})}
  if(P().resume&&P().resume.type==='run')clearResume();
  _finish()};
function continueRun(rs){const qs=rs.qids.map(id=>ALLQ[id]).filter(Boolean);if(qs.length!==rs.qids.length){toast('Some questions are no longer available — starting over');clearResume();save();return render()}
  const o=Object.assign({},rs.opts);RESUMING=true;try{_listRun(Object.assign(o,{_qids:rs.qids}),qs)}finally{RESUMING=false}
  RUN._resumed=true;RUN.answers=rs.answers||[];RUN.i=RUN.answers.length;
  if(RUN.i>=RUN.total){finishRun();return}
  RUN.q=RUN.next(RUN);prepQ();save();render()}

/* ---------- word cards ---------- */
function wrapWords(){const W=window.TS_WORDS;if(!W||W._resumeWrapped)return;W._resumeWrapped=true;
  const snap=()=>{const w=UI.wq;if(!w||!isStudent()||w.state==='done')return;
    setResume({type:'words',title:w.title||'Words',i:w.i,total:w.q.length,q:w.q.slice(),first:plain(w.first),again:plain(w.again),block:!!w.block,planBlock:w.planBlock||null,back:w.back})};
  const _a=W.answer,_n=W.next,_c=W.close,_q=W.quit,_s=W.start;
  W.answer=function(){const r=_a.apply(this,arguments);snap();save();return r};
  W.next=function(){const r=_n.apply(this,arguments);if(UI.wq&&UI.wq.state==='done'){if(P().resume&&P().resume.type==='words')clearResume();save()}else{snap();save()}return r};
  W.close=function(){if(P().resume&&P().resume.type==='words')clearResume();save();return _c.apply(this,arguments)};
  W.quit=function(){return _q.apply(this,arguments)};
  W.start=function(n,o){const ok=_s.apply(this,arguments);if(ok&&UI.wq){UI.wq.planBlock=o&&o.planBlock||null;snap();save()}return ok}}
function continueWords(rs){const w={q:rs.q,i:rs.i,first:rs.first||{},again:rs.again||{},state:'ask',t0:Date.now(),n:rs.q.length,block:rs.block,back:rs.back||'/today',title:rs.title,planBlock:rs.planBlock,
  onDone:rs.planBlock&&window.TS_TRAINER?res=>{TS_TRAINER.complete(rs.planBlock,res.empty?null:res.acc);go('/session')}:null};
  UI.wq=w;go('/words')}

/* ---------- boss + speaking ---------- */
function wrapOthers(){
  if(window.TS_LEVELS&&!TS_LEVELS._rw){TS_LEVELS._rw=true;const _in=A.bossInput;A.bossInput=(i,v)=>{_in(i,v);const b=UI.boss;if(b&&isStudent()){setResume({type:'boss',title:'Boss · '+topicName(b.t),t:b.t,ans:b.ans.slice(),planBlock:b.planBlock||null,i:b.ans.filter(Boolean).length,total:5});save()}};
    const _sub=A.bossSubmit;A.bossSubmit=()=>{_sub();if(UI.boss&&UI.boss.sent&&P().resume&&P().resume.type==='boss'){clearResume();save()}};
    const _bs=TS_LEVELS.bossStart;TS_LEVELS.bossStart=function(t,o){_bs(t,o);if(UI.boss)UI.boss.planBlock=o&&o.planBlock||null}}
  if(window.TS_SPEAK&&!TS_SPEAK._rw){TS_SPEAK._rw=true;const _st=TS_SPEAK.start;TS_SPEAK.start=function(kind,o){_st(kind,o);const s=UI.sk;if(s&&isStudent()&&kind!=='interview'){s.planBlock=o&&o.planBlock||null;setResume({type:'speak',title:'Speaking · '+(TS_SPEAK.KINDS[kind]||{}).name,kind,taskId:s.task&&s.task.id||null,planBlock:s.planBlock,i:0,total:1});save()}};
    const _save=A.skSave;A.skSave=async function(){await _save.apply(this,arguments);if(UI.sk&&UI.sk.saved&&P().resume&&P().resume.type==='speak'){clearResume();save()}}}}

function doContinue(){const rs=P().resume;if(!rs)return;
  if(rs.type==='run')return continueRun(rs);
  if(rs.type==='words')return continueWords(rs);
  if(rs.type==='boss'&&window.TS_LEVELS){TS_LEVELS.bossStart(rs.t,{planBlock:rs.planBlock,back:rs.planBlock?'/session':'/grammar/'+rs.t,onDone:rs.planBlock&&window.TS_TRAINER?()=>{TS_TRAINER.complete(rs.planBlock,1);go('/session')}:null});if(UI.boss)UI.boss.ans=(rs.ans||[]).concat(['','','','','']).slice(0,5);return render()}
  if(rs.type==='speak'&&window.TS_SPEAK)return TS_SPEAK.start(rs.kind,{taskId:rs.taskId,planBlock:rs.planBlock,back:rs.planBlock?'/session':'/speak',onDone:rs.planBlock&&window.TS_TRAINER?res=>{TS_TRAINER.complete(rs.planBlock,res&&res.ok===false?null:1);go('/session')}:null})}
function startOver(){const rs=P().resume;clearResume();save();if(rs&&rs.planBlock&&window.TS_TRAINER&&TS_TRAINER.current()){const b=TS_TRAINER.current().blocks.find(x=>x.id===rs.planBlock);if(b&&b.status==='todo'){go('/session');return}}render()}
function resumeCard(){const rs=P().resume;if(!rs||!isStudent())return '';const old=Date.now()-new Date(rs.at)>DAY;
  const step=rs.type==='boss'?`${rs.i} of 5 sentences`:rs.type==='speak'?'recording':`question ${Math.min(rs.i+1,rs.total)} of ${rs.total}`;
  return `<div class="card resume-card"><div><div class="small muted">${old?'Started more than a day ago':'Not finished'}</div><b>▶ Continue: ${esc(rs.title||'')} · ${step}</b><div class="ru-line">${old?'Прошло больше суток — лучше начать заново. Блок не засчитан.':'Продолжите с того же места.'}</div></div>
   <div class="row">${old?'':`<button class="btn lg" onclick="TS_RESUME.go()">Continue</button>`}<button class="btn ${old?'lg':'ghost'}" onclick="TS_RESUME.over()">Start over</button></div></div>`}
const _today=SV.today;
SV.today=function(){wrapWords();wrapOthers();const h=_today.apply(this,arguments);const c=resumeCard();if(!c)return h;const i=h.indexOf('<div class="mode-grid">');return i<0?c+h:h.slice(0,i)+c+h.slice(i)};

/* ---------- red bar + diagnostics ---------- */
function bar(){if(!S||!S.role)return '';
  if(!Cloud.on&&/netlify\.app$/.test(location.hostname))return `<div class="sync-bar bad">⚠️ The cloud is not connected — progress is saved only in this browser. <button class="btn sm" onclick="A.exportJSON()">Save a copy</button><span class="ru-line">Облако не подключено — прогресс сохраняется только в этом браузере.</span></div>`;
  if(Cloud.on&&Cloud.booted&&!Cloud.ready)return `<div class="sync-bar warn">⚠️ No connection to the server. Your work is kept on this device and will be saved when the connection is back.</div>`;
  if(Cloud.on&&Cloud.relogin)return `<div class="sync-bar warn">⚠️ Session expired — <a href="#" onclick="A.logout();return false">sign in again</a> to save your progress. Nothing is lost.</div>`;
  return ''}
function diag(){if(!Cloud.on)return `<div class="card stack"><h2>☁️ Saving</h2><p>Demo mode: everything is stored in this browser only.</p><button class="btn" onclick="A.exportJSON()">Export backup (JSON)</button></div>`;
  const ch=Cloud.changed?Cloud.changed():[];const log=(P().syncLog||[]).slice(-8).reverse();
  return `<div class="card stack" id="sync-diag"><h2>☁️ Saving · diagnostics</h2><div class="ru-line">Если кажется, что что-то не сохраняется, сделайте скриншот этого блока.</div>
   <div class="small">Cloud: <b>${Cloud.on?'on':'off'}</b> · connected: <b>${Cloud.ready?'yes':'no'}</b> · user: <b>${esc(Cloud.user&&Cloud.user.email||'—')}</b> · role: <b>${esc(S.role)}</b></div>
   <div class="small">Status: <b>${esc(Cloud.status||'—')}</b> · last saved: <b>${Cloud.lastSaved?new Date(Cloud.lastSaved).toLocaleString():'—'}</b>${Cloud.lastError?` · last error: <b style="color:var(--bad)">${esc(Cloud.lastError)}</b>`:''}</div>
   <div class="small">Waiting to be saved: <b>${ch.length?esc(ch.join(', ')):'nothing'}</b></div>
   <details><summary class="small">Server versions</summary><div class="small">${Object.entries(Cloud.ver||{}).map(([k,v])=>`${esc(k)}: ${esc(v?new Date(v).toLocaleString():'—')}`).join('<br>')}</div></details>
   ${log.length?`<details><summary class="small">Errors (${log.length})</summary><div class="small">${log.map(esc).join('<br>')}</div></details>`:''}
   <div class="row"><button class="btn" onclick="Cloud.flushNow().then(()=>render())">Save now</button><button class="btn ghost" onclick="A.exportJSON()">Export backup (JSON)</button></div></div>`}
const _set=SV.settings;SV.settings=function(){return diag()+_set.apply(this,arguments)};
if(TV.settings){const _ts=TV.settings;TV.settings=function(){return diag()+_ts.apply(this,arguments)}}
const _render=render;
function putBar(){const m=document.querySelector('main');const old=document.querySelector('.sync-bar');if(old)old.remove();const h=bar();if(m&&h)m.insertAdjacentHTML('afterbegin',h)}
render=function(){_render();try{putBar()}catch(e){console.error(e)}};
window.addEventListener('hashchange',()=>{try{putBar()}catch(e){}});
wrapWords();wrapOthers();
window.TS_RESUME={go:doContinue,over:startOver,get:()=>P().resume,snapRun};
})();
