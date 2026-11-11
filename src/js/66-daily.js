// ---------------- ☀️ daily challenge: today's seeded day, one quick goal, a score and a share code ----------------
// Reuses the weekly machinery in 31/32: the game is a normal Monday (day 0) whose week plan, weather, sailings, outages and
// prices are seeded from the real local date (CH.pending → chBase → chRand streams), so everyone playing on that date gets
// the same day. It ends when you go to bed. Share codes are the IT1 format with the id "D" + YYYY-MM-DD as the kind marker
// (old versions decode them as a "week" with that id; the board labels them "Daily"). S.challenge={id,seed,season,diff,daily:1,goal}.
const DAILY_GOALS={
  work:{ic:'💼',n:'Get to work on time',d:'Clock in at your Lakewood job by 9:00.',ok:()=>!!S.worked[0]&&!(S.late||{})[0]},
  errands:{ic:'🛒',n:'Run the errands',d:'End the day with at least 4 days of food (pantry plus bags) and 9+ gallons in the car.',ok:()=>S.pantry+(S.carried||0)>=4&&(S.cars.find(c=>c.id==='isl')||{fuel:0}).fuel>=9},
  home:{ic:'🏡',n:'Make it home',d:'Work your shift, then be asleep in your own bed on the island, not stranded.',ok:w=>w==='home'&&!!S.worked[0]}};
const DAILY_IDS=Object.keys(DAILY_GOALS);
function dailyDateId(date=new Date()){const p=n=>String(n).padStart(2,'0');return 'D'+date.getFullYear()+'-'+p(date.getMonth()+1)+'-'+p(date.getDate())}
const dailyIsId=id=>/^D\d{4}-\d{2}-\d{2}$/.test(String(id||''));
function dailyDateOf(id){const m=/^D(\d{4})-(\d{2})-(\d{2})$/.exec(String(id||''));return m?new Date(+m[1],+m[2]-1,+m[3],12):null}
function dailyText(id){const d=dailyDateOf(id);return d?d.toLocaleDateString('en-US',{month:'short',day:'numeric'}):String(id)}
function dailySpec(id=dailyDateId()){
  const seed=chHash('islandtime-daily|'+id),d=dailyDateOf(id),mo=d?d.getMonth():10;
  let season=[11,0,1].includes(mo)?'winter':[2,3,4].includes(mo)?'spring':[5,6,7].includes(mo)?'summer':'fall';
  if(typeof seasonOk==='function'&&!seasonOk(season))season='fall';
  return {id,seed,season,diff:'normal',goal:DAILY_IDS[chHash('goal|'+id)%DAILY_IDS.length],daily:1};
}
const dailyOn=()=>!!(typeof S!=='undefined'&&S&&S.challenge&&S.challenge.daily);
function dailyStart(id=dailyDateId()){
  const sp=dailySpec(id);CH.pending={id:sp.id,seed:sp.seed,season:sp.season,diff:sp.diff,daily:1,goal:sp.goal};
  try{S=null;newGame(sp.diff,'week',sp.season)}finally{CH.pending=null}
  const g=DAILY_GOALS[sp.goal];say(`☀️ <b>Daily challenge, ${dailyText(id)}.</b> Today’s goal: ${g.ic} <b>${g.n}</b>. ${g.d} Go to bed to finish the day.`);
  return S.challenge}
// the score: goal 500, shift 120 (+80 on time), home on the island 150, cash change up to ±200, health and calm up to 200
function dailyScore(where){
  const g=DAILY_GOALS[S.challenge.goal]||DAILY_GOALS.work,worked=!!S.worked[0],onTime=worked&&!(S.late||{})[0],met=!!g.ok(where);
  const dm=Math.round(S.money-DIFFS.normal.money),L=[];
  const parts=[[met?500:0,`${g.ic} Goal: ${g.n}`+(met?' ✓':' ✗')],[worked?120:0,'💼 Worked your shift'],[onTime?80:0,'⏰ On time'],[where==='home'?150:0,'🏡 Slept at home'],
    [Math.max(-200,Math.min(200,Math.round(dm/2))),`💵 Cash ${dm>=0?'+':'−'}$${Math.abs(dm)}`],[Math.round(S.health)+Math.round(100-S.stress)>0?Math.round((S.health+(100-S.stress))):0,'❤️ Health and calm']];
  const score=Math.max(0,parts.reduce((a,p)=>a+p[0],0));
  const grade=score>=1000?'A':score>=800?'B':score>=600?'C':score>=400?'D':'F';
  return {score,grade,met,worked,onTime,home:where==='home',parts,title:{A:'Island Pro',B:'Ferry-Hardened',C:'Made It Through',D:'A Rough One',F:'Not Your Day'}[grade]}}
function dailyResult(){const E=S.ending,D=S.dailyRes||{score:0,grade:'F',title:''};
  return {id:S.challenge.id,score:E?E.score:D.score,money:Math.round(S.money),grade:E?E.grade:D.grade,title:E?E.title:D.title,workdays:S.worked[0]?1:0,stranded:S.dailyWhere&&S.dailyWhere!=='home'?1:0,rep:typeof repVal==='function'?repVal():0,over:!!S.over,lost:!!(E&&E.lost)}}
if(typeof challengeResult==='function'){const _r=challengeResult;challengeResult=function(){return dailyOn()?dailyResult():_r.apply(this,arguments)}}
// the day ends at bedtime (or a night on the mainland): no night, no tomorrow
{const _e=endDay;endDay=function(where){
  if(!dailyOn()||S.over)return _e.apply(this,arguments);
  try{processTimed()}catch(e){}
  S.dailyWhere=where;S.dailyRes=dailyScore(where);S.over=true;clearTiles();MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());
  endScreen('Day done',S.dailyRes.met?'You hit today’s goal.':'You didn’t quite get there.',false)}}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);
  if(dailyOn()&&!S.over){const g=DAILY_GOALS[S.challenge.goal];
    a.forEach(x=>{if(/bed|Turn in early|Sleep|motel/i.test(x.l||'')&&/Ends the day/.test(x.s||''))x.s=x.s.replace('Ends the day.','Ends the daily challenge.')});
    a.unshift({ic:g.ic,l:`Daily goal: ${g.n}`,s:g.d+' Go to bed to finish the day and get your score.',dis:true,cat:'work'})}
  return a}}
function dailySaveMine(r){const d=chLoad(),o=d.mine[r.id];if(!o||r.score>o.score){d.mine[r.id]=r;chSave(d)}}
{const _es=endScreen;endScreen=function(h1,sub,lost){
  if(!dailyOn())return _es.apply(this,arguments);
  try{dailyEnd(h1,sub,lost)}catch(e){console.error(e);return _es.apply(this,arguments)}}}
function dailyEnd(h1,sub,lost){
  const D=S.dailyRes&&!lost?S.dailyRes:Object.assign(dailyScore(S.dailyWhere||(S.loc==='home'?'home':'x')),{score:0,grade:'F',title:'Not Your Day'});
  S.dailyRes=D;S.ending={score:D.score,grade:D.grade,title:D.title,lost:!!lost};chSync();saveGame();
  let r=dailyResult();r={...r,name:chClean((S&&S.name)||currentName())};dailySaveMine(r);const code=chEncode(r),id=r.id;
  const row=(k,v)=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  app.innerHTML=withName(`<div class="end"><div style="display:flex;justify-content:space-between;align-items:center"><div class="small-note" style="color:var(--mute)">${lost?'GAME OVER':'DAILY CHALLENGE'} · ${esc(dailyText(id))}</div><button class="gear" style="background:var(--sand);color:var(--ink)" onclick="openSettings()" aria-label="Settings">⚙️</button></div>
  <h1>${lost?esc(h1):D.met?'Goal reached':'Day done'}</h1><p>${lost?esc(sub):D.met?'You hit today’s goal.':'You didn’t quite get there.'}</p>
  <div style="display:flex;gap:16px;align-items:center;margin:16px 0"><div class="grade">${D.grade}</div><div><b style="font-family:Fraunces;font-size:20px">${esc(D.title)}</b><div style="color:var(--mute);font-size:14px">Score ${D.score}</div></div></div>
  ${(lost?[]:D.parts).map(p=>row(esc(p[1]),(p[0]>=0?'+':'−')+Math.abs(p[0]))).join('')}
  <div id="chbox" style="margin:18px 0;padding:14px;border:1.5px solid var(--line);border-radius:12px"><b style="font-family:Fraunces;font-size:18px">☀️ Daily challenge ${esc(dailyText(id))}</b>
   <div style="font-size:13px;color:var(--mute);margin-top:4px">Share this code so friends who played the same day can compare scores:</div>
   <input id="chcode" readonly data-code="${code}" value="${code}" onfocus="this.select()" style="width:100%;margin:6px 0;font-size:12px;border-radius:8px;border:1.5px solid var(--line);padding:6px">
   <button class="act" onclick="chCopyCode(this)"><span class="tx"><b>Copy code</b></span></button><button class="act" style="margin-top:6px" onclick="chCopyLink(this)"><span class="tx"><b>Copy link</b></span></button>
   <button class="act" style="margin-top:6px" onclick="chCompare('${esc(id)}')"><span class="tx"><b>Compare scores</b></span></button></div>
  <button class="big" style="width:100%;margin-top:10px" onclick="dailyStart('${esc(id)}');tab='act';render()">Try today again</button><button class="act" style="margin-top:10px;justify-content:center" onclick="titleScreen()"><span class="tx" style="text-align:center"><b>Back to title</b></span></button></div>`);
  window.scrollTo(0,0)}
window.dailyStart=dailyStart;
// ---- title screen ----
function dailyStartModal(){const id=dailyDateId(),sp=dailySpec(id),g=DAILY_GOALS[sp.goal],mine=chLoad().mine[id];
  modal(`☀️ Daily challenge · ${dailyText(id)}`,`<p>Everyone who plays on ${dailyText(id)} gets the same day: same weather, sailings, outages and prices. It starts at 5:30 AM and ends when you go to bed.</p><p><b>Today’s goal:</b> ${g.ic} ${g.n}. ${g.d}</p>${mine?`<p>Your best today: <b>${mine.score}</b> (${esc(mine.grade)}).</p>`:''}`,
   [{l:mine?'Play again':'Start',fn:()=>{dailyStart(id);tab='act';render()}},{l:'Compare scores',fn:()=>chCompare(id)},{l:'Never mind',fn:()=>{}}])}
window.dailyStartModal=dailyStartModal;
function dailyTitleButton(){const t=document.querySelector('.title .body');if(!t||t.querySelector('#dayBtn'))return;
  const b=document.createElement('button');b.id='dayBtn';b.className='ghost';b.setAttribute('onclick','dailyStartModal()');b.textContent='☀️ Daily challenge · '+dailyText(dailyDateId());
  const w=t.querySelector('#chBtn');if(w&&w.nextSibling)t.insertBefore(b,w.nextSibling);else if(w)t.appendChild(b);else{const ref=[...t.querySelectorAll('button.ghost')].find(x=>/Save slots/.test(x.textContent));ref?t.insertBefore(b,ref):t.appendChild(b)}}
{const _ts=titleScreen;titleScreen=function(){_ts.apply(this,arguments);dailyTitleButton()}}
// compare scores: label daily boards, and list today's daily
{const _c=chCompare;chCompare=function(week,prefill){_c.call(this,week,prefill);
  try{document.querySelectorAll('#chwk option').forEach(o=>{if(dailyIsId(o.value))o.textContent='Daily '+dailyText(o.value)+(o.value===dailyDateId()?' (today)':'')})}catch(e){}};window.chCompare=chCompare}
dailyTitleButton();
