// ---- 🧳 visitor mode: play a visit to Anderson Island instead of living there ----
// SHARED CONTRACT (other visitor files rely on these names; extend, don't rename):
//   visitorOn()          true while the current game is a visit (S.visitor is set)
//   VS()                 the visit state, S.visitor, with missing fields filled in (old saves / partial states)
//   VISIT_LENS[len]      the three visit lengths
//   VISIT_HOMES[home]    where the visitor lives on the mainland (drive to the Steilacoom ferry, I-5 traffic weight)
//   VSIGHTS              places to see on the island; loc = a key of L (some are added by 37-visitor-sights.js)
//   L.home               during a visit = the rental cabin on the island (the core file renames it on screen)
//   L.vhome              during a visit = the visitor's own home on the mainland (added by 38-visitor-travel.js)
// Files: 36 core (lengths, rental, budget, end of visit, title screen, guide, saves) · 37 sights + scoring + visitor
//        reputation · 38 travel (home → dock, I-5 traffic, packed food, missing the last boat) · 39 visitor phone.
const VISIT_LENS={
  day:    {n:'Day trip', ic:'☀️', nights:0, d:'Saturday. Catch a morning boat over, see what you can, and make the last boat home.'},
  weekend:{n:'Weekend',  ic:'🏕️', nights:2, d:'Friday evening to Sunday. Two nights in a rental cabin.'},
  week:   {n:'A week',   ic:'🌲', nights:6, d:'Monday to Sunday in a rental cabin. Time to see it all, and to run out of groceries.'},
  regular:{n:'Weekend regular', ic:'📅', nights:2, d:'A month in your city: job on weekdays, rent on Sundays, the island every weekend. Become an islander.'},   // 44-regular.js
};
const VISIT_HOMES={
  seattle:{n:'Seattle', ic:'🏙️', mi:55, i5:1,    d:'About 55 miles up I-5. The worst traffic.'},
  tacoma: {n:'Tacoma',  ic:'🌉', mi:15, i5:0.5,  d:'About 15 miles. A short drive, some I-5 traffic.'},
  olympia:{n:'Olympia', ic:'🏛️', mi:25, i5:0.35, d:'About 25 miles south. Lighter traffic.'},
};
const VSIGHTS=[
  {id:'lake',   loc:'lake',   n:'Lake Josephine',           ic:'🦅'},
  {id:'farm',   loc:'farm',   n:'Johnson Farm museum',      ic:'🚜'},
  {id:'andys',  loc:'andys',  n:'Andy’s Wild Wood Park',    ic:'🌳'},
  {id:'jacobs', loc:'jacobs', n:'Jacobs Point',             ic:'🌊'},
  {id:'riv',    loc:'food',   n:'Dinner at the Riv',        ic:'🍔'},
  {id:'legion', loc:'legion', n:'An event at the Legion',   ic:'🇺🇸'},
];
// when each visit starts (day index: 0 = Monday) and the clock at the start: at your own home (L.vhome) or at the Steilacoom terminal
const VISIT_START={day:{d:5,home:390,dock:450},weekend:{d:4,home:930,dock:1020},week:{d:0,home:480,dock:540},regular:{d:4,home:930,dock:1020}};
const VISIT_BUDGET={day:150,weekend:500,week:1200,regular:0}, VISIT_DIFF_MUL={easy:1.2,normal:1,hard:0.85};
const VISIT_RATE={day:0,weekend:125,week:90,regular:85};      // rental cabin, per night (a week gets the weekly rate)
const VCHECK_IN=900, VCHECK_OUT=660, VLATE_FEE=50; // check-in 3 PM on arrival day, check-out 11 AM on the last day
const visitorOn=()=>!!(typeof S!=='undefined'&&S&&S.visitor);
function vsInit(len,home){len=VISIT_LENS[len]?len:'weekend';const st=VISIT_START[len],last=len==='day'?5:6,nights=VISIT_LENS[len].nights;
  return {len,home:home||'tacoma',budget:0,spent:0,photos:{},seen:{},rep:0,packed:0,
  rental:{in:nights?st.d*1440+VCHECK_IN:null,out:nights?last*1440+VCHECK_OUT:null,checkedIn:false,checkedOut:false,inAt:null,outAt:null,trash:false,late:false},done:false,result:null,
  arr:st.d,last,nights,rate:VISIT_RATE[len]||0,rentalCost:0,fees:0,rules:{},texts:[],islandAt:null,endT:null,reg:null}}
function VS(){if(typeof S==='undefined'||!S||!S.visitor)return null;const v=S.visitor,d=vsInit(v.len,v.home);
  for(const k in d){if(v[k]===undefined)v[k]=d[k];else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&typeof v[k]==='object')for(const j in d[k])if(v[k][j]===undefined)v[k][j]=d[k][j]}
  return v}

// ======== hooks other files can use ========
//   visitorNew(len,home,diff[,season])  start a visit        visitEnd(result)   end it now ('home'|'missed'|'never'|…)
//   visitMissed(why)   the last boat left with you on the island (38 can wrap it to offer a place to sleep first)
//   vHostText(x)       a text from the rental host (kept in VS().texts)       vRule(id[,text])  a broken house rule
//   vCheckIn() / vCheckOut(trash)   the rental        vLastBoatAbs()  absolute S.t of the last sailing off the island
//   vFinalDay()        true on the visit's last day   visitBudget(len,diff)  the budget before the rental
//   VGUIDE.push({id,when,t})   more first-day guide tips          VISIT_END_ROWS.push(()=>[[label,value],…])  end-screen rows
const VHOST='Marnie, your host';
const VRULES={
  quiet:{n:'Quiet after 10 PM',rep:5,host:'Hi! A neighbor texted me about music after 10. Quiet hours please, sound carries over the water. Thanks!'},
  smoke:{n:'No smoking',rep:6,host:'Hi, the smoke detector app pinged me. It’s a no-smoking cabin, so please step outside. There may be a cleaning fee next time.'},
  trash:{n:'Trash out at check-out',rep:3,host:'Thanks for staying! The trash was still in the kitchen, so the cleaner had to haul it out. Next time, the bin is by the road.'}};
const VISIT_END_ROWS=[];
function visitBudget(len,diff){return Math.round((VISIT_BUDGET[len]||500)*(VISIT_DIFF_MUL[diff]||1))}
function vFinalDay(){const V=VS();return !!V&&day()>=V.last}
function vLastBoatAbs(){const V=VS();if(!V)return 0;const ds=deps('I',V.last);return V.last*1440+Math.max(...ds)}
// no sailing you could still make today from the island (boarding closes 20 min before departure)
function vNoBoatLeft(){try{const k=findNext('I','walk',true);return !k||k.d>day()}catch(e){return false}}
function vHostText(x){const V=VS();if(!V)return;V.texts.push({t:S.t,x});if(V.texts.length>30)V.texts.splice(0,V.texts.length-30);
  say(`📱 Text from ${VHOST}: “${x}”`);try{showTile('📱','Text from your host',x.length>70?x.slice(0,68)+'…':x,'info')}catch(e){}}
function vRule(id,txt){const V=VS(),R=VRULES[id];if(!V||!R)return;V.rules[id]=(V.rules[id]||0)+1;V.rep-=R.rep;vHostText(txt||R.host)}
const vRental=()=>{const V=VS();return V&&V.rental&&V.rental.in!=null?V.rental:null};

// ======== the rental cabin: L.home reads as the rental while a visit is on ========
const VRENT={name:'Rental cabin',ic:'🛖'};
function vRentalDesc(){const V=VS(),R=vRental();
  if(R&&R.hosted&&!R.checkedOut)return R.checkedIn?`${R.hosted.name.split(',')[0]} is putting you up. A spare room, a dog on the bed, coffee in the morning. Check-out by ${fmt(VCHECK_OUT)} ${DAYS[V.last]}`:`${R.hosted.name.split(',')[0]} said you can stay. The spare room is ready from ${fmt(VCHECK_IN)} ${DAYS[V.arr]}`;
  if(!R)return 'Somebody else’s rental this weekend. A day trip has no cabin.';
  if(R.checkedOut)return 'You’ve checked out. The key is back in the lockbox.';
  if(!R.checkedIn)return `Your rental for the ${VISIT_LENS[V.len].n.toLowerCase()}. Check-in from ${fmt(VCHECK_IN)} ${DAYS[V.arr]}`;
  return `Your rental. Check-out by ${fmt(VCHECK_OUT)} ${DAYS[V.last]}. Quiet after 10 PM, no smoking, trash out when you leave`}
(function(){const H=L.home,o={name:H.name,ic:H.ic,desc:H.desc};
  for(const k of ['name','ic','desc'])Object.defineProperty(H,k,{configurable:true,enumerable:true,
    get(){if(!visitorOn())return o[k];const R=vRental();if(R&&R.hosted&&k!=='desc')return k==='name'?`${R.hosted.name.split(',')[0]}’s spare room`:'🏡';return k==='desc'?vRentalDesc():VRENT[k]},set(v){o[k]=v}})})();
function vCheckIn(quiet){const V=VS(),R=vRental();if(!R||R.checkedIn)return;R.checkedIn=true;R.inAt=S.t;
  S.pantry+=1;if(S.carried>0&&S.loc==='home'){S.pantry+=S.carried;S.carried=0}
  if(R.hosted){say(`🏡 ${R.hosted.name.split(',')[0]} meets you at the door with a towel and a plate of something. “Spare room’s yours. Don’t mind the dog.” No rent, no rules, just a very warm house.`);try{regHosted(R)}catch(e){console.error(e)}return}
  if(typeof regOn==='function'&&regOn()){const c=V.nights*V.rate;money(-c);V.rentalCost+=c;REG().st.cabin+=c;say(`🛖 The weekend regular’s rate: ${$(c)} for two nights, charged to your card.`)}
  say(`🔑 ${quiet?'You find the lockbox in the dark, punch in the code and let yourself in.':'The lockbox code works on the first try.'} The cabin smells like cedar and someone else’s coffee. A welcome basket on the counter: oatmeal, coffee, a jar of island blackberry jam (+1 day of food).`);
  vHostText(`Welcome to the island! Make yourself at home. House rules: quiet after 10 PM, no smoking, and please take the trash to the bin by the road when you leave. Check-out is ${fmt(VCHECK_OUT)} ${DAYS[V.last]}.`)}
function vCheckOut(trash){const V=VS(),R=vRental();if(!R||R.checkedOut)return;
  S.t+=trash?20:5;R.checkedOut=true;R.outAt=S.t;R.trash=!!trash;
  if(S.pantry>0){S.carried+=S.pantry;S.pantry=0}
  if(R.hosted){say(`🧳 You strip the bed, carry the dishes to the sink and say your goodbyes. ${R.hosted.name.split(',')[0]} hugs you like you live here.`);try{regHosted(R,true)}catch(e){console.error(e)}return}
  if(!R.late&&S.t>R.out){R.late=true;money(-VLATE_FEE);V.fees+=VLATE_FEE;vHostText(`Hope you enjoyed the stay! Check-out was ${fmt(VCHECK_OUT)}, so there’s a ${$(VLATE_FEE)} late check-out fee.`)}
  say(trash?'🧳 Bags in the car, the dishes put away, two trash bags hauled to the bin by the road. You drop the key in the lockbox.':'🧳 Bags in the car, the key in the lockbox. The trash can stay where it is.');
  if(!trash)vRule('trash');
  else if(!R.late)vHostText('Got your check-out. Thanks for leaving it so tidy! Safe travels, and watch the Sunday boats, they fill up.')}
function vRulesModal(){modal('📋 House rules',`<p>Taped inside the kitchen cabinet, in neat marker:</p><ul><li>🤫 <b>Quiet after 10 PM.</b> Sound carries over the water.</li><li>🚭 <b>No smoking</b>, inside or on the deck.</li><li>🗑️ <b>Take the trash out</b> to the bin by the road when you check out.</li><li>🕚 <b>Check-out by ${fmt(VCHECK_OUT)}</b> ${DAYS[VS().last]}. Late check-out is ${$(VLATE_FEE)}.</li></ul><p style="font-size:13px;color:var(--mute)">Break a rule and ${VHOST.split(',')[0]} hears about it. The island is small.</p>`,[{l:'Got it',fn:()=>{}}])}
// what you can do at the cabin: the resident's house jobs are gone; bed, alarm, phone and rest stay
const V_HOME_KEEP=/^(⏰ )?(Alarm|Charge your phone|Go to bed|Turn in early|Rest for an hour|Go to the warming shelter)/;
function vHomeActions(base){const V=VS(),R=vRental(),d=day(),m=tod(),a=[];
  if(!R){a.push({ic:'🔒',l:'Not your cabin today',s:'A day trip has no rental. Somebody else’s car is in the driveway.',dis:true});return a}
  if(R.checkedOut){a.push({ic:'🧳',l:'You checked out',s:'The key is back in the lockbox. Time to catch a boat.',dis:true});return a}
  if(!R.checkedIn){
    if(S.t<R.in){a.push({ic:'🔑',l:`Check-in opens at ${fmt(VCHECK_IN)}`,s:'The cleaner’s car is still in the driveway.',dis:true});
      if(d===Math.floor(R.in/1440))a.push({ic:'🪑',l:`Wait on the porch until ${fmt(VCHECK_IN)}`,s:`${Math.round((R.in-S.t)/60*10)/10} h. The cleaner waves through the window.`,fn:()=>{S.t=R.in;try{phoneTick()}catch(e){}vCheckIn();afterAction()}})}
    else a.push({ic:'🔑',l:'Check in to the rental cabin',s:'The lockbox code came by text. 10 min.',cls:'primary',fn:()=>{S.t+=10;vCheckIn();afterAction()}});
    return a}
  a.push(...base.filter(x=>V_HOME_KEEP.test(x.l||'')));
  if(R.hosted){if(d>=V.last)a.push({cat:'here',ic:'🧳',l:'Say goodbye and check out',s:'20 min. No fees, no rules: just good manners.',cls:'primary',fn:()=>{vCheckOut(true);afterAction()}});return a}
  a.push({cat:'here',ic:'📋',l:'Read the house rules',s:'Taped inside the kitchen cabinet.',fn:vRulesModal});
  const late=m>=1320||m<360;
  a.push({cat:'here',ic:'🔥',l:late?'Fire pit and music on the deck (after 10 PM)':'Fire pit and music on the deck',s:late?'1 hour. Stress −8. It’s quiet hours.':'1 hour. Stress −8. Quiet hours start at 10 PM.',
    fn:()=>{S.t+=60;adj('stress',-8);say(pick(['🔥 Cedar smoke, a speaker on the railing, the ferry lights crawling across the water.','🔥 You burn the host’s kindling and half a bag of marshmallows. Worth it.']));if(late)vRule('quiet');afterAction()}});
  if(S.cigs>0)a.push({cat:'here',ic:'🚬',l:'Smoke a cigarette inside',s:'It’s raining and the sign says no smoking. Your call.',fn:()=>{S.cigs--;S.t+=10;adj('stress',-3);say('🚬 You crack a window. It doesn’t help.');vRule('smoke');afterAction()}});
  if(d>=V.last){const lt=S.t>R.out;
    a.push({cat:'here',ic:'🧳',l:'Check out and take the trash out',s:`20 min.${lt?` It’s past ${fmt(VCHECK_OUT)}.`:` By ${fmt(VCHECK_OUT)}, or it’s a ${$(VLATE_FEE)} late fee.`}`,cls:'primary',fn:()=>{vCheckOut(true);afterAction()}});
    a.push({cat:'here',ic:'🧳',l:'Check out, leave the trash',s:'5 min. The house rules say otherwise.',fn:()=>{vCheckOut(false);afterAction()}})}
  return a}

// ======== no job, no rent, no bills, no house: gate the resident's life off during a visit ========
const V_DROP=/^(Pay rent|Pay bills|Checks in the mail|Look for a job|Browse job listings|You don’t work here|Trade the Subaru|Order island grocery delivery|Grocery delivery on its way|Backyard coop|Buy a portable generator|Generator (installed|bought)|Pick up prescription|Prescription picked up|Take yourself off the weekend schedule|Post on the co-op board|Mouse traps|Adopt )/;
function vKeep(x){if(typeof regOn==='function'&&regOn())return regKeep(x);if(V_DROP.test(x.l||''))return false;let c='';try{c=catOf(x)}catch(e){}
  if(c==='work'&&!/ankle|Urgent|Nothing urgent/i.test((x.l||'')+' '+(x.s||'')))return false;return true}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);if(!visitorOn()||S.over)return a;
  try{if(S.loc==='home')return vHomeActions(a);return a.filter(vKeep)}catch(e){console.error(e);return a}}}
{const _f=hhActions;hhActions=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
{const _f=hhNight;hhNight=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
{const _f=hhTodo;hhTodo=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
{const _f=rentNight;rentNight=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
{const _f=choresPile;choresPile=function(){if(visitorOn())return 0;return _f.apply(this,arguments)}}
{const _f=homeAdj;homeAdj=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
{const _f=apptActive;apptActive=function(){if(visitorOn())return false;return _f.apply(this,arguments)}}
{const _f=tradingLocked;tradingLocked=function(){if(visitorOn())return false;return _f.apply(this,arguments)}}
{const _f=jobActions;jobActions=function(){if(visitorOn())return;return _f.apply(this,arguments)}}
// the cabin is somebody else's house: it doesn't wear, freeze, flood or run out of firewood
function vCabin(){const U=UP();Object.assign(U,{dishes:0,laundry:0,needles:0,bed:0,ash:0,chimney:0,wood:14,damp:0,mold:false,fridge:false,traps:7,
  septic:10,gutters:0,limbs:0,well:0,moss:0,pot:0,genSvc:0,propane:100,woodOut:false});U.jobs=(U.jobs||[]).filter(j=>!UP_JOBS[j.k]);S.home=70}
{const _f=upkeepNight;upkeepNight=function(){if(visitorOn())vCabin();const r=_f.apply(this,arguments);if(visitorOn())vCabin();return r}}
// house events, raccoons, puppies, work parties: not at a rental
const V_NO_EV=['leaky_roof','mice','mouse_caught','black_mold','chimney_fire','crawl_flood','limb_roof','septic_backup','clogged_drain','well_quit','friend_dropin','work_party','raccoons','puppy_litter','garage_stuck','sam_groceries','neighbor_ride','garage_sale'];
for(const e of EV)if(V_NO_EV.includes(e.id)){const c=e.cond;e.cond=function(ctx){if(visitorOn())return false;return c?c.apply(this,arguments):true}}
// the day card has no "missed work" for a visitor
{const _f=dailyCard;dailyCard=function(){const r=_f.apply(this,arguments);return visitorOn()&&S.visitor.len!=='regular'?r.replace(/ · 💼 [^<·]*/,''):r}}

// ======== to-do: the visit's own list ========
{const _t=todoItems;todoItems=function(){const it=_t.apply(this,arguments);if(!visitorOn()||S.over)return it;
  try{if(VS().len==='regular')return regTodo(it);return vTodo(it.filter(x=>/^(Get your ankle treated|Replace the car battery|Pick up your grocery order|Optional: Bingo)/.test(x.l||'')))}catch(e){console.error(e);return it}}}
function vTodo(keep){const V=VS(),R=vRental(),d=day(),it=[];
  it.push({ok:V.islandAt!=null,fail:false,l:'Get to the island',s:V.islandAt!=null?'⛴️ You made it over.':'⛴️ Drive to the Steilacoom ferry terminal. Be in line 20 minutes before the boat.',urgent:V.islandAt==null});
  if(R){it.push({ok:R.checkedIn,fail:false,l:'Check in at the rental cabin',s:R.checkedIn?'🔑 Checked in.':`🛖 From ${fmt(VCHECK_IN)} ${DAYS[V.arr]}. It’s “Rental cabin” on the island map.`,urgent:!R.checkedIn&&S.t>=R.in&&L[S.loc].side==='I'});
    if(R.checkedIn)it.push({ok:R.checkedOut&&!R.late,fail:R.late,l:`Check out by ${fmt(VCHECK_OUT)} ${DAYS[V.last]}`,s:R.checkedOut?(R.late?`🧳 Checked out late (${$(VLATE_FEE)} fee).`:'🧳 Checked out on time.'):R.late?`🧳 Past check-out: the ${$(VLATE_FEE)} late fee is on your card.`:`🧳 Take the trash out when you go. Late check-out is ${$(VLATE_FEE)}.`,urgent:d>=V.last&&!R.checkedOut});
    const broke=Object.keys(V.rules);
    it.push({ok:!broke.length&&R.checkedOut,fail:broke.length>0,l:'Follow the house rules',s:broke.length?`📋 Broken: ${broke.map(k=>VRULES[k].n.toLowerCase()).join(', ')}.`:'📋 Quiet after 10 PM, no smoking, trash out at check-out.',urgent:false})}
  const car=S.cars.find(c=>c.id==='isl');
  if(car)it.push({ok:car.fuel>=3,fail:false,l:'Keep gas in the car',s:`⛽ ${car.fuel}/${car.tank} gal. There’s no gas station on the island.`,urgent:car.fuel<1.5});
  it.push({ok:S.pantry+S.carried>=1||S.ateOut===d,fail:false,l:'Sort out dinner',s:`🍽️ ${S.pantry} day${S.pantry===1?'':'s'} of food at the cabin${S.carried?`, ${S.carried} in bags`:''}. The Riv does takeout.`,urgent:false});
  it.push({ok:S.money>=0,fail:false,l:'Stay on budget',s:`💵 ${S.money<0?'−':''}${$(Math.abs(S.money))} left of ${$(V.budget)}${V.rentalCost?` (the cabin was ${$(V.rentalCost)})`:''}. What’s left counts toward your score.`,urgent:S.money<0});
  const lb=vLastBoatAbs();
  it.push({ok:V.done&&V.result==='home',fail:false,l:`Catch the last boat home: ${DAYS[V.last]} ${fmt(lb)}`,s:'⛴️ The last sailing off the island. Once you’re back in Steilacoom on the last day, the visit is over.',urgent:d>=V.last});
  return it.concat(keep)}

// ======== HUD: visit day instead of "Day 3 of 7", no job meter ========
function vDayTxt(){const V=VS(),n=V.last-V.arr+1,i=Math.min(n,Math.max(1,day()-V.arr+1));return `🧳 ${VISIT_LENS[V.len].n}${n>1?` · day ${i} of ${n}`:''}`}
{const _h=hud;hud=function(){let h=_h.apply(this,arguments);if(!visitorOn())return h;try{const V=VS();if(V.len==='regular')return h;
  h=h.replace(/Day \d+ of 7/,vDayTxt());
  h=h.replace(/<div class="stat"><small>Job<\/small><b>[^<]*<\/b><div class="meter"><i[^>]*><\/i><\/div><\/div>/,`<div class="stat"><small>Budget</small><b>${$(Math.max(0,V.budget))}</b>${meter(V.budget>0?clamp(Math.round(S.money/V.budget*100),0,100):0,true)}</div>`);
  const R=vRental();h=h.replace(/<div class="stat" title="Home condition"><small>Home<\/small><b>[^<]*<\/b><div class="meter"><i[^>]*><\/i><\/div><\/div>/,`<div class="stat" title="Rental cabin"><small>Cabin</small><b style="font-size:13px">${!R?'none':R.checkedOut?'out':R.checkedIn?'🔑 in':'later'}</b></div>`)}catch(e){console.error(e)}return h}}

// ======== starting a visit ========
function visitorNew(len,home,diff,season){
  len=VISIT_LENS[len]?len:'weekend';home=VISIT_HOMES[home]?home:'tacoma';
  if(len==='regular')return regNew(home,diff,season);
  newGame(diff,'week',season);
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();
  const V=S.visitor=vsInit(len,home),st=VISIT_START[len],cost=V.nights*V.rate;
  V.budget=visitBudget(len,S.diff);V.rentalCost=cost;
  // no job, no errands, no house to run
  Object.assign(S,{emp:null,job:0,interview:null,rx:true,appt:false,apptMissed:false,injury:null,injuryRolled:true,pantry:0,carried:0,home:70,homeLow:false,homeGas:0,homeDiesel:0,gen:null,delivery:null,prios:[]});
  vCabin();
  S.money=V.budget-cost;
  const start=typeof L.vhome!=='undefined'?'vhome':'stDock';
  S.cars=[{id:'isl',name:'Your car',loc:start,fuel:10,tank:14,diesel:false}];
  S.loc=start;S.cur=st.d;S.t=st.d*1440+(start==='vhome'?st.home:st.dock);S.phoneT=S.t;S.phone=100;
  S.alarm={plug:{on:false,time:420},phone:{on:true,time:420}};
  uiNarr=[];S.log=[];S.ev.force=[];
  const H=VISIT_HOMES[home],LN=VISIT_LENS[len];
  say(`🧳 <b>${LN.ic} ${LN.n} on Anderson Island.</b> ${DAYS[st.d]}, ${fmt(S.t)}. ${start==='vhome'?`You’re home in ${H.n}, bag packed.`:'You’re at the Steilacoom ferry terminal with your car.'}`);
  say(`💵 Your budget: ${$(V.budget)}${cost?`. The cabin (${V.nights} nights, ${$(cost)}) is already paid, so ${$(S.money)} is left to spend`:''}.`);
  startDay();
  S.log=S.log.filter(e=>!/^🏠 Rent/.test(String(e.s)));uiNarr=uiNarr.filter(x=>!/^🏠 Rent/.test(String(x)));
  const lb=vLastBoatAbs();
  modal(`🧳 Your visit: ${LN.ic} ${LN.n}`,`<p>${LN.d}</p>
    <div class="kv"><span>Coming from</span><b>${H.ic} ${H.n}</b></div><div class="kv"><span>Budget</span><b>${$(V.budget)}</b></div>${cost?`<div class="kv"><span>Rental cabin</span><b>${V.nights} nights · ${$(cost)} paid</b></div>`:''}
    <ul><li>⛴️ <b>Get to the ferry</b> in Steilacoom, in line 20 minutes before the boat.</li>${cost?`<li>🔑 <b>Check in</b> at the rental cabin from ${fmt(VCHECK_IN)} ${DAYS[V.arr]}; check out by ${fmt(VCHECK_OUT)} ${DAYS[V.last]}.</li>`:''}<li>📸 <b>See the sights</b>: Lake Josephine, Johnson Farm, Andy’s Wild Wood Park, Jacobs Point, the Riv.</li><li>🌙 <b>Catch the last boat home</b>: ${DAYS[V.last]} ${fmt(lb)} from the island.</li></ul>`,
    [{l:'Let’s go',fn:()=>{}}]);
  try{showTile('🧳',`${LN.n} visit`,`${H.n} → Anderson Island`,'info')}catch(e){}
  saveGame();
}
window.visitorNew=visitorNew;

// ======== the end of the visit ========
function visitEnd(result){const V=VS();if(!V||V.done||S.over)return;V.done=true;V.result=result||V.result||'home';V.endT=S.t;
  const R=vRental();if(R&&R.checkedIn&&!R.checkedOut){R.checkedOut=true;R.outAt=S.t;if(!R.trash)vRule('trash')}
  V.spent=Math.round((V.budget-S.money)*100)/100;
  finish()}
function visitMissed(why){const V=VS();if(!V||V.done||V.len==='regular')return;   // Weekend regular: a missed boat is a night to sort out (45-regular-weekend.js)
  V.missedWhy=why||'boat';visitEnd('missed')}
// after every action: first time on the island, the 11 AM check-out, and the last day
function vTick(){const V=VS();if(!V||V.done||S.over)return false;const d=day(),side=L[S.loc]?L[S.loc].side:'M',R=vRental();
  if(side==='I'&&V.islandAt==null)V.islandAt=S.t;
  if(R&&R.checkedIn&&!R.checkedOut&&!R.late&&!R.hosted&&S.t>=R.out){R.late=true;money(-VLATE_FEE);V.fees+=VLATE_FEE;
    vHostText(`Hi! Check-out was ${fmt(VCHECK_OUT)} and the cleaner is waiting in the driveway. I’ve charged the ${$(VLATE_FEE)} late check-out fee.`)}
  if(V.len==='regular')return typeof regTick==='function'?regTick():false;   // 45-regular-weekend.js: each weekend ends when you’re back, the month goes on
  if(d>=V.last){
    if(side==='M'&&V.islandAt!=null){visitEnd('home');return true}
    if(side==='I'&&(S.t>vLastBoatAbs()||vNoBoatLeft())){visitMissed('boat');return true}}
  return false}
{const _aa=afterAction;afterAction=function(){if(visitorOn()&&!S.over){try{if(vTick())return}catch(e){console.error(e)}}return _aa.apply(this,arguments)}}
{const _ed=endDay;endDay=function(where){
  if(!visitorOn()||S.over)return _ed.apply(this,arguments);
  const V=VS(),R=vRental();
  if(!V.done&&V.len!=='regular'&&day()>=V.last){if(L[S.loc].side==='I')return visitMissed('night');return visitEnd(V.islandAt!=null?'home':'never')}
  if(where==='home'&&R&&!R.checkedIn&&!R.checkedOut&&S.t>=R.in)vCheckIn(true);
  return _ed.apply(this,arguments)}}
{const _fin=finish;finish=function(){
  if(!visitorOn())return _fin.apply(this,arguments);
  if(VS().len==='regular')return regFinish();
  const V=VS();if(!V.done){V.done=true;V.result=V.result||(L[S.loc]&&L[S.loc].side==='I'?'missed':'home');V.endT=S.t;V.spent=Math.round((V.budget-S.money)*100)/100}
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();S.over=true;
  const T=vEndTitle(V);endScreen(T[0],T[1])}}
function vEndTitle(V){const LN=VISIT_LENS[V.len],H=VISIT_HOMES[V.home]||VISIT_HOMES.tacoma;
  if(V.result==='home')return ['{{name}}, you made it home',`${LN.ic} ${LN.n} on Anderson Island, and back on the mainland before the last boat. ${H.n} is ${H.mi} miles up the road.`];
  if(V.result==='missed')return ['You missed the last boat',`${LN.ic} ${LN.n} on Anderson Island, and then the ferry left without you. The island keeps island time.`];
  if(V.result==='never')return ['You never made it over',`${LN.ic} ${LN.n} that never left the mainland. The island will still be there.`];
  return ['The visit is over',`${LN.ic} ${LN.n} on Anderson Island.`]}
const VRESULT={home:'⛴️ Made it home',missed:'🌙 Missed the last boat',never:'🚫 Never reached the island',gameover:'🚑 Cut short'};
{const _es=endScreen;endScreen=function(h1,sub,lost){
  if(!visitorOn())return _es.apply(this,arguments);
  try{return vEndScreen(h1,sub,lost)}catch(e){console.error(e);return _es.apply(this,arguments)}}}
function vEndScreen(h1,sub,lost){const V=VS();
  if(lost&&!V.result){V.result='gameover';V.done=true}
  achCheck({end:true,lost});const achNew=(S.achGame||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  let sc={score:0,grade:'-',lines:[]};try{if(typeof visitScore==='function')sc=Object.assign(sc,visitScore()||{})}catch(e){console.error(e)}
  const g=lost?'F':sc.grade;S.ending={score:sc.score|0,grade:g,title:h1,lost:!!lost,visit:true,result:V.result};
  saveGame();
  const LN=VISIT_LENS[V.len],H=VISIT_HOMES[V.home]||VISIT_HOMES.tacoma,R=vRental(),s=S.stats,n=o=>Object.keys(o||{}).length;
  const row=(k,v)=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  let extra='';for(const f of VISIT_END_ROWS){try{(f()||[]).forEach(r=>{extra+=row(r[0],r[1])})}catch(e){console.error(e)}}
  const broke=Object.keys(V.rules||{});
  app.innerHTML=withName(`<div class="end visit-end"><div style="display:flex;justify-content:space-between;align-items:center"><div class="small-note" style="color:var(--mute)">${lost?'VISIT CUT SHORT':'VISIT COMPLETE'} · {{name}}</div><button class="gear" style="background:var(--sand);color:var(--ink)" onclick="openSettings()" aria-label="Settings">⚙️</button></div><h1>${h1}</h1><p>${sub}</p>
  <div style="display:flex;gap:16px;align-items:center;margin:16px 0"><div class="grade">${esc(g)}</div><div><b style="font-family:Fraunces;font-size:20px">${VRESULT[V.result]||esc(String(V.result||''))}</b><div style="color:var(--mute);font-size:14px">${LN.ic} ${LN.n} · from ${H.ic} ${H.n} · ${DF().ic} ${DF().n}</div></div></div>
  ${sc.lines&&sc.lines.length?`<ul class="visit-lines">${sc.lines.map(l=>`<li>${l}</li>`).join('')}</ul>`:''}
  ${row('Result',VRESULT[V.result]||'')}${row('Score',sc.score|0)}
  ${row('Money left',`<span style="${S.money<0?'color:#ff8a70':''}">${S.money<0?'−':''}${$(Math.abs(Math.round(S.money)))}</span> of ${$(V.budget)}`)}
  ${row('📸 Photos',n(V.photos))}${row('👀 Sights seen',`${n(V.seen)} of ${VSIGHTS.length}`)}${row('🤝 Visitor reputation',(V.rep>0?'+':'')+V.rep)}
  ${R?row('🛖 Rental cabin',`${V.nights} nights · ${$(V.rentalCost)}${R.late?` · late check-out ${$(VLATE_FEE)}`:''}`):''}
  ${R?row('📋 House rules',broke.length?'Broken: '+broke.map(k=>VRULES[k].n.toLowerCase()).join(', '):'All kept'):''}
  ${row('⛴️ Ferry crossings',s.crossings)}${row('Hours waiting for the boat',(s.waited/60).toFixed(1))}${row('Spent on fares',$(s.fares))}
  ${extra}
  <div class="kv ach-end"><span>🏆 Achievements this game</span><b style="text-align:right">${achNew.length?achNew.map(a=>a.ic+' '+a.n).join(', '):'none new'}</b></div>
  <button class="big" style="width:100%;margin-top:22px" onclick="startVisit()">Plan another visit 🧳</button><button class="act" style="margin-top:10px;justify-content:center" onclick="titleScreen()"><span class="tx" style="text-align:center"><b>Back to title</b></span></button></div>`);
  try{const end=document.querySelector('.end');if(end&&typeof feedbackOpen==='function'){const p=document.createElement('p');p.className='fb-end';p.innerHTML='<button type="button" id="fbEnd" class="linkbtn" onclick="feedbackOpen()">💬 Send feedback</button>';end.appendChild(p)}}catch(e){}
  window.scrollTo(0,0)}

// ======== title screen: 🧳 Visit the island → length → where you live → difficulty ========
function visitLenModal(then){
  modal('🧳 How long is your visit?','<p>You live on the mainland. Pick a visit: you get a spending budget instead of a job, and the island’s ferry decides the rest.</p>',
    Object.keys(VISIT_LENS).map(k=>{const V=VISIT_LENS[k],c=V.nights*(VISIT_RATE[k]||0);return {l:`${V.ic} ${V.n}${k==='regular'?': a month':''}`,s:k==='regular'?V.d:`${V.d} Budget ${$(VISIT_BUDGET[k])}${c?`, cabin ${$(c)}`:''}.`,fn:()=>then(k)}})
    .concat([{l:'Never mind',fn:()=>{}}]))}
function visitHomeModal(then){
  modal('🏠 Where do you live?','<p>Your visit starts and ends at home. Everyone takes I-5 to the Steilacoom ferry.</p>',
    Object.keys(VISIT_HOMES).map(k=>({l:`${VISIT_HOMES[k].ic} ${VISIT_HOMES[k].n}`,s:VISIT_HOMES[k].d,fn:()=>then(k)})).concat([{l:'Never mind',fn:()=>{}}]))}
window.startVisit=()=>{const go=()=>visitLenModal(len=>visitHomeModal(home=>diffModal(k=>{S=null;visitorNew(len,home,k);tab='act';render()})));
  if(!profileName())nameModal({first:true,then:go});else go()};
function vTitleButton(){const t=document.querySelector('.title .body');if(!t||t.querySelector('#visitBtn'))return;
  const b=document.createElement('button');b.id='visitBtn';b.className='ghost';b.setAttribute('onclick','startVisit()');b.textContent='🧳 Visit the island';
  const ref=t.querySelector('#chBtn')||[...t.querySelectorAll('button.ghost')].find(x=>/Save slots/.test(x.textContent));ref?t.insertBefore(b,ref):t.appendChild(b);
  // Continue says it's a visit
  try{const d=loadSave();if(d&&d.S&&d.S.visitor){const c=[...t.querySelectorAll('button.big')].find(x=>/resumeGame/.test(x.getAttribute('onclick')||''));
    const LN=VISIT_LENS[d.S.visitor.len];if(c&&LN)c.textContent=c.textContent.replace(/^(Continue as [^:]+: )/,`$1🧳 ${LN.n} visit · `)}}catch(e){}}
{const _ts=titleScreen;titleScreen=function(){_ts.apply(this,arguments);try{vTitleButton()}catch(e){console.error(e)}}}
{const _si=slotInfo;slotInfo=function(n){const i=_si.apply(this,arguments);try{if(i&&!i.broken){const r=rawSave(n),x=r&&JSON.parse(r.v).S;if(x&&x.visitor&&VISIT_LENS[x.visitor.len])i.txt=`🧳 ${VISIT_LENS[x.visitor.len].n} visit · ${i.txt}`}}catch(e){}return i}}
vTitleButton();

// ======== the first-day guide (instead of the resident's guided week) ========
const VGUIDE=[
  {id:'v_ferry',when:()=>VS().islandAt==null&&L[S.loc].side==='M',t:()=>`⛴️ Your visit starts on the mainland. Drive to the <b>Steilacoom Ferry Terminal</b> and be in line <b>20 minutes</b> before the boat. The ⛴️ Ferry tab has the schedule.`},
  {id:'v_checkin',when:()=>!!vRental()&&!vRental().checkedIn&&L[S.loc].side==='I',t:()=>`🔑 Your <b>Rental cabin</b> is on the island map. Check-in opens at <b>${fmt(VCHECK_IN)}</b> ${DAYS[VS().arr]}; until then, go explore.`},
  {id:'v_sights',when:()=>L[S.loc].side==='I'&&S.loc!=='aiDock',t:()=>`📸 <b>See the sights</b>: Lake Josephine, Johnson Farm, Andy’s Wild Wood Park, Jacobs Point and dinner at the Riv. The money you don’t spend counts toward your score.`},
  {id:'v_lastboat',when:()=>vFinalDay()&&L[S.loc].side==='I',t:()=>`🌙 Last day. ${vRental()&&!vRental().checkedOut?`Check out of the cabin by <b>${fmt(VCHECK_OUT)}</b> and take the trash out. `:''}The <b>last boat</b> off the island leaves at <b>${fmt(vLastBoatAbs())}</b>. Miss it and you’re stuck.`}];
{const _tv=tipView;tipView=function(){if(!visitorOn())return _tv.apply(this,arguments);
  try{if(!tipsOn()||S.over)return '';const T=tutState();if(T.at===S.t)return '';
    const t=(VS().len==='regular'&&typeof REG_GUIDE!=='undefined'?REG_GUIDE:VGUIDE).find(x=>!T.seen.includes(x.id)&&(()=>{try{return !!x.when()}catch(e){return false}})());if(!t)return '';
    const txt=typeof t.t==='function'?t.t():t.t;
    return `<div class="tip" role="note" aria-label="Visit tip"><div class="tut-k">🧳 Your visit</div>${txt}<div class="tb"><button onclick="tipSeen('${t.id}')">Got it</button><button onclick="setPref('tips',false);render()">Turn off tips</button></div></div>`}
  catch(e){console.error(e);return ''}}}

// ======== saves: a visit save keeps a sane S.visitor ========
{const _mg=migrate;migrate=function(d){const r=_mg(d),x=r.S;
  if(x&&x.visitor!=null){if(typeof x.visitor!=='object'||Array.isArray(x.visitor))delete x.visitor;else{const v=x.visitor,def=vsInit(v.len,v.home);
    if(!VISIT_LENS[v.len])v.len='weekend';if(!VISIT_HOMES[v.home])v.home='tacoma';
    for(const k in def){if(v[k]===undefined||v[k]===null&&def[k]!==null)v[k]=def[k];else if(def[k]&&typeof def[k]==='object'&&!Array.isArray(def[k])&&v[k]&&typeof v[k]==='object')for(const j in def[k])if(v[k][j]===undefined)v[k][j]=def[k][j]}
    if(!Array.isArray(v.texts))v.texts=[];
    for(const k of ['budget','rep','fees','rentalCost','spent'])v[k]=num(v[k],0);
    if(v.len==='regular'){x.mode='month';x.weekNo=Math.max(0,Math.min(3,num(x.weekNo,0)))}else{x.mode='week';x.emp=null;x.rx=true}delete x.story}}
  return r}}
