// ---- 📖 story mode: the storm of the decade (chapter 2) and the co-op reopening the store (all year) ----
// Story games only (S.story exists). The framework (26-story.js) defines storyOn/storyCh/storyHooks; this file keeps
// local guards so it works with or without it, and it changes nothing in week or month games.
//  Beat 1  chapter 2 (winter), week 1: a forecast from Monday, the storm hits Wednesday night. Power out Wed 8 PM to
//          Sat noon, no ferry Wed 6 PM to Thu 10 PM, maybe a tree across the road. Choices to help (or profit).
//          Sets S.story.flags.storm={helped:n}.
//  Beat 2  the co-op: a $6,000 goal over the whole year, never opening mid-story. Pie social (ch 0), membership
//          drive (ch 1), the storm shows why (ch 2), the members' meeting and the reopening (ch 3).
//          Sets S.story.flags.coopOpen (and coopMember, coopRibbon).
// State lives in S.story.island.
const STORY_COOP_GOAL=6000;
const siOn=()=>typeof S!=='undefined'&&!!(S&&S.story);
const siCh=()=>S&&S.story?S.story.ch:-1;
function coopGoal(){return siOn()?STORY_COOP_GOAL:COOP_GOAL}
function SI(){const st=S.story;if(!st.flags)st.flags={};if(!st.recap)st.recap=[];
  if(!st.island)st.island={storm:{helped:0,did:{}},coop:{}};const I=st.island;if(!I.storm)I.storm={helped:0,did:{}};if(!I.storm.did)I.storm.did={};if(!I.coop)I.coop={};return I}
const siFund=()=>(S.coop.you||0)+(S.coop.town||0);
const siRecap=s=>{try{const I=SI();(I.notes||(I.notes=[])).push(s)}catch(e){}};
// note for tonight's summary when we have one, else the log
const siSay=(s,notes)=>{if(notes)notes.push(s);else say(s)};

// ======================= Beat 1: the storm of the decade =======================
// times are minutes from the start of the week (Mon 00:00)
const SI_STORM={day:2,start:2*1440+1080,end:3*1440+1320};                 // the gale: Wed 6 PM → Thu 10 PM
const SI_PWR={start:2*1440+1200,end:5*1440+720};                           // power: Wed 8 PM → Sat noon
const SI_FERRY={start:2*1440+1080,end:3*1440+1320,cause:'the storm of the decade: gusts over 70 mph on the Sound, all sailings canceled'};
const SI_TREE_CHANCE=0.6;
const siStormWeek=()=>siOn()&&siCh()===2&&S.weekNo===1&&!!(S.week&&S.week.siStorm);
// build the storm into this week's S.week (called from genWeek, or at the start of a day as a fallback)
function siStormBuild(w){
  w.b=(w.b||[]).filter(x=>!/high winds/.test(x.cause)&&!(x.start<SI_FERRY.end+60&&x.end>SI_FERRY.start-60));
  w.b.push(Object.assign({si:true},SI_FERRY));w.b.sort((a,b)=>a.start-b.start);
  w.storm={day:SI_STORM.day,start:SI_STORM.start,end:SI_STORM.end,big:true};
  w.siStorm={tree:Math.random()<SI_TREE_CHANCE};
  if(w.sea&&Array.isArray(w.sea.cold))for(let d=2;d<=5;d++)w.sea.cold[d]=true;   // cold nights (winter rules decide the pipes)
  return w}
{const _gw=genWeek;genWeek=function(diffKey,sea){const w=_gw.apply(this,arguments);
  try{if(siOn()&&siCh()===2&&((S&&S.weekNo)||0)===1&&!w.siStorm)siStormBuild(w)}catch(e){console.error(e)}return w}}
// the island knows from Monday (the gale warning in 01/06/17 then lights up the storm-prep actions)
{const _sk=stormKnown;stormKnown=function(){if(siStormWeek())return S.t<S.week.storm.end;return _sk.apply(this,arguments)}}
// the storm's power outage, Wed 8 PM to Sat noon
function siPowerOn(){if(S.power&&S.power.si)return;S.power={start:SI_PWR.start,end:SI_PWR.end,cause:'the storm of the decade',si:true}}
const siStormNow=()=>siStormWeek()&&S.t>=SI_STORM.start&&day()<=5;   // when the storm choices are on the table
const siPowerTonight=d=>siStormWeek()&&d*1440+1380>=SI_PWR.start&&d*1440+1380<SI_PWR.end;
// the other random outage event shouldn't start a second outage in the middle of this one
{const e=EV.find(x=>x.id==='power_outage');if(e){const c0=e.chance;e.chance=ctx=>siStormWeek()&&day()>=2&&day()<=5?0:(typeof c0==='function'?c0(ctx):c0)}}
// the tree across the road: until the chainsaw crew clears it, island drives Thursday and Friday detour around it
{const e=EV.find(x=>x.id==='tree_down');if(e){const c0=e.chance;e.chance=ctx=>{try{const I=siStormWeek()?SI():null;
  if(I&&S.week.siStorm.tree&&!I.storm.cleared&&(day()===3||day()===4))return 0.8}catch(x){}return typeof c0==='function'?c0(ctx):c0}}}
function siHelped(n){const I=SI();I.storm.helped=(I.storm.helped||0)+n}
// ---- the choices ----
function siHendersons(){const I=SI();I.storm.did.hend=true;S.t+=45;phoneTick();
  meet('hendersons','the Hendersons, next door','you checked on them in the storm');friendPts('hendersons',2);adj('stress',-2);
  say('🧓 You pick your way through the downed branches to the Hendersons’. Don has the camp stove going and Ruth is in two coats doing the crossword by headlamp. You top up their water jugs, carry in wood and check the propane. “We’re fine, dear. But we’re very glad you came.”');
  repAdd(5,'checked on the Hendersons in the storm');siHelped(1);afterAction()}
function siWarmCan(){const U=UP();return (U.wood||0)>=3||(genReady()&&S.homeGas>=1)}
function siWarming(){const I=SI(),U=UP();I.storm.did.warm=true;S.t+=180;phoneTick();
  const wood=(U.wood||0)>=3;if(wood)U.wood-=1;else S.homeGas=Math.round((S.homeGas-1)*10)/10;
  adj('stress',-3);
  say(`🔥 You post in the Island Group: “Warm house, hot coffee, outlets that work. Come by.” ${wood?'The woodstove roars all afternoon':'The generator rumbles in the driveway all afternoon'}. People come in stamping snow off their boots: phones charge in a row on the counter, a toddler falls asleep on your couch, somebody brings a pot of chili.`);
  const met=[newNeighbor('you opened your house as a warming spot in the storm'),newNeighbor('they warmed up at your place in the storm')].filter(Boolean).length;
  if(!met){const ids=Object.keys(S.friends);ids.slice(0,2).forEach(id=>friendPts(id,1))}
  repAdd(10,'opened your house as a warming spot in the storm');siHelped(2);afterAction()}
function siShare(what){const I=SI(),U=UP();I.storm.did.share=true;S.t+=20;phoneTick();
  if(what==='gas'){S.homeGas=Math.round((S.homeGas-5)*10)/10;say('⛽ The guy two driveways down ran his generator dry keeping his mother’s oxygen machine going. You carry 5 gallons from your shed over in the dark. He tries to pay you. You don’t let him.')}
  else{U.wood=Math.max(0,U.wood-2);say('🪵 Your neighbor’s woodshed is empty and their house is 41°. You load two nights of your firewood into their wheelbarrow. “I owe you.” “You don’t.”')}
  if(Math.random()<0.5)newNeighbor('you shared your '+(what==='gas'?'gas':'firewood')+' in the storm');
  repAdd(5,`shared ${what==='gas'?'gas':'firewood'} with a neighbor in the storm`);siHelped(1);afterAction()}
function siSell(){const I=SI();I.storm.did.sell=true;S.t+=15;phoneTick();S.homeGas=Math.round((S.homeGas-5)*10)/10;money(60);
  say('💵 You post “5 gal gas, $60, cash” in the Island Group. It’s gone in eleven minutes. The guy who picks it up doesn’t say much. The comments under your post say plenty.');
  repAdd(-10,'sold gas at storm prices (people remember)');afterAction()}
function siRoad(){const I=SI();I.storm.did.road=true;I.storm.cleared=true;S.t+=120;phoneTick();adj('health',-3);adj('stress',-2);
  say(`🪚 Two hours with the volunteer chainsaw crew: Big Ken on the tractor, the fire district guys, a retired logger who won’t stop telling you to keep your feet clear. ${S.week.siStorm.tree?'The big fir across the road by the lake comes apart in rounds, and the first car through honks the whole way.':'Limbs and small trees off the roads, rounds stacked on the shoulders for anyone who wants firewood.'}`);
  meet('ken','Big Ken, who has a tractor','you cleared the road together after the storm');
  repAdd(5,'helped clear the roads after the storm');siHelped(1);afterAction()}
function siStormActions(a){
  if(!siStormNow())return;const I=SI(),D=I.storm.did,m=tod(),d=day(),U=UP(),side=L[S.loc].side;
  if(S.loc==='home'){
    const awake=m>=420&&m<1260;
    a.push({cat:'here',ic:'🧓',l:D.hend?'Checked on the Hendersons ✓':'Check on the Hendersons next door',dis:D.hend||!awake,cls:D.hend?'':'primary',
      s:D.hend?'Ruth sent you home with a thermos.':!awake?'Not at this hour. First thing in the morning.':'45 min. They’re in their eighties and their phone line is down. Reputation +5.',fn:siHendersons});
    if(powerOut()||D.warm){const can=siWarmCan(),hrs=m>=480&&m<1200;
      a.push({cat:'here',ic:'🔥',l:D.warm?'Opened your house as a warming spot ✓':'Open your house as a warming spot',dis:D.warm||!can||!hrs,
        s:D.warm?'Your couch has never been so popular.':!can?'You need heat to share: the woodstove with 3+ nights of wood, or a generator with gas in the shed.':!hrs?'A daytime thing: 8 AM to 8 PM.':`3 hours. ${(U.wood||0)>=3?'Uses 1 night of firewood':'Uses 1 gallon of generator gas'}. Neighbors without heat come by. Reputation +10.`,fn:siWarming});}
    const gas=S.homeGas>=5,wood=(U.wood||0)>=2;
    a.push({cat:'here',ic:'🤲',l:D.share?'Shared with a neighbor who ran out ✓':'Share gas or firewood with a neighbor who ran out',dis:D.share||(!gas&&!wood),
      s:D.share?'They won’t forget it.':!gas&&!wood?'You need 5 gal of gas in the shed or 2 nights of firewood to spare.':`${gas?`5 gal of gas (${S.homeGas} in the shed)`:''}${gas&&wood?' or ':''}${wood?`2 nights of firewood (${U.wood} left)`:''}. Reputation +5.`,
      fn:()=>{if(gas&&wood)return modal('🤲 Share with a neighbor','<p>Somebody in the Island Group ran out. What can you spare?</p>',[
          {l:'⛽ 5 gallons of gas',s:`From the shed (${S.homeGas} gal).`,fn:()=>siShare('gas')},{l:'🪵 2 nights of firewood',s:`From the woodpile (${U.wood} nights).`,fn:()=>siShare('wood')},{l:'Not now',fn:()=>{}}]);
        siShare(gas?'gas':'wood')}});
    a.push({cat:'here',ic:'💵',l:D.sell?'Sold your spare gas ✓':'Sell your spare gas at storm prices: +$60',dis:D.sell||!gas,
      s:D.sell?'$60 richer. People remember.':!gas?'You need 5 gal in the shed.':'5 gal from the shed, $60 cash. People are desperate. They’ll remember who charged them.',fn:siSell});
  }
  if(side==='I'&&(d===3||d===4)){const lite=seasonLite(m);
    a.push({cat:'here',ic:'🪚',l:D.road?'Helped clear the road ✓':'Help clear the road with the chainsaw crew',dis:D.road||!lite,cls:D.road?'':'primary',
      s:D.road?'Your shoulders will remember.':!lite?seasonDark():`2 hours of hauling rounds. Health −3. Reputation +5.${S.week.siStorm.tree&&!I.storm.cleared?' There’s a big fir across the road by the lake.':''}`,fn:siRoad});
  }
}
// ---- the lights come back on ----
function siLightsBack(notes){const I=SI();if(I.storm.lights)return;I.storm.lights=true;
  if(S.power&&S.power.si)S.power=null;
  const n=I.storm.helped||0;S.story.flags.storm={helped:n};
  const line=n>=3?'Somebody posts a photo in the Island Group of the warming spot at your place. Forty-one likes.':n>=1?'Your phone buzzes with a few thank-yous from people you helped.':'You made it through. The island did too, mostly on its own.';
  siSay(`💡 <b>The lights come back on.</b> Saturday, a little before noon: the fridge shudders, the furnace kicks in, every clock in the house blinks 12:00. Up and down the road people cheer from their porches. ${line}`,notes);
  siSay('🏪 After the storm, the co-op flyer on the old store has a new line in marker: “3 days without a ferry. This is why.” Nobody has to explain it.',notes);
  try{showTile('💡','The lights come back on',n?`You helped ${n} time${n===1?'':'s'} in the storm`:'The storm is over','good')}catch(e){}
  siRecap(`🌬️ The storm of the decade knocked out the island’s power for two and a half days. ${n>=3?`You helped neighbors ${n} times.`:n?`You helped ${n===1?'once':'twice'}.`:'You rode it out on your own.'}`);
  if(!notes)modal('💡 The lights come back on',`<p>Two and a half days without power. The fridge hums, the well pump clicks on, and the road outside is lined with fir rounds.</p><p>${line}</p>`,[{l:'Lights!',fn:()=>{}}]);
}
// ---- the neighbors check on you, if they know you (reputation +20) ----
function siNeighborsHelp(notes){const I=SI(),U=UP();if(I.storm.nb)return;I.storm.nb=true;S.pantry+=1;U.wood=(U.wood||0)+2;U.limbs=Math.max(0,(U.limbs||0)-25);
  notes.push('🍲 The neighbors check on you too: a pot of soup on the porch with a note, an armload of dry firewood by the door, and a guy with a chainsaw who cuts up the limb that came down on your driveway before you’re even out of bed. (+1 day of food, +2 nights of wood)')}

// ======================= Beat 2: the co-op reopens the store =======================
const SI_PIE={wk:1,d:5,from:840,to:1020};       // chapter 0: Saturday of week 1, 2–5 PM at the Legion
const SI_MEET={wk:0,d:3,from:1110,to:1230,decide:1230};   // chapter 3: Thursday of week 0, 6:30–8:30 PM at the Legion
const SI_OPEN_KEY=1*7+5, SI_DEADLINE=3*7+5;     // reopening Saturday of week 1; last push until Saturday of week 3
const siKey=()=>S.weekNo*7+day();
function siCoopOpen(notes){const C=SI().coop;if(S.coop.open)return;S.coop.open=true;S.coop.openedWeek=S.weekNo;C.opened=true;syncCoop();S.story.flags.coopOpen=true;
  siSay('🎉 <b>The co-op is open!</b> The old General Store is the <b>Anderson Island Food Co-op</b> now: groceries on the shelves and gas in the pumps, run by islanders. The ribbon cutting is at 10 AM.',notes);
  try{showTile('🎉','The co-op is open!','Ribbon cutting at the store, 10 AM–noon','good')}catch(e){}
  siRecap('🏪 The co-op reopened the old General Store. Groceries and gas are back on the island.')}
function siCoopDecide(attended,notes){const C=SI().coop;if(C.decided)return;const tot=siFund(),goal=STORY_COOP_GOAL;
  if(tot>=goal){C.decided='go';C.openKey=SI_OPEN_KEY;
    siSay(`🏪 ${attended?'At the meeting, the treasurer':'The Island Group posts the meeting minutes: the treasurer'} reads the number twice to be sure: <b>${$(tot)} of ${$(goal)}</b>. The vote to reopen is unanimous. <b>Grand reopening: Saturday of next week</b>, ribbon cutting at 10 AM.`,notes);
    try{showTile('🏪','The co-op is reopening!','Saturday next week, 10 AM','good')}catch(e){}}
  else{C.decided='short';C.deadline=SI_DEADLINE;
    siSay(`🏪 ${attended?'At the meeting, the treasurer':'The Island Group posts the meeting minutes: the treasurer'} has the thermometer poster: <b>${$(tot)} of ${$(goal)}</b>, <b>${$(goal-tot)} short</b>. Nobody wants to wait another year. The board calls a <b>last push</b>: pledges until Saturday of the last week. If the fund makes it, the store opens that Sunday.`,notes);
    try{showTile('🏪',`Co-op: ${$(goal-tot)} short`,'Last push: pledges until Saturday, week 4','warn')}catch(e){}}}
function siMeeting(){const C=SI().coop;C.attended=true;S.t+=60;phoneTick();adj('stress',-3);
  say('🇺🇸 Folding chairs, a coffee urn and a hundred islanders in the Legion hall. Somebody’s grandkid runs the slideshow: freezers, the pump inspection, a delivery schedule that works around the ferry. People clap for the produce supplier.');
  repAdd(5,'came to the co-op members’ meeting');if(S.friends.walt)friendPts('walt',1);
  siCoopDecide(true);afterAction()}
function siRibbon(){const C=SI().coop,cut=repVal()>=60;C.ribbon=true;S.t+=60;phoneTick();adj('stress',-10);
  if(cut){C.cut=true;S.story.flags.coopRibbon=true;
    say('✂️ The board president hands you the big scissors. “Half the island said it should be you, {{name}}.” You cut the ribbon to a cheer you can hear from the ferry landing, and somebody rings the old bell over the door.');
    try{showTile('✂️','You cut the ribbon','The co-op is open','good')}catch(e){}}
  else say('🎉 A red ribbon across the door, a hundred islanders in the parking lot, and a cheer when the oldest member cuts it. The first sale is a gallon of milk and a lottery ticket. Someone cries at the gas pumps.');
  repAdd(3,'came out for the co-op’s grand reopening');afterAction()}
function siPie(){const C=SI().coop;C.pie=true;money(-10);S.coop.town+=300;S.t+=90;phoneTick();adj('stress',-6);
  say('🥧 The co-op pie social at the Legion: marionberry, rhubarb, and something called “ferry-line peach.” $10 a plate, a silent auction for a kayak, and a thermometer poster that gets colored in by the end of the afternoon: <b>+$300 to the co-op fund</b>.');
  if(S.friends.walt)friendPts('walt',1);else meet('walt','Walt from the American Legion','he cut your pie at the co-op social');
  repAdd(5,'came to the co-op pie social');afterAction()}
function siJoin(){const C=SI().coop;C.member=true;S.story.flags.coopMember=true;money(-25);S.coop.you+=25;S.t+=15;phoneTick();
  say('🪪 You sign up as a member of the Anderson Island Food Co-op: $25, a laminated card with member #'+(200+Math.floor(Math.random()*180))+' on it, and 5% off at the store once it opens.');
  try{repCoop()}catch(e){}repAdd(2,'joined the co-op');afterAction()}
function siPledge(){const tot=siFund(),C=SI().coop,goal=STORY_COOP_GOAL,opts=[25,100,250].filter(v=>S.money>=v);
  modal('🏪 Anderson Island Food Co-op',`<p>The fund is at <b>${$(tot)}</b> of <b>${$(goal)}</b>.${C.decided==='short'&&!C.reached?` <b>Last push: ${$(Math.max(0,goal-tot))} to go by Saturday.</b>`:' The store reopens in the spring, if the island gets there.'}</p>`,
    opts.map(v=>({l:`Pledge ${$(v)}`,fn:()=>{money(-v);S.coop.you+=v;adj('stress',-2);repCoop();say(`🏪 You pledge ${$(v)} to the co-op. Someone adds a star next to your name on the board.`);coopCheck();afterAction()}})).concat([{l:'Not now',fn:()=>{}}]))}
// story: never opens mid-chapter; during the last push, reaching the goal schedules a Sunday reopening;
// missing it by Saturday night of week 3 closes the book
function siCoopCheck(notes){if(siCh()!==3)return;const C=SI().coop;if(C.decided!=='short'||C.reached||C.failed)return;
  if(siFund()>=STORY_COOP_GOAL){C.reached=true;let k=S.weekNo*7+6,now=false;
    if(siKey()===k){if(notes&&S.weekNo<3)k+=7;else now=true}   // reached on a Sunday: open today (or next Sunday, if it's already night)
    C.openKey=k;
    siSay(`🎉 <b>The co-op made it!</b> The last-push thermometer is colored in to the top: ${$(siFund())} of ${$(STORY_COOP_GOAL)}. ${now?'The board unlocks the doors today.':'The store reopens <b>Sunday</b>, ribbon cutting at 10 AM.'}`,notes);
    try{showTile('🎉','The co-op made it!',now?'Opening today':'Reopening Sunday, 10 AM','good')}catch(e){}
    if(now)siCoopOpen(notes);return}
  if(notes&&siKey()>=SI_DEADLINE){C.failed=true;S.story.flags.coopOpen=false;
    notes.push(`🏪 The last push ends ${$(STORY_COOP_GOAL-siFund())} short. The board posts a note on the old store’s door: “Not this year. Every dollar stays in the fund, and so do we. Thank you, all of you.” Somebody has already drawn a new thermometer underneath.`);
    try{showTile('🏪','The co-op came up short','The store stays closed, for now','bad')}catch(e){}
    siRecap(`🏪 The co-op came up ${$(STORY_COOP_GOAL-siFund())} short. The store stays closed for now, and the fund carries on.`)}}
{const _cc=coopCheck;coopCheck=function(notes){if(!siOn())return _cc.apply(this,arguments);try{siCoopCheck(notes)}catch(e){console.error(e)}}}
// the week-done note shows the story goal
{const _wr=weekRollover;weekRollover=function(notes){const n0=notes?notes.length:0;const r=_wr.apply(this,arguments);
  if(siOn()&&notes)for(let i=n0;i<notes.length;i++)notes[i]=notes[i].split(`of ${$(COOP_GOAL)}.`).join(`of ${$(STORY_COOP_GOAL)}.`);return r}}
// the store's actions: the story pledge (toward $6,000), and the member discount once it opens
{const _ca=coopActions;coopActions=function(a){const n0=a.length;_ca.apply(this,arguments);if(!siOn())return;try{
  const C=SI().coop;
  for(let i=n0;i<a.length;i++){const x=a[i];
    if(/^Pledge to the co-op fund/.test(x.l)){const tot=siFund();a[i]=Object.assign({},x,{l:`Pledge to the co-op fund (${$(tot)} of ${$(STORY_COOP_GOAL)})`,
      s:C.decided==='short'&&!C.reached?`Last push: ${$(Math.max(0,STORY_COOP_GOAL-tot))} short, pledges until Saturday. You’ve pledged ${$(S.coop.you)}.`:`You’ve pledged ${$(S.coop.you)}. Neighbors chip in every night. The goal is the spring reopening.`,fn:siPledge})}
    else if(C.member&&/^Buy groceries: 3 days for \$60/.test(x.l)){const car=carHere();a[i]=Object.assign({},x,{l:'Buy groceries: 3 days for $57 (member price)',dis:!canEssential(57)||(!car&&S.carried+3>4),
      fn:()=>{money(-57);S.carried+=3;S.stats.food+=3;S.t+=15;say('🥫 Three days of groceries from the co-op, member price. The volunteer at the register knows your name now.');afterAction()}})}
    else if(C.member&&/^Fill up at the co-op pumps/.test(x.l)){const car=carHere(),need=Math.round((car.tank-car.fuel)*10)/10,pr=5.03;a[i]=Object.assign({},x,{l:`Fill up at the co-op pumps: $${Math.round(need*pr)} (member price)`,s:`$${pr}/gal with your member card. Gas on the island again!`,dis:need<0.5||S.money<need*pr,
      fn:()=>{money(-need*pr);car.fuel=car.tank;S.t+=10;say('⛽ You fill up on the island, member price. People are still taking photos of the pumps.');afterAction()}})}}
}catch(e){console.error(e)}}}
function siCoopActions(a){const ch=siCh(),C=SI().coop,m=tod(),k=siKey(),loc=S.loc;
  if(ch===0&&loc==='legion'&&S.weekNo===SI_PIE.wk&&day()===SI_PIE.d){
    if(C.pie) a.push({cat:'here',ic:'🥧',l:'Co-op pie social ✓',s:'You’re still full.',dis:true});
    else if(m<SI_PIE.from) a.push({cat:'here',ic:'🥧',l:'Co-op pie social at 2:00 PM',s:'Come back this afternoon, 2–5 PM.',dis:true});
    else if(m<SI_PIE.to) a.push({cat:'here',ic:'🥧',l:'Co-op pie social: $10',s:'90 min. Pie, a silent auction, and the whole fund thermometer. Raises $300 for the co-op. Reputation +5.',cls:'primary',dis:S.money<10,fn:siPie});
    else a.push({cat:'here',ic:'🥧',l:'The pie social is over',s:'Somebody is stacking chairs.',dis:true});
  }
  if(ch===1&&(loc==='store'||loc==='legion')&&!S.coop.open)
    a.push({cat:'here',ic:'🪪',l:C.member?'Co-op member ✓':'Join the co-op: $25 membership',s:C.member?'Your laminated card is in your wallet.':'Membership drive this fall. Members get 5% off at the co-op store once it opens, and the $25 goes into the fund.',cls:C.member?'':'primary',dis:C.member||S.money<25,fn:siJoin});
  if(ch===3&&loc==='legion'&&S.weekNo===SI_MEET.wk&&day()===SI_MEET.d){
    if(C.attended) a.push({cat:'here',ic:'🏪',l:'Co-op members’ meeting ✓',s:C.decided==='go'?'The store reopens Saturday next week.':'The last push is on.',dis:true});
    else if(m<SI_MEET.from) a.push({cat:'here',ic:'🏪',l:'Co-op members’ meeting: 7:00 PM',s:'Doors open at 6:30 PM. The board reports on the fund and votes on the reopening.',dis:true});
    else if(m<SI_MEET.to&&!C.decided) a.push({cat:'here',ic:'🏪',l:'Attend the co-op members’ meeting',s:`1 hour. The fund is at ${$(siFund())} of ${$(STORY_COOP_GOAL)}. Reputation +5.`,cls:'primary',fn:siMeeting});
    else a.push({cat:'here',ic:'🏪',l:'The co-op meeting is over',s:'The minutes are in the Island Group.',dis:true});
  }
  if(ch===3&&loc==='store'&&S.coop.open&&C.openKey===k){
    if(C.ribbon) a.push({cat:'here',ic:'🎀',l:C.cut?'You cut the ribbon ✓':'Grand reopening ✓',s:'The co-op is open.',dis:true});
    else if(m<600) a.push({cat:'here',ic:'🎀',l:'Ribbon cutting at 10:00 AM',s:'The grand reopening, 10 AM to noon.',dis:true});
    else if(m<720) a.push({cat:'here',ic:repVal()>=60?'✂️':'🎀',l:repVal()>=60?'Cut the ribbon: they asked for you':'Join the crowd at the ribbon cutting',s:repVal()>=60?'1 hour. The board wants an island regular to do the honors. Stress −10.':'1 hour. Cheers, coffee and the first sale. Stress −10.',cls:'primary',fn:siRibbon});
    else a.push({cat:'here',ic:'🎀',l:'The ribbon cutting is over',s:'Somebody framed the ribbon already.',dis:true});
  }
}

// ======================= wiring =======================
{const _actions=actions;actions=function(){const a=_actions();if(!siOn())return a;try{siStormActions(a);siCoopActions(a)}catch(e){console.error(e)}return a}}
{const _todo=todoItems;todoItems=function(){const it=_todo();if(!siOn())return it;try{const ch=siCh(),C=SI().coop,d=day(),k=siKey();
  if(siStormWeek()){const st=S.week.storm,x=it.find(i=>i.l==='Be ready for the storm');
    if(x&&st.day>d)x.s=`The storm of the decade, ${DAYS[st.day]} night: gusts over 70 mph, days without power and no ferry. You need a generator at home and 3 gal in the shed (${S.homeGas} now), or the fridge dies. Firewood, water jugs and a charged power bank help too.`;
    if(siStormNow())it.push({ok:(SI().storm.helped||0)>0,fail:false,l:'Optional: help your neighbors through the storm',s:`You’ve helped ${SI().storm.helped||0} time${SI().storm.helped===1?'':'s'}. The Hendersons, a warming spot, the road crew, a neighbor who ran out.`,urgent:false});}
  if(ch===0&&S.weekNo===SI_PIE.wk&&d<=SI_PIE.d)it.push({ok:!!C.pie,fail:d===SI_PIE.d&&tod()>=SI_PIE.to&&!C.pie,l:'Optional: the co-op pie social',s:'Saturday 2–5 PM at the American Legion Hall. $10 a plate, raises $300 for the co-op.',urgent:false});
  if(ch===1&&!C.member)it.push({ok:false,fail:false,l:'Optional: join the co-op ($25)',s:'At the old store or the Legion. Members get 5% off when it opens.',urgent:false});
  if(ch===3&&S.weekNo===0&&d<=SI_MEET.d)it.push({ok:!!C.attended,fail:!!C.decided&&!C.attended,l:'Co-op members’ meeting',s:`Thursday 7 PM, American Legion Hall. Fund: ${$(siFund())} of ${$(STORY_COOP_GOAL)}.`,urgent:d===SI_MEET.d&&!C.decided});
  if(ch===3&&C.decided==='short'&&!C.reached&&!C.failed)it.push({ok:false,fail:false,l:`Co-op last push: ${$(Math.max(0,STORY_COOP_GOAL-siFund()))} short`,s:'Pledge at the old store. The deadline is Saturday of the last week.',urgent:k>=SI_DEADLINE-1});
  if(ch===3&&C.openKey!=null&&(C.decided==='go'||C.reached)&&k<=C.openKey)it.push({ok:!!C.ribbon,fail:false,l:'The co-op’s grand reopening',s:`${DAYS[C.openKey%7]} ${C.openKey===k?'(today) ':''}10 AM–noon at the store.${repVal()>=60?' They want you to cut the ribbon.':''}`,urgent:k===C.openKey&&!C.ribbon});
}catch(e){console.error(e)}return it}}
// mornings: forecasts, reminders and the reopening
{const _sd=startDay;startDay=function(){const r=_sd.apply(this,arguments);if(!siOn())return r;try{const ch=siCh(),d=day(),C=SI().coop;
  if(ch===2&&S.weekNo===1&&S.week&&!S.week.siStorm){siStormBuild(S.week)}
  if(ch===2&&S.weekNo===0&&d===6&&typeof phoneInstalled==='function'&&phoneInstalled('weather')){say('📱 🌦️ <b>Tides & Weather</b>: the long-range models are lining up something big for <b>Wednesday night</b>. A deep low, a tight pressure gradient. Worth watching.');showTile('🌦️','A big storm on the models','Wednesday night','warn')}
  if(siStormWeek()){
    if(d===0){say('📻 <b>Heads-up:</b> the forecasters are calling Wednesday night’s storm “the storm of the decade”: gusts over 70 mph, the ferry likely to stop, and power out for days. Get gas for the generator, firewood, water and batteries now.');showTile('🌬️','The storm of the decade','Wednesday night: 70+ mph gusts','warn')}
    else if(d===1)say('📻 High wind warning confirmed for Wednesday night. The Island Group is all generator questions and photos of the bread aisle in Lakewood.');
    else if(d===2)say('🌬️ The storm hits tonight: <b>gusts over 70 mph</b>. The ferry stops at 6 PM and won’t run again until Thursday night. Expect the power to go out around 8 PM and stay out for days.');
    else if(d===3){say(`🌲 Thursday. The island is dark and quiet except for chainsaws. ${S.week.siStorm.tree?'A big fir is down across the road by the lake. ':''}No ferry until 10 PM, no power, and no store to walk to. Somebody tapes a note under the co-op flyer: “THIS IS WHY.”`)}
    else if(d===5&&S.t<SI_PWR.end)say('🔌 Puget Sound Energy says crews will have the island back on by about noon.');
  }
  if(ch===0&&S.weekNo===SI_PIE.wk&&(d===0||d===SI_PIE.d)&&!C.pie)say(`🥧 ${d===0?'Saturday':'Today'}: the co-op pie social at the American Legion Hall, 2–5 PM. $10 a plate. Every dollar goes to reopening the store.`);
  if(ch===1&&S.weekNo===0&&d===0)say('🪪 The co-op’s fall membership drive is on: $25 to join, 5% off at the store once it opens. Sign up at the old store or the Legion.');
  if(ch===3){
    if(S.weekNo===0&&(d===0||d===SI_MEET.d)&&!C.decided)say(`🏪 ${d===0?'Thursday':'Tonight'} at 7 PM: the co-op members’ meeting at the American Legion Hall. The fund is at ${$(siFund())} of ${$(STORY_COOP_GOAL)}.`);
    if(!C.decided&&S.weekNo>0)siCoopDecide(false);
    if(C.openKey!=null&&(C.decided==='go'||C.reached)&&siKey()>=C.openKey&&!S.coop.open)siCoopOpen();
    if(C.decided==='short'&&!C.reached&&!C.failed&&d===0)say(`🏪 Co-op last push: ${$(Math.max(0,STORY_COOP_GOAL-siFund()))} to go. Pledges at the old store until Saturday${S.weekNo<3?' of the last week':''}.`);
  }
}catch(e){console.error(e)}return r}}
// game time passing: the storm's power, the lights coming back, the meeting's result
phoneOnTime(function siTimed(){if(!siOn()||!S||S.over)return;const I=SI();
  if(siStormWeek()){
    if(S.t>=SI_PWR.start&&S.t<SI_PWR.end&&!(S.power&&S.power.si)){siPowerOn();if(!I.storm.out){I.storm.out=true;if(L[S.loc].side==='I')say('⚡ 8 PM: a blue flash over the trees, a bang, and the whole island goes dark. The wind is screaming in the firs.');try{showTile('⚡','The power is out','The whole island, for days','bad')}catch(e){}}}
    if(S.t>=SI_PWR.end&&I.storm.out&&!I.storm.lights)siLightsBack();
  }
  if(siCh()===3&&S.weekNo===0&&!I.coop.decided&&S.t>=SI_MEET.d*1440+SI_MEET.decide)siCoopDecide(false);
});
// nights: the generator through the long outage, the neighbors, the meeting if you skipped it
{const _up=upkeepNight;upkeepNight=function(where,notes,d){try{if(siOn()){const I=SI(),U=UP();
  if(siStormWeek()&&d>=3&&siPowerTonight(d)){
    if(runGenerator(where,2))notes.push(`🔌 ${d===3?'Second':'Third'} night without power. The generator burns 2 more gallons from the shed (${S.homeGas} left).`);
    else if(where==='home'){adj('stress',4);notes.push((U.wood||0)>0?`🕯️ ${d===3?'Second':'Third'} night without power. Candles, the woodstove and every blanket you own.`:`🥶 ${d===3?'Second':'Third'} night without power and nothing to heat with. You sleep in your coat.`)}}
  if(siStormWeek()&&d>=2&&d<=4&&where==='home'&&repVal()>=20)siNeighborsHelp(notes);
  if(siCh()===3&&S.weekNo===0&&d>=SI_MEET.d&&!I.coop.decided)siCoopDecide(false,notes);
}}catch(e){console.error(e)}return _up.apply(this,arguments)}}
// after the night: endDay's storm block sets a one-night outage; the storm of the decade lasts until Saturday noon
{const _ed=endDay;endDay=function(where){const r=_ed.apply(this,arguments);try{if(siStormWeek()&&!S.over){const I=SI();
  if(S.t>=SI_PWR.start&&S.t<SI_PWR.end&&!(S.power&&S.power.si)){siPowerOn();I.storm.out=true;render()}
  else if(S.t>=SI_PWR.end&&I.storm.out&&!I.storm.lights){siLightsBack();render()}}}catch(e){console.error(e)}return r}}

// ======================= the story framework hook =======================
const STORY_ISLAND_HOOK={id:'island',
  chapterStart(ch,notes){if(!siOn())return;const I=SI(),n=notes||[];
    if(ch===0)n.push(`🏪 The co-op’s big goal: <b>${$(STORY_COOP_GOAL)}</b> by spring to reopen the old General Store, with groceries and gas pumps. Neighbors chip in every night; pledge at the old store.`);
    if(ch===1)n.push('🪪 The co-op’s fall membership drive is on: $25 to join, 5% off once the store opens.');
    if(ch===3)n.push(`🏪 Spring: the co-op members meet Thursday night at the Legion to decide on the reopening. The fund is at ${$(siFund())} of ${$(STORY_COOP_GOAL)}.`);
    if(!notes)n.forEach(s=>say(s))},
  chapterEnd(ch,notes){if(!siOn())return;const I=SI(),n=notes||[];
    if(ch===2&&!I.storm.lights){S.story.flags.storm={helped:I.storm.helped||0};if(I.storm.out)siLightsBack(n)}
    if(ch<3)n.push(`🏪 Co-op fund: ${$(siFund())} of ${$(STORY_COOP_GOAL)}.`);
    if(ch===3&&S.story.flags.coopOpen==null)S.story.flags.coopOpen=!!S.coop.open},
  ending(flags){flags=flags||{};const out=[];
    if(flags.storm){const h=flags.storm.helped||0;
      out.push(h>=3?`🌬️ In the storm of the decade, you were the neighbor people still talk about: ${h} times you showed up for someone.`:h>=1?'🌬️ When the storm of the decade knocked the island dark, you showed up for a neighbor or two.':'🌬️ You rode out the storm of the decade behind your own front door.')}
    if(flags.coopOpen===true)out.push(`🏪 The co-op reopened the old General Store${flags.coopRibbon?', and you cut the ribbon':''}.${flags.coopMember?' Your member card gets you 5% off.':''} Groceries and gas are back on the island.`);
    else if(flags.coopOpen===false)out.push(`🏪 The co-op came up short this year and the store stays closed.${flags.coopMember?' You’re still a member, and':' But'} the fund carries on, and so does the island.`);
    return out}};
window.STORY_ISLAND_HOOK=STORY_ISLAND_HOOK;
if(typeof storyHooks!=='undefined')storyHooks.push(STORY_ISLAND_HOOK);
