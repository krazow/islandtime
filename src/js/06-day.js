// ---------------- day cycle ----------------
function stash(){

}
function processTimed(){
  phoneTimed();
  if(S.power&&S.t>=S.power.end){S.power=null;if(L[S.loc].side==='I')say('💡 The power’s back on. Every appliance in the house beeps at once.')}
  for(const j of UP().jobs.slice()){
    if(S.t<j.due) continue;
    const out=!(UP_JOBS[j.k]||{}).island&&S.week.b.find(b=>j.due>=b.start&&j.due<b.end); // island jobs (Gus, the community group) don’t ride the ferry
    if(out){j.due=out.end+90;if(!j.warned){j.warned=true;say(`🚚 The ${UP_JOBS[j.k].who} is stuck in Steilacoom. The ferry’s down. They’ll come over when it’s running.`)}continue}
    UP().jobs=UP().jobs.filter(x=>x!==j);if(!UP_JOBS[j.k])continue;UP_JOBS[j.k].done(j);if(UP_JOBS[j.k].msg)say(UP_JOBS[j.k].msg);
  }
  const dl=S.delivery;
  if(dl&&S.t>=dl.due){
    const out=S.week.b.find(b=>dl.due>=b.start&&dl.due<b.end);
    if(out){dl.due=out.end+90;if(!dl.warned){dl.warned=true;say('📦 Your grocery delivery is stuck on the mainland. The ferry’s down.');}}
    else {S.pantry+=dl.n;S.delivery=null;say(`📦 Your island grocery delivery made it to the porch: +${dl.n} days of food.`);}
  }
}
// Is this week's gale known yet? The morning it hits (the island hears then), or a day early with 🌦️ Tides & Weather.
function stormKnown(){const st=S.week.storm,d=day();if(!st||S.t>=st.end)return false;
  return st.day===d||(st.day===d+1&&typeof phoneInstalled==='function'&&phoneInstalled('weather'))}
function stormNight(d){const st=S.week.storm;if(!st)return false;const n=d*1440+1380;return n>=st.start&&n<st.end}
function startDay(){
  const d=day();
  S.daily={money:S.money,waited:S.stats.waited,cross:S.stats.crossings,fares:S.stats.fares,ev:S.ev.history.length,day:d};
  if(S.week.storm&&S.week.storm.day===d) say(`🌬️ Gale warning for this afternoon and tonight. Expect the ferry to stop and the island’s power to go out. ${genReady()?(S.homeGas>=3?'Your generator is fueled and ready.':'Your generator needs at least 3 gallons in the shed…'):'No generator? Tonight might be cold.'}`);
  if(S.week.fog[d]) say(`🌫️ Fog advisory: expect morning sailings to run ${S.week.fog[d]}+ minutes late.`);
  if(d===0&&S.diff==='hard') say(seasonId()==='winter'?'🔥 <b>Ferry Hell:</b> the boat is a wreck, the lines are long and money is tight. Good luck.':'🔥 <b>Ferry Hell:</b> summer tourists with kayaks on their roofs are lined up for every boat. Good luck.'); // season
  if(d===0&&S.diff==='easy') say('🌲 <b>Islander mode:</b> a quieter week on the water. A good time to learn the ropes.');
  if(d===0) say('⛽ Monday fuel run: with a fuel tanker aboard, federal hazmat rules let only crew and the tanker driver ride. The 9:35 AM from Steilacoom and the 11:30 AM from the island are canceled.');
  if(S.loc==='home'&&!S.injuryRolled&&d>=1&&d<=4&&Math.random()<(S.mode==='month'&&S.weekNo>0?0.12:(d===4?1:0.3))){ // later weeks of a month: an occasional mishap, not a weekly certainty
    S.injuryRolled=true;
    if(Math.random()<0.7){S.injury={day:d,treated:false};adj('health',-15);
      say(seasonInjury()||'🤕 Hauling firewood in the dark, you slip on wet cedar needles. Your ankle swells up like a grapefruit. There’s no clinic on the island. You need Urgent Care on the mainland.');} // season
  }
  seasonMorning(d); // season
  if(S.week.news[d]>=0) say('📰 '+NEWS[S.week.news[d]].t);
  if(S.loc==='home') fireHook('wake',{});
  S.ev.force=[];
  if(d>0) say(S.loc==='home'&&homeTier()==='high'&&Math.random()<0.5?(F=>F[Math.floor(Math.random()*F.length)])(seasonFlavor(true)):(F=>F[Math.floor(Math.random()*F.length)])(seasonFlavor())); // season
}
function dailyCard(d){
  const D=S.daily;if(!D||D.day!==d) return '';
  const dm=Math.round(S.money-D.money),w=S.stats.waited-D.waited,c=S.stats.crossings-D.cross;
  const evs=S.ev.history.slice(D.ev).map(h=>(TILE_META[h.id]||['📍'])[0]);
  const parts=[`🏠 ${S.home}`,`💵 ${dm>=0?'+':'−'}$${Math.abs(dm)}`,`⛴️ ${c} crossing${c===1?'':'s'}`,`⏳ ${w} min waiting for boats`];
  if(d<5) parts.push(S.worked[d]?(S.late[d]?`💼 worked (${S.late[d]} min late)`:'💼 worked, on time'):'💼 missed work');
  return `<div class="today"><b>${DAYS[d]} in review</b>${parts.join(' · ')}${evs.length?`<br>Island events: ${evs.join(' ')}`:''}</div>`;
}
function endDay(where){
  processTimed();const dayCard=dailyCard(day());
  const d=day(), notes=[];achCheck({where});
  if(where==='home') stash();
  // island events while you sleep (random outages etc.)
  upkeepNight(where,notes,d);
  const nctx={where,notes};fireHook('night',nctx);
  seasonNight(where,notes,d); // season
  if(S.ev.flags.genFail===d&&!stormNight(d)&&!notes.some(n=>n.includes('generator coughs')))notes.push('🔌 The generator coughs, sputters and dies. It hasn’t been serviced in weeks.');
  // storm power outage
  if(stormNight(d)){
    S.stats.outageNights++;S.power={start:d*1440+1380,end:(d+1)*1440+330+240,cause:'the gale'};
    if(runGenerator(where,3)){notes.push('⚡ The wind knocks out the island’s power. Your generator burns 3 gallons from the shed keeping the fridge, the heat and the well pump going.');chain('gen_saves','storm')}
    else {if(S.pantry>0){S.pantry--;UP().fridge=true;}if(S.ev.flags.genFail===d)notes.push('🔌 The generator coughs, sputters and dies. It hasn’t been serviced in weeks.');adj('health',-6);adj('stress',8);notes.push(where!=='home'?'⚡ The island’s power went out while you were away. A day of food spoiled in your dead fridge.':!genReady()?'⚡ The power goes out and you don’t own a generator. The house gets cold and a day of food spoils in the fridge.':'⚡ The power goes out and there isn’t enough gas in the shed for the generator. The house gets cold and a day of food spoils in the fridge.')}
  }
  if(stormNight(d)&&Math.random()<0.8){EV_RUNNING='storm';outageChain(where);EV_RUNNING=null}
  // phone overnight
  phoneTick();const nightOut=!!S.power&&S.power.start<=(d+1)*1440+330;
  if(where==='home') S.phone=(!nightOut||S.ev.flags.genRan===d)?100:Math.max(0,S.phone-6);
  else if(where==='motel') S.phone=100; else S.phone=Math.min(100,S.phone+35);
  // eat
  (S.quests||[]).filter(q=>!q.done&&q.due<d+1&&q.due===d).forEach(q=>{q.done=true;q.failed=true;friendPts(q.who,-1);repFavorFailed(q.who,notes);notes.push(`🙁 You never got to ${S.friends[q.who]?S.friends[q.who].name.split(',')[0]:'your friend'}’s favor.`)});
  if(S.ateOut===d){notes.push('🍔 Dinner was from the Riv. The pantry gets a night off.')}
  else if(where!=='home'&&S.carried>0){S.carried--;notes.push('You eat from your grocery bags.')}
  else if(S.pantry>0){S.pantry--;}
  else {adj('health',-15);adj('stress',10);notes.push('🍽️ You went to bed hungry. The pantry is empty.')}
  if(where!=='home'&&S.carried>0&&!S.cooler){const lost=Math.ceil(S.carried/2);S.carried-=lost;notes.push(`🥛 ${lost} day${lost>1?'s':''} of groceries spoiled overnight. No cooler.`)}
  if(S.emp&&curJob().days.includes(d)&&!S.worked[d]&&jobStarted(d)){if(typeof weatherExcuse==='function'&&weatherExcuse(d)){adj('job',-6);notes.push('💼 You missed work today. Your boss texts: “Roads are a mess. Stay safe. But we really need you tomorrow.”')}else{adj('job',-15);notes.push('💼 You missed work today. Your boss texts: “{{name}}??”')}} // season
  if(S.interview&&S.interview.day===d){notes.push(`📝 You missed your interview for ${JOBS[S.interview.job].n}.`);S.interview=null}
  if(apptActive()&&d===APPT_DAY&&!S.appt&&!S.apptMissed){S.apptMissed=true;adj('health',-15);notes.push('🩺 You missed your doctor’s appointment. Next opening: three weeks out.')}
  if(d>=5&&!S.rx){adj('health',-8);notes.push('💊 You’re out of your prescription. You don’t feel right.')}
  if(S.injury&&!S.injury.treated){adj('health',-8);notes.push('🤕 Your untreated ankle throbs all night.')}
  let rest=Math.max(6,Math.min(24,Math.round(14+((alarmBase()??420)-330)/30*3)));
  // the house wears down: a little every day, more on workdays, in a busy week, and after storms and outages
  {const genOK=S.ev.flags.genRan===d;let dec=1+choresPile(notes);if(S.worked[d])dec+=2;if(Object.keys(S.worked).length>=4)dec+=1;
   if(stormNight(d))dec+=genOK?3:8;else if(nightOut)dec+=genOK?1:4;
   homeAdj(-dec);
   if(S.home<HOME_LOW&&!S.homeLow){S.homeLow=true;notes.push('🏠 The house is getting away from you: dishes, laundry, needles tracked in everywhere. It’s hard to relax in here. (Tidy up or deep clean at home.)')}
   if(S.home>=50)S.homeLow=false;}
  if(where==='home'&&homeTier()==='low'){rest=Math.round(rest*0.6);notes.push('🏠 Hard to unwind in a messy house. You don’t sleep as well.')}
  if(where==='home'&&homeTier()==='high'){rest+=4;adj('health',1)}
  if(where==='home'){adj('stress',-rest);adj('health',3);
    const offDay=!curJob()||!curJob().days.includes(d);if(offDay){adj('stress',-10);adj('health',3);notes.push('🛋️ A day off. You actually feel rested.')}}
  else if(where==='terminal'){S.stats.stranded++;adj('stress',15);adj('health',-6);notes.push(carHere()?'🚗 The terminal locks up after the last boat, so you sleep in your car in the ferry lot, seat reclined, coat for a blanket. The ferry horn wakes you at 4:30.':'🪑 The terminal locks up after the last boat. You spend the night on the bench under the overhang outside, coat zipped to your chin.')}
  else {S.stats.stranded++;money(-115);adj('stress',4);notes.push('🏨 $115 for a Lakewood motel room that smells like carpet cleaner.')}
  if(S.stress>=100){adj('job',-5);adj('health',-4);S.stress=55;notes.push('🔥 Burnout. You spend an hour staring at the water instead of sleeping.')}
  notes.forEach(n=>S.log.push({t:S.t,s:n}));
  if(S.health<=0) return gameOver('health');
  if(S.job<=0&&S.emp){S.firedFrom=(S.firedFrom||[]).concat(S.emp);S.firedAt=Object.assign(S.firedAt||{},{[S.emp]:dayKey()});if(S.emp==='riv')repAdd(-10,'fired from the Riv: the whole island eats there',{notes});notes.push(`📦 <b>You’re fired</b> from ${curJob().n}. Your boss is “sorry about the ferry, but.” Time to look for work: 💼 the Gig Work app has the listings, or try the bulletin board at the old store.`);S.emp=null;S.job=0;S.stats.firings=(S.stats.firings||0)+1;adj('stress',15)}
  S.coop.town+=15+Math.floor(Math.random()*30);coopCheck(notes);
  let nd=d+1;
  if(d===6){if(S.mode==='month'&&S.weekNo<3){weekRollover(notes);nd=0}else return finish()}
  // when you wake up
  // two independent alarms: you wake at the earliest one that actually goes off
  const A=S.alarm,home=where==='home';
  const plugOK=A.plug.on&&home&&!nightOut;           // an outage resets the clock; it's useless away from home
  const phoneOK=A.phone.on&&S.phone>0;
  const slept=phoneOK&&(S.ev.force.includes('slept_through')||Math.random()<0.07);
  S.ev.force=S.ev.force.filter(x=>x!=='slept_through');
  const working=[];if(plugOK)working.push(A.plug.time);if(phoneOK&&!slept)working.push(A.phone.time);
  let wake,awayNote='',wakeEv=null;
  if(working.length){
    wake=Math.min(...working);
    if(home&&nightOut&&phoneOK&&!slept) wakeEv='phone_saves';
    else if(slept&&plugOK) wakeEv='backup_alarm';
  } else if(home){
    wake=alarmBase()??330;
    wakeEv=!A.plug.on&&!A.phone.on?'no_alarm':A.phone.on&&S.phone<=0?'phone_died':slept?'slept_through':'alarm_fail';
  } else {
    wake=370+Math.floor(Math.random()*80);
    awayNote=A.phone.on&&S.phone<=0?`📵 Your phone died overnight. You wake at ${fmt(wake)}.`:slept?`😴 You slept through your phone alarm. You wake at ${fmt(wake)}.`:`⏰ Your only alarm is the plug-in clock at home. ${where==='terminal'?'The janitor’s floor buffer':'A housekeeping cart'} wakes you at ${fmt(wake)}.`;
  }
  if(wakeEv) chain(wakeEv,nightOut&&wakeEv!=='slept_through'&&wakeEv!=='no_alarm'?'power_outage':null);
  S.cur=nd; S.t=nd*1440+wake; S.phoneT=S.t; S.priority=false;
  if(where!=='home') S.loc='stDock';
  uiNarr=[];
  say(`${DAYS[nd]}, ${fmt(S.t)}.`);
  if(awayNote){say(awayNote);showTile(awayNote.slice(0,2),'No alarm went off',where==='terminal'?'At the Steilacoom terminal':'At the motel','bad')}
  modal(`Good night, ${DAYS[d]}`,`${dayCard}${notes.length?notes.map(n=>'<p>'+n+'</p>').join(''):'<p>A quiet night. The ferry horn sounds once, far off.</p>'}<p>${S.pantry} day${S.pantry===1?'':'s'} of food left in the pantry.</p>`,[{l:`Wake up: ${DAYS[nd]}`,fn:()=>{}}]);
  startDay();
  render();
}
function afterAction(){
  processTimed();phoneTick();
  const late=day()*1440+23*60+30;
  if(S.t>=late&&S.loc!=='home'){
    if(L[S.loc].side==='I'){S.loc='home';const c=S.cars.find(c=>c.id==='isl');say('It’s late. You make it home somehow.');if(S.carried){S.pantry+=S.carried;S.carried=0}return endDay('home')}
    return strandedModal();
  }
  render();
}
function strandedModal(){
  modal('Stranded on the mainland','<p>It’s late and you’re not getting home tonight. Where do you sleep?</p>',[
    {l:carHere()?'🚗 Sleep in your car in the ferry lot':'🪑 The bench outside the Steilacoom terminal',s:'Free. The waiting room locks after the last boat. It is not comfortable.',fn:()=>{S.loc='stDock';endDay('terminal')}},
    {l:'🏨 Motel in Lakewood',s:'$115. Real bed.',fn:()=>endDay('motel')},
  ],true);
}

