// ---- 🏝️ Islander / 🧳 Visitor: two ways to play, each with its own difficulty levels and three save slots (85-sides.js) ----
// Slots 1-3 hold islander games (live on the island, story, challenges), slots 4-6 visitor games (visits, weekend regular).
// A save in the wrong group (older versions had three shared slots) moves to a free slot of its own group.
//   saveSide(x)  'I' | 'V'      slotSide(n)  the group of slot n     slotNo(n)  1-3 within its group
//   diffOf(x)    {ic,n,d} for that game's difficulty, with the visitor names for a visit
//   sideBadge(x) "🏝️ Islander · ⛴️ Normal"      sideNew(side)  start a game in a free slot of that group
const SIDES={I:{ic:'🏝️',n:'Islander',slots:[1,2,3],d:'Live on Anderson Island: work, the ferry, the house. A week, a month, or a year in story mode.'},
  V:{ic:'🧳',n:'Visitor',slots:[4,5,6],d:'Come over from Seattle, Tacoma or Olympia for a day, a weekend, a week, or every weekend.'}};
const slotSide=n=>n>=4?'V':'I';
const slotNo=n=>((n-1)%3)+1;
const saveSide=x=>x&&x.visitor?'V':'I';
const VDIFFS={
  easy:{n:'Easy Sunday',ic:'🌤️',d:'More spending money, emptier boats, light I-5 traffic and no crashes, and a heads-up before the last boat.'},
  normal:{n:'Tourist',ic:'📸',d:'The visit as designed: real traffic, the odd crash on I-5, and the last boat waits for no one.'},
  hard:{n:'Missed the Boat',ic:'🌧️',d:'A tighter budget, fuller boats and more fog, heavier I-5 traffic, and no warning before the last boat.'}};
function diffOf(x){x=x||(typeof S!=='undefined'?S:null);const k=(x&&x.diff)||'normal';return saveSide(x)==='V'?(VDIFFS[k]||VDIFFS.normal):(DIFFS[k]||DIFFS.normal)}
function sideBadge(x){x=x||S;const s=SIDES[saveSide(x)],D=diffOf(x);return `${s.ic} ${s.n} · ${D.ic} ${D.n}`}
function vDiffModal(then){const cur=prefs().vdiff||'normal';
  modal('🧳 How hard is the visit?','<p>Pick a difficulty for this visit.</p>',Object.keys(VDIFFS).map(k=>({l:`${VDIFFS[k].ic} ${VDIFFS[k].n}${k===cur?' (last time)':''}`,s:VDIFFS[k].d,fn:()=>{setPref('vdiff',k);then(k)}})))}
window.vDiffModal=vDiffModal;

// ---- visitor difficulty: I-5 traffic, crashes, the last-boat heads-up ----
const VT_MUL={easy:0.6,normal:1,hard:1.3};
function vtScale(e){try{const m=visitorOn()?VT_MUL[S.diff]||1:1;if(m!==1&&e&&typeof e.min==='number'&&e.min>5){const n=Math.round(e.min*m);e.txt=String(e.txt||'').replace(/\+\d+ min/,'+'+n+' min');e.min=n}}catch(x){}return e}
{const _t=vtTraffic;vtTraffic=function(){return vtScale(_t.apply(this,arguments))}}
{const _t=seaTraffic;seaTraffic=function(){return vtScale(_t.apply(this,arguments))}}
{const _r=vtTrafficRoll;vtTrafficRoll=function(from,to){const r=_r.apply(this,arguments);
  if(r&&r.crash&&visitorOn()&&S.diff==='easy')return {min:Math.round(vtTraffic(from,to,S.t).min*(0.5+Math.random())),crash:false};return r}}
{const _h=lbHomeSide;lbHomeSide=function(){if(visitorOn()&&S.diff==='hard')return null;return _h.apply(this,arguments)}}

// ---- saves: three per group ----
function sortSlots(){const ls=store(),moved=[];if(!ls)return moved;
  for(let n=1;n<=SLOT_N;n++){const r=rawSave(n);if(!r)continue;let x=null;try{x=JSON.parse(r.v).S}catch(e){continue}
    if(!x||x.over||slotSide(n)===saveSide(x))continue;
    const to=SIDES[saveSide(x)].slots.find(k=>!rawSave(k));if(!to)continue;
    try{slotKeys(to).forEach(k=>ls.setItem(k,r.v));slotKeys(n).forEach(k=>ls.removeItem(k))}catch(e){continue}
    if(curSlot()===n)setSlot(to);moved.push([n,to])}
  return moved}
// a game that changes group (a weekend regular who buys the house) moves to a free slot of its new group as it saves
{const _s=saveGame;saveGame=function(){try{if(S&&!S.over&&slotSide(curSlot())!==saveSide(S)){const ls=store(),from=curSlot(),to=SIDES[saveSide(S)].slots.find(k=>!rawSave(k));
    if(ls&&to){slotKeys(from).forEach(k=>ls.removeItem(k));setSlot(to)}}}catch(e){console.error(e)}return _s.apply(this,arguments)}}
function sideSaves(side){return SIDES[side].slots.filter(n=>{const i=slotInfo(n);return i&&!i.broken})}
function sideLatest(side){const c=curSlot();if(slotSide(c)===side&&rawSave(c)&&slotInfo(c)&&!slotInfo(c).broken){const d=loadSave(c);if(d&&saveSide(d.S)===side)return {n:c,at:rawSave(c).at,d}}
  let best=null;for(const n of SIDES[side].slots){const r=rawSave(n),i=r&&slotInfo(n);if(!r||!i||i.broken)continue;const d=loadSave(n);if(d&&saveSide(d.S)===side&&(!best||r.at>best.at))best={n,at:r.at,d}}return best}
window.sideCont=side=>{const b=sideLatest(side);if(!b)return titleScreen();setSlot(b.n);resumeGame()};
// start in the first free slot of the group; when all three are in use, pick the one to replace
window.sideNew=(side,then)=>{const free=SIDES[side].slots.find(n=>!slotInfo(n));
  if(free){setSlot(free);return then?then():newGameModal(side)}
  slotsModal(side,'All three '+SIDES[side].n.toLowerCase()+' slots are in use. Pick one to start over in.')};

// every way to start a game makes sure it lands in a slot of its own group (the title's challenge buttons, Play again, …)
function sideGuard(side,fn){return function(){const a=arguments,self=this;if(slotSide(curSlot())===side)return fn.apply(self,a);
  return sideNew(side,()=>fn.apply(self,a))}}
for(const [k,side] of [['startNewWeek','I'],['startVisit','V'],['startRegular','V'],['regAgain','V']])if(typeof window[k]==='function')window[k]=sideGuard(side,window[k]);
if(typeof chStartModal==='function')chStartModal=sideGuard('I',chStartModal);
if(typeof dailyStartModal==='function')dailyStartModal=sideGuard('I',dailyStartModal);

// ---- the new-game chooser for one group ----
{const _n=newGameModal;newGameModal=function(side){if(side!=='I'&&side!=='V')return _n.apply(this,arguments);
  const has=f=>typeof window[f]==='function';
  const opts=side==='I'?[
    {l:'🏝️ Live on the island',s:'Work in Lakewood, keep food in the pantry and gas in the car. A week, a month, or a whole year in story mode.',fn:()=>startNewWeek()}]:[
    {l:'🧳 Visit the island',s:'A day trip, a weekend or a week from Seattle, Tacoma or Olympia. See the sights and catch the last boat home.',fn:()=>startVisit()},
    {l:'🏙️ Weekend regular',s:'A month with a city job, every weekend on the island. Save up and you might move over.',fn:()=>startRegular()}];
  if(side==='I'&&has('chStartModal'))opts.push({l:'🏆 Weekly challenge',s:'The same week for everyone. Share your code and compare scores.',fn:()=>chStartModal()});
  if(side==='I'&&has('dailyStartModal'))opts.push({l:'☀️ Daily challenge',s:'Today’s one-day game, the same for everyone.',fn:()=>dailyStartModal()});
  opts.push({l:'Never mind',fn:()=>{}});
  modal(`${SIDES[side].ic} New ${SIDES[side].n.toLowerCase()} game`,`<p>${SIDES[side].d} It goes in ${SIDES[side].n.toLowerCase()} slot ${slotNo(curSlot())}.</p>`,opts)};
 window.newGameModal=newGameModal}

// ---- title screen: a card for each group, with Continue, Saves and 1 week / 1 month / 1 year right on it (86-start.js starts them) ----
const SIDE_LINE={I:'Live on the island: work, the ferry, the house.',V:'Come over from the city: a visit, or weekends.'};
function sideCard(side){const s=SIDES[side],b=sideLatest(side),n=sideSaves(side).length;
  const cont=b?(()=>{const x=b.d.S;return `<div class="scrow"><button class="big scont" onclick="sideCont('${side}')">Continue as ${esc(x.name||currentName())}: ${x.visitor&&typeof VISIT_LENS!=='undefined'&&VISIT_LENS[x.visitor.len]?`🧳 ${VISIT_LENS[x.visitor.len].n} visit · `:''}${x.visitor&&x.visitor.year?`Month ${(x.visitor.year.m|0)+1} of 4 · `:''}${seasonBadge(x)} · ${x.story?`Chapter ${(x.story.ch|0)+1} of 4 · `:''}${DAYS[x.cur]} ${fmt(x.t)}${n>1?` (slot ${slotNo(b.n)})`:''} ⛴️</button><button class="sdel" onclick="slotAct(${b.n},'del','title')" aria-label="Delete this saved game" title="Delete this saved game">🗑️</button></div>`})():'';
  return `<div class="side" id="side${side}"><div class="shead"><span class="sh">${s.ic} ${s.n}</span><button class="schip" onclick="slotsModal('${side}')">💾 Saves (${n} of 3)</button></div>
    <div class="sd">${SIDE_LINE[side]}</div>${cont}
    <div class="slen" role="group" aria-label="Start a new ${s.n.toLowerCase()} game">${['week','month','year'].map(k=>`<button onclick="startLen('${side}','${k}')" title="${esc(START_LENS[side][k].d)}"><b>1 ${k}</b><span>${START_LENS[side][k].s}</span></button>`).join('')}</div></div>`}
function sideTitle(){const t=document.querySelector('.title .body');if(!t||t.querySelector('.sides'))return;
  sortSlots();
  t.querySelectorAll('h1+p,ul,button.big,button[onclick="newGameModal()"],button[onclick="startNewWeek()"],button[onclick="slotsModal()"],button[onclick="openTransfer()"],#wnBtn').forEach(b=>b.remove());
  t.querySelectorAll('.hint').forEach(h=>{if(/Play it like an app/.test(h.textContent))h.remove()});
  const h1=t.querySelector('h1');
  const seen=(()=>{try{return localStorage.getItem('islandtime-wn-seen')}catch(e){return null}})(),dot=seen===APP_VERSION?'':' <span class="wndot">new</span>';
  h1.insertAdjacentHTML('afterend',`<div class="sides">${sideCard('I')}${sideCard('V')}</div>`);
  // everything else is one ☰ Menu at the bottom: a list that drops up over the page (so the page never scrolls)
  const note=t.querySelector('.small-note');
  const menu=`<details class="tmenu" id="tmenu"><summary id="menuBtn">☰ Menu${dot}</summary><div class="tlist" id="chips" role="menu"></div></details>`;
  if(note)note.insertAdjacentHTML('beforebegin',menu);else t.insertAdjacentHTML('beforeend',menu);
  const list=t.querySelector('#chips');
  for(const id of ['chBtn','dayBtn','colBtn'])(()=>{const e=document.getElementById(id);if(e)list.appendChild(e)})();
  list.insertAdjacentHTML('beforeend',`<button class="ghost" id="trBtn" onclick="openTransfer()">🔁 Transfer a saved game</button>`);
  const ib=document.getElementById('installBtn');if(ib)list.appendChild(ib);
  list.insertAdjacentHTML('beforeend',`<button class="ghost" id="aboutBtn" onclick="aboutModal()">ℹ️ About Island Time${dot}</button>`);
  list.querySelectorAll('button').forEach(b=>{b.setAttribute('role','menuitem');b.addEventListener('click',()=>{const d=document.getElementById('tmenu');if(d)d.open=false})});
  if(note)note.innerHTML=`Version ${esc(APP_VERSION)}`}
// a tap outside the open menu, or Esc, closes it
document.addEventListener('click',e=>{const d=document.getElementById('tmenu');if(d&&d.open&&!d.contains(e.target))d.open=false});
document.addEventListener('keydown',e=>{const d=document.getElementById('tmenu');if(e.key==='Escape'&&d&&d.open){d.open=false;const s=document.getElementById('menuBtn');if(s)s.focus()}});
{const _ts=titleScreen;titleScreen=function(){const r=_ts.apply(this,arguments);try{sideTitle()}catch(e){console.error(e)}return r}}

// ---- in the game: which way you're playing, and at what level ----
{const _h=hud;hud=function(){const r=_h.apply(this,arguments);try{if(!S)return r;return r.replace('<div class="hud-day">',`<div class="hud-side">${sideBadge(S)}</div><div class="hud-day">`)}catch(e){return r}}}

{const st=document.createElement('style');st.textContent=`.title .art{height:112px}.title .body{padding:10px 16px 14px;gap:10px}
.title h1{font-size:30px;margin:0;line-height:1.1}.title h1 span{font-size:13px;margin-top:2px}
.sides{display:flex;flex-direction:column;gap:10px}
.side{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.28);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:7px}
#sideV{border-color:#d9bf87}#sideI{border-color:#8fc4a4}
.side .shead{display:flex;align-items:center;justify-content:space-between;gap:8px}.side .sh{font-family:var(--disp,inherit);font-weight:700;font-size:18px}
.side .schip{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;margin:0!important;width:auto}
.side .sd{font-size:12.5px;opacity:.8;margin-top:-3px}
.side .scrow{display:flex;gap:6px;align-items:stretch}.side .sdel{margin:0;flex:0 0 46px;border-radius:12px;border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;font-size:18px;cursor:pointer}.side .sdel:hover,.side .sdel:focus-visible{background:rgba(200,60,40,.45)}
.side .scont{margin:0!important;flex:1;width:auto;font-size:14px;padding:9px 10px;line-height:1.25}
.side .slen{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.side .slen button{margin:0;background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.35);border-radius:10px;padding:6px 2px;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;min-height:44px}
.side .slen button b{font-size:14px}.side .slen button span{font-size:10.5px;opacity:.8;line-height:1.15;text-align:center}
.side .slen button:hover,.side .slen button:focus-visible{background:rgba(255,255,255,.22)}
.tmenu{position:relative}.tmenu>summary{list-style:none;cursor:pointer;text-align:center;font-weight:700;font-size:15px;padding:10px;border-radius:12px;border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px}
.tmenu>summary::-webkit-details-marker{display:none}.tmenu[open]>summary{background:rgba(255,255,255,.2)}
.tlist{position:absolute;left:0;right:0;bottom:calc(100% + 6px);z-index:5;display:flex;flex-direction:column;gap:2px;padding:6px;border-radius:14px;background:#163e4a;border:1.5px solid rgba(255,255,255,.3);box-shadow:0 10px 30px rgba(0,0,0,.45)}
.tlist button{margin:0!important;width:100%;text-align:left;justify-content:flex-start;border:0!important;background:transparent!important;border-radius:9px;padding:11px 12px;font-size:14px;min-height:44px;line-height:1.25}
.tlist button:hover,.tlist button:focus-visible{background:rgba(255,255,255,.12)!important}
.title .small-note{text-align:center}.title .linkbtn{background:none;border:0;color:inherit;text-decoration:underline;font:inherit;padding:0;cursor:pointer}
@media (max-height:720px){.title .art{height:64px}.title h1{font-size:26px}.title h1 span,.side .sd{display:none}.side{gap:6px;padding:8px 10px}.title .body{gap:8px;padding-top:8px}.tmenu>summary{min-height:38px;padding:6px}.title .art{height:56px}}
.hud-side{font-size:11px;font-weight:700;letter-spacing:.02em;opacity:.85;margin-bottom:1px}`;document.head.appendChild(st)}
