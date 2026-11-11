// ---- 📅 Weekend regular: the weekends (see 44-regular.js) ----
// Each weekend is a visit: V.rental is fresh every week (check-in Friday 3 PM, check-out Sunday 11 AM), the visit ends when you’re back on
// the mainland, and the month goes on. A missed last boat is a night to sort out, not the end. Friends host you, invite you to dinner,
// and text during the week; helping out around the island earns the reputation and friends the goal needs.
const REG_HELP={ // where an islander can use a hand: loc → who, label, minutes, rep, hours
  legion:{id:'walt',name:'Walt, who runs the Legion’s Saturday coffee',ic:'🇺🇸',l:'Volunteer at the Legion hall',min:120,rep:3,st:-3,h:[540,960],t:'You fold chairs, pour terrible coffee and stack the bingo cards. Walt says “Huh” and slides you the good donut.'},
  food:{id:'rusty',name:'Rusty from the Riv',ic:'🍺',l:'Help Rusty close up the Riv',min:60,rep:2,st:-2,h:[1020,1260],t:'You wipe tables and stack chairs while Rusty sweeps and tells you what everyone’s ferry business really is.'},
  store:{id:'bev',name:'Bev the knitter',ic:'🧶',l:'Help Bev run the swap board',min:60,rep:2,st:-2,h:[600,1080],t:'You sort the jars, re-tape the flyers and make change from the coffee can. Bev knits you a pot holder while you work.'},
  farm:{id:'hendersons',name:'the Hendersons',ic:'🥧',l:'Volunteer at the Johnson Farm',min:90,rep:2,st:-3,h:[780,960],t:'You sweep the barn and carry boxes of old photographs. Ruth Henderson feeds you pie and a whole family history.'},
  lake:{id:'sam',name:'Sam, who keeps chickens near the lake',ic:'🐔',l:'Pick up trash around the lake',min:45,rep:2,st:-4,h:[360,1230],t:'You fill two bags with other people’s wrappers. Sam wanders down in rubber boots, holding a chicken, and gives you a hand.'}};
function regHelpHere(){return REG_HELP[S.loc]}
const REG_HELP_CAP=5;     // reputation from helping out: at most this much a day
function regHelp(h){const R=REG(),V=VS(),loc=S.loc,key='help_'+loc,dk=regDk();
  S.t+=h.min;phoneTick();adj('stress',h.st);R.st.help++;
  // the first time you’re just a helpful stranger; a second day on, they know your name
  if(S.friends[h.id])friendPts(h.id,1);
  else{R.acq=R.acq||{};if(R.acq[h.id]!=null&&R.acq[h.id]!==dk)meet(h.id,h.name,'you keep showing up to help');else R.acq[h.id]=dk}
  R.helpRep=R.helpRep||{};const used=R.helpRep[dk]||0,rep=Math.max(0,Math.min(h.rep,REG_HELP_CAP-used));R.helpRep[dk]=used+rep;
  say(`${h.ic} ${h.t}${S.friends[h.id]||R.acq[h.id]!==dk?'':' “Come by again,” they say.'}`);
  V.repDone=V.repDone||{};V.repDone[key+'@'+dk]=true;if(rep)vrepAdd(rep,`helped out: ${h.l.toLowerCase()}`);else say('🤲 Everybody’s been helped enough today. They don’t need a thing.');afterAction()}

// ======== what stays and what goes from the resident's list ========
const REG_DROP=/^(Pay rent by phone|Checks in the mail|Order island grocery delivery|Grocery delivery on its way|Backyard coop|Buy a portable generator|Generator (installed|bought)|Adopt |Mouse traps|Take yourself off the weekend schedule|Post on the co-op board|Trade the Subaru|Buy a mainland beater|Pledge to the co-op|Check the bulletin board|Read the sign on the door)/;
function regKeep(x){return !REG_DROP.test(x.l||'')}

// ======== after every action ========
function regTick(){const V=VS(),R=REG(),d=day(),side=L[S.loc]?L[S.loc].side:'M',Rn=vRental();
  regFoodSwap(side);
  regPaycheck(false);
  // the weekend begins when you’re on the island Friday afternoon or later
  if(side==='I'&&!R.W.on&&(d>=5||(d===4&&tod()>=720))){R.W.on=true;R.W.money0=S.money;R.W.rep0=V.rep;R.W.friends0=Object.keys(S.friends||{}).length;R.W.n=regWk();R.st.hosted+=Rn&&Rn.hosted?1:0;
    say(`🌲 Weekend ${regWk()+1} on Anderson Island. Island time starts now.`)}
  // the weekend ends when you’re back on the mainland on Sunday (or after checking out)
  if(R.W.on&&!R.W.done&&side==='M'&&(d===6||(Rn&&Rn.checkedOut)))regWeekendEnd();
  try{regBossTick()}catch(e){console.error(e)}
  try{regGoalCheck()}catch(e){console.error(e)}
  // late at night, away from a bed
  const late=d*1440+23*60+30;
  if(S.t>=late&&S.loc!=='home'&&S.loc!=='vhome'){
    if(side==='I')return !!regIslandStrand();
    if(side==='M'){regMainlandLate();return true}}
  return false}
// the island pantry and the city pantry are separate piles
function regFoodSwap(side){const R=REG();
  if(side==='I'&&!R.swapped){R.swapped=true;R.cityFood=S.pantry;S.pantry=0}
  else if(side==='M'&&R.swapped){R.swapped=false;S.pantry=R.cityFood+S.pantry;R.cityFood=0}}
function regWeekendEnd(){const V=VS(),R=REG(),Rn=vRental();R.W.done=true;R.weekends++;
  if(Rn&&Rn.checkedIn&&!Rn.checkedOut){Rn.checkedOut=true;Rn.outAt=S.t;if(!Rn.trash&&!Rn.hosted)vRule('trash')}
  const sp=Math.round((R.W.money0==null?S.money:R.W.money0)-S.money),dr=V.rep-R.W.rep0,nf=Object.keys(S.friends||{}).length-R.W.friends0;
  R.hist.push({wk:regWk(),spent:sp,rep:dr,friends:nf,hosted:!!(Rn&&Rn.hosted)});
  say(`🏡 Weekend ${regWk()+1} is over: you’re back on the mainland.`);
  modal(`🌲 Weekend ${regWk()+1} on the island`,`<p>The boat pulls away and the island gets small behind you.</p>
    <div class="kv"><span>🤝 Island reputation</span><b>${V.rep>0?'+':''}${V.rep} (${dr>=0?'+':''}${dr})</b></div>
    <div class="kv"><span>👥 Island friends</span><b>${Object.keys(S.friends||{}).length}${nf?` (+${nf})`:''}</b></div>
    <div class="kv"><span>💵 Net on the weekend</span><b>${sp>=0?'−':'+'}${$(Math.abs(sp))}</b></div>
    <div class="kv"><span>🏡 Stayed</span><b>${Rn&&Rn.hosted?'with '+Rn.hosted.name.split(',')[0]+' (free)':Rn&&Rn.checkedIn?'at the rental cabin':'(no night on the island)'}</b></div>
    <p style="font-size:13px;color:var(--mute)">${regWk()<REG_WEEKS-1?'Home, a bed and Monday. Rent is due tonight.':'The last weekend of the month. Rent is due tonight.'}</p>`,[{l:'Head home',fn:()=>{}}]);
  try{saveGame()}catch(e){}}

// ======== a night away: the last boat is gone ========
function regIslandStrand(){const R=REG(),Rn=vRental(),V=VS();
  // the cabin is still yours Friday and Saturday night: the base game takes you there
  if(Rn&&Rn.checkedIn&&!Rn.checkedOut){render();return false}
  R.st.stranded++;render();
  const fr=Object.keys(S.friends||{}).filter(id=>!npcJailed||!npcJailed(id)),btns=[];
  fr.forEach(id=>{const lv=flv(id),p=Math.min(0.97,(lv>=3?0.95:lv>=2?0.8:0.55)+Math.max(0,V.rep)/400),nm=msgFirst(id);
    btns.push({l:`📱 Text ${nm} for a couch`,s:`${LVL_NAME[lv]||'Friend'}. They might say yes. Free.`,dis:!phoneCan(),fn:()=>{S.t+=5;phoneUse(1);
      if(Math.random()<p){friendPts(id,1);R.st.hosted++;say(`🏡 ${nm}: “Of course. I’ll turn the porch light on.” A spare bed, a blanket that smells like woodsmoke.`);endDay('host')}
      else{adj('stress',3);say(`📱 ${nm} texts back: “So sorry, full house tonight!” You’re on your own.`);afterAction()}}})});
  btns.push({l:'📱 Ask in the Island Group',s:V.asked===day()?'You already asked tonight.':'20 min. An islander might host you.',dis:V.asked===day()||!phoneCan(),fn:vtHostAsk});
  btns.push({l:carHere()?'🚗 Sleep in your car at the landing':'🪑 Sleep on the bench at the landing',s:'Free. Not comfortable. Health −6, stress +15.',fn:()=>{S.loc='aiDock';endDay('terminal')}});
  modal('🌙 Stranded on the island',`<p>The last boat is gone and there’s no bed waiting. ${day()===6?'Monday’s work is at risk: the first boat is at 5:15 AM.':'Where do you sleep?'}</p>`,btns,true);
  return true}
function regMainlandLate(){const car=carHere();
  if(S.loc==='vhome')return false;
  render();
  const base=dist(S.loc,'vhome'),btns=[];
  if(car&&car.fuel>=vtFuel(car,base))btns.push({l:'🚗 Drive home in the dark',s:`${base} min. You’ll be home after midnight. Stress +4.`,fn:()=>{car.loc='vhome';car.fuel=Math.max(0,Math.round((car.fuel-vtFuel(car,base))*100)/100);S.loc='vhome';adj('stress',4);say('🚗 The roads are empty and the radio plays something sad. You’re home, finally.');endDay('vhome')}});
  else{const c=Math.round(8+base*0.8);btns.push({l:`📱 Rideshare home: $${c}`,s:`${base+8} min.`,dis:!phoneCan()||!canEssential(c),fn:()=>{money(-c);S.loc='vhome';say('📱 A rideshare driver takes you home. Your car will be fine where it is.');endDay('vhome')}})}
  btns.push({l:carHere()?'🚗 Sleep in your car in the ferry lot':'🪑 The bench outside the Steilacoom terminal',s:'Free. The waiting room locks after the last boat.',fn:()=>{S.loc='stDock';endDay('terminal')}});
  btns.push({l:'🏨 Motel in Lakewood',s:'$115. Real bed.',fn:()=>endDay('motel')});
  modal('Late on the mainland','<p>It’s late and you’re not at home. Where do you sleep?</p>',btns,true);return true}
{const _sm=strandedModal;strandedModal=function(){if(regOn()&&L[S.loc].side==='M'&&S.loc!=='vhome')return regMainlandLate();return _sm.apply(this,arguments)}}

// ======== hosting: a friend’s spare room instead of the rental ========
function regHostChance(id){const lv=flv(id),rep=Math.max(0,VS().rep);return Math.min(0.97,(lv>=3?0.9:lv>=2?0.75:0.5)+rep/400)}
function regHostCan(){const R=REG(),Rn=vRental();return regOn()&&!!Rn&&!Rn.checkedIn&&!Rn.hosted&&!R.W.done&&day()>=1&&day()<=5&&Object.keys(S.friends||{}).length>0&&phoneCan()}
function regHostAsk(){const R=REG(),Rn=vRental();
  const ids=Object.keys(S.friends||{}).filter(id=>!(typeof npcJailed==='function'&&npcJailed(id)));
  modal('🏡 Who’s got a spare room?',`<p>Friends on the island put people up. It’s free, it needs a real friendship, and it can fall through.</p>`,
    ids.map(id=>({l:`📱 Ask ${msgFirst(id)}`,s:`${LVL_NAME[flv(id)]||'Friend'}. ${regHostChance(id)>=0.8?'Pretty likely.':regHostChance(id)>=0.6?'Probably.':'No promises.'} 5 min.`,
      fn:()=>{S.t+=5;phoneUse(1);
        if(R.W.asked&&R.W.asked[id]){say(`📱 You already asked ${msgFirst(id)} this week.`);return afterAction()}
        R.W.asked=R.W.asked||{};R.W.asked[id]=1;
        if(Math.random()<regHostChance(id)){Rn.hosted={id,name:S.friends[id].name};friendPts(id,1);msgPush(id,1,'Any chance I could crash with you this weekend?');const T=msgPush(id,0,'Absolutely. Spare room’s made up. Bring your appetite.');T.u++;
          say(`🏡 ${msgFirst(id)}: “Absolutely. Spare room’s made up.” The cabin is cancelled: you’ll stay with ${msgFirst(id)}.`)}
        else{adj('stress',2);msgPush(id,1,'Any chance I could crash with you this weekend?');const T=msgPush(id,0,'Ugh, wish I could! Relatives in town. Rain check?');T.u++;say(`📱 ${msgFirst(id)}: “Wish I could! Relatives in town.” You’ll book the cabin.`)}
        afterAction()}})).concat([{l:'Never mind',fn:()=>{}}]))}
function regHosted(Rn,out){const id=Rn.hosted&&Rn.hosted.id;if(!id)return;
  if(out){friendPts(id,1);vrepOnce('hosted',3,'a good houseguest');return}
  vrepOnce('hosted',2,'came to stay with a neighbor')}
// ======== invitations and weekday texts from the island ========
function regInvite(R,d){if(!Object.keys(S.friends||{}).length||R.inv)return;
  const ids=Object.keys(S.friends).filter(id=>!(typeof npcJailed==='function'&&npcJailed(id)));if(!ids.length)return;
  if(Math.random()>0.75)return;
  const id=pick(ids),nm=msgFirst(id),bz=typeof LIFE_CAL!=='undefined'&&LIFE_CAL.bazaar.ok()&&seasonId()==='fall'&&Math.random()<0.7;
  const sat=regWk()*7+5;
  R.inv=bz?{id,kind:'event',dk:sat,txt:`Bazaar’s Saturday at the Legion, you coming?`}:{id,kind:'dinner',dk:sat,txt:`Dinner at my place Saturday at 6, if you’re coming over. I made way too much.`};
  const T=msgPush(id,0,R.inv.txt);T.u++;MSG().inc[id]=dayKey();
  say(`📱 Text from ${nm}: “${R.inv.txt}”`);try{phoneNotify('💬',nm,R.inv.txt)}catch(e){}}
function regCoworker(R,d){if(d>3||Math.random()>0.22)return;const n=pick(['Dana','Marcus','Priya','Tom from accounting']),
  x=pick(['you coming to the potluck Thursday? bring the good chips','did you see the reorg email?? call me','the printer is eating paper again, send help','lunch tomorrow? my treat, I won a bet']);
  say(`📱 Text from ${n} at work: “${x}”`)}
function regSocialNight(notes,d){const R=REG();
  if(d===2||d===3)regInvite(R,d);
  if(d>=0&&d<=3&&regOn())regCoworker(R,d);
  // a dinner or event you never made it to
  if(R.inv&&d===6&&!R.inv.done&&!R.inv.noted){R.inv.noted=true;
    if(Object.keys(S.friends).includes(R.inv.id)&&R.inv.dk===regWk()*7+5){friendPts(R.inv.id,-1);notes.push(`🙁 You didn’t make it to ${msgFirst(R.inv.id)}’s ${R.inv.kind==='dinner'?'dinner':'event'}. A quiet text: “Next time!”`)}}
  if(d===6)R.inv=null}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up.apply(this,arguments);try{if(regOn())regSocialNight(notes,d)}catch(e){console.error(e)}return r}}
// ======== the boss texts you on the island ========
function regBossTick(){const R=REG(),d=day(),J=curJob(),m=tod();
  if(!J||L[S.loc].side!=='I'||d>4||!J.days.includes(d)||m<J.start+30||m>J.end||R.bossAt[regDk()]||S.worked[d]&&!R.vacDays[regDk()])return;
  if(!(R.vacDays[regDk()]||d===4||d===0))return;     // you’re “off”: a Friday or Monday on the island
  R.bossAt[regDk()]=1;if(Math.random()>0.55)return;
  const Q=['Quick question about the Henderson file…','Hey, do you remember where the Q3 numbers live?','Sorry to bug you: the client moved the meeting up. Can you look at one thing?','Hi! The login for the shared drive isn’t working for me. Any chance?'];
  const q=pick(Q);try{phoneNotify('💼','Boss',q)}catch(e){}
  modal('📱 Text from your boss',`<p>“${q}”</p><p style="font-size:13px;color:var(--mute)">You’re on an island, on a day off.</p>`,[
    {l:'Answer it',s:'25 min on one bar of signal. Stress +6, job +2.',fn:()=>{S.t+=25;phoneUse(3);adj('stress',6);adj('job',2);R.st.bossAnswered++;say('📱 You answer from the Riv’s parking lot, holding your phone up toward the water for a second bar. “You’re a lifesaver,” the boss writes.');afterAction()}},
    {l:'Ignore it',s:'Job −6. They’ll live.',fn:()=>{adj('job',-6);R.st.bossIgnored++;say('📵 You turn the phone face down. The boss notices.');afterAction()}}])}
// ======== sights and spots: help out, dinner at a friend’s ========
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);if(!regOn()||S.over)return a;
  try{
    const R=REG(),V=VS(),d=day(),m=tod(),loc=S.loc,side=L[loc]&&L[loc].side,dk=regDk();
    for(const x of a)if(/^(Pack food|Pack a lunch)/.test(x.l||'')){x.l=x.l.replace(/ — \$\d+/,'');x.s='Uses your pantry first, and buys the rest. '+(x.s||'')}
    if(side==='I'){
      const h=REG_HELP[loc];
      if(h&&m>=h.h[0]&&m<h.h[1]&&(!L[loc].hours||isOpen(loc))){const done=V.repDone&&V.repDone['help_'+loc+'@'+dk];
        a.push({cat:'here',ic:h.ic,l:h.l,s:done?'You already helped here today.':`${h.min>=60?h.min/60+' h':h.min+' min'}. Reputation +${h.rep} (up to ${REG_HELP_CAP} a day). ${S.friends[h.id]?'Keeps a friendship going.':R.acq&&R.acq[h.id]!=null?'They’re starting to know you.':'You might make a friend.'}`,dis:!!done,fn:()=>regHelp(h)})}
      const inv=R.inv;
      if(inv&&inv.kind==='dinner'&&inv.dk===dk&&!inv.done&&m>=1020&&m<1200&&S.friends[inv.id]){const nm=msgFirst(inv.id);
        a.push({cat:'trade',ic:'🍲',l:`Go to ${nm}’s for dinner`,s:'2 hours. A free dinner, a good friend. Reputation +3, stress −6.',cls:'primary',fn:()=>{inv.done=true;S.t+=120;phoneTick();S.ateOut=d;S.ateOutAt=`${nm}’s kitchen`;adj('stress',-6);adj('health',1);R.st.dinners++;friendPts(inv.id,2);vrepOnce('dinner',3,`had dinner at ${nm}’s`);
          say(`🍲 ${nm}’s table: too much food, a dog under the chair, and a lot of island gossip. You walk home full.`);afterAction()}})}
      if(regHostCan())a.push({cat:'phone',ic:'🏡',l:'Ask a friend to host you this weekend',s:'Free, instead of the rental cabin. Needs a real friendship.',fn:regHostAsk})}
    if(side==='M'&&regHostCan()&&loc==='vhome')a.push({cat:'phone',ic:'🏡',l:'Ask a friend to host you this weekend',s:'Free, instead of the rental cabin ($170). Needs a real friendship.',fn:regHostAsk});
    // the bazaar counts for the invitation
    if(R.inv&&R.inv.kind==='event'&&!R.inv.done&&(S.cal||{}).bazaar===dk){R.inv.done=true;friendPts(R.inv.id,2);R.st.events++;vrepOnce('bzinv',3,`came to the bazaar with ${msgFirst(R.inv.id)}`)}
  }catch(e){console.error(e)}return a}}
