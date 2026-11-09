// ---------------- seasons ----------------
// S.season: 'fall' (November, the original game), 'winter' (January) or 'summer' (July). seasonId() lives in 01-core.
// Everything here is a function declaration (hoisted), because titleScreen() runs at load, before this file executes.
// Fall must stay exactly the original game: every helper returns the old value for fall and makes no Math.random() calls.
function seasonTable(){return seasonTable.t||(seasonTable.t={
  fall:{n:'Fall',ic:'🍂',month:'November',start:[2026,10,2],lite:[420,1020],sun:[420,1050],liteTxt:'7 AM–5 PM in November',
    d:'November: rain, wind, woodsmoke and short days. The game as it’s always been.'},
  winter:{n:'Winter',ic:'❄️',month:'January',start:[2027,0,4],lite:[480,960],sun:[470,990],liteTxt:'8 AM–4 PM in January',
    d:'January: ice on the ferry ramp, frozen pipes, king tides, more storms and outages. Daylight 8 to 4.'},
  summer:{n:'Summer',ic:'☀️',month:'July',start:[2026,5,29],lite:[360,1260],sun:[330,1290],liteTxt:'6 AM–9 PM in July',
    d:'July: tourists with kayaks pack the boats, the Fourth of July, a garden to water, a burn ban and wildfire smoke. No woodstove.'},
})}
function seasonOk(k){return Object.prototype.hasOwnProperty.call(seasonTable(),k)}
function SEA(k){const T=seasonTable();return T[k||seasonId()]||T.fall}
function seasonBadge(x){const s=SEA(x&&x.season||'fall');return `${s.ic} ${s.n}`}
function seasonYear(k){const s=SEA(k);return `${s.month} ${s.start[0]}`}
// multipliers against fall (fall = 1 for everything)
function seasonMul(k,sea){
  const M={winter:{fog:1,storm:1.45,outage:1.7,rain:1.2,gut:0.5,moss:0.5},summer:{fog:0,storm:0,outage:0.35,rain:0.15,gut:0.4,moss:0.3}};
  const s=M[sea||seasonId()];return s&&s[k]!=null?s[k]:1}
// ---- daylight: outdoor work window ----
function seasonLite(m){const w=SEA().lite;if(seasonId()==='summer'&&smokeDay())return false;return m>=w[0]&&m<w[1]}
function seasonDark(){if(seasonId()==='summer'&&smokeDay())return 'Wildfire smoke: the air is unhealthy today. Outdoor work can wait.';return `Outdoor work is a daylight job: ${SEA().liteTxt}.`}
// ---- house: heating and wear (used by upkeepNight in 04-house) ----
function seasonUp(){const s=seasonId();
  if(s==='summer') return {rain:seasonMul('rain'),gut:seasonMul('gut'),moss:seasonMul('moss'),stove:false,wood:0,prop:[1,1,1]};
  if(s==='winter') return {rain:seasonMul('rain'),gut:seasonMul('gut'),moss:seasonMul('moss'),stove:true,wood:1+(Math.random()<0.3?1:0),prop:[3,8,3]};
  return {rain:1,gut:1,moss:1,stove:true,wood:1,prop:[2,6,2]}}
function seasonStove(){return seasonId()!=='summer'}
// ---- the week: extra weather per season (called from genWeek; fall adds nothing) ----
function seasonWeek(w,sea,wk){
  if(sea==='winter'){const r=Math.random,X={cold:[],ice:[],snow:-1,tide:null};
    for(let d=0;d<7;d++) X.cold.push(r()<0.5);
    if(r()<0.45) X.snow=1+Math.floor(r()*5);
    for(let d=0;d<7;d++){const icy=d===X.snow||(d>0?X.cold[d-1]:r()<0.5);X.ice.push(icy?(d===X.snow?25:10)+Math.floor(r()*20):0);
      if(icy&&r()<0.3){const st=d*1440+300+Math.floor(r()*90),en=st+60+Math.floor(r()*60);
        if(!w.b.some(x=>st<x.end+60&&en>x.start-60)) w.b.push({start:st,end:en,cause:'ice on the transfer span (crews are sanding the ramp)',ice:true})}}
    if(r()<0.7){const d=1+Math.floor(r()*6),pk=d*1440+450+Math.floor(r()*150);X.tide={day:d,start:pk-75,end:pk+75}}
    w.sea=X;
  } else if(sea==='summer'){const r=Math.random,X={fourth:wk===0?5:-1,smoke:-1};
    if(r()<0.45){const days=[1,2,3,4,6].filter(d=>d!==X.fourth);X.smoke=days[Math.floor(r()*days.length)]}
    w.sea=X;
  }
  return w;
}
function seaX(){return (S&&S.week&&S.week.sea)||{}}
function smokeDay(d){return seaX().smoke===(d==null?day():d)}
function fourthDay(d){return seaX().fourth===(d==null?day():d)}
function fourthWeekend(d){const f=seaX().fourth;return f!=null&&f>=0&&d>=f-1&&d<=f+1}
function kingTide(t){const T=seaX().tide;t=t==null?S.t:t;return !!T&&t>=T.start&&t<T.end}
function coldNight(d){const X=seaX();return seasonId()==='winter'&&(!!(X.cold&&X.cold[d])||stormNight(d))}
// Bosses go easy on island commuters when snow or ice shuts down the ramp (winter only).
function weatherExcuse(d){const X=seaX();return seasonId()==='winter'&&(X.snow===d||!!(X.ice&&X.ice[d]))}
function icyRoads(d,m){const X=seaX();if(seasonId()!=='winter')return false;return X.snow===d||(!!(X.ice&&X.ice[d])&&m<660)}
// ---- ferry ----
function seasonDelay(side,d,dep){
  const s=seasonId();if(s==='fall')return null;
  const X=seaX();let min=0;const why=[];
  if(s==='winter'){
    if(X.ice&&X.ice[d]&&dep<600){min+=X.ice[d];why.push(X.snow===d?'Snow and ice on the ferry ramp. The crew shovels and sands the transfer span before anyone drives on.':'Ice on the ferry ramp. The crew salts and sands the transfer span before anyone drives on.')}
    if(X.tide&&X.tide.day===d){const a=d*1440+dep;if(a>=X.tide.start&&a<X.tide.end){min+=15;why.push('King tide: the water is so high the transfer span is at its limit, so they load one car at a time.')}}
  } else if(s==='summer'){
    if(fourthDay(d)&&dep>=960){min+=15;why.push('Fourth of July crowds: the deckhands are packing cars in like Tetris.')}
  }
  return min?{min,why:why.join(' ')}:null;
}
function seasonFull(p,side,d,dep){
  const s=seasonId();
  if(s==='summer'){p=Math.max(p,0.12);if(d>=4)p+=0.22;if(dep>=960)p+=0.12;if(fourthWeekend(d))p+=0.25}
  else if(s==='winter') p*=0.8;
  return p;
}
function seasonFerryNote(){const s=seasonId(),d=day();
  if(s==='summer') return `<p>☀️ <b>Tourist season:</b> kayaks, bikes and day-trippers. Friday to Sunday and every evening boat fill up fast. Walk on if you can.${fourthWeekend(d)?' <b>Fourth of July weekend: expect the worst.</b>':''}</p>`;
  if(s==='winter'){const X=seaX();let t='';
    if(X.ice&&X.ice[d]) t+=`<p>🧊 <b>Ice on the ramp this morning:</b> sailings before 10 AM run about ${X.ice[d]} minutes late while the crew sands the transfer span.</p>`;
    if(X.tide&&X.tide.day===d) t+=`<p>🌊 <b>King tide</b> around ${fmt(X.tide.start+75)}: slow loading at the landing, and the Oro Bay road floods.</p>`;
    return t}
  return '';
}
function seasonAlert(){const s=seasonId(),d=day(),m=tod(),X=seaX();
  if(s==='winter'){if(X.ice&&X.ice[d]&&m<600) return `🧊 Ice on the ferry ramp: morning sailings running ${X.ice[d]}+ min late.`;
    if(X.tide&&X.tide.day===d&&S.t<X.tide.end&&S.t>=X.tide.start-120) return `🌊 King tide around ${fmt(X.tide.start+75)}: the Oro Bay road floods, ferry loading is slow.`}
  if(s==='summer'&&smokeDay()) return '🔥 Wildfire smoke: air quality unhealthy. Stay inside if you can.';
  return '';
}
// ---- text ----
function seasonFlavor(cozy){const s=seasonId();
  if(s==='summer') return cozy?['🏡 Windows open, the house smells like cut grass and coffee. It’s a good morning.','🏡 Everything’s in its place, and the sun is already on the deck.']:[
    'The sun’s been up for an hour. Somewhere a boat motor buzzes across the water.','A family of quail runs across the driveway in single file.',
    'Blackberries are coming in along the road. So are the tourists.','Mt. Rainier floats over the Sound, the snow on it pink at sunrise.',
    'A neighbor is mowing at 6:45 AM. Of course they are.','Your phone shows one bar. It is always one bar, even in summer.'];
  if(s==='winter') return cozy?['🏡 You wake up in a warm, clean house with frost on the windows. The woodstove ticks. Perfect.','🏡 Everything’s in its place, the kettle’s on, and it’s 28° outside. You’re not going anywhere yet.']:[
    'Frost on the windshield and on every fir needle. It’s still dark.','The ferry horn sounds muffled through the cold air.',
    'Your breath hangs in the porch light. January.','Ice skins the puddles in the driveway.',
    'Mt. Rainier is out, white to the waterline, in the last of the stars.','Your phone shows one bar. It is always one bar.'];
  return cozy?FLAVOR_COZY:FLAVOR_MORNING}
function seasonInjury(){const s=seasonId();
  if(s==='summer') return '🤕 Dragging the hose across the garden, you step in a gopher hole and go down hard. Your ankle swells up like a grapefruit. There’s no clinic on the island. You need Urgent Care on the mainland.';
  if(s==='winter') return '🤕 Hauling firewood in the dark, you hit a patch of black ice on the porch step. Your ankle swells up like a grapefruit. There’s no clinic on the island. You need Urgent Care on the mainland.';
  return null}
function seasonIntro(){const s=seasonId();
  if(s==='summer') say('☀️ <b>Summer on the island.</b> Long days, tourists with kayaks in every ferry line, a garden to water, and a burn ban in effect. No woodstove needed.');
  if(s==='winter') say('❄️ <b>Winter on the island.</b> Eight hours of daylight, ice on the ferry ramp, king tides and storms. Keep the woodstove fed and the pipes from freezing.');
}
// forecast lines each morning (startDay)
function seasonMorning(d){const s=seasonId(),X=seaX();if(s==='fall')return;
  if(s==='winter'){
    if(X.snow===d){say('❄️ Snow overnight: three inches on the island and ice underneath. Roads are slick all day and the ferry ramp is a skating rink.');showTile('❄️','Snow day','Icy roads and a slow ferry ramp','warn')}
    else if(X.ice&&X.ice[d]) say(`🧊 Ice on the ferry ramp: sailings before 10 AM will run about ${X.ice[d]} minutes late. The roads are icy until late morning.`);
    if(X.tide&&X.tide.day===d) say(`🌊 King tide this morning, peaking around ${fmt(X.tide.start+75)}. The Oro Bay road floods and ferry loading slows down.`);
    if(X.cold&&X.cold[d]) say('🥶 Hard freeze tonight, down to the low 20s. If the heat goes out, drip the faucets or the pipes will freeze.');
  }
  if(s==='summer'){
    if(fourthDay(d)){say('🎆 <b>Happy Fourth of July!</b> The American Legion BBQ is at the Riv from 11 AM to 3 PM, and fireworks go up over the water at 10 PM. The ferry line will be a zoo.');showTile('🎆','Fourth of July','Legion BBQ at the Riv · fireworks at 10 PM','info')}
    else if(fourthWeekend(d)) say('🎆 Fourth of July weekend: every boat is packed with visitors, coolers and kayaks.');
    if(smokeDay(d)){say('🔥 <b>Wildfire smoke</b> from east of the mountains: the sun is an orange disk and the air quality is unhealthy. Stay inside. Outdoor work can wait.');showTile('🔥','Wildfire smoke day','Stay inside if you can','warn')}
    if(d===0&&S.weekNo===0) say('🚫 <b>Burn ban</b> in effect for Pierce County: no yard-debris burning, no campfires. Fire District #27 is watching for smoke.');
  }
}
// ---- night: frozen pipes, the garden, brush, fireworks (called from endDay after the night hook) ----
function SEAST(){return S.sea||(S.sea={})}
function heatOutTonight(where,d){const U=UP();if(seasonId()!=='winter')return false;
  const burned=where==='home'&&U.burned===dayKey();if(burned)return false;
  const out=(S.power&&S.power.start<=(d+1)*1440+330&&S.power.end>d*1440+1380)||stormNight(d);
  const gen=S.ev.flags.genRan===d||(stormNight(d)&&genReady()&&S.homeGas>=3&&where==='home');
  return U.propane<=0||(out&&!gen)}
function pipeChance(where,d){if(seasonId()!=='winter')return 0;const cold=coldNight(d),off=heatOutTonight(where,d);
  if(dripOn()) return 0;
  return cold?(off?0.5:0):(off?0.05:0)}   // a heated house doesn't freeze; dripping covers 3 nights
function dripOn(){const X=SEAST();return X.drip===dayKey()||(X.dripUntil!=null&&X.dripUntil>=dayKey())}
function seasonNight(where,notes,d){const s=seasonId();if(s==='fall')return;const X=SEAST(),U=UP();
  if(s==='winter'){
    if(Math.random()<pipeChance(where,d)){S.stats.pipes=(S.stats.pipes||0)+1;money(-280);homeAdj(-15);adj('stress',12);U.damp=(U.damp||0)+3;
      notes.push(where==='home'?'🧊 2 AM: a pop and a hiss under the house. A frozen pipe split in the crawlspace. You shut the water off at the pump house in your boots and a headlamp. A mainland plumber comes over on the first boat: $280. (Drip the faucets on freezing nights.)':
        '🧊 Your neighbor calls at 6 AM: water is pouring out from under your house. A pipe froze and burst while you were away. She shut it off at the pump house. The plumber: $280. (Drip the faucets on freezing nights.)');
      showTile('🧊','A frozen pipe burst','$280 plumber · Home −15','bad');S.ev.history.push({id:'frozen_pipes',t:S.t});if(where==='home')chain('no_water','frozen_pipes')}
    else if(dripOn()&&coldNight(d)&&heatOutTonight(where,d)){notes.push('🚰 The faucets drip all night. The pipes are cold, but they don’t freeze. Good call.');showTile('🚰','Dripping faucets saved the pipes','','good');S.ev.history.push({id:'drip_saved',t:S.t})}
  }
  if(s==='summer'){
    const G=X.garden||(X.garden={w:dayKey()-1,grow:0,dead:false}),since=dayKey()-G.w;
    if(!G.dead){
      if(since>=3){G.dead=true;homeAdj(-3);adj('stress',3);notes.push('🥀 Three hot days without water and the garden gives up: the beans are crisp and the squash is done. Next year.');showTile('🥀','The garden died','Three days without water','bad')}
      else if(since<=1){G.grow++;if(G.grow>=3){G.grow=0;S.pantry++;S.stats.veg=(S.stats.veg||0)+1;notes.push('🥒 The garden comes through: a basket of zucchini, beans and the first tomatoes. +1 day of food.');showTile('🥒','The garden came through','+1 day of food','good')}}
      else notes.push('🌱 The garden is wilting in the heat. Water it tomorrow or lose it.');
    }
    X.brush=Math.min(10,(X.brush||0)+(Math.random()<0.5?1:0));
    if(fourthDay(d)&&where==='home'){adj('stress',2);notes.push('🎇 Someone on the beach sets off illegal fireworks until 1 AM. Every dog on the island has opinions.')}
  }
}
// ---- actions ----
function seasonActions(a,loc){const s=seasonId();if(s==='fall')return;const d=day(),m=tod(),X=SEAST(),dk=dayKey();
  if(loc==='home'&&s==='winter'){const drip=dripOn(),cold=coldNight(d)||powerOut();
    a.push({cat:'home',ic:'🚰',l:drip?`Faucets dripping ✓ (through ${DAYS[((X.dripUntil??dk)%7+7)%7]} night)`:'Drip the faucets (3 nights)',due:cold&&!drip&&m>=900,dis:drip,
      s:drip?'A slow drip in the kitchen and the bathroom. Moving water doesn’t freeze.':`5 min. ${cold?'Hard freeze tonight: if the heat goes out, a still pipe can freeze and burst.':'Not that cold tonight, but it can’t hurt.'}`,
      fn:()=>{X.drip=dk;X.dripUntil=dk+2;S.t+=5;UP().septic=Math.min(100,UP().septic+0.5);say('🚰 You crack the kitchen and bathroom faucets to a slow drip. Annoying, cheap and smart.');afterAction()}});
  }
  if(loc==='home'&&s==='summer'){
    const G=X.garden||(X.garden={w:dk-1,grow:0,dead:false}),wet=G.w===dk;
    if(G.dead) a.push({cat:'yard',ic:'🥀',l:'The garden is done for this year',s:'It dried out. The deer are eating what’s left.',dis:true});
    else a.push({cat:'yard',ic:'💧',l:wet?'Garden watered today ✓':'Water the garden',due:!wet&&dk-G.w>=1,dis:wet,
      s:wet?'Soaked. The tomatoes thank you.':`20 min with the hose. ${dk-G.w>=2?'It’s wilting: water it today or lose it.':'Keep it watered and it feeds you.'} Stress −2.`,
      fn:()=>{G.w=dk;S.t+=20;adj('stress',-2);say('💧 Twenty quiet minutes with the hose while the swallows work the yard. The garden perks right up.');afterAction()}});
    const br=X.brush||0,lite=seasonLite(m);
    if(br>=2){
      a.push({cat:'yard',ic:'🚛',l:'Chip and haul the brush pile',due:br>=5,dis:!lite,s:!lite?seasonDark():`75 min. Fir limbs and blackberry canes, chipped and spread. Burn ban: this is the legal way. Home +3.`,
        fn:()=>{X.brush=0;S.t+=75;homeAdj(3);adj('stress',-1);say('🚛 An hour and a quarter of dragging and chipping. The brush pile is mulch now.');afterAction()}});
      a.push({cat:'yard',ic:'🔥',l:'Burn the brush pile (burn ban!)',due:false,dis:!lite,s:!lite?seasonDark():'20 min instead of 75. It’s illegal during the burn ban, and the Fire District does drive by.',
        fn:()=>{X.brush=0;S.t+=20;homeAdj(3);
          if(Math.random()<0.55){money(-250);adj('stress',10);S.stats.burnFine=(S.stats.burnFine||0)+1;say('🚒 Ten minutes after the smoke goes up, a Fire District #27 truck rolls down the driveway. They hose it out and write you a $250 burn-ban citation. “It’s July, {{name}}.”');showTile('🚒','Burn-ban fine','$250','bad')}
          else{adj('stress',3);say('🔥 The pile goes up fast and hot. You stand there with the hose, sweating, watching for sparks and for the Fire District. Nobody comes. This time.')}
          afterAction()}});
    }
  }
  if(s==='summer'&&fourthDay(d)){const fw=X.fw===dk,bbq=X.bbq===dk;
    if(loc==='food'){
      if(bbq) a.push({ic:'🍔',l:'Legion Fourth of July BBQ ✓',s:'You were there. You smell like charcoal.',cat:'here',dis:true});
      else if(m<660) a.push({ic:'🍔',l:'Legion Fourth of July BBQ: 11:00 AM',s:'Come back between 11 AM and 3 PM.',cat:'here',dis:true});
      else if(m<900) a.push({ic:'🍔',l:'Legion Fourth of July BBQ: $12',s:'An hour of burgers, flags and a pie contest. Stress −8.',cat:'here',cls:'primary',dis:S.money<12,fn:()=>{
        X.bbq=dk;money(-12);S.t+=60;phoneTick();adj('stress',-8);
        if(S.friends.walt){friendPts('walt',2);say('🍔 Walt runs the grill in an apron that says KISS THE COOK, VETERAN. He slips you the burger with the extra cheese.')}
        else{meet('walt','Walt from the American Legion','he grilled your burger at the Fourth of July BBQ');say('🍔 Burgers, potato salad, three kinds of pie and a kid with a sparkler. The man at the grill in a Legion cap introduces himself as Walt.')}
        afterAction()}});
      else a.push({ic:'🍔',l:'The Legion BBQ is over',s:'Somebody’s still scraping the grill.',cat:'here',dis:true});
    }
    if(['home','lake','aiDock','food'].includes(loc)){
      if(fw) a.push({ic:'🎆',l:'Fireworks ✓',s:'Ooh. Aah.',cat:'here',dis:true});
      else if(m>=1290&&m<1380) a.push({ic:'🎆',l:'Watch the fireworks over the water',s:'45 min. Every boat on the Sound honks after the finale. Stress −12.',cat:'here',cls:'primary',fn:()=>{
        X.fw=dk;S.t+=45;phoneTick();adj('stress',-12);S.stats.fireworks=(S.stats.fireworks||0)+1;
        say(loc==='home'?'🎆 From the bluff you can see three shows at once: Steilacoom, DuPont and somebody’s very illegal barge. The boats on the water all honk at the finale.':'🎆 Fireworks burst over the water and echo off the bluffs. When it ends, every boat in the Sound leans on its horn.');
        afterAction()}});
      else if(m<1290) a.push({ic:'🎆',l:'Fireworks over the water around 10 PM',s:'From 9:30 PM. Find a spot with a view of the Sound.',cat:'here',dis:true});
    }
  }
}
// ---- events ----
Object.assign(TILE_META,{frozen_pipes:['🧊','A frozen pipe burst','bad'],drip_saved:['🚰','Dripping faucets saved the pipes','good'],icy_road:['🧊','Icy road','bad'],car_slide:['🚗','You slid into the ditch','bad'],
  king_tide:['🌊','King tide over the Oro Bay road','bad'],ramp_ice:['🧊','Ice on the ferry ramp','info'],kayak_line:['🛶','Tourists with kayaks','info'],fourth_ferry:['🎆','Fourth of July ferry line','bad'],smoke_walk:['🔥','Walking in the smoke','bad']});
defEvent({id:'icy_road',hook:'tripMid',priority:6,max:4,cond:ctx=>islandCar(ctx)&&icyRoads(day(),tod()),chance:0.5,
  run(ctx){if(Math.random()<0.18){ctx.add(45);adj('stress',10);S.ev.history.push({id:'car_slide',t:S.t});
      say('🚗 The back end steps out on the hill by the lake and you slide, slowly, into the ditch. A neighbor on a tractor tows you out with a chain and a grin. +45 minutes.');}
    else{ctx.add(8);adj('stress',2);say('🧊 Black ice on the hill. You crawl along at 15 mph with both hands on the wheel. +8 minutes.')}}});
defEvent({id:'king_tide',hook:'tripMid',priority:5,max:2,cond:ctx=>L[ctx.from].side==='I'&&kingTide(),chance:0.8,
  run(ctx){ctx.add(20);adj('stress',4);say('🌊 King tide: salt water is running across the Oro Bay road, with driftwood logs in it. You go the long way around. +20 minutes.')}});
defEvent({id:'ramp_ice',hook:'arrive',priority:1,max:3,cond:ctx=>ctx.at==='aiDock'&&ctx.from!=='ferry'&&seasonId()==='winter'&&!!(seaX().ice&&seaX().ice[day()])&&tod()<600,chance:0.5,
  run(){say('🧊 A deckhand in an orange float coat is throwing sand on the transfer span by the shovelful. Nobody drives on until it’s gritty.')}});
defEvent({id:'kayak_line',hook:'arrive',priority:1,max:3,cooldown:1,cond:ctx=>(ctx.at==='aiDock'||ctx.at==='stDock')&&ctx.from!=='ferry'&&seasonId()==='summer',chance:0.3,
  run(){adj('stress',2);say(pick(['🛶 Three minivans with kayaks strapped to the roof are ahead of you in line, and one of them is asking a deckhand where the beach is.','🛶 A family of six on rented bikes, a cooler the size of a coffin, and two paddleboards. Tourist season.','🛶 The line is full of out-of-county plates and kayaks. A guy asks you if the island has a Starbucks.']))}});
defEvent({id:'fourth_ferry',hook:'arrive',priority:2,max:2,cond:ctx=>(ctx.at==='aiDock'||ctx.at==='stDock')&&ctx.from!=='ferry'&&seasonId()==='summer'&&fourthWeekend(day()),chance:0.6,
  run(){adj('stress',4);say('🎆 The Fourth of July ferry line backs up past the gas station: coolers, flags, kayaks and one guy with a full-size inflatable flamingo.')}});
defEvent({id:'smoke_walk',hook:'tripMid',priority:2,max:3,cond:ctx=>(ctx.mode==='walk'||ctx.mode==='hitch')&&L[ctx.from].side==='I'&&seasonId()==='summer'&&smokeDay(),chance:1,
  run(){adj('health',-3);say('🔥 Walking in the smoke makes your eyes burn and your throat scratchy. Health −3.')}});
// ---- choosing a season (new-game flow: difficulty → length → season) ----
function seasonModal(then){
  const cur=prefs().season;
  modal('🗓️ What time of year?','<p>Each season plays differently. Fall is the original game.</p>',['fall','winter','summer'].map(k=>{const s=SEA(k);
    return {l:`${s.ic} ${s.n} (${s.month})${k===cur?' (last time)':''}`,s:s.d,fn:()=>{setPref('season',k);then(k)}}}));
}
