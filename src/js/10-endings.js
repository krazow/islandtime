// ---------------- endings ----------------
function homeScore(){const h=S.home??70;return Math.round((h-50)*2)+(h>=HOME_HIGH?100:0)}
function scoreOf(){
  const s=S.stats;
  const cargoVal=Object.keys(GOODS).reduce((a,g)=>a+S.cargo[g]*price(g,'M').sell,0);
  const mult=DF().score;
  const bonus=Object.values(S.friends).reduce((a,f)=>a+40+20*(f.lvl||1),0)+S.bingo.won+S.bingo.donated+cargoVal-S.drugCharges*300-S.citations*200+(s.stranded===0?150:0)+(S.appt?100:0)+(S.rx?60:0)+((S.stats.workdays||0)*40)+homeScore();
  return Math.round((S.money+(S.emp?S.job*4:-150)+S.health*4-S.stress*3+bonus+Math.round(S.coop.you*0.5)+(S.coop.open?400:0))*mult);
}
function gradeOf(sc){
  if(sc>=2000) return ['A','Born & Raised Islander','You read the boat like the tide. The General Store regulars nod at you now.'];
  if(sc>=1650) return ['B','Ferry-Hardened','You’ve got a cooler in the trunk and the schedule memorized. Mostly.'];
  if(sc>=1300) return ['C','Still Figuring It Out','You survived. The ferry won a few rounds.'];
  if(sc>=900) return ['D','Considering Lakewood Apartments','You’ve started browsing mainland rentals “just to look.”'];
  return ['F','Moving Back to the Mainland','The island is beautiful. You’ll visit. On a Tuesday. Not a Friday.'];
}
function finish(){clearTiles();S.over=true;endScreen(S.mode==='month'?'{{name}}, you made it through the month':'{{name}}, you made it to Sunday night',S.mode==='month'?`Four weeks of island life in ${SEA().month}.${S.coop.open?' And the island has a store again.':''}`:`You survived a week of island life in ${SEA().month}.`)} // season
function gameOver(why){S.over=true;MQ=[];tileQ=[];document.querySelectorAll('#tiles .tile').forEach(t=>t.remove());document.querySelectorAll('.modal-bg').forEach(e=>e.remove());
  const T={health:['Medevac off the island','Your health gave out. The fire department calls for the medevac helicopter.'],fired:['You’re fired','Your boss has run out of patience with “the ferry broke down again.”'],convicted:['Second arrest','Your second drug arrest. You won’t be going home to the island for a long time.'],banned:['Barred from the ferry','Second gas-can violation. You’re barred from riding the Pierce County ferry. On an island with no bridge, that’s checkmate.']}[why];
  endScreen(T[0],T[1],true)}
function endScreen(h1,sub,lost){
  achCheck({end:true,lost});const achNew=(S.achGame||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  const sc=scoreOf(),g=lost?['F',h1,sub]:gradeOf(sc),s=S.stats;
  saveGame();let best=null;const ls=store();try{best=ls?Number(ls.getItem(BEST_KEY)||'NaN'):NaN;if(!lost&&(isNaN(best)||sc>best)){ls&&ls.setItem(BEST_KEY,String(sc));best=isNaN(best)?null:best;var newBest=true}}catch(e){}
  // season: the end screen has a Season row; the title Continue button and save slots show the season
  app.innerHTML=withName(`<div class="end"><div style="display:flex;justify-content:space-between;align-items:center"><div class="small-note" style="color:var(--mute)">${lost?'GAME OVER':'WEEK COMPLETE'} · {{name}}</div><button class="gear" style="background:var(--sand);color:var(--ink)" onclick="openSettings()" aria-label="Settings">⚙️</button></div><h1>${h1}</h1><p>${sub}</p>
  <div style="display:flex;gap:16px;align-items:center;margin:16px 0"><div class="grade">${g[0]}</div><div><b style="font-family:Fraunces;font-size:20px">${g[1]}</b><div style="color:var(--mute);font-size:14px">${g[2]}</div></div></div>
  <div class="kv"><span>Difficulty</span><b>${DF().ic} ${DF().n}</b></div>
  <div class="kv season-end"><span>Season</span><b>${seasonBadge(S)} · ${seasonYear(seasonId())}${S.stats.pipes?` · 🧊 ${S.stats.pipes} burst pipe${S.stats.pipes>1?'s':''}`:''}${S.stats.veg?` · 🥒 ${S.stats.veg} garden harvest${S.stats.veg>1?'s':''}`:''}</b></div>
  <div class="kv"><span>Score</span><b>${sc}${typeof newBest!=='undefined'&&newBest?' 🏆 new best':''}</b></div>${best!=null&&!isNaN(best)?`<div class="kv"><span>Previous best</span><b>${best}</b></div>`:''}
  <div class="kv ach-end"><span>🏆 Achievements this game</span><b style="text-align:right">${achNew.length?achNew.map(a=>a.ic+' '+a.n).join(', '):'none new'}</b></div>
  <div class="kv"><span>Cash left</span><b style="${S.money<0?'color:#ff8a70':''}">${S.money<0?'−':''}$${Math.abs(Math.round(S.money))}</b></div>
  <div class="kv"><span>Health / Job / Stress</span><b>${S.health} / ${S.job} / ${S.stress}</b></div>
  <div class="kv"><span>🏠 Home condition</span><b>${S.home} (${homeScore()>=0?'+':'−'}${Math.abs(homeScore())} pts)</b></div>
  <div class="kv"><span>Workdays completed</span><b>${S.stats.workdays||0}</b></div>
  <div class="kv"><span>Job at the end</span><b>${S.emp?JOBS[S.emp].n:'Unemployed'}${S.stats.firings?` (fired ${S.stats.firings}×)`:''}</b></div>
  <div class="kv"><span>Co-op pledges</span><b>${$(S.coop.you)}${S.coop.open?' · 🎉 the co-op opened!':''}</b></div>
  <div class="kv"><span>Doctor’s appointment</span><b>${S.appt?'Made it':'Missed'}</b></div>
  <div class="kv"><span>Ferry crossings</span><b>${s.crossings}</b></div>
  <div class="kv"><span>Hours spent waiting for the boat</span><b>${(s.waited/60).toFixed(1)}</b></div>
  <div class="kv"><span>Times the boat was full</span><b>${s.bumps}</b></div>
  <div class="kv"><span>Nights stranded</span><b>${s.stranded}</b></div>
  <div class="kv"><span>Spent on fares</span><b>${$(s.fares)}</b></div>
  <div class="kv"><span>Gallons bought from Dale</span><b>${s.daleGal}</b></div>
  <div class="kv"><span>Gallons you smuggled / citations</span><b>${s.smuggled} / ${S.citations}</b></div>
  <div class="kv"><span>Nights without power</span><b>${s.outageNights}</b></div>
  <div class="kv"><span>Island friends made</span><b>${Object.keys(S.friends).length?Object.values(S.friends).map(f=>f.name.split(',')[0].split(' from')[0]).join(', '):'none'}</b></div>
  ${S.bingo.comped?`<div class="kv"><span>Comped by the Riv</span><b>${$(S.bingo.comped)}</b></div>`:''}
  <div class="kv"><span>Bingo nights / winnings</span><b>${S.bingo.nights} / ${$(S.bingo.won)}</b></div>${S.bingo.nights?`<div class="kv"><span>Your bingo money that went to the ${BINGO_FOR[S.week.bingo]}</span><b>${$(S.bingo.donated)}</b></div>`:''}
  <div class="kv"><span>Trading: bought / sold</span><b>${$(s.bought)} / ${$(s.sold)}</b></div>
  <div class="kv"><span>Drug runs / arrests</span><b>${s.drugRuns} / ${s.arrests}</b></div>
  <div class="kv"><span>Ferry outages this week</span><b>${S.week.b.filter(b=>b.start<S.t).length}</b></div>
  <button class="big" style="width:100%;margin-top:22px" onclick="startNewWeek()">Play another week</button><button class="act" style="margin-top:10px;justify-content:center" onclick="titleScreen()"><span class="tx" style="text-align:center"><b>Back to title</b></span></button></div>`);
  window.scrollTo(0,0);
}

// ---------------- achievements ----------------
// Kept per device under their own key, separate from saves: they survive new games, deleted slots and finished weeks.
const ACH_KEY='islandtime.achievements';
const ACH=[
  {id:'never_stranded',ic:'⛴️',n:'Never stranded',d:'Finish a game without a single night stuck on the mainland.',t:c=>c.end&&!c.lost&&S.stats.stranded===0},
  {id:'punctual',ic:'⏰',n:'Clocked in on time',d:'Get to work on time five days in one week.',t:()=>Object.keys(S.worked||{}).filter(i=>S.worked[i]&&!(S.late||{})[i]).length>=5},
  {id:'chimney',ic:'🏚️',n:'Clean flue',d:'Sweep the chimney before it reaches 21 days of creosote.',t:null},
  {id:'well_kept',ic:'🏡',n:'Well-kept home',d:'Finish a game with your home condition at 75 or better.',t:c=>c.end&&!c.lost&&S.home>=75},
  {id:'month',ic:'🗓️',n:'A month on the island',d:'Make it through a whole month (4 weeks).',t:c=>c.end&&!c.lost&&S.mode==='month'},
  {id:'coop',ic:'🛒',n:'Co-op founder',d:'Help the island raise enough to open the co-op store.',t:()=>!!S.coop.open},
  {id:'bingo',ic:'🎱',n:'Bingo!',d:'Win money at American Legion bingo night.',t:()=>S.bingo.won>0},
  {id:'close_friend',ic:'🤝',n:'Close friend',d:'Become close friends (level 3) with someone on the island.',t:()=>Object.values(S.friends||{}).some(f=>(f.lvl||1)>=3)},
  {id:'ferry_hell',ic:'🔥',n:'Ferry Hell survivor',d:'Finish a game on Ferry Hell difficulty.',t:c=>c.end&&!c.lost&&S.diff==='hard'},
  {id:'generator',ic:'🔌',n:'The lights stay on',d:'Have your generator carry the house through a power outage.',t:()=>S.ev.history.some(h=>h.id==='gen_saves')||(S.ev.past||[]).some(h=>h.id==='gen_saves')},
  {id:'ankle',ic:'🩹',n:'Back on your feet',d:'Get a hurt ankle treated.',t:()=>!!(S.injury&&S.injury.treated)},
  {id:'supplier',ic:'🥫',n:'Island supplier',d:'Sell food or medical supplies to neighbors on the island.',t:null},
  {id:'fred',ic:'🩴',n:'Pajama Fred’s friend',d:'Make friends with Pajama Fred.',t:()=>!!S.friends.fred},
  {id:'terminal',ic:'🪑',n:'A night at the ferry dock',d:'Spend a stranded night at the Steilacoom ferry landing.',t:c=>c.where==='terminal'},
  {id:'pantry',ic:'🧺',n:'Fully stocked',d:'Have a week of food (7 days or more) in the pantry.',t:()=>S.pantry>=7},
  {id:'zen',ic:'🧘',n:'Island calm',d:'Bring your stress all the way down to 0.',t:()=>S.stress<=0},
  // phone apps (19-apps-travel.js, 20-apps-money.js): counters live in S.stats, so they're per game
  {id:'commuter_pro',ic:'🎟️',n:'Commuter pro',d:'Ride the ferry 10 times on ⛴️ Ferry Pass tickets in one game.',t:()=>(S.stats.fpRides||0)>=10},
  {id:'autopay',ic:'💳',n:'Never late on a bill',d:'Finish a month with 💳 autopay on since the first week and not one late bill.',
    t:c=>{const I=S.ph&&S.ph.icu;return c.end&&!c.lost&&S.mode==='month'&&!!I&&I.auto&&(I.since??0)<=6&&phoneInstalled('bank')&&!(S.stats.lateBills>0)}},
  {id:'gig_economy',ic:'💼',n:'Gig economy',d:'Earn $100 from 💼 Gig Work tasks in one game.',t:()=>(S.stats.gigPay||0)>=100},
  {id:'weather_wise',ic:'🌦️',n:'Weather-wise',d:'Spend a gale or a hard freeze at home after 🌦️ Tides & Weather warned you the evening before.',t:()=>(S.stats.wxWise||0)>0}];
function achGot(){try{const o=JSON.parse(localStorage.getItem(ACH_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return {}}}
function achCount(){const g=achGot();return ACH.filter(a=>g[a.id]).length}
function achUnlock(id){const a=ACH.find(x=>x.id===id);if(!a)return;const g=achGot();if(g[id])return;
  g[id]={at:new Date().toISOString()};try{localStorage.setItem(ACH_KEY,JSON.stringify(g))}catch(e){}
  if(S){S.achGame=(S.achGame||[]).filter(x=>x!==id).concat(id);if(!S.over)showTile('🏆','Achievement: '+a.n,a.d,'good')}}
function achCheck(c){if(!S)return;c=c||{};const g=achGot();
  for(const a of ACH){if(g[a.id]||!a.t)continue;let ok=false;try{ok=!!a.t(c)}catch(e){}if(ok)achUnlock(a.id)}}
function achModal(back){const g=achGot();
  modal(`🏆 Achievements (${achCount()}/${ACH.length})`,`<p style="font-size:13px;color:var(--mute)">Saved on this device. They carry over to every new game and save slot.</p>`+ACH.map(a=>{const on=g[a.id];
    return `<div class="ach${on?' on':''}" style="display:flex;gap:10px;align-items:center;padding:8px 10px;margin-bottom:6px;border-radius:10px;border:1.5px solid ${on?'var(--good)':'var(--line)'};background:${on?'#fff':'transparent'}${on?'':';opacity:.55'}"><span style="font-size:24px;width:30px;text-align:center;${on?'':'filter:grayscale(1)'}">${on?a.ic:'🔒'}</span><span style="flex:1;min-width:0"><b style="display:block;font-size:14.5px">${a.n}</b><span style="display:block;font-size:12.5px;color:var(--mute)">${on?`Earned ${esc(new Date(on.at).toLocaleDateString())}`:'How: '+a.d}</span></span></div>`}).join(''),
  [{l:back?'Back to settings':'Close',fn:()=>{if(back)back()}}]);
}
window.achModal=achModal;

// ---------------- save slots UI ----------------
function slotInfo(n){const r=rawSave(n);if(!r)return null;
  try{const d=migrate(JSON.parse(r.v));if(d.S.over)return null;const x=d.S,D=DIFFS[x.diff]||DIFFS.normal;
    return {name:x.name||currentName(),diff:`${D.ic} ${D.n} · ${seasonBadge(x)}`,txt:`${x.story?storyWeekTxt(x,true)+' · ':x.mode==='month'?`Week ${(x.weekNo||0)+1} of 4 · `:''}${DAYS[x.cur]} ${fmt(x.t)}`}} // season
  catch(e){return {broken:true,name:'Unreadable save',diff:'',txt:''}}}
const slotLine=i=>i?(i.broken?'Unreadable save':`${esc(i.name)} · ${i.diff} · ${i.txt}`):'Empty';
const SLOTBTN='flex:1;padding:8px 4px;border-radius:10px;font-weight:700;font-size:13px;border:1.5px solid var(--line);background:#fff;color:var(--ink)';
window.slotsModal=()=>{const cur=curSlot();
  modal('💾 Save slots',`<p style="font-size:13px;color:var(--mute)">Keep up to three games going. Continue, a new week, Exit and transfer codes all use the current slot.</p>`+[1,2,3].map(n=>{const i=slotInfo(n);
    return `<div class="slot" style="background:#fff;border:1.5px solid ${n===cur?'var(--buoy)':'var(--line)'};border-radius:12px;padding:10px 12px;margin-bottom:10px"><b>Slot ${n}</b>${n===cur?' <span style="font-size:12px;color:var(--buoy);font-weight:700">· current</span>':''}<div style="font-size:13px;color:var(--mute);margin-top:2px">${slotLine(i)}</div>
    <div style="display:flex;gap:6px;margin-top:8px">${i&&!i.broken?`<button style="${SLOTBTN};background:var(--buoy);color:#fff;border-color:var(--buoy)" onclick="slotAct(${n},'cont')">Continue</button>`:''}<button style="${SLOTBTN}" onclick="slotAct(${n},'new')">Start new here</button>${i?`<button style="${SLOTBTN};color:var(--bad)" onclick="slotAct(${n},'del')">Delete</button>`:''}</div></div>`}).join(''),
  [{l:'Close',fn:()=>{if(!S||S.over||document.querySelector('.title'))titleScreen()}}]);
};
window.slotAct=(n,a)=>{const el=document.getElementById('mbg');el&&el.remove();const i=slotInfo(n);
  if(a==='cont'){setSlot(n);return resumeGame()}
  if(a==='new'){const go=()=>{setSlot(n);titleScreen();startNewWeek()};
    return i?modal(`Start over in slot ${n}?`,`<p>The saved week in slot ${n} (${slotLine(i)}) will be replaced when you start.</p>`,[{l:'Start a new week here',fn:go},{l:'Cancel',fn:()=>slotsModal()}]):go()}
  if(a==='del') modal(`🗑️ Delete slot ${n}?`,`<p>This erases the saved week in slot ${n} (${slotLine(i)}). It can’t be undone.</p>`,[{l:'Delete it',fn:()=>{const ls=store();if(ls)slotKeys(n).forEach(k=>ls.removeItem(k));titleScreen();slotsModal()}},{l:'Cancel',fn:()=>slotsModal()}]);
};
function slotSwitchModal(){const cur=curSlot();
  modal('💾 Save slot',`<p>You’re playing in <b>slot ${cur}</b>. Your week is saved before you switch.</p>`,[
    ...[1,2,3].map(n=>{const i=n===cur?null:slotInfo(n);return {l:`Slot ${n}${n===cur?' (this game)':''}`,s:n===cur?'You’re here.':i&&!i.broken?'Continue: '+slotLine(i):i?'Unreadable save: manage it from the title screen.':'Empty: start a new week here',dis:n===cur||!!(i&&i.broken),
      fn:()=>{saveGame();MQ=[];clearTiles();setSlot(n);if(i)return resumeGame();S=null;titleScreen();startNewWeek()}}}),
    {l:'Back to settings',fn:()=>openSettings()}]);
}

// ---------------- title ----------------
function clearTiles(){tileQ=[];document.querySelectorAll('#tiles .tile').forEach(t=>t.remove())}
function titleScreen(){clearTiles();const showUpdate=updateNotice();
  app.innerHTML=withName(`<div class="title"><button class="tgear" onclick="openSettings()" aria-label="Settings">⚙️</button><div class="art"><svg viewBox="0 0 480 250" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><defs><linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fbcc4"/><stop offset="1" stop-color="#e2e6dc"/></linearGradient></defs><rect width="480" height="250" fill="url(#ts)"/><rect y="96" width="480" height="154" fill="#1d4b5a"/>
   <polygon points="250,95 330,25 345,36 356,28 440,95" fill="#e9eef0"/><polygon points="310,43 330,25 345,36 356,28 375,45 355,42 342,48 328,40" fill="#fff"/>
   ${Array.from({length:16},(_,i)=>{const x=i*32-10,h=50+((i*29)%45);return `<polygon points="${x},96 ${x+16},${96-h} ${x+32},96" fill="#2f5d4a"/>`}).join('')}
   <g transform="translate(150,150)"><g class="bob"><rect x="0" y="20" width="170" height="24" rx="4" fill="#f4f1ea"/><rect x="0" y="38" width="170" height="9" fill="#2f5d4a"/><rect x="60" y="2" width="50" height="20" fill="#f4f1ea"/><rect x="65" y="6" width="40" height="7" fill="#2a3d45"/><rect x="80" y="-12" width="9" height="16" fill="#e3642e"/></g></g>
   <path d="M0 210 h480 M0 230 h480" stroke="#fff" stroke-opacity=".1"/></svg></div>
  <div class="body"><h1>Island Time<span>A week of living on Anderson Island, WA</span></h1>
  <p>There’s no bridge. One small county ferry connects your island home to your job, the grocery store, the gas pump and your doctor. This week it has to get you through all of it.</p>
  <ul><li>Work in Lakewood Mon–Fri. Clock in by 9:00.</li><li>Keep food in the pantry. The island’s only store closed this year.</li><li>Keep gas in the car. There’s no gas on the island, and gas cans are banned on the ferry.</li><li>Make your Thursday doctor’s appointment in Tacoma and pick up your prescription.</li><li>Be in the ferry line 20 minutes early. Watch for fog, full boats and breakdowns.</li><li>Trade on the side: import food, medicine and fuel to the island, or take a bigger risk.</li></ul>
  ${(()=>{const d=loadSave(),sl=d&&(curSlot()>1||[2,3].some(k=>slotInfo(k)))?` (slot ${curSlot()})`:'';return d?`<button class="big" onclick="resumeGame()">Continue as ${esc(d.S.name||currentName())}: ${seasonBadge(d.S)} · ${d.S.story?`Chapter ${(d.S.story.ch|0)+1} of 4 · `:''}${DAYS[d.S.cur]} ${fmt(d.S.t)}${sl} ⛴️</button><button class="ghost" onclick="startNewWeek()">Start a new week</button>`:`<button class="big" onclick="startNewWeek()">Start Monday ⛴️</button>`})()}
  <button class="ghost" onclick="slotsModal()">💾 Save slots</button>
  <button class="ghost" onclick="openTransfer()">🔁 Transfer a saved game</button>
  ${saveNotice?`<div class="hint">⚠️ ${saveNotice}</div>`:''}${exitNotice?`<div class="hint">${exitNotice}</div>`:''}
  <button id="installBtn" class="ghost" style="display:${deferredInstall&&!isStandalone()?'block':'none'}" onclick="doInstall()">📲 Install as an app</button>
  ${!isStandalone()&&isIOS()?'<div class="hint">📲 <b>Play it like an app:</b> tap the Share button in Safari, then <b>Add to Home Screen</b>. It works offline, too.</div>':''}
  <div class="small-note">Version ${APP_VERSION}. Fictionalized for fun. The schedule, prices and people are made up. The store closure and the fuel rules are real as of mid-2026.</div></div></div>`);
  exitNotice='';
  if(showUpdate)showUpdate();
}
titleScreen();
