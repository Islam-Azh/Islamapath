/* ============================================================
   trainer.js — the personal trainer from METHODIKA.md v2.2
     §3  Home: 4 modes — Minute 1–2 (pick 1 of 5) · Focus 10 (1 skill of 6 or mixed) · Training 30 (core + 2 skills) · Full 60 (all skills)
     §4  task card before every block, XP per block (≥80% full, <80% half, unfinished 0), Full bonus +50,
         pause in Full, "Day closed" screen with 3 buttons; homework is a card on Home, not a block
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

/* ---------- sessions: 4 modes with a choice of skill (METHODIKA v2.2 §3–§4, task D53) ---------- */
const MODES={
  minute:{icon:'⚡',name:'Minute',time:'1–2 min',ru:'Минутка · в очереди, в перерыве',sub:'Pick 1 of 5: words, sentences, say, rule, sounds',cls:'m-micro'},
  focus:{icon:'🟢',name:'Focus',time:'10 min',ru:'Фокус · подтянуть что-то одно',sub:'Pick 1 skill of 6 — or mixed',cls:'m-short'},
  training:{icon:'🟡',name:'Training',time:'30 min',ru:'Тренировка · обычный день',sub:'Core (words + mistakes) + 2 skills you pick',cls:'m-std'},
  full:{icon:'🔴',name:'Full',time:'60 min',ru:'Полная · все навыки, без выбора',sub:'All 6 skills in a row, no choice',cls:'m-full'}};
const MODE_ALIAS={micro:'minute',short:'focus',standard:'training'};
const modeOf=m=>MODES[m]||MODES[MODE_ALIAS[m]]||MODES.full;
const REWARD={cards:20,sent:30,mist:30,glevel:50,read:30,listen:30,dict:10,iv:50,say:10,speakfull:50,boss:100,write:100,minute:10,rule:10,game:10,sounds:10,pause:0,FULL_BONUS:50};
const SKILLS={
  words:{icon:'🃏',name:'Words',ru:'Слова',xp:'vocab',cls:'sk-words'},
  grammar:{icon:'📐',name:'Grammar',ru:'Грамматика',xp:'grammar',cls:'sk-grammar'},
  reading:{icon:'📖',name:'Reading',ru:'Чтение',xp:'reading',cls:'sk-reading'},
  listening:{icon:'🎧',name:'Listening',ru:'Аудирование',xp:'listening',cls:'sk-listening'},
  speaking:{icon:'🎙️',name:'Speaking',ru:'Говорение',xp:'speaking',cls:'sk-speaking'},
  writing:{icon:'✍️',name:'Writing',ru:'Письмо',xp:'writing',cls:'sk-writing'},
  mixed:{icon:'🎲',name:'Mixed',ru:'Смешанный',xp:null,cls:'sk-mixed'}};
const MINUTE={
  words:{icon:'🃏',name:'Words',ru:'Слова',inside:'10 cards',xp:'vocab',cls:'sk-words'},
  sentences:{icon:'🔀',name:'Sentences',ru:'Предложения',inside:'5 questions on your topic',xp:'grammar',cls:'sk-grammar'},
  say:{icon:'🎙️',name:'Say it',ru:'Скажи',inside:'1 interview question · 10 s to think, up to 60 s',xp:'speaking',cls:'sk-speaking'},
  rule:{icon:'📖',name:'Rule',ru:'Правило',inside:'the rule of your topic + 3 questions',xp:'grammar',cls:'sk-grammar'},
  sounds:{icon:'👂',name:'Sounds',ru:'Звуки',inside:'10 minimal pairs',xp:'pron',cls:'sk-listening'}};
const FOCUS_INSIDE={words:'20 cards + a pairs game',grammar:'theory (if new) + 10 questions of your next level',reading:'1 text + questions; unknown words → cards',
  listening:'1 recording + questions + dictation of 3 sentences',speaking:'2 interview questions',writing:'Boss: 5 of your own sentences → samples',mixed:'10 cards + 5 sentences + 1 interview question'};
const TRAIN_PICK=['grammar','reading','listening','speaking','writing'];
const recommended=(d=new Date().getDay())=>[1,3,5].includes(d)?'full':'training';
function sessions(k=dkey()){const p=P();p.sess=p.sess||{};if(isStudent()){const ks=Object.keys(p.sess).sort();while(ks.length>21)delete p.sess[ks.shift()]}return p.sess[k]||(isStudent()?(p.sess[k]=[]):[])}
const current=()=>{const l=sessions();const s=l[l.length-1];return s&&!s.closed?s:null};
function blk(kind,o){const b=Object.assign({kind,status:'todo',reward:REWARD[kind]||0},o);b.id=b.id||kind+'-'+uid();return b}

/* weakest skills = least XP in the last 7 days */
function xp7(){const out={};const d=(P().daily)||{};for(let i=0;i<7;i++){const x=d[dkey(addDays(new Date(),-i))];if(x&&x.sx)Object.entries(x.sx).forEach(([k,v])=>out[k]=(out[k]||0)+v)}return out}
function weakest(list,map){const x=xp7();return list.slice().filter(k=>avail(k).ok).sort((a,b)=>(x[map[a].xp]||0)-(x[map[b].xp]||0))}

/* material for each skill */
function pickText(kind){const src=kind==='reading'?PASSAGES:AUDIO;const seen=(P().seenText||{});const keys=Object.keys(src).filter(k=>src[k].qs&&src[k].qs.length);
  if(!keys.length)return null;const tag=k=>kind+':'+k;const fresh=keys.filter(k=>!seen[tag(k)]||Date.now()-new Date(seen[tag(k)])>=14*864e5);
  if(fresh.length){const nv=fresh.filter(k=>!seen[tag(k)]);const k=(nv.length?nv:fresh).sort((a,b)=>String(seen[tag(a)]||'').localeCompare(String(seen[tag(b)]||'')))[0];return {k,repeat:!!seen[tag(k)]}}
  const k=keys.sort((a,b)=>String(seen[tag(a)]).localeCompare(String(seen[tag(b)])))[0];return {k,repeat:true}}
function markSeen(kind,k){const p=P();p.seenText=p.seenText||{};p.seenText[kind+':'+k]=new Date().toISOString()}
function avail(skill){const m=unitModule();
  switch(skill){case 'words':case 'sentences':return {ok:!!(S.vocab.length||VOCAB_LIB.length)||skill==='sentences'&&(unitQs().length+pastQs().length)>0};
    case 'grammar':case 'rule':case 'writing':return {ok:!!m};
    case 'reading':{const t=pickText('reading');return {ok:!!t,repeat:t&&t.repeat}}
    case 'listening':{const t=pickText('listening');return {ok:!!t,repeat:t&&t.repeat}}
    case 'speaking':case 'say':return {ok:!SP()||!SP().ivStats||SP().ivStats().avail>0};
    case 'sounds':return {ok:typeof MIN_PAIRS!=='undefined'&&MIN_PAIRS.length>0};
    default:return {ok:true}}}

/* block builders */
const B={
  cards:(n,o)=>blk('cards',Object.assign({n,icon:'🃏',title:'Words',task:`Go through ${n} cards. Done when every card is answered.`,ru:`Пройди ${n} карточек: «Знаю» или «Не знаю».`,skill:'vocab',min:Math.max(1,Math.round(n/4))},o)),
  game:()=>blk('game',{n:5,icon:'🧩',title:'Pairs game',task:'Match 5 English words with their translations.',ru:'Соедини 5 слов с переводом.',skill:'vocab',min:2}),
  sent:(n,o)=>{const u=unitCode();return blk('sent',Object.assign({n,icon:'🔀',title:o&&o.past?'Sentences from earlier units':'Sentences',task:o&&o.past?`Make ${n} sentences from earlier units.`:`Make ${n} sentences on unit ${u}.`,ru:'Составь предложения: выбор, пропуск, порядок, исправление, перевод.',skill:'grammar',min:5},o))},
  mistOrPast:n=>{const dm=dueMistakes().length;return dm?blk('mist',{n:Math.min(n,dm),icon:'🔁',title:'Mistakes',task:`Fix ${Math.min(n,dm)} mistakes that are due. +15 XP for each fixed one.`,ru:'Исправь ошибки, у которых наступил срок. +15 XP за каждую.',skill:'grammar',min:5}):B.sent(5,{past:true})},
  grammar:(o)=>{const m=unitModule();const g=m&&GRAMMAR[m];return blk('glevel',Object.assign({icon:'📐',title:`Grammar ${unitCode()}${g?' · '+g.title:''}`,task:'Theory if the level is new, then 10 questions of your next level. The next level opens at 70%.',ru:'Следующий незакрытый уровень темы урока.',n:10,skill:'grammar',min:10,theory:true},o))},
  read:()=>blk('read',{icon:'📖',title:'Reading',task:'Read 1 text and answer the questions. Tap unknown words to add them to your cards.',ru:'Прочитай текст и ответь на вопросы. Незнакомые слова — в карточки.',skill:'reading',min:8}),
  listen:()=>blk('listen',{icon:'🎧',title:'Listening',task:'Listen to 1 recording and answer the questions.',ru:'Послушай запись и ответь на вопросы.',skill:'listening',min:8}),
  dict:()=>blk('dict',{n:3,icon:'✍️',title:'Dictation · 3 sentences',task:'Listen and type 3 sentences.',ru:'Послушай и напиши 3 предложения.',skill:'listening',min:2}),
  iv:n=>blk('iv',{n,icon:'🎙️',title:n===1?'Interview question':`${n} interview questions`,task:`Answer ${n} interview question${n>1?'s':''}: ${n>1?'20 s to think, up to 90 s each':'20 s to think, up to 90 s'}.`,ru:'Вопросы интервью по ротации: новые и давно не виденные.',skill:'speaking',min:n*3}),
  say:()=>blk('say',{n:1,icon:'🎙️',title:'Say it',task:'1 interview question: 10 s to think, answer up to 60 s.',ru:'1 вопрос интервью: 10 секунд подумать, до 60 секунд ответ.',skill:'speaking',reward:REWARD.minute,min:2}),
  speakfull:()=>blk('speakfull',{icon:'🎙️',title:'Speaking · retell + 2 questions',task:'Retell the text from reading or listening (up to 3 min), then answer 2 interview questions.',ru:'Перескажи текст из блока «Чтение» или «Аудирование» (до 3 минут) + 2 вопроса интервью. Пересказ из ДЗ — вместо первого.',skill:'speaking',min:12}),
  boss:()=>{const m=unitModule();return blk('boss',{icon:'✍️',title:`Writing · Boss${m?' · '+GRAMMAR[m].title:''}`,task:'Write 5 of your own sentences about work with this grammar. Then compare with the samples. You can send them to '+S.users.teacher.name+'.',ru:'5 своих предложений о работе → образцы → по желанию Айнуре.',n:5,skill:'writing',min:10})},
  write:()=>blk('write',{icon:'✍️',title:'Writing · 60–100 words',task:'Write 60–100 words about the situation. You can send it to '+S.users.teacher.name+'.',ru:'60–100 слов по ситуации → по желанию Айнуре.',skill:'writing',min:8}),
  rule:()=>blk('rule',{icon:'📖',title:'Rule + 3 questions',task:`Read the rule of unit ${unitCode()} and answer 3 questions.`,ru:'Прочитай правило и ответь на 3 вопроса.',n:3,reward:REWARD.minute,skill:'grammar',min:2}),
  sounds:()=>blk('sounds',{n:10,icon:'👂',title:'Sounds · 10 minimal pairs',task:'Listen and choose the word you hear — 10 times.',ru:'Послушай и выбери слово — 10 раз.',reward:REWARD.minute,skill:'pron',min:2}),
  pause:()=>blk('pause',{icon:'☕',title:'Pause · 2 min',task:'Stand up, drink water. You can skip the pause.',ru:'Пауза 2 минуты — можно пропустить.',min:2})};
function focusPlan(k){switch(k){
  case 'words':return [B.cards(20),B.game()];
  case 'grammar':return [B.grammar()];
  case 'reading':return [B.read()];
  case 'listening':return [B.listen(),B.dict()];
  case 'speaking':return [B.iv(2)];
  case 'writing':return [B.boss()];
  case 'mixed':return [B.cards(10),B.sent(5),B.iv(1)];}return []}
function build(mode,pick){pick=pick||[];
  if(mode==='minute'){const k=pick[0]||'words';const b=k==='words'?B.cards(10):k==='sentences'?B.sent(5):k==='say'?B.say():k==='rule'?B.rule():B.sounds();b.reward=REWARD.minute;return [b]}
  if(mode==='focus')return focusPlan(pick[0]||'mixed');
  if(mode==='training'){const sel=pick.slice(0,2).sort((a,b)=>(['speaking','writing'].includes(a)?1:0)-(['speaking','writing'].includes(b)?1:0));
    return [B.cards(15),B.mistOrPast(8)].concat(...sel.map(focusPlan))}
  const m=unitModule();const nx=m&&L()?L().next(m):{lvl:1};
  return [B.cards(25),B.mistOrPast(8),B.grammar({theory:false,full:true}),B.read(),B.listen(),B.pause(),B.speakfull(),(m&&L()&&L().bossDone(m))||!m?B.write():B.boss()]}
function startMode(mode,pick,extra){const l=sessions();const s={id:'s-'+uid(),mode,pick:pick||[],start:new Date().toISOString(),xp0:S.game?S.game.xp:0,blocks:extra||build(mode,pick),closed:false};
  if(current())current().closed=true;l.push(s);save();go('/session')}
A.tMode=m=>{if(!isStudent())return toast('Only '+S.users.student.name+' can start lessons');if(m==='full')return startMode('full');UI.pick={mode:m,sel:defaultPick(m)};go('/choose/'+m)};
function defaultPick(m){if(m==='minute')return [weakest(Object.keys(MINUTE),MINUTE)[0]||'words'];if(m==='focus')return [weakest(Object.keys(SKILLS).filter(k=>k!=='mixed'),SKILLS)[0]||'mixed'];
  if(m==='training')return weakest(TRAIN_PICK,SKILLS).slice(0,2);return []}
A.tPick=k=>{const p=UI.pick;if(!p)return;if(p.mode==='training'){const i=p.sel.indexOf(k);if(i>=0)p.sel.splice(i,1);else{if(p.sel.length>=2)p.sel.shift();p.sel.push(k)}}else p.sel=[k];render()};
A.tGo=()=>{const p=UI.pick;if(!p)return;if(p.mode==='training'&&p.sel.length!==2)return toast('Pick 2 skills');if(!p.sel.length)return toast('Pick what to train');UI.pick=null;startMode(p.mode,p.sel.slice())};
A.tMore5=()=>{const s=current();if(s)s.closed=true;const dm=dueMistakes().length;
  const b=dm?blk('mist',{n:Math.min(5,dm),icon:'🔁',title:'5 more minutes · mistakes',task:'Fix your weakest points.',ru:'Самые слабые места.',reward:REWARD.minute,skill:'grammar'})
    :B.cards(10,{title:'5 more minutes · words',reward:REWARD.minute});
  startMode('minute',['more'],[b])};
A.tPlay=()=>{UI.vtab='match';UI.mg=null;go('/vocabulary')};
A.tFinish=()=>{const s=current()||sessions().slice(-1)[0];if(s){s.closed=true;s.finished=true}UI.dayEnd=true;save();go('/session')};
const curBlock=s=>s?s.blocks.find(b=>b.status==='todo'):null;
function complete(id,acc,extra){const s=current();if(!s)return;const b=s.blocks.find(x=>x.id===id);if(!b||b.status==='done')return;
  b.status='done';b.acc=acc;b.date=new Date().toISOString();
  b.xp=acc==null?0:Math.round(b.reward*(acc>=0.8?1:0.5));if(extra)Object.assign(b,extra);
  if(b.xp)award(b.xp,b.skill,'Block: '+b.title);
  afterBlock(s)}
function afterBlock(s){
  if(!curBlock(s)&&!s.doneAt){s.doneAt=new Date().toISOString();
    if(s.mode==='full'&&!s.bonus&&s.blocks.every(x=>x.status==='done'||x.kind==='pause')){s.bonus=REWARD.FULL_BONUS;award(REWARD.FULL_BONUS,null,'Full plan completed');setTimeout(()=>toast(`🏆 Full plan done! +${REWARD.FULL_BONUS} XP bonus`),300)}
    setTimeout(()=>{try{window.TS_FX&&TS_FX.confetti()}catch(e){}},200)}
  save();if(typeof Cloud!=='undefined'&&Cloud.flushNow)Cloud.flushNow()}
A.tSkip=id=>{const s=current();const b=s&&s.blocks.find(x=>x.id===id);if(!b)return;b.status='skipped';b.xp=0;UI.pauseT=null;afterBlock(s);render()};
const _finish=finishRun;
finishRun=function(){const r=RUN;_finish();try{
  if(r&&r.kind==='minitest'&&!r._resumed&&isStudent()&&r.answers.length){const code=unitCode();const c=r.answers.filter(a=>a.ok).length;const mt=P().minitest=P().minitest||{};(mt[code]=mt[code]||[]).push({date:new Date().toISOString(),c,t:r.answers.length})}
  if(r&&r.planBlock){const n=r.answers.length,c=r.answers.filter(a=>a.ok).length;const s=current();const b=s&&s.blocks.find(x=>x.id===r.planBlock);
    if(b&&b.kind==='listen'&&r.kind==='listening'){b.subDone=true}
    complete(r.planBlock,n?c/n:null);render()}}catch(e){console.error(e)}};
function runOpts(b,o){return Object.assign({planBlock:b.id,blockXp:true,back:'/session'},o||{})}
const ivDone=b=>res=>{complete(b.id,res&&res.ok===false?null:1);go('/session')};
A.tStart=id=>{if(!isStudent())return toast('Only '+S.users.student.name+' can start lessons');const s=current();const b=s&&s.blocks.find(x=>x.id===id);if(!b)return;const m=unitModule();
  switch(b.kind){
  case 'cards':if(!W())return complete(b.id,null),render();
    if(!W().start(b.n,{block:true,planBlock:b.id,back:'/session',title:b.title,onDone:res=>{complete(b.id,res.empty?null:res.acc);go('/session')}})){complete(b.id,null);render()}return;
  case 'game':UI.pairs=newPairs(b);return render();
  case 'sent':{const qs=b.past?pastQs().slice(0,b.n):b.n<10?shuffle(unitQs()).slice(0,b.n):sentences(b.n);if(!qs.length){toast('No exercises yet');complete(b.id,null);return render()}
    return listRun(runOpts(b,{title:b.title,kind:'practice'}),qs)}
  case 'mist':if(!mistakesRun(b.n,runOpts(b,{title:b.title}))){complete(b.id,null);render()}return;
  case 'glevel':{if(!L()||!m){complete(b.id,null);return render()}const nx=L().next(m);
    if(b.full&&nx.boss){const ex=extraTopic();if(ex){const ne=L().next(ex);if(!ne.boss&&!ne.review)return L().startLevel(ex,ne.lvl,runOpts(b,{force:true}))}return L().bossStart(m,{planBlock:b.id,back:'/session',onDone:()=>{complete(b.id,1);go('/session')}})}
    const lvl=nx.lvl||3;if(b.theory&&L().best(m,lvl)==null&&UI.theory!==b.id+':seen'){UI.theory=b.id;return render()}
    return L().startLevel(m,lvl,runOpts(b,{force:true}))}
  case 'read':case 'listen':{const kind=b.kind==='read'?'reading':'listening';const t=pickText(kind);if(!t){toast('Materials are coming');complete(b.id,null);return render()}
    markSeen(kind,t.k);s[kind==='reading'?'readKey':'listenKey']=t.k;save();UI.textBlock=b.id;
    if(kind==='reading'){UI.rtext=t.k;return go('/reading')}UI.ltext=t.k;return go('/listening')}
  case 'dict':UI.dict3=newDict(b,s);return render();
  case 'iv':if(SP())return SP().start('interview',{n:b.n,planBlock:b.id,back:'/session',onDone:ivDone(b)});break;
  case 'say':if(SP())return SP().start('interview',{n:1,prep:10,limit:60,setName:'Say',planBlock:b.id,back:'/session',onDone:ivDone(b)});break;
  case 'speakfull':return startSpeakFull(b,s);
  case 'boss':if(!L()||!m){complete(b.id,null);return render()}return L().bossStart(m,{planBlock:b.id,back:'/session',onDone:()=>{complete(b.id,1);go('/session')}});
  case 'write':UI.write={id:b.id,text:''};return render();
  case 'rule':UI.rule=b.id;return render();
  case 'sounds':UI.sounds={id:b.id,c:0,t:0};A.mpNext&&A.mpNext();return go('/pronunciation');
  case 'pause':UI.pauseT={id:b.id,t0:Date.now()};return render()}
  complete(b.id,null);render()};
/* reading / listening blocks: questions started from the text page belong to the block */
['startReading','startListening'].forEach(fn=>{const f=A[fn];A[fn]=function(k,hw){const r=f.apply(this,arguments);if(UI.textBlock&&!hw&&RUN){Object.assign(RUN,runOpts({id:UI.textBlock}));UI.textBlock=null}return r}});
function textBanner(){const s=current();const b=s&&UI.textBlock&&s.blocks.find(x=>x.id===UI.textBlock);if(!b)return '';
  return `<div class="card banner" style="border-left-color:var(--sk-${b.kind==='read'?'reading':'listening'})"><b>${b.icon} Block: ${esc(b.title)}</b> — ${b.kind==='read'?'read the text (tap unknown words), then press “Answer questions”.':'listen, then press “Answer questions”.'}${s[b.kind==='read'?'readKey':'listenKey']&&(P().seenText||{})?'':''}</div>`}
['reading','listening'].forEach(k=>{const v=SV[k];SV[k]=function(){return textBanner()+v.apply(this,arguments)}});
/* Full: grammar extra topic of the lesson (course-map extraGrammar, D40/D42) */
function extraTopic(){const cm=(window.COURSE_MAP||{})[unitCode()]||{};const ex=(cm.extraGrammar||[]).find(k=>GRAMMAR[k]);return ex||null}
/* Full: speaking = retell of today's text (or homework retell) + 2 interview questions */
function hwRetell(){for(const h of S.homework){if(!['active','overdue'].includes(hwStatus(h)))continue;const i=h.items.findIndex((it,j)=>it.type==='retell'&&!h.done[j]);if(i>=0)return {id:h.id,idx:i,label:h.items[i].label}}return null}
function startSpeakFull(b,s){if(!SP()){complete(b.id,null);return render()}
  const then=()=>SP().start('interview',{n:2,planBlock:b.id,back:'/session',onDone:ivDone(b)});
  const hw=hwRetell();
  if(hw)return SP().start('retell',{hw,limit:180,planBlock:b.id,back:'/session',onDone:then});
  const rk=s.readKey&&PASSAGES[s.readKey],lk=s.listenKey&&AUDIO[s.listenKey];const src=rk||lk;
  if(src)return SP().start('retell',{text:src.text,title:src.title,taskId:'rt-'+(rk?'r-'+s.readKey:'l-'+s.listenKey),limit:180,planBlock:b.id,back:'/session',onDone:then});
  return SP().start('retell',{limit:180,planBlock:b.id,back:'/session',onDone:then})}
/* pairs game */
function newPairs(b){const pool=shuffle(S.vocab.filter(c=>c.word&&c.ru)).slice(0,5);if(pool.length<2){complete(b.id,null);return null}
  return {id:b.id,items:pool.map(c=>({id:c.id,en:c.word,ru:c.ru})),ru:shuffle(pool.map(c=>c.id)),sel:null,done:[],err:0}}
A.tPairEn=id=>{if(UI.pairs){UI.pairs.sel=id;render()}};
A.tPairRu=id=>{const p=UI.pairs;if(!p||!p.sel)return;if(p.sel===id){p.done.push(id);p.sel=null;if(window.TS_FX)TS_FX.beep(true);if(p.done.length===p.items.length){const acc=Math.max(0,1-p.err/(p.items.length*2));const bid=p.id;UI.pairs=null;complete(bid,acc)}}else{p.err++;if(window.TS_FX)TS_FX.beep(false)}render()};
/* dictation of 3 sentences */
function newDict(b,s){const src=s.listenKey&&AUDIO[s.listenKey];let sents=src?String(src.text).split(/(?<=[.!?])\s+/).filter(x=>x.split(' ').length>=4&&x.split(' ').length<=14):[];
  if(sents.length<3)sents=sents.concat(shuffle(DICTATION));return {id:b.id,sents:shuffle(sents).slice(0,3),i:0,ok:[],given:''}}
A.tDictPlay=()=>{const d=UI.dict3;if(d)speak(d.sents[d.i],0.9)};
A.tDictCheck=()=>{const d=UI.dict3;if(!d)return;const el=$('#dict3in');const g=norm(el?el.value:'').split(' ').filter(Boolean),t=norm(d.sents[d.i]).split(' ').filter(Boolean);
  const okw=t.filter((w,i)=>g[i]===w).length;d.ok.push(okw/t.length);d.last={given:el?el.value:'',right:d.sents[d.i],sc:okw/t.length};d.i++;
  if(d.i>=d.sents.length){const acc=d.ok.reduce((a,b)=>a+b,0)/d.ok.length;const id=d.id;UI.dict3=null;complete(id,acc);toast(`Dictation: ${Math.round(acc*100)}%`)}render()};
/* writing 60–100 words */
A.tWriteCheck=send=>{const w=UI.write;if(!w)return;const el=$('#write-text');w.text=el?el.value:w.text;const n=wc(w.text);if(n<60)return toast(`Write at least 60 words — now ${n}`);
  if(send){const id='w-'+uid();S.subs.push({id,type:'writing',taskId:'write-'+unitCode(),prompt:'Writing · '+writeSituation(),text:w.text,pre:[],status:'submitted',date:new Date().toISOString()});notify('teacher',`${S.users.student.name} sent a text`,'/review/'+id)}
  else{const id='w-'+uid();S.subs.push({id,type:'writing',taskId:'write-'+unitCode(),prompt:'Writing · '+writeSituation(),text:w.text,pre:[],status:'saved',date:new Date().toISOString()})}
  const bid=w.id;UI.write=null;complete(bid,1);toast(send?'Sent to '+S.users.teacher.name:'Saved');render()};
function writeSituation(){const m=unitModule();const g=m&&GRAMMAR[m];return g&&g.boss&&g.boss.situation||`Write about your working week. Use the grammar of unit ${unitCode()}.`}
/* minimal pairs count for the "Sounds" minute */
if(A.mpPick){const _mp=A.mpPick;A.mpPick=w=>{const was=UI.mp&&UI.mp.ans;_mp(w);const sd=UI.sounds;if(sd&&!was&&UI.mp){sd.t++;if(w===UI.mp.word)sd.c++;if(sd.t>=10){const id=sd.id,acc=sd.c/sd.t;UI.sounds=null;complete(id,acc);toast(`Sounds: ${sd.c}/10`);setTimeout(()=>go('/session'),600)}else setTimeout(()=>{if(UI.sounds)A.mpNext()},700)}}}
{const v=SV.pronunciation;if(v)SV.pronunciation=function(){const sd=UI.sounds;return (sd?`<div class="card banner"><b>👂 Minute · Sounds ${sd.t}/10</b> — choose the word you hear. <a href="#/session">Back to plan</a></div>`:'')+v.apply(this,arguments)}}
A.tRuleGo=()=>{const s=current();const b=s&&s.blocks.find(x=>x.id===UI.rule);UI.rule=null;const m=unitModule();if(!b||!m)return render();
  const qs=shuffle(L()?L().qsOf(m,1):unitQs()).slice(0,3);if(!qs.length){complete(b.id,1);return render()}listRun(runOpts(b,{title:'Rule check · '+GRAMMAR[m].title,kind:'practice'}),qs)};
A.tTheoryGo=()=>{const id=UI.theory;UI.theory=id+':seen';A.tStart(id)};
A.tPauseDone=()=>{const p=UI.pauseT;UI.pauseT=null;if(p)complete(p.id,null);render()};
A.tHwMark=hid=>{const h=S.homework.find(x=>x.id===hid);if(!h)return;h.done=h.items.map(()=>true);h.status='submitted';h.submittedAt=new Date().toISOString();save();toast('Homework marked done ✓');render()};

/* ---------- views ---------- */
function unitPicker(){const cur=unitCode();
  return `<select onchange="A.tSetUnit(this.value)" aria-label="Current unit" ${isStudent()?'':'disabled'}>${units().map(l=>`<option value="${esc(l.code)}" ${String(l.code).toUpperCase()===cur?'selected':''}>${esc(l.code)} · ${esc(l.title)}</option>`).join('')}</select>`}
const openHw=()=>S.homework.filter(h=>['active','overdue'].includes(hwStatus(h)));
function todayStats(){const k=dkey();const l=sessions();const xp0=l.length?Math.min(...l.map(s=>s.xp0||0)):(S.game?S.game.xp:0);
  const bl=l.flatMap(s=>s.blocks).filter(b=>b.status==='done');const accs=bl.map(b=>b.acc).filter(a=>a!=null);
  return {mins:Math.round(S.activity[k]||0),xp:Math.max(0,(S.game?S.game.xp:0)-xp0),acc:accs.length?Math.round(accs.reduce((a,b)=>a+b,0)/accs.length*100):null,
    words:S.vocab.filter(v=>v.added&&v.added.slice(0,10)===k).length,blocks:bl.length}}
function modeTiles(){const rec=recommended();const ro=!isStudent();
  return `<div class="mode-grid ${ro?'readonly':''}">${['minute','focus','training','full'].map(k=>{const M=MODES[k];return `<button class="mode-tile ${M.cls} ${k===rec?'is-rec':''}" ${ro?'disabled':''} onclick="A.tMode('${k}')"><span class="mode-ico">${M.icon}</span><span class="mode-name">${M.name}</span><span class="mode-time">${M.time}</span><span class="mode-sub">${M.sub}</span><span class="ru-line">${M.ru}</span>${k===rec?'<span class="badge acc rec-badge">Recommended today</span>':''}</button>`}).join('')}</div>${ro?`<div class="small muted center" style="margin-top:6px">This is what ${esc(S.users.student.name)} sees. ${''}</div>`:''}`}
function hwCard(){const hw=openHw();
  return `<div class="card"><div class="small muted">📚 Homework from ${esc(S.users.teacher.name)}</div><div class="kpi">${hw.length} <small>open</small></div>${hw.slice(0,3).map(h=>`<div class="list-item"><div class="small"><b>${esc((h.instructions||h.title).split('\n')[0].slice(0,70))}</b><div class="muted">${relDue(h.due)}</div></div>${isStudent()?`<button class="btn sm" onclick="A.tHwMark('${h.id}')">✓ Done</button>`:''}</div>`).join('')}<a class="btn sm ghost" style="margin-top:8px" href="#/homework">${hw.length?'All homework':isStudent()?'Add homework':'＋ Set homework'}</a></div>`}
function vToday(){const s=current();const st=calcStreak(),xp=S.game?S.game.xp:0,ts=todayStats();
  const bg=(P().bg||{})[dkey()]||0;const m=unitModule();const g=m&&GRAMMAR[m];
  const day=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  const cont=s&&curBlock(s)?(()=>{const M=modeOf(s.mode);const done=s.blocks.filter(b=>b.status!=='todo').length;return `<div class="card cont-card"><div><div class="small muted">In progress</div><b>${M.icon} ${M.name} · ${done}/${s.blocks.length} blocks</b><div class="bar" style="margin-top:8px"><i style="width:${pct(done,s.blocks.length)}%"></i></div></div>${isStudent()?`<a class="btn lg" href="#/session">Continue →</a>`:''}</div>`})():'';
  return `<div class="page-head"><h1>${isStudent()?'Home':'Home · '+esc(S.users.student.name)} 🏠</h1><div class="muted">${day} · 🔥 ${st} day${st===1?'':'s'} · 🎖️ ${xp} XP${ts.blocks?' · <span class="ok-text">day counted ✓</span>':''}</div><div class="ru-line">${isStudent()?'Выберите, сколько у вас времени. Засчитывается даже Минутка.':'Так выглядит главная у Ислама. Кнопки занятий — только у него.'}</div></div>
  ${cont}
  ${modeTiles()}
  <div class="grid g3" style="margin-top:18px">
   <div class="card"><div class="small muted">📍 Current unit</div><div style="margin:8px 0">${unitPicker()}</div><div class="small">${g?`${esc(g.title)} · ${g.qs.length} exercises`:'Exercises for this unit are coming from the methodist'}</div><div class="ru-line">После урока выберите новый юнит — план перестроится.</div></div>
   ${hwCard()}
   <div class="card"><div class="small muted">🎧 Background listening (no XP)</div><div class="kpi">${Math.round(bg)} <small>min today</small></div>${isStudent()?`<div class="row" style="margin-top:8px"><button class="btn sm plain" onclick="A.tBg(10)">+10</button><button class="btn sm plain" onclick="A.tBg(20)">+20</button><button class="btn sm plain" onclick="A.tBg(30)">+30</button></div>`:''}<div class="ru-line">Подкасты, сериалы — просто отметьте минуты.</div></div>
  </div>`}
function vChoose(mode){const p=UI.pick&&UI.pick.mode===mode?UI.pick:(UI.pick={mode,sel:defaultPick(mode)});const M=MODES[mode];if(!M||mode==='full'){setTimeout(()=>go('/today'),0);return ''}
  const map=mode==='minute'?MINUTE:SKILLS;const keys=mode==='minute'?Object.keys(MINUTE):mode==='training'?TRAIN_PICK:Object.keys(SKILLS);const weak=defaultPick(mode);
  const time=mode==='minute'?'1–2 min':'10 min';
  const tile=k=>{const o=map[k];const a=avail(k==='sentences'?'sentences':k);const on=p.sel.includes(k);
    return `<button class="skill-tile ${o.cls} ${on?'on':''} ${a.ok?'':'empty'}" ${a.ok?`onclick="A.tPick('${k}')"`:'disabled'} aria-pressed="${on}"><span class="mode-ico">${o.icon}</span><b>${o.name}</b><span class="small muted">${time}</span><span class="small">${esc(mode==='minute'?o.inside:FOCUS_INSIDE[k])}</span><span class="ru-line">${o.ru}</span>
      ${a.ok?(a.repeat?'<span class="badge">Repeat</span>':''):'<span class="badge">Materials are coming</span>'}${weak.includes(k)?'<span class="badge warn">weak this week</span>':''}${on?'<span class="tick">✓</span>':''}</button>`};
  return `<div class="page-head"><a class="small" href="#/today">← Home</a><h1>${M.icon} ${M.name} · ${M.time}</h1><div class="muted">${mode==='training'?'Core: 15 cards + mistakes (10 min). Pick 2 skills for 10 minutes each.':'Pick what to train.'}</div><div class="ru-line">${mode==='training'?'Ядро всегда есть. Сайт отметил 2 самых слабых навыка недели — можно поменять.':'Сайт подсветил самый слабый навык недели — можно выбрать другой.'}</div></div>
   ${mode==='training'?`<div class="card core-card"><b>✅ Core · 10 min</b> <span class="small muted">🃏 15 cards · 🔁 mistakes due (up to 8) or 5 sentences from earlier units</span></div>`:''}
   <div class="skill-grid">${keys.map(tile).join('')}</div>
   <div class="choose-go"><button class="btn lg block" onclick="A.tGo()">Start ${mode==='training'?`(${p.sel.length}/2)`:''}</button></div>`}
function blockRow(b,isCur){const st=b.status==='done'?'✅':b.status==='skipped'?'⏭️':isCur?'▶️':'⬜';
  return `<div class="blk-row ${isCur?'cur':''} ${b.status}"><span>${st}</span><span class="blk-ico">${b.icon}</span><span class="blk-t">${esc(b.title)}${b.min?` <span class="small muted">· ${b.min} min</span>`:''}</span><span class="small muted">${b.status==='done'?(b.xp?`+${b.xp} XP`:'done')+(b.acc!=null?` · ${Math.round(b.acc*100)}%`:''):b.reward?`up to ${b.reward} XP`:''}</span></div>`}
function taskCard(b){const m=unitModule();const g=m&&GRAMMAR[m];
  if(UI.rule===b.id&&g)return `<div class="card task-big"><div class="small muted">📖 Rule · unit ${esc(unitCode())}</div><h2>${esc(g.title)}</h2><div class="theory">${g.en}</div>${g.ru?`<div class="ru-line">${esc(g.ru)}</div>`:''}<button class="btn lg block" onclick="A.tRuleGo()">Got it → 3 questions</button></div>`;
  if(UI.theory===b.id&&g)return `<div class="card task-big"><div class="small muted">📖 Theory · new level</div><h2>${esc(g.title)}</h2><div class="theory">${g.en}</div>${g.ru?`<div class="ru-line">${esc(g.ru)}</div>`:''}<button class="btn lg block" onclick="A.tTheoryGo()">Got it → questions</button></div>`;
  if(UI.pauseT&&UI.pauseT.id===b.id){const left=Math.max(0,120-(Date.now()-UI.pauseT.t0)/1000);
    return `<div class="card task-big center"><div style="font-size:48px">☕</div><h2>Pause · <span id="brk-t">${mmss(left)}</span></h2><p>Stand up, drink water.</p><div class="ru-line">Встаньте, попейте воды.</div><div class="row" style="justify-content:center"><button class="btn lg" onclick="A.tPauseDone()">Continue →</button><button class="btn lg plain" onclick="A.tSkip('${b.id}')">Skip the pause</button></div></div>`}
  if(UI.pairs&&UI.pairs.id===b.id){const p=UI.pairs;const it=id=>p.items.find(x=>x.id===id);
    return `<div class="card task-big"><h2>🧩 Pairs · ${p.done.length}/${p.items.length}</h2><div class="ru-line">Нажмите слово слева, потом перевод справа.</div><div class="grid g2" style="margin-top:10px"><div class="stack">${p.items.map(x=>`<button class="opt ${p.done.includes(x.id)?'right':p.sel===x.id?'sel':''}" ${p.done.includes(x.id)?'disabled':''} onclick="A.tPairEn('${x.id}')">${esc(x.en)}</button>`).join('')}</div>
      <div class="stack">${p.ru.map(id=>`<button class="opt ${p.done.includes(id)?'right':''}" ${p.done.includes(id)?'disabled':''} onclick="A.tPairRu('${id}')">${esc(it(id).ru)}</button>`).join('')}</div></div><div class="small muted">Mistakes: ${p.err}</div></div>`}
  if(UI.dict3&&UI.dict3.id===b.id){const d=UI.dict3;
    return `<div class="card task-big stack"><h2>✍️ Dictation · ${d.i+1}/${d.sents.length}</h2><div class="ru-line">Нажмите 🔊, послушайте и напишите предложение.</div><button class="btn lg ghost" onclick="A.tDictPlay()">🔊 Play</button><input id="dict3in" class="big-input" autocomplete="off" onkeydown="if(event.key==='Enter')A.tDictCheck()" placeholder="Type what you hear"><button class="btn lg block" onclick="A.tDictCheck()">Check</button>
      ${d.last?`<div class="fb ${d.last.sc>=0.8?'ok':'bad'} small">${Math.round(d.last.sc*100)}% · correct: <b>${esc(d.last.right)}</b></div>`:''}</div>`}
  if(UI.write&&UI.write.id===b.id)return `<div class="card task-big stack"><h2>✍️ Writing · 60–100 words</h2><div class="task-card">${esc(writeSituation())}</div><textarea id="write-text" style="min-height:200px" oninput="document.getElementById('wc-n').textContent=this.value.trim().split(/\\s+/).filter(Boolean).length">${esc(UI.write.text||'')}</textarea><div class="small muted"><span id="wc-n">0</span> words · aim for 60–100</div>
      <div class="row"><button class="btn lg" onclick="A.tWriteCheck(false)">Save</button><button class="btn lg ghost" onclick="A.tWriteCheck(true)">Save and send to ${esc(S.users.teacher.name)}</button></div></div>`;
  const ro=!isStudent();
  return `<div class="card task-big"><div class="task-ico">${b.icon}</div><h2>${esc(b.title)}</h2><p class="task-text">${esc(b.task)}</p><div class="ru-line">${esc(b.ru||'')}</div>
   <div class="task-meta">${b.reward?`<span>🎖️ Reward: <b>up to ${b.reward} XP</b></span>`:''}${b.kind==='mist'?'<span>+15 XP for each fixed mistake</span>':''}${b.n?`<span>Progress: <b>0/${b.n}</b></span>`:''}${b.min?`<span>⏱ ${b.min} min</span>`:''}</div>
   <div class="small muted">≥ 80% correct → full reward · less → half · not finished → 0</div>
   <button class="btn lg block" style="margin-top:14px" ${ro?'disabled':''} onclick="A.tStart('${b.id}')">Start</button>
   ${ro?'':`<button class="btn sm plain" style="margin-top:8px" onclick="A.tSkip('${b.id}')">Skip this block</button>`}</div>`}
function vDayClosed(s){const ts=todayStats();const tm=recommended(new Date(Date.now()+864e5).getDay());const tmD=DAYS[new Date(Date.now()+864e5).getDay()];
  if(UI.dayEnd)return `<div class="card center stack day-closed"><div style="font-size:56px">🌙</div><h1>See you tomorrow!</h1>
    <div class="kpi-row"><div><b>${ts.mins}</b><span>min</span></div><div><b>+${ts.xp}</b><span>XP</span></div><div><b>${ts.acc==null?'—':ts.acc+'%'}</b><span>accuracy</span></div><div><b>${ts.words}</b><span>new words</span></div></div>
    <p>Tomorrow (${tmD}): <b>${MODES[tm].icon} ${MODES[tm].name} · ${MODES[tm].time}</b> — ${esc(MODES[tm].sub)}.</p><div class="ru-line">Завтра рекомендуем режим «${MODES[tm].ru.split(' · ')[0]}».</div>
    <a class="btn lg" href="#/today" onclick="UI.dayEnd=false">Back to Home</a></div>`;
  return `<div class="card center stack day-closed"><div style="font-size:56px">🎉</div><h1>Day closed ✓</h1><div class="ru-line">День закрыт. Отличная работа!</div>${s&&s.bonus?`<div class="badge ok">🏆 Full plan bonus +${s.bonus} XP</div>`:''}
   <div class="kpi-row"><div><b>${ts.mins}</b><span>min</span></div><div><b>+${ts.xp}</b><span>XP</span></div><div><b>${ts.acc==null?'—':ts.acc+'%'}</b><span>accuracy</span></div><div><b>${ts.words}</b><span>new words</span></div></div>
   <div class="stack" style="max-width:420px;margin:0 auto;width:100%"><button class="btn lg block" onclick="A.tMore5()">⏱️ 5 more minutes</button><button class="btn lg block ghost" onclick="A.tPlay()">🎮 Play</button><button class="btn lg block plain" onclick="A.tFinish()">🌙 Finish for today</button></div>
   <div class="whats-next small muted">What next? A short game keeps words fresh. Or finish — tomorrow we recommend ${MODES[tm].name}.</div></div>`}
function vSession(){const s=current()||(UI.dayEnd?sessions().slice(-1)[0]:null);
  if(!s){if(UI.dayEnd)return vDayClosed(null);setTimeout(()=>go('/today'),0);return ''}
  const b=curBlock(s);const M=modeOf(s.mode);const done=s.blocks.filter(x=>x.status!=='todo').length;
  if(!b||UI.dayEnd)return vDayClosed(s);
  const mins=s.blocks.reduce((a,x)=>a+(x.min||0),0);
  return `<div class="page-head row between"><div><a class="small" href="#/today">← Home</a><h1>${M.icon} ${M.name} · ${M.time}</h1><div class="muted">Block ${done+1} of ${s.blocks.length}${mins?` · plan ≈ ${mins} min`:''}${s.mode==='full'?` · all done → +${REWARD.FULL_BONUS} XP bonus`:''}</div></div></div>
   <div class="bar" style="margin-bottom:16px"><i style="width:${pct(done,s.blocks.length)}%"></i></div>
   <div class="sess-grid">${taskCard(b)}<div class="card"><h3>Plan</h3>${s.blocks.map(x=>blockRow(x,x===b)).join('')}</div></div>`}
setInterval(()=>{const el=document.getElementById('brk-t');if(el&&UI.pauseT)el.textContent=mmss(Math.max(0,120-(Date.now()-UI.pauseT.t0)/1000))},1000);

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
SV.today=vToday;SV.session=vSession;SV.choose=vChoose;SV.report=vReport;TV.report=vReport;
try{render()}catch(e){console.error(e)}
window.TS_TRAINER={unitCode,unitModule,unitQs,pastQs,sentences,build,startMode,current,sessions,complete,recommended,dueMistakes,weekData,reportText,todayStats,weakest,xp7,pickText,avail,defaultPick,extraTopic,MODES,REWARD,SKILLS,MINUTE,TRAIN_PICK};
})();
