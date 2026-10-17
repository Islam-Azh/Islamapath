/* ============================================================
   design.js — METHODIKA §12 behaviour
     • Russian always visible under English (turn off in Settings → Russian hints)
     • bottom menu on a phone: Today · Map · Progress · More
     • instant feedback: green flash + short sound on a right answer, XP pop-up, confetti
   ============================================================ */
'use strict';
(function(){
if(typeof S==='undefined'){console.error('design.js: main app not found');return}
ru=function(text){return text?`<div class="ru-line">${text}</div>`:''};

/* ---------- sound + effects ---------- */
let AC=null;
function beep(ok){if(S.settings.sound===false)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
  o.type='sine';o.frequency.value=ok?880:220;g.gain.setValueAtTime(0.0001,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.12,AC.currentTime+0.02);g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+(ok?0.25:0.35));
  o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+0.4);if(ok){const o2=AC.createOscillator(),g2=AC.createGain();o2.frequency.value=1320;g2.gain.setValueAtTime(0.0001,AC.currentTime+0.1);g2.gain.exponentialRampToValueAtTime(0.08,AC.currentTime+0.12);g2.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.4);o2.connect(g2);g2.connect(AC.destination);o2.start(AC.currentTime+0.1);o2.stop(AC.currentTime+0.45)}}catch(e){}}
function confetti(){const cs=['#2f6fde','#7c4ddb','#1d8f4e','#e07b00','#d93a3a','#0f9b9b','#f2b100'];
  for(let i=0;i<70;i++){const d=document.createElement('div');d.className='confetti';d.style.left=Math.random()*100+'vw';d.style.background=cs[i%cs.length];
    d.style.animationDuration=(1.6+Math.random()*1.6)+'s';d.style.animationDelay=(Math.random()*0.4)+'s';d.style.transform=`rotate(${Math.random()*360}deg)`;document.body.appendChild(d);setTimeout(()=>d.remove(),3800)}}
function xpPop(n){const d=document.createElement('div');d.className='xp-pop';d.textContent=`+${n} XP`;const chip=document.querySelector('header.top .chip,header.top .badge')||null;
  const r=chip?chip.getBoundingClientRect():{left:window.innerWidth-140,bottom:60};d.style.left=Math.max(10,r.left)+'px';d.style.top=(r.bottom+6)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),1200)}

/* ---------- bottom menu ---------- */
const MAIN=[['today','Today','⚡'],['map','Map','🗺️'],['month','Progress','📈']];
const PROG_PAGES=['month','progress','report','mistakes','achievements','history'];
function page(){return (location.hash.slice(1)||'').split('/').filter(Boolean)[0]||'today'}
function bottomNav(){if(!S||!S.role)return '';const p=page();const al=(window.NAV_ALIAS&&NAV_ALIAS[S.role]||{})[p]||p;
  const prog='progress';
  const items=[['today','Home','🏠'],['map','Map','🗺️'],[prog,'Progress','📈']];
  const onProg=PROG_PAGES.includes(p)||PROG_PAGES.includes(al);
  return `<nav class="bottom-nav" aria-label="Main">${items.map(([k,l,i])=>{const on=k===prog?onProg:(k===p||k===al);return `<a href="#/${k}" class="${on?'on':''}"><span class="ico">${i}</span>${l}</a>`}).join('')}
   <button onclick="TS_FX.more()" class="${!onProg&&!['today','map','session'].includes(p)&&al!=='today'&&al!=='map'?'on':''}"><span class="ico">☰</span>More</button></nav>`}
function more(){const nav=(window.NAV_OVERRIDE&&NAV_OVERRIDE[S.role])||[];const el=document.createElement('div');el.className='more-sheet';
  el.innerHTML=`<div role="dialog" aria-label="More"><div class="row between"><h2>More</h2><button class="btn sm plain" onclick="this.closest('.more-sheet').remove()">✕</button></div>${nav.filter(n=>n&&!n.h&&!['today','map'].includes(n[0])).map(n=>`<a href="#/${n[0]}" onclick="this.closest('.more-sheet').remove()"><span>${n[2]}</span>${esc(n[1])}</a>`).join('')}</div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove()});document.body.appendChild(el)}

/* ---------- hook into render ---------- */
let lastXp=null,lastFb=null;
const _render=render;
render=function(){_render();try{decorate()}catch(e){console.error(e)}};
function decorate(){document.body.classList.toggle('no-ru',S.settings.ruHints===false);
  const app=document.querySelector('.app');if(app&&!app.querySelector('.bottom-nav'))app.insertAdjacentHTML('beforeend',bottomNav());
  const xp=S.game?S.game.xp:null;if(lastXp!=null&&xp!=null&&xp>lastXp)xpPop(xp-lastXp);lastXp=xp;
  if(typeof RUN!=='undefined'&&RUN&&RUN.state==='feedback'){const key=RUN.i+':'+RUN.title;if(lastFb!==key){lastFb=key;beep(!!RUN.lastOk);const c=document.querySelector('.qcard');if(c&&RUN.lastOk)c.classList.add('flash-ok')}}
  else if(typeof RUN!=='undefined'&&RUN&&RUN.state==='ask')lastFb=null;
  if(UI.wq&&UI.wq.state==='shown'){const key='w'+UI.wq.i;if(lastFb!==key){lastFb=key;beep(UI.wq.res!=='dont');if(UI.wq.res==='know'){const c=document.getElementById('wcard');if(c)c.classList.add('flash-ok')}}}}
window.addEventListener('hashchange',()=>{try{decorate()}catch(e){console.error(e)}});
window.TS_FX={confetti,beep,xpPop,more};
try{render()}catch(e){console.error(e)}
})();
