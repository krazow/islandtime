// ---------------- 🔨 upgrading your cabin over time (resident game: week, month, story) ----------------
// State: S.cabin={own:{id:true},bill:0,carry:0}. An order is a UP().jobs entry {k:'cabin',id,due}: a contractor who
// comes over on the ferry (so a ferry outage delays them, see processTimed). Story chapters install every pending order
// (months pass), and S.cabin rides along in storyAdvance because it keeps unknown keys. Not in visitor/regular/challenge games.
// Hooks other files can call: cabinHas(id), cabinDock() (a private boat module can check it for a mooring).
const CABIN_UP=[
  {id:'weather',ic:'🧤',n:'Insulation and weatherstripping',c:380,days:1,who:'a weatherization crew',d:'Blown-in attic insulation, door sweeps and window seals. The house wears down about a quarter slower and the propane lasts longer.'},
  {id:'mooring',ic:'⚓',n:'Mooring buoy (and a skiff ladder)',c:600,days:3,who:'the marine contractor',d:'A permitted buoy off your beach. Quiet water to look at: stress −1 every night at home. If you ever own a boat, it ties up here for free.'},
  {id:'tank',ic:'🛢️',n:'Rain-catch tank',c:950,days:2,who:'the tank installer',d:'A 1,500-gallon tank off the gutters and a small pump. When the well pump quits or the power’s out, you still have water.'},
  {id:'switch',ic:'🔌',n:'Generator transfer switch',c:780,days:2,who:'the electrician',d:'A real inlet and interlock instead of extension cords. 60% fewer failed starts and 25% less gas burned.'},
  {id:'insert',ic:'🔥',n:'Woodstove insert',c:1900,days:3,who:'the stove installer',d:'A certified insert with a liner. Warmer nights (stress −2), a third of the firewood and less propane.'},
  {id:'heatpump',ic:'♨️',n:'Ductless heat pump',c:2800,days:4,who:'the HVAC crew',d:'Winter nights are much easier (stress −3 in winter, −1 other cold nights) and propane use halves while the power’s on. It adds about $2–4 a night to the power bill.'},
  {id:'solar',ic:'☀️',n:'Solar panels and battery',c:5200,days:6,who:'the solar crew',d:'A starter 3 kW array and a 5 kWh battery (real quotes run $15–20k). Outages end about 5 hours sooner, and the battery carries the fridge, the well pump and the lights through the night.'}];
const CAB=()=>S.cabin||(S.cabin={own:{},bill:0,carry:0});
const cabinHas=id=>!!(typeof S!=='undefined'&&S&&S.cabin&&S.cabin.own[id]);
const cabinDock=()=>cabinHas('mooring');
const cabinOk=()=>!!S&&!S.over&&!S.challenge&&!(typeof visitorOn==='function'&&visitorOn());
const cabinJob=id=>UP().jobs.find(j=>j.k==='cabin'&&j.id===id);
const cabinDef=id=>CABIN_UP.find(u=>u.id===id);
function cabinInstall(id,quiet){const u=cabinDef(id);if(!u)return;CAB().own[id]=true;
  if(!quiet){say(`🔨 ${u.who[0].toUpperCase()+u.who.slice(1)} finishes up: <b>${u.n}</b> is in. ${({weather:'The draughts are gone.',mooring:'The buoy bobs off the beach.',tank:'The tank fills with the first rain.',switch:'You label the breaker panel like a grown-up.',insert:'You light the first fire and the whole room ticks warm.',heatpump:'A quiet little whirr. It’s warm in here.',solar:'The inverter blinks green.'})[id]||''}`);
    try{showTile(u.ic,u.n+' installed','Upgrade done','good')}catch(e){}}}
UP_JOBS.cabin={who:'contractor',done:j=>cabinInstall(j.id)};
function cabinBuy(id){const u=cabinDef(id);if(!u||CAB().own[id]||cabinJob(id)||S.money<u.c||S.phone<=0)return;
  money(-u.c);S.t+=15;phoneTick();const due=(day()+u.days)*1440+600+(u.days>2?0:30);
  UP().jobs.push({k:'cabin',id,due});
  say(`📱 You book ${u.who} for the ${u.n.toLowerCase()}: ${$(u.c)}. They come over on the ferry ${fmtAbs(due)}, if it’s running.`);afterAction()}
window.cabinBuy=cabinBuy;
function cabinActions(a){
  if(!cabinOk()||S.loc!=='home')return;
  CABIN_UP.forEach(u=>{const own=cabinHas(u.id),job=cabinJob(u.id),poor=S.money<u.c,dead=S.phone<=0;
    a.push({cat:'cabin',ic:u.ic,l:own?`${u.n} ✓`:job?`${u.n}: booked`:`${u.n}: ${$(u.c)}`,due:false,
      s:own?'Installed. '+u.d:job?`${u.who[0].toUpperCase()+u.who.slice(1)} comes over on the ferry ${fmtAbs(job.due)}. ${u.d}`:`${u.d} Takes ${u.days} day${u.days>1?'s':''} to schedule.${dead?' Your phone is dead.':poor?` You need ${$(u.c-S.money)} more.`:''}`,
      dis:own||!!job||poor||dead,fn:()=>cabinBuy(u.id)})})}
Object.assign(ACT_CATS,{cabin:'🔨 Upgrade the cabin'});
{const _u=upkeepActions;upkeepActions=function(a){const r=_u.apply(this,arguments);try{cabinActions(a)}catch(e){console.error(e)}return r}}
// story chapters skip months: every pending order is done by the next chapter
if(typeof storyAdvance==='function'){const _s=storyAdvance;storyAdvance=function(){try{if(S&&S.up)S.up.jobs=S.up.jobs.filter(j=>{if(j.k==='cabin'){cabinInstall(j.id,true);return false}return true})}catch(e){console.error(e)}return _s.apply(this,arguments)}}
// seasonUp: firewood, propane
if(typeof seasonUp==='function'){const _s=seasonUp;seasonUp=function(){const o=_s.apply(this,arguments);if(!S||!S.cabin)return o;
  const c=Object.assign({},o);let p=c.prop.slice();
  if(cabinHas('insert')&&c.stove){c.wood=c.wood>0&&dayKey()%3===0?1:0;p=p.map(x=>x*0.7)}
  if(cabinHas('heatpump')&&!powerOut())p=p.map(x=>x*0.5);
  if(cabinHas('weather'))p=p.map(x=>x*0.8);
  c.prop=p.map(x=>Math.round(x*10)/10);return c}}
// house wear: a quarter slower (only the nightly-wear sized hits; big damage is still big)
{const _h=homeAdj;homeAdj=function(v){if(v<0&&v>=-6&&cabinHas('weather')){const t=v*0.75+(CAB().carry||0),n=Math.round(t);CAB().carry=Math.round((t-n)*1000)/1000;v=n}return _h.call(this,v)}}
// the night: warmth, quiet water, the power bill, the fridge when the battery saved it
function cabinNightPre(){if(S.cabin)S.cabin.fr0=!!UP().fridge}
function cabinNight(where,notes,d){
  const C=CAB(),home=where==='home',cold=seasonId()!=='summer',winter=seasonId()==='winter';
  if(home&&cabinHas('insert')&&cold)adj('stress',-2);
  if(home&&cabinHas('heatpump')&&cold){adj('stress',winter?-3:-1);if(!powerOut()||S.ev.flags.genRan===d){C.bill=(C.bill||0)+(winter?4:2)}}
  if(home&&cabinHas('mooring'))adj('stress',-1);
  if(C.bill>0&&d%7===6){money(-C.bill);notes.push(`💡 The power bill came: the heat pump cost you ${$(C.bill)} this week.`);C.bill=0}
}
// storm outages are set inside endDay (06-day.js calls this right after, before the phone and wear steps)
function cabinStorm(where,notes,d){const C=CAB(),home=where==='home';
  if(cabinHas('solar')&&S.power&&S.power.start<=(d+1)*1440+330&&!S.power.sol){
    S.power.sol=true;S.power.end=Math.max(S.power.start+60,S.power.end-300);
    if(home&&S.ev.flags.genRan!==d){S.ev.flags.genRan=d;if(!C.fr0)UP().fridge=false;
      if(stormNight(d)&&typeof shelterNow==='function'&&!shelterNow()){adj('health',3);adj('stress',-4)}
      notes.push('🔋 The battery carries the fridge, the well pump and a few lights while the island is dark, and the panels bring the power back sooner.')}
    else if(!home)notes.push('🔋 Your battery kept the fridge cold while the island was dark.')}
}
window.cabinStorm=cabinStorm;
{const _up=upkeepNight;upkeepNight=function(where,notes,d){try{cabinNightPre()}catch(e){}const r=_up.apply(this,arguments);try{if(cabinOk())cabinNight(where,notes,d)}catch(e){console.error(e)}return r}}
// generator: the transfer switch
{const _f=genFails;genFails=function(){const r=_f.apply(this,arguments);return r&&cabinHas('switch')&&Math.random()<0.6?false:r}}
{const _r=runGenerator;runGenerator=function(where,gal){return _r.call(this,where,cabinHas('switch')?Math.round(gal*0.75*10)/10:gal)}}
// water: the rain tank
{const wrap=(id,f)=>{const e=EV.find(x=>x.id===id);if(!e)return;const r0=e.run;e.run=function(ctx){const o=f(r0,this,ctx);return o}};
  wrap('no_water',(r0,t,ctx)=>{if(cabinHas('tank')){adj('stress',-1);say('🚿 No power, no well pump. But the rain tank has a hand pump and a full gauge: a proper shower, a little smug.');return}return r0.call(t,ctx)});
  wrap('well_quit',(r0,t,ctx)=>{if(cabinHas('tank')){adj('stress',2);UP().well=20;say('🚰 The well pump lost its prime, but you flip the valve to the rain tank and make coffee. A twenty-minute fix, not a morning.');S.t+=20;return}return r0.call(t,ctx)})}
// the power outage itself: solar shortens it even when the generator didn't run (home only; away nights are handled in cabinNight via the storm path)
{const e=EV.find(x=>x.id==='power_outage');if(e){const r0=e.run;e.run=function(ctx){UP();const had=!!UP().fridge,r=r0.call(this,ctx);
  try{if(cabinHas('solar')&&S.power&&!S.power.sol){S.power.sol=true;S.power.end=Math.max(S.power.start+60,S.power.end-300);
    if(ctx.where==='home'&&S.ev.flags.genRan!==day()){S.ev.flags.genRan=day();if(!had)UP().fridge=false;S.ev.force=S.ev.force.filter(x=>x!=='no_water');
      ctx.notes.push('🔋 The island goes dark, and your battery quietly takes over: fridge, well pump and a few lights. The panels bring it all back early.')}}}catch(x){console.error(x)}return r}}}
