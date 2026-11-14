// ---- ⛴️ Start page: how long you want to play, right on the title (86-start.js) ----
// Each card on the title (85-sides.js) has 1 week / 1 month / 1 year:
//   🏝️ Islander  week = a week on the island · month = four weeks (the co-op drive) · year = story mode (four chapters, one per season)
//   🧳 Visitor   week = a week's visit in a rental cabin · month = a weekend regular · year = a weekend regular for a year:
//                four months (summer, fall, winter, spring); money, friends and island reputation carry from month to month
// startLen(side,len) picks the slot (sideNew), your name the first time, then the side's own questions and difficulty.
// Everything the title used to explain lives in ℹ️ About: the description, What's new, every way to play, the levels and installing.
const START_LENS={
  I:{week:{s:'Mon–Sun',d:'Monday to Sunday on the island: the commute, the pantry, the gas tank. About 20–30 minutes.'},
     month:{s:'4 weeks',d:'Four weeks; everything carries over week to week, and the island can raise $2,500 to reopen its store as a co-op.'},
     year:{s:'story',d:'Story mode: four chapters, a month in each season, from moving in to the store reopening. About 3 hours.'}},
  V:{week:{s:'a visit',d:'A week’s visit from Seattle, Tacoma or Olympia: a rental cabin, the sights, and the last boat home.'},
     month:{s:'weekends',d:'A weekend regular: a city job on weekdays and every weekend on the island. Save up and you might move over.'},
     year:{s:'4 seasons',d:'A year as a weekend regular: four months, one in each season. Your money, friends and reputation carry over.'}}};
function islStart(len){diffModal(k=>{if(len==='year'){S=null;storyNew(k);tab='act';return render()}
  seasonModal(sea=>{S=null;newGame(k,len==='month'?'month':'week',sea);tab='act';render()})})}
function visStart(len){visitHomeModal(home=>{
  if(len==='year')return vDiffModal(k=>{S=null;regYearNew(home,k);tab='act';render()});
  seasonModal(sea=>vDiffModal(k=>{S=null;visitorNew(len==='week'?'week':'regular',home,k,sea);tab='act';render()}))})}
window.startLen=(side,len)=>{side=side==='V'?'V':'I';len=['week','month','year'].includes(len)?len:'week';
  sideNew(side,()=>{const go=()=>side==='I'?islStart(len):visStart(len);if(!profileName())nameModal({first:true,then:go});else go()})};
// the chooser behind "Start new here" in the saves window: the same three lengths (and the challenges for islanders)
{const _n=newGameModal;newGameModal=function(side){if(side!=='I'&&side!=='V')return _n.apply(this,arguments);
  const opts=['week','month','year'].map(k=>({l:`${k==='week'?'⛴️':k==='month'?'🗓️':'📖'} 1 ${k}`,s:START_LENS[side][k].d,fn:()=>{const go=()=>side==='I'?islStart(k):visStart(k);if(!profileName())nameModal({first:true,then:go});else go()}}));
  if(side==='I'&&typeof chStartModal==='function')opts.push({l:'🏆 Weekly challenge',s:'The same week for everyone. Share your code and compare scores.',fn:()=>chStartModal()});
  if(side==='I'&&typeof dailyStartModal==='function')opts.push({l:'☀️ Daily challenge',s:'Today’s one-day game, the same for everyone.',fn:()=>dailyStartModal()});
  opts.push({l:'Never mind',fn:()=>{}});
  modal(`${SIDES[side].ic} New ${SIDES[side].n.toLowerCase()} game`,`<p>How long do you want to play? It goes in ${SIDES[side].n.toLowerCase()} slot ${slotNo(curSlot())}.</p>`,opts)};
 window.newGameModal=newGameModal}

// ---- 🧳 a year as a weekend regular: four months, one per season ----
const REG_YEAR_SEASONS=['summer','fall','winter','spring'];
const regYearOn=()=>typeof regOn==='function'&&regOn()&&!!(S.visitor&&S.visitor.year);
function regYearNew(home,diff){
  visitorNew('regular',home,diff,storySeasonOf(0));
  S.visitor.year={m:0,log:[]};
  modal('📅 A year as a weekend regular',`<p><b>Month 1 of 4: ${SEA(storySeasonOf(0)).ic} ${SEA(storySeasonOf(0)).n}.</b> A city job on weekdays, the island every weekend, for a whole year: one month in each season, with the months between skipped.</p><p>Your money, island friends and reputation carry from month to month. Buy a house on the island when one comes up, any time in the year.</p>`,[{l:'Start the first month',fn:()=>{}}]);
  saveGame()}
{const _e=regEndMonth;regEndMonth=function(){try{if(regYearOn()&&(S.visitor.year.m|0)<3)return regYearNext()}catch(e){console.error(e)}return _e.apply(this,arguments)}}
function regYearNext(){const V=VS(),Y=V.year,g=regGoal(),m=Y.m|0,next=storySeasonOf(m+1),N=SEA(next);
  Y.log.push({m,net:g.net,rep:V.rep,fr:regFriendsN()});
  const carry={money:Math.round(S.money),friends:JSON.parse(JSON.stringify(S.friends||{})),rep:V.rep,name:S.name,home:V.home,diff:S.diff,
    year:{m:m+1,log:Y.log.slice()},stats:JSON.parse(JSON.stringify(S.stats||{}))};
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();
  modal(`📅 Month ${m+1} of 4 done`,`<p>${SEA(S.season).ic} ${esc(SEA(S.season).n)} is over. Savings after rent and bills: <b>${g.net<0?'−':''}${$(Math.abs(g.net))}</b> · island reputation <b>${V.rep>0?'+':''}${V.rep}</b> · <b>${g.fr}</b> island friends.</p>
    <p>Next: <b>month ${m+2} of 4, ${N.ic} ${esc(N.n)}</b>. Your money, friends and reputation come with you.</p>`,
    [{l:'Months later… ⛴️',s:`${N.n}: a new month in the city and on the island.`,fn:()=>regYearStart(carry,next)}],true)}
function regYearStart(c,season){S=null;visitorNew('regular',c.home,c.diff,season);
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();
  const V=VS(),R=REG();S.name=c.name||S.name;S.money=c.money;R.start=c.money;S.friends=c.friends;V.rep=c.rep;V.year=c.year;
  for(const k in c.stats)if(typeof c.stats[k]==='number'&&typeof S.stats[k]==='number')S.stats[k]=c.stats[k];
  uiNarr=[];S.log=[];
  say(`📅 <b>Month ${c.year.m+1} of 4: ${SEA(season).ic} ${SEA(season).n}.</b> Back to the city job on Monday, back on the boat on Friday.`);
  showTile('📅',`Month ${c.year.m+1} of 4`,SEA(season).n,'info');
  tab='act';render();saveGame()}
window.regYearStart=regYearStart;
// the end screen and the top of the screen know it's a year
{const _es=regEndScreen;regEndScreen=function(){const r=_es.apply(this,arguments);try{if(S&&S.visitor&&S.visitor.year){const e=document.querySelector('.end .small-note');
  if(e)e.innerHTML=e.innerHTML.replace('MONTH COMPLETE','YEAR COMPLETE').replace('MONTH CUT SHORT','YEAR CUT SHORT');
  const k=document.querySelector('.end .kv');if(k)k.insertAdjacentHTML('beforebegin',`<div class="kv"><span>📅 A year as a weekend regular</span><b>month ${(S.visitor.year.m|0)+1} of 4</b></div>`)}}catch(e){console.error(e)}return r}}
{const _h=hud;hud=function(){const r=_h.apply(this,arguments);try{if(S&&S.visitor&&S.visitor.year)return r.replace(/Week (\d)\/4/,`Month ${(S.visitor.year.m|0)+1}/4 · Week $1/4`)}catch(e){}return r}}

// ---- ℹ️ About: what the title used to say, and more ----
function aboutModal(){const seen=(()=>{try{return localStorage.getItem('islandtime-wn-seen')}catch(e){return null}})();
  const L3=side=>`<ul class="ablist">${['week','month','year'].map(k=>`<li><b>1 ${k}:</b> ${esc(START_LENS[side][k].d)}</li>`).join('')}</ul>`;
  const lv=o=>Object.keys(o).map(k=>`${o[k].ic} <b>${esc(o[k].n)}</b>`).join(', ');
  modal('ℹ️ About Island Time',`<p>There’s no bridge. One small county ferry connects Anderson Island, in the south of Puget Sound, to the jobs, groceries, gas and doctors on the mainland. Island Time is a game about living with that boat, or visiting.</p>
    <div class="abbtns"><button class="act primary" id="wnBtn" onclick="aboutWN()"><span class="tx"><b>✨ What’s new in ${esc(APP_VERSION)}${seen===APP_VERSION?'':' <span class="wndot">new</span>'}</b><span>The changes in each release, and the video tutorial</span></span></button></div>
    <h3 class="abh">🏝️ Islander</h3><p>Live on the island and work in Lakewood. Keep food in the pantry and gas in the car (there’s no store or gas station on the island, and gas cans are banned on the ferry), make your doctor’s appointment, and be in the ferry line 20 minutes early.</p>${L3('I')}
    <h3 class="abh">🧳 Visitor</h3><p>Live in Seattle, Tacoma or Olympia and come over. Beat I-5 traffic, see the sights, make friends, and catch the last boat home.</p>${L3('V')}
    <h3 class="abh">🏆 Challenges</h3><p>The <b>weekly challenge</b> is the same week for everyone, and the <b>daily challenge</b> is today’s one-day game. Share your code and compare scores. Both are islander games.</p>
    <h3 class="abh">🎚️ Difficulty</h3><p>Islanders: ${lv(DIFFS)}. From a forgiving boss and a warming shelter to weekly rent and car trouble.</p><p>Visitors: ${lv(VDIFFS)}. From light traffic and a last-boat heads-up to fog, full boats and no warning.</p>
    <h3 class="abh">💾 Saves</h3><p>Three islander and three visitor games at once. Use 🔁 Transfer to move a game to another device.</p>
    <h3 class="abh">📲 Play it like an app</h3><p>It works offline. On a phone: ${isIOS()?'tap the Share button in Safari, then <b>Add to Home Screen</b>.':'use your browser’s <b>Install app</b> or <b>Add to Home screen</b>.'} On Windows there’s an installer, and a single-file offline version, at <a href="https://krazow.github.io/islandtime/install.html" target="_blank" rel="noopener">krazow.github.io/islandtime/install.html</a>.</p>
    <p class="small-note" style="margin-top:12px">Version ${esc(APP_VERSION)}. Fictionalized for fun: the islanders are made up. The 2026 ferry schedule and fares, the store closure and the fuel rules are real, and the mainland restaurants and attractions are real places (hours and prices may differ). Free and open source: <a href="https://github.com/krazow/islandtime" target="_blank" rel="noopener">github.com/krazow/islandtime</a>.</p>`,
    [{l:'Close',fn:()=>{if(!S||S.over||document.querySelector('.title'))titleScreen()}}])}
window.aboutModal=aboutModal;
window.aboutWN=()=>{const el=document.getElementById('mbg');if(el)el.remove();try{localStorage.setItem('islandtime-wn-seen',APP_VERSION)}catch(e){}
  document.querySelectorAll('#aboutBtn .wndot').forEach(d=>d.remove());whatsNew()};
{const st=document.createElement('style');st.textContent=`.abh{font-family:var(--disp,inherit);font-size:17px;margin:14px 0 4px}.ablist{margin:4px 0 6px;padding-left:18px}.ablist li{margin:3px 0}.abbtns{margin:8px 0 4px}#wnBtn .wndot{display:inline-block;width:auto;margin-left:6px;font-size:11px}`;document.head.appendChild(st)}
sideTitle();
