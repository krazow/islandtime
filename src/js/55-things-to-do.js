// ---------------- 🎣 things to do on the island: fishing, crabbing, blackberries ----------------
// Small activities, each a short modal with a couple of choices and a bit of luck. They cost time, lower stress, and in
// visitor mode add a little to the visit score (vrepOnce). State lives in S.thx (made on demand, so old saves just work).
//   fishing  (the Riv marina)   a Washington fishing license ($20, once), then cast / wait / set the hook
//   crabbing (the Riv marina)   summer only, Thursday through Monday: set a pot, come back, pull it, keep or throw back
//   berries  (home, lake, swap board)  Himalayan blackberries once they ripen (mid-July on): eat, make jam, or sell
// Keeping a protected rockfish or an illegal crab is a deliberate bad act: small chance of a ticket (and a bad name).
function TX(){return S.thx||(S.thx={lic:0,fish:{dk:-9,n:0},pot:null,ownPot:false,berry:{n:0,dk:-9},pick:{dk:-9,n:0},gift:-9,crabKeep:{dk:-9,n:0},got:{fish:0,crab:0,berry:0,boot:0,fines:0},bingo:{dk:-9,n:0}})}
function thxFun(key,n){try{if(visitorOn())vrepOnce('thx-'+key,n||1,'got out and did something local')}catch(e){}}
const thxWpick=pairs=>{let t=0;for(const p of pairs)t+=p[1];let r=Math.random()*t;for(const p of pairs){r-=p[1];if(r<0)return p[0]}return pairs[pairs.length-1][0]};
const thxFriends=()=>Object.keys(S.friends||{}).sort((a,b)=>flv(b)-flv(a)).slice(0,2);
const thxName=id=>String((S.friends[id]||{}).name||id).split(',')[0].split(' from')[0].replace(/^the /,'The ');
function thxFood(n,why){if(visitorOn()||!n){say(`🍽️ ${why}: a fine dinner.`);return}S.pantry+=n;say(`🍽️ ${why}: +${n} day${n===1?'':'s'} of food.`)}
// give something to a friend: +friendship, and a little standing (once a day)
function thxGive(id,pts,what){friendPts(id,pts);say(`🎁 You drop ${what} off with ${thxName(id)}. They won’t hear of paying you.`);const T=TX();if(T.gift!==dayKey()){T.gift=dayKey();repAdd(2,`shared your ${what.replace(/^(a|an|the|some) /,'')} with a neighbor`)}}
function thxGiveBtns(pts,what,done){return thxFriends().map(id=>({l:`Give it to ${thxName(id)}`,s:'Friendship +'+pts+'. Island reputation +2 (once a day).',fn:()=>{thxGive(id,pts,what);done()}}))}
// calm: stress relief with diminishing returns through the day
const thxDay=()=>dayKey();
const thxLicTxt=()=>TX().lic?'You have a Washington fishing license (good all year).':'You need a Washington fishing license: $20 for the year, at the Riv’s bait counter.';

// ---- fishing ----
function fishSessions(){const F=TX().fish;return F.dk===thxDay()?F.n:0}
function fishSalmon(){const s=seasonId();return s==='summer'?['Chinook','a king salmon']:s==='fall'?['coho','a hatchery coho']:s==='winter'?['blackmouth','a blackmouth (winter chinook)']:null}
function fishOpen(){
  if(!TX().lic){return modal('🎣 You need a license',`<p>${thxLicTxt()} The WDFW officer who works the Sound doesn’t care how nice the day is.</p>`,[
    {l:'Buy a fishing license: $20',s:'Covers fishing and shellfish for the year.',dis:S.money<20,fn:()=>{money(-20);TX().lic=1;S.t+=5;say('🎣 A Washington fishing license, $20, printed on slightly damp paper. You pin it to your jacket.');afterAction()}},{l:'Not today',fn:()=>{}}])}
  const sal=fishSalmon();
  modal('🎣 Fishing off the marina',`<p>The dock creaks. Gulls, a heron, and the smell of low tide and old bait. ${sal?`Salmon are around: ${sal[1]} would be a good day.`:'Salmon are closed this time of year, but there’s always something down there.'}</p><p style="font-size:13px;color:var(--mute)">${fishSessions()?`You’ve fished ${fishSessions()} time${fishSessions()===1?'':'s'} today. `:''}How long do you want to stay out on the dock?</p>`,[
    {l:'A few casts: 30 min',s:'Free. Your own old spoon. Fewer bites.',fn:()=>fishGo(0)},
    {l:'Herring on a mooching rig: 1 hour, $4',s:'Better bait. Better odds.',dis:S.money<4,fn:()=>fishGo(1)},
    {l:'Settle in with a thermos: 2 hours, $4',s:'The best odds, and the best excuse to do nothing.',dis:S.money<4,fn:()=>fishGo(2)},
    {l:'Never mind',fn:()=>{}}]);
}
function fishGo(lv){
  const T=TX(),F=T.fish;if(F.dk!==thxDay()){F.dk=thxDay();F.n=0}
  const mins=[30,60,120][lv],cost=[0,4,4][lv];if(cost)money(-cost);S.t+=mins;phoneTick();F.n++;
  const bite=Math.random()<[0.55,0.75,0.9][lv];
  const calm=[8,5,2][Math.min(2,F.n-1)];
  const done=()=>{adj('stress',-calm);thxFun('fish',2);afterAction()};
  if(!bite){say(pick(['🎣 The float sits there. A seal surfaces thirty feet away, looks at you, and goes under again. Nothing bites.','🎣 You get a nibble, a lost bait, and a good long think about nothing. No fish.','🎣 Two hours of tide, one tangled line and not a single bite. It was lovely anyway.']));return done()}
  modal('🎣 Something’s on the line!',`<p>The rod tip bends. Whatever it is, it’s pulling.</p>`,[
    {l:'Set the hook now',s:'Steady. Better odds of landing it.',fn:()=>fishLand(lv,false,done)},
    {l:'Let it run a moment first',s:'A bigger fish, maybe, but it could spit the hook.',fn:()=>fishLand(lv,true,done)}]);
}
function fishLand(lv,wait,done){
  if(Math.random()>(wait?0.55:0.8)){say('🎣 The line goes slack. Whatever it was is gone, and so is your hook.');return done()}
  const sal=fishSalmon(),T=TX(),w=[['rock',14],['flounder',20],['perch',18],['pot',5],['boot',8]];
  if(sal)w.push(['salmon',(wait?26:18)+lv*4]);
  const k=thxWpick(w);
  if(k==='boot'){T.got.boot++;return modal('🥾 An old boot',`<p>It’s a rubber boot, left foot, size 11, full of the Sound. It’s been down there since before the new ferry schedule.</p>`,[{l:'Dump it in the Riv’s dumpster',fn:()=>{adj('stress',-1);say('🥾 Into the dumpster it goes. A guy at the marina calls it “the third one this year.”');done()}},{l:'Hang it on the marina’s boot tree',s:'There is a boot tree.',fn:()=>{adj('stress',-2);say('🥾 It joins eleven other boots on the piling by the ramp. A small plaque says “CATCH OF THE DAY.” You feel part of something.');done()}}])}
  if(k==='pot'){return modal('🪤 A derelict crab pot',`<p>It’s a rusty crab pot, tangled in lost line, and somebody’s float is still on it. Ghost gear like this keeps catching crabs long after anyone’s forgotten it.</p>`,[
    {l:'Haul it to the Riv for the derelict-gear program',s:'The right thing. Island reputation +3.',fn:()=>{repAdd(3,'turned in a derelict crab pot');say('🪤 The Riv’s manager logs it with a clipboard. “Good on you.”');done()}},
    {l:'Keep it: now you own a crab pot',s:'Saves the $8 rental every time you set one.',fn:()=>{T.ownPot=true;say('🪤 You scrub the barnacles off and strap it to the dock cart. Free pot.');done()}}])}
  if(k==='rock'){return modal('🐟 A rockfish',`<p>A copper rockfish, mottled brown and yellow, about a foot long, its eyes bulging from the trip up. <b>In Puget Sound, rockfish have to go back</b>: they live for decades, and the Sound’s populations have crashed.</p>`,[
    {l:'Release it gently',s:'It swims back down. Nothing to prove.',fn:()=>{adj('stress',-1);say('🐟 The rockfish flares its spines, then jets back into the dark. Somewhere, a biologist feels a flutter.');done()}},
    {l:'Keep it for dinner',s:'Illegal. Small chance somebody checks.',fn:()=>{
      if(Math.random()<0.15){money(-fineAmt(150));T.got.fines++;adj('stress',8);repAdd(-3,'got a ticket for keeping a protected rockfish');say('🚨 A WDFW officer walks down the dock with a clipboard. “Let me see that fish.” A $150 ticket, and the rockfish goes in his bucket.')}
      else{thxFood(2,'Pan-fried rockfish');say('🐟 Nobody checks. You eat it a little guiltily.')}
      done()}}])}
  const SP={salmon:[sal?sal[1]:'a salmon',3,'A silver flash against the green water, and it’s heavy.'],flounder:['a starry flounder',1,'Flat as a dinner plate, both eyes on one side, deeply unimpressed.'],perch:['a pile of shiner perch',1,'A bucketful of silver, hand-sized fish. Good fried whole.']}[k];
  T.got.fish++;const [nm,food,desc]=SP;
  modal(`🐟 You landed ${nm}!`,`<p>${desc}</p><p>${k==='salmon'?'That’s real dinner, with some to spare.':'A decent little catch.'}</p>`,[
    {l:`Cook it tonight: +${food} day${food===1?'':'s'} of food`,fn:()=>{thxFood(food,'Fresh '+(k==='salmon'?'salmon':'fish'));done()}}].concat(thxGiveBtns(k==='salmon'?3:2,nm,done)));
}

// ---- crabbing ----
function crabSeason(){const dt=gameDate(day()),m=dt.getMonth(),dm=dt.getDate();return seasonId()==='summer'&&m===6&&dm>=1&&day()!==1&&day()!==2}   // July, Thursday through Monday
function crabNow(){return dayKey()*1440+tod()}
function crabSoak(){const P=TX().pot;return P?crabNow()-P.at:0}
function crabSet(){
  const T=TX(),cost=T.ownPot?3:11;
  modal('🦀 Set a crab pot',`<p>Dungeness season: <b>keep males 6¼ inches or bigger</b> (measured across the shell), five a day. Females and undersized crabs go back, gently.</p><p>${T.ownPot?'You have your own pot.':'The Riv rents pots for $8.'} Bait is a chicken carcass: $3. Soak it for a few hours and come back to pull it.</p>`,[
    {l:`Set the pot: $${cost}`,s:'15 minutes. Then wander off.',dis:S.money<cost,fn:()=>{money(-cost);S.t+=15;phoneTick();T.pot={at:crabNow()};adj('stress',-1);thxFun('crab',1);say('🦀 You drop the pot off the end of the dock, bait bag clipped inside, and check the float one more time.');afterAction()}},
    {l:'Not now',fn:()=>{}}]);
}
function crabPull(){
  const T=TX(),soak=crabSoak();let n;
  const lost=soak>1800||(soak>1000&&Math.random()<0.35);
  S.t+=30;phoneTick();T.pot=null;
  if(lost){adj('stress',3);say('🦀 You haul up the line. Cut. Somebody’s prop, or a thief, or a very strong seal. The pot is gone and so is your deposit.');return afterAction()}
  n=Math.min(6,Math.floor(Math.max(0,soak/90)*(0.5+Math.random())));
  if(!n){adj('stress',-2);say('🦀 The pot comes up full of seaweed and one sulking sculpin. The bait bag is empty. Crabs are clever.');return afterAction()}
  const crabs=[...Array(n)].map(()=>({size:Math.round((5.25+Math.random()*2.25)*4)/4,male:Math.random()<0.55}));
  crabNext(crabs,0,[]);
}
const crabLegal=c=>c.male&&c.size>=6.25;
function crabNext(crabs,i,kept){
  if(i>=crabs.length)return crabEnd(kept);
  const c=crabs[i],T=TX(),K=T.crabKeep;if(K.dk!==thxDay()){K.dk=thxDay();K.n=0}
  const next=()=>crabNext(crabs,i+1,kept);
  modal(`🦀 Crab ${i+1} of ${crabs.length}`,`<p>A <b>${c.size}-inch ${c.male?'male':'female'}</b> Dungeness crab, claws up, furious.</p><p style="font-size:13px;color:var(--mute)">Rules: males 6¼ in. or bigger, five a day. You’ve kept ${K.n} today.</p>`,[
    {l:c.male?`Keep the ${c.size}-inch male`:'Keep the female',s:'Into the bucket.',fn:()=>{
      const bad=!crabLegal(c)||K.n>=5;K.n++;kept.push(c);T.got.crab++;
      if(bad&&Math.random()<0.15){money(-fineAmt(150));T.got.fines++;adj('stress',8);repAdd(-3,'got ticketed for keeping an illegal crab');say(`🚨 A WDFW officer has been watching from the end of the dock. “That one’s ${!c.male?'a female':c.size<6.25?'undersized':'over your limit'}.” $150, and the crab goes back.`);kept.pop()}
      else if(bad)say('🦀 You keep it. Nobody’s checking today, but you know.');
      next()}},
    {l:'Throw it back',s:'Gently, over the rail.',fn:()=>{say(`🦀 You ${c.male?'measure':'check'} it and let it go. It scuttles off sideways with its pride intact.`);next()}}]);
}
function crabEnd(kept){
  const n=kept.length,done=()=>{adj('stress',-6);afterAction()};
  if(!n){say('🦀 You return everything to the Sound. An empty bucket, a clear conscience, and a good story.');return done()}
  modal(`🦀 ${n} crab${n===1?'':'s'} in the bucket`,`<p>A pot of salted water, a stick of butter, newspaper on the table. ${n===1?'One crab':'The haul'} won’t last.</p>`,[
    {l:`Boil them: +${n} day${n===1?'':'s'} of food`,fn:()=>{thxFood(n,'Crab feast');done()}}].concat(thxFriends().slice(0,1).map(id=>({l:`Share a crab feast with ${thxName(id)}`,s:`+${Math.ceil(n/2)} day${n>2?'s':''} of food for you. Friendship +2.`,fn:()=>{thxFood(Math.ceil(n/2),'Your half of the crab feast');friendPts(id,2);say(`🦀 ${thxName(id)} brings the corn and the good butter. Newspaper everywhere.`);done()}})),[{l:'Eat one now, give away the rest',s:'Island reputation +2.',fn:()=>{thxFood(1,'One crab');if(n>1)repAdd(2,'gave crab away');done()}}]));
}

// ---- blackberries ----
function berryRipe(){if(seasonId()!=='summer')return 0;const dt=gameDate(day());if(dt.getMonth()===6&&dt.getDate()>=20||dt.getMonth()>=7)return 2;if(dt.getMonth()===6&&dt.getDate()>=13)return 1;return 0}
function berryN(){const B=TX().berry;if(dayKey()-B.dk>1)B.n=0;return B.n}
function berryOpen(where){
  const r=berryRipe(),P=TX().pick;
  modal('🫐 Blackberry picking',`<p>Himalayan blackberries have taken over every road shoulder, fence line and abandoned lot on the island. ${r===1?'The first ripe ones are just coming on.':'They’re thick and sweet and hanging in clusters.'}</p><p style="font-size:13px;color:var(--mute)">Bring a bucket, long sleeves and a high tolerance for thorns.${P.dk===thxDay()&&P.n?` Picked ${P.n} time${P.n===1?'':'s'} today.`:''}</p>`,[
    {l:'Along the roadside: 30 min',s:'Easy picking. A little dust, a few cars waving. Fewer berries.',fn:()=>berryGo(0)},
    {l:'Back in the thicket: 1 hour',s:'Loaded canes, tall brambles, and thorns that reach for you.',fn:()=>berryGo(1)},
    {l:'Never mind',fn:()=>{}}]);
}
function berryGo(spot){
  const T=TX(),P=T.pick;if(P.dk!==thxDay()){P.dk=thxDay();P.n=0}P.n++;
  S.t+=[30,60][spot];phoneTick();
  const ripe=berryRipe(),n=Math.max(1,Math.round(([1,2.4][spot])*(ripe===1?0.6:1)*(0.6+Math.random()*0.9)));
  const B=T.berry;if(dayKey()-B.dk>1)B.n=0;B.n+=n;B.dk=dayKey();T.got.berry+=n;
  adj('stress',-[4,5][spot]);thxFun('berry',1);
  let hurt='';if(Math.random()<[0.35,0.8][spot]){adj('health',-1);hurt=' Your forearms look like a cat fight.'}
  if(Math.random()<0.05){adj('stress',4);hurt+=' A wasp nest. You leave in a hurry.'}
  say(`🫐 ${n} bucket${n===1?'':'s'} of Himalayan blackberries, purple fingers and a good smell of sun on fruit.${hurt}`);
  afterAction();
}
function berryActions(a,loc){
  if(!['home','lake','store'].includes(loc)||seasonId()!=='summer')return;
  const r=berryRipe(),P=TX().pick,n=berryN();
  if(['home','lake'].includes(loc)){
    if(!r)a.push({cat:'here',ic:'🫐',l:'Blackberries aren’t ripe yet',s:'They’re green and red on the canes. Mid-July on.',dis:true});
    else if(!seasonLite(tod()))a.push({cat:'here',ic:'🫐',l:'Pick blackberries',s:seasonDark(),dis:true});
    else if(P.dk===thxDay()&&P.n>=2)a.push({cat:'here',ic:'🫐',l:'Picked out for today',s:'Your hands are purple and your arms are cross-hatched.',dis:true});
    else a.push({cat:'here',ic:'🫐',l:'Pick blackberries',s:'30–60 min. Fills the pantry a little, sells at the swap board, scratches a little. Stress −4.',fn:()=>berryOpen(loc)});
  }
  if(loc==='home'&&n>=2)a.push({cat:'here',ic:'🥧',l:`Make jam and cobbler (${n} bucket${n===1?'':'s'})`,s:'45 min. Uses 2 buckets: +1 day of food, stress −2.',fn:()=>{TX().berry.n-=2;S.t+=45;phoneTick();thxFood(1,'Blackberry cobbler and a jar of jam');adj('stress',-2);afterAction()}});
  if(loc==='store'&&n>0)a.push({cat:'trade',ic:'💵',l:`Sell blackberries at the swap board ($6 each, ${n})`,s:'Marker on a paper plate: “BERRIES, $6.” They go quickly.',fn:()=>{const k=n,p=k*6;TX().berry.n=0;money(p);S.t+=10;say(`💵 You leave ${k} bucket${k===1?'':'s'} on the swap board table. Somebody gets there first and leaves $${p} in a coffee can.`);afterAction()}});
}

// ---- the actions ----
function thxActions(a,loc){
  if(loc==='marina'){
    const T=TX(),lite=seasonLite(tod()),ses=fishSessions();
    if(!T.lic)a.push({cat:'here',ic:'🎫',l:'Buy a Washington fishing license: $20',s:'Good for the year. Covers fishing and shellfish.',dis:S.money<20,fn:()=>{money(-20);T.lic=1;S.t+=5;say('🎫 A Washington fishing license, $20, printed on slightly damp paper.');afterAction()}});
    a.push({cat:'here',ic:'🎣',l:'Go fishing off the dock',s:!T.lic?'You’ll need the $20 license first.':!lite?seasonDark():ses>=3?'The fish have stopped biting for today.':'30 min to 2 hours. Stress relief, and maybe dinner.',dis:!T.lic||!lite||ses>=3,fn:fishOpen});
    if(seasonId()==='summer'||T.pot){
      if(T.pot){const s=crabSoak();a.push({cat:'here',ic:'🦀',l:s>=60?'Pull your crab pot':'Your crab pot is soaking',s:s>=60?`It’s been down ${Math.floor(s/60)} h ${s%60} min. Longer is better, up to a point.`:'Give it an hour, at least.',dis:s<60,fn:crabPull})}
      else if(seasonId()==='summer')a.push({cat:'here',ic:'🦀',l:'Set a crab pot',s:!T.lic?'You’ll need the $20 license first.':!crabSeason()?'Dungeness season: July, Thursday through Monday.':'Dungeness season. Set it, wander off, come back in a few hours.',dis:!T.lic||!crabSeason()||(!lite),fn:crabSet});
    }
  }
  berryActions(a,loc);
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{thxActions(a,S.loc)}catch(e){console.error(e)}return a}}
// pots and berries from an earlier week don't carry into a new chapter of a story
if(typeof storyHooks!=='undefined')storyHooks.push({id:'thx',chapterStart(ch){if(ch>0&&S.thx){S.thx.pot=null;S.thx.berry={n:0,dk:-9};S.thx.fish={dk:-9,n:0};S.thx.pick={dk:-9,n:0};S.thx.crabKeep={dk:-9,n:0};S.thx.gift=-9;S.thx.bingo={dk:-9,n:0}}}});
