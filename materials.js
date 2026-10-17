/* ============================================================
   materials.js — learning materials for Teacher & Student
   Reads data/manifest.json and every file listed there, checks each
   item, skips broken ones and reports them on the Materials page.
   Adds: before/after tests, RU→EN cards, daily drip of new words,
   "too easy / OK / too hard / report a mistake" buttons, pilot metrics.
   Loaded by program.js. Files: grammar-*, vocab-*, reading-*,
   listening-*, baseline-*, placement.json (formats in README).
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'||typeof GRAMMAR==='undefined'){console.error('materials.js: main app not found');return}

const MAT={loading:true,loaded:false,error:'',files:[],problems:[],baseline:{},packs:{},meta:{},_ids:new Set()};
window.TS_MATERIALS=MAT;
const TYPES=['mc','gap','fix','order','tf','tr'];
const DRIP_PER_DAY=8;
const isStudent=()=>S&&S.role==='student';
const P=()=>S.program||(S.program={});
const lvNum=l=>LVNUM[l]!=null?LVNUM[l]:2;
const pct=(c,t)=>t?Math.round(c/t*100):0;

/* ---------- 1. Checks ---------- */
function checkQ(q){
 if(!q||typeof q!=='object')return ['not an object'];
 const p=[];
 if(!q.id)p.push('no id');else if(MAT._ids.has(q.id))p.push('duplicate id');
 if(!TYPES.includes(q.type))p.push('unknown type “'+q.type+'”');
 if(!q.q||!String(q.q).trim())p.push('empty question');
 if(q.type==='mc'){
  if(!Array.isArray(q.opts)||q.opts.length<2)p.push('needs 2+ options');
  else{if(new Set(q.opts.map(norm)).size!==q.opts.length)p.push('duplicate options');
   if(!Number.isInteger(q.a)||q.a<0||q.a>=q.opts.length)p.push('answer number out of range')}}
 if(q.type==='tr'&&(!Array.isArray(q.a)||!q.a.length||q.a.some(x=>!String(x).trim())))p.push('translation answers must be a non-empty list');
 if(q.type==='gap'||q.type==='fix'){
  if(!Array.isArray(q.a)||!q.a.length||q.a.some(x=>!String(x).trim()))p.push('answers must be a non-empty list');
  else if(q.type==='fix'){const m=String(q.q).match(/“(.*)”/);if(m&&q.a.some(x=>norm(x)===norm(m[1])))p.push('an accepted answer equals the mistake')}
  if(q.type==='gap'&&!/_{3}/.test(q.q)&&q.dir!=='ru-en')p.push('no ___ gap in the sentence')}
 if(q.type==='order'&&(typeof q.a!=='string'||q.a!==q.a.toLowerCase()||/[.!?]$/.test(q.a)||q.a.trim().split(/\s+/).length<2))p.push('order answer: lowercase words, no full stop');
 if(q.type==='tf'&&typeof q.a!=='boolean')p.push('true/false answer must be true or false');
 return p}
function bad(file,item,msg){MAT.problems.push({file,item,msg})}
function warn(file,item,msg){MAT.problems.push({file,item,msg,warn:true})}
function goodQs(qs,file){const ok=[];
 (Array.isArray(qs)?qs:[]).forEach((q,i)=>{const p=checkQ(q);if(p.length)bad(file,(q&&q.id)||'#'+(i+1),p.join('; '));else{MAT._ids.add(q.id);if(!q.exp)warn(file,q.id,'no explanation');ok.push(q)}});
 return ok}

/* ---------- 2. Apply each kind of file ---------- */
function applyGrammar(d,file){
 if(!d||!d.id||!d.title||!d.en){bad(file,d&&d.id||'',"needs id, title and en");return 0}
 const qs=goodQs(d.qs,file);qs.forEach(q=>Object.assign(q,{topic:d.id,skill:'grammar',level:d.level||'B1'}));
 if(qs.length<15)warn(file,d.id,`${qs.length} questions (target 15–40)`);
 if(d.unit)qs.forEach(q=>q.unit=String(d.unit).toUpperCase());
 GRAMMAR[d.id]={title:d.title,level:d.level||'B1',en:d.en,ru:d.ru||'',qs,src:file,unit:d.unit?String(d.unit).toUpperCase():'',track:d.track||''};return qs.length}
function applyVocab(d,file){
 const pack=file.replace(/^vocab-/,'').replace(/\.json$/,'');let n=0;const seen=new Set();
 if(!Array.isArray(d)){bad(file,'','must be a list of words');return 0}
 {const u=(d.find(w=>w&&w.unit)||{}).unit||(/^\d{1,2}[a-c]$/i.test(pack)?pack:'');if(u)(MAT.packUnit=MAT.packUnit||{})[pack]=String(u).toUpperCase()}
 d.forEach((w,i)=>{const miss=['word','ru'].filter(k=>!w||!String(w[k]||'').trim());
  if(miss.length)return bad(file,'#'+(i+1),'missing '+miss.join(', '));
  if(seen.has(w.word))return warn(file,w.word,'duplicate word in this file');seen.add(w.word);
  if(!w.ipa)warn(file,w.word,'no IPA');if(!w.ex)warn(file,w.word,'no example');
  if(!VOCAB_LIB.some(v=>v[0]===w.word&&v[4]===pack))VOCAB_LIB.push([w.word,w.ipa||'',w.ru,w.ex||'',pack]);
  MAT.meta[w.word]={level:w.level||'',rank:w.rank||null,pack};n++});
 MAT.packs[pack]=n;return n}
function applyText(d,file,kind){
 if(!d||!d.id||!d.text){bad(file,d&&d.id||'','needs id and text');return 0}
 const qs=goodQs(d.qs,file);const words=d.text.trim().split(/\s+/).length;
 if(words<150||words>300)warn(file,d.id,`${words} words (target 150–300)`);
 const obj={title:d.title||d.id,level:d.level||'B1',lv:lvNum(d.level),text:d.text,qs,src:file};
 qs.forEach(q=>Object.assign(q,kind==='reading'?{passage:d.id,skill:'reading',level:obj.level,topic:'Reading'}:{audio:d.id,skill:'listening',level:obj.level,topic:'Listening'}));
 (kind==='reading'?PASSAGES:AUDIO)[d.id]=obj;return qs.length}
function applyBaseline(d,file){
 if(!d||!d.id){bad(file,'','needs id');return 0}
 const qs=goodQs(d.qs,file);qs.forEach(q=>{q.skill=q.dir?'vocabulary':'grammar';if(!q.topic)q.topic=q.dir?'Vocabulary':'Other'});
 MAT.baseline[d.id]={id:d.id,title:d.title||d.id,note:d.note||'',qs,src:file};return qs.length}
function applyPlacement(d,file){
 if(!Array.isArray(d)){bad(file,'','must be a list');return 0}let n=0;
 d.forEach((r,i)=>{const q={id:r.id||'pm-'+(i+1),type:'mc',q:r.q,opts:r.opts,a:r.a};const p=checkQ(q);
  if(!(Number.isInteger(r.lv)&&r.lv>=0&&r.lv<=4))p.push('lv must be 0–4');
  if(p.length)return bad(file,q.id,p.join('; '));MAT._ids.add(q.id);
  PLACEMENT.push(Object.assign(q,{lv:r.lv,level:LV5[r.lv],topic:r.topic||'',skill:r.skill==='vocabulary'?'vocabulary':'grammar'}));n++});
 return n}

/* ---------- 3. Load ---------- */
async function getJSON(name){const r=await fetch('data/'+name,{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function load(){
 try{const man=await getJSON('manifest.json');
  for(const f of (man.files||[])){const rec={file:f,kind:f.split('-')[0].replace('.json',''),items:0,status:'ok'};MAT.files.push(rec);
   try{const d=await getJSON(f);const k=rec.kind;
    rec.items=k==='grammar'?applyGrammar(d,f):k==='vocab'?applyVocab(d,f):k==='reading'?applyText(d,f,'reading'):k==='listening'?applyText(d,f,'listening'):k==='baseline'?applyBaseline(d,f):k==='placement'?applyPlacement(d,f):k==='work'?applyGrammar(Object.assign({track:'work'},d),f):(rec.status='unknown kind',0)}
   catch(e){rec.status='error';bad(f,'','could not read the file: '+(e.message||e))}
   rec.errors=MAT.problems.filter(p=>p.file===f&&!p.warn).length;rec.warnings=MAT.problems.filter(p=>p.file===f&&p.warn).length;
   if(rec.status==='ok'&&rec.errors)rec.status='partly loaded'}}
 catch(e){MAT.error=location.protocol==='file:'?'The browser blocks data files opened as file://. Open the site through Netlify or a local web server.':'data/manifest.json was not found ('+(e.message||e)+'). Upload the data folder together with the site.'}
 MAT.loading=false;MAT.loaded=true;indexQuestions();drip();try{render()}catch(e){console.error(e)}}

/* ---------- 4. Before / after tests ---------- */
const results=()=>{const p=P();return p.baseline||(p.baseline={})};
const PARTS={'ru-en':'RU → EN','en-ru':'EN → RU'};
const partName=k=>PARTS[k]||topicName(k);
A.mBaseline=id=>{const t=MAT.baseline[id];if(!t||!t.qs.length)return toast('This test is not loaded');
 const qs=t.qs[0].dir?t.qs.slice():shuffle(t.qs);
 listRun({title:t.title,mode:'test',kind:'baseline',testId:id,back:'/baseline',showAnswers:true,onFinish:r=>{
  const by={};r.answers.forEach(a=>{const q=r.qmap[a.qid];const k=q&&q.dir?q.dir:(a.topic||'Other');by[k]=by[k]||{c:0,t:0};by[k].t++;if(a.ok)by[k].c++});
  const c=r.answers.filter(a=>a.ok).length,n=r.answers.length;const L=results();(L[id]=L[id]||[]).push({date:new Date().toISOString(),c,t:n,by,secs:Math.round((r.end-r.start)/1000)});
  const ids=new Set(t.qs.map(q=>q.id));S.mistakes=S.mistakes.filter(m=>!ids.has(m.qid));
  notify('teacher',`${S.users.student.name} finished “${t.title}”: ${c}/${n}`,'/t/materials');
  setTimeout(drip,0)}},qs)};
MAT.nextStepHook=()=>{const tests=Object.values(MAT.baseline);if(!tests.length)return null;const L=results();
 const todo=tests.find(t=>!(L[t.id]&&L[t.id].length));
 if(todo)return {phase:0,label:'Before test: '+todo.title,hint:`${todo.qs.length} questions · no hints until the end · take it before the pilot`,js:"go('/baseline')"};
 const after=new Date()>=new Date('2026-11-01T00:00:00')&&tests.find(t=>L[t.id].length===1);
 if(after)return {phase:1,label:'After test: '+after.title,hint:'Pilot finished — take the same test again to measure progress',js:"go('/baseline')"};
 return null};
function attemptsTable(id){const L=(results()[id]||[]);if(!L.length)return '<div class="small muted">Not taken yet.</div>';
 const parts=[...new Set(L.flatMap(a=>Object.keys(a.by||{})))];
 return `<div class="tbl"><table><tr><th>Date</th><th>Score</th>${parts.map(p=>`<th>${esc(partName(p))}</th>`).join('')}<th>Time</th></tr>${L.map((a,i)=>`<tr><td>${fmtD(a.date)} ${i===0?'<span class="badge">before</span>':i===L.length-1?'<span class="badge acc">latest</span>':''}</td><td><b>${pct(a.c,a.t)}%</b> <span class="small muted">${a.c}/${a.t}</span></td>${parts.map(p=>{const b=a.by&&a.by[p];return `<td>${b?pct(b.c,b.t)+'%':'—'}</td>`}).join('')}<td>${mmss(a.secs||0)}</td></tr>`).join('')}</table></div>
  ${L.length>1?`<div class="small" style="margin-top:6px">Change: <b style="color:${L[L.length-1].c/L[L.length-1].t>=L[0].c/L[0].t?'var(--ok)':'var(--bad)'}">${pct(L[L.length-1].c,L[L.length-1].t)-pct(L[0].c,L[0].t)>=0?'+':''}${pct(L[L.length-1].c,L[L.length-1].t)-pct(L[0].c,L[0].t)} points</b> since the first attempt</div>`:''}`}
function vBaseline(){
 const tests=Object.values(MAT.baseline);
 const head=`<div class="page-head"><h1>Before / after tests 📏</h1><p class="muted">Take each test once before the pilot and again after it (from 1 November). No hints until the end — answer what you really know. ${ru('Тесты «до / после»: пройди их до начала пилота и повтори после 1 ноября. Подсказок нет до конца — отвечай честно, так виден реальный прогресс.')}</p></div>`;
 if(MAT.loading)return head+'<div class="card empty">Loading materials…</div>';
 if(MAT.error)return head+`<div class="fb bad">${esc(MAT.error)}</div>`;
 if(!tests.length)return head+'<div class="card empty">No before/after tests in data/manifest.json.</div>';
 return head+`<div class="grid g2">${tests.map(t=>{const n=(results()[t.id]||[]).length;const min=Math.max(5,Math.round(t.qs.length*(t.qs[0].dir?0.1:0.35)));
  return `<div class="card stack"><div class="row between"><h2>${esc(t.title)}</h2><span class="badge">${t.qs.length} questions · ~${min} min</span></div><div class="small muted">${esc(t.note)}</div>${attemptsTable(t.id)}<div><button class="btn" onclick="A.mBaseline('${esc(t.id)}')">${n?'Take again':'Start'}</button></div></div>`}).join('')}</div>
  <p class="small muted" style="margin-top:12px"><a href="#/materials">Materials status & pilot metrics →</a></p>`}

/* ---------- 5. New words: a few per day, after the before-test ---------- */
function drip(){
 if(!isStudent()||!MAT.loaded||!Object.keys(MAT.packs).length)return;
 const L=results();if(MAT.baseline['baseline-words']&&!(L['baseline-words']&&L['baseline-words'].length))return;
 const p=P();p.drip=p.drip||{};const k=dkey();if(p.drip[k]!=null)return;
 const have=new Set(S.vocab.map(c=>c.word.toLowerCase()));
 if(dueCards().length>40){p.drip={[k]:0};save();return}
 const cu=(p.unit||'').toUpperCase(),pu=MAT.packUnit||{};const rank=pk=>pu[pk]===cu?0:pu[pk]?2:1;
 const queue=Object.keys(MAT.packs).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b)).flatMap(pk=>VOCAB_LIB.filter(v=>v[4]===pk&&!have.has(v[0].toLowerCase())));
 const add=queue.slice(0,p.newPerDay||DRIP_PER_DAY);add.forEach(v=>S.vocab.push(mkCard(v)));
 p.drip={[k]:add.length};save();
 if(add.length)setTimeout(()=>toast(`🃏 ${add.length} new words added to your cards today`),900)}

/* ---------- 6. Cards in both directions ---------- */
function cardDir(c){const mode=S.settings.cardDir||'mix';if(mode!=='mix')return mode;let h=0;for(const ch of c.id)h=(h*31+ch.charCodeAt(0))%997;return (h+(c.reps||0))%2?'ru-en':'en-ru'}
const _vocab=SV.vocabulary;
SV.vocabulary=function(){let h=_vocab.apply(this,arguments);const vs=UI.vs;
 if(UI.vtab!=='review'||!vs||vs.i>=vs.queue.length)return h;const c=S.vocab.find(x=>x.id===vs.queue[vs.i]);if(!c)return h;
 const dir=cardDir(c);
 h=h.replace(`<span>Card ${vs.i+1} / ${vs.queue.length}</span>`,`<span>Card ${vs.i+1} / ${vs.queue.length} <span class="badge ${dir==='ru-en'?'warn':'acc'}">${PARTS[dir]}</span></span>`);
 if(dir==='ru-en'&&!vs.flip)h=h.replace(`<div class="word">${esc(c.word)}</div><button class="btn sm plain" onclick="A.say('${c.id}')">🔊 Listen</button>`,`<div class="word">${esc(c.ru)}</div><div class="small muted">Say the English word out loud, then check.</div>`);
 return h};
const _settings=SV.settings;
SV.settings=function(){const m=S.settings.cardDir||'mix';return _settings.apply(this,arguments)+`<div class="card stack" style="margin-top:16px;max-width:520px"><h2>Flashcards</h2><label class="f">Card direction<select onchange="A.set('cardDir',this.value)">${[['mix','Mixed: EN → RU and RU → EN (recommended)'],['en-ru','English → Russian only'],['ru-en','Russian → English only']].map(o=>`<option value="${o[0]}" ${m===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></label><div class="small muted">RU → EN trains speaking: you recall the English word yourself. ${ru('Направление RU → EN тренирует речь: английское слово нужно вспомнить самому.')}</div></div>`};
A.rate=(f=>q=>{const p=P();p.rates=p.rates||{};const k=dkey();(p.rates[k]=p.rates[k]||[0,0,0,0])[[1,3,4,5].indexOf(q)]++;const ks=Object.keys(p.rates).sort();while(ks.length>60)delete p.rates[ks.shift()];return f(q)})(A.rate);

/* ---------- 7. Feedback on every exercise ---------- */
function fbRow(qid){const f=(P().feedback||[]).filter(x=>x.qid===qid);const mine=f.length?f[f.length-1].kind:'';
 return `<div class="row small" style="margin-top:10px"><span class="muted">This exercise:</span>${[['easy','Too easy'],['ok','OK'],['hard','Too hard'],['error','⚑ Report a mistake']].map(([k,t])=>`<button class="chip ${mine===k?'on':''}" onclick="A.mFeedback('${esc(qid)}','${k}')">${t}</button>`).join('')}</div>`}
const _run=SV.run;
SV.run=function(){const h=_run.apply(this,arguments);return RUN&&RUN.state==='feedback'&&RUN.q?h+fbRow(RUN.q.id):h};
A.mFeedback=(qid,kind)=>{const p=P();p.feedback=p.feedback||[];let note='';
 if(kind==='error'){note=prompt('What is wrong with this exercise? (optional)')||''}
 p.feedback.push({qid,kind,note,date:new Date().toISOString()});p.feedback=p.feedback.slice(-300);
 if(kind==='error')notify('teacher','Exercise reported: '+qid+(note?' — '+note:''),S.role==='teacher'?'/t/materials':'/t/materials');
 save();render();toast(kind==='error'?'Thanks — your teacher will check it.':'Thanks!')};

/* ---------- 8. Materials page: status + pilot metrics ---------- */
function qText(id){const q=ALLQ[id]||Object.values(MAT.baseline).flatMap(t=>t.qs).find(x=>x.id===id);return q?q.q:id}
function firstTry(){const seen={},out={};
 S.attempts.filter(a=>a.kind!=='baseline').sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(a=>(a.answers||[]).forEach(x=>{if(seen[x.qid])return;seen[x.qid]=1;const k=x.topic||'Other';out[k]=out[k]||{c:0,t:0};out[k].t++;if(x.ok)out[k].c++}));
 return out}
function metric(label,val,target,ok,note){return `<tr><td>${label}</td><td><b>${val}</b></td><td class="small muted">${target}</td><td>${ok==null?'<span class="badge">no data</span>':ok?'<span class="badge ok">on target</span>':'<span class="badge warn">check</span>'}</td><td class="small muted">${note||''}</td></tr>`}
function vMaterials(){
 const head=`<div class="page-head"><h1>Materials 📦</h1><p class="muted">Files loaded from <code>data/</code>, problems found by the automatic check, and pilot metrics. ${ru('Файлы из папки data, ошибки автопроверки и метрики пилота. Испорченные вопросы на сайт не попадают.')}</p></div>`;
 if(MAT.loading)return head+'<div class="card empty">Loading materials…</div>';
 const errs=MAT.problems.filter(p=>!p.warn),warns=MAT.problems.filter(p=>p.warn);
 const files=`<div class="card" style="margin-bottom:16px"><div class="row between"><h2>Files</h2><span class="small">${errs.length?`<span class="badge bad">${errs.length} errors</span>`:'<span class="badge ok">0 errors</span>'} <span class="badge ${warns.length?'warn':''}">${warns.length} warnings</span></span></div>
  ${MAT.error?`<div class="fb bad">${esc(MAT.error)}</div>`:''}
  ${MAT.files.length?`<div class="tbl"><table><tr><th>File</th><th>Kind</th><th>Loaded</th><th>Status</th></tr>${MAT.files.map(f=>`<tr><td><code>${esc(f.file)}</code></td><td>${esc(f.kind)}</td><td>${f.items}</td><td>${f.status==='ok'?'<span class="badge ok">ok</span>':`<span class="badge ${f.status==='error'?'bad':'warn'}">${esc(f.status)}</span>`}${f.warnings?` <span class="small muted">${f.warnings} warnings</span>`:''}</td></tr>`).join('')}</table></div>`:'<div class="empty">No files loaded.</div>'}
  ${MAT.problems.length?`<details style="margin-top:10px" ${errs.length?'open':''}><summary class="small">Problems (${MAT.problems.length})</summary><div class="tbl"><table><tr><th></th><th>File</th><th>Item</th><th>Problem</th></tr>${MAT.problems.slice(0,200).map(p=>`<tr><td>${p.warn?'⚠️':'❌'}</td><td class="small"><code>${esc(p.file)}</code></td><td class="small">${esc(p.item)}</td><td class="small">${esc(p.msg)}</td></tr>`).join('')}</table></div></details>`:''}</div>`;
 const ft=firstTry();const dataTopics=Object.entries(GRAMMAR).filter(([k,g])=>g.src).map(([k])=>k);
 const ftAll=dataTopics.reduce((s,k)=>{const x=ft[k];if(x){s.c+=x.c;s.t+=x.t}return s},{c:0,t:0});
 const rates=Object.entries(P().rates||{}).filter(([k])=>k>=dkey(addDays(new Date(),-13))).reduce((s,[,v])=>v.map((x,i)=>s[i]+x),[0,0,0,0]);
 const rTot=rates.reduce((a,b)=>a+b,0),ret=rTot?(rates[2]+rates[3])/rTot:null;
 const days=last7().n;const fb=P().feedback||[];const votes={easy:0,ok:0,hard:0};fb.forEach(f=>{if(votes[f.kind]!=null)votes[f.kind]++});const vTot=votes.easy+votes.ok+votes.hard;
 const mtab=`<div class="card" style="margin-bottom:16px"><h2>Pilot metrics</h2><p class="small muted">Targets from ROADMAP.md. Pilot topics: ${dataTopics.map(k=>esc(topicName(k))).join(', ')||'—'}.</p><div class="tbl"><table><tr><th>Metric</th><th>Now</th><th>Target</th><th></th><th>Note</th></tr>
  ${metric('First-try accuracy, pilot topics',ftAll.t?pct(ftAll.c,ftAll.t)+'%':'—','70–85%',ftAll.t?(ftAll.c/ftAll.t>=0.7&&ftAll.c/ftAll.t<=0.85):null,ftAll.t?`${ftAll.c}/${ftAll.t} first answers · lower = too hard, higher = too easy`:'')}
  ${dataTopics.map(k=>{const x=ft[k];return metric('· '+esc(topicName(k)),x?pct(x.c,x.t)+'%':'—','70–85%',x?(x.c/x.t>=0.7&&x.c/x.t<=0.85):null,x?`${x.c}/${x.t}`:'')}).join('')}
  ${metric('Card retention (Good / Easy), 14 days',ret==null?'—':Math.round(ret*100)+'%','85–90%',ret==null?null:ret>=0.85,rTot?`${rTot} reviews`:'')}
  ${metric('Active days, last 7',days+'/7','≥ 4',days>=4)}
  ${metric('Difficulty votes',vTot?`easy ${votes.easy} · ok ${votes.ok} · hard ${votes.hard}`:'—','most “OK”',vTot?votes.ok>=Math.max(votes.easy,votes.hard):null)}
  </table></div></div>`;
 const tests=Object.values(MAT.baseline);
 const base=`<div class="card" style="margin-bottom:16px"><div class="row between"><h2>Before / after</h2><a class="small" href="#${S.role==='teacher'?'/t':''}/baseline">${S.role==='teacher'?'':'Open tests →'}</a></div>${tests.length?tests.map(t=>`<h3 style="margin-top:10px">${esc(t.title)}</h3>${attemptsTable(t.id)}`).join(''):'<div class="empty">No tests loaded.</div>'}</div>`;
 const reports=fb.filter(f=>f.kind==='error');
 const rep=`<div class="card"><h2>Reported mistakes (${reports.length})</h2>${reports.length?`<div class="tbl"><table><tr><th>Date</th><th>Exercise</th><th>Note</th></tr>${reports.slice().reverse().map(r=>`<tr><td class="small">${fmtDT(r.date)}</td><td class="small"><code>${esc(r.qid)}</code> ${esc(qText(r.qid))}</td><td class="small">${esc(r.note||'—')}</td></tr>`).join('')}</table></div>`:'<div class="empty">Nothing reported yet.</div>'}</div>`;
 return head+files+mtab+base+rep}

/* ---------- 9. Wire in ---------- */
SV.baseline=vBaseline;SV.materials=vMaterials;TV.materials=vMaterials;TV.baseline=vBaseline;
const pli=STUDENT_NAV.findIndex(n=>n&&n[0]==='placement');STUDENT_NAV.splice(pli<0?0:pli+1,0,['baseline','Before / after tests','📏']);
const sti=STUDENT_NAV.findIndex(n=>n&&n[0]==='settings');STUDENT_NAV.splice(sti<0?STUDENT_NAV.length:sti,0,['materials','Materials','📦']);
const tsi=TEACHER_NAV.findIndex(n=>n&&n[0]==='analytics');TEACHER_NAV.splice(tsi<0?TEACHER_NAV.length:tsi+1,0,['materials','Materials & pilot','📦']);
window.addEventListener('hashchange',()=>{if(MAT.loaded)drip()});
try{render()}catch(e){}
load();
})();
