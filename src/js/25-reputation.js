// ---- 🤲 island reputation: −100 to +100 ----
// S.rep is the score (0 = newcomer). S.repx holds the rest: the "Known for" list, enemies, drift clocks,
// the Riv weekend-shift meter lives in ECO().rivJob (15-economy.js). Perks (15-economy REP_PERKS) unlock at +20/+35/+60.
const REP_MIN=-100,REP_MAX=100;
const REP_TIERS=[
  {min:60,id:'regular',ic:'⭐',n:'Island regular',d:'Gifts on the porch, the Riv asks you first.'},
  {min:20,id:'known',ic:'🤝',n:'Known',d:'People know your car. In a good way.'},
  {min:-19,id:'new',ic:'🙂',n:'Newcomer',d:'Mostly known as “the one who moved into that house.”'},
  {min:-59,id:'talked',ic:'🗣️',n:'Talked about',d:'Conversations stop when you walk into the Riv.'},
  {min:-100,id:'pariah',ic:'🚫',n:'Persona non grata',d:'People cross the road. Even Fred.'}];
const repVal=()=>(typeof S!=='undefined'&&S&&typeof S.rep==='number')?S.rep:0;
const repTier=r=>{r=r==null?repVal():r;return REP_TIERS.find(t=>r>=t.min)||REP_TIERS[REP_TIERS.length-1]};
function REP(){if(!S.repx)S.repx={known:[],enemies:[],lastGood:dayKey(),driftAt:dayKey(),healAt:dayKey(),homeLow:0,gift:-1,coop:Math.floor(((S.coop&&S.coop.you)||0)/100),fails:{},cold:'',n:0};return S.repx}
// change reputation. opt.notes = push to tonight's notes instead of say(); opt.quiet = no message
function repAdd(n,why,opt){if(typeof S==='undefined'||!S||S.over||!n)return 0;opt=opt||{};const R=REP(),r0=repVal(),t0=repTier(r0);
  S.rep=Math.max(REP_MIN,Math.min(REP_MAX,r0+n));const d=S.rep-r0;if(!d)return 0;
  if(n>0)R.lastGood=dayKey();
  if(why){R.known.unshift({d:dayKey(),n:d,why});R.known=R.known.slice(0,6)}
  const t1=repTier(),msg=`${d>0?'🤲':'🗣️'} Island reputation ${d>0?'+':''}${d}${why?`: ${why}`:''}.${t1!==t0?` You’re now <b>${t1.ic} ${t1.n}</b>.`:''}`;
  if(!opt.quiet){if(opt.notes)opt.notes.push(msg);else say(msg)}
  if(t1!==t0)try{showTile(t1.ic,`Reputation: ${t1.n}`,t1.d,d>0?'good':'bad')}catch(e){}
  try{repCheck()}catch(e){}
  return d}
window.repAdd=repAdd;

// ---- enemies: named islanders with a grudge (max 3), each with a way to make up ----
const REP_MEND=['help them stack two cords of firewood','help them clear blackberry vines off their fence','help them haul a busted water heater to the transfer station','help them move a piano. An actual piano.'];
function repEnemy(who,why,opt){const R=REP();if(R.enemies.length>=3||R.enemies.some(e=>e.who===who))return null;R.n++;
  const e={id:R.n,who,why,since:dayKey(),mend:pick(REP_MEND),fid:opt&&opt.fid};R.enemies.push(e);
  const m=`😠 <b>${who.charAt(0).toUpperCase()+who.slice(1)}</b> won’t forget this (${why}).`;if(opt&&opt.notes)opt.notes.push(m);else say(m);
  try{showTile('😠','You made an enemy',who,'bad')}catch(e){}return e}
function repDropFriend(id){if(!S.friends[id])return;delete S.friends[id];(S.quests||[]).forEach(q=>{if(q.who===id&&!q.done){q.done=true;q.failed=true}})}
const repEnemies=()=>(S&&S.repx&&S.repx.enemies)||[];

// ---- nightly: drift, the house, enemies, friends drifting away, gifts on the porch ----
function repNight(where,notes){const R=REP(),dk=dayKey(),r=repVal();
  // fame fades without good deeds; a bad name fades slowly on its own
  if(dk-R.driftAt>=7){R.driftAt=dk;if(r>20&&dk-R.lastGood>=7)repAdd(-5,'out of sight, out of mind',{notes})}
  if(r<0){if(dk-R.healAt>=14){R.healAt=dk;repAdd(5,'people are starting to forget',{notes})}}else R.healAt=dk;
  // "that house"
  if((S.home??70)<25){R.homeLow++;if(R.homeLow>=7){R.homeLow=0;repAdd(-5,'the neighbors are talking about your house',{notes})}}else R.homeLow=0;
  // enemies bad-mouth you now and then
  for(const e of R.enemies)if(Math.random()<0.15)repAdd(-3,`${e.who} has been bad-mouthing you in the Island Group`,{notes});
  // persona non grata: a casual friend stops answering (about once a week)
  if(repVal()<=-60&&Math.random()<0.15){const ids=Object.keys(S.friends).filter(id=>(S.friends[id].lvl||1)<=1);
    if(ids.length){const id=pick(ids),n=S.friends[id].name.split(',')[0];repDropFriend(id);notes.push(`💔 ${n.charAt(0).toUpperCase()+n.slice(1)} heard what people are saying about you and stops answering your texts.`)}}
  // gifts, if you slept at home
  if(where==='home'&&R.gift!==dk){const t=repTier().id,c=t==='regular'?0.35:t==='known'?0.14:0;
    if(c&&Math.random()<c){R.gift=dk;notes.push(repGift(t==='regular'))}}
}
function repGiver(){const ids=Object.keys(S.friends||{});if(ids.length&&Math.random()<0.5){const id=pick(ids);return S.friends[id].name.split(',')[0]}
  return pick(typeof LF_PEOPLE!=='undefined'?LF_PEOPLE:['a neighbor'])}
function repGift(big){const who=repGiver(),W=who.charAt(0).toUpperCase()+who.slice(1);
  const G=[
    {w:3,f:()=>{S.pantry+=1;return `🥚 A carton of eggs on the porch, still warm, from ${who}. (+1 day of food)`}},
    {w:2,f:()=>{adj('stress',-3);return `🍓 A jar of blackberry jam on your porch with a note from ${who}: “From the vines you didn’t cut.” (Stress −3)`}},
    {w:2,f:()=>{UP().wood+=2;return `🪵 ${W} dropped two nights’ worth of firewood by your shed. (+2 nights of wood)`}}];
  if(big)G.push(
    {w:2,f:()=>{S.pantry+=2;return `🍲 A casserole dish on the porch, foil on top, a name taped to the lid: ${who}. Return the dish. (+2 days of food)`}},
    {w:1,f:()=>{UP().wood+=3;homeAdj(2);return `🪓 You wake to the sound of ${who} splitting and stacking your woodpile. They wave and won’t take coffee. (+3 nights of wood)`}});
  if(big&&typeof phoneInstalled==='function'&&phoneInstalled('ferrypass')&&typeof FP==='function')G.push({w:1,f:()=>{FP().walk+=1;return `🎟️ ${W} texts you a spare walk-on ride from their Ferry Pass. “I’ll never use it.” (+1 walk-on ride)`}});
  let tot=G.reduce((a,g)=>a+g.w,0),x=Math.random()*tot;for(const g of G){x-=g.w;if(x<0)return g.f()}return G[0].f()}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up(where,notes,d);try{repNight(where,notes)}catch(e){console.error(e)}return r}}

// ---- friendship: a good name makes friends faster; a bad one, slower ----
{const _fp=friendPts;friendPts=function(id,n){if(n>0){const r=repVal();if(r>=20)n+=1;else if(r<=-20)n=Math.random()<0.5?Math.ceil(n/2):Math.floor(n/2)}return _fp(id,n)}}

// ---- the main screen: the cold shoulder in the ferry line, making up with an enemy ----
{const _actions=actions;actions=function(){const a=_actions();try{const R=S&&S.repx;if(!R||!R.enemies.length)return a;const dk=dayKey(),d=day(),m=tod();
  if((S.loc==='aiDock'||S.loc==='stDock')&&R.cold!==dk+S.loc){R.cold=dk+S.loc;if(Math.random()<0.25){const e=pick(R.enemies);adj('stress',4);
    say(`😠 ${e.who.charAt(0).toUpperCase()+e.who.slice(1)} is two cars ahead in the ferry line and makes a point of not seeing you. Stress +4.`)}}
  if(S.loc==='home')for(const e of R.enemies){const ok=(d===5||d===6)&&m>=480&&m<=960;
    a.push({cat:'here',ic:'🤝',l:`Make up with ${e.who}`,s:ok?`Offer to ${e.mend}. 2 hours, stress +3. Reputation +5.`:`They’re around on weekends, 8 AM–4 PM. Offer to ${e.mend}.`,dis:!ok,fn:()=>{
      S.t+=120;phoneTick();adj('stress',3);R.enemies=R.enemies.filter(x=>x!==e);
      say(`🤝 You show up at ${e.who}’s place and ${e.mend.replace(/^help them /,'help ')}. Neither of you mentions ${e.why}. At the end they hand you a beer. That’s that.`);
      repAdd(5,`made up with ${e.who}`);if(e.fid&&!S.friends[e.fid]&&Math.random()<0.5&&typeof NEIGHBORS!=='undefined'){const nb=NEIGHBORS.find(x=>x[0]===e.fid);if(nb)meet(nb[0],nb[1],'you made up after a falling-out')}
      afterAction()}})}
}catch(e){console.error(e)}return a}}

// ---- the 📣 Island Group app: the meter, Known for, and the people who aren't fans ----
function repHeaderHtml(){const r=repVal(),t=repTier(r),R=(S&&S.repx)||{known:[],enemies:[]},pct=Math.abs(r)/2;
  let h=`<div class="ph-rep rep2"><span>${t.ic}</span><div><b>${t.n} · ${r>0?'+':''}${r}</b><small>${t.d}</small>
    <div class="repbar" role="img" aria-label="Reputation ${r} of −100 to +100"><i class="${r<0?'neg':'pos'}" style="${r<0?`right:50%;width:${pct}%`:`left:50%;width:${pct}%`}"></i><em></em></div></div></div>`;
  if(R.known.length)h+=`<div class="ph-sub">Known for</div>`+R.known.slice(0,4).map(k=>`<div class="ph-grp"><small>${k.n>0?'+':''}${k.n}</small>${k.why}</div>`).join('');
  if(R.enemies.length)h+=`<div class="ph-sub">Not fans of yours</div>`+R.enemies.map(e=>`<div class="ph-grp"><small>😠</small><b>${e.who}</b>: ${e.why}. Make up at home on a weekend.</div>`).join('');
  return h}
{const g=phoneApp('group');if(g){const v=g.view;g.view=function(arg){return v.call(this,arg).replace(/<div class="ph-rep">[\s\S]*?<\/small><\/div><\/div>/,repHeaderHtml())}}}

// ---- to-do ----
{const _todo=todoItems;todoItems=function(){const it=_todo();try{for(const e of repEnemies())it.push({ok:false,fail:false,l:`Make up with ${e.who}`,s:`😠 ${e.why}. Weekends at home: offer to ${e.mend}.`,urgent:false})}catch(e){}return it}}

// ---- co-op pledges: +5 for every $100 you've put in ----
function repCoop(){const R=REP(),k=Math.floor((S.coop.you||0)/100);if(k>R.coop){const n=k-R.coop;R.coop=k;repAdd(5*n,'pledging to the co-op')}}

// ---- a favor you promised and didn't do: −5; twice for the same friend and they're done with you ----
function repFavorFailed(id,notes){const R=REP(),f=S.friends[id];repAdd(-5,`never did ${f?f.name.split(',')[0]:'a friend'} that favor`,{notes});
  R.fails[id]=(R.fails[id]||0)+1;if(R.fails[id]>=2&&f){const n=f.name.split(',')[0];repDropFriend(id);repEnemy(n,'you let them down twice',{notes,fid:id})}}

// ---- the Riv weekend shift as a second job: its own meter in the to-do list and a small score bonus ----
{const _todo=todoItems;todoItems=function(){const it=_todo();try{const J=typeof rivJob==='function'&&rivJob();
  if(J&&J.sched&&S.emp!=='riv')it.push({ok:false,fail:false,l:'Weekend shifts at the Riv',s:`🍳 Fri & Sat, 4–10 PM. Riv weekend job: ${J.m}. A no-show costs −15${J.m<=30?': one more and you’re off the schedule':''}.`,urgent:RIV_DAYS.includes(day())&&ECO().riv!==dayKey()&&tod()>=900})}catch(e){}return it}}
{const _sc=scoreOf;scoreOf=function(){const b=_sc();try{const J=ECO().rivJob;if(J&&J.sched&&J.m>50)return b+Math.round((J.m-50)*2*DF().score)}catch(e){}return b}}
