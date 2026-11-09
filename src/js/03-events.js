// ---------------- travel ----------------
// =====================================================================
// ISLAND EVENTS FRAMEWORK (non-ferry life on the island)
// ---------------------------------------------------------------------
// defEvent({id, hook, chance, cond(ctx), run(ctx), priority, cooldown, max})
//   hook      (a hook name, or an array of them)
//             'arrive'    just arrived somewhere (ctx.at, ctx.from; 'ferry' when stepping off the boat)
//             'night'     while going to bed (ctx.where, ctx.notes[] for the night summary)
//             'wake'      start of a day, if you woke up at home
//             'tripStart' before an island trip leaves (can block it with choices)
//             'tripMid'   during an island trip (ctx.add(min), or block and later ctx.finish(extra))
//   chance    number or fn(ctx) -> 0..1, rolled each time the hook runs
//   cond      fn(ctx) -> bool, must be true for the event to fire (even when chained)
//   priority  higher runs first; an event returning {block:true} or {stop:true} ends the hook
//   cooldown  days before it can fire again; max = times per week
// chain(id)   guarantees an event fires the next time its hook runs (if its cond passes):
//             this is how one event sets off others (a power outage -> the alarm doesn't go off).
// =====================================================================
// ---- phone battery, alarm and generator ----
const ALARM_TIMES=[285,300,330,360,390,420,450,480];
function phoneTick(){const el=S.t-S.phoneT;if(el>0){S.phone=Math.max(0,Math.round(S.phone-el/60*4));S.phoneT=S.t}}
function alarmTxt(){const A=S.alarm;const a=[];if(A.plug.on)a.push(`${fmt(A.plug.time)} on the clock`);if(A.phone.on)a.push(`${fmt(A.phone.time)} on your phone`);return a.join(' + ')||'no alarm set'}
function alarmBase(){const A=S.alarm,t=[];if(A.plug.on)t.push(A.plug.time);if(A.phone.on)t.push(A.phone.time);return t.length?Math.min(...t):null}
function genReady(){return S.gen==='home'}
// overnight generator: returns true if it ran (needs a generator at home and gas in the shed)
function genFails(){const g=UP().genSvc;return g>14&&Math.random()<Math.min(0.6,(g-14)*0.04)}
function runGenerator(where,gal){if(where!=='home'||!genReady()||S.homeGas<gal)return false;
  if(genFails()){S.ev.flags.genFail=day();return false}
  S.homeGas=Math.round((S.homeGas-gal)*10)/10;S.ev.flags.genRan=day();return true}
window.almPick=(k,v)=>{window.ALM[k]=v;document.querySelectorAll('.almc[data-k="'+k+'"]').forEach(b=>b.classList.toggle('on',b.dataset.v===String(v)))};
function alarmModal(){
  const A=S.alarm;window.ALM={plugOn:A.plug.on,plugTime:A.plug.time,phoneOn:A.phone.on,phoneTime:A.phone.time};
  const chip=(k,v,label)=>`<button class="chip almc ${String(window.ALM[k])===String(v)?'on':''}" data-k="${k}" data-v="${v}" onclick="almPick('${k}',${v})">${label}</button>`;
  const section=(key,icon,name,note)=>`<div style="border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:10px;background:#fff">
    <div style="display:flex;justify-content:space-between;align-items:center"><b>${icon} ${name}</b><span class="chips" style="margin:0">${chip(key+'On',true,'On')}${chip(key+'On',false,'Off')}</span></div>
    <div class="chips">${ALARM_TIMES.map(t=>chip(key+'Time',t,fmt(t))).join('')}</div>
    <div style="font-size:12px;color:var(--mute);margin-top:8px">${note}</div></div>`;
  modal('⏰ Set your alarms',
    section('plug','🔌','Plug-in clock','Loud and reliable. A power outage resets it, and it can’t wake you if you sleep away from home.')+
    section('phone','📱','Phone alarm',`Works anywhere and through outages, if the battery lasts the night (${S.phone}% now). Small chance you sleep through the gentle chime.`)+
    `<p style="font-size:13px;color:var(--mute)">Set both and each one backs up the other: you wake at the earliest alarm that actually goes off. Waking earlier gives you more time but less rest.</p>`,
  [{l:'Save alarms',fn:()=>{const M=window.ALM;S.alarm={plug:{on:!!M.plugOn,time:M.plugTime},phone:{on:!!M.phoneOn,time:M.phoneTime}};say(`⏰ Alarms: ${alarmTxt()}.`);render()}},{l:'Cancel',fn:()=>{}}]);
}

// ---- acknowledgement tiles: a small card every time an event fires ----
const TILE_META={
  power_outage:['⚡','Power outage','bad'],starry:['✨','Starry night','good'],alarm_fail:['⏰','Your alarm didn’t go off','bad'],backup_alarm:['⏰','Backup alarm saved you','good'],no_alarm:['😴','No alarm set','bad'],phone_died:['📵','Your phone died overnight','bad'],phone_saves:['📱','Phone alarm to the rescue','good'],
  slept_through:['😴','Slept through your phone alarm','bad'],gen_saves:['🔌','Generator kept things running','good'],
  no_water:['🚿','No water','bad'],garage_stuck:['🚪','Garage door is dead','bad'],neighbor_ride:['🚪','A new neighbor knocks','good'],
  friend_coffee:['☕','Coffee from Sam','good'],bingo_reminder:['🎱','Bingo tonight at the Riv','info'],
  table_taken:['🪧','Someone took your table','bad'],no_seat:['🪑','No seat at bingo','bad'],bar_argument:['🗯️','Argument at the bar','bad'],
  order_late:['⏳','Your order is late','bad'],pajama_fred:['🩴','Pajama Fred','info'],dead_battery:['🔋','Dead car battery','bad'],
  garage_release:['🚪','Manual garage door','bad'],school_bus:['🚌','Behind the school bus','info'],oro_bay:['🌫️','Long way past Oro Bay','good'],garage_sale:['🏷️','Garage sale','info'],fire_pancakes:['🥞','Pancake breakfast','good'],museum:['🏛️','Island history','good'],line_cookie:['🍪','A cookie in the ferry line','good'],tree_down:['🌲','Tree down on the road','bad'],flat_tire:['🛞','Flat tire','bad'],
  stranded_neighbor:['🚩','Someone needs a jump','info'],sam_groceries:['📦','Groceries from Sam','good'],fish_fry:['🐟','Legion fish fry','good'],henderson_dinner:['🍲','Dinner invitation','good'],fred_topoff:['🩴','Fred topped off your tank','good'],favor_ask:['🙏','A friend needs a favor','info'],deer:['🦌','Deer on the road','info'],eagle:['🦅','Eagle sighting','good'],
};
let tileQ=[];const TILE_MAX=3;
function tileBox(){let el=document.getElementById('tiles');if(!el){el=document.createElement('div');el.id='tiles';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}return el}
function showTile(ic,title,sub,kind,when){
  if(!S||S.over) return;
  when=when||`${DAYS[day()].slice(0,3)} ${fmt(S.t)}`;
  const box=tileBox();
  if(box.children.length>=TILE_MAX){tileQ.push([ic,title,sub,kind,when]);return}
  const t=document.createElement('div');t.className='tile '+(kind||'info');
  title=withName(title);sub=withName(sub);sfx(kind==='good'?'good':kind==='bad'?'bad':'info');
  t.innerHTML=`<span class="ti">${ic}</span><span class="tt"><small>${kind==='good'?'Good news':kind==='bad'?'Event':kind==='warn'?'Heads up':'Island life'} · ${when}</small><b>${title}</b>${sub?`<span>${sub}</span>`:''}</span><button class="ok" aria-label="Got it">✓</button>`;
  let gone=false;const close=()=>{if(gone)return;gone=true;t.classList.add('out');setTimeout(()=>{t.remove();if(tileQ.length){const q=tileQ.shift();showTile(...q)}},260)};
  t.querySelector('.ok').onclick=close;t.onclick=e=>{if(e.target===t)close()};
  setTimeout(close,6500);box.appendChild(t);
}
function eventTile(e,ctx){
  const m=TILE_META[e.id]||[e.tile&&e.tile[0]||'📍',e.tile&&e.tile[1]||e.id.replace(/_/g,' '),e.tile&&e.tile[2]||'info'];
  const cause=S.ev.cause&&S.ev.cause[e.id];
  const sub=cause?`Caused by: ${(TILE_META[cause]||[0,cause])[1]}`:(ctx.hook==='bingo'?'At Bingo, the Riv':ctx.hook==='tripStart'||ctx.hook==='tripMid'?`On the way to ${L[ctx.to]?L[ctx.to].name:'…'}`:ctx.hook==='arrive'?`At ${L[ctx.at].name}`:ctx.hook==='night'?'Overnight':ctx.hook==='wake'?'This morning':'');
  showTile(m[0],m[1],sub,m[2],ctx.hook==='night'?`${DAYS[day()].slice(0,3)} night`:null);
}
window.showTile=showTile;
let EV_RUNNING=null;
// Global frequency dial per hook: the chance that a hook call lets ANY event through (one roll per call).
// wake:0.8 means 20% of mornings are event-free; chained events are dropped too. Per-event chances are unchanged.
// Events with noScale:true (announcements like the bingo reminder) are exempt.
const HOOK_SCALE={wake:0.8};
const EV=[];
function defEvent(e){EV.push(Object.assign({chance:0,priority:0,cooldown:0,max:99},e))}
function chain(id,cause){if(!S.ev.force.includes(id))S.ev.force.push(id);S.ev.cause=S.ev.cause||{};S.ev.cause[id]=cause||EV_RUNNING||null}
window.forceEvent=id=>chain(id);
function fireHook(hook,ctx={}){
  ctx.hook=hook;let res=null;const popItems=[];
  const scale=HOOK_SCALE[hook]??1,open=scale>=1||Math.random()<scale; // one roll per hook call
  const list=EV.filter(e=>e.hook===hook||(Array.isArray(e.hook)&&e.hook.includes(hook))).sort((a,b)=>b.priority-a.priority);
  for(const e of list){
    const forced=S.ev.force.includes(e.id);
    if(e.cond&&!e.cond(ctx)) continue;
    if(!open&&!e.noScale){if(forced)S.ev.force=S.ev.force.filter(x=>x!==e.id);continue}
    if(!forced){
      if((S.ev.count[e.id]||0)>=e.max) continue;
      if(S.ev.last[e.id]!=null&&day()-S.ev.last[e.id]<e.cooldown) continue;
      const p=(typeof e.chance==='function'?e.chance(ctx):e.chance)*homeEventMul(e.id);
      if(!(Math.random()<p)) continue;
    } else S.ev.force=S.ev.force.filter(x=>x!==e.id);
    S.ev.last[e.id]=day();S.ev.count[e.id]=(S.ev.count[e.id]||0)+1;S.ev.history.push({id:e.id,t:S.t});
    const nBefore=uiNarr.length,mBefore=MQ.length+(document.getElementById('mbg')?1:0);
    EV_RUNNING=e.id;let r;try{r=e.run(ctx)||{}}finally{EV_RUNNING=null}
    // events that didn't open their own window get an OK pop-up (collected, shown once per hook call)
    if(MQ.length+(document.getElementById('mbg')?1:0)===mBefore) popItems.push({id:e.id,lines:uiNarr.slice(nBefore)});
    eventTile(e,ctx);if(S.ev.cause)delete S.ev.cause[e.id];
    if(r.block||r.stop){res=r;break}
    res=res||r;
  }
  eventPopup(hook,popItems);
  return res;
}
// ---- OK pop-up for random events (on by default; toggle in Settings) ----
const POPUP_KEY='islandtime.popups';
function popupsOn(){try{return localStorage.getItem(POPUP_KEY)!=='off'}catch(e){return true}}
function eventPopup(hook,items){
  if(!items.length||hook==='night'||!popupsOn()||!S||S.over) return; // night events are listed in the "Good night" summary
  const meta=id=>TILE_META[id]||['📍',id.replace(/_/g,' ')];
  const body=items.map(it=>{const m=meta(it.id);const txt=it.lines.length?it.lines.map(l=>`<p style="margin:4px 0 0">${l}</p>`).join(''):'';
    return items.length>1?`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="font-size:24px">${m[0]}</span><div><b>${m[1]}</b>${txt}</div></div>`:txt}).join('');
  const one=items.length===1?meta(items[0].id):null;
  modal(one?`${one[0]} ${one[1]}`:`🌲 ${items.length} things just happened`,body||'<p>Island life.</p>',[{l:'OK',fn:()=>{}}]);
}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function powerOut(){return S.power&&S.t<S.power.end}
function meet(id,name,how){if(S.friends[id]){friendPts(id,1);return false}S.friends[id]={name,how,day:day(),lvl:1,pts:0};say(`🤝 New friend: <b>${name}</b> (${how}).`);return true}
const PERKS={
  sam:{2:'Sam will drive you to the ferry most mornings: ask on your 📱 phone before 10:30.',3:'Sam brings you a box of groceries from his mainland runs.'},
  walt:{2:'Walt puts in a good word for you: better odds at job interviews.',3:'You’re on the list for the Legion’s Friday fish fry.'},
  fred:{2:'Fred always passes along what his deck-crew buddy hears.',3:'Fred keeps an eye on your car at the landing and tops it off from “a friend.”'},
  hendersons:{2:'The Hendersons invite you to dinner on weekends.',3:'The Hendersons drop off leftovers when the power’s out.'},
  rusty:{2:'Rusty saves you a seat at the bar on bingo night.',3:'Rusty knows a guy with cheap diesel.'},
};
const LVL_NAME={1:'Friend',2:'Good friend',3:'Close friend'};
function friendPts(id,n){const f=S.friends[id];if(!f)return;f.lvl=f.lvl||1;f.pts=Math.max(0,(f.pts||0)+n);
  const lv=f.pts>=6?3:f.pts>=3?2:1;
  if(lv>f.lvl){f.lvl=lv;const perk=(PERKS[id]||{})[lv];say(`💛 <b>${f.name.split(',')[0]}</b> is now a ${LVL_NAME[lv].toLowerCase()}. ${perk||''}`);showTile('💛',`${f.name.split(',')[0]}: ${LVL_NAME[lv]}`,perk||'','good')}
}
const flv=id=>S.friends[id]?(S.friends[id].lvl||1):0;
const BINGO_FOR=['Anderson Island Historical Society','Pierce County Fire District #27','Anderson Island Elementary Booster Club'];

// ---- night ----
defEvent({id:'power_outage',hook:'night',priority:5,max:2,cooldown:2,
  chance:ctx=>stormNight(day())?0:0.13,
  run(ctx){
    const d=day(),start=d*1440+1440+60+Math.floor(Math.random()*180),end=(d+1)*1440+330+120+Math.floor(Math.random()*300);
    const cause=pick(['a fir came down across a line','a transformer blew with a bang you heard from bed','wind gusts tangled a line by the lake','nobody knows why. It just went out']);
    S.power={start,end,cause};S.stats.outageNights++;
    let txt=`⚡ Around ${fmt(start)} the power goes out: ${cause}.`;
    if(runGenerator(ctx.where,2)){txt+=' You start the generator by flashlight. It burns 2 gallons from the shed and saves the fridge.';chain('gen_saves')}
    else if(ctx.where==='home'&&!genReady()&&S.homeGas>=2&&S.pantry>0&&Math.random()<0.5){S.pantry--;UP().fridge=true;txt+=' You have gas in the shed but no generator to put it in. A day of food in the fridge goes warm.'}
    else if(S.pantry>0&&Math.random()<0.5){S.pantry--;UP().fridge=true;txt+=' By morning, a day of food in the fridge has gone warm.'}
    ctx.notes.push(txt);outageChain(ctx.where);
  }});
function outageChain(where){
  if(where!=='home') return;
  if(S.ev.flags.genRan!==day()&&Math.random()<(UP().well>45?0.8:UP().well<15?0.35:0.6)) chain('no_water');
  if(S.cars.some(c=>c.id==='isl'&&c.loc==='home')&&Math.random()<0.35) chain('garage_stuck');
  if(!S.friends.sam&&Math.random()<0.45) chain('neighbor_ride');
  else if(S.friends.sam&&Math.random()<0.4) chain('friend_coffee');
}
defEvent({id:'starry',hook:'night',chance:0.5,cond:()=>powerOut(),run(ctx){adj('stress',-3);ctx.notes.push('✨ With every light on the island dark, the stars are unreal.')}});

