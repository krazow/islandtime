// ---------------- 🎆🎃🦃🎄 holidays on the island ----------------
// Real dates, from gameDate(day()) (the game's calendar: fall starts Nov 2 2026, winter Jan 4 2027, spring Apr 5 2027,
// summer Jun 29 2026; a week game is the first 7 days, a month game or a story chapter 28). Only holidays that fall
// inside the game happen:
//   Fourth of July   Sat Jul 4 (summer, week 1): parade, potluck, the BBQ and fireworks from 16-seasons, boats packed off the marina
//   Halloween        Oct 31: trunk-or-treat at the Legion hall (no season starts early enough to reach it: it fires if a calendar ever does)
//   Thanksgiving     Wed Nov 25 (the ferry crush) and Thu Nov 26 (a dinner invitation, or host the neighbors): fall month, week 4
//   Christmas        Fri Nov 27 on (tree lighting, decorations, a ferry-crew carol, ZooLights) through Jan 6, so fall week 4 and winter week 1
// Ferry crowding goes through seasonFull(). State is in S.hol (made on demand).
function HOL(){return S.hol||(S.hol={done:{},deco:0,pie:-9})}
function holWho(d){const dt=gameDate(d==null?day():d),m=dt.getMonth(),n=dt.getDate(),w=dt.getDay(),k=[];
  if(m===6&&n===4)k.push('july4');
  if(m===9&&n===31)k.push('halloween');
  if(m===10&&w===4&&n>=22&&n<=28)k.push('thanksgiving');
  if(m===10&&w===3&&n>=21&&n<=27)k.push('thanksEve');
  if(m===10&&w===5&&n>=23&&n<=29)k.push('blackFriday');
  if((m===10&&n>=27)||m===11||(m===0&&n<=6))k.push('xmas');
  return k}
const holIs=(k,d)=>{try{return holWho(d).includes(k)}catch(e){return false}};
const holDone=k=>HOL().done[k]===dayKey();
function holAnnounce(id,k,txt,atHome){defEvent({id,hook:'wake',priority:2,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&holIs(k),run(){say(txt())}})}
Object.assign(TILE_META,{hol_july4:['🎆','Fourth of July','info'],hol_halloween:['🎃','Halloween','info'],hol_thanks_eve:['🦃','Thanksgiving eve: the ferry crush','info'],hol_thanks:['🦃','Thanksgiving','info'],hol_blackfriday:['🎄','The tree lighting tonight','info'],hol_xmas_jan:['🎄','The lights are still up','info'],
  thanks_ferry:['🥧','A pie in the car line','good'],xmas_carol:['🎶','A carol on the ferry','good'],july4_boats:['🛥️','Packed boats on the Sound','info']});
holAnnounce('hol_july4','july4',()=>'🎆 <b>Fourth of July.</b> The Legion parade steps off from the school at <b>10:00 AM</b> (fire engines, a tractor, every kid on the island on a bike). The potluck at the Legion hall is 4 PM. Then the fireworks over the Sound around 10 PM, with every boat on the water anchored to watch.');
holAnnounce('hol_halloween','halloween',()=>'🎃 <b>Halloween.</b> The houses out here are too far apart for trick-or-treating, so the Legion hall holds <b>trunk-or-treat</b> in its parking lot, 5:00 to 7:30 PM. Costumes, candy and cars with their trunks decorated like haunted ferries.');
holAnnounce('hol_thanks_eve','thanksEve',()=>'🦃 <b>The Wednesday before Thanksgiving.</b> Every islander with family on the mainland, and every mainland family with someone on the island, is on the boats today. Expect full sailings, especially the afternoon ones, with pies on the dashboards. Tomorrow the ferry runs the holiday schedule.');
holAnnounce('hol_thanks','thanksgiving',()=>'🦃 <b>Thanksgiving.</b> The boats run on the holiday schedule and the island smells like turkey. The Legion hall serves a community dinner from 2 PM, and half the island has been invited to someone’s house.');
holAnnounce('hol_blackfriday','blackFriday',()=>'🎄 <b>The tree lighting.</b> The Legion lights the island’s big fir tonight at 5:30 PM: cocoa, carols and Santa on the fire truck. Over on the mainland, <b>ZooLights</b> opens tonight at Point Defiance, a million lights for a walrus.');
defEvent({id:'hol_xmas_jan',hook:'wake',priority:2,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&seasonId()==='winter'&&holIs('xmas')&&day()===0,run(){say('🎄 The Christmas lights are still up on half the island, and will be until somebody’s husband gets a ladder. The Legion’s “recycle your tree” pile at the school is already a small mountain.')}});

// ---- ferry crowding: the Wednesday before Thanksgiving and the Sunday after, the Fourth ----
function holCrowd(side,d,dep){const k=holWho(d),w=gameDate(d).getDay();let p=0;
  if(k.includes('thanksEve')){p=side==='M'?(dep>=800?0.72:dep>=555?0.4:0):(dep<=700?0.4:dep>=765?0.5:0)}
  else if(k.includes('blackFriday')&&side==='M'&&dep>=875)p=0.45;
  else if(w===0&&holIs('blackFriday',d-2)){p=side==='M'?(dep>=875?0.75:0):(dep>=765?0.4:0)}   // the Sunday after Thanksgiving
  else if(k.includes('july4')&&dep>=800)p=0.6;
  else if(k.includes('halloween')&&side==='M'&&dep>=1035)p=0.3;
  return p}
{const _f=seasonFull;seasonFull=function(p,side,d,dep){p=_f.apply(this,arguments);try{const c=holCrowd(side,d,dep);if(c>p)p=c}catch(e){}return p}}
// the 'full boat' note on the ferry tab and planner is built from fullProb, so it all lines up
defEvent({id:'thanks_ferry',hook:'arrive',priority:2,max:1,cond:ctx=>ctx.from==='ferry'&&holIs('thanksEve')&&(ctx.at==='aiDock'||ctx.at==='stDock'),chance:0.7,
  run(){adj('stress',2);modal('🥧 A pie in the car line',`<p>Pickups with turkeys in coolers, SUVs with dogs hanging out of the back and a minivan full of pies. A box slides off the roof rack of the car next to you, and a pumpkin pie lands face down on the ramp.</p>`,[
    {l:'Help scrape it up',s:'10 min. They give you a slice from the other pie.',fn:()=>{S.t+=10;adj('stress',-3);repAdd(2,'helped a family with a dropped pie');say('🥧 You scrape the pie off the pavement with a ferry ticket. “We have three more at home,” the mother says, and hands you a slice of the other one. Still warm.')}},
    {l:'Keep walking',fn:()=>{say('🥧 You decide it’s not yours to fix. Somebody else gets the napkins.')}}]);return {block:false}}});
defEvent({id:'xmas_carol',hook:'arrive',priority:2,max:1,cond:ctx=>ctx.from==='ferry'&&holIs('xmas')&&(ctx.at==='aiDock'||ctx.at==='stDock'),chance:0.6,
  run(){modal('🎶 The ferry crew sings',`<p>The deckhands are wearing Santa hats over their float coats. Halfway across, the captain’s voice comes over the PA: “Folks, we’re not supposed to do this, but it’s Christmas.” A tinny “Jingle Bells” starts up, led by a first mate who is clearly the one who can sing.</p>`,[
    {l:'Sing along',s:'Stress −5.',fn:()=>{adj('stress',-5);say('🎶 You sing every verse, off-key, in a car deck full of strangers who sing too. A deckhand hands out candy canes.')}},
    {l:'Smile and mouth the words',s:'Stress −2.',fn:()=>{adj('stress',-2);say('🎶 You stay in the car and just smile. A candy cane comes in through the window.')}}])}});
defEvent({id:'july4_boats',hook:'arrive',priority:2,max:1,cond:ctx=>ctx.from==='ferry'&&holIs('july4')&&tod()>=1000,chance:0.8,
  run(){adj('stress',-1);say('🛥️ From the upper deck you can see the whole Sound filling up: sailboats, cruisers, a tugboat with lawn chairs on the barge, and a million kayaks, all of them heading for a good seat for the fireworks.')}});

// ---- the day's activity windows (like the community calendar in 05) ----
function holWin(a,key,ic,name,from,to,acts){
  const m=tod();
  if(holDone(key))a.push({ic:'✅',l:`${name} ✓`,s:'You were there.',cat:'here',dis:true});
  else if(m<from)a.push({ic,l:`${name}: ${fmt(from)} today`,s:`Come back between ${fmt(from)} and ${fmt(to)}.`,cat:'here',dis:true});
  else if(m<=to)acts.forEach(x=>a.push(Object.assign({cat:'here'},x)));
  else a.push({ic,l:`${name} is over`,s:'Folding chairs are stacked. Next year.',cat:'here',dis:true});
}
const holMark=k=>{HOL().done[k]=dayKey()};
function holBuddy(id,name,how){if(S.friends[id])friendPts(id,2);else meet(id,name,how)}
function holActions(a,loc){
  const k=holWho();if(!k.length)return;
  const dk=dayKey(),m=tod(),res=!visitorOn();
  if(k.includes('july4')){
    if(loc==='legion'){
      holWin(a,'parade','🇺🇸','Fourth of July parade',600,690,[{ic:'🇺🇸',l:'Watch the Fourth of July parade',s:'90 min. Fire engines, tractors, a unicycle. Stress −6.',cls:'primary',fn:holParade}]);
      holWin(a,'potluck','🍽️','The Legion potluck',960,1110,[{ic:'🍽️',l:'Go to the Fourth of July potluck',s:'2 hours. Counts as dinner. Stress −8.',cls:'primary',fn:holPotluck}]);
    }
    if(loc==='marina'&&m>=1290&&m<1380){const X=SEAST();
      if(X.fw===dk)a.push({ic:'🎆',l:'Fireworks ✓',s:'Ooh. Aah.',cat:'here',dis:true});
      else a.push({ic:'🎆',l:'Watch the fireworks from the marina dock',s:'45 min. Boats are packed bow-to-stern, every horn goes off at the finale. Stress −12.',cat:'here',cls:'primary',fn:()=>{
        X.fw=dk;S.t+=45;phoneTick();adj('stress',-12);S.stats.fireworks=(S.stats.fireworks||0)+1;thxFun('fw',2);
        say('🎆 From the marina dock you’re ringed by boats: cruisers rafted three deep, a sailboat with a string of lights, a canoe with a glow stick. The whole Sound goes off at once at the finale, horns and cheers.');afterAction()}})}
  }
  if(k.includes('halloween')&&loc==='legion')holWin(a,'trunk','🎃','Trunk-or-treat',1020,1170,[{ic:'🎃',l:'Go to trunk-or-treat at the Legion hall',s:'90 min. Pick a costume. Stress −6.',cls:'primary',fn:holTrunk}]);
  if(k.includes('thanksgiving')){
    if(loc==='legion'&&m>=840&&m<=1050&&!holDone('thanks'))a.push({cat:'here',ic:'🦃',l:'Thanksgiving dinner',s:'Come to the Legion’s community dinner, or go to a friend’s. Stress −8 or so.',cls:'primary',fn:()=>holThanks('legion')});
    if(loc==='home'&&res&&m>=720&&m<=1140&&!holDone('thanks'))a.push({cat:'here',ic:'🦃',l:'Thanksgiving dinner',s:'Invitations, hosting, or a quiet dinner. Stress −8 or so.',cls:'primary',fn:()=>holThanks('home')});
    if(loc==='legion'&&holDone('thanks'))a.push({cat:'here',ic:'🦃',l:'Thanksgiving dinner ✓',s:'Full and sleepy.',dis:true});
  }
  if(k.includes('thanksEve')&&loc==='home'&&res&&HOL().pie!==dayKey()&&S.pantry>=1&&m<1260)
    a.push({cat:'here',ic:'🥧',l:'Bake a pie for tomorrow',s:'1 hour. Uses 1 day of food. A pie to bring: it’s the best present at any table.',fn:()=>{HOL().pie=dayKey();S.pantry-=1;S.t+=60;phoneTick();adj('stress',-2);say('🥧 Flour on the counter, a rolling pin you’ve never used and a pumpkin pie that comes out surprisingly well. You hide it from yourself until tomorrow.');afterAction()}});
  if(k.includes('blackFriday')&&loc==='legion')holWin(a,'tree','🎄','The tree lighting',1050,1140,[{ic:'🎄',l:'Go to the Legion tree lighting',s:'60 min. Cocoa, carols and Santa on a fire truck. Stress −7.',cls:'primary',fn:holTree}]);
  if(k.includes('xmas')&&loc==='home'&&res&&!HOL().deco&&m<1260)a.push({cat:'home',ic:'🎄',l:'Put up the Christmas lights and a tree: $20',s:'90 min. A real fir from the back lot, and lights on the porch. Home +4, stress −4.',dis:S.money<20,fn:()=>{money(-20);HOL().deco=1;S.t+=90;phoneTick();homeAdj(4);adj('stress',-4);say('🎄 A noble fir from the back lot, a box of lights from 2009 that mostly work and a string of cranberries. The cabin glows through the trees like a lantern.');afterAction()}});
  if(k.includes('xmas')&&loc==='tc_zoo'&&m>=990&&m<1290&&!holDone('zoolights'))a.push({cat:'here',ic:'✨',l:'ZooLights: $22',s:'2 hours. A million lights, a walrus in a Santa hat, hot cocoa. Stress −10.',dis:S.money<22,fn:()=>{money(-22);holMark('zoolights');S.t+=120;phoneTick();adj('stress',-10);thxFun('zoo',2);say('✨ A walk through a forest of lit-up animals: a whale made of 10,000 LEDs, a very proud peacock, and your breath in the cold. You stay for the second cocoa.');afterAction()}});
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{holActions(a,S.loc)}catch(e){console.error(e)}return a}}

// ---- Fourth of July ----
function holParade(){
  modal('🇺🇸 The parade',`<p>Folding chairs line the road from the school to the Legion. The Fire District engine leads off, then the school bus with the whole elementary school on top of it, then a tractor towing a hay wagon of Legion members, then a unicycle.</p>`,[
    {l:'Wave from the curb with a flag',s:'Easy. Stress −6.',fn:()=>{holMark('parade');S.t+=90;phoneTick();adj('stress',-6);holBuddy('walt','Walt from the American Legion','waved a flag next to him at the Fourth of July parade');thxFun('parade',2);say('🇺🇸 You wave a paper flag at a tractor. The tractor waves back. Walt, riding on the hay wagon in a Legion cap, salutes you.');afterAction()}},
    {l:'Join the parade on your bike',s:'Red, white and blue streamers. Stress −8, but it’s a gamble.',fn:()=>{holMark('parade');S.t+=90;phoneTick();thxFun('parade',2);
      if(Math.random()<0.65){adj('stress',-8);repAdd(3,'rode a streamered bike in the Fourth of July parade');say('🇺🇸 You fall in behind the unicycle, ringing your bell. The curb cheers. A little kid screams “BIKE GUY!”. It’s the best thing that’s happened all week.')}
      else{adj('stress',2);adj('health',-1);say('🇺🇸 A streamer jams in your spokes at the first corner and you fold into the ditch in front of the entire island. They applaud anyway. A scraped knee and a lesson learned.')}
      afterAction()}},
    {l:'Catch candy',s:'Kids are better at this. Stress −4.',fn:()=>{holMark('parade');S.t+=90;phoneTick();adj('stress',-4);thxFun('parade',1);say('🇺🇸 You catch eleven Tootsie Rolls and a Dum Dum, in competition with a seven-year-old who clearly has a system.');afterAction()}}]);
}
function holPotluck(){
  const dish=S.pantry>=1&&!visitorOn();
  modal('🍽️ The Legion potluck',`<p>Folding tables down the middle of the hall: three kinds of potato salad, deviled eggs in a tray with little dents, a crockpot of beans, a pie contest and a sheet cake shaped like the flag.</p>`,[
    {l:'Bring a dish from your pantry',s:dish?'Uses 1 day of food. Island reputation +3.':'You have no food to spare.',dis:!dish,fn:()=>{S.pantry-=1;holMark('potluck');S.t+=120;phoneTick();S.ateOut=day();S.ateOutAt='the Legion potluck';adj('stress',-8);repAdd(3,'brought a dish to the Fourth of July potluck');holBuddy('hendersons','the Hendersons','shared a table at the Fourth of July potluck');say('🍽️ You carry in a covered dish and set it between two other casseroles. By the end it’s empty. Somebody asks for the recipe, which is funny, because you made it up.');afterAction()}},
    {l:'Bring store-bought: $12',s:'A tray of cookies from the mainland. Nobody minds.',dis:S.money<12,fn:()=>{money(-12);holMark('potluck');S.t+=120;phoneTick();S.ateOut=day();S.ateOutAt='the Legion potluck';adj('stress',-7);holBuddy('hendersons','the Hendersons','shared a table at the Fourth of July potluck');say('🍽️ A tray of cookies, still in the plastic. They disappear anyway.');afterAction()}},
    {l:'Come empty-handed and put $10 in the jar',s:'The Legion’s donation jar. Island reputation +1.',dis:S.money<10,fn:()=>{money(-10);holMark('potluck');S.t+=120;phoneTick();S.ateOut=day();S.ateOutAt='the Legion potluck';adj('stress',-7);repAdd(1,'dropped $10 in the Legion jar');holBuddy('walt','Walt from the American Legion','handed you a plate at the Fourth of July potluck');say('🍽️ You eat three plates and put ten dollars in the jar. A volunteer promises it’s for the pie contest.');afterAction()}},
    {l:'Not now',fn:()=>{}}]);
}
// ---- Halloween ----
function holTrunk(){
  modal('🎃 Trunk-or-treat',`<p>Thirty cars are parked in a horseshoe in the Legion lot, trunks open: one is a haunted ferry, one is a pumpkin patch, one has a very serious skeleton in a lawn chair. The kids are dinosaurs, bees and one tiny Walt in a Legion cap. What are you wearing?</p>`,[
    {l:'A store-bought costume: $15',s:'A banana, from the Lakewood party store.',dis:S.money<15,fn:()=>{money(-15);holMark('trunk');S.t+=90;phoneTick();adj('stress',-6);repAdd(2,'came in costume to trunk-or-treat');thxFun('halloween',2);say('🎃 You’re a banana. A very tall child asks if you’re a minion. You’re handing out candy in a banana suit, and you’ve never been happier.');afterAction()}},
    {l:'Something homemade from the closet',s:'Free. A gamble: it might win the contest.',fn:()=>{holMark('trunk');S.t+=90;phoneTick();thxFun('halloween',2);
      if(Math.random()<0.3){money(20);adj('stress',-9);repAdd(4,'won the trunk-or-treat costume contest');say('🎃 A bedsheet, two flashlights and a ferry captain’s hat: “The Ghost of the 7:35.” You win Most Creative and $20 from the Legion jar.')}
      else{adj('stress',-5);say('🎃 A ferry deckhand, in your own float coat and a hat. People are confused but kind. A kid asks if you can find his dog.')}
      afterAction()}},
    {l:'Skip the costume, hand out candy: $6',s:'A bag of full-size bars. You’re the favorite trunk.',dis:S.money<6,fn:()=>{money(-6);holMark('trunk');S.t+=90;phoneTick();adj('stress',-4);repAdd(2,'handed out full-size candy bars');thxFun('halloween',1);say('🎃 Full-size bars. By 6:30 there’s a line, the kids are telling each other, and a parent asks if you’ll be here next year.');afterAction()}},
    {l:'Not now',fn:()=>{}}]);
}
// ---- Thanksgiving ----
function holThanks(where){
  const res=!visitorOn(),fr=thxFriends(),id=fr.includes('hendersons')?'hendersons':fr[0],pie=HOL().pie===dayKey()-1;
  const done=(txt)=>{holMark('thanks');say(txt);afterAction()};
  const btns=[];
  if(res&&id)btns.push({l:`Dinner at ${thxName(id)}’s`,s:`${pie?'Bring your pie. ':''}Free. Friendship +2. Stress −10.`,fn:()=>{S.t+=150;phoneTick();S.ateOut=day();S.ateOutAt=`Thanksgiving at ${thxName(id)}’s`;adj('stress',-10);friendPts(id,pie?3:2);repAdd(1,'');done(`🦃 ${thxName(id)} sets a place for you at a table that’s been extended with a card table and a door on sawhorses. ${pie?'Your pie is the first thing gone. ':''}Somebody says grace, somebody falls asleep in the recliner and everybody wins.`)}});
  btns.push({l:'The Legion’s community dinner',s:'Free. 80 islanders, folding tables, a turkey the size of a toddler. Stress −8.',fn:()=>{S.t+=120;phoneTick();S.ateOut=day();S.ateOutAt='the Legion Thanksgiving dinner';adj('stress',-8);repAdd(2,'came to the Legion’s Thanksgiving dinner');holBuddy('walt','Walt from the American Legion','carved the turkey at the Legion’s Thanksgiving dinner');thxFun('thanks',3);done('🦃 Walt carves, in his apron. Seventy-nine islanders and you pass the green bean casserole down a table of folding chairs. You’re stuffed, and for an hour there’s no ferry.')}});
  if(res&&where==='home'){
    const hostBtn=(l,s,dis,pay)=>({l,s,dis,fn:()=>{pay();S.t+=210;phoneTick();S.ateOut=day();S.ateOutAt='Thanksgiving at your place';adj('stress',-6);
      const g=fr.slice(0,3);let t;
      if(g.length){g.forEach(x=>friendPts(x,2));t=`🦃 ${g.map(thxName).join(', ')} come by with folding chairs and side dishes. The cabin has never been this loud or this warm.`}
      else{meet('bev','Bev the knitter','she came to your first Thanksgiving');meet('hendersons','the Hendersons','sat at your Thanksgiving table');t='🦃 You put a post up on the group page, and two neighbors you barely know come over with a green bean casserole. They stay till nine.'}
      repAdd(5,'hosted the neighbors for Thanksgiving');homeAdj(2);S.pantry+=2;done(t+' Leftovers: +2 days of food.')}});
    btns.push(hostBtn('Host: cook for the neighbors, $45 of groceries','3.5 hours. Friendship +2 each, reputation +5, leftovers. A little exhausting.',S.money<45,()=>money(-45)));
    btns.push(hostBtn('Host, from your pantry (3 days of food)','Same dinner, no cash. A lot of improvising.',S.pantry<3,()=>{S.pantry-=3}));
  }
  btns.push({l:'A quiet dinner at home',s:'Stress −2. Nobody needs you to talk.',fn:()=>{S.t+=60;phoneTick();adj('stress',-2);done('🦃 A frozen pie, a podcast and a window on the rain. Nobody asks you anything. It’s fine.')}});
  btns.push({l:'Not yet',fn:()=>{}});
  modal('🦃 Thanksgiving',`<p>The boats are on the holiday schedule and the smoke from a hundred chimneys sits flat over the firs. ${id&&res?`${thxName(id)} has already said you’re welcome at their table. `:''}The Legion hall is doing its community dinner. Where do you spend it?</p>`,btns);
}
// ---- the tree lighting ----
function holTree(){
  holMark('tree');S.t+=60;phoneTick();adj('stress',-7);thxFun('xmas',2);
  holBuddy('bev','Bev the knitter','she handed you a cocoa at the tree lighting');
  say('🎄 The big fir by the Legion goes on all at once, and the whole crowd goes “ooooh.” A deckhand from the ferry crew in a Santa hat leads two verses of “O Christmas Tree,” the fire truck pulls in with Santa on the ladder, and the cocoa is surprisingly good.');
  afterAction();
}
