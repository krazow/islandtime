// ---------------- state ----------------
let S, tab='act', uiNarr=[];
const APP_VERSION='1.16.2', SAVE_SCHEMA=7;
// Season of the current game: 'fall' (default, November), 'winter', 'spring' or 'summer'. The seasons module sets S.season.
// Essentials (groceries, a prescription) can go on the credit card when you're broke, up to a limit,
// like ferry fares and motels already do. Card debt counts against the score.
const CARD_LIMIT=1500;
function canEssential(c){return S.money>=c||S.money-c>=-CARD_LIMIT}
function seasonId(){return (typeof S!=='undefined'&&S&&S.season)||'fall'}
// ---------------- preferences (device-wide) ----------------
const PREF_KEY='islandtime.prefs';
const PREF_DEF={fs:'n',hc:false,rm:(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})(),sound:true,tips:true,diff:'normal',goOpen:null};
function prefs(){try{return Object.assign({},PREF_DEF,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'))}catch(e){return Object.assign({},PREF_DEF)}}
function setPref(k,v){const p=prefs();p[k]=v;try{localStorage.setItem(PREF_KEY,JSON.stringify(p))}catch(e){}applyPrefs()}
function applyPrefs(){const p=prefs(),c=document.documentElement.classList;c.toggle('fs-l',p.fs==='l');c.toggle('fs-xl',p.fs==='xl');c.toggle('hc',!!p.hc);c.toggle('rm',!!p.rm)}
applyPrefs();
// ---------------- sound (synthesized, no files) ----------------
let AC=null;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')AC.resume().catch(()=>{});return AC}
function tone(f,dur,type,vol,when,slide){const a=audio();if(!a)return;const t=a.currentTime+(when||0);const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.1,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+0.05)}
function sfx(n){if(!prefs().sound)return;try{
  if(n==='horn'){tone(110,1.5,'triangle',0.16);tone(138.6,1.5,'triangle',0.12);tone(220,1.5,'sine',0.04)}
  else if(n==='good'){tone(784,0.18,'sine',0.09);tone(1175,0.28,'sine',0.07,0.12)}
  else if(n==='bad'){tone(233,0.22,'triangle',0.12);tone(175,0.35,'triangle',0.1,0.15)}
  else if(n==='info'){tone(660,0.16,'sine',0.06)}
  else if(n==='ball'){[0,0.09,0.18].forEach(w=>tone(1400,0.04,'square',0.025,w))}
  else if(n==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,0.28,'sine',0.09,i*0.1))}
  else if(n==='tap'){tone(520,0.05,'sine',0.03)}
}catch(e){}}

// ---------------- player name ----------------
// Text anywhere in the game can contain the token {{name}}. It's swapped for the current name only when shown,
// so changing your name updates every line already in the log, the narration, pop-ups and tiles.
const NAME_KEY='islandtime.name';
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function profileName(){try{return localStorage.getItem(NAME_KEY)||''}catch(e){return ''}}
function currentName(){return (typeof S!=='undefined'&&S&&S.name)||profileName()||'Islander'}
function withName(t){return typeof t==='string'?t.replace(/\{\{name\}\}/g,esc(currentName())):t}
function cleanName(raw){const n=String(raw||'').replace(/\s+/g,' ').trim();
  if(!n) return {err:'Please enter a name.'};
  if(n.length>20) return {err:'Keep it to 20 characters or fewer.'};
  if(!/^[\p{L}\p{N}][\p{L}\p{N} '’.\-]*$/u.test(n)) return {err:'Letters, numbers, spaces, apostrophes, periods and hyphens only.'};
  return {name:n}}
function setPlayerName(n){
  const old=currentName();
  try{localStorage.setItem(NAME_KEY,n)}catch(e){}
  if(S&&!S.over){S.name=n;if(old!==n)say('✏️ From now on, everyone on the island calls you {{name}}.');saveGame()}
  else{ // on the title screen: update the saved week too, so Continue uses the new name
    const ls=store();if(ls)try{for(const k of slotKeys()){const v=ls.getItem(k);if(!v)continue;const d=JSON.parse(v);if(d&&d.S){d.S.name=n;ls.setItem(k,JSON.stringify(d))}}}catch(e){}
    if(S&&S.over) S.name=n}
}
let NMV='';
window.nameInput=v=>{NMV=v};
function nameModal(opts={}){
  NMV=opts.value!=null?opts.value:currentName();
  modal(opts.first?'👋 Welcome to the island':'👤 Change your name',`${opts.first?'<p>What should your neighbors call you?</p>':'<p>Everyone on the island, and every line in your log, will use the new name.</p>'}
    <input class="nm-in" id="nmIn" maxlength="20" autocomplete="off" value="${esc(NMV)}" oninput="nameInput(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();MBTN(0)}">
    ${opts.err?`<div style="color:var(--bad);font-size:13px;margin-top:6px">${esc(opts.err)}</div>`:'<div style="color:var(--mute);font-size:12px;margin-top:6px">Up to 20 characters. You can change it any time in ⚙️ Settings.</div>'}`,
  [{l:opts.first?'That’s me':'Save name',fn:()=>{const r=cleanName(NMV);if(r.err)return setTimeout(()=>nameModal(Object.assign({},opts,{value:NMV,err:r.err})),0);
      setPlayerName(r.name);if(opts.then)opts.then();else if(document.querySelector('.title'))titleScreen();else if(S&&!S.over)render()}},
   ...(opts.first?[]:[{l:'Cancel',fn:()=>{if(opts.back)opts.back()}}])]);
  setTimeout(()=>{const i=document.getElementById('nmIn');if(i){i.focus();i.select()}},60);
}
function diffModal(then){
  const cur=prefs().diff;
  modal('🗺️ How hard is island life?',`<p>Pick a difficulty for this week.</p>`,Object.keys(DIFFS).map(k=>({l:`${DIFFS[k].ic} ${DIFFS[k].n}${k===cur?' (last time)':''}`,s:DIFFS[k].d,fn:()=>{setPref('diff',k);then(k)}})));
}
function lengthModal(then){
  modal('📅 How long do you want to stay?','<p>One week is a quick game. A month carries everything over (money, friends, your car, your generator) and gives the island time to reopen its store.</p>',[
    {l:'⛴️ One week',s:'Monday to Sunday, about 20–30 minutes.',fn:()=>then('week')},
    {l:'🗓️ A whole month (4 weeks)',s:'Help the islanders raise $2,500 to reopen the store as a co-op, with groceries and gas pumps.',fn:()=>then('month')},
    {l:'📖 Story: a year on the island',s:'Four chapters, summer to spring: a month in each season, with the months between skipped. About 3 hours.',fn:()=>then('story')}]);
}
window.startNewWeek=()=>{const go=k=>lengthModal(mode=>mode==='story'?(storyNew(k),tab='act',render()):seasonModal(sea=>{newGame(k,mode,sea);tab='act';render()}));const pickDiff=()=>diffModal(go);if(!profileName())nameModal({first:true,then:pickDiff});else pickDiff()}; // season

// ---------------- settings ----------------
let exitNotice='';
function accessModal(){
  const p=prefs();
  modal('♿ Accessibility',`<p>These settings apply on this device.</p>`,[
    {l:`🔠 Text size: ${{n:'Normal',l:'Large',xl:'Extra large'}[p.fs]}`,s:'Tap to cycle Normal → Large → Extra large.',fn:()=>{setPref('fs',{n:'l',l:'xl',xl:'n'}[p.fs]);accessModal()}},
    {l:`🌓 High contrast: ${p.hc?'On':'Off'}`,s:'Darker text and borders.',fn:()=>{setPref('hc',!p.hc);accessModal()}},
    {l:`🎞️ Reduce motion: ${p.rm?'On':'Off'}`,s:'Turns off animations and shortens the ferry crossing.',fn:()=>{setPref('rm',!p.rm);accessModal()}},
    {l:'Back to settings',fn:()=>openSettings()}]);
}
window.openSettings=()=>{
  const inGame=S&&!S.over&&!document.querySelector('.title,.end');
  modal('⚙️ Settings',`<p>Playing as <b>{{name}}</b>${S&&!S.over?` · ${DF().ic} ${DF().n} · ${seasonBadge(S)}`:''}.</p><p style="font-size:12px;color:var(--mute)">Island Time version ${APP_VERSION}</p>`,[
    {l:'👤 Change name',s:'Updates your name everywhere in the game.',fn:()=>nameModal({back:openSettings})},
    {l:`🔊 Sound: ${prefs().sound?'On':'Off'}`,s:'Ferry horn, alerts and bingo calls.',fn:()=>{setPref('sound',!prefs().sound);if(prefs().sound)sfx('good');openSettings()}},
    ambSettingBtn(),
    {l:'♿ Accessibility',s:`Text size: ${{n:'Normal',l:'Large',xl:'Extra large'}[prefs().fs]} · High contrast: ${prefs().hc?'On':'Off'} · Reduce motion: ${prefs().rm?'On':'Off'}`,fn:()=>accessModal()},
    {l:`💡 Tutorial tips: ${prefs().tips?'On':'Off'}`,s:prefs().tips?'A guided first week, one tip at a time; trading and Dale unlock on Tuesday.':'Everything unlocked from the start.',fn:()=>{setPref('tips',!prefs().tips);openSettings()}}, // tutorial
    ...tutSettingRows(inGame), // tutorial: 📘 Replay the guided week, 💬 Send feedback
    {l:`🔔 Event pop-ups: ${popupsOn()?'On':'Off'}`,s:popupsOn()?'An OK window for each random event. Tap to turn off (tiles still show).':'Only the small tiles show. Tap to turn pop-ups back on.',fn:()=>{try{localStorage.setItem(POPUP_KEY,popupsOn()?'off':'on')}catch(e){}openSettings()}},
    {l:'📖 How your house works',s:'The Home meter, chores, repairs, Gus and the community group.',fn:()=>houseHelp()},
    {l:'⌨️ Keyboard shortcuts',s:'On a computer: numbers press buttons, P for the phone, ? for the list.',fn:()=>keysModal(openSettings)},
    {l:`🏆 Achievements (${achCount()}/${ACH.length})`,s:'Badges earned on this device, across all your games.',fn:()=>achModal(openSettings)},
    inGame?{l:`💾 Save slot: ${curSlot()}`,s:'Switch to another save slot. Your week is saved first.',fn:()=>slotSwitchModal()}:{l:'💾 Save slots',s:`Current slot: ${curSlot()}. Continue, start or delete games in three slots.`,fn:()=>slotsModal()},
    {l:'🚪 Exit game',s:inGame?'Saves your week first.':'Close Island Time.',fn:()=>confirmExit(inGame)},
    {l:'Close',fn:()=>{}}]);
};
function houseHelp(){
  modal('📖 How your house works',`<p><b>🏠 The Home meter</b> (0–100) is how your house is holding up. It slips every day. Above 75: better sleep and cozy mornings. Below 35: worse sleep, more things break, fewer friends drop by.</p>
  <p><b>🧺 Chores</b> are daily: dishes, laundry, needles, the bed. Skip them and they pile up. A <b>🧽 deep clean</b> on a day off is the big reset.</p>
  <p><b>🌲 Maintenance</b> creeps up on its own: gutters, roof moss, the chimney, the well, potholes. Open <b>🏠 Inside the house</b> and <b>🌲 Outside &amp; property</b> at home. Highlighted jobs are due. Ignored jobs turn into floods, leaks and fires.</p>
  <p><b>⛴️ Contractors</b> (septic, tree crew, propane) live on the mainland. They ride the ferry, so when the boat is down, so are they.</p>
  <p><b>🧰 Gus</b> is the island handyman. Call him from your 📱 phone (Phone → Island numbers) and he does the 3 jobs that need it most. He takes cash, gas or groceries. He lives here, so the ferry can’t stop him. He runs on island time, so sometimes nothing can make him show up.</p>
  <p><b>📣 The community group</b> is where islanders ask for help. Install the <b>Island Group</b> app on your 📱 phone and post once a day and see who answers in a few hours. Someone might come over, lend you a tool, or just argue in the comments.</p>
  <p><b>🤲 Reputation</b>: help a neighbor from the group and people remember. More reputation and more friends mean better odds when you ask. Help enough, and they might show up on a weekend with ladders and a pie.</p>`,[
    {l:'Back to settings',fn:()=>openSettings()},{l:'Close',fn:()=>{}}]);
}
function tryClose(){try{window.close()}catch(e){}
  setTimeout(()=>{if(!document.hidden){exitNotice=inGameExited?'✅ Your week is saved. Your browser won’t let a page close itself, so just close this tab or window. Continue picks up right where you left off.':'Your browser won’t let a page close itself. You can close this tab or window.';titleScreen()}},250)}
let inGameExited=false;
function confirmExit(inGame){
  if(!inGame){inGameExited=!!loadSave();return tryClose()}
  modal('🚪 Exit Island Time?',`<p>Your week is saved automatically. Next time, tap <b>Continue</b> on the title screen to pick up right here${S?` (${DAYS[day()]} ${fmt(S.t)})`:''}.</p>`,[
    {l:'Save and exit',fn:()=>{saveGame();MQ=[];clearTiles();inGameExited=true;titleScreen();tryClose()}},
    {l:'Keep playing',fn:()=>{}}]);
}

function baseState(){
  return {name:profileName()||'Islander',diff:'normal',mode:'week',weekNo:0,emp:'lakewood',interview:null,firedFrom:[],coop:{you:0,town:0,open:false},quests:[],t:330,cur:0,loc:'home',money:850,pantry:2,carried:0,cooler:false,health:80,stress:20,job:70,
    cars:[{id:'isl',name:'Island car (old Subaru)',loc:'home',fuel:4.5,tank:14,diesel:false}],
    cargo:{food:0,med:0,gas:0,diesel:0,drugs:0,party:0,pills:0,hard:0,weed:0},drugCharges:0,homeGas:0,homeDiesel:0,citations:0,delivery:null,ateOut:-1,daleStock:{},
    worked:{},late:{},appt:false,apptMissed:false,rx:false,injury:null,injuryRolled:false,priority:false,
    gossipDay:-1,eagleDay:-1,storeStock:{},log:[],prios:[],home:70,homeLow:false,cleaned:-1,up:upInit(),rep:0,comm:{post:-1,help:-1,flakes:0},alertsSeen:{},over:false,
    stats:{waited:0,bumps:0,stranded:0,missed:0,fares:0,crossings:0,food:0,daleGal:0,smuggled:0,outageNights:0,bought:0,sold:0,drugRuns:0,arrests:0},
    ev:{last:{},count:{},history:[],force:[],flags:{}},tips:{seen:[]},friends:{},power:null,battery:'ok',
    bingo:{nights:0,won:0,donated:0,cards:0,reserved:-1,order:null,delay:0,comped:0},cigs:0,
    alarm:{plug:{on:true,time:330},phone:{on:false,time:330}},phone:80,phoneT:330,gen:null,
    arcs:{sam:{b:0,k:-9,h:0},walt:{b:0,k:-9,h:0},hendersons:{b:0,k:-9,h:0},day:-9},cal:{vet:-1,bazaar:-1,cleanup:-1,drill:-1,bzWk:-1,bz:false,chim:false},
    season:'fall',sea:{}, // season
    week:null};
}
function newGame(diff,mode,season){
  MQ=[];tileQ=[];document.querySelectorAll('#tiles .tile').forEach(t=>t.remove());S=baseState();S.season=seasonOk(season)?season:'fall'; // season
  S.diff=DIFFS[diff]?diff:'normal';S.mode=mode==='month'?'month':'week';S.money=DIFFS[S.diff].money;S.week=genWeek(S.diff);
  uiNarr=[];
  say(`Monday, 5:30 AM. Your alarm goes off ${seasonId()==='summer'?'and it’s already light out':'in the dark'}. Work in Lakewood starts at 9:00. The pantry is getting thin.`); // season
  if(!prefs().tips) say('Tip: the commuter boat leaves the island at 7:35. You have to be in line 20 minutes early.');
  say('⛽ Your car has 4.5 gallons left, and there is no gas station on the island anymore.');
  seasonIntro(); // season
  startDay();
  modal('There’s no gas on the island',`<p>The General Store was the island’s only gas station and only grocery store. It closed on <b>February 2, 2026</b>. A new co-op hopes to reopen it in 2027.</p>
  <p>And you can’t just bring gas over. <b>Gas cans, full or empty, are banned on the Pierce County ferry.</b> Gasoline can only come aboard in your vehicle’s own tank.</p>
  <p>So you can drive the car to the mainland to fill it (and pay the vehicle fare), buy smuggled gas from a neighbor at triple the price, or try smuggling some yourself. The deckhands do look.</p>
  <p style="font-size:13px;color:var(--mute)">The Ferry tab has the actual rules and their exemptions.</p>`,[{l:'Got it. Check the gas gauge.',fn:()=>{}}]);
}
function genWeek(diffKey,sea){
  const b=[];const r=Math.random;const D=DIFFS[diffKey||(S&&S.diff)||'normal']||DIFFS.normal;sea=sea||seasonId(); // season
  for(let k=0;k<(D.major2&&r()<D.major2?2:1);k++) if(r()<D.major){const day=1+Math.floor(r()*4);const start=day*1440+Math.floor((7+r()*11)*60);
    const durs=[300,480,900,1500,2200];b.push({start,end:start+durs[Math.floor(r()*durs.length)],cause:CAUSES[Math.floor(r()*CAUSES.length)]});}
  for(let d=0;d<7;d++){ if(r()<D.minor){const start=d*1440+Math.floor((d===0?10:6)*60+r()*10*60);
      if(!b.some(x=>start<x.end+120&&start>x.start-240)) b.push({start,end:start+90+Math.floor(r()*150),cause:CAUSES[Math.floor(r()*CAUSES.length)]});}}
  const fog=[];for(let d=0;d<7;d++) fog.push(r()<D.fog*seasonMul('fog',sea)?10+Math.floor(r()*20):0);
  const px=[],news=[];for(let d=0;d<7;d++){const o={};for(const g in GOODS)o[g]=GOODS[g].vol&&g!=='drugs'?{M:1,I:1}:{M:0.85+r()*0.3,I:0.8+r()*0.4};px.push(o);news.push(r()<(d===0?0:0.55)?Math.floor(r()*NEWS.length):-1)}
  let storm=null;
  if(r()<D.storm*seasonMul('storm',sea)){const sd=1+Math.floor(r()*5);const st=sd*1440+Math.floor((15+r()*4)*60);storm={day:sd,start:st,end:st+(r()<0.5?960:2280)}; // season
    const ws=st+20;if(!b.some(x=>ws<x.end&&ws+200>x.start)) b.push({start:ws,end:ws+120+Math.floor(r()*120),cause:'high winds (gale warning)'});}
  const wk={b,fog,storm,px,news,bingo:Math.floor(r()*BINGO_FOR.length)};
  return sea==='fall'?wk:seasonWeek(wk,sea,(S&&S.weekNo)||0); // season
}
const day=()=>S.cur;
const tod=()=>S.t-S.cur*1440;
function fmt(m){m=((m%1440)+1440)%1440;let h=Math.floor(m/60),mi=m%60;const ap=h<12?'AM':'PM';h=h%12||12;return h+':'+String(mi).padStart(2,'0')+' '+ap}
function fmtAbs(a){const d=Math.floor(a/1440);return (d!==day()?DAYS[((d%7)+7)%7].slice(0,3)+' ':'')+fmt(a)}
function say(s){uiNarr.push(s);S.log.push({t:S.t,s})}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function adj(k,v){S[k]=clamp(Math.round(S[k]+v),0,100)}
function money(v){S.money=Math.round((S.money+v)*100)/100}
const $=x=>'$'+(Math.round(x*100)/100).toFixed(x%1?2:0);
function carHere(){return S.cars.find(c=>c.loc===S.loc)}
function isOpen(id,t=S.t){const h=L[id].hours;if(!h)return true;const r=h(Math.floor(t/1440));if(!r)return false;const m=t%1440;return m>=r[0]&&m<r[1]}
function hoursTxt(id){const h=L[id].hours;if(!h)return '';const r=h(day());return r?`Open ${fmt(r[0])}–${fmt(r[1])}`:'Closed today'}

