// ---------------- 🔥 hard life: weekly rent and car trouble (Ferry Hell) ----------------
// Both are switched by the difficulty levels in 00-data.js: LV('rent') (on/off) and LV('carTrouble') (a rate
// multiplier, so 0.5 would mean half as often). On Islander and Normal both are 0 and nothing here runs.
// State lives in S.hl and is filled lazily (HL()), so saves from before this file load fine.
//   rent: {wk: last week whose rent is settled or rolled into arrears, owed: arrears incl. late fees,
//          strikes: Sundays in a row the rent went unpaid, fees: late fees so far, evict: eviction due}
//   car:  {last: dayKey of the last breakdown, rolled: {carId: dayKey the morning roll was made}}
const RENT=125, RENT_LATE=25, RENT_EVICT=3;       // $125/week, due Sunday; 3 unpaid Sundays in a row = eviction
const CAR_P=0.1, CAR_COOL=3;                         // ~1 morning in 10 per car on Hard; 3 days between breakdowns
const TOW_ISL=275, TOW_MAIN=150;                     // the island tow has to ride the ferry over
const LANDLORD='Darlene, your landlord';
function hlInit(){return {rent:{wk:-1,owed:0,strikes:0,fees:0,evict:false},car:{last:-99,rolled:{}}}}
function HL(){const h=S.hl||(S.hl=hlInit()),d=hlInit();   // fill missing fields in place (keeps references valid)
  for(const k in d){if(!h[k]||typeof h[k]!=='object')h[k]=d[k];else for(const j in d[k])if(h[k][j]===undefined)h[k][j]=d[k][j]}return h}
{const _bs=baseState;baseState=function(){const s=_bs();s.hl=hlInit();return s}}
const rentOn=()=>!!S&&!S.visitor&&LV('rent')>0;   // a visitor's rent is the weekend-regular mode's own (44-regular.js)

// ---- 🏠 rent ----
function rentOwed(){const R=HL().rent;return (R.wk<(S.weekNo||0)?RENT:0)+R.owed}
function rentPay(){const R=HL().rent,amt=rentOwed();if(!amt||!phoneCan())return;
  money(-amt);const late=R.owed>0;R.owed=0;R.wk=S.weekNo||0;R.strikes=0;R.evict=false;S.t+=5;phoneTick();adj('stress',late?-4:-1);
  say(late?`🏠 You send ${LANDLORD.split(',')[0]} ${$(amt)}: the back rent and the late fees. She texts back a thumbs-up and “Thank you. Really.”`
    :`🏠 Rent paid: ${$(amt)} to ${LANDLORD.split(',')[0]} by phone. A roof for another week.`);
  afterAction()}
function rentNight(notes,d){
  if(!rentOn()||d!==6)return;
  const R=HL().rent,wk=S.weekNo||0;
  if(R.wk>=wk&&!R.owed){R.strikes=0;return}
  if(R.wk<wk){R.owed+=RENT;R.wk=wk}                    // this week's rent rolls into what you owe
  R.owed+=RENT_LATE;R.fees+=RENT_LATE;R.strikes++;S.stats.lateBills=(S.stats.lateBills||0)+1;S.stats.lateRent=(S.stats.lateRent||0)+1;
  const nm=LANDLORD.split(',')[0];
  if(R.strikes===1){adj('stress',4);
    notes.push(`🏠 📱 Text from ${nm}, your landlord: “Hi hon, rent didn’t come through this week. I added the ${$(RENT_LATE)} late fee. You owe ${$(R.owed)} now.” (Pay from any 📱 Phone & alarms list.)`);
    try{phoneNotify('🏠','Rent is late',`${nm}: ${$(R.owed)} owed, incl. ${$(RENT_LATE)} late fee`)}catch(e){}}
  else if(R.strikes===2){adj('stress',12);
    notes.push(`🏠 ⚠️ An envelope taped to your door: <b>NOTICE TO PAY RENT OR VACATE</b>. Two weeks behind, ${$(R.owed)} owed. ${nm} wrote on it in pen: “I don’t want to do this. Please pay by Sunday.”`);
    try{phoneNotify('🏠','Eviction warning',`${$(R.owed)} owed. Pay by Sunday.`)}catch(e){}}
  else if(R.strikes>=RENT_EVICT){R.evict=true;adj('stress',20);
    notes.push(`🏠 Three weeks without rent. ${nm} has filed for eviction.`)}
}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up.apply(this,arguments);try{rentNight(notes,d)}catch(e){console.error(e)}return r}}
// the Monday reminder
{const _sd=startDay;startDay=function(){const r=_sd.apply(this,arguments);try{if(rentOn()&&day()===0){const o=rentOwed();
  say(HL().rent.owed?`🏠 Rent: ${$(RENT)} for this week, plus ${$(HL().rent.owed)} you’re behind. Due Sunday night. Pay ${LANDLORD.split(',')[0]} by phone.`
    :`🏠 Rent is ${$(o)} a week, due Sunday night. Pay ${LANDLORD.split(',')[0]} by phone from anywhere.`)}}catch(e){console.error(e)}return r}}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{if(rentOn()&&!S.over){const o=rentOwed(),R=HL().rent;
  if(o>0)a.push({cat:'phone',ic:'🏠',l:`Pay rent by phone — ${$(o)}`,due:day()>=5||R.owed>0,
    s:!phoneCan()?'Your phone is dead. Charge it first.':`${R.owed?`Includes ${$(R.owed)} overdue${R.fees?` (late fees: ${$(R.fees)})`:''}. `:''}Due Sunday night. 5 min.`,
    dis:!phoneCan()||!canEssential(o),fn:rentPay})}}catch(e){console.error(e)}return a}}
{const _t=todoItems;todoItems=function(){const it=_t.apply(this,arguments);try{if(rentOn()){const o=rentOwed(),R=HL().rent,d=day();
  it.push({ok:o===0,fail:false,l:`Pay rent: ${$(RENT)} by Sunday`,
    s:o===0?'🏠 Paid for this week.':R.owed?`🏠 ${$(o)} owed, ${$(R.owed)} of it overdue${R.strikes>=2?'. ⚠️ One more missed Sunday and you’re evicted.':'.'} Pay by phone, anywhere.`:`🏠 ${$(o)} to ${LANDLORD.split(',')[0]}, due Sunday night. Pay by phone, anywhere. Late: ${$(RENT_LATE)} fee.`,
    urgent:o>0&&(d>=5||R.owed>0)})}}catch(e){}return it}}
// eviction ends the game; unpaid rent at the end of the game is settled (ignoring it doesn't pay)
{const _g=gameOver;gameOver=function(why){if(why!=='evicted')return _g.apply(this,arguments);
  S.over=true;MQ=[];tileQ=[];document.querySelectorAll('#tiles .tile').forEach(t=>t.remove());document.querySelectorAll('.modal-bg').forEach(e=>e.remove());
  endScreen('Evicted','Three weeks without rent. The sheriff’s deputy is apologetic, the ferry crew helps you load the boxes, and your island life fits in the back of the car.',true)}}
{const _fin=finish;finish=function(){try{if(S&&rentOn()){const R=HL().rent;if(R.evict)return gameOver('evicted');const o=rentOwed();if(o>0){money(-o);R.owed=0;R.wk=S.weekNo||0}}}catch(e){console.error(e)}return _fin.apply(this,arguments)}}
{const _ed=endDay;endDay=function(){const r=_ed.apply(this,arguments);try{if(S&&!S.over&&rentOn()&&HL().rent.evict)gameOver('evicted')}catch(e){console.error(e)}return r}}

// ---- 🚗 car trouble: a morning roll when you start a drive ----
// Fires the 'carStart' event hook from go(): once per car per day, 4 AM to noon, on either side of the water.
// The beater (241,000 miles) is twice as likely to act up as the Subaru or the diesel pickup.
function carTroubleP(car){const lv=LV('carTrouble')||0;if(!(lv>0)||!car)return 0;return CAR_P*lv*(car.id==='beat'?2:1)}
const carTroubleOk=ctx=>LV('carTrouble')>0&&ctx.mode==='car'&&!!ctx.car&&dayKey()-HL().car.last>=CAR_COOL;
Object.assign(TILE_META,{hl_battery:['🔋','Car won’t start','bad'],hl_flat:['🛞','Flat tire','bad']});
function carTroubleLeave(ctx,btns){
  const dest=ctx.to,base=dist(ctx.from,dest),isl=L[ctx.from].side==='I',name=L[dest].name;
  if(isl){btns.push({l:`Walk to ${name}`,s:`${Math.round(base*4)} min. The car stays here.`,dis:!canWalkCarry(),fn:()=>go(dest,{m:'walk',min:Math.round(base*4),started:true})});
    btns.push({l:'Stand by the road and hitch',s:'Maybe.',dis:!canWalkCarry(),fn:()=>go(dest,{m:'hitch',min:base+15,started:true})})}
  else{const c=Math.round(8+base*0.8);
    btns.push({l:`📱 Rideshare to ${name}: $${c}`,s:`${base+8} min. The car stays here.`,dis:S.phone<=0||!canEssential(c),fn:()=>go(dest,{m:'ride',min:base+8,cost:c,started:true})});
    btns.push({l:`Walk to ${name}`,s:`${Math.round(base*5)} min.`,dis:!canWalkCarry(),fn:()=>go(dest,{m:'walk',min:Math.round(base*5),started:true})})}
}
function carTroubleResume(ctx,extra,msg){S.t+=extra;phoneTick();if(msg)say(msg);go(ctx.to,Object.assign({},ctx.o,{started:true,hlDone:true}))}
function carBattery(ctx){
  const isl=L[ctx.from].side==='I',car=ctx.car,btns=[];HL().car.last=dayKey();S.stats.carTrouble=(S.stats.carTrouble||0)+1;
  if(isl&&S.friends.sam&&ctx.from==='home')btns.push({l:'Text Sam for a jump',s:'About 15 minutes.',fn:()=>carTroubleResume(ctx,15,'🔋 Sam shuffles over with cables and a mug of coffee. Two tries and it catches.')});
  btns.push({l:isl?(ctx.from==='home'?'Knock on a neighbor’s door for a jump':'Flag down a neighbor for a jump'):'Ask around the lot for a jump',s:'About 30 minutes.',
    fn:()=>carTroubleResume(ctx,30,isl?'🔋 A neighbor in muck boots pulls up nose-to-nose with jumper cables. “Cold mornings,” he says, like that explains everything. It does.'
      :'🔋 A guy in a hi-vis vest has cables in his truck. It takes three tries, but the engine catches.')});
  carTroubleLeave(ctx,btns);
  buzz(120);adj('stress',5);
  modal('🔋 The car won’t start',`<p>Click. Click. Nothing. You turn the key in the ${car.name.split(' (')[0].toLowerCase()} and the dash lights flicker. Dead battery.</p><p>${isl?'No tow truck, no parts store and no jump service on the island. Somebody’s cables, or your feet.':'Somebody in the lot has cables. Probably.'}</p>`,btns);
  return {block:true}}
function carFlat(ctx){
  const isl=L[ctx.from].side==='I',btns=[],tow=isl?TOW_ISL:TOW_MAIN,hurt=!!(S.injury&&!S.injury.treated);HL().car.last=dayKey();S.stats.carTrouble=(S.stats.carTrouble||0)+1;
  btns.push({l:'Change it to the spare: 45 min',s:hurt?'Not on that ankle.':'Jack, lug wrench, donut spare. Stress +3.',dis:hurt,fn:()=>{adj('stress',3);carTroubleResume(ctx,45,'🛞 Forty-five minutes on the wet gravel with the jack and the lug wrench. Your knees are soaked, but the donut spare is on.')}});
  btns.push({l:isl?`Call the tow from the mainland: ${$(tow)}`:`Call Lakewood Tire & Auto: ${$(tow)}`,s:isl?'The truck rides the ferry over and fixes it on the spot. About 1 h 40 min.':'Mobile tire service plugs it where it sits. About 40 min.',dis:!canEssential(tow),
    fn:()=>{money(-tow);carTroubleResume(ctx,isl?100:40,isl?`🛞 The tow truck from Lakewood rolls off the ferry, the driver plugs your tire in ten minutes and charges you ${$(tow)} for the boat ride. Island prices.`:`🛞 The Lakewood Tire & Auto van shows up, plugs the tire and takes ${$(tow)}. At least you didn’t kneel in a puddle.`)}});
  carTroubleLeave(ctx,btns);
  buzz(120);adj('stress',6);
  modal('🛞 Flat tire',`<p>You walk out to the ${ctx.car.name.split(' (')[0].toLowerCase()} and the front tire is pancaked on the ${isl?'gravel':'pavement'}. ${isl?'There’s no tire shop on the island.':'Lakewood Tire & Auto does mobile repair, for a price.'}</p>`,btns);
  return {block:true}}
defEvent({id:'hl_battery',hook:'carStart',priority:10,cooldown:CAR_COOL,cond:carTroubleOk,chance:ctx=>carTroubleP(ctx.car)*0.55,run:carBattery});
defEvent({id:'hl_flat',hook:'carStart',priority:9,cooldown:CAR_COOL,cond:carTroubleOk,chance:ctx=>carTroubleP(ctx.car)*0.45,run:carFlat});
{const _go=go;go=function(dest,o){
  try{if(o&&o.m==='car'&&!o.started&&!o.midDone&&!o.hlDone&&LV('carTrouble')>0){const car=carHere(),m=tod(),C=HL().car;
    if(car&&m>=240&&m<720&&C.rolled[car.id]!==dayKey()){C.rolled[car.id]=dayKey();
      const r=fireHook('carStart',{from:S.loc,to:dest,mode:'car',o,car});if(r&&r.block){render();return}}}}catch(e){console.error(e)}
  return _go.apply(this,arguments)}}
