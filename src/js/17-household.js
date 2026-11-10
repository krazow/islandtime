// ---- 🧾 household: bills, mail & packages, dump runs, a dog, cooking at home, storm prep. All state lives in S.hh ----
// Hooks: hhActions(a,loc) from actions(), hhNight(where,notes,d) from upkeepNight(), hhTodo(it) from todoItems().
// baseState() and finish() are wrapped below (new games get S.hh; old saves get it from fillDefaults in migrate()).
function hhInit(){return {bills:{},box:[],once:{},pkgs:[],trash:2,trashWarn:false,dog:null,puppy:-1,cooked:-1,batch:0,batchWk:-1,water:false,bank:false,bankFull:false,genTop:-1,part:false}}
const HH=()=>S.hh||(S.hh=hhInit());
{const _bs=baseState;baseState=function(){const s=_bs();s.hh=hhInit();return s}}
// ---- bills: one statement a month each (week mode squeezes them into the one week) ----
const HH_BILLS={
  net:{ic:'📶',n:'Internet',who:'OneBar Wireless',amt:69,fee:10,coll:25,w:0,d:4,wk:4,late7:'OneBar throttles you to “heritage speed.” A photo takes four minutes to load. It’s a photo of a cat.'},
  elec:{ic:'💡',n:'Electric',who:'Island Power & Light Co-op',amt:118,fee:15,coll:60,w:1,d:3,wk:3,late7:'A pink envelope from Island Power & Light: <b>DISCONNECT NOTICE</b>. A lineman will “visit” if it isn’t paid within a week.'},
  phone:{ic:'📱',n:'Phone',who:'your phone carrier',amt:55,fee:10,coll:25,w:2,d:1,wk:1,late7:'Your carrier texts you about your overdue bill. Then texts again. Then calls. The one bar never felt so strong.'},
  ins:{ic:'🛡️',n:'Home insurance',who:'Fir & Tide Mutual',amt:84,fee:12,coll:25,w:3,d:2,wk:2,late7:'Fir & Tide Mutual writes, very politely, that your policy will lapse. Given the trees around your roof, that’s a scary letter.'}};
const hhDue=k=>S.mode==='month'?HH_BILLS[k].w*7+HH_BILLS[k].d:HH_BILLS[k].wk;
const HB=k=>{const b=HH().bills;return b[k]||(b[k]={paid:false,late:0,fees:0,check:-1,how:''})};
function hhAmt(k){const B=HH_BILLS[k];if(k!=='elec')return B.amt;const s=seasonId();return B.amt+(s==='winter'?40:s==='summer'?-35:0)}
const hhOwed=k=>hhAmt(k)+HB(k).fees;
const hhDueTxt=k=>{const dd=hhDue(k)-dayKey();return dd<0?`${-dd} day${dd===-1?'':'s'} late`:dd===0?'due today':dd===1?'due tomorrow':`due ${DAYS[hhDue(k)%7]}`};
// a bill shows up a week before it's due and stays until it's settled
function hhOpenBills(){const dk=dayKey();return Object.keys(HH_BILLS).filter(k=>!HB(k).paid&&HB(k).check<0&&dk>=hhDue(k)-6)}
function hhPay(k,how){const b=HB(k),B=HH_BILLS[k],amt=hhOwed(k);
  if(how==='online'){money(-amt);b.paid=true;b.how='online';S.t+=5;phoneTick();adj('stress',-1);say(`${B.ic} Paid ${B.who}: ${$(amt)}, online, in four taps and one spinning wheel.${b.fees?' The late fee stings a little.':''}`)}
  else {money(-(amt+0.78));b.check=dayKey()+2;b.how='mail';S.t+=10;say(`✉️ A check for ${$(amt)} to ${B.who}, a 78¢ stamp, flag up on the mailbox. It should get there in two days${dayKey()+2>hhDue(k)?', which is after it’s due':''}.`)}
}
function hhBillsModal(){
  const ks=hhOpenBills(),ph=S.phone>0,opts=[];
  ks.forEach(k=>{const B=HH_BILLS[k],late=dayKey()>hhDue(k);
    opts.push({l:`${B.ic} Pay ${B.n.toLowerCase()} online — ${$(hhOwed(k))}`,s:`${B.who}, ${hhDueTxt(k)}. 5 min on your phone.${ph?'':' Your phone is dead.'}`,dis:!ph,fn:()=>{hhPay(k,'online');afterAction()}});
    opts.push({l:`✉️ Mail a check for the ${B.n.toLowerCase()} bill`,s:`Takes 2 days to get there${late||dayKey()+2>hhDue(k)?': it’ll arrive late':''}. 10 min.`,fn:()=>{hhPay(k,'mail');afterAction()}})});
  if(ks.length>1&&ph){const tot=ks.reduce((s,k)=>s+hhOwed(k),0);opts.unshift({l:`💻 Pay them all online — ${$(tot)}`,s:`${ks.length} bills, 5 minutes each.`,fn:()=>{ks.forEach(k=>hhPay(k,'online'));afterAction()}})}
  modal('🧾 Bills',`<p>The bills come whether the ferry runs or not. Pay online in a few minutes, or mail a check (2 days to get there). Late means a late fee, and after a week, sternly worded envelopes.</p>`,opts.concat([{l:'Not now',fn:()=>{}}]));
}
function hhBillsNight(notes,dk){
  let anyLate=false;
  for(const k in HH_BILLS){const b=HB(k),B=HH_BILLS[k],due=hhDue(k);if(b.paid)continue;
    if(b.check>=0&&b.check<=dk){b.paid=true;if(b.late)notes.push(`✉️ Your check finally reached ${B.who}. Account settled.`);continue}
    if(dk<due)continue;
    b.late++;if(b.late<=7)anyLate=true;if(b.late===1)S.stats.lateBills=(S.stats.lateBills||0)+1;
    if(b.late===1){if(b.check>=0){money(-B.fee);notes.push(`${B.ic} Your check to ${B.who} is still in the mail, and they don’t care: ${$(B.fee)} late fee, charged to your card.`)}
      else{b.fees+=B.fee;notes.push(`${B.ic} The ${B.n.toLowerCase()} bill was due today and you didn’t pay it. ${B.who} adds a ${$(B.fee)} late fee. (🏠 Inside the house → 🧾 Pay bills.)`)}
      adj('stress',3)}
    else if(b.late===7&&b.check<0){adj('stress',2);notes.push(`${B.ic} ${B.late7}`)}
    else if(b.late>=14&&b.check<0){const amt=hhOwed(k)+B.coll;money(-amt);b.paid=true;b.how='collections';adj('stress',2);homeAdj(-2);
      notes.push(k==='elec'?`💡 Island Power & Light’s lineman pulled your meter this morning while you were out. Your card got charged ${$(amt)} (the bill, the late fee and a ${$(B.coll)} reconnect fee) and the power came back by dinner. Every clock in the house is blinking 12:00.`
        :`${B.ic} ${B.who} sent the bill to collections and charged your card ${$(amt)}, with a ${$(B.coll)} fee on top. That one’s settled, expensively.`)}
  }
  if(anyLate)adj('stress',1); // a nag while a bill is fresh-late; after the notice, it's just the fees
}
// settle what's still owed when the game ends, so ignoring bills doesn't pay
{const _fin=finish;finish=function(){try{if(S&&S.hh)for(const k in HH_BILLS){const b=HB(k);if(!b.paid){money(-(b.check>=0?0:hhOwed(k)));b.paid=true;b.how='end'}}}catch(e){}return _fin.apply(this,arguments)}}
// ---- deliveries: USPS, UPS and FedEx all come to the island now ----
// The island post office closed with the old store (it was inside the store building), so USPS brings mail
// to your roadside mailbox, and every carrier leaves packages on your porch. 10% of deliveries go to the
// wrong address: they land in H.missing (kind 'mail' or 'pkg') for a later "find your package" feature.
let DELIVERY_WRONG=0.10; const MAIL_TIME=780;   // the USPS carrier reaches your road around 1 PM
const CARRIERS={
  usps:{ic:'📮',n:'USPS Ground Advantage',sh:'USPS',fee:0,days:3,dow:[0,1,2,3,4,5],time:780},
  ups:{ic:'🟫',n:'UPS Ground',sh:'UPS',fee:6,days:2,dow:[0,1,2,3,4],time:960},
  fedex:{ic:'🟪',n:'FedEx overnight',sh:'FedEx',fee:14,days:1,dow:[0,1,2,3,4,5],time:660},
  counter:{ic:'🏪',n:'Hold at the Steilacoom pickup counter',sh:'the pickup counter',fee:0,days:2,dow:[0,1,2,3,4,5,6],time:0}};
function hhArrive(via,dk){const C=CARRIERS[via];let at=dk+C.days;while(!C.dow.includes(at%7))at++;return at}
const hhWrong=()=>Math.random()<DELIVERY_WRONG;
function hhMissing(){const H=HH();if(!H.missing)H.missing=[];return H.missing}
const HH_LETTERS={
  jury:{once:true,min:3,t:'⚖️ A jury summons from Pierce County Superior Court: report to Tacoma at 8:00 AM on a Monday. Fuel-run Monday. You check “undue hardship,” write “I live on an island,” and mail it back. You’re excused before the envelope dries.',fx:()=>adj('stress',-2)},
  seeds:{once:true,t:'🌱 A seed catalog thick as a phone book. You dog-ear thirty-one pages of heirloom tomatoes for a yard that gets four hours of sun, in July.',fx:()=>adj('stress',-3)},
  refund:{once:true,min:5,t:'💌 A check for $12.40 from a class-action settlement over a router you owned in 2014. Justice, finally.',fx:()=>money(12.4)},
  coopnews:{t:'🏪 The co-op newsletter, printed at someone’s kitchen table. The fundraising thermometer is colored in with a highlighter.',fx:()=>adj('stress',-1)},
  ferrynote:{t:'⛴️ A county notice about a “ferry fare study.” Everyone on the island knows exactly what that means.',fx:()=>adj('stress',1)},
  postcard:{t:'🏜️ A postcard from a mainland friend who moved to Arizona: “It’s 78 degrees!” Rude.'},
  flyer:{t:'🍕 A pizza flyer for a place 40 minutes and one ferry away. Island delivery radius: none.'},
  vet:{dog:true,t:'🐾 A reminder card from the vet in Steilacoom: your dog is due for a checkup. Your dog is fine. Your dog is perfect.'}};
function hhMailNight(dk,d){
  const H=HH();if(d===5)return;               // no mail on Sundays
  for(const k in HH_BILLS){const due=hhDue(k);if(!H.once['stmt_'+k]&&dk+1>=due-5&&dk+1<=due&&!HB(k).paid){H.once['stmt_'+k]=1;H.box.push({k:'bill',b:k,at:dk+1})}}
  if(Math.random()<0.35){const pool=Object.keys(HH_LETTERS).filter(k=>{const L2=HH_LETTERS[k];return !(L2.once&&H.once[k])&&!(L2.dog&&!H.dog)&&dk>=(L2.min||0)});
    if(pool.length){const k=pick(pool);if(HH_LETTERS[k].once)H.once[k]=1;H.box.push({k,at:dk+1})}}
  // 1 in 10 pieces ends up in someone else's mailbox
  H.box.forEach(x=>{if(x.at===dk+1&&x.w==null){x.w=hhWrong();if(x.w)hhMissing().push({kind:'mail',k:x.k,b:x.b,at:x.at})}});
  H.box=H.box.filter(x=>!x.w);
  if(H.box.length>12)H.box=H.box.slice(-12);
}
const hhMailHere=()=>HH().box.filter(x=>x.at<dayKey()||(x.at===dayKey()&&tod()>=MAIL_TIME));
function hhReadMail(){
  const H=HH(),here=hhMailHere();S.t+=10;
  const lines=here.map(x=>{if(x.k==='bill'){const B=HH_BILLS[x.b];return `${B.ic} A statement from ${B.who}: <b>${$(hhOwed(x.b))}</b>, ${HB(x.b).paid?'already paid. Nice.':hhDueTxt(x.b)+'.'}`}
    const L2=HH_LETTERS[x.k];if(!L2)return '📄 Something soggy and unreadable.';try{L2.fx&&L2.fx()}catch(e){}return L2.t});
  H.box=H.box.filter(x=>x.at>dayKey());
  say(`📬 You walk out to the mailbox: ${here.length} piece${here.length===1?'':'s'} of mail.`);
  modal('📬 Your mailbox',lines.map(l=>`<p class="hh-letter">${l}</p>`).join('')+'<p style="font-size:12px;color:var(--mute)">The mail carrier rides the 10:05 boat over and works the island roads in a right-hand-drive Jeep.</p>',[{l:'OK',fn:()=>{}}]);
  afterAction();
}
// ---- packages: order online; USPS, UPS or FedEx bring it to your porch, or hold it at the Steilacoom counter ----
const HH_SHOP={
  traps:{ic:'🪤',n:'Mouse traps (6-pack)',c:15,ok:()=>!UP().trapsOwned,get:()=>{UP().trapsOwned=true},t:'Six snap traps. Set them at home.'},
  bank:{ic:'🔋',n:'Power bank, 20,000 mAh',c:32,ok:()=>!HH().bank,get:()=>{HH().bank=true},t:'Keeps your phone alive through an outage, if you charge it before the storm.'},
  part:{ic:'🔧',n:'Well-pump pressure switch',c:26,ok:()=>!HH().part,get:()=>{HH().part=true},t:'The part that usually fails. Swap it in at home and the pump is good as new.'},
  kibble:{ic:'🦴',n:'Dog food, 30-day bag',c:36,ok:()=>!!HH().dog,get:()=>{HH().dog.kibble+=30},t:'Forty pounds. Let the driver carry it to the porch.'}};
function hhShopModal(){
  const H=HH(),opts=Object.keys(HH_SHOP).filter(k=>HH_SHOP[k].ok()&&!H.pkgs.some(p=>p.k===k)).map(k=>{const I=HH_SHOP[k];
    return {l:`${I.ic} ${I.n} — $${I.c}`,s:I.t,dis:S.money<I.c,fn:()=>hhShipModal(k)}});
  modal('📦 Order online',`<p>USPS, UPS and FedEx all deliver to Anderson Island: the trucks ride the ferry like everyone else. Or have it held at the pickup counter by the Steilacoom ferry landing.</p>${opts.length?'':'<p><i>Nothing you need right now.</i></p>'}`,opts.concat([{l:'Never mind',fn:()=>{}}]));
}
function hhShipModal(k){
  const H=HH(),I=HH_SHOP[k],dk=dayKey();
  const opts=Object.keys(CARRIERS).map(via=>{const C=CARRIERS[via],at=hhArrive(via,dk),cost=I.c+C.fee;
    return {l:`${C.ic} ${C.n}${C.fee?` +$${C.fee}`:', free'}`,s:via==='counter'?`Ready ${DAYS[at%7]}. Pick it up on your way through Steilacoom.`:`Arrives ${DAYS[at%7]}${at-dk===1?' (tomorrow)':''}, on your porch by ${fmt(C.time)}. ${C.dow.length===5?'Weekdays only.':'No Sunday delivery.'}`,dis:S.money<cost,
      fn:()=>{money(-cost);S.t+=5;phoneTick();H.pkgs.push({k,at,via,w:via==='counter'?false:hhWrong(),st:'transit'});
        say(`📦 Ordered: ${I.n.toLowerCase()}, ${via==='counter'?'held at the pickup counter by the Steilacoom ferry landing':'via '+C.sh}. Tracking says ${DAYS[at%7]}.`);afterAction()}}});
  modal(`📦 Ship the ${I.n.toLowerCase()}`,'<p>How should it get here?</p>',opts.concat([{l:'Never mind',fn:()=>{}}]));
}
// delivered = the carrier has been by. Right address → it waits on the porch; wrong address → H.missing.
const hhDelivered=p=>p.via&&p.via!=='counter'&&p.st==='transit'&&(dayKey()>p.at||(dayKey()===p.at&&tod()>=CARRIERS[p.via].time));
function hhDeliver(say2){const H=HH();
  H.pkgs.filter(hhDelivered).forEach(p=>{
    if(p.w){hhMissing().push({kind:'pkg',k:p.k,via:p.via,at:p.at});H.pkgs=H.pkgs.filter(x=>x!==p);
      say2(`📦 ${CARRIERS[p.via].sh} tracking: your ${HH_SHOP[p.k].n} was “delivered, left at front door” at ${fmt(CARRIERS[p.via].time+Math.floor(Math.random()*50))}. It’s not on your porch. It’s not behind the planter. It went to the wrong house. Somebody on the island has it: try the 📣 Island Group.`)}
    else p.st='porch'})}
const hhPorch=()=>HH().pkgs.filter(p=>p.st==='porch');
function hhBringIn(){const H=HH(),r=hhPorch();r.forEach(p=>HH_SHOP[p.k].get());H.pkgs=H.pkgs.filter(p=>!r.includes(p));return r}
const hhPkgsReady=()=>HH().pkgs.filter(p=>(!p.via||p.via==='counter')&&p.at<=dayKey());
// ---- trash and dump runs: the transfer station keeps island hours ----
function hhDumpDays(){return seasonId()==='summer'?[2,4,5,6]:[2,5,6]}
const hhDumpHours=()=>seasonId()==='winter'?[600,900]:[540,900];
function hhDumpOpen(){const h=hhDumpHours(),m=tod();return hhDumpDays().includes(day())&&m>=h[0]&&m<h[1]-50}
function hhDumpTxt(){return `Open ${hhDumpDays().map(i=>DAYS[i].slice(0,3)).join(', ')}, ${fmt(hhDumpHours()[0])}–${fmt(hhDumpHours()[1])}`}
// ---- the dog ----
const DOG_NAMES=['Pepper','Biscuit','Moose','Juniper','Clam','Ferry'];
function hhAdopt(how){const H=HH(),n=pick(DOG_NAMES);H.dog={n,fed:dayKey(),walked:dayKey(),since:dayKey(),kibble:how==='puppy'?10:14,alone:0};H.puppy=-1;adj('stress',-6);
  say(how==='puppy'?`🐶 You walk home with a wriggling puppy, half a bag of puppy food and instructions from three children. They named it ${n}. It’s ${n} now.`
    :`🐕 You sign the papers in the back of the van. A shaggy, nervous mutt named ${n} climbs into your car like it’s been waiting all its life. It probably has.`);
  showTile('🐶',`Meet ${n}`,'Food and a walk every day','good')}
// ---- the actions: at home they live in the 🏠 / 🌲 fold-outs; elsewhere they're one or two buttons ----
function hhActions(a,loc){
  const H=HH(),dk=dayKey(),d=day(),m=tod();
  if(loc==='home'){
    // bills
    const ob=hhOpenBills(),urgent=ob.filter(k=>hhDue(k)-dk<=1),inMail=Object.keys(HH_BILLS).filter(k=>!HB(k).paid&&HB(k).check>=0);
    if(ob.length) a.push({cat:'home',ic:'🧾',l:`Pay bills (${ob.length})`,due:urgent.length>0,s:ob.map(k=>`${HH_BILLS[k].ic} ${HH_BILLS[k].n} ${$(hhOwed(k))}, ${hhDueTxt(k)}`).join(' · '),fn:hhBillsModal});
    else if(inMail.length) a.push({cat:'home',ic:'✉️',l:'Checks in the mail',s:inMail.map(k=>`${HH_BILLS[k].n}: gets there ${DAYS[HB(k).check%7]}`).join(' · '),dis:true});
    hhDeliver(say);
    const mn=hhMailHere().length;
    a.push({cat:'home',ic:'📬',l:mn?`Check the mailbox (${mn})`:'The mailbox is empty',s:mn?'Out at the end of the driveway. 10 min.':`USPS comes Monday to Saturday, around ${fmt(MAIL_TIME)}.`,dis:!mn,fn:hhReadMail});
    const po=hhPorch();
    if(po.length) a.push({cat:'home',ic:'📦',l:`Bring in ${po.length} package${po.length>1?'s':''} from the porch`,due:true,s:po.map(p=>`${HH_SHOP[p.k].n} (${CARRIERS[p.via].sh})`).join(', ')+'. 5 min.',cls:'primary',fn:()=>{S.t+=5;const r=hhBringIn();
      say(`📦 On the porch, a little damp: ${andList(r.map(p=>HH_SHOP[p.k].n.toLowerCase()))}.${r.some(p=>p.k==='traps')?' (Set the traps.)':''}`);afterAction()}});
    a.push({cat:'home',ic:'📦',l:'Order something online',s:S.phone>0?'Mouse traps, a power bank, a pump part. USPS, UPS and FedEx deliver to your porch, or it can wait at the Steilacoom pickup counter.':'Your phone is dead.',dis:S.phone<=0,fn:hhShopModal});
    if(H.part) a.push({cat:'yard',ic:'🔧',l:'Install the new pressure switch',due:UP().well>30,s:'30 min in the pump house with the power off. The well pump is good as new.',fn:()=>{S.t+=30;H.part=false;UP().well=0;homeAdj(1);say('🔧 Two wires, one fitting, a lot of muttering. The pump kicks on at 40 psi and off at 60, like the label says.');afterAction()}});
    // cooking
    const cookOK=m>=960&&m<1350,ateOut=S.ateOut===d;
    a.push({cat:'home',ic:'🍳',l:H.cooked===dk?'Cooked a real dinner ✓':'Cook a real dinner',due:false,s:H.cooked===dk?'Tonight you ate like an adult.':ateOut?'You already had the Riv tonight.':!cookOK?'Dinner’s a 4 PM–10 PM thing.':S.pantry<1?'Nothing in the pantry to cook.':'45 min. Same groceries as a sad sandwich over the sink, but better: health +2, stress −4. Cheaper than the Riv.',
      dis:H.cooked===dk||ateOut||!cookOK||S.pantry<1,fn:()=>{S.t+=45;H.cooked=dk;adj('health',2);adj('stress',-4);say(pick(['🍳 Onions, garlic, whatever’s left in the crisper, a fried egg on top. You eat at the table like a person.','🍲 A pot of soup that tastes like more than the sum of its cans. The windows steam up.','🍝 Pasta with a sauce you made from scratch, if you count the jar as scratch.']));afterAction()}});
    const J=curJob(),off=!J||!J.days.includes(d);
    if(off) a.push({cat:'home',ic:'🥘',l:H.batchWk===S.weekNo?'Batch-cooked this week ✓':'Batch-cook for the week',due:false,s:H.batchWk===S.weekNo?`${H.batch} night${H.batch===1?'':'s'} of leftovers in the fridge.`:S.pantry<3?'Needs 3+ days of food in the pantry.':'2 hours on a day off: a pot of chili, a tray of something. Stretches the groceries (+1 day of food) and 5 nights of good leftovers.',
      dis:H.batchWk===S.weekNo||S.pantry<3||m>=1290,fn:()=>{S.t+=120;H.batchWk=S.weekNo;H.batch=5;H.cooked=dk;S.pantry+=1;adj('stress',-3);adj('health',1);say('🥘 Two hours, every pot you own, a radio tuned to the Mariners’ off-season talk show. Five containers in the fridge, labeled. Future you says thanks.');afterAction()}});
    // trash
    const car=S.cars.find(c=>c.id==='isl'&&c.loc==='home'),fee=Math.max(8,Math.min(24,H.trash*2));
    a.push({cat:'yard',ic:'🗑️',l:`Dump run to the transfer station — $${fee}`,due:H.trash>=6&&hhDumpOpen(),s:`${H.trash} bag${H.trash===1?'':'s'} by the shed. ${hhDumpTxt()}. Load the car: 50 min round trip, about a gallon of gas.${H.trash>=8?' The raccoons have noticed.':''}`,
      dis:H.trash<2||!hhDumpOpen()||!car||car.fuel<1||S.money<fee,fn:()=>{money(-fee);S.t+=50;phoneTick();car.fuel=Math.max(0,Math.round((car.fuel-0.9)*10)/10);H.trash=0;H.trashWarn=false;homeAdj(2);adj('stress',-2);
        say(pick([`🗑️ The transfer station attendant weighs your car, waves you to the bins and tells you about his knee. ${$(fee)}.`,`🗑️ Bags in the compactor, cans in recycling, cardboard flattened. Someone in the next bay is dropping off an entire hot tub. ${$(fee)}.`,`🗑️ You leave with an empty car, then come back for a perfectly good lamp from the swap shelf. ${$(fee)}.`]));afterAction()}});
    // the dog
    if(!H.dog&&H.puppy>=dk) a.push({cat:'home',ic:'🐶',l:'Adopt one of the neighbors’ puppies',s:`Free, with a bag of puppy food. Needs food and a walk every day; good company every night. Offer good until ${DAYS[H.puppy%7]}.`,fn:()=>{hhAdopt('puppy');afterAction()}});
    if(H.dog){const g=H.dog;
      a.push({cat:'home',ic:'🥣',l:g.fed===dk?`Fed ${g.n} ✓`:`Feed ${g.n}`,due:g.fed!==dk,s:g.fed===dk?'Bowl licked clean.':g.kibble>0?`5 min. ${g.kibble} day${g.kibble===1?'':'s'} of dog food left.`:'Out of dog food: scrambled eggs from your own pantry (−1 day). Dog food at the Lakewood supermarket or online.',
        dis:g.fed===dk||(g.kibble<=0&&S.pantry<1),fn:()=>{S.t+=5;g.fed=dk;if(g.kibble>0)g.kibble--;else{S.pantry--;say(`🍳 ${g.n} gets scrambled eggs. ${g.n} is thrilled. Your pantry isn’t.`)}say(`🥣 ${g.n} inhales breakfast and looks at you like you’ve never fed it before.`);afterAction()}});
      a.push({cat:'yard',ic:'🦮',l:g.walked===dk?`Walked ${g.n} ✓`:`Walk ${g.n}`,due:g.walked!==dk,s:g.walked===dk?'Sniffed every fern on the road.':'30 min down the road and back. Stress −3. (Lake Josephine is better, if you’re going anyway.)',
        dis:g.walked===dk,fn:()=>{S.t+=30;g.walked=dk;adj('stress',-3);say(`🦮 ${g.n} reads the whole road like a newspaper. Deer, deer, neighbor’s cat, deer.`);afterAction()}});}
    // storm prep: only once the gale is known (that morning, or the day before with 🌦️ Tides & Weather)
    const st=S.week.storm;
    if(stormKnown()){const sk=S.weekNo*7+st.day,soon=st.day-d<=1;
      a.push({cat:'home',ic:'💧',l:H.water?'Water jugs filled ✓':'Fill water jugs and the bathtub',due:soon&&!H.water,s:H.water?'For when the power takes the well pump with it.':'15 min. No power means no well pump: this is your water for coffee and a sponge bath.',dis:H.water,
        fn:()=>{S.t+=15;H.water=true;say('💧 Four jugs, two stockpots and a bathtub full of water. The house looks ready for a siege.');afterAction()}});
      a.push({cat:'home',ic:'🔋',l:H.bankFull?'Power bank charged ✓':'Charge the power bank',due:soon&&H.bank&&!H.bankFull,s:!H.bank?'You don’t own one. Order one online (📦), next-day with FedEx.':H.bankFull?'Your phone will make it through the outage.':'10 min to plug it in. Keeps your phone (and its alarm) alive through the outage.',dis:!H.bank||H.bankFull,
        fn:()=>{S.t+=10;H.bankFull=true;say('🔋 The power bank’s four little lights go solid. Your phone has a lifeboat.');afterAction()}});
      if(S.gen==='home') a.push({cat:'yard',ic:'⛽',l:H.genTop===sk?'Generator topped off ✓':'Top off and test the generator',due:soon&&H.genTop!==sk,s:H.genTop===sk?'It’ll start tonight.':S.homeGas<3?`Needs 3 gal in the shed (${S.homeGas} now).`:'20 min: fill it, a test run in the driveway. It starts on the first pull when it matters.',dis:H.genTop===sk||S.homeGas<3,
        fn:()=>{S.t+=20;H.genTop=sk;say('⛽ Topped off, choke, pull. It catches on the second try and settles into a rumble. Ready.');afterAction()}});
    }
  }
  if(loc==='stDock'){const r=hhPkgsReady();
    if(r.length) a.push({cat:'trade',ic:'📦',l:`Pick up ${r.length} package${r.length>1?'s':''} from the shipping counter`,s:r.map(p=>HH_SHOP[p.k].n).join(', ')+'. 5 min.',cls:'primary',fn:()=>{S.t+=5;r.forEach(p=>{HH_SHOP[p.k].get()});H.pkgs=H.pkgs.filter(p=>!r.includes(p));
      say(`📦 The clerk at the pack-and-ship counter checks your name, and there ${r.length>1?'they are':'it is'}: ${andList(r.map(p=>HH_SHOP[p.k].n.toLowerCase()))}.${r.some(p=>p.k==='traps')?' (Set the traps at home.)':''}`);afterAction()}});
    if(!H.dog&&d===5&&m>=600&&m<840) a.push({cat:'here',ic:'🐕',l:'Adopt a dog from the shelter van — $85',s:'The county shelter’s Saturday adoption van, parked in the terminal lot. A dog needs food and a walk every day.',dis:S.money<85,fn:()=>{money(-85);S.t+=40;hhAdopt('shelter');afterAction()}});}
  if((loc==='market'||loc==='warehouse')&&H.dog&&isOpen(loc)) a.push({cat:'trade',ic:'🦴',l:`Dog food, 30-day bag — $${loc==='warehouse'?30:38}`,s:`${H.dog.kibble} day${H.dog.kibble===1?'':'s'} left at home.`,dis:S.money<(loc==='warehouse'?30:38),fn:()=>{money(-(loc==='warehouse'?30:38));H.dog.kibble+=30;S.t+=5;say(`🦴 Forty pounds of kibble. ${H.dog.n} will smell it from the ferry.`);afterAction()}});
  if(loc==='lake'&&H.dog&&H.dog.walked!==dayKey()) a.push({cat:'here',ic:'🦮',l:`Walk ${H.dog.n} around Lake Josephine`,s:'45 min. Stress −6. Every dog on the island walks here, and so do their people.',fn:()=>{const g=H.dog;S.t+=45;g.walked=dayKey();adj('stress',-6);
    say(`🦮 ${g.n} wades in up to the elbows, refuses to come out, then shakes off next to you. Classic.`);
    if(Math.random()<0.3){if(!newNeighbor(`your dogs met at Lake Josephine`)){const ids=Object.keys(S.friends);if(ids.length){const id=pick(ids);friendPts(id,1);say(`🦮 You run into ${S.friends[id].name.split(',')[0]} by the water and talk for twenty minutes while the dogs negotiate.`)}}}
    afterAction()}});
}
// ---- overnight ----
function hhNight(where,notes,d){
  const H=HH(),dk=dayKey(),home=where==='home';
  hhBillsNight(notes,dk);hhMailNight(dk,d);
  hhDeliver(t=>notes.push(t));if(home){const r=hhBringIn();if(r.length)notes.push(`📦 You bring ${andList(r.map(p=>HH_SHOP[p.k].n.toLowerCase()))} in off the porch before bed.`)}
  // packages nobody picked up go back after a week (refund, minus a restocking fee)
  const old=hhPkgsReady().filter(p=>dk-p.at>=7);if(old.length){old.forEach(p=>money(HH_SHOP[p.k].c-5));H.pkgs=H.pkgs.filter(p=>!old.includes(p));notes.push(`📦 The shipping counter sent back ${andList(old.map(p=>HH_SHOP[p.k].n.toLowerCase()))}. Refunded, minus a $5 restocking fee.`)}
  // trash
  if(home){H.trash=Math.min(16,H.trash+1);
    if(H.trash>=8){homeAdj(-1);if(!H.trashWarn){H.trashWarn=true;notes.push(`🗑️ ${H.trash} bags of trash by the shed. It’s starting to smell like a decision. (Dump run: ${hhDumpTxt()}.)`)}}}
  // leftovers from a batch cook
  if(home&&H.batch>0){H.batch--;adj('health',1);adj('stress',-1)}
  // the dog
  if(H.dog){const g=H.dog;
    if(!home){g.alone++;adj('stress',3);homeAdj(-3);notes.push(`🐕 ${g.n} spent the night alone. A neighbor let them out, but there’s a chewed-up shoe waiting for you.`)}
    else{const fed=g.fed===dk,walked=g.walked===dk;
      if(fed&&walked){adj('stress',-4);if(Math.random()<0.5)notes.push(pick([`🐕 ${g.n} sighs, circles three times and falls asleep on your feet. Stress −4.`,`🐕 ${g.n} snores by the woodstove. The house feels less empty.`,`🐕 ${g.n} hears something outside, barks once to tell it off, and goes back to sleep.`]))}
      else{if(!fed){adj('stress',3);homeAdj(-2);notes.push(`🐕 ${g.n} didn’t get dinner and made sure you knew: the kitchen trash is all over the floor.`)}
        if(!walked){adj('stress',1);homeAdj(-2);notes.push(`🐕 No walk today. ${g.n} found a spot on the rug instead.`)}}}}
  // storm night: what you prepared
  if(home&&stormNight(d)){
    if(H.genTop===S.weekNo*7+d&&S.gen==='home'&&UP().genSvc>14)UP().genSvc=14;
    if(H.bankFull){H.bankFull=false;phoneTick();S.phone=100;notes.push('🔋 You plug your phone into the power bank before bed. Whatever happens tonight, your alarm will go off.')}
  }
}
// ---- the morning after an outage: water jugs cover the well pump ----
{const e=EV.find(x=>x.id==='no_water');if(e){const r0=e.run;e.run=function(ctx){const H=HH();if(H.water){H.water=false;adj('stress',-1);say('🚿 No power, no well pump. But you filled the jugs and the bathtub before the storm: camp-stove coffee and a sponge bath. You feel a little smug.');return}return r0.call(this,ctx)}}}
// ---- events ----
Object.assign(TILE_META,{puppy_litter:['🐶','The neighbors’ dog had puppies','good'],raccoons:['🦝','Raccoons got into the trash','bad']});
defEvent({id:'puppy_litter',hook:'wake',priority:2,max:1,cond:()=>S.loc==='home'&&!HH().dog&&HH().puppy<0&&!HH().once.puppy&&dayKey()>=3,chance:0.2,
  run(){const H=HH();H.once.puppy=1;H.puppy=dayKey()+3;say(`🐶 A hand-lettered sign at the end of the road: “FREE PUPPIES. Lab, mostly. Ask the kids.” The kids have already spotted you. (Adopt from 🏠 Inside the house, until ${DAYS[H.puppy%7]}. Or don’t: they’re very persuasive, but it’s a lot.)`)}});
defEvent({id:'raccoons',hook:'night',priority:3,max:2,cooldown:2,cond:ctx=>ctx.where==='home'&&HH().trash>=8,chance:()=>Math.min(0.5,0.15+0.05*(HH().trash-8)),
  run(ctx){homeAdj(-6);adj('stress',5);repAdd(-5,'raccoons spread your trash down the road',{notes:ctx.notes});ctx.notes.push(`🦝 2 AM: a crash, then chittering. Raccoons got into the trash bags by the shed and spread them across the yard with real artistic vision. (Dump run: ${hhDumpTxt()}.)`)}});
// ---- To-do ----
function hhTodo(it){
  const H=HH(),dk=dayKey();
  for(const k in HH_BILLS){const B=HH_BILLS[k],b=HB(k),due=hhDue(k);
    const thisWeek=Math.floor(due/7)===S.weekNo||S.mode!=='month';
    if(!thisWeek&&(b.paid||dk<=due))continue;
    if(!b.paid&&b.check<0&&dk<due-6)continue;
    it.push({ok:b.paid||b.check>=0,fail:false,l:`Pay the ${B.n.toLowerCase()} bill`,s:b.paid?`${B.ic} Paid${b.how==='collections'?', via collections. Ouch':b.how==='end'?'':''}.`:b.check>=0?`✉️ Check in the mail to ${B.who}.`:`${B.ic} ${$(hhOwed(k))} to ${B.who}, ${hhDueTxt(k)}. Pay at home: 🏠 Inside the house → 🧾 Pay bills.`,urgent:!b.paid&&b.check<0&&due-dk<=1});}
  if(H.trash>=5) it.push({ok:false,fail:false,l:'Take a dump run',s:`🗑️ ${H.trash} bags by the shed. Transfer station: ${hhDumpTxt()}.${H.trash>=8?' Raccoons are circling.':''}`,urgent:H.trash>=10});
  if(H.dog){const g=H.dog;it.push({ok:g.fed===dk&&g.walked===dk,fail:false,l:`Take care of ${g.n}`,s:`🐕 Fed ${g.fed===dk?'✓':'—'} · walked ${g.walked===dk?'✓':'—'} · ${g.kibble} day${g.kibble===1?'':'s'} of dog food.`,urgent:false})}
  const tr=H.pkgs.filter(p=>p.via&&p.via!=='counter'&&p.st==='transit');if(tr.length) it.push({ok:true,fail:false,l:'Packages on the way',s:tr.map(p=>`📦 ${HH_SHOP[p.k].n}: ${CARRIERS[p.via].sh}, ${p.at===dk?'today':DAYS[p.at%7]}`).join(' · '),urgent:false});
  const po=hhPorch();if(po.length) it.push({ok:false,fail:false,l:'Bring in your packages',s:`📦 ${andList(po.map(p=>HH_SHOP[p.k].n.toLowerCase()))}, on your porch at home.`,urgent:false});
  const pk=hhPkgsReady();if(pk.length) it.push({ok:false,fail:false,l:'Pick up your packages',s:`📦 ${andList(pk.map(p=>HH_SHOP[p.k].n.toLowerCase()))}, at the pack-and-ship counter by the Steilacoom ferry landing.`,urgent:false});
  const mail=hhMailHere().length;if(mail>=3) it.push({ok:false,fail:false,l:'Check your mail',s:`📬 ${mail} pieces in your mailbox at home.`,urgent:false});
  const st=it.find(x=>x.l==='Be ready for the storm');
  if(st){const sk=S.weekNo*7+S.week.storm.day;st.s+=` Storm prep: 💧 water ${H.water?'✓':'—'} · 🔋 power bank ${H.bankFull?'✓':H.bank?'—':'(none)'}${S.gen==='home'?` · ⛽ generator ${H.genTop===sk?'✓':'—'}`:''}.`}
}
