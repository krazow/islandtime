// ---- wake (at home) ----
TILE_META.storm=['🌬️','Gale','bad'];
const atHomeWake=ctx=>S.loc==='home';
defEvent({id:'alarm_fail',hook:'wake',priority:10,cond:atHomeWake,run(){
  const late=55+Math.floor(Math.random()*60);S.t+=late;adj('stress',10);buzz([100,60,100]);
  say(`⏰ Your alarm clock never went off. The power blinked out overnight and reset it. It’s already <b>${fmt(S.t)}</b>.`);
  S.phoneT=S.t;
  modal('⏰ You overslept',`<p>The power went out overnight, and your plug-in alarm clock reset to blinking 12:00.${!S.alarm.phone.on?' A phone alarm as a backup would have saved you.':''}</p><p>It’s <b>${fmt(S.t)}</b>. ${(J=>J&&J.days.includes(day())?(S.emp==='lakewood'?'Work starts at 9:00 and the last boat that gets you there leaves at 7:35.':`Your shift starts at ${fmt(J.start)}.`):!J&&day()<5?'At least you don’t have a shift to make.':day()<5?'At least it’s your day off.':'At least it’s the weekend.')(curJob())}</p>`,[{l:'Go go go',fn:()=>{}}]);
}});
defEvent({id:'phone_died',hook:'wake',priority:10,cond:atHomeWake,run(){
  const late=60+Math.floor(Math.random()*50);S.t+=late;S.phoneT=S.t;adj('stress',10);buzz([100,60,100]);
  const why=S.power?'No power meant no charging, and':'You forgot to plug it in, and';
  say(`📵 ${why} your phone died around 4 AM. No alarm. It’s <b>${fmt(S.t)}</b>.`);
  modal('📵 Your phone died',`<p>${S.power?'The power was out all night, so your phone never charged.':'Your phone didn’t have enough battery to last the night.'} It died before the alarm could go off.${S.alarm.plug.on?' Your plug-in clock is blinking 12:00 from the outage too.':''}</p><p>It’s <b>${fmt(S.t)}</b>.</p>`,[{l:'Go go go',fn:()=>{}}])}});
defEvent({id:'phone_saves',hook:'wake',priority:10,cond:atHomeWake,run(){adj('stress',-3);say(S.alarm.plug.on?`📱 Your plug-in clock is blinking 12:00, but your phone alarm goes off right on time at ${fmt(S.t)}. Backups for the win.`:`📱 The power’s out, but your phone alarm goes off right on time at ${fmt(S.t)}. Good call.`)}});
defEvent({id:'backup_alarm',hook:'wake',priority:10,cond:atHomeWake,run(){adj('stress',-1);say(`⏰ You slept right through your phone’s chime, but the plug-in clock’s buzzer gets you up at ${fmt(S.t)}. That’s what backups are for.`)}});
defEvent({id:'no_alarm',hook:'wake',priority:10,cond:atHomeWake,run(){
  const late=50+Math.floor(Math.random()*50);S.t+=late;S.phoneT=S.t;adj('stress',8);
  say(`😴 You never set an alarm. You wake up on your own at <b>${fmt(S.t)}</b>.`)}});
defEvent({id:'gen_saves',hook:'wake',priority:9,cond:atHomeWake,run(){adj('stress',-4);say('🔌 The generator chugged all night: cold fridge, warm house, running water and a charged phone. The best money you ever spent.')}});
defEvent({id:'slept_through',hook:'wake',priority:10,cond:atHomeWake,run(){
  const late=20+Math.floor(Math.random()*25);S.t+=late;S.phoneT=S.t;adj('stress',6);say(`😴 You slept right through your phone’s gentle chime. It’s ${fmt(S.t)}.`)}});
defEvent({id:'no_water',hook:'wake',priority:6,cond:atHomeWake,run(){adj('stress',5);say('🚿 No power means no well pump, which means no shower. Hat day.')}});
defEvent({id:'garage_stuck',hook:'wake',priority:6,cond:atHomeWake,run(){S.ev.flags.garage=day();say('🚪 The garage door opener is dead. You’ll have to wrestle the manual release before you can drive.')}});
defEvent({id:'neighbor_ride',hook:'wake',priority:4,cond:ctx=>atHomeWake(ctx)&&!S.friends.sam,run(){
  modal('🚪 A knock at the door',`<p>It’s the new neighbor from the place with the blue roof. You’ve waved but never actually talked.</p><p>“Hi! I’m Sam.”</p><p>“{{name}},” you say, shaking hands.</p><p>“Power’s out at your place too? I’m headed down to the ferry if you need a ride.”</p>`,[
    {l:'Take the ride to the ferry landing',s:'Your car stays home. Sam will text when they’re leaving.',fn:()=>{meet('sam','Sam, your new neighbor','gave you a ride during an outage');S.ev.flags.samRide=day();adj('stress',-6);say('Sam will drive you to the ferry landing whenever you’re ready. Look for the 🤝 option.')}},
    {l:'“Thanks, I’m all set”',s:'You still made a new friend.',fn:()=>{meet('sam','Sam, your new neighbor','introduced themselves during an outage');adj('stress',-3)}}]);
}});
defEvent({id:'friend_coffee',hook:'wake',priority:3,cond:ctx=>atHomeWake(ctx)&&!!S.friends.sam,run(){adj('stress',-8);say('☕ Sam knocks with a thermos of coffee brewed on a camp stove. “Figured you didn’t have any either.”')}});
defEvent({id:'bingo_reminder',hook:'wake',priority:1,noScale:true,cond:()=>day()===2,chance:1,run(){say(`🎱 Tonight: <b>Bingo at the Riv</b>, 6:00 PM, hosted by the American Legion. Proceeds benefit the <b>${BINGO_FOR[S.week.bingo]}</b>.`)}});


// ---- bingo night (hook 'bingo': ctx.stage 'start'|'between', ctx.game = games played, ctx.cont() resumes) ----
const bingoDelay=n=>{S.bingo.delay+=n};
defEvent({id:'table_taken',hook:'bingo',priority:9,max:1,chance:0.45,cond:ctx=>ctx.stage==='start'&&S.bingo.reserved===day(),
  run(ctx){
    modal('🪧 Someone’s at your table',`<p>A family you don’t know has spread out daubers, a casserole dish and three coats across your table. The RESERVED tent is under somebody’s purse.</p>`,[
      {l:'Politely point out the reservation',s:'Could go either way.',fn:()=>{
        if(Math.random()<0.6){adj('stress',-2);say('🪧 “Oh gosh, we’re so sorry!” They pack up in a hurry and leave you a brownie as an apology.');}
        else{bingoDelay(10);adj('stress',6);say(`🪧 Awkward standoff. ${S.friends.walt?'Walt':'A Legion volunteer'} sorts it out by finding two more chairs. Game 1 starts 10 minutes late.`);}
        ctx.cont()}},
      {l:'Squeeze in with them',s:'Island hospitality.',fn:()=>{adj('stress',2);if(Math.random()<0.6)meet('hendersons','the Hendersons','shared your bingo table');say('🪧 You squeeze in. By game two they’re passing you their casserole.');ctx.cont()}},
      {l:'Take the last table, by the bathrooms',s:'No conflict. Bad seat.',fn:()=>{adj('stress',6);say('🪧 You set up next to the bathroom door. It swings open every 40 seconds.');ctx.cont()}}]);
    return {block:true};
  }});
defEvent({id:'no_seat',hook:'bingo',priority:8,max:1,chance:0.5,cond:ctx=>ctx.stage==='start'&&S.bingo.reserved!==day(),
  run(){adj('stress',4);say('🪑 No reservation, no table. You end up on a folding chair at the end of a long table, right under the speaker. B-4! B-4! B-4!')}});
defEvent({id:'bar_argument',hook:'bingo',priority:6,max:1,chance:0.3,cond:ctx=>ctx.stage==='between',
  run(ctx){
    const topic=pick(['whether the county will ever add a second ferry','who let their dog dig up the Historical Society’s flower bed','the right way to stack firewood','a parking spot at the ferry landing']);
    modal('🗯️ Trouble at the bar',`<p>Raised voices from the bar. Two guys are going at it about <b>${topic}</b>. The caller stops calling numbers.</p>`,[
      {l:'Stay out of it',s:'Wait it out.',fn:()=>{bingoDelay(10);adj('stress',3);say('🗯️ Ten minutes of shouting, then a Legion volunteer walks them both outside. Back to bingo.');ctx.cont()}},
      {l:'Help calm it down',s:S.friends.walt?'Walt’s got your back.':'Risky.',fn:()=>{
        if(S.friends.walt||Math.random()<0.5){adj('stress',-2);bingoDelay(5);say(`🗯️ ${S.friends.walt?'You and Walt':'You'} talk them down. The bartender slides you a free drink. The room gives you a small round of applause.`);}
        else{adj('stress',8);bingoDelay(12);say('🗯️ Both of them turn on you. Now it’s a three-way argument. A volunteer escorts everyone outside, including you, for a minute.');}
        ctx.cont()}},
      {l:'Pick a side',s:'You do have opinions.',fn:()=>{adj('stress',5);bingoDelay(8);if(Math.random()<0.5)meet('rusty','Rusty from the bar','agreed with him loudly about '+topic.split(' ').slice(0,4).join(' ')+'…');say('🗯️ You weigh in. Half the bar agrees with you, half doesn’t. The caller rings a cowbell until everyone sits down.');ctx.cont()}}]);
    return {block:true};
  }});
defEvent({id:'order_late',hook:'bingo',priority:5,max:1,chance:0.45,cond:ctx=>ctx.stage==='between'&&!!S.bingo.order,
  run(ctx){
    const what=S.bingo.order==='both'?pick(['your burger','your burger and your beer','your beer (the burger came, though)']):'your drink';
    modal('⏳ Still waiting…',`<p>Game ${ctx.game} is over and ${what} still hasn’t shown up. The kitchen and the bar are slammed: bingo night is the Riv’s busiest night of the week.</p>`,[
      {l:'Wait patiently',s:'It’ll come.',fn:()=>{adj('stress',3);say(`⏳ ${what[0].toUpperCase()+what.slice(1)} finally arrives during the next game. Worth the wait, mostly.`);ctx.cont()}},
      {l:'Flag down the server',s:'Politely.',fn:()=>{
        if(Math.random()<0.5){const c=S.bingo.orderCost||0;money(c);S.bingo.comped+=c;adj('stress',-2);say(`⏳ The server apologizes and comps it. ${$(c)} back. Island service.`);}
        else{adj('stress',5);say('⏳ “It’s coming, hon.” It is not coming. It comes two games later.');}
        ctx.cont()}}]);
    return {block:true};
  }});


// ---- Pajama Fred (hooks 'arrive' + 'bingo') ----
// A friendly island fixture in flannel pajama pants and slippers, whatever the weather. Knows everything about the boat.
const FRED_SPOTS={aiDock:'In the ferry line',store:'By the bulletin board outside the old store',food:'Out front of the Riv'};
function fredTip(){
  const soon=S.week.b.find(b=>b.start>S.t&&b.start<S.t+1440);
  if(soon&&(flv('fred')>=2||Math.random()<0.8)) return say(`🩴 Fred leans in: “Buddy of mine on the deck crew says there’s a ${soon.cause.split(' (')[0]} problem brewing. If I were you, I’d catch an early boat ${Math.floor(soon.start/1440)===day()?'today':'tomorrow'}.”`);
  say('🩴 Fred: “'+pick(['The 5:50 out of Steilacoom is never full. Nobody wants to be up that early.','Friday after three? Forget about driving on. Walk on or don’t go.','When the boat’s down, the fella with the sailboat runs people across. Tip him in diesel.','Sunday night everybody comes home at once. Plan around it.','Fog burns off by eleven. Usually. Mostly.'])+'”');
}
defEvent({id:'pajama_fred',hook:['arrive','bingo'],priority:2,max:3,cooldown:1,
  cond:ctx=>{const m=tod();if(m<360||m>=1320)return false;return ctx.hook==='bingo'?ctx.stage==='between':!!FRED_SPOTS[ctx.at]},
  chance:ctx=>ctx.hook==='bingo'?0.12:(S.friends.fred?0.09:0.06),
  run(ctx){
    const done=()=>{if(ctx.cont)ctx.cont()};
    const where=ctx.hook==='bingo'?'Between games, out on the Riv’s porch':FRED_SPOTS[ctx.at];
    const friend=!!S.friends.fred;
    const btns=[];
    if(S.cigs>0) btns.push({l:'Give him a cigarette',s:`You have ${S.cigs} left.`,fn:()=>{S.cigs--;adj('stress',-2);
      if(!meet('fred','Pajama Fred','you gave him a cigarette'))say('🩴 “You’re a good egg.” Fred tucks it behind his ear for later.');
      fredTip();done()}});
    btns.push({l:S.cigs>0?'“Not today, Fred”':friend?'“Sorry, Fred, I’m out”':'“Sorry, I don’t smoke”',s:S.cigs>0?'Keep the pack for yourself.':friend?'He’s used to it.':'Fair enough.',fn:()=>{
      if(friend||Math.random()<0.25){say('🩴 “No worries, no worries.” He lingers to chat anyway.');fredTip()}
      else say('🩴 “No worries! Have a good one.” He shuffles off in his slippers.');
      done()}});
    btns.push({l:'Give him a couple bucks instead',s:'$2',dis:S.money<2,fn:()=>{money(-2);adj('stress',-2);
      if(Math.random()<0.5&&meet('fred','Pajama Fred','you spotted him a couple bucks'));else say('🩴 “Hey, thanks. Appreciate you.”');
      fredTip();done()}});
    modal('🩴 Pajama Fred',`<p>${where}, a guy in flannel pajama pants, slippers and a rain jacket gives you a little wave. ${friend?'It’s your pal Fred.':'Everybody on the island seems to know him.'}</p><p>“Hey${friend?', {{name}}':''}! You wouldn’t happen to have a cigarette, would you?”</p>`,btns);
    return ctx.hook==='bingo'?{block:true}:{stop:true};
  }});


// ---- more island life (balance pass) ----
defEvent({id:'school_bus',hook:'tripMid',priority:2,max:2,cond:ctx=>{const m=tod();return islandCar(ctx)&&day()<5&&((m>=420&&m<=510)||(m>=900&&m<=960))},chance:0.25,
  run(ctx){ctx.add(4);say('🚌 You end up behind the island school bus, stopping at every driveway. A kid in the back window waves the whole way.')}});
defEvent({id:'oro_bay',hook:'tripMid',priority:0,max:2,cond:ctx=>L[ctx.from].side==='I',chance:0.03,
  run(ctx){ctx.add(5);adj('stress',-4);say('🌫️ You take the long way past Oro Bay. Mist on the water, a heron, and absolutely nobody else.')}});
defEvent({id:'garage_sale',hook:'tripMid',priority:3,max:1,cond:ctx=>islandCar(ctx)&&day()>=5&&tod()>=540&&tod()<=960,chance:0.25,
  run(ctx){
    const btns=[];
    if(!S.gen) btns.push({l:'Buy their old generator: $350',s:'Runs fine, they swear. Goes in your car.',dis:S.money<350,fn:()=>{money(-350);S.gen=ctx.car.id;say('🔌 A used generator, loaded into the car for $350. Drive it home to install it.');ctx.finish(15)}});
    btns.push({l:'A box of canned food: $15',s:'+1 food case.',dis:S.money<15,fn:()=>{money(-15);S.cargo.food++;say('🥫 A whole box of canned goods for $15. Somebody cleaned out their pantry.');ctx.finish(10)}});
    btns.push({l:'A phone battery pack: $10',s:'+40% phone battery right now.',dis:S.money<10,fn:()=>{money(-10);phoneTick();S.phone=Math.min(100,S.phone+40);say('🔋 A battery pack for $10. Your phone perks up.');ctx.finish(8)}});
    btns.push({l:'Just browse',s:'Old fishing floats, a bread machine, a box of National Geographics.',fn:()=>{adj('stress',-3);say('🏷️ You browse, chat, and leave with nothing. Lovely, though.');ctx.finish(12)}});
    modal('🏷️ Garage sale!',`<p>A hand-painted sign at the end of a driveway: <b>GARAGE SALE</b>. Folding tables, a coffee can for cash.</p>`,btns);
    return {block:true};
  }});
defEvent({id:'fire_pancakes',hook:'wake',priority:2,max:1,cond:ctx=>atHomeWake(ctx)&&day()===5,chance:0.6,
  run(){modal('🥞 Pancake breakfast',`<p>Fire District #27 volunteers are flipping pancakes at the fire station this morning, by donation.</p>`,[
    {l:'Go: $8 donation, about an hour',s:'Stress −8. Breakfast handled.',fn:()=>{money(-8);S.t+=60;phoneTick();adj('stress',-8);say('🥞 Pancakes, bad coffee, and a tour of the fire engine. You leave full and weirdly happy.')}},
    {l:'Skip it',fn:()=>{}}])}});
defEvent({id:'museum',hook:'arrive',priority:1,max:1,cond:ctx=>ctx.at==='store'&&day()>=3&&tod()>=600&&tod()<=960,chance:0.15,
  run(){adj('stress',-4);S.t+=20;say('🏛️ A Historical Society volunteer is out front with a box of old photos: early ferries, the island school, a cow on the ferry deck. You lose 20 minutes and don’t mind.')}});
defEvent({id:'line_cookie',hook:'arrive',priority:1,max:2,cond:ctx=>ctx.at==='aiDock'&&ctx.from!=='ferry',chance:0.06,
  run(){adj('stress',-2);say('🍪 The person in the car ahead of you in line walks back and hands you a homemade cookie. Island ferry lines are like that.')}});


// ---- friendship perks and favors ----
defEvent({id:'sam_groceries',hook:'wake',priority:3,max:1,noScale:true,cond:ctx=>atHomeWake(ctx)&&flv('sam')>=3&&day()>=2,chance:0.5,
  run(){S.pantry+=3;say('📦 Sam left a box on your porch: three days of groceries from his mainland run. “You’d do the same.”')}});
defEvent({id:'fish_fry',hook:'wake',priority:3,max:1,noScale:true,cond:ctx=>atHomeWake(ctx)&&flv('walt')>=3&&day()===4,chance:1,
  run(){S.ateOut=day();adj('stress',-6);say('🐟 Walt texts: “Fish fry at the Legion tonight. You’re on the list.” Dinner tonight is handled.')}});
defEvent({id:'henderson_dinner',hook:'wake',priority:3,max:1,cond:ctx=>atHomeWake(ctx)&&flv('hendersons')>=2&&day()>=5,chance:0.6,
  run(){modal('🍲 Dinner invitation','<p>The Hendersons wave you over: “Pot roast tonight. Six o’clock. Bring nothing.”</p>',[
    {l:'Go to dinner',s:'Tonight’s food is covered. Stress −8.',fn:()=>{S.ateOut=day();adj('stress',-8);friendPts('hendersons',1);say('🍲 Pot roast, three kinds of pie, and stories about the island in the ’70s.')}},
    {l:'Maybe next time',fn:()=>{}}])}});
defEvent({id:'fred_topoff',hook:'arrive',priority:2,max:1,noScale:true,cond:ctx=>ctx.at==='aiDock'&&flv('fred')>=3&&carHere()&&carHere().fuel<5&&!carHere().diesel,chance:0.5,
  run(){const c=carHere();c.fuel=Math.min(c.tank,c.fuel+3);say('🩴 Fred shuffles over with a red can. “From a friend.” Three gallons in your tank, no charge. Don’t ask.')}});
// favors: a friend asks you for something; finish it before it's due
const FAVORS={
  sam:{t:'pick up a bag of chicken feed at Home Depot ($22, he’ll pay you back)',at:'depot',buy:22,item:'chicken feed',back:'home',reward:32,label:'Drop off Sam’s chicken feed'},
  walt:{t:'mail a birthday card at the Steilacoom post office for his granddaughter',at:'stDock',label:'Mail Walt’s card in Steilacoom'},
  fred:{t:'bring him a coffee from the Riv',at:'food',buy:4,item:'coffee',back:'aiDock',label:'Bring Fred his coffee at the landing'},
  hendersons:{t:'return their casserole dish (it’s in your kitchen)',at:'store',label:'Return the Hendersons’ dish'},
  rusty:{t:'pick up a fishing lure at the Lakewood supermarket ($8)',at:'market',buy:8,item:'fishing lure',back:'food',reward:12,label:'Give Rusty his lure at the Riv'},
};
defEvent({id:'favor_ask',hook:'wake',priority:2,max:2,cond:ctx=>atHomeWake(ctx)&&day()<6&&Object.keys(S.friends).some(id=>FAVORS[id]&&!S.quests.some(q=>q.who===id&&!q.done)),chance:0.45,
  run(){
    const ids=Object.keys(S.friends).filter(id=>FAVORS[id]&&!S.quests.some(q=>q.who===id&&!q.done));const id=pick(ids),F=FAVORS[id],who=S.friends[id].name.split(',')[0];
    modal(`🙏 ${who} needs a favor`,`<p>${who} asks if you could ${F.t}. Within the next two days, if you can.</p>`,[
      {l:'Sure, happy to help',s:'Builds the friendship.',fn:()=>{S.quests.push({who:id,step:F.buy?'buy':'go',due:day()+2,done:false});say(`🙏 You told ${who} you’d ${F.t.split(' (')[0]}.`)}},
      {l:'Sorry, not this week',fn:()=>{say(`${who} says no worries. Mostly means it.`)}}]);
  }});
function favorActions(a,loc){
  (S.quests||[]).filter(q=>!q.done).forEach(q=>{const F=FAVORS[q.who],who=S.friends[q.who]?S.friends[q.who].name.split(',')[0]:'a friend';
    if(q.step==='buy'&&loc===F.at) a.push({ic:'🛍️',l:`Buy ${F.item} for ${who}: $${F.buy}`,s:`Favor for ${who}. Due ${DAYS[q.due]}.`,cat:'here',dis:S.money<F.buy,fn:()=>{money(-F.buy);q.step='deliver';S.t+=10;say(`🛍️ Got the ${F.item}. Now get it to ${who}.`);afterAction()}});
    else if(q.step==='deliver'&&loc===F.back) a.push({ic:'🎁',l:F.label,s:`They’ll pay you back $${F.reward}.`,cat:'here',cls:'primary',fn:()=>{q.done=true;money(F.reward);S.t+=10;adj('stress',-3);friendPts(q.who,2);repAdd(5,`did ${who} a favor`);say(`🎁 ${who} is thrilled. “You’re the best.”`);afterAction()}});
    else if(q.step==='go'&&loc===F.at) a.push({ic:'🎁',l:F.label,s:`Favor for ${who}. Due ${DAYS[q.due]}.`,cat:'here',cls:'primary',fn:()=>{q.done=true;S.t+=10;adj('stress',-3);friendPts(q.who,2);repAdd(5,`did ${who} a favor`);say(`🎁 Done. ${who} will be happy.`);afterAction()}});
  });
}

// ---- island life: community calendar and friend story arcs ----
Object.assign(TILE_META,{veterans_day:['🇺🇸','Veterans Day at the Legion','info'],craft_bazaar:['🎄','Holiday craft bazaar today','info'],lake_cleanup:['🗑️','Lake cleanup day','info'],fire_drill:['🚒','Fire District drill tonight','info'],
  bev_bread:['🍞','Zucchini bread from Bev','good'],arc_sam:['⛵','Sam’s boat project','info'],arc_walt:['🧢','Walt’s grandson','info'],arc_hendersons:['💍','The Hendersons’ fiftieth','info']});
PERKS.bev={2:'Bev knocks $5 off anything on her bazaar table.',3:'Bev leaves zucchini bread on your porch now and then.'};
// community calendar: d = day of week; ok() = which week (month mode) or a roll (week mode)
const LIFE_CAL={
  vet:{d:2,ok:()=>S.mode==='month'&&S.weekNo===1},                 // Wed Nov 11
  bazaar:{d:5,ok:()=>S.mode==='month'?S.weekNo>=2:bazaarWeek()},   // Sat Nov 21 + 28 (week mode: 60%)
  cleanup:{d:6,ok:()=>S.mode==='month'?S.weekNo===1:true},         // Sun Nov 15 (week mode: Sun Nov 8)
  drill:{d:3,ok:()=>S.mode==='month'?S.weekNo===2:true},           // Thu Nov 19 (week mode: Thu Nov 5)
};
function bazaarWeek(){const C=S.cal;if(C.bzWk!==S.weekNo){C.bzWk=S.weekNo;C.bz=Math.random()<0.6}return !!C.bz}
const lifeToday=k=>day()===LIFE_CAL[k].d&&LIFE_CAL[k].ok()&&(seasonId()==='fall'||k==='cleanup'||k==='drill'); // season: Veterans Day and the holiday bazaar are November-only
defEvent({id:'veterans_day',hook:'wake',priority:1,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&lifeToday('vet'),
  run(){say(`🇺🇸 <b>Veterans Day</b>, ${dateTxt(day())}. The American Legion holds its ceremony at <b>11:00 AM</b> by the flagpole outside the Riv: colors, the names, and a bugler who’s been practicing since October. Coffee after.`)}});
defEvent({id:'craft_bazaar',hook:'wake',priority:1,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&lifeToday('bazaar'),
  run(){say('🎄 <b>Holiday craft bazaar</b> today, 10 AM to 3 PM at the American Legion hall. Wreaths, jam, knitted everything. Cash preferred, exact change worshipped.')}});
defEvent({id:'lake_cleanup',hook:'wake',priority:1,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&lifeToday('cleanup'),
  run(){say('🗑️ <b>Lake cleanup day.</b> Volunteers meet at Lake Josephine between 8 and 11 AM with grabbers and contractor bags, then work their way around the shore. Coffee provided. Gloves BYO.')}});
defEvent({id:'fire_drill',hook:'wake',priority:1,max:1,noScale:true,chance:1,cond:ctx=>atHomeWake(ctx)&&lifeToday('drill'),
  run(){say('🚒 Fire District #27 runs a volunteer drill tonight at <b>6:30 PM</b>, at the station up the road from the old store. They’re short on hands and will happily take yours.')}});
defEvent({id:'bev_bread',hook:'wake',priority:2,max:1,chance:0.35,cond:ctx=>atHomeWake(ctx)&&flv('bev')>=3,
  run(){S.pantry+=1;say('🍞 A foil-wrapped loaf on the porch with a note: “Too much zucchini. Again. —Bev.” +1 day of food.')}});
// one community event's status at its place: upcoming, open (acts), over, or done
function lifeSlot(a,key,ic,name,from,to,acts){
  if(!lifeToday(key)) return;
  const m=tod();
  if(S.cal[key]===dayKey()) a.push({ic:'✅',l:`${name} ✓`,s:'You were there. People will remember that, or at least your face.',cat:'here',dis:true});
  else if(m<from) a.push({ic,l:`${name}: ${fmt(from)} today`,s:`Come back between ${fmt(from)} and ${fmt(to)}.`,cat:'here',dis:true});
  else if(m<=to) acts.forEach(x=>a.push(Object.assign({cat:'here'},x)));
  else a.push({ic,l:`${name} is over`,s:'Folding chairs are already stacked. Next year.',cat:'here',dis:true});
}
function lifeBuddy(ids){return ids.filter(id=>S.friends[id])}
function lifeActions(a,loc){
  const k=dayKey(),C=S.cal;
  if(loc==='food') lifeSlot(a,'vet','🇺🇸','Veterans Day ceremony',660,700,[{ic:'🇺🇸',l:'Attend the Veterans Day ceremony',s:'About an hour at the flagpole with the Legion. Stress −6.',cls:'primary',fn:()=>{
    C.vet=k;S.t+=60;phoneTick();adj('stress',-6);repAdd(5,'showed up for the Veterans Day ceremony');
    if(S.friends.walt){friendPts('walt',2);say('🇺🇸 Walt reads the names in his Legion cap, without his glasses, from memory. Afterward he pours you a coffee and doesn’t say much. He doesn’t have to.')}
    else{meet('walt','Walt from the American Legion','you stood together at the Veterans Day ceremony');say('🇺🇸 Thirty islanders, one flag, one bugler who nails it. The old guy next to you in the Legion cap introduces himself as Walt and hands you a coffee.')}
    afterAction()}}]);
  if(loc==='legion'){
    const off=flv('bev')>=2?5:0,price=25-off;
    lifeSlot(a,'bazaar','🎄','Holiday craft bazaar',600,900,[
      {ic:'🎄',l:`Buy a cedar wreath at the bazaar: $${price}`,s:`An hour at the Legion hall. A gift to your own front door. Home +3, stress −4.${off?' Bev’s discount.':''}`,cls:'primary',dis:S.money<price,fn:()=>{
        C.bazaar=k;money(-price);S.t+=60;phoneTick();homeAdj(3);adj('stress',-4);repAdd(5,'bought a wreath at the holiday bazaar');
        say('🎄 A cedar wreath with a pinecone the size of your fist. The cabin smells like a Christmas tree lot that also has a woodstove.');lifeBev();afterAction()}},
      {ic:'🧶',l:'Just browse the bazaar',s:'30 min. Free samples of fudge. Stress −2.',fn:()=>{C.bazaar=k;S.t+=30;adj('stress',-2);repAdd(5,'came out for the holiday bazaar');say('🧶 You admire a hat knitted to look like a geoduck and leave with fudge on your fingers.');if(Math.random()<0.5)lifeBev();afterAction()}}]);
  }
  if(loc==='lake'){
    lifeSlot(a,'cleanup','🗑️','Lake cleanup',480,660,[{ic:'🗑️',l:'Volunteer at the lake cleanup',s:'2 hours with a grabber and a bag. Stress −4.',cls:'primary',fn:()=>{
      C.cleanup=k;S.t+=120;phoneTick();adj('stress',-4);repAdd(5,'the lake cleanup');
      say('🗑️ Two tires, a lawn chair, nine golf balls and a 1987 Rainier can come out of the shallows. The eagles supervise.');
      const b=lifeBuddy(['hendersons','sam','rusty','bev']);
      if(b.length){const id=pick(b);friendPts(id,2);say(`🗑️ ${S.friends[id].name.split(',')[0].replace(/^the /,'The ')} works the bag next to you the whole way around Lake Josephine.`)}
      else meet('hendersons','the Hendersons','you hauled a shopping cart out of Lake Josephine together');
      afterAction()}}]);
  }
  if(loc==='store') lifeSlot(a,'drill','🚒','Fire District drill',1050,1110,[{ic:'🚒',l:'Join the volunteer fire drill',s:'90 min at the Fire District #27 station. Hoses, ladders, cocoa. Stress −3, health +2.',cls:'primary',fn:()=>{
    C.drill=k;S.t+=90;phoneTick();adj('stress',-3);adj('health',2);repAdd(5,'the volunteer fire drill');
    if(S.friends.rusty){friendPts('rusty',2);say('🚒 Rusty, stone sober in turnout gear, shows you how to roll a hose. Who knew.')}
    else{meet('rusty','Rusty from the bar','he showed you how to roll a fire hose at the drill');say('🚒 A guy you’ve only ever seen at the Riv’s bar turns out to be a volunteer firefighter. Rusty. He shows you how to roll a hose.')}
    if(S.up&&!C.chim){C.chim=true;S.up.chimney=0;say('🏚️ On the way out, the captain says “you’re the cedar cabin back in the woods, right?” and two volunteers follow you home to check your chimney. They sweep it while they’re up there. No charge, just don’t burn wet wood.')}
    afterAction()}}]);
}
function lifeBev(){if(S.friends.bev)friendPts('bev',1);else if(Math.random()<0.6)meet('bev','Bev the knitter','she talked you through her wreaths at the craft bazaar')}

// friend story arcs: 3 beats each, S.arcs[id] = {b: beats done, k: dayKey of the last beat, h: times you helped}
// beat 1: once you know them (a day later); beat 2: good friend or week 3; beat 3: close friend or week 4. At least 2 days apart, one arc beat a day.
function arcReady(id){
  const A=S.arcs[id],f=S.friends[id];if(!A||!f||A.b>=3) return false;
  if(S.arcs.day===dayKey()||dayKey()-A.k<2) return false;
  if(A.b===0) return f.day!==day()||S.weekNo>0;
  if(A.b===1) return flv(id)>=2||S.weekNo>=2;
  return flv(id)>=3||S.weekNo>=3;
}
function arcBeat(id){const A=S.arcs[id];A.b++;A.k=dayKey();S.arcs.day=dayKey();return A}
const arcNo=(who,line)=>({l:'Not now',s:line,fn:()=>say(`${who}: “${line}”`)});
defEvent({id:'arc_sam',hook:'wake',priority:2,max:3,chance:0.6,cond:ctx=>atHomeWake(ctx)&&arcReady('sam'),
  run(){const A=arcBeat('sam');
    if(A.b===1) modal('⛵ Sam’s boat project','<p>Sam is at your door with two coffees and a photo of a 14-foot wooden skiff. “Bought her off a guy at Oro Bay for two hundred bucks and a chainsaw. She has character.”</p><p>The character is mostly rot.</p>',[
      {l:'Help scrape the hull: 1 hour',s:'Stress −3. Sam +1.',fn:()=>{A.h++;S.t+=60;phoneTick();adj('stress',-3);friendPts('sam',1);say('⛵ An hour with a putty knife in Sam’s carport. You find three layers of paint and one of hope.')}},
      arcNo('Sam','No rush. She’s not going anywhere. Literally.')]);
    else if(A.b===2) modal('⛵ Sam’s boat, part two','<p>“She needs marine sealant and new oarlocks,” Sam says. “Twenty-five bucks gets her watertight. Or an hour of sanding, if you’re broke too.”</p>',[
      {l:'Chip in $25',s:'Sam +2.',dis:S.money<25,fn:()=>{A.h++;money(-25);friendPts('sam',2);say('⛵ Sam writes “{{name}}: $25” on the transom in pencil. “Investor.”')}},
      {l:'Sand for an hour',s:'Stress −2, Sam +1. Your shoulders will hear about it.',fn:()=>{A.h++;S.t+=60;phoneTick();adj('stress',-2);adj('health',-1);friendPts('sam',1);say('⛵ An hour of sanding. You are now 40% sawdust.')}},
      arcNo('Sam','I’ll find the money. Somewhere. Probably the couch.')]);
    else modal('⛵ Launch day','<p>Sam texts a photo of the skiff on a trailer at the Oro Bay ramp. “She floats. Probably. Come watch?”</p>',[
      {l:'Go to the launch: 1 hour',s:A.h?'Stress −10. Sam +2. Bring a towel.':'Stress −6. Sam +1.',fn:()=>{S.t+=60;phoneTick();
        if(A.h){adj('stress',-10);friendPts('sam',2);S.pantry+=2;say(`⛵ She floats. Sam has painted <b>${A.h>=2?'THE {{name}}':'THE RELUCTANT'}</b> on the bow. The first trip out comes back with a cooler of fish, and two days of dinners go in your freezer.`)}
        else{adj('stress',-6);friendPts('sam',1);say('⛵ She floats. Sam rows a lap, takes on a little water, and declares victory.')}}},
      arcNo('Sam','I’ll send video. If she sinks, it’ll be a good one.')]);
  }});
defEvent({id:'arc_walt',hook:'arrive',priority:2,max:3,chance:0.5,cond:ctx=>['food','aiDock','store','lake','home'].includes(ctx.at)&&tod()>=540&&tod()<=1230&&arcReady('walt'),
  run(){const A=arcBeat('walt');
    if(A.b===1) modal('🧢 Walt’s grandson','<p>Walt flags you down. “My grandson Tyler’s coming over from Tacoma for a few days. Sixteen. Lives on his phone. What do kids even <i>do</i> here?”</p>',[
      {l:'Offer to show Tyler around: 30 min',s:'Stress −2. Walt +2.',fn:()=>{A.h++;S.t+=30;phoneTick();adj('stress',-2);friendPts('walt',2);say('🧢 You show Tyler the eagles at Lake Josephine. He takes 80 photos and admits, quietly, that it’s “kind of sick.”')}},
      {l:'Suggest the eagles at Lake Josephine',s:'Free advice. Walt +1.',fn:()=>{A.h++;friendPts('walt',1);say('🧢 “Eagles. Huh. Kid likes birds of prey in video games.” Walt writes it down.')}},
      arcNo('Walt','Fair enough. I’ll buy him a fishing pole and hope.')]);
    else if(A.b===2) modal('🧢 Tyler and the woodpile','<p>Walt and Tyler pull up in the Legion pickup. “Kid wants to learn to split wood. I’ve got a bad shoulder and you’ve got a woodpile.”</p>',[
      {l:'Teach him: 1 hour',s:'Your woodpile grows. Stress −3, Walt +1.',fn:()=>{A.h++;S.t+=60;phoneTick();adj('stress',-3);const U=UP();U.wood=Math.min(14,(U.wood||0)+4);homeAdj(2);friendPts('walt',1);say('🪓 Tyler splits four nights of firewood and asks zero questions about the Wi-Fi.')}},
      arcNo('Walt','Next time. He’ll be back. He keeps saying he’ll be back.')]);
    else modal('🧢 Tyler’s send-off','<p>Walt is a little misty. “Tyler wrote his history paper on my unit. Got an A. The Legion’s doing a potluck send-off tonight before he catches the boat. You’re invited.”</p>',[
      {l:'Go to the send-off: 1 hour, $10 for the kitty',s:'Dinner handled. Stress −8, Walt +2.',dis:S.money<10,fn:()=>{S.t+=60;phoneTick();money(-10);S.ateOut=day();adj('stress',-8);friendPts('walt',2);
        if(A.h>=2){S.phone=100;S.phoneT=S.t;say('🧢 Tyler hands you his spare battery pack, fully charged. “For when the power goes out. Grandpa says it always does.” Your phone is at 100%.')}
        else say('🧢 Three kinds of casserole, one speech, and Walt pretending he has something in his eye.')}},
      arcNo('Walt','I’ll tell him you said so long.')]);
    return {stop:true};
  }});
defEvent({id:'arc_hendersons',hook:'wake',priority:2,max:3,chance:0.6,cond:ctx=>atHomeWake(ctx)&&arcReady('hendersons')&&(S.arcs.hendersons.b<2||day()>=5),
  run(){const A=arcBeat('hendersons');
    if(A.b===1) modal('💍 The Hendersons’ fiftieth','<p>Mrs. Henderson calls over the fence. “Fifty years at the end of the month! We’re having folks to the clubhouse. Could you help me address invitations? My hands aren’t what they were.”</p>',[
      {l:'Help with invitations: 45 min',s:'Stress −2. Hendersons +1.',fn:()=>{A.h++;S.t+=45;phoneTick();adj('stress',-2);friendPts('hendersons',1);say('💍 Forty-one envelopes. Half the addresses are just “the blue house past the lake.” The mail carrier will know.')}},
      arcNo('The Hendersons','Oh, don’t you worry. I’ll make Dale do it.')]);
    else if(A.b===2) modal('💍 About the cake','<p>“We wanted a bakery cake from Lakewood,” Mr. Henderson says, “but have you seen what they charge for the ferry? Chip in and we’ll get a sheet cake. Frosting’s frosting.”</p>',[
      {l:'Chip in $20',s:'Hendersons +2.',dis:S.money<20,fn:()=>{A.h++;money(-20);friendPts('hendersons',2);say('💍 “Put your name on the card,” Mrs. Henderson insists. “Right under the grandkids.”')}},
      {l:'Bake them something: 1 hour',s:'Uses 1 day of food. Stress −3, Hendersons +2.',dis:S.pantry<1,fn:()=>{A.h++;S.pantry--;S.t+=60;phoneTick();adj('stress',-3);friendPts('hendersons',2);say('💍 Your banana bread comes out lopsided. Mr. Henderson says lopsided is how you know it’s homemade.')}},
      arcNo('The Hendersons','We’ll manage. We always have. Fifty years of managing.')]);
    else modal('💍 Fifty years','<p>The anniversary brunch is this morning at the clubhouse. Half the island is coming, and somebody’s nephew brought a fiddle.</p>',[
      {l:'Go to the brunch: 90 min',s:'Stress −12. Hendersons +2. Leftovers likely.',fn:()=>{S.t+=90;phoneTick();adj('stress',-12);S.pantry+=1;friendPts('hendersons',2);
        if(A.h>=2){homeAdj(4);say('💍 They slow-dance to the fiddle. On the way out they press a framed photo of the ferry landing in 1976 into your hands. “For your wall.” And a foil brick of ham.')}
        else say('💍 Toasts, a fiddle, and a foil brick of ham and cake for the road.')}},
      {l:'Send a card instead',s:'They’ll understand. Mostly.',fn:()=>{friendPts('hendersons',0);say('💍 You leave a card in their mailbox. Mrs. Henderson waves it at you later, delighted.')}}]);
  }});

// ---- trip start (can block) ----
defEvent({id:'dead_battery',hook:'tripStart',priority:10,max:3,
  cond:ctx=>ctx.mode==='car'&&ctx.from==='home'&&ctx.car&&!ctx.o.started,
  // the car's own battery: a weak one is a gamble; an old island car is more likely to die on a cold, dark morning than a newer one
  chance:ctx=>{const c=ctx.car,old=!(typeof visitorOn==='function'&&visitorOn())&&(c.id==='isl'||c.id==='beat');   // a visitor's or regular's own car is newerreturn carBat(c)==='weak'?0.3:(S.power?(old?0.2:0.08):(old?(c.id==='beat'?0.08:0.06):0.015))},
  run(ctx){deadBattery(ctx,false);return {block:true}}});
function deadBattery(ctx,triedNeighbor){
  const dest=ctx.to,base=dist(ctx.from,dest);S.stats.deadBattery=(S.stats.deadBattery||0)+1;
  const car=ctx.car,cn=carShortName(car);
  const resume=(extra,msg)=>{S.t+=extra;setCarBat(car,'weak');if(msg)say(msg);go(dest,Object.assign({},ctx.o,{started:true}))};
  const btns=[];
  if(S.friends.sam) btns.push({l:'Text Sam for a jump',s:'About 10 minutes.',fn:()=>resume(10,'🔋 “Morning, {{name}}.” Sam pulls up in a bathrobe with jumper cables. The '+cn+' coughs to life.')});
  else if(!triedNeighbor) btns.push({l:'Knock on the new neighbor’s door',s:'You’ve never actually met them.',fn:()=>{
    if(Math.random()<0.65){meet('sam','Sam, your new neighbor','jump-started your car');resume(20,'🔋 The new neighbor, Sam, digs out jumper cables. “Welcome to island cars.”')}
    else{S.t+=12;say('Nobody answers next door. Their car’s gone.');deadBattery(ctx,true);render()}}});
  if(S.friends.walt) btns.push({l:'Call Walt from the Legion',s:'He always has cables. 25 minutes.',fn:()=>resume(25,'🔋 Walt shows up in his Legion cap with a jump pack and a story about 1979.')});
  btns.push({l:`Walk to ${L[dest].name}`,s:`${Math.round(base*4)} min. The car stays here.`,fn:()=>go(dest,{m:'walk',min:Math.round(base*4),started:true})});
  btns.push({l:'Stand by the road and hitch',s:'Maybe.',fn:()=>go(dest,{m:'hitch',min:base+15,started:true})});
  buzz(120);adj('stress',8);
  modal('🔋 Click. Click. Nothing.',`<p>You turn the key and the dash lights flicker. The ${cn}’s battery is dead${S.power?' (the cold, dark night didn’t help)':''}.</p><p>There’s no auto parts store, tow truck or jump service on the island.${carBat(car)==='weak'?' This battery is clearly on its way out. Replace it at the gas station in Steilacoom.':''}</p>`,btns);
}

// ---- trip middle ----
const islandCar=ctx=>ctx.mode==='car'&&L[ctx.from].side==='I';
defEvent({id:'garage_release',hook:'tripMid',priority:9,cond:ctx=>islandCar(ctx)&&ctx.from==='home'&&S.ev.flags.garage===day(),chance:1,
  run(ctx){S.ev.flags.garage=-1;ctx.add(8);say('🚪 You yank the garage door’s manual release and heave it up by hand. +8 minutes.')}});
defEvent({id:'tree_down',hook:'tripMid',priority:5,max:2,cond:ctx=>L[ctx.from].side==='I',
  chance:()=>(powerOut()||(S.week.storm&&S.week.storm.day===day()))?0.3:0.03,
  run(ctx){ctx.add(15);adj('stress',4);say('🌲 A fir is down across the road. You detour the long way around the lake. +15 minutes.')}});
defEvent({id:'flat_tire',hook:'tripMid',priority:4,max:1,cond:islandCar,chance:ctx=>0.035*(ctx.from==='home'?(UP().pot>=60?4:UP().pot>=35?2:1):1),
  run(ctx){const c=ctx.car;if(c&&carMech(c).spare==='on'){const tow=275,ok=canEssential(tow);if(ok)money(-tow);ctx.add(ok?100:150);adj('stress',12);S.stats.towed=(S.stats.towed||0)+1;
      say(ok?`🛞 Thump-thump-thump. Another flat, and the ${carShortName(c)} is already on its donut. The tow truck rides the ferry over from Lakewood and plugs it on the shoulder: ${$(tow)}. +1 h 40 min.`
            :`🛞 Another flat, already on the donut, and no money for the tow. A neighbor with a compressor and a plug kit gets you rolling after a long wait. +2 h 30 min.`);if(!ok)c.spare='on';else c.spare='ok';return}
    if(c)c.spare='on';ctx.add(20);adj('stress',6);say(`🛞 Thump-thump-thump. A flat. You change the ${c?carShortName(c):'car'} over to its donut spare on the gravel shoulder. +20 minutes. Get a new tire before the next one.`)}});
defEvent({id:'stranded_neighbor',hook:'tripMid',priority:3,max:1,cond:ctx=>islandCar(ctx)&&!S.friends.walt,chance:0.07,
  run(ctx){
    modal('🚩 Someone’s waving you down',`<p>An older man in an American Legion cap stands next to a pickup with the hood up.</p><p>“Battery’s dead. Got cables?”</p>`,[
      {l:'Pull over and help',s:'+15 minutes. Island karma.',fn:()=>{friendPts('walt',1);meet('walt','Walt from the American Legion','you jump-started his truck');adj('stress',-2);say('Walt shakes your hand. “You come to bingo Wednesday, {{name}}. First card’s on me.”');ctx.finish(15)}},
      {l:'Wave and keep going',s:'You have a boat to catch.',fn:()=>{adj('stress',4);say('You wave. You feel bad about it all day.');ctx.finish(0)}}]);
    return {block:true};
  }});
defEvent({id:'deer',hook:'tripMid',priority:1,cond:islandCar,chance:0.12,run(ctx){ctx.add(4);say('🦌 A doe and two fawns stroll across the road and stare at you. You wait.')}});
defEvent({id:'eagle',hook:'tripMid',priority:0,cond:ctx=>L[ctx.from].side==='I',chance:0.03,run(){adj('stress',-3);say('🦅 A bald eagle lifts off a snag right over the road. Okay, island. You win this round.')}});

// ---- bingo at the Riv ----
function bingoCard(){const cols=[];for(let c=0;c<5;c++){const pool=[];for(let n=c*15+1;n<=c*15+15;n++)pool.push(n);const col=[];for(let i=0;i<5;i++)col.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);cols.push(col)}cols[2][2]=0;return cols}
function hasLine(card,called){const m=(c,r)=>card[c][r]===0||called.has(card[c][r]);
  for(let i=0;i<5;i++){let row=true,col=true;for(let j=0;j<5;j++){if(!m(j,i))row=false;if(!m(i,j))col=false}if(row||col)return true}
  let a=true,b=true;for(let i=0;i<5;i++){if(!m(i,i))a=false;if(!m(i,4-i))b=false}return a||b}
function bingoGame(mine,others){
  const balls=[...Array(75)].map((_,i)=>i+1);for(let i=74;i>0;i--){const j=Math.floor(Math.random()*(i+1));[balls[i],balls[j]]=[balls[j],balls[i]]}
  const called=new Set();
  for(const b of balls){called.add(b);const w=mine.filter(c=>hasLine(c,called));const t=others.filter(c=>hasLine(c,called)).length;if(w.length||t)return {called,ball:b,winners:w,others:t}}
}
const ballName=n=>'BINGO'[Math.floor((n-1)/15)]+'-'+n;
function cardHTML(card,called){
  let h='<table style="border-collapse:collapse;margin:6px auto 10px;font-variant-numeric:tabular-nums"><tr>'+[...'BINGO'].map(L=>`<th style="width:42px;height:28px;background:var(--sound);color:#fff;font-family:Fraunces">${L}</th>`).join('')+'</tr>';
  for(let r=0;r<5;r++){h+='<tr>';for(let c=0;c<5;c++){const n=card[c][r],hit=n===0||called.has(n);
    h+=`<td style="width:42px;height:38px;text-align:center;border:1px solid var(--line);font-weight:700;${hit?'background:#e3642e;color:#fff;border-radius:50%':''}">${n===0?'★':n}</td>`}h+='</tr>'}
  return h+'</table>';
}
const BINGO_GAMES=[{n:'Regular',pot:40},{n:'Regular',pot:40},{n:'Early Bird Special',pot:50},{n:'The Big One',pot:100}];
function playBingo(cards,price){
  if(S.friends.walt)friendPts('walt',1);if(S.friends.rusty)friendPts('rusty',1);
  money(-price);S.bingo.nights++;S.bingo.cards+=cards;S.bingo.donated+=Math.round(price*0.5);
  S.t=Math.max(S.t,day()*1440+1080);
  const free=S.friends.walt&&!S.ev.flags.waltCard?1:0;if(free)S.ev.flags.waltCard=1;
  const mine=[...Array(cards+free)].map(bingoCard);const others=[...Array(34)].map(bingoCard);
  const crowd=Math.round(34*12/3+price);
  let gi=0,won=0;
  S.bingo.order=null;S.bingo.delay=0;S.bingo.comped=0;S.bingo.playing=day();
  // the 'bingo' hook: stage 'start' (before game 1) and 'between' (after games 1-3)
  const between=(stage,cont)=>{const r=fireHook('bingo',{stage,game:gi,cont});if(!(r&&r.block))cont()};
  const order=(what,cost)=>{money(-cost);S.bingo.order=what;S.bingo.orderCost=cost;if(what==='both')S.ateOut=day();
    if(what)say(what==='both'?'🍔 You order a burger and a beer from the Riv’s kitchen.':'🍺 You order a drink.');
    between('start',next)};
  const next=()=>{
    if(gi>=BINGO_GAMES.length){
      S.t=day()*1440+1080+150+S.bingo.delay;adj('stress',-14);if(S.friends.sam)adj('stress',-4);
      S.bingo.won+=won;S.bingo.playing=-1;S.ev.history.push({id:'bingo',t:S.t});
      const raised=crowd+Math.round(Math.random()*120);
      say(`🎱 Bingo night ${won?`paid off: you won <b>${$(won)}</b>`:'was a bust, but a fun one'}. The Legion raised about ${$(raised)} for the ${BINGO_FOR[S.week.bingo]}.`);
      return modal('🎱 That’s a wrap',`<p>${won?`You walk out <b>${$(won)}</b> richer.`:'No wins tonight.'} The American Legion announces tonight raised about <b>${$(raised)}</b> for the <b>${BINGO_FOR[S.week.bingo]}</b>.</p><p>${S.friends.walt?'Walt':'Someone'} is already stacking chairs. ${S.friends.sam?'Sam drives you home.':'You know half the room by name now.'}</p>`,(won?[{l:`Donate your ${$(won)} to the ${BINGO_FOR[S.week.bingo]}`,s:'The room cheers. Island reputation +5.',fn:()=>{money(-won);S.bingo.won-=won;S.bingo.donated+=won;say(`🎱 You hand your ${$(won)} back to the Legion for the ${BINGO_FOR[S.week.bingo]}. Walt salutes.`);repAdd(5,'donated your bingo winnings');afterAction()}}]:[]).concat([{l:won?'Keep it and head home':'Head home',fn:()=>{afterAction()}}]));
    }
    const g=BINGO_GAMES[gi++],res=bingoGame(mine,others);sfx(res.winners.length?'win':'ball');const n=res.winners.length+res.others;
    let prize=0,msg;
    if(res.winners.length){prize=Math.round(g.pot*res.winners.length/n);won+=prize;money(prize);msg=`<b style="color:var(--good);font-size:20px">BINGO!</b> You win ${$(prize)}${n>1?` (split ${n} ways)`:''}.`;buzz([60,40,60,40,200])}
    else msg=pick(['A woman two tables over yells BINGO. So close.','“BINGO!” from the back. The room groans.','A kid at the Booster Club table wins it. Everyone claps.','You needed one more. Of course you did.']);
    const show=res.winners[0]||mine.slice().sort((a,b)=>[...b.flat()].filter(x=>res.called.has(x)).length-[...a.flat()].filter(x=>res.called.has(x)).length)[0];
    modal(`🎱 Game ${gi} of ${BINGO_GAMES.length}: ${g.n} · ${$(g.pot)} pot`,`<p style="text-align:center;margin:0">Last ball: <b style="font-size:20px">${ballName(res.ball)}</b> · ${res.called.size} called</p>${cardHTML(show,res.called)}<p style="text-align:center">${msg}</p><p style="font-size:12px;color:var(--mute);text-align:center">You have ${mine.length} card${mine.length>1?'s':''}${free?' (one courtesy of Walt)':''}. About ${others.length} other cards in play.</p>`,
      [{l:gi<BINGO_GAMES.length?'Next game':'Finish the night',fn:()=>gi<BINGO_GAMES.length?between('between',next):next()}]);
  };
  const reserved=S.bingo.reserved===day();
  modal('🎱 Bingo at the Riv',`<p>The room is packed: Legion volunteers selling cards, the Booster Club running the 50/50, and a line at the bar.${reserved?' Your reserved table has a little paper RESERVED tent on it.':''}</p><p>Order anything before the first game? Dinner counts as tonight’s food.</p>`,[
    {l:'Dinner and a drink: $24',s:S.ateOut===day()?'You already ate, but sure.':'Counts as tonight’s food.',fn:()=>order('both',24)},
    {l:'Just a drink: $6',fn:()=>order('drink',6)},
    {l:'Nothing, thanks',fn:()=>order(null,0)}]);
}

function travelOpts(dest){
  const base=dist(S.loc,dest), side=L[S.loc].side, car=carHere(), o=[];
  const inj=S.injury&&!S.injury.treated?1.5:1;
  const fueled=car&&car.fuel>=fuelFor(car,base,side);
  if(fueled) o.push({m:'car',l:`🚗 ${base} min`,min:base});
  else if(car) o.push({m:'car',l:'🚗 Out of gas',dis:true});
  if(side==='I'){
    if(S.friends.sam&&S.loc==='home'&&dest==='aiDock'&&S.ev.flags.samRide===day()) o.unshift({m:'friend',l:`🤝 Ride with Sam ${base} min`,min:base});
    if(!fueled){o.push({m:'walk',l:`🚶 ${Math.round(base*4*inj)} min`,min:Math.round(base*4*inj),dis:!canWalkCarry()});
      o.push({m:'hitch',l:'👍 Hitch a ride',min:base+15,dis:!canWalkCarry()});}
  } else if(!fueled){
    const c=Math.round(8+base*0.8);
    o.push({m:'ride',l:S.phone>0?`📱 Rideshare ${base+8}m · $${c}`:'📵 Rideshare (phone dead)',min:base+8,cost:c,dis:S.phone<=0});
    o.push({m:'walk',l:`🚶 ${Math.round(base*5*inj)} min`,min:Math.round(base*5*inj),dis:!canWalkCarry()});
    if(tod()<1260) o.push({m:'bus',l:`🚌 Bus ${Math.round(base*2.5+10)}m · $2.75`,min:Math.round(base*2.5+10),cost:2.75,dis:!canWalkCarry()});
  }
  return o;
}
function go(dest,o){
  const car=carHere(),from=S.loc,island=L[from].side==='I';
  if(island&&!o.started&&!o.midDone){const r=fireHook('tripStart',{from,to:dest,mode:o.m,o,car});if(r&&r.block){render();return}}
  let min=o.min;
  if(o.m==='friend'&&!o.midDone&&S.ev.flags.samRide!==day()&&Math.random()<0.2){S.ev.flags.samNo=day();S.t+=5;say('📱 Sam texts back: “Already on the boat, sorry!” You’re on your own.');return afterAction()}
  if(o.m==='friend'&&!o.midDone){S.ev.flags.samRide=-1;say('🤝 Sam drives you down to the landing, talking the whole way about their chickens.');adj('stress',-3);}
  if(o.m==='hitch'&&!o.midDone){S.t+=15;if(Math.random()<0.45){adj('stress',4);say('You stand by the road with your thumb out. Two cars pass. Both wave. Neither stops.');return afterAction()}
    say('A neighbor in a pickup with a dog in the back stops. “Hop in.” Island rules.');min=dist(S.loc,dest);adj('stress',-3);}
  if(o.cost) money(-o.cost);
  if((o.m==='car'||o.m==='ride')&&L[S.loc].side==='M'){const m=tod();if(((m>=420&&m<=540)||(m>=960&&m<=1110))&&Math.random()<0.3){min+=15;say('I-5 near JBLM is a parking lot. Of course it is.');adj('stress',4)}}
  if(island&&!o.midDone){let extra=0;
    const r=fireHook('tripMid',{from,to:dest,mode:o.m,o,car:o.m==='car'?car:null,add:n=>{extra+=n},finish:n=>{go(dest,Object.assign({},o,{min:min+extra+(n||0),midDone:true,started:true,cost:0}))}});
    if(r&&r.block){render();return}
    min+=extra;}
  S.t+=min;
  if(o.m==='car'||o.m==='friend'||o.m==='ride'){phoneTick();S.phone=Math.min(100,S.phone+Math.round(min*0.8))}
  if(car&&o.m==='car'){car.loc=dest;car.fuel=Math.max(0,Math.round((car.fuel-fuelFor(car,min))*100)/100);if(car.fuel<1.5&&car.fuel>0)say(`⛽ The low-fuel light is on in the ${car.name.split(' (')[0].toLowerCase()}. ${car.fuel} gallons left.`);if(car.fuel===0)say('⛽ The engine coughs and dies as you pull in. Totally empty.');}
  S.loc=dest;
  if(car&&car.id==='beat'&&dest==='stDock'&&Math.random()<0.25){S.t+=10;say('The terminal lot is full. You park way up the hill and hike down.');}
  if(dest==='home'&&S.carried>0){S.pantry+=S.carried;say(`You unload ${S.carried} day${S.carried>1?'s':''} of groceries into the pantry.`);S.carried=0;}
  if(dest==='home') stash();
  if(dest==='home'&&S.gen&&S.gen!=='home'&&car&&o.m==='car'&&car.id===S.gen){S.gen='home';say('🔌 You wrestle the generator into the shed and run a cord to the house. If the power goes out, you’re ready, as long as there’s gas stashed.');showTile('🔌','Generator installed','Keep gas in the shed for outages','good')}
  if(o.m==='walk') say(`You walk to ${L[dest].name}. It takes ${min} minutes.`);
  fireHook('arrive',{at:dest,from});
  afterAction();
}

