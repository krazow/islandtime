// ---------------- ferry engine ----------------
function sailing(side,d,dep,mode,knownOnly){
  const abs=d*1440+dep;
  if(d===0&&FUEL_CANCEL[side].includes(dep)) return {abs,dep,d,cancel:true,reason:'Monday fuel run (hazmat: crew & tanker driver only)',known:true};
  for(const b of S.week.b){
    if(knownOnly&&b.start>S.t) continue;
    if(abs>=b.start&&abs<b.end){
      if(b.end-b.start>=1200&&abs>=b.start+960) return {abs,dep,d,passenger:true,delay:0,reason:'Passenger-only backup boat'};
      return {abs,dep,d,cancel:true,reason:b.cause,b};
    }
  }
  const delay=dep<660?S.week.fog[d]||0:0;
  const sd=seasonDelay(side,d,dep);if(sd)return {abs,dep,d,delay:delay+sd.min,why:sd.why,ketron:KETRON[side].includes(dep)}; // season
  return {abs,dep,d,delay,ketron:KETRON[side].includes(dep)};
}
function findNext(side,mode,knownOnly){
  const deps=side==='I'?AI_DEPS:ST_DEPS;
  for(let d=day();d<day()+4;d++) for(const dep of deps){
    const s=sailing(side,d,dep,mode,knownOnly);
    if(S.t>s.abs-20) continue;
    if(s.cancel) continue;
    if(s.passenger&&mode==='drive') continue;
    return s;
  }
  return null;
}
function activeOutage(){return S.week.b.find(b=>b.start<=S.t&&S.t<b.end)}
function fullProb(side,d,dep){
  let p=0.05;
  if(d<5){ if(side==='I'&&(dep===390||dep===465)) p=0.35; if(side==='M'&&(dep===1025||dep===1100)) p=0.35;}
  if(d===4&&side==='M'&&dep>=875&&dep<=1175) p=0.55;
  if(d===5&&side==='I'&&dep<=690) p=0.3;
  if(d===6&&side==='M'&&dep>=875) p=0.45;
  p=seasonFull(p,side,d,dep); // season
  // backlog after an outage
  if(S.week.b.some(b=>S.t>=b.end&&S.t<b.end+180)) p=Math.max(p,0.7);
  return Math.min(0.95,p*DF().full);
}
function cargoN(){return Object.values(S.cargo).reduce((a,b)=>a+b,0)}
function canWalkCarry(){return S.carried<=4&&S.carried+cargoN()<=CAP_FOOT}
function capNow(){return carHere()?CAP_CAR:CAP_FOOT}
function contraband(mode){const c=S.cargo;return c.gas>0||c.drugs>0||c.diesel>(mode==='drive'?2:0)}
function taskForce(){const n=S.week.news[day()];return n>=0&&NEWS[n].task}
function price(g,side){
  const d=day(),base=GOODS[g].base[side]*S.week.px[d][g][side];let m=1;
  const n=S.week.news[d];if(n>=0){const e=NEWS[n];if(!e.task&&e.side===side&&e.g===g)m*=e.m}
  if(side==='I'&&activeOutage()&&g!=='drugs') m*=1.5;
  if(side==='I'&&S.week.storm&&S.week.storm.day===d&&(g==='gas'||g==='med')) m*=1.4;
  if(g==='drugs'&&taskForce()) m*=1.25;
  const buy=Math.round(base*m);return {buy,sell:Math.round(buy*0.82)};
}

function waitFerry(mode){
  if(mode==='drive'){const c=carHere();if(!c||c.fuel<0.1){say('⛽ The tank is empty. The deckhands won’t load a car that can’t drive.');return render()}}
  const side=L[S.loc].side;
  if(mode==='walk'&&!canWalkCarry()){modal('Too much to carry',`<p>On foot you can carry 4 days of groceries and ${CAP_FOOT} items in total. You’ve got ${S.carried} days of groceries and ${cargoN()} trade items.</p><p>Drive on, or lighten the load.</p>`,[{l:'OK',fn:()=>{}}]);return}
  const known=findNext(side,mode,true), actual=findNext(side,mode,false);
  if(!known){say('No sailings in sight. Something is very wrong with the ferry system.');return render()}
  if(known.d>day()){
    if(mode==='drive'){const kw=findNext(side,'walk',true);if(kw&&kw.d===day()&&canWalkCarry())
      return modal('🚗 No more car sailings tonight',`<p>The next boat that takes cars is <b>${DAYS[known.d]} at ${fmt(known.dep)}</b>.</p><p>You can still <b>walk on</b> the ${fmt(kw.dep)}${kw.passenger?' (passenger-only boat)':''}. Your car would stay here.</p>`,[{l:`Walk on the ${fmt(kw.dep)}`,s:side==='M'?'Walk-on fare '+$(FARE_WALK):'Free from the island',fn:()=>waitFerry('walk')},{l:'Not yet',fn:()=>render()}]);}
    const first=S.lastBoatNote!==S.weekNo*7+day();S.lastBoatNote=S.weekNo*7+day();
    if(side==='M'){if(first){say(`The last boat has gone. The next one you could make is ${DAYS[known.d]} at ${fmt(known.dep)}.`);adj('stress',8)}
      return modal('🌙 No more boats tonight',`<p>The next sailing you could make is <b>${DAYS[known.d]} at ${fmt(known.dep)}</b>.</p><p>You’re stuck on the mainland for the night. Sleep in the terminal, get a motel in Lakewood, or ask a friend for a couch.</p>`,[{l:'OK',fn:()=>render()}]);}
    if(first) say(`No more sailings you can make tonight. Next: ${DAYS[known.d]} ${fmt(known.dep)}. Might as well go home.`);
    return modal('🌙 No more boats tonight',`<p>The next sailing is <b>${DAYS[known.d]} at ${fmt(known.dep)}</b>. Might as well go home.</p>`,[{l:'OK',fn:()=>render()}]);
  }
  if(!actual||actual.abs!==known.abs){
    // surprise breakdown during the wait
    const b=S.week.b.filter(b=>b.start>S.t&&b.start<=known.abs).sort((x,y)=>x.start-y.start)[0];
    const at=b?b.start:known.abs-25;
    S.stats.waited+=at-S.t;S.t=at;adj('stress',12);
    buzz([90,50,90,50,90]);
    showTile('🚨','Rider alert: sailings suspended',b?b.cause[0].toUpperCase()+b.cause.slice(1):'Mechanical issue','bad');
    say(`🚨 RIDER ALERT (${fmt(S.t)}): Sailings suspended due to ${b?b.cause:'a mechanical issue'}. No estimate for restoration.`);
    say('The people in line groan in unison. Someone starts calling their boss.');
    return modal('🚨 Rider Alert',`<p>Service is suspended: <b>${b?b.cause:'a mechanical issue'}</b>.</p><p>The county hasn’t said when it’ll be back. Check the Ferry board, look for the sailboat water taxi, or change your plans.</p>`,[{l:'Ugh. OK.',fn:()=>{}}]);
  }
  const s=known;
  const wait=s.abs-S.t;S.stats.waited+=wait;
  adj('stress',Math.min(7,wait/15));
  S.t=s.abs+(s.delay||0);
  if(s.delay) say(s.why?`${s.why} The boat is ${s.delay} minutes late.`:`Fog on the water. The boat is ${s.delay} minutes late.`); // season
  if(mode==='drive'&&!S.priority&&Math.random()<fullProb(side,s.d,s.dep)){
    showTile('🚗','Boat’s full','You’re first in line for the next one','bad');buzz(120);S.stats.bumps++;adj('stress',12);
    say(`The deckhand waves the car ahead of you on and then raises the hand. Boat’s full. You’re first in line for the next one.`);
    const nxt=(()=>{const save=S.t;S.t=s.abs-19;const n=findNext(side,'drive',true);S.t=save;return n})();
    return modal('Boat’s full 😩',`<p>The ${fmt(s.dep)} sailing filled up right in front of you.</p><p>Next drive-on: <b>${nxt?fmtAbs(nxt.abs):'unknown'}</b> (you’ll be first in line).</p>`,[
      {l:'Wait for the next boat',s:'Keep your car with you',fn:()=>{S.priority=true;S.t=s.abs-21>S.t?S.t:S.t;S.t=Math.max(S.t,s.abs+1);waitFerryFrom(side)}},
      ...(canWalkCarry()?[{l:'Park it and walk on this boat',s:`Car stays at this landing. ${side==='M'?'Walk-on fare '+$(FARE_WALK):'Free from the island'}`,fn:()=>board(side,s,'walk')}]:[])
    ]);
  }
  board(side,s,mode);
}
function waitFerryFrom(side){ // after a bump, find next from current time ignoring the 20-min rule for first-in-line
  S.t-=20; const n=findNext(side,'drive',false); S.t+=20;
  if(!n||n.d>day()){say('No more drive-on sailings tonight.');S.priority=false;return render()}
  S.stats.waited+=n.abs-S.t; adj('stress',6); S.t=n.abs+(n.delay||0); S.priority=false; board(side,n,'drive');
}
function arrest(where,missed){
  showTile('🚔','Arrested','Booked at the county jail, out on $750 bail','bad');
  buzz([300,100,300,100,300]);S.drugCharges++;S.stats.arrests++;
  const lost=[];if(S.cargo.drugs)lost.push(S.cargo.drugs+' drug package'+(S.cargo.drugs>1?'s':''));if(S.cargo.gas)lost.push(S.cargo.gas+' gas can'+(S.cargo.gas>1?'s':''));
  S.cargo.drugs=0;S.cargo.gas=0;money(-750);adj('job',-20);adj('stress',30);S.t+=300;
  say(`🚔 Arrested ${where}. ${lost.length?'Seized: '+lost.join(', ')+'. ':''}Booked at the county jail, released on $750 bail five hours later. Your boss heard.`);
  if(S.drugCharges>=2) return gameOver('convicted');
  modal('🚔 Arrested',`<p>${where==='at the ferry'?'A sheriff’s deputy and a K-9 work the car deck. The dog sits down next to your car.':'The buyer was an undercover deputy.'}</p><p>Everything illegal is seized. You’re booked into the Pierce County Jail and released on <b>$750 bail</b> five hours later${missed?', and the boat is long gone':''}. Your job takes a hit when you don’t show up.</p><p><b>A second drug arrest ends the game.</b></p>`,[{l:'Head back out',fn:()=>{}}]);
  afterAction();
}
function board(side,s,mode){
  if(contraband(mode)){
    const c=S.cargo;
    const p=Math.min(0.9,(mode==='drive'?0.22:0.32)+0.04*(c.gas+c.drugs)+(c.drugs?0.05*S.stats.drugRuns:0)+(taskForce()?0.3:0));
    if(Math.random()<p){
      if(c.drugs>0) return arrest('at the ferry',true);
      if(c.gas>0){
        showTile('🚫','Busted with a gas can','Citation for unlawful transit conduct','bad');buzz([200,80,200]);S.citations++;const g=c.gas;c.gas=0;money(-150);adj('stress',22);
        say(`🚫 A deckhand spots your gas can${g>1?'s':''}. You have to dispose of ${g*5} gallons and you get a citation for unlawful transit conduct. You miss the ${fmt(s.dep)}.`);
        if(S.citations>=2) return gameOver('banned');
        return modal('Busted at the ferry',`<p>Gasoline is allowed aboard only in a vehicle’s own tank. Spare cans, <b>full or empty</b>, are prohibited.</p><p>Your ${g>1?g+' cans are':'can is'} confiscated, you get a citation, and the boat leaves without you. The citation will cost you about $150.</p><p><b>Repeat violations can get you banned from riding the ferry.</b> Next time, that’s the game.</p>`,[{l:'Lesson learned. Probably.',fn:()=>{}}]);
      }
      const keep=mode==='drive'?2:0,extra=c.diesel-keep;c.diesel=keep;adj('stress',6);
      say(`🟨 The deckhand counts your diesel cans. ${mode==='drive'?'Two per vehicle is the limit':'Diesel cans have to ride in a vehicle'}, so ${extra} can${extra>1?'s':''} stay${extra>1?'':'s'} on the dock. Gone.`);
    } else {
      if(c.gas){S.stats.smuggled+=c.gas*5;adj('stress',10);say('Nobody looks in your trunk. You sweat through the whole crossing, smelling gas fumes and picturing a car-deck fire.');}
      if(c.drugs){S.stats.drugRuns++;adj('stress',15);say('You stare at the water the whole crossing and don’t breathe right until the ramp comes down.');}
      if(c.diesel>(mode==='drive'?2:0)) say('Nobody counts your diesel cans this time.');
    }
  }
  if(S.cargo.diesel>0&&S.cargo.diesel<=2&&mode==='drive') say('A deckhand checks the DOT labels on your diesel cans, sees they’re upright and strapped down, and waves you through. That one’s legal.');
  if(side==='M'){const f=mode==='drive'?FARE_CAR:FARE_WALK;if(!(typeof fpUseRide==='function'&&fpUseRide(mode))){money(-f);S.stats.fares+=f;}} // apps: Ferry Pass ticket book
  const car=carHere();
  const dur=20+(s.ketron?10:0);
  const to=side==='I'?'stDock':'aiDock';
  crossing(side,`${s.passenger?'Passenger-only backup boat':'Crossing'} to ${side==='I'?'Steilacoom':'Anderson Island'}`,`${fmt(S.t)} departure${s.ketron?' · stops at Ketron Island':''} · ${mode==='drive'?'with your car':'on foot'}`,()=>{
    S.t+=dur;S.stats.crossings++;
    if(mode==='drive'&&car) car.loc=to;
    if(mode==='drive'&&car&&car.fuel<0.5&&Math.random()<0.4){car.fuel=0;S.t+=20;adj('stress',8);buzz(150);
      say('🚗 The engine sputters and dies halfway up the ramp. Three deckhands push your car off while the whole line of cars watches. +20 minutes, and the tank is bone dry.');
      showTile('🚗','Stalled on the ferry ramp','The deckhands pushed you off','bad')}
    S.loc=to;fireHook('arrive',{at:to,from:'ferry'});
    say(`${s.ketron?'After a detour to Ketron Island, you':'You'} arrive at ${L[to].name} at ${fmt(S.t)}.${mode==='walk'&&car?` (${car.name} is parked back at the other landing.)`:''}`);
    afterAction();
  });
}
function waterTaxi(){
  if(!canWalkCarry()) return modal('Too much to carry',`<p>The sailboat has room for you and maybe ${CAP_FOOT} bags or cans. Not your whole haul.</p>`,[{l:'OK',fn:()=>{}}]);
  const side=L[S.loc].side;
  const w=20+Math.floor(Math.random()*40);S.t+=w;S.stats.waited+=w;
  if(Math.random()<0.35){adj('stress',8);say(`You wait ${w} minutes by the landing. The neighbor’s sailboat is on the other side, loaded with somebody’s dog crate. Not this time.`);return afterAction()}
  money(-20);
  crossing(side,'Neighbor’s sailboat water taxi','A $20 “donation” for diesel · life jacket on · 40 min',()=>{
    S.t+=40;S.stats.crossings++;const to=side==='I'?'stDock':'aiDock';S.loc=to;adj('stress',-4);
    say(`A neighbor with a sailboat has been running people across during the outage. You hop off at ${L[to].name}, damp but grateful.`);
    afterAction();
  },true);
}

