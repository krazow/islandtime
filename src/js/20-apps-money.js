// ---------------- 📱 apps: money (Island Credit Union, Gig Work, Mainland Market) ----------------
// Three installable phone apps (see the plug-in pattern at the top of 14-phone-apps.js).
// State, all lazy so older saves just work: PH().icu={auto}, PH().gig={d,n,earned}, PH().mkt={order}.
//   order = {n, cost, at (ready, abs min), close (pickup counter closes, abs min), spoiled}
const ICU=()=>{const P=PH();return P.icu||(P.icu={auto:false})};
const GIG=()=>{const P=PH(),g=P.gig||(P.gig={d:-1,n:0,earned:0});if(g.d!==dayKey()){g.d=dayKey();g.n=0;g.earned=0}return g};
const MKT=()=>{const P=PH();return P.mkt||(P.mkt={order:null})};
let APM_MSG=null;   // {app,h,t}: the last result shown in an app until game time moves on (not saved)
const apmMsg=(app,h,cls)=>{APM_MSG={app,h,cls:cls||'ok',t:S.t}};
const apmShow=app=>APM_MSG&&APM_MSG.app===app&&APM_MSG.t===S.t?phCard(APM_MSG.h,APM_MSG.cls):'';

// ---- 💳 Island Credit Union ----
const ICU_OVERDRAFT=25;
const icuDebt=()=>Math.max(0,-S.money);
function icuDueIn(k){return hhDue(k)-dayKey()}
function icuDueTxt(k){const dd=icuDueIn(k);return dd<=1?hhDueTxt(k):dd<=6?`due ${DAYS[hhDue(k)%7]}`:`due in ${dd} days`}
function icuUnpaid(){return Object.keys(HH_BILLS).filter(k=>!HB(k).paid&&HB(k).check<0)}
// autopay: on a bill's due day (or right away if it's already late) it pays, money or not
function icuAutopay(){
  if(!S||S.over||!S.ph||!S.ph.icu||!S.ph.icu.auto||!phoneInstalled('bank'))return;
  const dk=dayKey();
  for(const k of icuUnpaid()){if(hhDue(k)>dk)continue;
    const B=HH_BILLS[k],b=HB(k),amt=hhOwed(k),short=S.money<amt;
    money(-amt);b.paid=true;b.how='autopay';
    if(short){money(-ICU_OVERDRAFT);adj('stress',2);
      say(`💳 Autopay paid ${B.who}: ${$(amt)}. You didn’t have it, so Island Credit Union covered it on your card and charged a ${$(ICU_OVERDRAFT)} overdraft fee. They call it “courtesy pay.” Nobody feels the courtesy.`);
      phoneNotify('💳','Autopay: overdraft',`${B.n} ${$(amt)} + ${$(ICU_OVERDRAFT)} fee`)}
    else{say(`💳 Autopay paid ${B.who}: ${$(amt)}. You didn’t even have to find a bar of signal.`);phoneNotify('💳',`Autopay: ${B.n} paid`,$(amt))}}
}
phoneOnTime(icuAutopay);
function icuPay(ks){if(!phoneCan())return;ks=ks.filter(k=>hhOpenBills().includes(k));if(!ks.length)return;
  const tot=ks.reduce((s,k)=>s+hhOwed(k),0);ks.forEach(k=>hhPay(k,'online'));
  apmMsg('bank',`✅ Paid ${ks.length>1?ks.length+' bills':HH_BILLS[ks[0]].n.toLowerCase()}: ${$(tot)}.`);afterAction()}
function icuAutoToggle(){const I=ICU();I.auto=!I.auto;I.since=I.auto?dayKey():-1;
  say(I.auto?'💳 Autopay is on. Island Credit Union will pay each bill on its due day, whether or not the money is there. (If it isn’t: $25 overdraft fee.)':'💳 Autopay is off. The bills are back to being your problem.');
  apmMsg('bank',I.auto?'🔁 Autopay on: bills pay themselves on their due day.':'Autopay off.',I.auto?'ok':'');
  icuAutopay()}
definePhoneApp({id:'bank',name:'Island Credit Union',ic:'💳',order:65,size:'48 MB',desc:'Balance, card debt and bills. Pay from anywhere, or turn on autopay.',
  badge:()=>ICU().auto?0:icuUnpaid().filter(k=>icuDueIn(k)<=1).length,
  view(){const I=ICU(),debt=icuDebt(),open=hhOpenBills(),un=icuUnpaid(),dk=dayKey();let h=apmShow('bank');
    h+=`<div class="icu-bal ${debt?'neg':''}"><small>${debt?'Card balance':'Checking'}</small><b>${debt?'−':''}${$(Math.abs(S.money))}</b></div>`;
    const avail=CARD_LIMIT-debt;
    h+=phCard(debt?`💳 You owe <b>${$(debt)}</b> on the card. Limit ${$(CARD_LIMIT)}: <b>${$(Math.max(0,avail))}</b> left for essentials (groceries, ferry fares, a motel).`
      :`💳 Card: nothing owed. If cash runs out, essentials can go on the card down to −${$(CARD_LIMIT)}.`,debt>CARD_LIMIT*0.7?'warn':'');
    h+=phNote(debt?`Score: card debt counts against you dollar for dollar. Right now it’s costing about <b>${Math.round(debt*DF().score)} points</b>. Paychecks pay it down automatically.`
      :'Score: every dollar you end the week with counts. Card debt would count against you, dollar for dollar.');
    if(S.daily&&S.daily.day===day()){const dm=Math.round(S.money-S.daily.money);h+=`<div class="ph-li"><b>Today so far</b><span class="${dm<0?'icu-neg':''}">${dm>=0?'+':'−'}${$(Math.abs(dm))}</span></div>`}
    h+=`<div class="ph-sub">Bills</div>`;
    const paid=Object.keys(HH_BILLS).filter(k=>HB(k).paid||HB(k).check>=0);
    if(!un.length)h+=phCard('✅ Nothing owed right now. Enjoy it.','ok');
    for(const k of un){const B=HH_BILLS[k],dd=icuDueIn(k),isOpen=open.includes(k);
      h+=`<div class="ph-li icu-bill ${dd<0?'late':dd<=1?'soon':''}"><b>${B.ic} ${B.n} · ${$(hhOwed(k))}</b><span>${icuDueTxt(k)}${HB(k).fees?' · incl. late fee':''}</span></div>`;
      h+=isOpen?phBtn(`Pay ${B.n.toLowerCase()} — ${$(hhOwed(k))}`,()=>icuPay([k]),{cls:dd<=1?'primary':'',sub:`${B.who}. 5 min.`})
        :phNote(`Statement not out yet.${I.auto?' Autopay will get it.':''}`)}
    if(open.length>1)h+=phBtn(`Pay all ${open.length} — ${$(open.reduce((s,k)=>s+hhOwed(k),0))}`,()=>icuPay(open),{sub:`${open.length*5} min.`});
    if(paid.length)h+=phNote('Settled: '+paid.map(k=>`${HH_BILLS[k].ic} ${HH_BILLS[k].n}${HB(k).check>=0&&!HB(k).paid?' (check in the mail)':HB(k).how==='autopay'?' (autopay)':''}`).join(' · '));
    h+=`<div class="ph-sub">Autopay</div>`;
    h+=phBtn(`🔁 Autopay: ${I.auto?'On':'Off'}`,icuAutoToggle,{cls:I.auto?'primary':'',sub:I.auto?'Each bill pays itself on its due day. Short on money? It still pays, plus a $25 overdraft fee.':'Turn on and bills pay themselves on their due day. Short? It still pays, plus a $25 overdraft fee.'});
    return h}});

// ---- 💼 Gig Work ----
const GIG_SLOW=10;   // extra upload minutes on the island’s one bar
// tasks a day and pay follow your 🤲 reputation (your star rating): 4 normally, 3 when you're talked about, 2 (and 75% pay) as persona non grata
const gigRep=()=>typeof repVal==='function'?repVal():0;
function gigMax(){const r=gigRep();return r<=-60?2:r<=-20?3:4}
const gigPay=G=>Math.round(G.pay*(gigRep()<=-60?0.75:1));
const gigStars=()=>{const r=gigRep();return r>=60?'★★★★★':r>=20?'★★★★☆':r>-20?'★★★☆☆':r>-60?'★★☆☆☆':'★☆☆☆☆'};
// island gigs: neighbors post small paid errands, only for people in good standing (rep 0 or higher)
const GIG_ISLAND=[
  {id:'dogwalk',island:true,ic:'🐕',n:'Walk a neighbor’s dog',min:45,pay:15,bat:1,st:-2,at:()=>L[S.loc].side==='I',where:'on the island',t:['🐕 A shepherd mix named Pickles walks you more than you walk her. She’s thrilled. You’re damp.','🐕 Two corgis, one leash tangle, zero regrets.']},
  {id:'rxrun',island:true,ic:'💊',n:'Pick up a neighbor’s prescription',min:20,pay:12,bat:1,st:0,at:()=>S.loc==='stDock',where:'at the Steilacoom landing',t:['💊 You grab a white paper bag for Mrs. Henderson’s cousin from the pharmacy run. They Venmo you before you’re back on the boat.']},
  {id:'errand',island:true,ic:'📦',n:'Ferry-line errand',min:15,pay:10,bat:1,st:0,at:()=>S.loc==='aiDock'||S.loc==='stDock',where:'in the ferry line',t:['📦 You pass a casserole dish across three cars to its rightful owner. Paid in cash and gossip.','📦 Somebody’s forgotten lunch makes it onto the 4:35. You are a hero to one hungry deckhand.']}];
const gigList=()=>gigRep()>=0?GIGS.concat(GIG_ISLAND):GIGS;
const GIGS=[
  {id:'survey',ic:'📋',n:'Take a survey',min:10,pay:3,bat:2,st:1,t:['📋 Forty questions about your feelings toward a yogurt brand. You have strong feelings now.','📋 A survey about “your commute.” There is no box for “ferry.” You pick “Other” and type for a while.']},
  {id:'vm',ic:'🎧',n:'Transcribe a voicemail',min:20,pay:6,bat:4,st:2,t:['🎧 A man leaving his dentist a four-minute voicemail about a crown. You type “[unintelligible]” six times.','🎧 Somebody’s aunt, on speakerphone, in a car wash. You do your best.']},
  {id:'tag',ic:'🏷️',n:'Tag photos',min:30,pay:8,bat:6,st:2,t:['🏷️ Two hundred photos: is this a crosswalk? Is this a bus? Is this a crosswalk with a bus? You’re a robot’s teacher now.','🏷️ “Tag every photo with a dog.” Every photo has a dog. You’ve never been happier at work.']}];
function gigWhere(){const l=S.loc;return l==='stDock'?'Waiting at the terminal is the gig economy’s natural habitat.':l==='aiDock'?'Waiting at the landing on one bar. Uploads crawl.':L[l].side==='I'?'One bar on the island: uploads take an extra 10 minutes.':'Good signal over here. Uploads are quick.'}
function gigDo(id){const G=gigList().find(x=>x.id===id),g=GIG();if(!G||!phoneCan()||g.n>=gigMax()||S.phone<=G.bat||(G.at&&!G.at()))return false;const pay=gigPay(G);
  const slow=!G.island&&phoneSignal()===1?GIG_SLOW:0;S.t+=G.min+slow;phoneUse(G.bat);money(pay);adj('stress',G.st);g.n++;g.earned+=pay;S.stats.gigs=(S.stats.gigs||0)+1;S.stats.gigPay=(S.stats.gigPay||0)+pay;
  say(`${pick(G.t)} +${$(pay)}.${slow?' The upload on one bar takes another ten minutes.':''}`);
  apmMsg('gigs',`${G.ic} Done: +${$(pay)} in ${G.min+slow} min.${g.n>=gigMax()?' That’s all the work the app has for you today.':''}`);
  afterAction();return true}
definePhoneApp({id:'gigs',name:'Gig Work',ic:'💼',order:66,size:'61 MB',desc:'Small remote tasks for stuck moments, and the job listings.',
  badge:()=>!S.emp&&!S.interview?1:0,
  view(){const J=curJob(),I=S.interview,g=GIG(),left=gigMax()-g.n,slow=phoneSignal()===1?GIG_SLOW:0;let h=apmShow('gigs');
    h+=phCard(J?`💼 You work as <b>${J.n}</b>.`:'💼 You’re out of work. Rent doesn’t care.',J?'':'warn');
    if(I)h+=phCard(`📝 <b>Interview:</b> ${JOBS[I.job].n}, ${DAYS[I.day]} ${fmt(I.time)} at ${L[I.loc].name}.`);
    h+=phBtn('🔎 Browse job listings',()=>jobModal(),{cls:J?'':'primary',sub:J?'Switching jobs means quitting.':'Find something and set up an interview.'});
    h+=`<div class="ph-sub">Quick gigs · ${left} of ${gigMax()} left today · ${gigStars()}</div>`;if(gigRep()<=-20)h+=phNote(gigRep()<=-60?'Your rating tanked: fewer tasks, lower pay. Word travels, even online.':'Your rating slipped: one less task a day, and no island gigs.');
    h+=phNote(`Pocket change for dead time: in line, at the terminal, at a motel. ${gigWhere()}`);
    for(const G of gigList()){const here=!G.at||G.at(),dis=left<=0||S.phone<=G.bat||!here;
      if(G.island&&G===GIG_ISLAND[0])h+=`<div class="ph-sub">🏝️ Island gigs, posted by neighbors</div>`;
      h+=phBtn(`${G.ic} ${G.n} — ${$(gigPay(G))}`,()=>gigDo(G.id),{dis,sub:left<=0?'No more tasks today. Come back tomorrow.':!here?`Only ${G.where}.`:S.phone<=G.bat?'Not enough battery.':G.island?`${G.min} min · for a neighbor${G.st<0?' · relaxing':''}.`:`${G.min+slow} min${slow?' (slow upload)':''} · ${G.bat}% battery · a little stress.`})}
    if(g.earned)h+=phNote(`Earned today: ${$(g.earned)}. It’s not a job, but it’s not nothing.`);
    return h}});

// ---- 🛒 Mainland Market ----
const MKT_PACKS=[{n:3,c:54},{n:5,c:88}],MKT_FEE=5,MKT_READY=120,MKT_OPEN=420,MKT_LAST=1140,MKT_CLOSE=1320;
const mktOrder=()=>MKT().order;
const mktReady=()=>{const o=mktOrder();return !!o&&S.t>=o.at};
const mktWindow=()=>tod()>=MKT_OPEN&&tod()<MKT_LAST;
function mktPlace(n){const P=MKT_PACKS.find(p=>p.n===n);if(!P||!phoneCan()||MKT().order||!mktWindow())return false;const cost=P.c+MKT_FEE;if(!canEssential(cost))return false;
  const min=phoneSignal()===1?10:5;S.t+=min;phoneUse(1);money(-cost);S.stats.food+=n;
  MKT().order={n,cost,at:S.t+MKT_READY,close:day()*1440+MKT_CLOSE,spoiled:false};
  say(`🛒 Ordered ${n} days of groceries from Mainland Market: ${$(cost)} with the pickup fee. Ready around ${fmt(S.t+MKT_READY)} at the grocery pickup counter by the Steilacoom ferry landing. ${S.money<0?'It went on the card.':''}`.trim());
  apmMsg('market',`🛒 Order placed: ${n} days of food. Ready ${fmt(S.t+MKT_READY)} at the grocery pickup counter in Steilacoom. Pick up by ${fmt(MKT_CLOSE)} or the cold stuff spoils.`);
  afterAction();return true}
function mktSpoil(notes){const o=mktOrder();if(!o||o.spoiled)return;o.spoiled=true;const lost=Math.ceil(o.n/2);o.n-=lost;
  const t=`🥬 Your Mainland Market order sat at the pickup counter past ${fmt(MKT_CLOSE)}. The milk, the eggs and the chicken gave up: ${lost} day${lost>1?'s':''} of food spoiled. The cereal is fine. (${o.n} day${o.n===1?'':'s'} still waiting.)`;
  if(notes)notes.push(t);else say(t)}
phoneOnTime(()=>{const o=S&&S.ph&&S.ph.mkt&&S.ph.mkt.order;if(o&&!o.spoiled&&S.t>=o.close)mktSpoil()});
// the night: anything ready today and not picked up spoils before morning
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up(where,notes,d);try{const o=S.ph&&S.ph.mkt&&S.ph.mkt.order;if(o&&!o.spoiled)mktSpoil(notes)}catch(e){}return r}} // apps
function mktPickup(){const o=mktOrder();if(!o||!mktReady()||S.loc!=='stDock')return false;
  const car=!!carHere(),room=Math.max(0,(car?14:4)-S.carried),take=Math.min(o.n,room);if(take<=0)return false;
  S.t+=5;S.carried+=take;o.n-=take;if(o.n<=0)MKT().order=null;
  say(`🛒 The pickup counter by the ferry landing. ${take} day${take>1?'s':''} of groceries in paper bags${o.spoiled?', minus what spoiled':''}.${o.n>0?` You can’t carry the other ${o.n} on foot: ${o.n>1?'they stay':'it stays'} at the counter.`:''} Now get ${take>1?'them':'it'} home.`);
  afterAction();return true}
{const _actions=actions;actions=function(){const a=_actions();try{const o=mktOrder();   // apps: the grocery pickup counter by the Steilacoom ferry landing
  if(o&&S.loc==='stDock'){const car=!!carHere(),room=(car?14:4)-S.carried;
    if(mktReady())a.push({cat:'trade',ic:'🛒',l:`Pick up your grocery order (${o.n} day${o.n>1?'s':''})`,cls:'primary',dis:room<=0,
      s:room<=0?(car?'Your car is full of groceries.':'Your hands are full: on foot you carry 4 days of groceries.'):`Mainland Market pickup counter. 5 min.${!car&&o.n>room?` On foot you can take ${room}.`:''}${o.spoiled?'':` Cold stuff keeps until ${fmt(MKT_CLOSE)}.`}`,fn:mktPickup});
    else a.push({cat:'trade',ic:'🛒',l:'Grocery order: still being packed',s:`Ready around ${fmt(o.at)} at the Steilacoom pickup counter.`,dis:true})}}catch(e){}return a}}
{const _todo=todoItems;todoItems=function(){const it=_todo();try{const o=mktOrder();if(o)it.push({ok:false,fail:false,l:'Pick up your grocery order',s:`🛒 ${o.n} day${o.n>1?'s':''} of food at the pickup counter in Steilacoom${mktReady()?'':`, ready ${fmtAbs(o.at)}`}.${o.spoiled?'':` Cold stuff spoils after ${fmt(MKT_CLOSE)}.`}`,urgent:mktReady()&&!o.spoiled})}catch(e){}return it}} // apps
definePhoneApp({id:'market',name:'Mainland Market',ic:'🛒',order:67,size:'33 MB',desc:'Order groceries from anywhere; pick them up at the Steilacoom terminal.',
  badge:()=>mktReady()?1:0,
  view(){const o=mktOrder(),win=mktWindow();let h=apmShow('market');
    if(o)h+=phCard(mktReady()?`📦 <b>Your order is ready:</b> ${o.n} day${o.n>1?'s':''} of food at the grocery pickup counter by the Steilacoom ferry landing.${o.spoiled?' (Some of it spoiled.)':` Pick it up by ${fmt(MKT_CLOSE)} or the cold stuff goes bad.`}`
      :`⏳ <b>Being packed:</b> ${o.n} days of food, ready around ${fmt(o.at)} at the Steilacoom pickup counter.`,mktReady()&&!o.spoiled?'ok':'');
    h+=phNote('Supermarket prices, no store trip. Nobody delivers to the island, so it goes to the grocery pickup counter by the Steilacoom ferry landing, ready 2 hours later. Pick it up the same day.');
    for(const P of MKT_PACKS){const cost=P.c+MKT_FEE,ok=canEssential(cost);
      h+=phBtn(`🛒 ${P.n} days of food — ${$(cost)}`,()=>mktPlace(P.n),{cls:!o&&win&&P.n===3?'primary':'',dis:!!o||!win||!ok,
        sub:o?'One order at a time.':!win?`Orders ${fmt(MKT_OPEN)}–${fmt(MKT_LAST)}.`:!ok?'Card’s maxed out.':`${$(P.c)} + ${$(MKT_FEE)} pickup fee${S.money<cost?' (on the card)':''}.${P.n>4?' On foot you carry 4 days.':''}`})}
    if(!win&&!o)h+=phNote(`The shoppers clock in at ${fmt(MKT_OPEN)} and stop taking orders at ${fmt(MKT_LAST)}.`);
    return h}});
