// ---------------- location actions ----------------
function actions(){
  const a=[],d=day(),m=tod(),loc=S.loc,side=L[loc].side;
  const open=isOpen(loc);
  if(L[loc].hours&&!open&&loc!=='work') a.push({ic:'🔒',l:'Closed right now',s:hoursTxt(loc),dis:true});
  if(loc==='home'){
    a.push({ic:'⏰',l:`Alarm: ${alarmTxt()}`,s:'Tap to change the time or switch between the clock and your phone.',fn:alarmModal});
    if(S.phone<90&&(!powerOut()||genReady()&&S.homeGas>0)) a.push({ic:'🔋',l:`Charge your phone (${S.phone}%)`,s:'45 minutes on the charger: +60%.',fn:()=>{S.t+=45;phoneTick();S.phone=Math.min(100,S.phone+60);say('🔋 Phone charged up.');afterAction()}});
    if(powerOut()&&genReady()&&S.homeGas>=1) a.push({ic:'🔌',l:'Run the generator for a while',s:`1 gallon from the shed (${S.homeGas} gal). Lights, water, heat. Stress −6.`,fn:()=>{if(genFails()){S.t+=20;adj('stress',4);say('🔌 You yank the pull cord until your shoulder aches. Nothing. It needs an oil change and a tune-up.');return afterAction()}S.homeGas=Math.round((S.homeGas-1)*10)/10;S.t+=60;phoneTick();S.phone=Math.min(100,S.phone+50);adj('stress',-6);say('🔌 The generator rumbles to life. Hot coffee, a shower and a charged phone.');afterAction()}});
    if(S.gen&&S.gen!=='home') a.push({ic:'🔌',l:'Your generator is still in the car',s:`Drive it home to install it. It’s in the ${S.cars.find(c=>c.id===S.gen)?.name||'car'}.`,dis:true});
    a.push({ic:'🛏️',l:m>=1080?'Go to bed':'Turn in early',s:`Ends the day. Eat 1 day of food (pantry: ${S.pantry}). Alarm: ${alarmTxt()}.`,cls:m>=1260?'primary':'',fn:()=>endDay('home')});
    const isl=S.cars.find(c=>c.id==='isl'&&c.loc==='home');
    if(isl){const src=isl.diesel?'homeDiesel':'homeGas';const g=Math.min(S[src],Math.round((isl.tank-isl.fuel)*10)/10);
      if(S[src]>0) a.push({ic:'⛽',l:`Fuel the ${isl.diesel?'truck':'car'} from the shed`,s:`${S[src]} gal stashed. ${isl.diesel?'':'Keep 3 gal for the generator if a storm’s coming.'}`,dis:g<=0,fn:()=>{S[src]=Math.round((S[src]-g)*10)/10;isl.fuel=Math.round((isl.fuel+g)*10)/10;S.t+=10;say(`You pour ${g} gallons into the tank in the dark, spilling only a little.`);afterAction()}});}
    if(!S.delivery&&d<6) a.push({ic:'📦',l:'Order island grocery delivery — $96',s:'3 days of food, delivered tomorrow afternoon if the ferry is running.',dis:!canEssential(96),fn:()=>{money(-96);S.delivery={due:(d+1)*1440+840,n:3};S.t+=10;say('You text the island delivery service. They’re doing a mainland run tomorrow and will bring 3 days of groceries.');afterAction()}});
    else if(S.delivery) a.push({ic:'📦',l:'Grocery delivery on its way',s:`Due ${fmtAbs(S.delivery.due)}`,dis:true});
    upkeepActions(a,d,m);helpActions(a,d,m);
    if(m<1260){const rn=U_REST(),gain=[8,5,3][rn]??1;a.push({ic:'☕',l:'Rest for an hour',s:`Coffee, rain, a book. Stress −${gain}.${rn>=2?' Diminishing returns: you’re getting restless.':''}`,fn:()=>{S.t+=60;adj('stress',-gain);S.rest={k:dayKey(),n:rn+1};say(rn>=3?'You stare at the ceiling. Resting more isn’t really helping now.':'You sit with coffee and watch the rain drip off the firs.');afterAction()}})}
  }
  if(loc==='aiDock'||loc==='stDock') dockActions(a,side);
  if(loc==='store') coopActions(a);
  if(loc==='store'){
    if(!S.coop.open) a.push({ic:'🪧',l:'Read the sign on the door',s:'“CLOSED. Thank you for 48 years.”',fn:()=>{S.t+=5;say('The hand-lettered sign is still taped to the glass. The gas pumps out front are bagged. The co-op flyer below it says “2027!” with three exclamation points.');afterAction()}});
    a.push({ic:'💬',l:'Check the bulletin board',s:'20 min. Stress −6. Ferry rumors, ride shares, gas talk.',fn:gossip});
  }
  if(loc==='food'&&d===2){
    const m2=tod();
    if(S.bingo.playing===d) a.push({ic:'🎱',l:'Bingo in progress…',s:'Eyes on your cards.',dis:true});
    else if(S.bingo.nights>0&&S.ev.history.some(h=>h.id==='bingo'&&Math.floor(h.t/1440)===d)) a.push({ic:'🎱',l:'Bingo’s over for tonight',s:'See you next Wednesday.',dis:true});
    else if(m2<1080) a.push({ic:'🎱',l:'Bingo tonight at 6:00 PM',s:`Hosted by the American Legion. Benefits the ${BINGO_FOR[S.week.bingo]}.`,dis:true});
    else if(m2<1200){
      if(S.bingo.reserved===d) a.push({ic:'🪧',l:'You have a reserved table',s:'Called ahead. Nice.',dis:true});
      a.push({ic:'🎱',l:'Play Bingo: 3 cards for $20',s:`American Legion Bingo. Proceeds go to the ${BINGO_FOR[S.week.bingo]}. Four games, about 2½ hours.`,cls:'primary',dis:S.money<20,fn:()=>playBingo(3,20)});
      a.push({ic:'🎱',l:'Play Bingo: 1 card for $10',s:'Keeping it casual.',dis:S.money<10,fn:()=>playBingo(1,10)});
    } else a.push({ic:'🎱',l:'Bingo already started',s:'Doors close at 8:00 PM.',dis:true});
  }
  if(loc==='food'&&open){
    a.push({ic:'🍔',l:'Takeout dinner — $27',s:S.ateOut===d?'Already got dinner tonight.':'Counts as tonight’s food, so the pantry is spared.',dis:S.ateOut===d||S.money<27,fn:()=>{S.ateOut=d;money(-27);S.t+=25;adj('stress',-4);say('A burger and fries in a paper sack. Not cheap, but it’s the only hot meal on the island you didn’t cook.');afterAction()}});
  }
  if(loc==='dale'){
    if(tradingLocked()) a.push({ic:'🌙',l:'Dale isn’t answering today',s:'Try again tomorrow. (Tutorial: Dale shows up from Tuesday.)',dis:true});
    else if(!open) a.push({ic:'🌙',l:'Dale’s porch light is off',s:'Come back between 7 AM and 9 PM.',dis:true});
    else {
      const stock=S.daleStock[d]??(S.daleStock[d]=Math.random()<0.25?0:3+Math.floor(Math.random()*8));
      const car=carHere();
      if(stock<=0) a.push({ic:'🚫',l:'“Fresh out.”',s:'Dale says he hasn’t made a run this week. Try tomorrow.',dis:true});
      else {
        if(car&&!car.diesel){const g=Math.min(3,stock,Math.floor((car.tank-car.fuel)*10)/10);
          a.push({ic:'⛽',l:`Buy ${g} gal into your tank — $${Math.round(g*DALE_PRICE)}`,s:`$${DALE_PRICE}/gal. Mainland price is $${GAS_PRICE}. He has ${stock} gal today.`,dis:g<=0||S.money<g*DALE_PRICE,fn:()=>{daleBuy(g,'tank')}});}
      }
    }
  }
  if(loc==='gas'&&open&&S.cigs<=0) a.push({ic:'🚬',l:'Buy a pack of cigarettes: $11',s:'You don’t smoke. But somebody on the island might ask.',dis:S.money<11,fn:()=>{money(-11);S.cigs=20;S.t+=5;say('🚬 A pack of cigarettes, for island diplomacy.');afterAction()}});
  if(loc==='gas'&&open){
    const car=carHere();
    if(car){const need=Math.round((car.tank-car.fuel)*10)/10,pr=car.diesel?DIESEL_PRICE:GAS_PRICE;
      if(car.id==='isl'&&S.battery==='weak') a.push({ic:'🔋',l:'Replace the car battery: $165',s:'No more morning jump-starts.',cls:'primary',dis:S.money<165,fn:()=>{money(-165);S.battery='ok';S.t+=35;say('🔋 New battery installed. The Subaru starts like it means it.');afterAction()}});
      a.push({ic:'⛽',l:`Fill up the ${car.diesel?'diesel truck':'tank'} — $${Math.round(need*pr)}`,s:`${need} gal at $${pr}/gal. Tank: ${car.fuel}/${car.tank}.`,cls:'primary',dis:need<0.5||S.money<need*pr,fn:()=>{money(-need*pr);car.fuel=car.tank;S.t+=10;say(`Full tank. ${need} gallons of ${car.diesel?'diesel':'gas'} for $${Math.round(need*pr)}. Islanders treat this as a sacred ritual now.`);afterAction()}});
    }
  }
  if(loc==='lake'){
    a.push({ic:'🦅',l:'Watch for eagles',s:'45 min. Stress −15 (once a day).',dis:S.eagleDay===d,fn:()=>{S.eagleDay=d;S.t+=45;adj('stress',-15);say('A bald eagle drops off a snag and skims the lake. For a minute nothing else matters. This is why you live here.');afterAction()}});
  }
  if(curJob()&&loc===curJob().loc) workActions(a,d,m);
  else if(loc==='work'||loc==='office'||loc==='whse') a.push({ic:'🏢',l:'You don’t work here',s:S.emp?`You work at ${L[curJob().loc].name}.`:'Not right now, anyway.',dis:true});
  jobActions(a,loc);
  favorActions(a,loc);
  lifeActions(a,loc);
  hhActions(a,loc);
  seasonActions(a,loc); // season
  cargoActions(a);
  fuelHelp(a);
  if(loc!=='home'&&m>=1140) a.push({ic:'⏰',l:`Alarm: ${alarmTxt()}`,s:!S.alarm.phone.on?'Only your plug-in clock is set, and it’s at home. Turn on your phone alarm if you might not make it back tonight.':`Phone alarm on · battery ${S.phone}%.`,fn:alarmModal});
  if(loc==='market'&&open){
    const car=!!carHere();
    [[1,19],[3,54],[5,88]].forEach(([n,c])=>a.push({ic:'🛒',l:`Buy ${n} day${n>1?'s':''} of groceries — $${c}`,s:`${S.carried} in bags${car?'':' · on foot you can carry 4 max'}`,dis:!canEssential(c)||(!car&&S.carried+n>4)||S.carried+n>14,fn:()=>{money(-c);S.carried+=n;S.stats.food+=n;S.t+=15+n*5;say(`Groceries: ${n} day${n>1?'s':''} for $${c}. Now get them home before they spoil.`);afterAction()}}));
  }
  if(loc==='warehouse'&&open){
    const car=!!carHere();
    a.push({ic:'📦',l:'Bulk haul: 8 days of food — $112',s:car?'Best value. You’ll need the trunk.':'You need a car for this.',dis:!car||S.money<112||S.carried+8>14,fn:()=>{money(-112);S.carried+=8;S.stats.food+=8;S.t+=50;say('A cart piled high: 48 eggs, a pallet of oatmeal, frozen everything. $112. Islanders shop like this for a reason.');afterAction()}});
    if(!S.cooler) a.push({ic:'🧊',l:'Buy a big cooler — $35',s:'Groceries won’t spoil if you get stranded.',dis:S.money<35,fn:()=>{money(-35);S.cooler=true;S.t+=10;say('You buy the cooler every islander keeps in their trunk. Now you’re a local.');afterAction()}});
  }
  if(loc==='depot'&&open){
    const car=carHere();
    if(!S.gen) a.push({ic:'🔌',l:'Buy a portable generator: $649',s:car?'3,500 W, runs on gasoline from the shed. Comes empty, so it’s fine on the ferry. Drive it home to install it.':'It weighs 100 lb. You need your car here to haul it.',cls:'primary',dis:!car||S.money<649,fn:()=>{money(-649);S.gen=car.id;S.t+=40;say(`🔌 A 3,500-watt generator, loaded into the ${car.name.split(' (')[0].toLowerCase()}. Drive it home, then keep gas stashed in the shed.`);afterAction()}});
    else a.push({ic:'✅',l:S.gen==='home'?'Generator installed at home':'Generator bought: in your car',s:'',dis:true});
    a.push({ic:'🪤',l:UP().trapsOwned?'Mouse traps: you have some':'Mouse traps (6-pack): $12',s:'Set them at home. Fall is mouse season on the island.',cat:'trade',dis:UP().trapsOwned||S.money<12,fn:()=>{money(-12);UP().trapsOwned=true;S.t+=5;say('🪤 Six snap traps. The old-fashioned kind that work.');afterAction()}});
    a.push({ic:'🔋',l:'Phone charger and cable: $19',s:'Charge at the terminal outlet or in the car.',dis:S.money<19||S.ev.flags.charger,fn:()=>{money(-19);S.ev.flags.charger=1;phoneTick();S.phone=Math.min(100,S.phone+25);S.t+=10;say('🔋 A spare charger. You plug in at the self-checkout while you wait.');afterAction()}});
  }
  if(loc==='pharmacy'&&open){
    a.push({ic:'💊',l:S.rx?'Prescription picked up ✓':'Pick up prescription — $15 copay',s:S.rx?'':d>=3?'Ready at the counter.':'Not ready until Thursday.',dis:S.rx||d<3||!canEssential(15),fn:()=>{money(-15);S.rx=true;S.t+=20;adj('stress',-4);say('Refill in hand. One less thing.');afterAction()}});
  }
  if(loc==='clinic'){
    if(!open) a.push({ic:'🔒',l:'Clinic closed',s:hoursTxt('clinic'),dis:true});
    else if(!apptActive()) a.push({ic:'📅',l:'No appointment this week',s:'Your follow-up is next week.',dis:true});
    else if(S.appt) a.push({ic:'✅',l:'Checkup done',s:'',dis:true});
    else if(d===APPT_DAY&&m>=840&&m<=885) a.push({ic:'🩺',l:'Check in for your 2:30 appointment',s:'1 hr · $40 copay',cls:'primary',fn:()=>{money(-40);S.appt=true;S.t+=60;adj('health',10);adj('stress',-5);say('“{{name}}?” the nurse calls. The doctor says your blood pressure is “interesting” and asks about your commute. You laugh a little too hard.');afterAction()}});
    else if(d===APPT_DAY&&m>885) a.push({ic:'❌',l:'You missed your 2:30 slot',s:'They can fit you in… in three weeks.',dis:true});
    else a.push({ic:'📅',l:`Your appointment: ${DAYS[APPT_DAY]} 2:30 PM`,s:'Check in between 2:00 and 2:45.',dis:true});
  }
  if(loc==='urgent'&&open){
    const inj=S.injury&&!S.injury.treated;
    a.push({ic:'🚑',l:inj?'Get your ankle looked at — $75':'Nothing urgent today',s:inj?'About 90 min including the wait.':'',dis:!inj||S.money<75,fn:()=>{money(-75);S.injury.treated=true;S.t+=90;adj('health',12);say('Bad sprain, not broken. You leave with a brace and instructions to “stay off it,” which is funny if you live on an island.');afterAction()}});
  }
  return a;
}
function dockActions(a,side){
  const car=carHere(), out=activeOutage(), m=tod();
  const kD=car?findNext(side,'drive',true):null, kW=findNext(side,'walk',true);
  const t=x=>x?(x.d>day()?`${DAYS[x.d].slice(0,3)} ${fmt(x.dep)}`:fmt(x.dep)):'none';
  if(out) a.push({ic:'🚨',l:'Ferry service suspended',s:`${out.cause}. Check the Ferry tab.`,dis:true});
  if(car&&car.fuel<0.1) a.push({ic:'⛽',l:'Can’t drive on: the tank is empty',s:'The deckhands won’t load a car that can’t drive itself off. Get it some gas first (see below).',dis:true});
  else if(car) a.push({ic:'🚗',l:'Drive on the next sailing',s:`${car.fuel<0.5?'⚠️ Running on fumes. ':''}Next you can make: ${t(kD)}${kD?' · in line by '+fmt(kD.dep-20):''}${side==='M'?' · '+fareTxt('drive'):''}`,cls:'primary',dis:!kD,fn:()=>waitFerry('drive')});
  a.push({ic:'🚶',l:'Walk on the next sailing',s:`Next: ${t(kW)}${kW&&kW.passenger?' (passenger-only boat)':''}${side==='M'?' · '+fareTxt('walk'):' · free'}${car?' · car stays here':''}`,cls:car?'':'primary',dis:!kW,fn:()=>waitFerry('walk')});
  if(out&&m>=420&&m<=1140) a.push({ic:'⛵',l:'Look for the sailboat water taxi',s:'A neighbor runs people across during outages. $20, maybe.',fn:waterTaxi});
  if(side==='M'){
    if(S.phone<90) a.push({ic:'🔋',l:`Charge your phone at the outlet (${S.phone}%)`,s:'The one by the vending machines. 30 minutes: +30%.',fn:()=>{S.t+=30;phoneTick();S.phone=Math.min(100,S.phone+30);say('🔋 You sit on the floor by the vending machines while your phone charges.');afterAction()}});
    if(!S.cars.some(c=>c.id==='beat')&&m>=360&&m<=1200) a.push({ic:'🚙',l:'Buy a mainland beater car — $700',s:'Lives in the terminal lot so you can walk on and still drive on this side.',dis:S.money<700,fn:()=>{money(-700);S.cars.push({id:'beat',name:'Mainland beater (2004 Corolla)',loc:'stDock',fuel:5,tank:12,diesel:false});S.t+=40;say('A guy from a classifieds ad meets you in the lot. 241,000 miles, one hubcap, runs great. Now you have a mainland car.');afterAction()}});
    const isl=S.cars.find(c=>c.id==='isl');
    if(isl&&isl.loc==='stDock'&&!isl.diesel&&m>=360&&m<=1200) a.push({ic:'🛻',l:'Trade the Subaru for an old diesel pickup — $1,400',s:'Diesel is the one fuel you can legally bring over in cans (two 5-gal DOT cans).',dis:S.money<1400,fn:()=>{money(-1400);Object.assign(isl,{name:'Island truck (old diesel pickup)',diesel:true,tank:20,fuel:Math.max(isl.fuel,4)});S.t+=60;say('You swap the Subaru for a 1999 diesel pickup that rattles like a can of bolts. But diesel can legally ride the ferry in DOT cans. You’ve beaten the system, kind of.');afterAction()}});
    const noBoatTonight=(!car||!kD||kD.d>day())&&(!kW||kW.d>day()||!canWalkCarry());
    if(m>=1260||noBoatTonight){
      a.push({ic:carHere()?'🚗':'🪑',l:carHere()?'Sleep in your car in the ferry lot':'Sleep on the bench outside the terminal',s:'The waiting room locks after the last boat. Ends the day.',cls:'danger',fn:()=>endDay('terminal')});
      a.push({ic:'🏨',l:'Get a motel in Lakewood — $115',s:'Ends the day.',cls:'danger',fn:()=>endDay('motel')});
    }
  }
}
function workActions(a,d,m){
  const J=curJob();if(!J) return;
  if(!jobStarted(d)){a.push({ic:'🗓️',l:'You start tomorrow',s:`${J.n}. First day: your next shift day.`,dis:true});return}
  if(!J.days.includes(d)){a.push({ic:'🌲',l:'You’re off today',s:`You work ${dayList(J.days)}.`,dis:true});return}
  if(S.worked[d]){a.push({ic:'✅',l:'Shift done for today',s:'Go home. Or shop. Probably shop.',dis:true});return}
  if(m<J.start-120){a.push({ic:'🔒',l:'Not open yet',s:`Your shift starts at ${fmt(J.start)}.`,dis:true});return}
  if(m>=J.start+240){a.push({ic:'🙅',l:'Too late to work today',s:'Your boss already marked you absent.',dis:true});return}
  const lateBy=Math.max(0,m-J.start);
  const lateTxt=lateBy===0?'On time.':lateBy<=30?`${lateBy} min late (job −4)`:`${lateBy} min late (job −10, docked pay)`;
  const pay=lateBy>30?Math.round(J.pay*(1-lateBy/480)):J.pay;
  const start=Math.max(m,J.start),mid=J.start+Math.round((J.end-J.start)*0.6);
  const doShift=(endM,payAmt,jobAdj,msg)=>{S.worked[d]=true;S.late[d]=lateBy;S.stats.workdays=(S.stats.workdays||0)+1;S.t=d*1440+endM;money(payAmt);adj('job',jobAdj+(lateBy===0?3:(typeof weatherExcuse==='function'&&weatherExcuse(d))?(lateBy<=30?0:-3):lateBy<=30?-4:-10)); /* season: ice-day lateness is forgiven */adj('stress',lateBy>0?6:2);say(msg+` +${$(payAmt)}.`);afterAction()};
  a.push({ic:'💼',l:`Work a full shift (until ${fmt(J.end)})`,s:`${J.n}. ${lateTxt} Pay ${$(pay)}.`,cls:'primary',fn:()=>doShift(J.end,pay,0,lateBy?'You slink in late and work through lunch to make up for it.':'You clock in on time. Your coworkers from the mainland have no idea what that took.')});
  if(start<mid&&J.loc!=='food') a.push({ic:'🩺',l:`Work until ${fmt(mid)}, then leave`,s:`Half day. ${d===APPT_DAY&&apptActive()?'For your doctor’s appointment (job −2).':'Boss won’t love it (job −8).'} Pay ${$(Math.round(pay*0.55))}.`,fn:()=>doShift(mid,Math.round(pay*0.55),d===APPT_DAY&&apptActive()?-2:-8,`You leave at ${fmt(mid)} with a mumbled explanation.`)});
}
// ---------------- job hunting ----------------
// fired from a job: off the listings for a week, then they'll see you again (with worse odds)
const JOB_COOLDOWN=7;
const jobFiredAt=k=>(S.firedAt&&S.firedAt[k]!=null)?S.firedAt[k]:-99;
const jobWasFired=k=>(S.firedFrom||[]).includes(k);
function jobOpenings(){return Object.keys(JOBS).filter(k=>k!==S.emp&&!(jobWasFired(k)&&dayKey()-jobFiredAt(k)<JOB_COOLDOWN))}
// a new job starts the day after you're hired
const jobStarted=i=>!(S.empStart>S.weekNo*7+i);
// interviews: the next weekday (or a Saturday at the Riv) this week; on a weekend in a month game, early next week
function interviewSlot(k){const J=JOBS[k],time=J.loc==='food'?900:600;for(let d=day()+1;d<=6;d++){if(J.days.includes(d)||d<5)return {day:d,time}}
  if(S.mode==='month'&&S.weekNo<3)for(let d=7;d<=8;d++){if(J.days.includes(d%7)||d%7<5)return {day:d,time}}return null}
const ivDay=I=>I.day>6?'next '+DAYS[I.day%7]:DAYS[I.day];
function jobModal(){
  const open=jobOpenings();
  modal('🔎 Job listings',`<p>${S.emp?`You work as: <b>${curJob().n}</b>. Switching means quitting.`:'You’re out of work. Rent doesn’t care.'}</p>${S.interview?`<p class="warn">You already have an interview: ${JOBS[S.interview.job].n}, ${ivDay(S.interview)} ${fmt(S.interview.time)}.</p>`:''}`,
    open.map(k=>{const J=JOBS[k],slot=interviewSlot(k);const shut=k==='riv'&&repVal()<=-30;if(shut)return {l:`${J.n}: ${$(J.pay)}/day`,s:'“The Riv’s not hiring. For you.” Word gets around on an island.',dis:true,fn:()=>{}};return {l:`${J.n}: ${$(J.pay)}/day`,s:slot?`${J.pitch}${jobWasFired(k)?' They remember firing you: lower odds.':''} Interview: ${ivDay(slot)} ${fmt(slot.time)} at ${L[J.loc].name}.`:`${J.pitch} No interview slots left this week.`,
      dis:!slot||!!S.interview,fn:()=>{S.interview={job:k,day:slot.day,time:slot.time,loc:J.loc};S.t+=15;say(`📝 You applied. Interview for <b>${J.n}</b>: ${ivDay(slot)} at ${fmt(slot.time)}, ${L[J.loc].name}.`);showTile('📝','Interview scheduled',`${ivDay(slot)} ${fmt(slot.time)} · ${L[J.loc].name}`,'info');afterAction()}}}).concat([{l:'Close',fn:()=>{}}]));
}
function jobActions(a,loc){
  const iv=S.interview,m=tod();
  if(iv&&iv.loc===loc&&iv.day===day()){
    if(m>=iv.time-45&&m<=iv.time+20) a.push({ic:'🤝',l:`Interview: ${JOBS[iv.job].n}`,s:'About 45 minutes. Be yourself. Or a calmer version.',cls:'primary',fn:()=>{
      S.t+=45;const odds=0.68+(S.friends.walt&&S.friends.walt.lvl>=2?0.15:0)-Math.max(0,S.stress-50)/200+(m<=iv.time?0.05:-0.1)+(iv.job==='riv'?(S.rep>=0?S.rep*0.003:S.rep*0.0075):0)-(jobWasFired(iv.job)?0.2:0);
      if(Math.random()<odds){const old=S.emp;S.emp=iv.job;S.job=60;S.empStart=dayKey()+1;S.interview=null;adj('stress',-8);say(`🎉 You got the job: <b>${JOBS[S.emp].n}</b>! ${old?'You give notice at your old job. ':''}You start tomorrow, or on your next shift day after that.`);showTile('🎉','You’re hired!',JOBS[S.emp].n,'good')}
      else{S.interview=null;adj('stress',8);say('😞 “We went with someone with more experience.” Back to the listings.');showTile('😞','Didn’t get the job',JOBS[iv.job].n,'bad')}
      afterAction()}});
    else if(m<iv.time-45) a.push({ic:'📅',l:`Interview here at ${fmt(iv.time)}`,s:'Check in up to 45 minutes early.',dis:true});
  }
  const canPhone=S.phone>0;
  if(!S.emp) a.push({ic:'🔎',l:'Look for a job',s:canPhone?'Browse openings on your phone and set up an interview.':'Your phone is dead. Try the bulletin board at the old store.',cls:loc==='home'?'primary':'',dis:!canPhone&&loc!=='store',fn:jobModal});
  else if(loc==='home'||loc==='store') a.push({ic:'🔎',l:'Browse job listings',s:'Maybe there’s something better out there.',fn:jobModal});
}
function weekRollover(notes){
  const wk=S.weekNo;S.weekNo++;
  notes.push(`📅 <b>Week ${wk+1} is done.</b> ${4-S.weekNo} to go. Co-op fund: ${$(S.coop.you+S.coop.town)} of ${$(COOP_GOAL)}.`);
  const W=10080;if(S.power){S.power.start-=W;S.power.end-=W}if(S.delivery)S.delivery.due-=W;UP().jobs.forEach(j=>j.due-=W);
  Object.assign(S,{worked:{},late:{},appt:false,apptMissed:false,rx:false,injuryRolled:false,storeStock:{},daleStock:{},ateOut:-1,eagleDay:-1,gossipDay:-1,priority:false});
  if(S.injury&&S.injury.treated)S.injury=null;
  S.ev.past=(S.ev.past||[]).concat(S.ev.history.map(h=>({id:h.id,w:wk})));S.ev.history=[];S.ev.last={};S.ev.count={};S.ev.flags={};
  Object.assign(S.bingo,{reserved:-1,playing:-1,order:null,delay:0});
  if(S.interview){if(S.interview.day>6)S.interview.day-=7;else S.interview=null}
  S.quests=(S.quests||[]).filter(q=>!q.done&&q.due>=7).map(q=>Object.assign(q,{due:q.due-7}));
  S.week=genWeek(S.diff);PLAN={to:null,by:null,off:0};
}
function coopCheck(notes){
  if(!S.coop.open&&S.coop.you+S.coop.town>=COOP_GOAL){S.coop.open=true;S.coop.openedWeek=S.weekNo;syncCoop();
    const msg='🎉 <b>The co-op hit its goal!</b> The old General Store reopens as the <b>Anderson Island Food Co-op</b>: groceries and gas pumps, run by islanders.';
    if(notes)notes.push(msg);else say(msg);showTile('🎉','The co-op is open!','Groceries and gas on the island again','good')}
}
const STORE_CLOSED={name:L.store.name,desc:L.store.desc};
function syncCoop(){if(S&&S.coop&&S.coop.open){L.store.name='AI Food Co-op';L.store.ic='🏪';L.store.desc='Open! Groceries and gas, run by islanders';L.store.hours=()=>[480,1200]}else{L.store.name=STORE_CLOSED.name;L.store.ic='🏚️';L.store.desc=STORE_CLOSED.desc;delete L.store.hours}}
function coopActions(a){
  const total=S.coop.you+S.coop.town;
  if(!S.coop.open){
    a.push({ic:'🏪',l:`Pledge to the co-op fund (${$(total)} of ${$(COOP_GOAL)})`,s:`You’ve pledged ${$(S.coop.you)}. Neighbors chip in every night. Reopening brings groceries and gas back to the island.`,cat:'trade',dis:S.money<25,fn:()=>{
      const opts=[25,100,250].filter(v=>S.money>=v);
      modal('🏪 Anderson Island Food Co-op',`<p>The fund is at <b>${$(total)}</b> of <b>${$(COOP_GOAL)}</b>. Every dollar gets the store and its pumps closer to reopening.</p>`,opts.map(v=>({l:`Pledge ${$(v)}`,fn:()=>{money(-v);S.coop.you+=v;adj('stress',-2);repCoop();say(`🏪 You pledge ${$(v)} to the co-op. Someone adds a star next to your name on the board.`);coopCheck();afterAction()}})).concat([{l:'Not now',fn:()=>{}}]))}});
  } else {
    const car=carHere();
    a.push({ic:'🥫',l:'Buy groceries: 3 days for $60',s:'Co-op prices: not mainland cheap, but no ferry.',cat:'trade',dis:!canEssential(60)||(!car&&S.carried+3>4),fn:()=>{money(-60);S.carried+=3;S.stats.food+=3;S.t+=15;say('🥫 Three days of groceries from the co-op. A volunteer bags them and asks about your week.');afterAction()}});
    if(car&&!car.diesel){const need=Math.round((car.tank-car.fuel)*10)/10;a.push({ic:'⛽',l:`Fill up at the co-op pumps: $${Math.round(need*5.29)}`,s:`$5.29/gal. Gas on the island again!`,cat:'fuel',dis:need<0.5||S.money<need*5.29,fn:()=>{money(-need*5.29);car.fuel=car.tank;S.t+=10;say('⛽ You fill up on the island. On the island! People are taking photos of the pumps.');afterAction()}})}
  }
}
function apptActive(){return S.mode!=='month'||S.weekNo%2===0}
function fuelHelp(a){
  const car=carHere();if(!car||car.fuel>=1.5||S.loc==='gas')return;
  const side=L[S.loc].side,addFuel=(g,msg,tile)=>{car.fuel=Math.min(car.tank,Math.round((car.fuel+g)*10)/10);say(msg);showTile('⛽',tile,`+${g} gal · tank ${car.fuel}/${car.tank}`,'good');afterAction()};
  if(side==='M'){
    a.push({ic:'🚚',l:'Call a mobile fuel delivery: $85',s:S.phone>0?`3 gallons of ${car.diesel?'diesel':'gas'} brought to your car. About 45 minutes. Mainland only.`:'Your phone is dead.',dis:S.phone<=0||S.money<85,fn:()=>{
      money(-85);S.t+=45;phoneTick();adj('stress',3);addFuel(3,'🚚 A pickup with a fuel tank in the bed finds you. “Ran dry, huh? Happens a lot down here.” 3 gallons, $85.','Mobile fuel delivery')}});
    return;
  }
  if(S.loc==='home') return;
  if(S.friends.sam) a.push({ic:'📞',l:'Text Sam to bring gas',s:S.phone<=0?'Your phone is dead.':S.homeGas>=5?`Sam grabs a can from your shed (${S.homeGas} gal stashed). About 30 minutes.`:'Your shed is empty, so Sam brings some of their own. $30. About 30 minutes.',dis:S.phone<=0||(S.homeGas<5&&S.money<30)||car.diesel&&S.homeDiesel<5,fn:()=>{
    S.t+=30;phoneTick();adj('stress',-2);
    if(car.diesel){S.homeDiesel-=5;return addFuel(5,'📞 Sam shows up with a diesel can from your shed. “You owe me a coffee.”','Sam brought diesel')}
    if(S.homeGas>=5){S.homeGas=Math.round((S.homeGas-5)*10)/10;addFuel(5,'📞 Sam pulls up with a can from your shed and a thermos. “You owe me a coffee.”','Sam brought gas from your shed')}
    else{money(-30);addFuel(5,'📞 Sam pulls up with a can from their own garage. You pay them back $30.','Sam brought gas')}}});
  if(S.friends.fred&&!car.diesel) a.push({ic:'🩴',l:'Ask Pajama Fred for help',s:S.phone>0?'He knows a guy. $65 for 5 gallons. About 50 minutes.':'Your phone is dead.',dis:S.phone<=0||S.money<65,fn:()=>{
    money(-65);S.t+=50;phoneTick();addFuel(5,'🩴 Fred shuffles up in his slippers carrying a red can. “From a friend. Don’t ask.” (It smells like Dale’s.)','Pajama Fred brought gas')}});
  if(!S.friends.sam&&!S.friends.fred) a.push({ic:'⛽',l:'No one to call yet',s:'Walk to Dale’s for a can, or home to fill one from your shed. Island friends can help with this.',dis:true});
}
function cargoActions(a){
  const c=S.cargo,car=carHere(),home=S.loc==='home';
  if(car&&!car.diesel&&c.gas>0&&car.fuel<=car.tank-1) a.push({ic:'⛽',l:'Pour a gas can into the tank',s:`+5 gal. Tank ${car.fuel}/${car.tank}. ${c.gas} can${c.gas>1?'s':''} in your cargo.`,fn:()=>{c.gas--;car.fuel=Math.min(car.tank,Math.round((car.fuel+5)*10)/10);S.t+=8;say('Glug, glug. You pour 5 gallons in and try not to spill on your shoes.');afterAction()}});
  if(car&&car.diesel&&c.diesel>0&&car.fuel<=car.tank-1) a.push({ic:'⛽',l:'Pour a diesel can into the truck',s:`+5 gal. Tank ${car.fuel}/${car.tank}.`,fn:()=>{c.diesel--;car.fuel=Math.min(car.tank,Math.round((car.fuel+5)*10)/10);S.t+=8;say('Diesel in. The truck sounds grateful, or maybe that’s just the rattle.');afterAction()}});
  if(c.med>0&&S.injury&&!S.injury.treated) a.push({ic:'🩹',l:'Use medical supplies on your ankle',s:'Wrap it, ice it, pain meds. Stops it from getting worse.',fn:()=>{c.med--;S.injury.treated=true;adj('health',5);S.t+=20;say('You wrap the ankle tight and take something for the pain. Not a doctor, but it’ll hold.');afterAction()}});
  if(!home) return;
  if(c.food>0) a.push({ic:'🥫',l:`Put a food case in the pantry (${c.food} in cargo)`,s:'+3 days of food at home.',fn:()=>{c.food--;S.pantry+=3;S.t+=5;say('Three days of food, stacked in the pantry.');afterAction()}});
  if(c.med>0&&(!S.injury||S.injury.treated)) a.push({ic:'🩹',l:`Use medical supplies (${c.med} in cargo)`,s:'Health +6.',dis:S.health>=100,fn:()=>{c.med--;adj('health',6);S.t+=10;say('Vitamins, cold medicine and a real bandage on that cut you’ve been ignoring.');afterAction()}});
  if(S.homeGas>=5&&cargoN()+S.carried<CAP_FOOT) a.push({ic:'🛢️',l:'Fill a gas can from the shed to take with you',s:`5 of your ${S.homeGas} gal. Carry it to a car that ran dry. (Still banned on the ferry!)`,fn:()=>{S.homeGas=Math.round((S.homeGas-5)*10)/10;c.gas++;S.t+=5;say('🛢️ You fill a can from the shed. It sloshes the whole way.');afterAction()}});
  if(c.gas>0) a.push({ic:'🛢️',l:`Stash a gas can in the shed (${c.gas} in cargo)`,s:`+5 gal of fuel at home (${S.homeGas} gal now). ${genReady()?'Powers the generator in an outage.':'For a generator, if you buy one.'}`,fn:()=>{c.gas--;S.homeGas+=5;S.t+=5;say('5 gallons of gas into the shed, far from the woodstove.');afterAction()}});
  if(S.homeGas>=5&&cargoN()+S.carried<capNow()) a.push({ic:'🛢️',l:`Take a gas can out of the shed (${S.homeGas} gal stashed)`,s:'5 gal to carry. For a car that ran dry somewhere, or to sell.',fn:()=>{S.homeGas=Math.round((S.homeGas-5)*10)/10;c.gas++;S.t+=5;say('🛢️ You fill a can from the shed stash.');afterAction()}});
  if(c.diesel>0) a.push({ic:'🟨',l:`Store a diesel can in the shed (${c.diesel} in cargo)`,s:'+5 gal of diesel.',fn:()=>{c.diesel--;S.homeDiesel+=5;S.t+=5;say('5 gallons of diesel into the shed.');afterAction()}});
}
function trade(g,dir){
  const side=L[S.loc].side,pr=price(g,side),mk=MARKETS[S.loc];
  if(dir==='buy'){money(-pr.buy);S.cargo[g]++;S.stats.bought+=pr.buy}else{money(pr.sell);S.cargo[g]--;S.stats.sold+=pr.sell;if(side==='I'&&(g==='food'||g==='med'))achUnlock('supplier')}
  S.t+=g==='drugs'?15:5;
  if(g==='drugs'){
    adj('stress',dir==='sell'?8:6);
    if(Math.random()<(mk.sting||0)+0.03*S.stats.drugRuns+(taskForce()?0.1:0)) return arrest(S.loc==='dale'?'outside Dale’s place':'in a Lakewood motel parking lot',false);
  }
  const verb=dir==='buy'?'Bought':'Sold';
  say(`${GOODS[g].ic} ${verb} 1 ${GOODS[g].n.toLowerCase()} for ${$(dir==='buy'?pr.buy:pr.sell)}.`);
  afterAction();
}
window.TRADE=(g,dir)=>{uiNarr=[];trade(g,dir)};
function marketView(){
  const mk=MARKETS[S.loc];if(!mk)return '';
  if(tradingLocked()) return `<div class="sect">Trade</div><div class="news">🔒 Trading opens on Tuesday, once you’ve learned the ropes. (Turn off tutorial tips in ⚙️ Settings to unlock everything now.)</div>`;
  const side=L[S.loc].side,m=tod(),open=m>=mk.hours[0]&&m<mk.hours[1];
  let h=`<div class="sect">Trade: ${mk.who}</div>`;
  const n=S.week.news[day()];if(n>=0) h+=`<div class="news">📰 ${NEWS[n].t}</div>`;
  if(side==='I'&&activeOutage()) h+=`<div class="news">🚨 Ferry’s down: island prices for food, medicine and fuel are up 50%.</div>`;
  if(!open) return h+`<div class="news">🔒 Not trading right now. Hours: ${fmt(mk.hours[0])}–${fmt(mk.hours[1])}.</div>`;
  const cap=capNow(),load=cargoN()+S.carried;
  h+=`<div class="mkt">`;
  for(const g of mk.goods){const G=GOODS[g],pr=price(g,side),other=price(g,side==='I'?'M':'I');
    const badge=G.law==='ok'?'<span class="badge ok">Legal</span>':G.law==='lim'?'<span class="badge lim">Ferry limit 2</span>':G.law==='no-ferry'?'<span class="badge no">Not on ferry</span>':'<span class="badge no">Illegal</span>';
    h+=`<div class="mrow"><span class="ic">${G.ic}</span><div class="mi"><b>${G.n}${badge}</b><span>${G.d}</span><div class="px">Buy <b>${$(pr.buy)}</b> · Sell <b>${$(pr.sell)}</b> · ${side==='I'?'mainland':'island'} ~${$(other.buy)}</div></div>
    <div class="mbtns"><button onclick="TRADE('${g}','sell')" ${S.cargo[g]<=0?'disabled':''}>Sell</button><span class="own">${S.cargo[g]}</span><button class="buy" onclick="TRADE('${g}','buy')" ${S.money<pr.buy||load>=cap?'disabled':''}>Buy</button></div></div>`}
  h+=`</div><div style="font-size:12px;color:var(--mute);margin:-2px 2px 6px">Cargo: ${load}/${cap} ${carHere()?'(car)':'(on foot)'}. Groceries in hand count too.</div>`;
  return h;
}
function daleBuy(g,how){
  money(-(g*DALE_PRICE+(how==='can'?10:0)));S.daleStock[day()]-=g;S.stats.daleGal+=g;S.t+=15;
  const lines=['“Cash only. And you didn’t get it from me.”','Dale pours it from a jerry can that smells like a lawnmower. He won’t say how it got here.','“Price went up. Risk premium.” He taps his nose.','Dale’s dog watches you the whole time like you’re a narc.'];
  say('🛢️ '+lines[Math.floor(Math.random()*lines.length)]);
  if(how==='tank'){const c=carHere();c.fuel=Math.round((c.fuel+g)*10)/10;say(`+${g} gallons in the tank at $${DALE_PRICE}/gal.`)}

  if(Math.random()<0.12){adj('stress',5);say('A sheriff’s deputy’s SUV rolls slowly past Dale’s driveway. Everyone suddenly gets very interested in the sky.')}
  afterAction();
}
function gossip(){
  S.t+=20;adj('stress',-6);
  const soon=S.week.b.find(b=>b.start>S.t&&b.start<S.t+2160);
  if(soon&&Math.random()<0.8) say(`At the counter: “Deckhand told my cousin the boat’s been making a funny noise. Wouldn’t count on it ${Math.floor(soon.start/1440)===day()?'later today':'tomorrow'}.” Noted.`);
  else say('At the counter: '+GOSSIP[Math.floor(Math.random()*GOSSIP.length)]);
  afterAction();
}

