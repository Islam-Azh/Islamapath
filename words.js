/* ============================================================
   words.js — word cards from METHODIKA §5
     • two buttons: "Know" / "Don't know" (swipe right / left on a phone)
     • 5 boxes with intervals 1 → 3 → 7 → 14 → 30 days
     • "Don't know" → box 1 and once more at the end of this session
     • from box 3 the card is RU → EN with typing; "Know" counts only if typed right
     • one-letter typo in a word of 6+ letters is accepted, but the box does not grow
     • learned = passed box 5
   Public: TS_WORDS.start(n,{onDone,block}), TS_WORDS.shelves(), TS_WORDS.shelvesHtml()
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('words.js: main app not found');return}
const INT=[0,1,3,7,14,30];          // box → days until the next review
const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';

/* ---------- boxes ---------- */
function boxOf(c){if(c.box!=null)return c.box;               // migrate old SM-2 cards
  if(!c.reps)return 0;const i=c.interval||0;return i>=30?5:i>=14?4:i>=7?3:i>=3?2:1}
function migrate(){let ch=false;S.vocab.forEach(c=>{if(c.box==null){c.box=boxOf(c);ch=true}});return ch}
function shelves(){const s={n:0,b:[0,0,0,0,0,0],learned:0};S.vocab.forEach(c=>{if(c.learned)s.learned++;else s.b[boxOf(c)]++});s.n=S.vocab.length;return s}
function shelvesHtml(){const s=shelves();const max=Math.max(1,...s.b,s.learned);
  const col=(lbl,n,sub,cls)=>`<div class="shelf ${cls||''}"><div class="shelf-bar"><i style="height:${Math.round(n/max*100)}%"></i></div><b>${n}</b><div class="small">${lbl}</div><div class="tiny muted">${sub}</div></div>`;
  return `<div class="shelves">${col('New',s.b[0],'not seen','new')}${[1,2,3,4,5].map(b=>col('Box '+b,s.b[b],INT[b]+' d')).join('')}${col('Learned',s.learned,'✓','done')}</div>`}

/* ---------- answer check ---------- */
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(Math.abs(m-n)>1)return 2;let d=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){let prev=d[0];d[0]=i;for(let j=1;j<=n;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=t}}return d[n]}
const clean=s=>norm(s).replace(/^(to|a|an|the)\s+/,'').replace(/[.!?,;:]+$/,'').trim();
function checkWord(c,given){const g=clean(given);if(!g)return 'no';const forms=String(c.word).split(/\s*[\/;]\s*/).map(clean);
  if(forms.includes(g))return 'ok';
  if(forms.some(f=>f.length>=6&&lev(f,g)===1))return 'typo';return 'no'}

/* ---------- moving a card ---------- */
function move(c,res){// res: 'know' | 'dont' | 'typo'
  const b=boxOf(c),t=new Date();c.reps=(c.reps||0)+1;c.last=t.toISOString();
  c.hist=(c.hist||[]).concat([[dkey(t),res==='dont'?0:1]]).slice(-12);
  if(res==='dont'){c.box=1;c.learned=false;c.due=dkey(addDays(t,INT[1]))}
  else if(res==='typo'){c.box=Math.max(1,b);c.due=dkey(addDays(t,INT[c.box]))}
  else if(b>=5){c.learned=true;c.box=5;c.learnedAt=c.learnedAt||t.toISOString();c.due=dkey(addDays(t,90))}
  else{c.box=b+1;c.due=dkey(addDays(t,INT[c.box]))}
  c.interval=INT[c.box]||0}

/* ---------- retention → new words per day (METHODIKA §13) ---------- */
function retention(days=7){const from=dkey(addDays(new Date(),-days));let k=0,t=0;
  S.vocab.forEach(c=>(c.hist||[]).forEach(([d,ok])=>{if(d>=from){t++;k+=ok}}));return t>=20?k/t:null}
function tuneNewPerDay(){const r=retention();if(r==null)return;const p=P();const n=r<0.85?5:r>0.9?10:8;if(p.newPerDay!==n){p.newPerDay=n}}

/* ---------- session ---------- */
function queue(n){const t=dkey();
  return S.vocab.filter(c=>!c.learned&&c.due<=t).sort((a,b)=>boxOf(b)-boxOf(a)||String(a.due).localeCompare(String(b.due)))
    .slice(0,n).map(c=>c.id)}
function start(n,o={}){migrate();tuneNewPerDay();const q=shuffle(queue(n||20));
  if(!q.length){toast('No cards due right now ✓');if(o.onDone)o.onDone({n:0,known:0,acc:1,empty:true});return false}
  UI.wq={q,i:0,first:{},again:{},state:'ask',t0:Date.now(),n:q.length,block:!!o.block,onDone:o.onDone||null,back:o.back||'/today',title:o.title||'Words'};
  go('/words');return true}
function cur(){const w=UI.wq;return w&&S.vocab.find(c=>c.id===w.q[w.i])}
function typed(c){return boxOf(c)>=3}
function answer(res){const w=UI.wq,c=cur();if(!w||!c||w.state!=='ask')return;
  if(typed(c)&&res==='know'){const el=$('#wtype');const v=el?el.value:'';const r=checkWord(c,v);w.given=v;res=r==='ok'?'know':r==='typo'?'typo':'dont';w.typed=r}
  else w.typed=null;
  const firstTime=!(c.id in w.first);if(firstTime)w.first[c.id]=res!=='dont';
  move(c,res);
  if(res==='dont'&&!w.again[c.id]){w.again[c.id]=1;w.q.push(c.id)}
  if(isStudent()&&!w.block&&res!=='dont'&&window.TS_PROGRAM)TS_PROGRAM.award(2,'vocab');
  w.res=res;w.state='shown';save();render();setTimeout(()=>{const b=$('#wnext');if(b)b.focus()},0)}
function next(){const w=UI.wq;if(!w)return;w.i++;w.state='ask';w.res=null;w.given='';if(w.i>=w.q.length)return finish();render();setTimeout(()=>{const el=$('#wtype');if(el)el.focus()},0)}
function finish(){const w=UI.wq;const ids=Object.keys(w.first);const known=ids.filter(k=>w.first[k]).length;
  logMinutes(Math.min((Date.now()-w.t0)/60000,60));w.state='done';w.result={n:ids.length,known,acc:ids.length?known/ids.length:1};save();if(Cloud.flushNow)Cloud.flushNow();render()}
function close(){const w=UI.wq;UI.wq=null;const cb=w&&w.onDone,res=w&&w.result,back=w&&w.back;if(cb&&res){cb(res)}else go(back||'/today')}
function quit(){const w=UI.wq;UI.wq=null;save();go(w&&w.back||'/today')}

/* ---------- view ---------- */
function vWords(){const w=UI.wq;
  if(!w)return `<div class="page-head"><h1>Words 🃏</h1><p class="muted">Cards come back after 1 → 3 → 7 → 14 → 30 days.</p><div class="ru-line">Карточки возвращаются через 1 → 3 → 7 → 14 → 30 дней.</div></div>
   <div class="card">${shelvesHtml()}</div><div class="row" style="margin-top:16px"><button class="btn lg" onclick="TS_WORDS.start(20)">Start 20 cards</button><button class="btn lg ghost" onclick="go('/vocabulary')">All my words</button></div>`;
  if(w.state==='done'){const r=w.result;return `<div class="card center stack" style="max-width:560px;margin:0 auto"><div style="font-size:48px">🃏</div><h2>Cards done ✓</h2>
    <div class="kpi">${r.known}/${r.n}</div><div class="muted">known the first time · ${Math.round(r.acc*100)}%</div>${shelvesHtml()}
    <button class="btn lg" id="wnext" onclick="TS_WORDS.close()">${w.onDone?'Next →':'Done'}</button></div>`}
  const c=cur();if(!c){w.i++;return w.i>=w.q.length?(finish(),''):vWords()}
  const b=boxOf(c),ty=typed(c),total=w.q.length;
  const head=`<div class="row between" style="margin-bottom:12px"><div><b>${esc(w.title)}</b> <span class="muted small">· ${Math.min(w.i+1,total)}/${total}</span></div><button class="btn sm plain" onclick="TS_WORDS.quit()">Quit</button></div>
   <div class="bar" style="margin-bottom:16px"><i style="width:${Math.round(w.i/total*100)}%"></i></div>`;
  const boxTag=`<span class="badge">${b?'Box '+b:'New word'}</span>`;
  let front,back='';
  if(ty){front=`<div class="small muted">Translate into English · ${boxTag}</div><div class="wcard-word ru-big">${esc(c.ru)}</div>
     ${w.state==='ask'?`<input id="wtype" class="big-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the English word" onkeydown="if(event.key==='Enter'){event.preventDefault();TS_WORDS.answer('know')}">`:''}`}
  else front=`<div class="small muted">Do you know this word? · ${boxTag}</div><div class="wcard-word">${esc(c.word)} <button class="btn sm plain" onclick="event.stopPropagation();speak(${jsq(c.word)})" aria-label="Listen">🔊</button></div>${c.ipa?`<div class="muted">${esc(c.ipa)}</div>`:''}`;
  if(w.state==='shown'){const r=w.res;
    const verdict=r==='know'?`<div class="fb ok"><b>✓ ${ty?'Correct!':'Great!'}</b> → ${c.learned?'learned ⭐':'Box '+c.box}</div>`:r==='typo'?`<div class="fb warn"><b>Almost!</b> One letter is wrong: you wrote “${esc(w.given)}”. The box stays the same.</div>`:`<div class="fb bad"><b>${ty&&w.typed==='no'&&w.given?`✗ You wrote “${esc(w.given)}”`:'No problem'}</b> — the card goes back to box 1 and comes again at the end.</div>`;
    back=`<div class="wcard-back"><div class="wcard-ans">${esc(c.word)} — ${esc(c.ru)}</div>${c.ex?`<div class="muted"><i>${esc(c.ex)}</i></div>`:''}</div>${verdict}
     <button class="btn lg block" id="wnext" onclick="TS_WORDS.next()">Next →</button>`}
  const btns=w.state==='ask'?`<div class="grid g2 wbtns"><button class="btn lg bad-btn" onclick="TS_WORDS.answer('dont')">❌ Don't know</button><button class="btn lg ok-btn" onclick="TS_WORDS.answer('know')">✅ ${ty?'Check':'Know'}</button></div>
     <div class="tiny muted center" style="margin-top:8px">${ty?'Enter = check':'← Don\'t know · Know → · swipe on a phone'}</div>`:'';
  return head+`<div class="card wcard" id="wcard">${front}${back}</div>${btns}`}

/* keyboard + swipe */
document.addEventListener('keydown',e=>{const w=UI.wq;if(!w||location.hash!=='#/words'||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(w.state==='ask'){const c=cur();if(c&&typed(c))return;if(e.key==='ArrowRight'){e.preventDefault();answer('know')}else if(e.key==='ArrowLeft'){e.preventDefault();answer('dont')}}
  else if(w.state==='shown'&&(e.key==='Enter'||e.key===' '||e.key==='ArrowRight')){e.preventDefault();next()}});
let tx=null,ty0=null;
document.addEventListener('touchstart',e=>{if(!UI.wq||location.hash!=='#/words'||!e.target.closest('#wcard'))return;tx=e.touches[0].clientX;ty0=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty0;tx=null;
  const w=UI.wq;if(!w||Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx))return;
  if(w.state==='ask'){const c=cur();if(c&&typed(c)&&dx>0)return answer('know');answer(dx>0?'know':'dont')}else if(w.state==='shown'&&dx>0)next()},{passive:true});

/* ---------- wiring ---------- */
SV.words=vWords;
A.startReview=()=>start(20);
const _vVocab=SV.vocabulary;
SV.vocabulary=function(){if(UI.vtab==='review'){UI.vs=null;return `${_vVocab.apply(this,arguments).split('<div class="card empty">')[0]}<div class="card">${shelvesHtml()}<div class="row" style="margin-top:16px"><button class="btn lg" onclick="TS_WORDS.start(20)">Start cards (${queue(40).length} due)</button></div></div>`}return _vVocab.apply(this,arguments)};
if(migrate())save();
window.TS_WORDS={start,answer,next,close,quit,shelves,shelvesHtml,checkWord,move,boxOf,queue,retention};
})();
