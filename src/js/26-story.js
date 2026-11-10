// ---------------- 📖 story mode: a year on the island, in four chapters ----------------
// A story game is a month game (S.mode stays 'month', so all the 4-week logic just works) plus S.story:
//   {ch:0..3, seasons:['summer','fall','winter','spring'], flags:{}, recap:[], f0:[friend ids at chapter start], m0:money at chapter start,
//    told:{flags already shown in an interlude}, ending:{id,title,text}|null, epilogue:[lines]}
// Chapter i is a 4-week month in seasons[i]. When the month would end (week 4, Sunday night), finish() is
// intercepted: chapters 1–3 end with an interlude and a jump ahead to the next season; chapter 4 ends the game
// with one of several endings (storyEnding) on the end screen.
//
// ---- the contract for the story beats (27-story-ferry.js, 28-story-island.js load after this file) ----
//   storyHooks.push({id, chapterStart(ch,notes){}, chapterEnd(ch,notes){}, ending(flags){return [epilogue lines]}})  (all optional)
//   storyOn() → true in a story game; storyCh() → 0..3, or -1 outside story mode
//   Flags live in S.story.flags: levy:'pass'|'fail', drydock:true, storm:{helped:n}, coopOpen:true|false (missing = neutral).
//   Beats keep their own state in S.story.ferry / S.story.island; S.story is carried whole from chapter to chapter.
//   chapterStart(0) runs when a story starts, chapterStart(ch) right after each jump ahead (S is already the new
//   chapter: Monday 5:30 AM, at home, the new season). chapterEnd(ch) runs before each jump and before the ending.
//   jobSeasonEnd(notes,prevSeason,newSeason) (if some module defines it) runs after the jump, before chapterStart.
//   storyShift(v) rebases a dayKey() stamp from the old chapter into the new one (v−28; negatives are left alone).
const storyHooks=[];
function storyOn(){return !!(typeof S!=='undefined'&&S&&S.story)}
function storyCh(){return typeof S!=='undefined'&&S&&S.story?S.story.ch:-1}
const STORY_SEASONS=['summer','fall','winter','spring'], STORY_N=4, STORY_DAYS=28;
const STORY_CH=[
  {ic:'☀️',t:'Summer: Moving in',when:'July 2026',intro:'You moved to Anderson Island at the end of June: a house in the firs, a ferry to catch and a job in Lakewood. This is your first month as an islander. Learn the boats, meet the neighbors, and try not to run out of gas.'},
  {ic:'🍂',t:'Fall: The vote',when:'November 2026',intro:'November. The ferry levy is on the ballot, and every yard sign on the island is arguing with the one next to it. The rain is back, and so is the woodsmoke.'},
  {ic:'❄️',t:'Winter: The storm',when:'January 2027',intro:'January. Eight hours of daylight, ice on the ferry ramp, and the forecasters have started using the word “historic” about something out in the Pacific.'},
  {ic:'🌱',t:'Spring: The store',when:'April 2027',intro:'April. The alders are green, the frogs at Lake Josephine are loud, and the old General Store has a fresh coat of paint on the door. The co-op is close. Everyone says so.'}];
function storySeasonOf(i){const s=STORY_SEASONS[i]||'summer';return seasonOk(s)?s:'winter'}   // spring may not exist in every build
function storyTitle(ch){const c=STORY_CH[ch]||STORY_CH[0];return `${c.ic} ${c.t}`}
// "Chapter 2 of 4 · Week 1 of 4" (long) or "Chapter 2/4 · Week 1/4" (HUD). A function declaration: the title screen uses it at load.
function storyWeekTxt(x,long){x=x||S;const ch=((x.story&&x.story.ch)||0)+1,w=(x.weekNo||0)+1;
  return long?`Chapter ${ch} of 4 · Week ${w} of 4`:`Ch. ${ch}/4 · Week ${w}/4`}
function storyHook(name,...args){const out=[];for(const h of storyHooks){if(!h||typeof h[name]!=='function')continue;
  try{const r=h[name](...args);if(Array.isArray(r))out.push(...r)}catch(e){console.error('story hook',h.id,name,e)}}return out}
const storyShift=v=>typeof v==='number'&&v>=0?v-STORY_DAYS:v;
const storyFriendName=f=>String(f&&f.name||'').split(',')[0].split(' from')[0];

// ---- starting a story ----
function storyNew(diff){
  // the chapter card goes up first; newGame's "no gas on the island" note queues behind it
  modal(`📖 Chapter 1 of 4 · ${STORY_CH[0].t}`,`<p class="story-when">${STORY_CH[0].when}</p><p>${STORY_CH[0].intro}</p><p style="font-size:13px;color:var(--mute)">A year on the island: four chapters, one month in each season, with months skipped in between. Your money, job, friends, house and reputation carry over from chapter to chapter.</p>`,[{l:'Start the summer',fn:()=>{}}]);
  newGame(diff,'month',storySeasonOf(0));
  S.story={ch:0,seasons:STORY_SEASONS.slice(),flags:{},recap:[],told:{},f0:Object.keys(S.friends),m0:S.money,ending:null,epilogue:[]};
  const notes=[];storyHook('chapterStart',0,notes);
  say(`📖 <b>Chapter 1 of 4 · ${STORY_CH[0].t}.</b> ${STORY_CH[0].when}.`);notes.forEach(n=>say(n));
  showTile('📖','Chapter 1 of 4',STORY_CH[0].t,'info');
  saveGame();
}

// ---- end of a chapter ----
let STORY_NIGHT=-1;   // S.log length when the last night began, so the interlude can show that night's notes
{const _ed=endDay;endDay=function(){STORY_NIGHT=S&&S.log?S.log.length:-1;return _ed.apply(this,arguments)}}
function storyNightNotes(){if(STORY_NIGHT<0||!S.log)return [];return S.log.slice(STORY_NIGHT).map(e=>e.s).filter(s=>typeof s==='string')}
// unpaid bills are settled at the end of a chapter, like the end of the game
function storyPayBills(notes){if(!S.hh||typeof HH_BILLS==='undefined')return;let tot=0;
  for(const k in HH_BILLS){const b=HB(k);if(!b.paid){const a=b.check>=0?0:hhOwed(k);money(-a);tot+=a;b.paid=true;b.how='end'}}
  if(tot>0)notes.push(`🧾 The month’s unpaid bills (${$(tot)}) went to collections and onto your card.`)}
function storyRecap(ch){const X=S.story,f0=X.f0||[];
  return {ch,money:Math.round(S.money),health:S.health,stress:S.stress,dm:Math.round(S.money-(X.m0??S.money)),job:S.emp&&JOBS[S.emp]?JOBS[S.emp].n:null,rep:repVal(),tier:repTier().n,tierIc:repTier().ic,
    friends:Object.keys(S.friends).filter(id=>!f0.includes(id)).map(id=>storyFriendName(S.friends[id]))}}
// a line for each beat the first time its flag shows up
function storyBeatLines(mark){const X=S.story,F=X.flags||{},T=X.told||(X.told={}),out=[];
  const add=(k,l)=>{if(F[k]==null||T[k])return;if(mark)T[k]=1;out.push(l)};
  add('levy',F.levy==='pass'?'🗳️ The ferry levy passed. Later boats are coming, and a bigger fare with them.':'🗳️ The ferry levy failed. The schedule stays as thin as it was.');
  add('drydock','🛠️ The ferry went into dry dock, and the island got by on a smaller boat and a lot of patience.');
  if(F.storm){const n=(F.storm&&F.storm.helped)|0;add('storm',`🌪️ The storm of the decade came through. ${n?`You checked on ${n} neighbor${n===1?'':'s'}.`:'You rode it out on your own.'}`)}
  if(F.coopOpen!=null)add('coopOpen',F.coopOpen?'🏪 The co-op opened its doors in the old General Store.':'🏪 The co-op didn’t open. Not yet.');
  return out}
// "months later": what happened in between, varied by your job, your reputation and the story so far
const STORY_SKIP=[
  'August turns the blackberries black and the grass gold. September brings the first rain, and by October the ferry line smells like wet wool and woodsmoke.',
  'December is dark by 4:30. The island does the holidays its own way: a lighted boat parade off the marina, a potluck at the Legion, and a ferry line full of wrapped presents.',
  'February and March are mud and moss. Then one morning the alders have a green haze on them, the frogs at Lake Josephine start up at dusk, and the light lasts past six.'];
const STORY_REP_SKIP={regular:'By now people wave you into the ferry line ahead of them.',known:'People know your car now, in a good way.',new:'Most of the island still knows you as the one who moved into that house.',
  talked:'People still talk about you at the Riv, and not kindly.',pariah:'Conversations stop when you walk into the Riv. They start back up when you leave.'};
function storySkipText(ch,job){const F=S.story.flags||{},p=[STORY_SKIP[ch]||''];
  p.push(job?`You kept your job (${job}). The commute became routine: same boat, same seat, same deckhand who waves.`:'Without steady work, the months went by on odd jobs, the credit card and a lot of rice.');
  p.push(STORY_REP_SKIP[repTier().id]||'');
  if(ch===1&&F.levy)p.push(F.levy==='pass'?'The levy money hasn’t reached the schedule yet, but people are already planning their evenings around a later boat.':'The failed levy is still the main topic on the bulletin board at the old store.');
  if(ch===2&&F.storm&&F.storm.helped>0)p.push('Neighbors you checked on during the storm still drop by with leftovers.');
  if(ch===2&&F.drydock)p.push('The ferry is back from dry dock, painted and a little less rattly.');
  return p.filter(Boolean).join(' ')}
function storyChapterEnd(){
  const X=S.story,ch=X.ch,night=storyNightNotes(),endNotes=[];
  storyPayBills(endNotes);
  storyHook('chapterEnd',ch,endNotes);
  endNotes.forEach(n=>S.log.push({t:S.t,s:n}));
  const rec=storyRecap(ch);X.recap.push(rec);
  const beats=storyBeatLines(true);
  try{achCheck({chapter:ch})}catch(e){}
  const job=S.emp&&JOBS[S.emp]?JOBS[S.emp].n:null,skip=storySkipText(ch,job);
  const r=storyAdvance(),startNotes=r.notes;
  const nx=X.ch;
  const row=(k,v)=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  modal(`📖 Chapter ${ch+1} of 4 is done: ${STORY_CH[ch].t}`,
    `${night.length?`<div class="story-night"><b>Sunday night</b>${night.map(n=>'<p>'+n+'</p>').join('')}</div>`:''}${endNotes.map(n=>'<p>'+n+'</p>').join('')}
    <div class="story-sum">${row('💵 Money',`${rec.money<0?'−':''}$${Math.abs(rec.money)} (${rec.dm>=0?'+':'−'}$${Math.abs(rec.dm)} this chapter)`)}${row('💼 Job',rec.job||'Out of work')}${row('🤲 Reputation',`${rec.tierIc} ${rec.tier} · ${rec.rep>0?'+':''}${rec.rep}`)}${row('🤝 Friends made',rec.friends.length?esc(rec.friends.join(', ')):'none this chapter')}</div>
    ${beats.map(b=>'<p>'+b+'</p>').join('')}
    <h3 class="story-skip">Months later…</h3><p>${skip}</p>
    <p>💵 ${r.delta>=0?`Months of paychecks, minus the bills: +$${r.delta}.`:`Months of odd jobs and bills: −$${-r.delta}.`} ❤️ Health +15 · 😌 Stress −25: time away from the ferry clock does that.</p>
    ${startNotes.map(n=>'<p>'+n+'</p>').join('')}
    <p class="story-when">Chapter ${nx+1} of 4 · ${STORY_CH[nx].t} · ${STORY_CH[nx].when}</p><p>${STORY_CH[nx].intro}</p>`,
    [{l:`Begin chapter ${nx+1}: ${STORY_CH[nx].t}`,fn:()=>{}}]);
  startDay();render();
}
// the jump ahead: a fresh month in the next season, with your life copied over. Returns {delta, notes}.
const STORY_KEEP=['name','diff','money','health','stress','emp','job','firedFrom','firedAt','friends','rep','repx','ph','eco','up','home','hh','cars','homeGas','homeDiesel',
  'coop','stats','bingo','prios','cigs','citations','drugCharges','achGame','gen','cooler','alarm','battery','tips','arcs','comm','log','story','homeLow'];
const STORY_DROP=['rest','nextHide','daily','lastBoatNote','sea','power','delivery','interview','quests','cal','week','ev','cargo','worked','late','apptMissed','appt','rx','injury','injuryRolled','priority','storeStock','daleStock'];
function storyAdvance(){
  const o=S,X=o.story,prev=o.season,ch=X.ch+1,sea=storySeasonOf(ch),notes=[];
  const F=baseState();
  for(const k of STORY_KEEP)if(o[k]!==undefined)F[k]=o[k];
  for(const k in o)if(!(k in F)&&!STORY_DROP.includes(k))F[k]=o[k];   // state other modules keep (their own "your life" objects)
  Object.assign(F,{season:sea,mode:'month',weekNo:0,cur:0,t:330,loc:'home',pantry:3,carried:0,phone:100,phoneT:330,over:false});
  S=F;uiNarr=[];PLAN={to:null,by:null,off:0};
  X.ch=ch;
  // money, health and stress over the skipped months
  const delta=o.emp?400:-300;S.money=Math.max(-1500,Math.round((o.money+delta)*100)/100);
  S.health=Math.min(100,(o.health|0)+15);S.stress=Math.max(0,(o.stress|0)-25);
  S.home=clamp(Math.round((o.home??70)-8),0,100);S.homeLow=S.home<HOME_LOW;
  // your job: you can work Monday
  S.empStart=0;S.interview=null;if(!S.emp)S.job=0;
  S.firedAt=Object.fromEntries(Object.entries(o.firedAt||{}).map(([k,v])=>[k,storyShift(v)]));
  // carried over, with this week's bits reset
  S.cargo=Object.assign(F.cargo,{food:(o.cargo&&o.cargo.food)|0,med:(o.cargo&&o.cargo.med)|0});    // contraband doesn't keep for months
  S.ev.past=(o.ev.past||[]).concat((o.ev.history||[]).map(h=>({id:h.id,w:o.weekNo})));
  Object.assign(S.bingo,{reserved:-1,playing:-1,order:null,delay:0});
  S.cars.forEach(c=>{c.loc=c.id==='isl'||!L[c.loc]||L[c.loc].side==='I'?'home':'stDock'});
  if(S.gen)S.gen='home';                                                                           // a generator left in the car made it home
  if(S.coop){delete S.coop.openedWeek}
  storyRebase(o);
  S.week=genWeek(S.diff,sea);
  try{syncCoop()}catch(e){}
  if(typeof jobSeasonEnd==='function')try{jobSeasonEnd(notes,prev,sea)}catch(e){console.error(e)}
  X.f0=Object.keys(S.friends);X.m0=S.money;
  storyHook('chapterStart',ch,notes);
  say(`📖 <b>Chapter ${ch+1} of 4 · ${STORY_CH[ch].t}.</b> ${STORY_CH[ch].when}. Monday, 5:30 AM.`);
  seasonIntro();
  notes.forEach(n=>say(n));
  showTile('📖',`Chapter ${ch+1} of 4`,STORY_CH[ch].t,'info');
  saveGame();
  return {delta,notes};
}
// module state that holds day stamps (dayKey) or clock times (S.t): rebased into the new chapter, or cleared
function storyRebase(o){
  const sh=storyShift;
  // 🧰 the house: per-day chores and bookings reset; booked contractors came by in the months between
  const U=S.up;if(U){for(const j of U.jobs||[]){try{if(['septic','arborist','propane'].includes(j.k))UP_JOBS[j.k].done(j)}catch(e){}}
    U.jobs=[];U.done={};U.rain=-1;U.burned=-1;U.fridge=false;}
  if(S.comm){S.comm.post=-1;S.comm.help=-1}
  // 🧾 household: a new month of bills; the mailbox, porch and lost-and-found are cleared; the dog comes along
  const H=S.hh;if(H){H.bills={};H.box=[];H.pkgs=[];H.missing=[];H.trash=2;H.trashWarn=false;H.cooked=-1;H.batch=0;H.batchWk=-1;H.water=false;H.bankFull=false;H.genTop=-1;
    if(!H.dog)H.puppy=-1;
    for(const k in H.once||{})if(/^stmt_/.test(k))delete H.once[k];
    if(H.dog){const g=H.dog;g.fed=sh(g.fed);g.walked=sh(g.walked);g.since=sh(g.since)}
    if(H.lf)H.lf={foreign:[],roll:-1,n:H.lf.n||0}}
  // 💵 economy: per-day and per-week stamps; hens that were on order arrived
  const E=S.eco;if(E){for(const k of ['ot','full','riv','rivWk','wood','eggSold','board','coffee'])E[k]=-1;
    if(E.coopBooked){E.coopBooked=false;E.hens=E.hens||3;E.feed=Math.max(E.feed||0,14)}}
  // 🤲 reputation clocks start over from today
  const R=S.repx;if(R){R.lastGood=0;R.driftAt=0;R.healAt=0;R.gift=-1;R.cold='';
    (R.known||[]).forEach(k=>{k.d=sh(k.d)});(R.enemies||[]).forEach(e=>{e.since=sh(e.since)})}
  // friend story arcs
  if(S.arcs){for(const id in S.arcs){const A=S.arcs[id];if(A&&typeof A==='object')A.k=sh(A.k)}S.arcs.day=-9}
  // 📱 the phone: full battery, apps and threads kept, every pending timer cleared
  const P=S.ph;if(P){P.social={};P.rideAsk=-1;delete P.flash;P.grpNew=false;
    if(P.msg){P.msg.q=[];P.msg.plan=null;P.msg.inc={}}
    if(P.calls){P.calls.ring=null;P.calls.next=null;P.calls.vm={};P.calls.dinner=-1}
    if(P.wx)P.wx={};
    if(P.tele)P.tele={visit:-1,mail:-1};
    if(P.gig)P.gig={d:-1,n:0,earned:0};
    if(P.mkt)P.mkt.order=null;
    if(P.icu)P.icu.since=P.icu.auto?0:-1;
    if(P.fp)P.fp.seen=[];}
  // other modules' state with stamps: the job listings keep S.jobsx
  if(S.jobsx&&typeof S.jobsx==='object')for(const k in S.jobsx){const v=S.jobsx[k];if(typeof v==='number'&&/day|at|until|since|wk|week|dk/i.test(k))S.jobsx[k]=/wk|week/i.test(k)?-1:sh(v)}
}

// ---- the ending ----
const STORY_ENDINGS={
  pariah:{ic:'🚪',title:'Persona non grata',text:'By spring, people cross the road when they see your car. You sell the house to a couple from Olympia who think it’s charming, and you move back to the mainland. You don’t look back from the ferry. Much.'},
  broke:{ic:'📦',title:'The island was too much',text:'The money ran out before the year did. You rent the house to a family from Tacoma and move into a one-bedroom in Lakewood, ten minutes from work. Some nights you miss the ferry horn.'},
  heart:{ic:'💚',title:'The heart of the island',text:'The co-op board asks you to join them, and on opening day they hand you the big scissors. You cut the ribbon in front of half the island and Pajama Fred, who wore actual pants for the occasion.'},
  regular:{ic:'⭐',title:'Island regular',text:'The Riv starts your order when your car pulls in, and somebody in the ferry line always has a spare coffee for you. A year ago you were the one who moved into that house. Now you’re the one people call.'},
  islander:{ic:'🌲',title:'An islander now',text:'You know which boats fill up, which neighbor has a chainsaw and which road floods at king tide. People wave from their trucks, and you wave back with two fingers off the wheel, like a local.'},
  commuter:{ic:'⛴️',title:'Ferry commuter for life',text:'The 7:35 is your office, your breakfast nook and your nap. You still don’t know most of your neighbors, but you know every deckhand by name, and they know your car.'},
  scraping:{ic:'🌧️',title:'Still here',text:'It wasn’t the year you planned: no steady work, not many friends, a house that needs more than you have. But you’re still on the island, and the mountain is still out on clear mornings.'}};
function storyEnding(){const F=(S.story&&S.story.flags)||{},r=repVal(),m=S.money,emp=!!S.emp;
  const coop=F.coopOpen===true||(F.coopOpen==null&&!!(S.coop&&S.coop.open));
  const id=r<=-60?'pariah':(m<-500||(!emp&&m<0))?'broke':(coop&&r>=60)?'heart':r>=60?'regular':(r>=20&&emp)?'islander':emp?'commuter':'scraping';
  return Object.assign({id},STORY_ENDINGS[id])}
function storyEpilogue(){const F=(S.story&&S.story.flags)||{},out=[];
  if(F.levy==='pass')out.push('🗳️ The ferry levy passed in November. The boats run later now, the fare went up a dollar, and nobody minds as much as they said they would.');
  else if(F.levy==='fail')out.push('🗳️ The ferry levy failed. The last boat still leaves at 10:50, and the island still argues about it at the Riv.');
  if(F.drydock)out.push('🛠️ The ferry came back from dry dock in a fresh coat of white paint. For a few weeks the island had a smaller boat and a lot of patience.');
  if(F.storm){const n=(F.storm.helped)|0;out.push(n>=3?`🌪️ When the storm of the decade knocked the island flat, you checked on ${n} neighbors. Some of them still bring it up.`:n>0?`🌪️ When the storm of the decade knocked the island flat, you checked on ${n===1?'a neighbor':'two neighbors'}. They haven’t forgotten.`:'🌪️ The storm of the decade took the power for days. You got through it on your own.')}
  if(F.coopOpen===true)out.push('🏪 The Anderson Island Food Co-op opened in the old General Store: groceries and gas on the island again, and a volunteer at the register who knows your name.');
  else if(F.coopOpen===false)out.push('🏪 The co-op didn’t open this year. The pumps are still bagged, and the sign on the door still says 2027.');
  out.push(...storyHook('ending',F).filter(x=>typeof x==='string'));
  return out}
{const _fin=finish;finish=function(){
  if(!storyOn())return _fin.apply(this,arguments);
  if(S.story.ch<STORY_N-1)return storyChapterEnd();
  const notes=[];storyPayBills(notes);storyHook('chapterEnd',S.story.ch,notes);notes.forEach(n=>S.log.push({t:S.t,s:n}));
  S.story.recap.push(storyRecap(S.story.ch));storyBeatLines(true);
  S.story.ending=storyEnding();S.story.epilogue=storyEpilogue();
  return _fin.apply(this,arguments)}}
{const _es=endScreen;endScreen=function(h1,sub,lost){
  const X=storyOn()?S.story:null;
  if(X&&!lost&&X.ending){h1=`${X.ending.ic} ${X.ending.title}`;sub=X.ending.text}
  else if(X&&lost)sub=`${sub} You made it to chapter ${X.ch+1} of 4.`;
  const r=_es.call(this,h1,sub,lost);
  if(X)try{storyEndBlock(X,lost)}catch(e){console.error(e)}
  return r}}
function storyEndBlock(X,lost){const end=document.querySelector('.end');if(!end)return;
  const lab=end.querySelector('.small-note');if(lab)lab.innerHTML=lab.innerHTML.replace('WEEK COMPLETE','YEAR COMPLETE');
  const rec=(X.recap||[]).filter(r=>r&&typeof r==="object").map(r=>`<li>${storyTitle(r.ch)}: ${r.money<0?'−':''}$${Math.abs(r.money)} · ${r.job?esc(r.job):'out of work'} · ${r.tierIc} ${r.tier}${r.friends.length?` · met ${esc(r.friends.join(', '))}`:''}</li>`).join('');
  const epi=lost?'':(X.epilogue||[]).map(l=>`<p>${l}</p>`).join('');
  const div=document.createElement('div');div.className='story-end';
  div.innerHTML=withName(`<div class="story-badge">📖 A year on the island · ${lost?`Chapter ${X.ch+1} of 4 · game over`:'Chapter 4 of 4'}</div>${epi}${rec?`<ul class="story-recap">${rec}</ul>`:''}`);
  const p=end.querySelector('h1+p');if(p)p.after(div);else end.prepend(div);
  end.querySelectorAll('button').forEach(b=>{if(/Share my month/.test(b.textContent))b.textContent=b.textContent.replace('month','year')})}
// the share card says "a year"
if(typeof cardData==='function'){const _cd=cardData;cardData=function(){const c=_cd.apply(this,arguments);if(storyOn())c.span=c.lost?`A year · game over in chapter ${S.story.ch+1}`:`A year on the island · ${S.story.ending?S.story.ending.title:''}`;return c}}

// ---- achievements ----
ACH.push(
  {id:'story_year',ic:'📖',n:'A year on the island',d:'Finish story mode: four chapters, summer to spring.',t:c=>c.end&&!c.lost&&storyOn()&&!!S.story.ending},
  {id:'story_heart',ic:'💚',n:'The heart of the island',d:'Finish story mode with the co-op open and the island behind you (reputation 60 or more).',t:c=>c.end&&!c.lost&&storyOn()&&!!S.story.ending&&S.story.ending.id==='heart'},
  {id:'story_bridge',ic:'🌉',n:'No bridge to burn',d:'Finish story mode as persona non grata. The island has no bridge. You found a way anyway.',t:c=>c.end&&!c.lost&&storyOn()&&!!S.story.ending&&S.story.ending.id==='pariah'});

// ---- saves: a story save keeps a sane S.story ----
{const _mg=migrate;migrate=function(d){const r=_mg(d),x=r.S;
  if(x&&x.story!=null){if(typeof x.story!=='object')delete x.story;else{const X=x.story;
    X.ch=Math.max(0,Math.min(STORY_N-1,num(X.ch,0)|0));if(!Array.isArray(X.seasons)||X.seasons.length!==STORY_N)X.seasons=STORY_SEASONS.slice();
    if(!X.flags||typeof X.flags!=='object')X.flags={};if(!Array.isArray(X.recap))X.recap=[];if(!X.told||typeof X.told!=='object')X.told={};
    if(!Array.isArray(X.f0))X.f0=Object.keys(x.friends||{});if(typeof X.m0!=='number')X.m0=num(x.money,0);if(X.ending===undefined)X.ending=null;if(!Array.isArray(X.epilogue))X.epilogue=[];
    x.mode='month'}}
  return r}}
