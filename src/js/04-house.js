// ---- 🏠 home condition: 0–100. Drops daily; low = worse sleep, more house trouble, fewer visits; high = better rest, cozy mornings, score ----
const HOME_LOW=35, HOME_HIGH=75;
function homeTier(){const h=S.home??70;return h<HOME_LOW?'low':h>=HOME_HIGH?'high':'ok'}
const HOME_SOCIAL=new Set(['friend_coffee','sam_groceries','henderson_dinner','fish_fry','favor_ask','neighbor_ride']);
function homeEventMul(id){const t=homeTier();if(HOME_SOCIAL.has(id))return t==='low'?0.5:t==='high'?1.2:1;return 1}
function homeAdj(v){S.home=clamp(Math.round((S.home??70)+v),0,100)}
Object.assign(TILE_META,{leaky_roof:['💧','The roof is leaking','bad'],clogged_drain:['🪠','Clogged drain','bad'],mice:['🐭','Mice in the pantry','bad'],friend_dropin:['🏡','A friend drops by','good']});
// ---- 🧰 upkeep: daily chores, interior maintenance, and the yard/property. All state lives in S.up ----
function upInit(){const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  return {dishes:1,laundry:1,needles:1,bed:1,ash:r(0,3),chimney:r(5,18),wood:r(2,5),damp:r(0,3),mold:false,fridge:false,traps:0,trapsOwned:false,
    septic:r(35,70),gutters:r(20,55),limbs:r(30,65),well:r(5,45),moss:r(25,60),pot:r(15,50),genSvc:r(0,12),propane:r(35,70),done:{},jobs:[],rain:-1,burned:-1}}
const UP=()=>S.up||(S.up=upInit());
const dayKey=()=>S.weekNo*7+day();
const CHORES={dishes:['🍽️','Do the dishes',10,2,'The sink is full again.'],laundry:['🧺','Do a load of laundry',30,2,'Wash, dry, actually fold it.'],
  needles:['🧹','Sweep up the cedar needles',15,2,'Tracked in from the driveway. Every. Single. Day.'],bed:['🛏️','Make the bed',10,1,'Small thing. Feels like a big one at 10 PM.']};
function upInjure(how){if(S.injury&&!S.injury.treated)return false;S.injury={day:day(),treated:false};adj('health',-15);say(`🤕 ${how} Your ankle swells up fast. You need Urgent Care on the mainland.`);showTile('🤕','You hurt your ankle','Urgent Care in DuPont','bad');return true}
const rainTonight=()=>UP().rain===dayKey();
Object.assign(TILE_META,{leaky_roof:['💧','The roof is leaking','bad'],clogged_drain:['🪠','Clogged drain','bad'],mice:['🐭','Mice in the pantry','bad'],friend_dropin:['🏡','A friend drops by','good'],
  black_mold:['🦠','Black mold','bad'],chimney_fire:['🔥','Chimney fire!','bad'],crawl_flood:['🌊','Crawlspace flooded','bad'],limb_roof:['🌲','A limb came through the roof','bad'],
  septic_backup:['🚽','Septic backup','bad'],well_quit:['🚰','The well pump quit','bad'],mouse_caught:['🪤','The trap got one','good']});
const UP_JOBS={
  septic:{who:'septic pump truck',msg:'🚚 The septic truck backs down the driveway, does its noisy work, and leaves. Tank: empty. Drains: happy.',done:()=>{UP().septic=0}},
  arborist:{who:'tree crew',msg:'🌲 The tree crew drops the limbs hanging over your roof and chips them in an hour. You can see the sky again.',done:()=>{UP().limbs=0}},
  propane:{who:'propane truck',msg:'🔥 The propane truck fills the tank. Heat and hot water: sorted.',done:()=>{UP().propane=100}}};
const upJob=k=>UP().jobs.find(j=>j.k===k);
function upSchedule(k,cost,what){money(-cost);S.t+=10;phoneTick();UP().jobs.push({k,due:(day()+1)*1440+660});say(`📱 ${what} Booked for tomorrow late morning, if the ferry cooperates.`);afterAction()}
function upkeepNight(where,notes,d){
  const U=UP(),home=where==='home',storm=stormNight(d),SN=seasonUp(); // season
  const rain=storm||Math.random()<0.22*SN.rain;if(rain)U.rain=dayKey();
  const inc=(k,v,max=100)=>{U[k]=Math.min(max,Math.round((U[k]+v)*10)/10)};
  inc('gutters',(5+(rain?8:0)+(storm?10:0))*SN.gut);inc('moss',1.5*SN.moss);inc('pot',2+(rain?4:0)+(storm?4:0));inc('limbs',1);inc('well',1,999);inc('septic',2.5); // season
  if(S.gen)inc('genSvc',1,999);
  if(home&&SN.stove){inc('chimney',1,999);inc('ash',1,99)} // season
  inc('damp',1+(rain?1:0)+(S.power&&S.ev.flags.genRan!==d?1:0),20);
  if(U.traps>0)U.traps--;
  // heat: the woodstove first, the propane furnace as backup
  let burned=false;
  if(home&&SN.stove&&U.wood>0){U.wood=Math.max(0,U.wood-SN.wood);burned=true;U.burned=dayKey()} // season
  const was=U.propane;U.propane=Math.max(0,Math.round(U.propane-(burned?SN.prop[0]:home?SN.prop[1]:SN.prop[2]))); // season
  if(was>0&&U.propane===0)notes.push('🔥 The propane tank ran dry: no furnace, no hot water. (Order a propane delivery.)');
  if(home&&SN.stove&&!burned&&U.propane===0){adj('health',-3);adj('stress',6);notes.push('🥶 No dry firewood and no propane. You sleep in a hat and two sweatshirts and still wake up cold.')} // season
  else if(U.propane===0)adj('stress',3);
  if(home&&SN.stove&&!burned&&U.propane>0&&!U.woodOut){U.woodOut=true;notes.push('🪵 Out of dry firewood, so the propane furnace runs all night and drinks the tank.')} // season
  if(U.fridge){adj('stress',4);homeAdj(-3);notes.push('🤢 Something in the fridge spoiled during the outage, and it’s making itself known. (Clean out the fridge.)')}
  if(U.mold){adj('health',-1);adj('stress',2);notes.push('🦠 The mold in the bathroom isn’t going away on its own.')}
  hhNight(where,notes,d);
}
function choresPile(notes){const U=UP();let pile=0;const late=[];
  for(const k in CHORES){U[k]=(U[k]||0)+1;if(U[k]>1){pile+=U[k]-1;late.push(CHORES[k][1].replace(/^(Do|Make|Sweep up) (the |a load of )?/,'').toLowerCase())}}
  pile=Math.min(8,pile);if(pile>=6)notes.push(`🧺 The chores are piling up (${late.join(', ')}). Every day you skip them, the house slips a little more.`);return pile}
const U_REST=()=>S.rest&&S.rest.k===dayKey()?S.rest.n:0;
function upkeepActions(a,d,m){
  const U=UP(),dk=dayKey(),lite=seasonLite(m),dark=seasonDark(), // season
    phoneOK=S.phone>0;
  const doneToday=k=>U.done[k]===dk;
  const add=(o)=>a.push(o);
  // inside: daily chores
  for(const k in CHORES){const [ic,l,min,h,desc]=CHORES[k];const skip=U[k]-1;
    add({cat:'home',ic,l:doneToday(k)?`${l} ✓`:l,due:skip>=1&&!doneToday(k),s:doneToday(k)?'Done for today.':`${min} min. ${desc}${skip>=1?` Skipped ${skip} day${skip>1?'s':''}.`:''} Home +${h}.`,dis:doneToday(k),
      fn:()=>{S.t+=min;U[k]=0;U.done[k]=dk;homeAdj(h);adj('stress',-1);say(`${ic} ${l.replace(/^Do |^Make |^Sweep up /,m=>({ 'Do ':'Done: ','Make ':'Made: ','Sweep up ':'Swept up: '})[m])}.`);afterAction()}})}
  const J=curJob(),offDay=!J||!J.days.includes(d);
  add({cat:'home',ic:'🧽',l:'Deep clean the house',due:offDay&&S.home<60&&!doneToday('deep'),s:!offDay?'A day-off job: 2 hours you don’t have on a workday.':doneToday('deep')?'Already done today.':'2 hours: floors, bathroom, fridge, windows. Home +25, stress −10.',dis:!offDay||doneToday('deep')||m>=1260,
    fn:()=>{S.t+=120;U.done.deep=dk;homeAdj(25);adj('stress',-10);say('🧽 Two hours, one playlist, and the whole house smells like lemon. You stand back and admire it.');afterAction()}});
  if(U.fridge) add({cat:'home',ic:'🤢',l:'Clean out the fridge',due:true,s:'20 min. Toss what spoiled in the outage, bleach the shelves. Stops the smell.',fn:()=>{S.t+=20;U.fridge=false;homeAdj(4);adj('stress',-2);say('🤢 You hold your breath, bag it all, and scrub. The fridge is fresh again.');afterAction()}});
  add({cat:'home',ic:'🪟',l:'Wipe the windows, run the bath fan',due:U.damp>=3&&!doneToday('damp'),s:doneToday('damp')?'Done for today.':`15 min. Winter condensation: ${U.damp>=4?'the sills are soaked and mold is coming':U.damp>=2?'beads on every window':'pretty dry right now'}.`,dis:doneToday('damp'),
    fn:()=>{S.t+=15;U.damp=0;U.done.damp=dk;homeAdj(1);say('🪟 Squeegee, towel, fan on. The windows can breathe.');afterAction()}});
  if(U.mold) add({cat:'home',ic:'🦠',l:'Scrub the black mold',due:true,s:'1 hour with bleach and a mask. It’s costing you health every night.',fn:()=>{S.t+=60;U.mold=false;U.damp=0;homeAdj(6);adj('health',2);say('🦠 Mask on, bleach out, window open. The bathroom ceiling is white again.');afterAction()}});
  add({cat:'home',ic:'🧯',l:'Clean the woodstove ash',due:U.ash>=3,s:U.ash<=0?'Clean.':`15 min. ${U.ash} day${U.ash===1?'':'s'} of ash in the firebox.`,dis:U.ash<=0,fn:()=>{S.t+=15;U.ash=0;homeAdj(1);say('🧯 A bucket of ash out to the garden. The fire draws better already.');afterAction()}});
  add({cat:'home',ic:'🏚️',l:'Sweep the chimney',due:U.chimney>=21,s:U.chimney<5?'Swept recently.':`90 min on the roof with a brush. ${U.chimney} days of creosote building up${U.chimney>=21?': chimney fire risk':''}.`,dis:U.chimney<5||!lite,
    fn:()=>{if(U.chimney<21)achUnlock('chimney');S.t+=90;U.chimney=0;homeAdj(2);if(Math.random()<0.04)upInjure('Coming down the wet ladder, your foot slips off the last rung.');else say('🏚️ A bucket of black flakes later, the flue is clean.');afterAction()}});
  add({cat:'home',ic:'🪵',l:`Split and stack firewood (${U.wood} night${U.wood===1?'':'s'} left)`,due:U.wood<=1&&seasonStove(),s:doneToday('wood')?'Done for today. Your back says so.':'1 hour. +4 nights of dry wood. Without it, the propane furnace takes over.',dis:doneToday('wood')||U.wood>=14, // season
    fn:()=>{S.t+=60;U.wood=Math.min(14,U.wood+4);U.woodOut=false;U.done.wood=dk;adj('stress',-2);if(Math.random()<0.03)upInjure('You step on a wet round of fir and roll your ankle.');else say('🪵 Thunk. Thunk. A good hour of splitting, and a tidy stack under the eaves.');afterAction()}});
  if(U.trapsOwned) add({cat:'home',ic:'🪤',l:U.traps>0?`Mouse traps set (${U.traps} more nights)`:'Set the mouse traps',due:U.traps<=0,s:'10 min. Peanut butter under the sink and in the pantry. Keeps the mice out of your food for a week.',dis:U.traps>0,fn:()=>{S.t+=10;U.traps=7;say('🪤 Traps baited and set.');afterAction()}});
  const sj=upJob('septic');
  add({cat:'home',ic:'🚽',l:sj?'Septic pump-out booked':'Schedule a septic pump-out — $395',due:U.septic>=75&&!sj,s:sj?`The truck comes over on the ferry: ${fmtAbs(sj.due)}.`:`Tank about ${Math.round(U.septic)}% full. ${phoneOK?'A call to the pump service; the truck rides the ferry.':'Your phone is dead.'}`,dis:!!sj||!phoneOK||S.money<395||U.septic<30,
    fn:()=>upSchedule('septic',395,'Septic pump-out')});
  // outside & property
  add({cat:'yard',ic:'🍂',l:'Clear the gutters',due:U.gutters>=60,s:!lite?dark:`45 min on a ladder. ${Math.round(U.gutters)}% full of fir needles${U.gutters>=60?': the next heavy rain floods the crawlspace':''}.`,dis:U.gutters<10||!lite,
    fn:()=>{S.t+=45;U.gutters=0;homeAdj(2);if(Math.random()<0.03)upInjure('The ladder shifts on the wet moss.');else say('🍂 Three buckets of soggy needles. The downspouts gurgle happily.');afterAction()}});
  const tj=upJob('arborist');
  add({cat:'yard',ic:'🌲',l:'Trim the limbs over the roof yourself',due:U.limbs>=60&&!tj,s:!lite?dark:`2 hours with a pole saw. ${U.limbs>=60?'Big limbs hang right over the roof: a windstorm risk.':'They’re getting long.'} Risky.`,dis:U.limbs<10||!lite||!!tj,
    fn:()=>{S.t+=120;if(Math.random()<0.1){U.limbs=Math.max(0,U.limbs-40);upInjure('A limb swings back as it falls and knocks you off the stepladder.')}else{U.limbs=0;say('🌲 Two hours, a pile of fir boughs, and a roof you no longer worry about.')}afterAction()}});
  add({cat:'yard',ic:'📱',l:tj?'Tree crew booked':'Hire a tree crew — $280',due:false,s:tj?`They come over on the ferry: ${fmtAbs(tj.due)}.`:phoneOK?'Safer. They come over on the ferry tomorrow.':'Your phone is dead.',dis:!!tj||!phoneOK||S.money<280||U.limbs<10,fn:()=>upSchedule('arborist',280,'Tree crew to trim the limbs over the roof.')});
  add({cat:'yard',ic:'🚰',l:'Service the well pump and pressure tank',due:U.well>45,s:U.well<5?'Just checked.':`30 min: check the pressure, drain the sediment. Last done ${Math.round(U.well)} days ago. Keeps the water on.`,dis:U.well<5,fn:()=>{S.t+=30;U.well=0;say('🚰 Pressure’s good, the tank drains clear. The pump hums like it should.');afterAction()}});
  add({cat:'yard',ic:'🟩',l:'Treat the moss on the roof — $28',due:U.moss>=60,s:!lite?dark:`90 min with a sprayer. ${U.moss>=80?'It’s a lawn up there: leaks are coming.':U.moss>=60?'Thick and spongy.':'A green fuzz.'}`,dis:U.moss<10||!lite||S.money<28,
    fn:()=>{money(-28);S.t+=90;U.moss=0;homeAdj(2);say('🟩 Zinc spray on the shingles. The moss will brown and wash off in the rain.');afterAction()}});
  add({cat:'yard',ic:'🕳️',l:'Fill the driveway potholes — $30',due:U.pot>=60,s:!lite?dark:`1 hour with cold patch and a tamper. ${U.pot>=60?'Deep enough to eat a tire.':'Getting rough.'}`,dis:U.pot<10||!lite||S.money<30,
    fn:()=>{money(-30);S.t+=60;U.pot=0;say('🕳️ Cold patch, tamp, repeat. The driveway is smooth for now.');afterAction()}});
  if(S.gen==='home') add({cat:'yard',ic:'🔧',l:'Service the generator — $16',due:U.genSvc>14,s:U.genSvc<3?'Freshly serviced.':`30 min: oil change and a test run. ${U.genSvc>14?`${U.genSvc} days since the last one: it may not start in an outage.`:'Keeps it ready.'}`,dis:U.genSvc<3||S.money<16,
    fn:()=>{money(-16);S.t+=30;U.genSvc=0;say('🔧 Fresh oil, a test run in the driveway. It fires on the second pull.');afterAction()}});
  const pj=upJob('propane'),pc=Math.round((100-U.propane)*2.6)+45;
  add({cat:'yard',ic:'🔥',l:pj?'Propane delivery booked':`Order propane — $${pc}`,due:U.propane<25&&!pj,s:pj?`The truck comes over on the ferry: ${fmtAbs(pj.due)}.`:`Tank at ${U.propane}%. ${phoneOK?'Fill-up plus a $45 island delivery fee. The truck rides the ferry.':'Your phone is dead.'}`,dis:!!pj||!phoneOK||S.money<pc||U.propane>=90,
    fn:()=>upSchedule('propane',pc,'Propane fill-up.')});
}
// ---- 🧰 island help: Gus the handyman, the Anderson Island community group, reputation (S.rep), work parties ----
// Maintenance tasks ranked by how far past their due threshold they are (score >= 1 means due).
const UP_TASKS={
  mold:{ic:'🦠',n:'scrubbed the black mold',d:'Scrub the black mold',o:'black mold',sc:U=>U.mold?2.5:0,fix:U=>{U.mold=false;U.damp=0;homeAdj(6)}},
  chimney:{ic:'🏚️',n:'swept the chimney',d:'Sweep the chimney',o:'chimney',sc:U=>U.chimney/21,fix:U=>{U.chimney=0;homeAdj(2)}},
  gutters:{ic:'🍂',n:'cleared the gutters',d:'Clear the gutters',o:'gutters',sc:U=>U.gutters/60,fix:U=>{U.gutters=0;homeAdj(2)}},
  limbs:{ic:'🌲',n:'trimmed the limbs over the roof',d:'Trim the limbs over the roof',o:'limbs over the roof',sc:U=>upJob('arborist')?0:U.limbs/60,fix:U=>{U.limbs=0}},
  moss:{ic:'🟩',n:'treated the roof moss',d:'Treat the roof moss',o:'roof moss',sc:U=>U.moss/60,fix:U=>{U.moss=0;homeAdj(2)}},
  pot:{ic:'🕳️',n:'filled the driveway potholes',d:'Fill the driveway potholes',o:'driveway potholes',sc:U=>U.pot/60,fix:U=>{U.pot=0}},
  well:{ic:'🚰',n:'serviced the well pump',d:'Service the well pump',o:'well pump',sc:U=>U.well/46,fix:U=>{U.well=0}},
  genSvc:{ic:'🔧',n:'serviced the generator',d:'Service the generator',o:'generator',sc:U=>S.gen==='home'?U.genSvc/15:0,fix:U=>{U.genSvc=0}},
  damp:{ic:'🪟',n:'dried the windows and ran the bath fan',d:'Dry out the windows',o:'window condensation',sc:U=>U.damp/3,fix:U=>{U.damp=0;homeAdj(1)}},
  ash:{ic:'🧯',n:'cleaned out the woodstove ash',d:'Clean out the woodstove ash',o:'woodstove ash',sc:U=>U.ash/3,fix:U=>{U.ash=0;homeAdj(1)}}};
function upPressing(n=3,min=0.5){const U=UP();return Object.keys(UP_TASKS).map(k=>({k,s:UP_TASKS[k].sc(U)})).filter(x=>x.s>=min).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.k)}
function upFix(ks){const U=UP();ks.forEach(k=>UP_TASKS[k].fix(U));return ks.map(k=>UP_TASKS[k].n)}
function upChoresDone(){const U=UP(),dk=dayKey();for(const k in CHORES){U[k]=0;U.done[k]=dk}}
const andList=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function upAnyDue(){const U=UP();return upPressing(1,1).length>0||Object.keys(CHORES).some(k=>U[k]>=2)||U.fridge||(U.wood<=1&&seasonStove())||U.septic>=75||U.propane<25} // season
const COMM=()=>S.comm||(S.comm={post:-1,help:-1,flakes:0});
const COMM_NAME='the Anderson Island community group';
const NEIGHBORS=[['marta','Marta, from up the road','answered your post in the community group'],['ken','Big Ken, who has a tractor','showed up from the community group'],
  ['lorraine','Lorraine, who knows everyone','met through the community group'],['dev','Dev, the retired machinist','met through the community group']];
function newNeighbor(how){const n=NEIGHBORS.filter(x=>!S.friends[x[0]]);if(!n.length)return false;const p=pick(n);return meet(p[0],p[1],how||p[2])}
const GUS_FLAKE=['📱 Gus texts at 10:40: “Truck’s fine, but the ferry line was long and then I got talking. Tomorrow. Promise.” He wasn’t even taking the ferry.',
  '📱 No Gus. Around noon: “Sorry, the Hendersons’ goat got out. Tomorrow.” You didn’t know the Hendersons had a goat.',
  '📱 Gus texts a photo of a very large salmon. Then: “Tomorrow?”',
  '📱 Gus calls: “I was halfway there and remembered it’s my mother’s birthday. She’s 91. Tomorrow, late morning-ish.”'];
const gusRate=()=>flv('gus')>=2?60:90;
Object.assign(PERKS,{gus:{2:'Gus gives you the friends rate: $60 cash instead of $90.',3:'Gus does the dishes and the laundry while he’s there. Don’t ask why. Just let him.'}});
Object.assign(UP_JOBS,{
  gus:{who:'Gus',island:true,done:j=>gusArrive(j)},
  post:{who:'community group',island:true,done:j=>postArrive(j)}});
function gusArrive(j){
  if(!j.flaked&&!j.sure&&Math.random()<0.25){const c=COMM();const line=GUS_FLAKE[c.flakes%GUS_FLAKE.length];c.flakes++;
    UP().jobs.push(Object.assign({},j,{flaked:true,due:j.due+1440}));say(line);showTile('🧰','Gus didn’t show','Island time. He says tomorrow.','info');return}
  const ks=upPressing(3),did=upFix(ks),home=S.loc==='home',first=!S.friends.gus;
  let extra='';if(flv('gus')>=3){upChoresDone();homeAdj(4);extra=' He also did your dishes and a load of laundry, and folded it better than you do.'}
  if(!did.length){UP().wood=Math.min(14,UP().wood+4);extra=' Nothing much needed fixing, so he split a pile of firewood and drank your coffee.'+extra}
  homeAdj(3);adj('stress',-4);
  say(`🧰 ${home?'Gus’s truck rattles up the driveway':'While you were out, Gus let himself in the back (nobody locks anything here)'}${j.flaked?', a day late and not one bit sorry':''}.${did.length?` He ${andList(did)}.`:''}${extra} “Call me when the next thing breaks.”`);
  showTile('🧰','Gus came by',did.length?`Fixed: ${andList(ks.map(k=>UP_TASKS[k].ic))}`:'Firewood split','good');
  if(first)meet('gus','Gus, the island handyman','fixed up your place');else friendPts('gus',2);
}
function gusModal(){
  const sure=typeof gusFirstCall==='function'&&gusFirstCall(); // reputation 3+: first call, next day, no no-shows (15-economy.js)
  const rate=gusRate(),book=(pay,how)=>{pay();S.t+=10;phoneTick();const days=sure?1:1+(Math.random()<0.5?1:0);
    UP().jobs.push({k:'gus',due:(day()+days)*1440+(sure?540:600)+Math.floor(Math.random()*(sure?60:120)),sure});
    say(sure?`📱 You call Gus. ${how} “For you? Tomorrow morning. First thing. Well, first-ish.”`:`📱 You call Gus. ${how} “I’ll swing by ${days===1?'tomorrow':'the day after tomorrow'}, late morning. Maybe.” Island time.`);afterAction()};
  modal('🧰 Call Gus, the island handyman',`<p>Gus has fixed half the houses on the island and lives on it, so the ferry doesn’t matter. He’ll do the 3 jobs that need it most.</p>${sure?'<p>💛 <b>First call:</b> you’ve helped enough neighbors that Gus comes tomorrow morning, and he actually shows up.</p>':'<p>He works on island time: tomorrow or the day after, late morning. Probably.</p>'}`,[
    {l:`💵 Cash — $${rate}`,s:rate<90?'The friends rate.':'His going rate.',dis:S.money<rate,fn:()=>book(()=>money(-rate),`$${rate}, cash on arrival. You set it aside.`)},
    {l:'🛢️ 5 gallons of gas from your shed',s:S.homeGas>=5?`You have ${S.homeGas} gal. On this island, gas is better than money.`:'You need 5 gal in the shed.',dis:S.homeGas<5,fn:()=>book(()=>{S.homeGas=Math.round((S.homeGas-5)*10)/10},'You offer 5 gallons of gas. A long pause. “Deal.”')},
    {l:'🥫 2 days of groceries',s:S.pantry>=3?`Pantry: ${S.pantry} days. He takes 2.`:'You need at least 3 days in the pantry.',dis:S.pantry<3,fn:()=>book(()=>{S.pantry-=2},'You offer two days of groceries. “Do you have the good coffee?” You do.')},
    {l:'Never mind',fn:()=>{}}]);
}
function postModal(){
  const ks=upPressing(4);
  const go=k=>postWhenModal(k);
  modal('📣 Post asking for help',`<p>${COMM_NAME[0].toUpperCase()+COMM_NAME.slice(1)}: lost dogs, ferry complaints, free firewood, and neighbors who show up. Replies usually come in a few hours.</p><p style="font-size:13px;color:var(--mute)">Next you pick a day and time for someone to come by. Be home then: standing up a neighbor costs a little reputation. The better known you are for helping others, the better your odds.</p>`,
    ks.map(k=>({l:`${UP_TASKS[k].ic} ${UP_TASKS[k].d}`,s:UP_TASKS[k].sc(UP())>=1?'Due now.':'Coming due.',fn:()=>go(k)}))
      .concat([{l:'🏠 General help around the house',s:'Chores, a tidy-up, a second pair of hands.',fn:()=>go('general')},{l:'Never mind',fn:()=>{}}]));
}
// ---- scheduled help: you pick the day and time; a helper comes then (if anyone answers) ----
const POST_TIMES=[540,780,1020],POST_GRACE=30,POST_MISS=-3;   // 9 AM, 1 PM, 5 PM; they wait half an hour
function postOdds(){const fr=Object.keys(S.friends).length;return Math.max(0.05,Math.min(0.75,0.25+0.08*(Math.max(0,S.rep||0)/7.5+fr)+Math.min(0,S.rep||0)/400-0.1*(typeof repEnemies==='function'?repEnemies().length:0)))}
function postSlots(){const out=[],now=S.t,last=S.mode==='month'?day()+2:Math.min(6,day()+2);
  for(let d=day();d<=last;d++)for(const m of POST_TIMES){const at=d*1440+m;if(at>=now+120)out.push(at)}return out.slice(0,6)}
const postWhen=at=>{const d=Math.floor(at/1440);return `${d===day()?'Today':d===day()+1?'Tomorrow':DAYS[d%7]} ${fmt(at%1440)}`};
function postWhenModal(k){const sl=postSlots(),what=k==='general'?'help around the house':UP_TASKS[k].d.toLowerCase();
  if(!sl.length)return modal('📣 No good times left','<p>There’s no time left this week for someone to come by. Post again tomorrow, or next week.</p>',[{l:'OK',fn:()=>{}}]);
  modal('📣 When should they come?',`<p>Pick a time for someone to come by for ${what}. You need to be home: they’ll wait half an hour.</p>`,
    sl.map(at=>({l:postWhen(at),s:at%1440<720?'Morning':at%1440<960?'Afternoon':'Late afternoon',fn:()=>{S.t+=10;phoneTick();COMM().post=dayKey();
      UP().jobs.push({k:'post',due:at+POST_GRACE,at,task:k,sched:true});
      say(`📣 You post in ${COMM_NAME}: “${k==='general'?'Anyone have a couple of hours to help around the house? Will pay in cookies.':`Anyone able to help? ${UP_TASKS[k].d}. I can’t get to it.`} ${postWhen(at)} works for me.” Be home then.`);
      try{showTile('📣','Help scheduled',`${postWhen(at)} at your place. Be home.`,'info')}catch(e){}afterAction()}})).concat([{l:'Never mind',fn:()=>{}}]));
}
// cancel a scheduled visit: free with 2+ hours' notice, reputation −2 if it's last-minute
function postCancel(){const j=upJob('post');if(!j||!j.sched||!phoneCan())return;const late=S.t>=j.at-120;
  UP().jobs=UP().jobs.filter(x=>x!==j);S.t+=5;phoneTick();
  say(`📣 You edit your post: “All set, no need to come by ${postWhen(j.at)}. Thanks everyone!”${late?' Two people were already putting their boots on.':''}`);
  if(late&&typeof repAdd==='function')repAdd(-2,'cancelled on a neighbor at the last minute');afterAction()}
// at the time: home → the usual replies; out → whoever came finds an empty house (if anybody came)
function postArrive(j){
  if(!j.sched||S.loc==='home')return postReplies(j);
  if(Math.random()<postOdds()){adj('stress',2);
    if(typeof repAdd==='function')repAdd(POST_MISS,'stood up a neighbor who came to help');
    say(`📣 Someone from ${COMM_NAME} drove out at ${fmt((j.at||j.due)%1440)}, knocked, waited half an hour and left. The comment under your post: “Came by. Nobody home. 🤷”`);
    try{showTile('📣','You weren’t home','A neighbor came to help · reputation −3','bad')}catch(e){}}
  else say(`📣 Nobody answered your help post for ${fmt((j.at||j.due)%1440)}. Just as well: you weren’t home.`)}
function postReplies(j){
  const c=COMM(),p=postOdds(),gen=j.task==='general'||!UP_TASKS[j.task];
  const what=gen?'the chores':'the '+UP_TASKS[j.task].o,home=S.loc==='home';
  const fix=()=>{if(gen){upChoresDone();homeAdj(10)}else upFix([j.task])};
  const tile=(t,s,k)=>showTile('📣',t,s,k);
  if(Math.random()<p){const r=Math.random();
    if(r<0.55){fix();adj('stress',-3);say(`📣 A neighbor from ${COMM_NAME} answers your post and just shows up, gloves on. ${gen?'An hour later the dishes are done, the laundry’s folded and the floors are swept.':`They ${UP_TASKS[j.task].n}.`} They won’t take money. “Next time it’s you.”`);
      tile('A neighbor showed up to help',gen?'Chores done · Home +10':`Done: ${what}`,'good');if(Math.random()<0.4)newNeighbor()}
    else if(r<0.85){fix();if(home)S.t+=45;say(`📣 Nobody can come, but someone in ${COMM_NAME} leaves ${gen?'a carpet cleaner and a box of rags':'exactly the right tool'} on your porch. ${home?`45 minutes later, ${gen?'the house is clean':'it’s done'}.`:`You get to it ${gen?'when you’re home':'later'}.`} Return it clean or you’ll hear about it.`);
      tile('Someone lent you the tool',home?'Done · 45 minutes of your time':`Done: ${what}`,'good')}
    else {fix();adj('stress',2);say(`📣 Twelve replies in four minutes. Three people tag someone named Barb. Two argue about the 2019 ferry schedule. One actually comes over and does ${what}. Your phone won’t stop buzzing.`);
      tile('12 replies at once','One of them actually helped','good')}
  } else {const r=Math.random();
    if(r<0.4){adj('stress',1);say(`📣 Your post in ${COMM_NAME} gets two likes and a thumbs-up emoji. Nobody answers. Everyone must be on the mainland.`);tile('Nobody answered','Two likes, though','info')}
    else if(r<0.75){adj('stress',4);say(`📣 Your post turns into a 41-comment thread about the “right” way to do ${what}. Someone says it was better in the ’80s. Nobody offers to help.`);tile('A know-it-all comment thread','Stress +4 · nothing fixed','bad')}
    else {say(`📣 The only reply is a DM: “Hi neighbor! Have you heard about gutter guards? 🙂 Financing available.” It’s a guy from Puyallup.`);tile('Someone tried to sell you something','Nothing fixed','info')}
  }
}
function helpActions(a,d,m){
  const c=COMM(),dk=dayKey(),phoneOK=S.phone>0,gj=upJob('gus');
  a.push({cat:'yard',ic:'🧰',l:gj?'Gus is coming (probably)':'Call Gus from your 📱 phone (Phone → Island numbers)',due:false,s:gj?`He said ${fmtAbs(gj.due)}. Ish. He lives here, so the ferry can’t stop him.`:!phoneOK?'Your phone is dead.':`The island handyman fixes the 3 most pressing jobs. $${gusRate()} cash, 5 gal of gas, or 2 days of groceries.`,
    dis:true,fn:gusModal});
  const ok=m>=480&&m<1140;
  a.push({cat:'here',ic:'🤲',l:c.help===dk?'Helped a neighbor today ✓':'Help a neighbor from the community group',s:c.help===dk?`Island reputation: ${S.rep||0}.`:!ok?'People ask for help between 8 AM and 7 PM.':`1 hour. Someone always needs a hand. Island reputation: ${S.rep||0}. Stress −2.`,
    dis:c.help===dk||!ok,fn:()=>{S.t+=60;c.help=dk;repAdd(5,'helped a neighbor from the community group');adj('stress',-2);
      say(pick(['🤲 You help a guy from the group haul a chest freezer up his porch steps. He thanks you three times.','🤲 You spend an hour helping someone near Lake Josephine find their escaped chickens. You find four of five.','🤲 You hold a ladder while a neighbor clears her gutters, and hear the whole history of her septic system.','🤲 You drive a bag of groceries to an older neighbor who can’t make the ferry this week. She sends you home with jam.']));
      if(Math.random()<0.15)newNeighbor('you helped them out');afterAction()}});
}
TILE_META.work_party=['🛠️','A community work party','good'];
defEvent({id:'work_party',hook:'wake',priority:3,max:1,cond:()=>S.loc==='home'&&day()>=5&&(S.rep||0)>=20,chance:0.5,
  run(){const ks=upPressing(2),did=upFix(ks);if(!did.length)upChoresDone();adj('stress',-6);homeAdj(6);
    say(`🛠️ Three trucks pull into your driveway at 9 AM: neighbors from ${COMM_NAME}, with ladders, a thermos and a pie. “You’ve helped half of us. Our turn.” ${did.length?`By lunch they’ve ${andList(did)}.`:'By lunch the whole house is spotless.'}`)}});
defEvent({id:'leaky_roof',hook:'night',priority:3,max:2,cooldown:2,cond:ctx=>ctx.where==='home',
  chance:()=>{const U=UP();let c=U.moss>=80?0.18:U.moss>=60?0.07:0;if(homeTier()==='low')c+=0.05;return rainTonight()?c*2:c},
  run(ctx){homeAdj(-5);adj('stress',4);UP().damp+=1;ctx.notes.push('💧 Drip. Drip. The moss on the roof finally won: there’s a pot on the bedroom floor catching rain. (Treat the roof moss.)')}});
defEvent({id:'mice',hook:'night',priority:3,max:2,cooldown:3,cond:ctx=>ctx.where==='home'&&S.pantry>1&&UP().traps<=0,
  chance:()=>0.07+(homeTier()==='low'?0.1:0),
  run(ctx){S.pantry--;homeAdj(-3);adj('stress',3);ctx.notes.push('🐭 Fall means mice. Something got into the pantry overnight: a day of food goes in the trash. (Mouse traps at Home Depot.)')}});
defEvent({id:'mouse_caught',hook:'night',priority:1,max:2,cooldown:2,cond:ctx=>ctx.where==='home'&&UP().traps>0,chance:0.15,
  run(ctx){ctx.notes.push('🪤 Snap. The trap under the sink got one. The pantry is safe.')}});
defEvent({id:'black_mold',hook:'night',priority:4,max:1,cond:()=>!UP().mold,
  chance:()=>{const d=UP().damp;return d>=4?Math.min(0.4,0.08*(d-3)):0},
  run(ctx){const U=UP();U.mold=true;U.damp=2;adj('health',-5);adj('stress',6);homeAdj(-10);ctx.notes.push('🦠 Black spots in the corner of the bathroom ceiling and along the window frames. Condensation, every night, all winter. It has to be scrubbed before it gets worse.')}});
defEvent({id:'chimney_fire',hook:'night',priority:8,max:1,cond:ctx=>ctx.where==='home'&&UP().burned===dayKey(),
  chance:()=>{const U=UP();if(U.chimney<21)return 0;return Math.min(0.25,0.02+(U.chimney-21)*0.006+(U.ash>=4?0.04:0))},
  run(ctx){const U=UP();U.chimney=0;U.ash=0;adj('stress',18);adj('health',-4);homeAdj(-18);money(-150);
    ctx.notes.push('🔥 A roar like a freight train in the stovepipe at 1 AM: a chimney fire. You call 911. Pierce County Fire District #27 volunteers are in your driveway in eleven minutes, and they put it out. The creosote had been building for weeks. $150 for a chimney inspection before you can use the stove again.')}});
defEvent({id:'crawl_flood',hook:'night',priority:4,max:2,cooldown:2,cond:()=>rainTonight()&&UP().gutters>=60,chance:0.55,
  run(ctx){const U=UP();homeAdj(-12);adj('stress',8);U.damp+=3;ctx.notes.push('🌊 Heavy rain, gutters packed with fir needles: the water sheets off the roof and straight into the crawlspace. The house smells like a swamp. (Clear the gutters.)')}});
defEvent({id:'limb_roof',hook:'night',priority:7,max:1,cond:()=>stormNight(day())&&UP().limbs>=60,chance:0.5,
  run(ctx){const U=UP();U.limbs=10;U.moss=Math.max(U.moss,85);homeAdj(-20);adj('stress',12);money(-500);ctx.notes.push('🌲 CRACK. A big fir limb you meant to trim comes through the roof over the spare room. Tarp in the rain, then a $500 insurance deductible for the roofer.')}});
defEvent({id:'septic_backup',hook:'night',priority:6,max:1,cond:ctx=>ctx.where==='home'&&UP().septic>=95,chance:0.6,
  run(ctx){homeAdj(-25);adj('stress',15);adj('health',-3);ctx.notes.push('🚽 The septic tank is full, and the downstairs drains prove it. You do not want to know. (Schedule a pump-out.)')}});
defEvent({id:'clogged_drain',hook:'wake',priority:5,max:2,cooldown:2,cond:()=>S.loc==='home',
  chance:()=>({low:0.12,ok:0.03,high:0.01})[homeTier()]+(UP().septic>=75?0.1:0),
  run(){S.t+=20;adj('stress',4);homeAdj(-2);say(`🪠 The kitchen sink won’t drain. Twenty minutes with a plunger before coffee.${UP().septic>=75?' It might be the septic tank telling you something.':''}`)}});
defEvent({id:'well_quit',hook:'wake',priority:6,max:1,cond:()=>S.loc==='home'&&!powerOut(),chance:()=>UP().well>45?0.06:0,
  run(){S.t+=40;adj('stress',7);UP().well=20;say('🚰 No water, and the power’s on. The well pump lost its prime: 40 minutes in the pump house with a bucket and a wrench. (Service the well pump now and then.)')}});
defEvent({id:'friend_dropin',hook:'wake',priority:2,max:3,cooldown:2,cond:()=>S.loc==='home'&&Object.keys(S.friends).length>0&&day()>=5,
  chance:()=>({low:0.02,ok:0.08,high:0.18})[homeTier()],
  run(){const ids=Object.keys(S.friends),id=ids[Math.floor(Math.random()*ids.length)],f=S.friends[id];adj('stress',-6);friendPts(id,1);
    say(`🏡 ${f.name.split(',')[0]} swings by with muffins and stays for a cup of coffee. ${homeTier()==='high'?'“Your place always feels so nice.”':'It’s good to have company.'}`)}});
const FLAVOR_COZY=['🏡 You wake up in a clean, warm house. The woodstove ticks as it heats up. Cozy.','🏡 Sun through clean windows, the kettle on. The house feels like home.','🏡 Everything’s in its place. You actually find your keys on the first try.'];

