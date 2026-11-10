// ---------------- 💵 economy: more ways to earn, and what a good reputation gets you ----------------
// Overtime at your job, weekend evening shifts at the Riv (as a second job), firewood and eggs for the neighbors,
// and reputation unlocks (S.rep, −100..+100, see 25-reputation.js): +20 = first call on Gus, +35 = the co-op board, +60 = Island regular.
// All state lives in S.eco (created lazily, so older saves just work). Hooks wrap existing functions:
// actions(), upkeepNight(), afterAction(), todoView() and the Island Group phone app.
const ECO_DEF={ot:-1,full:-1,riv:-1,rivWk:-1,rivN:0,wood:-1,hens:0,nest:0,eggs:0,feed:0,eggSold:-1,noFeed:false,coopBooked:false,board:-1,perks:{},coffee:-1};
function ECO(){if(!S.eco||typeof S.eco!=='object')S.eco={};const e=S.eco;
  for(const k in ECO_DEF)if(e[k]===undefined||e[k]===null)e[k]=typeof ECO_DEF[k]==='object'?{}:ECO_DEF[k];return e}
const ecoRep=()=>typeof S.rep==='number'?S.rep:0;
const ecoPerk=n=>typeof S.rep==='number'&&S.rep>=n;
function gusFirstCall(){return ecoPerk(20)}
// ---- prices ----
const OT_HOURS=2, RIV_PAY=48, EGG_DOZEN=6, COOP_PRICE=120, FEED_PRICE=18, FEED_DAYS=20, HEN_NAMES='Christine, Steilacoom and Li’l Ketron';
function otPay(J){return Math.round(J.pay/((J.end-J.start)/60)*1.5*OT_HOURS)}
function woodPrice(){const s=typeof seasonId==='function'?seasonId():'fall';return ({winter:24,summer:15})[s]??19}
const henLay=()=>{const s=typeof seasonId==='function'?seasonId():'fall';return ({winter:0.5,summer:0.9})[s]??0.7};
// ---- ⏱️ overtime ----
function otActions(a,d,m){
  const J=curJob(),E=ECO(),dk=dayKey();if(!J||S.emp==='riv'||L[J.loc].side!=='M'||S.loc!==J.loc||!J.days.includes(d)||!S.worked[d])return;
  if(E.ot===dk){a.push({cat:'work',ic:'⏱️',l:'Overtime done for today',s:'Once a day is plenty.',dis:true});return}
  if(E.full!==dk||m<J.end||m>J.end+30)return;
  const pay=otPay(J),end=S.t+OT_HOURS*60,arr=end+dist(J.loc,'stDock');
  let boat=null;for(const dep of deps('M',d)){const s=sailing('M',d,dep,'walk',true);if(!s.cancel&&s.abs-20>=arr){boat=s;break}}
  a.push({cat:'work',ic:'⏱️',l:`Stay for overtime (${OT_HOURS} h) — ${$(pay)}`,s:`Time and a half. Done at ${fmt(end)}, so the earliest boat home is ${boat?fmt(boat.dep):'tomorrow'}. Stress +10.`,
    fn:()=>{E.ot=dk;S.t=end;phoneTick();money(pay);adj('stress',10);adj('job',2);S.stats.overtime=(S.stats.overtime||0)+1;
      say(`⏱️ ${pick(['Your boss says “Got a minute?” and it’s two hours.','You stay late to clear the backlog. The office gets very quiet after five.','Two more hours. You eat a granola bar from the bottom of your bag for dinner.'])} Time and a half: +${$(pay)}. ${boat?`Next boat home: ${fmt(boat.dep)}.`:'The boats are done for the night.'}`);afterAction()}});
}
// ---- 🍳 weekend evening shift at the Riv (a second job; not when the Riv is your main job) ----
const RIV_DAYS=[4,5], RIV_START=960, RIV_END=1320;
// The weekend shift is a second job with its own meter (E.rivJob): working it puts you on the Fri/Sat schedule.
// On time +3, late −4; a scheduled shift you skip −15 and reputation −5; at 0 you're fired (reputation −10).
const rivJob=()=>ECO().rivJob||null;
function rivMeter(n,notes,why){const J=rivJob();if(!J)return;J.m=Math.max(0,Math.min(100,J.m+n));
  if(J.m<=0){J.sched=false;ECO().rivFired=true;S.firedFrom=(S.firedFrom||[]).concat('riv');S.firedAt=Object.assign(S.firedAt||{},{riv:dayKey()});
    notes.push('🍳 <b>The Riv takes you off the weekend schedule for good.</b> “We needed someone we could count on.”');repAdd(-10,'fired from the Riv: the whole island eats there',{notes})}}
function rivNight(where,notes,d){const J=rivJob(),E=ECO();if(!J||!J.sched||S.emp==='riv'||!RIV_DAYS.includes(d)||E.riv===dayKey())return;
  notes.push(`🍳 You were on the Riv’s schedule tonight and never showed. The kitchen manager texts: “???” (Riv weekend job −15)`);repAdd(-5,'no-show at the Riv',{notes});rivMeter(-15,notes)}
function rivActions(a,d,m){
  if(S.loc!=='food'||S.emp==='riv')return;
  const E=ECO(),dk=dayKey(),J=rivJob();
  if(J&&J.sched)a.push({cat:'work',ic:'📅',l:'Take yourself off the weekend schedule',s:`You’re on for Fri and Sat, 4–10 PM. Riv weekend job: ${J.m}. No hard feelings if you tell them.`,fn:()=>{J.sched=false;S.t+=5;say('📅 You tell the kitchen manager you need your weekends back. “Fair. Door’s open.”');afterAction()}});
  if(!RIV_DAYS.includes(d))return;
  if(E.rivFired){a.push({cat:'work',ic:'🍳',l:'The Riv isn’t calling you for weekend shifts',s:'You were taken off the schedule.',dis:true});return}
  if(typeof repVal==='function'&&repVal()<-10){a.push({cat:'work',ic:'🍳',l:'No weekend shift for you',s:'The kitchen manager has heard things. Reputation −10 or better to get back on.',dis:true});return}
  if(E.riv===dk){a.push({cat:'work',ic:'🍳',l:'Weekend shift done ✓',s:'Your feet would like a word.',dis:true});return}
  if(m<900){a.push({cat:'work',ic:'🍳',l:'Weekend evening shift at the Riv: 4–10 PM',s:'They’re always a cook short on Fridays and Saturdays. Come by after 3.',dis:true});return}
  if(m>RIV_START+30){a.push({cat:'work',ic:'🍳',l:'Too late for tonight’s shift',s:'The weekend shift starts at 4:00 PM.',dis:true});return}
  a.push({cat:'work',ic:'🍳',l:'Work the weekend evening shift (4–10 PM)',s:`Second job, line cook${rivJob()?` (Riv weekend job: ${rivJob().m})`:''}. ${$(RIV_PAY+(typeof repVal==='function'&&repVal()>=60?10:0))} plus tips, a staff meal counts as dinner. Stress +8.`,
    fn:()=>rivShift(d,m)});
}
function rivShift(d,m){
  const E=ECO(),first=E.rivN===0;E.riv=dayKey();E.rivN++;
  const late=(m!=null?m:tod())>RIV_START;if(!E.rivJob)E.rivJob={m:70,sched:true};const J=E.rivJob,wasOn=J.sched;J.sched=true;
  const nts=[];rivMeter(late?-4:3,nts);nts.forEach(x=>say(x));
  const reg=typeof repVal==='function'&&repVal()>=60?10:0;
  S.t=d*1440+RIV_END;phoneTick();const tips=10+Math.floor(Math.random()*41),pay=RIV_PAY+reg+tips;money(pay);adj('stress',8);S.ateOut=d;
  S.stats.rivShifts=(S.stats.rivShifts||0)+1;
  say(first?'🍳 The kitchen manager hands you an apron before you finish asking. “Grill’s yours. Tickets on the rail. Don’t touch the fryer, it bites.”':
    pick(['🍳 Six hours of burgers, fish and chips, and one guy who wants his fries “medium rare.”','🍳 Friday-night rush: half the island and two tables of kayakers who missed the last boat.','🍳 The fryer bites. You knew it would.','🍳 A birthday party of eleven orders separately. You survive it.']));
  if(!wasOn)say('📅 You’re on the Riv’s weekend schedule now: Friday and Saturday, 4–10 PM. Tell the kitchen if you want off.');
  say(`💵 ${$(RIV_PAY+reg)} for the shift${reg?' (regulars’ rate)':''} plus ${$(tips)} in tips${tips>=40?' (someone left a twenty under a ketchup bottle)':tips<=15?' (mostly quarters and one ferry token)':''}. The staff meal counts as dinner.`);
  if(E.rivWk!==S.weekNo){E.rivWk=S.weekNo;repAdd(5,'half the island watched you work the grill at the Riv')}
  if(Math.random()<0.35){
    if(!S.friends.rusty)meet('rusty','Rusty from the bar','he talked your ear off through the kitchen window on a weekend shift');
    else if(!S.friends.walt)meet('walt','Walt from the American Legion','he sent his fish back twice, then tipped you ten dollars');
    else{const id=pick(['rusty','walt']);friendPts(id,1);say(id==='rusty'?'🍺 Rusty leans through the kitchen window all night offering opinions on your grill technique.':'🎖️ Walt eats at the counter and tells you the burgers were better in ’79. He tips well anyway.')}}
  afterAction();
}
// ---- 🪵 firewood for the neighbors ----
function woodActions(a,d,m){
  if(S.loc!=='home')return;const U=UP(),E=ECO(),dk=dayKey(),pr=woodPrice();
  const sold=E.wood===dk,low=U.wood<=4;
  a.push({cat:'here',ic:'🪵',l:sold?'Firewood bundle sold today ✓':`Sell a bundle of firewood — ${$(pr)}`,
    s:sold?'One a day. The honor box has its limits.':low?`You have ${U.wood} night${U.wood===1?'':'s'} of wood. Keep 4 for yourself: November is long.`:`Honor box at the end of the driveway. Leaves ${U.wood-1} nights for you.`,
    dis:sold||low,fn:()=>{if(UP().wood<=4)return render();E.wood=dk;U.wood--;S.t+=15;money(pr);S.stats.woodSold=(S.stats.woodSold||0)+1;
      say(`🪵 ${pick(['You stack a bundle in the honor box at the end of the driveway. By dark it’s gone and there’s cash in the coffee can, plus a note: “dry this time, thanks.”','A neighbor whose woodpile got rained on buys a bundle off the porch and tells you about it for twenty minutes.','A guy in a pickup with Oro Bay mud on the tires buys a bundle and says it’s “for a friend.” It’s for him.'])} +${$(pr)}.`);afterAction()}});
}
// ---- 🐔 hens and eggs ----
Object.assign(UP_JOBS,{coop:{who:'feed-store delivery truck',done:()=>{const E=ECO();E.hens=3;E.coopBooked=false;E.feed=Math.max(E.feed,14);
  say(`🐔 The delivery truck comes off the ferry with a chicken coop strapped down and three hens in a cardboard box, very offended about the crossing. You name them ${HEN_NAMES}.`);
  showTile('🐔','Your hens arrived','Collect eggs at home every day','good')}}});
function eggActions(a,d,m){
  const E=ECO(),dk=dayKey();
  if(S.loc==='depot'&&isOpen('depot')){
    if(!E.hens&&!E.coopBooked) a.push({cat:'trade',ic:'🐔',l:`Backyard coop and 3 hens — ${$(COOP_PRICE)}`,s:'Delivered to your house tomorrow on the ferry, with two weeks of feed. Eggs every day. Mostly.',dis:S.money<COOP_PRICE,
      fn:()=>{money(-COOP_PRICE);E.coopBooked=true;S.t+=20;UP().jobs.push({k:'coop',due:(day()+1)*1440+690});say('🐔 You buy a coop kit and three hens. The guy at the register asks if you’ve “done chickens before.” You say yes. You have not.');afterAction()}});
    if(E.hens||E.coopBooked) a.push({cat:'trade',ic:'🌾',l:`Chicken feed, 40-lb bag — ${$(FEED_PRICE)}`,s:`About ${FEED_DAYS} days for three hens. You have ${E.feed} day${E.feed===1?'':'s'} of feed.`,dis:S.money<FEED_PRICE||E.feed>40,
      fn:()=>{money(-FEED_PRICE);E.feed+=FEED_DAYS;S.t+=10;say('🌾 Forty pounds of layer pellets. It rides the ferry like a very heavy passenger.');afterAction()}});
  }
  if(S.loc==='store'&&S.coop&&S.coop.open&&(E.hens||E.coopBooked)) a.push({cat:'trade',ic:'🌾',l:'Chicken feed at the co-op — $20',s:`A ${FEED_DAYS}-day bag, no ferry. You have ${E.feed} day${E.feed===1?'':'s'} of feed.`,dis:S.money<20||E.feed>40,
    fn:()=>{money(-20);E.feed+=FEED_DAYS;S.t+=10;say('🌾 A bag of feed from the co-op. The volunteer asks after your hens by name.');afterAction()}});
  if(S.loc!=='home')return;
  if(!E.hens&&!E.coopBooked&&flv('sam')>=3) a.push({cat:'here',ic:'🐔',l:'Ask Sam for a few of his hens — $40',s:'Sam has too many chickens. You pay for the coop lumber; the hens are free, plus a week of feed.',dis:S.money<40||S.phone<=0,
    fn:()=>{money(-40);E.hens=3;E.feed=Math.max(E.feed,7);S.t+=60;phoneTick();friendPts('sam',1);say(`🐔 Sam shows up with a coop he built “from a kit, mostly” and three hens in a dog crate. “They’re named after the ferries. Don’t let them near the road.” Meet ${HEN_NAMES}.`);afterAction()}});
  if(!E.hens)return;
  a.push({cat:'here',ic:'🥚',l:E.nest?`Collect the eggs (${E.nest} in the nest boxes)`:'No eggs in the nest boxes',s:E.nest?`5 min. ${E.eggs} in the fridge.`:E.feed<=0?'The hens are out of feed. Buy a bag at Home Depot (or the co-op).':`Check again tomorrow. ${E.eggs} in the fridge · feed for ${E.feed} day${E.feed===1?'':'s'}.`,dis:!E.nest,
    fn:()=>{const n=E.nest;E.nest=0;E.eggs=Math.min(36,E.eggs+n);S.t+=5;say(`🥚 ${n} egg${n===1?'':'s'}, still warm. ${pick(['Li’l Ketron pecks your hand on principle.','Christine supervises from the roost.','Steilacoom is sitting on a golf ball again.'])}`);afterAction()}});
  const sold=E.eggSold===dk;
  a.push({cat:'here',ic:'🥚',l:sold?'Sold a dozen today ✓':`Sell a dozen eggs to the neighbors — ${$(EGG_DOZEN)}`,s:sold?'Everybody on your road is set for eggs.':E.eggs>=12?'A cooler at the end of the driveway and a hand-lettered sign.':`You have ${E.eggs}. Need 12.`,dis:sold||E.eggs<12,
    fn:()=>{E.eggSold=dk;E.eggs-=12;money(EGG_DOZEN);S.t+=10;S.stats.eggsSold=(S.stats.eggsSold||0)+1;say(`🥚 A dozen eggs to the neighbors for ${$(EGG_DOZEN)}. ${pick(['They pay in exact change and a jar of blackberry jam.','“Brown ones taste better,” they say. You don’t argue.','They promise to bring the carton back. They will not.'])}`);afterAction()}});
  if(E.eggs>=12) a.push({cat:'here',ic:'🍳',l:'Put a dozen eggs toward dinner',s:'+1 day of food in the pantry.',fn:()=>{E.eggs-=12;S.pantry++;S.t+=5;say('🍳 Twelve eggs: omelets, a frittata and a quiche you’re weirdly proud of. +1 day of food.');afterAction()}});
}
function ecoNight(where,notes){
  const E=ECO();if(!E.hens)return;
  if(E.feed<=0){if(!E.noFeed){E.noFeed=true;notes.push('🐔 The hens are out of feed and on strike. No eggs until you buy a bag (Home Depot, or the co-op once it’s open).')}return}
  E.feed--;E.noFeed=false;let n=0;for(let i=0;i<E.hens;i++)if(Math.random()<henLay())n++;
  E.nest=Math.min(12,E.nest+n);if(E.feed===3)notes.push('🌾 Three days of chicken feed left.');
}
// ---- 📌 rep 5: the co-op board ----
Object.assign(UP_JOBS,{board:{who:'co-op board',island:true,done:j=>boardReply(j)}});
function boardActions(a){
  if(S.loc!=='store'||!S.coop||!ecoPerk(35))return;const E=ECO(),pend=upJob('board');
  a.push({cat:'here',ic:'📌',l:E.board===S.weekNo?(pend?'Your board post is up':'Posted on the board this week ✓'):'Post on the co-op board',
    s:E.board===S.weekNo?(pend?'Somebody always reads it eventually. Usually by dinner.':'One post a week, or the volunteers start taking your pushpins.'):'10 min. Firewood, eggs, or “anyone have one of these?” A buyer or a free find, usually within a few hours.',
    dis:E.board===S.weekNo,fn:()=>{E.board=S.weekNo;S.t+=10;UP().jobs.push({k:'board',due:S.t+150+Math.floor(Math.random()*60)});
      say(`📌 You pin an index card to the co-op board: “${UP().wood>4||ECO().eggs>=12?'FIREWOOD & EGGS. Fair prices. Ask for {{name}}.':'Looking for odds & ends. Will trade cookies.'}” It joins a lost-cat flyer and a 2019 potluck sign-up.`);afterAction()}});
}
function boardReply(){
  const E=ECO(),U=UP(),pr=woodPrice()+5;let msg,tile;
  if(U.wood>4){const n=Math.min(3,U.wood-4);U.wood-=n;money(n*pr);msg=`📌 Someone from the co-op board calls: their stove is hungry and the woodshed is empty. They pick up ${n} bundle${n>1?'s':''} of your firewood at ${$(pr)} each, cash. You still have ${U.wood} nights.`;tile=`Sold ${n} bundle${n>1?'s':''} · +${$(n*pr)}`}
  else if(E.eggs>=12){const n=Math.min(3,Math.floor(E.eggs/12));E.eggs-=n*12;money(n*(EGG_DOZEN+1));msg=`📌 A board regular wants eggs “from a hen with a name.” ${n} dozen at ${$(EGG_DOZEN+1)} a dozen.`;tile=`${n} dozen eggs sold · +${$(n*(EGG_DOZEN+1))}`}
  else{const g=pick([
      ['A retired couple is “downsizing” their woodshed. Four nights of dry firewood, free, if you haul it.',()=>{U.wood=Math.min(14,U.wood+4);U.woodOut=false}],
      ['A neighbor cleaning out their pantry leaves a box on your porch: canned peaches, three boxes of pasta and a fruitcake from an unknown year. +1 day of food.',()=>{S.pantry++}],
      [S.cooler?'Someone gives you a box of mason jars and a thermos “that keeps coffee hot till Tuesday.” Stress −3.':'Someone is giving away a big cooler. “Every islander needs one.” Now you have one.',()=>{if(S.cooler)adj('stress',-3);else S.cooler=true}],
      ['Free to a good home: a six-pack of mouse traps, never used, “long story.”',()=>{U.trapsOwned=true}]]);
    g[1]();msg=`📌 Co-op board: ${g[0]}`;tile='A free find'}
  say(msg);showTile('📌','Your co-op board post got a bite',tile,'good');
}
// ---- ☕ rep 8: Island regular ----
function regularActions(a,d){
  if(!ecoPerk(60))return;const E=ECO(),dk=dayKey();
  if(S.loc==='aiDock'&&tod()>=300&&tod()<1200) a.push({cat:'ferry',ic:'☕',l:E.coffee===dk?'Already had your ferry-line coffee':'Free coffee in the ferry line',s:E.coffee===dk?'Don’t push it.':'Island regular perk. 5 min. Stress −4.',dis:E.coffee===dk,
    fn:()=>{E.coffee=dk;S.t+=5;adj('stress',-4);say(`☕ ${pick(['The guy two cars up knocks on your window with a spare thermos cup. “You’re the one who helped my mom with her freezer.”','Somebody in the ferry line always has an extra coffee for you now. Today it’s hazelnut. You don’t ask.'])}`);afterAction()}});
  if(S.loc==='food'){const i=a.findIndex(x=>/^Takeout dinner/.test(x.l||''));
    if(i>=0) a[i]=Object.assign({},a[i],{l:'Takeout dinner — $20 (regulars’ price)',s:S.ateOut===d?'Already got dinner tonight.':'Island regular: they start your order when they see your car.',dis:S.ateOut===d||S.money<20,
      fn:()=>{S.ateOut=d;money(-20);S.t+=20;adj('stress',-5);say('🍔 “The usual?” It is. $20, regulars’ price, and they threw in extra fries.');afterAction()}})}
}
// ---- 🤲 reputation unlocks ----
const REP_PERKS=[
  {n:20,ic:'🧰',t:'First call on Gus',d:'Gus comes the next day and always shows up.',say:'🧰 Word gets around. Gus heard you’ve been helping half the island: from now on you get <b>first call</b>. He comes the next day, and he actually shows up.'},
  {n:35,ic:'📌',t:'The co-op board',d:'Once a week, post at the old store: a buyer for firewood or eggs, or a free find.',say:'📌 A co-op volunteer hands you a fistful of pushpins: “You’re one of us now. Use the board.” Once a week you can post on the <b>co-op board</b> at the old store.'},
  {n:60,ic:'☕',t:'Island regular',d:'$20 takeout at the Riv and a free coffee in the ferry line every day.',say:'☕ <b>Island regular.</b> The Riv knows your order (takeout at the $20 regulars’ price), and somebody in the ferry line always has a spare coffee for you.'}];
function repCheck(){
  if(!S||S.over||typeof S.rep!=='number')return;const E=ECO();
  for(const p of REP_PERKS)if(S.rep>=p.n&&!E.perks[p.n]){E.perks[p.n]=true;say(p.say);showTile(p.ic,`Reputation ${p.n}: ${p.t}`,p.d,'good')}
}
function repPerksHtml(card){
  const r=ecoRep(),nx=REP_PERKS.find(p=>r<p.n);
  const rows=REP_PERKS.map(p=>`${r>=p.n?'✅':'🔒'} <b>${p.ic} ${p.t}</b> (rep ${p.n}): ${p.d}`);
  return {r,nx,rows};
}
function repTodoView(){const {r,nx,rows}=repPerksHtml();if(r===0&&!S.friends.gus&&!repEnemies().length)return '';const T=repTier(r);
  return `<div class="sect">Island reputation: ${T.ic} ${T.n} · ${r>0?'+':''}${r}</div>`+REP_PERKS.map((p,i)=>`<div class="todo eco-perk ${r>=p.n?'on':''}"><span class="ck">${r>=p.n?'✅':'🔒'}</span><div><b>${p.ic} ${p.t} · rep ${p.n}</b><span>${p.d}</span></div></div>`).join('')+
    (nx?`<p class="eco-next">${nx.n-r} more to unlock ${nx.t.toLowerCase()}. Help neighbors, show up for island events, return lost packages.</p>`:'');
}
// ---- hooks ----
{const _actions=actions;actions=function(){const a=_actions(),d=day(),m=tod(),dk=dayKey();
  const fs=a.find(x=>/^Work a full shift/.test(x.l||''));if(fs&&fs.fn){const f=fs.fn;fs.fn=()=>{ECO().full=dk;return f()}}
  otActions(a,d,m);rivActions(a,d,m);woodActions(a,d,m);eggActions(a,d,m);boardActions(a);regularActions(a,d);return a}}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up(where,notes,d);ecoNight(where,notes,d);try{rivNight(where,notes,d)}catch(e){console.error(e)}return r}}
{const _aa=afterAction;afterAction=function(){repCheck();return _aa.apply(this,arguments)}}
{const _tv=todoView;todoView=function(){const h=_tv(),x=repTodoView(),k=h.indexOf('<div class="sect">Survive');return k<0?h+x:h.slice(0,k)+x+h.slice(k)}}
{const g=phoneApp('group');if(g){const v=g.view;g.view=function(arg){const {r,nx,rows}=repPerksHtml();
  return v.call(this,arg)+`<div class="ph-sub">What your reputation gets you</div>`+phCard(rows.join('<br>'),'eco-perks')+(nx?phNote(`${nx.n-r} more good deed${nx.n-r===1?'':'s'} to unlock ${nx.t.toLowerCase()}.`):'')}}}
