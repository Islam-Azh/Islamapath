/* ============================================================
   levels.js — one grammar topic as a game (METHODIKA §6)
     📖 Theory → 🟢 1 Warm-up (mc, tf) → 🟡 2 Practice (gap, order) → 🟠 3 Build it (fix, tr) → ⚔️ Boss
     next level opens at ≥ 70 %; stars ★ ≥ 70 %, ★★ ≥ 85 %, ★★★ = 100 %
     question field "stage": 1|2|3, otherwise by type
   Public: TS_LEVELS.next(topic), .startLevel(topic,lvl,o), .bossStart(topic,o), .stars(topic,lvl), .summary(topic)
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof SV==='undefined'){console.error('levels.js: main app not found');return}
const P=()=>S.program||(S.program={});
const isStudent=()=>S&&S.role==='student';
const LV=[null,
  {n:1,name:'Warm-up',ru:'Разминка: узнать форму',icon:'🟢',size:10},
  {n:2,name:'Practice',ru:'Практика: вставить, собрать',icon:'🟡',size:10},
  {n:3,name:'Build it',ru:'Строю сам: исправить, перевести',icon:'🟠',size:15}];
const PASS=0.7;
function stageOf(q){if(q.stage>=1&&q.stage<=3)return +q.stage;return {mc:1,tf:1,gap:2,order:2,fix:3,tr:3}[q.type]||2}
function qsOf(t,l){const g=GRAMMAR[t];return g?g.qs.filter(q=>stageOf(q)===l):[]}
function rec(t){const p=P();p.glev=p.glev||{};return p.glev[t]=p.glev[t]||{}}
function best(t,l){const r=rec(t)[l];return r?r.best:null}
function passed(t,l){if(!qsOf(t,l).length)return true;const b=best(t,l);return b!=null&&b>=PASS}
function open(t,l){return l===1||passed(t,l-1)&&open(t,l-1)}
function bossOpen(t){return [1,2,3].every(l=>passed(t,l))}
function bossDone(t){return !!((P().boss||{})[t])}
function starsN(b){return b==null?0:b>=1?3:b>=0.85?2:b>=PASS?1:0}
function starsHtml(n){return `<span class="stars" aria-label="${n} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(3-n)}</span></span>`}
function next(t){for(const l of [1,2,3])if(qsOf(t,l).length&&!passed(t,l))return {lvl:l};if(!bossDone(t))return {boss:true};return {lvl:3,review:true}}
function summary(t){const ls=[1,2,3].filter(l=>qsOf(t,l).length);const st=ls.reduce((s,l)=>s+starsN(best(t,l)),0);return {stars:st,max:ls.length*3,boss:bossDone(t),levels:ls.length}}

/* ---------- level run ---------- */
function startLevel(t,l,o={}){const g=GRAMMAR[t];if(!g)return toast('Topic not found');
  if(!open(t,l)&&!o.force)return toast('Finish the previous level first (70%)');
  const qs=shuffle(qsOf(t,l)).slice(0,LV[l].size);if(!qs.length)return toast('No exercises for this level yet');
  listRun(Object.assign({title:`${g.title} · Level ${l}`,kind:'practice',back:'/grammar/'+t,reshuffle:true,glevel:{t,l},
    onFinish:r=>{const c=r.answers.filter(a=>a.ok).length,n=r.answers.length;if(!n)return;const sc=c/n;const x=rec(t);const before=x[l]?x[l].best:null;
      x[l]={best:Math.max(before||0,sc),last:sc,date:new Date().toISOString(),tries:((x[l]&&x[l].tries)||0)+1};
      if(sc>=PASS&&(before==null||before<PASS))setTimeout(()=>toast(l<3?`🔓 Level ${l+1} is open!`:'⚔️ Boss is open!'),300)}},o),qs)}

/* ---------- boss ---------- */
function bossData(t){const g=GRAMMAR[t]||{};const b=g.boss||{};
  return {situation:b.situation||`Write 5 sentences about your work using “${g.title||t}”. Think about reports, meetings, audits, risks and control.`,
    ru:b.ru||'Напишите 5 предложений о своей работе с этой грамматикой.',samples:Array.isArray(b.samples)?b.samples:[],check:Array.isArray(b.check)?b.check:[]}}
function bossStart(t,o={}){UI.boss={t,ans:['','','','',''],sent:false,onDone:o.onDone||null,back:o.back||'/grammar/'+t,t0:Date.now()};go('/boss/'+encodeURIComponent(t))}
A.bossInput=(i,v)=>{if(UI.boss)UI.boss.ans[i]=v};
A.bossSubmit=()=>{const b=UI.boss;if(!b)return;b.ans=[0,1,2,3,4].map(i=>(($('#boss'+i)||{}).value||'').trim());
  const filled=b.ans.filter(x=>wc(x)>=3).length;if(filled<5)return toast(`Write all 5 sentences (at least 3 words each) — now ${filled}/5`);
  const d=bossData(b.t);const hits=d.check.length?b.ans.map(a=>d.check.some(re=>{try{return new RegExp(re,'i').test(a)}catch(e){return false}})):null;
  const p=P();p.boss=p.boss||{};p.boss[b.t]={date:new Date().toISOString(),answers:b.ans};b.sent=true;b.hits=hits;
  logMinutes(Math.min((Date.now()-b.t0)/60000,30));save();render()};
A.bossToTeacher=()=>{const b=UI.boss;if(!b)return;const d=bossData(b.t);const id='w-'+uid();
  S.subs.push({id,type:'writing',taskId:'boss-'+b.t,prompt:'Boss · '+topicName(b.t)+': '+d.situation,text:b.ans.map((a,i)=>`${i+1}. ${a}`).join('\n'),pre:[],status:'submitted',date:new Date().toISOString()});
  notify('teacher',`${S.users.student.name} sent Boss sentences: ${topicName(b.t)}`,'/t/review/'+id);b.toTeacher=true;save();toast('Sent to '+S.users.teacher.name);render()};
A.bossShare=()=>{const b=UI.boss;if(!b)return;const text=`⚔️ Boss · ${topicName(b.t)}\n`+b.ans.map((a,i)=>`${i+1}. ${a}`).join('\n');
  if(navigator.share){navigator.share({text}).catch(()=>{})}else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank')};
A.bossClose=()=>{const b=UI.boss;UI.boss=null;if(b&&b.onDone)b.onDone({acc:1,n:5});else go(b?b.back:'/grammar')};
function vBoss(t){const b=UI.boss&&UI.boss.t===t?UI.boss:null;const g=GRAMMAR[t];if(!g)return '<div class="card">Topic not found.</div>';
  if(!b){bossStart(t);return ''}
  const d=bossData(t);
  if(!b.sent)return `<div class="page-head"><a class="small" href="#/grammar/${esc(t)}">← ${esc(g.title)}</a><h1>⚔️ Boss · ${esc(g.title)}</h1></div>
   <div class="card stack"><div class="task-card"><b>Situation</b><div style="font-size:1.1em;margin-top:6px">${esc(d.situation)}</div><div class="ru-line">${esc(d.ru)}</div></div>
   ${[0,1,2,3,4].map(i=>`<label class="f">Sentence ${i+1}<input id="boss${i}" type="text" value="${esc(b.ans[i])}" oninput="A.bossInput(${i},this.value)" autocomplete="off"></label>`).join('')}
   <button class="btn lg" onclick="A.bossSubmit()">Check my sentences</button><div class="small muted">After you send, you will see sample answers to compare.</div></div>`;
  return `<div class="page-head"><h1>⚔️ Boss defeated ✓</h1><p class="muted">Compare your sentences with the samples.</p><div class="ru-line">Сравните свои предложения с образцами.</div></div>
   <div class="grid g2"><div class="card stack"><h2>Your sentences</h2>${b.ans.map((a,i)=>`<div>${b.hits?(b.hits[i]?'✅':'🔸'):''} ${i+1}. ${esc(a)}</div>`).join('')}
     ${b.hits&&b.hits.some(h=>!h)?`<div class="small muted">🔸 = the site did not find the unit grammar in this sentence. Check it.</div>`:''}</div>
    <div class="card stack"><h2>Samples</h2>${d.samples.length?d.samples.map(s=>`<div>• ${esc(s)} <button class="btn sm plain" onclick="speak(${jsq(s)})">🔊</button></div>`).join(''):'<div class="muted small">Samples for this topic are coming from the methodist.</div>'}</div></div>
   <div class="row" style="margin-top:16px"><button class="btn lg" onclick="A.bossClose()">${b.onDone?'Next →':'Done'}</button>
    <button class="btn ghost" ${b.toTeacher?'disabled':''} onclick="A.bossToTeacher()">${b.toTeacher?'Sent ✓':'Send to '+esc(S.users.teacher.name)}</button>
    <button class="btn ghost" onclick="A.bossShare()">📤 Share</button></div>`}

/* ---------- topic page ---------- */
const _vGrammar=SV.grammar;
function vTopic(t){const g=GRAMMAR[t];const sm=summary(t);const nx=next(t);
  const tile=l=>{const L=LV[l],n=qsOf(t,l).length,op=open(t,l),b=best(t,l);
    return `<div class="tile lvl ${op?'':'locked'} ${n?'':'empty'}"><div class="tile-ico">${op?L.icon:'🔒'}</div><div class="tile-body"><b>${l}. ${L.name}</b><div class="ru-line">${L.ru}</div>
      <div class="small muted">${n?`${Math.min(n,L.size)} tasks`:'no tasks yet'}${b!=null?` · best ${Math.round(b*100)}%`:''}</div>${starsHtml(starsN(b))}</div>
      ${n?`<button class="btn ${op?'':'plain'}" ${op?'':'disabled'} onclick="TS_LEVELS.startLevel(${jsq(t)},${l})">${b==null?'Start':'Again'}</button>`:''}</div>`};
  const bo=bossOpen(t),bd=bossDone(t);
  return `<div class="page-head"><a href="#/grammar" class="small">← Grammar</a><h1>${esc(g.title)} <span class="badge acc">${esc(g.level||'')}</span>${g.unit?` <span class="badge">${esc(g.unit)}</span>`:''}</h1>
    <div class="muted">${sm.stars}/${sm.max} ★ ${bd?'· ⚔️ boss defeated':''}</div></div>
   <div class="card theory"><h2>📖 Theory</h2>${g.en}${g.ru?`<div class="ru-line" style="margin-top:10px">${esc(g.ru)}</div>`:''}</div>
   <div class="stack" style="margin-top:16px">${[1,2,3].map(tile).join('')}
    <div class="tile lvl boss ${bo?'':'locked'}"><div class="tile-ico">${bo?'⚔️':'🔒'}</div><div class="tile-body"><b>Boss</b><div class="ru-line">5 своих предложений по ситуации о работе</div><div class="small muted">${bd?'defeated ✓':bo?'open':'opens after level 3 (70%)'}</div></div>
     <button class="btn ${bo?'':'plain'}" ${bo?'':'disabled'} onclick="TS_LEVELS.bossStart(${jsq(t)})">${bd?'Again':'Fight'}</button></div></div>
   <div class="whats-next card"><b>What next?</b> ${nx.boss?'Fight the boss ⚔️':nx.review?'All done — repeat level 3 or open the next unit.':`Level ${nx.lvl}: ${LV[nx.lvl].name}`}</div>`}
SV.grammar=function(t){if(t&&GRAMMAR[t])return vTopic(t);return _vGrammar.apply(this,arguments)};
SV.boss=vBoss;
window.TS_LEVELS={next,startLevel,bossStart,stageOf,qsOf,best,passed,open,bossOpen,bossDone,starsN,starsHtml,summary,LV};
})();
