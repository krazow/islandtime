// ---------------- 🚤 where the skiff lives: slip, yard, buoy or garage (1.22) ----------------
// Shared contract (other modules rely on it):
//   S.boat.store ∈ 'slip' | 'yard' | 'buoy' | 'garage'   (old saves' 'trailer' becomes 'yard')
//   S.boat.at    ∈ 'marina' | 'sunny' | 'home'           ('home' = at the cabin: on its trailer in the yard, on the buoy or
//                                                          hauled up the beach, or in the garage bay). While the trailer is
//                                                          hitched to a car somewhere else (a ferry landing, the gas station),
//                                                          at is 'road'; boatWhere() says where.
//   boatAtHome()  → true when the boat is at the cabin
//   boatWhere()   → a short phrase: "on its trailer in your yard", "in its slip at the Riv", "on your buoy", "at the Sunnyside float"
// The garage's third bay comes from another module: offered only when typeof garageBay==='function'&&garageBay().
// Upkeep (nightly): a gale with the skiff on the buoy can swamp or sink it unless you hauled it up the beach; rain fills an
// uncovered skiff on its trailer (bail it, or buy an $80 cover); winter wears the outboard while it sits outside at home.
const BOAT_STORES=['slip','yard','buoy','garage'], BOAT_COVER=80, BOAT_SALVAGE=350;
const boatAtHome=()=>boatOwn()&&(boatFix(),S.boat.at==='home');
const boatBay=()=>typeof garageBay==='function'&&!!garageBay();
const boatDockOk=()=>typeof cabinDock==='function'&&!!cabinDock();
function boatTrailerCar(){const B=S.boat;return B&&B.hitch?S.cars.find(c=>c.id===B.hitch)||null:null}
function boatTrailerLoc(){const B=S.boat;if(!B)return null;const c=boatTrailerCar();return c?c.loc:B.trLoc}
// an older save's boat: 'trailer' storage (it used to sit at the Riv ramp) moves home to the yard
function boatMigrate(B){if(!B||!B.own)return false;let ch=false;
  if(B.store==='trailer'){ch=true;B.store='yard';B.trLoc='home';B.hitch=null;
    if(B.at==='sunny')B.on='water';else{B.at='home';B.on='trailer'}}
  return ch}
function boatFix(){
  const B=S&&S.boat;if(!B||!B.own)return;
  if(boatMigrate(B))say('🚤 The marina towed your skiff’s trailer home: it’s on its trailer in your yard now.');
  if(!BOAT_STORES.includes(B.store))B.store='slip';
  if(!['marina','sunny','home','road'].includes(B.at))B.at='marina';
  if(!['water','trailer','beach'].includes(B.on))B.on=B.at==='home'&&(B.store==='yard'||B.store==='garage')?'trailer':'water';
  if(B.hitch===undefined)B.hitch=null;
  if(B.trLoc===undefined||B.trLoc===null)B.trLoc='home';
  if(B.rain===undefined)B.rain=0;if(B.cover===undefined)B.cover=false;if(B.swamped===undefined)B.swamped=false;
  if(B.hitch&&!boatTrailerCar()){B.hitch=null;B.trLoc='home';if(B.on==='trailer')B.at='home'}
  const c=boatTrailerCar();
  // a trailer towed home is backed into the yard (or the garage bay) on arrival
  if(c){if(c.loc==='home'&&B.lastLoc&&B.lastLoc!=='home'){B.hitch=null;B.trLoc='home';B.lastLoc=null;
      say(B.on==='trailer'?`🚤 You back the skiff ${B.store==='garage'&&boatBay()?'into the garage’s third bay':'into the yard'} and unhitch the trailer.`:'🚤 You back the empty trailer into the yard and unhitch it.')}
    else B.lastLoc=c.loc}
  else B.lastLoc=null;
  if(B.on==='trailer'){const l=boatTrailerLoc();B.at=['home','marina','sunny'].includes(l)?l:'road'}
  if(B.on==='beach')B.at='home';
}
function boatWhere(){
  if(!boatOwn())return '';boatFix();const B=S.boat,c=boatTrailerCar();
  if(B.on==='trailer'){
    if(c)return `on its trailer behind the ${carShortName(c)}${L[c.loc]&&c.loc!=='home'?` (${c.loc==='marina'?'at the Riv':c.loc==='sunny'?'at Sunnyside':L[c.loc].name})`:''}`;
    if(B.trLoc==='home')return B.store==='garage'&&boatBay()?'in the garage bay':'on its trailer in your yard';
    if(B.trLoc==='sunny')return 'on its trailer in the Sunnyside lot';
    if(B.trLoc==='marina')return 'on its trailer at the Riv ramp';
    return 'on its trailer';
  }
  if(B.on==='beach')return 'hauled up your beach';
  if(B.at==='home')return 'on your buoy';
  if(B.at==='sunny')return 'at the Sunnyside float';
  return B.store==='slip'?'in its slip at the Riv':'at the Riv marina’s float';
}
// ---- the choice: cost, launch time, risk ----
function boatStoreOpts(){const dock=boatDockOk(),o=[
  {id:'slip',n:'⚓ Slip at the Riv',buy:'Rent a slip at the Riv marina',cost:`$${BOAT_SLIP}/month`,launch:'None: walk down the dock and go',risk:'Low: sheltered in the marina',ok:true,
    why:`$${BOAT_SLIP} a month moorage (the first month now). Fastest: it’s always in the water at the Riv.`},
  {id:'yard',n:'🚙 Trailer in your yard',buy:'Keep it on the trailer in your yard',cost:'Free',launch:'Tow it to a ramp: +20 min, a car with a hitch',risk:'Rain fills it, winter wears the outboard, low tide at the ramp',ok:true,
    why:'No moorage. Tow it to the Riv ramp or Sunnyside to launch (+20 min each way). Needs a car with a tow hitch.'},
  {id:'buoy',n:'🛟 Your mooring buoy',buy:'Tie it to your buoy',cost:'Free',launch:'Row out: +10 min, cross from your own beach',risk:'A gale can swamp it (haul it up the beach first)',ok:dock,
    why:dock?'Free, and it lives at home: row out and cross straight to Sunnyside. Haul it up the beach before a gale.':'Needs the cabin’s mooring buoy upgrade (Upgrade the cabin, at home).'}];
  if(boatBay())o.push({id:'garage',n:'🏠 Garage bay',buy:'Keep it in the garage’s third bay',cost:'Free',launch:'Tow it to a ramp: +25 min',risk:'None: dry and out of the weather',ok:true,
    why:'Out of the rain and the winter. Tow it to a ramp to launch (+25 min).'});
  return o}
function boatStoreTable(){const td='style="padding:3px 5px;border-top:1px solid var(--line,#ccc);vertical-align:top"';
  return `<table style="width:100%;font-size:12px;border-collapse:collapse;margin:6px 0"><tr><th ${td}></th><th ${td}>Cost</th><th ${td}>Launch</th><th ${td}>Risk</th></tr>`+
    boatStoreOpts().map(o=>`<tr style="${o.ok?'':'opacity:.55'}"><td ${td}><b>${o.n}</b></td><td ${td}>${o.cost}</td><td ${td}>${o.launch}</td><td ${td}>${o.risk}</td></tr>`).join('')+'</table>'}
function boatHomeOk(B){if(B.store==='slip')return B.on==='water'&&B.at==='marina';if(B.store==='buoy')return B.at==='home'&&B.on!=='trailer';return B.on==='trailer'&&!B.hitch&&B.trLoc==='home'}   // is the boat where its storage plan says?
function boatStoreSet(id){
  const B=S.boat,was=B.store;if(id===was)return;
  B.store=id;S.t+=5;
  if(id==='slip'){money(-BOAT_SLIP);B.paidThru=dayKey()+28}
  const how={slip:B.on!=='trailer'&&B.at==='marina'?'It’s already at the Riv: it’s in its slip now.':'Bring it to the Riv: launch it at the Riv ramp, or run it around by water.',
    yard:B.on==='trailer'&&B.at==='home'?'It’s on its trailer in your yard.':'Haul it out at a ramp and tow it home with a car that has a hitch.',
    buoy:B.at==='home'&&B.on!=='trailer'?'It’s on your buoy.':'Run it around to your buoy by water.',
    garage:B.on==='trailer'&&B.at==='home'?'You back it into the third bay.':'Haul it out at a ramp and tow it home; it goes in the third bay.'}[id];
  say(`🚤 New plan for the skiff: ${boatStoreOpts().find(o=>o.id===id).n.replace(/^\S+ /,'').toLowerCase()}${id==='slip'?` ($${BOAT_SLIP} a month, the first month now)`:''}. ${how}`);
  afterAction()}
function boatStoreModal(){
  modal('🚤 Where do you keep the skiff?',`<p>Right now it’s <b>${boatWhere()}</b>. You keep it: <b>${boatStoreOpts().find(o=>o.id===S.boat.store).n}</b>.</p>`+boatStoreTable(),
    boatStoreOpts().filter(o=>o.id!==S.boat.store).map(o=>({l:o.buy+(o.id==='slip'?`: $${BOAT_SLIP}/month`:''),s:o.why,dis:!o.ok||(o.id==='slip'&&S.money<BOAT_SLIP),fn:()=>boatStoreSet(o.id)})).concat([{l:'Leave it as it is',fn:()=>{}}]))}
// ---- the buoy: haul it up the beach before a gale; bailing ----
function boatGaleSoon(){const st=S.week&&S.week.storm;return !!st&&S.t<st.end&&st.start-S.t<36*60}
function boatHaulBeach(){const B=S.boat;B.on='beach';S.t+=20;phoneTick();adj('stress',-1);
  say(`🪵 You row out, slip the mooring and drag the skiff up the beach on its rollers, above the drift line, and tie it to the big fir.${boatGaleSoon()?' Let the gale come.':''}`);afterAction()}
function boatBuoyBack(){const B=S.boat;B.on='water';S.t+=15;phoneTick();say('🛟 You drag the skiff back down the beach and row it out to the buoy.');afterAction()}
function boatBail(){const B=S.boat,sw=B.swamped;S.t+=sw?45:15;phoneTick();adj('stress',sw?3:0);if(sw)adj('health',-1);
  say(sw?'🪣 Forty-five minutes with a bucket and the hand pump, then the outboard: drain the carb, dry the plug, pull it over until it coughs. It runs, sort of.':'🪣 You bail a few hundred pounds of rainwater out of the skiff with a cut-off bleach jug.');
  B.swamped=false;B.rain=0;afterAction()}
function boatCoverBuy(){money(-BOAT_COVER);S.boat.cover=true;S.t+=15;phoneTick();say(`🧥 A fitted boat cover for the skiff, $${BOAT_COVER}. Rain runs off it instead of filling the boat.`);afterAction()}
// ---- nightly: gale, rain, winter ----
function boatNight(where,notes,d){
  if(!boatOwn()||visitorOn())return;boatFix();
  const B=S.boat,U=UP(),storm=stormNight(d),rain=storm||U.rain===dayKey(),winter=seasonId()==='winter';
  if(storm&&B.on==='water'&&B.at==='home'&&!B.swamped){const r=Math.random();
    if(r<0.25){money(-BOAT_SALVAGE);B.cond=Math.max(0,B.cond-40);B.swamped=true;B.on='beach';
      notes.push(`🌊 The gale sank your skiff at its buoy. A diver from Oro Bay raises it and drags it up your beach: $${BOAT_SALVAGE} salvage, and the outboard spent the night underwater. Bail it out and see if it runs.`)}
    else if(r<0.75){B.cond=Math.max(0,B.cond-40);B.swamped=true;
      notes.push('🌊 The gale swamped your skiff on the buoy. In the morning it’s riding low, full to the gunwales, the outboard half underwater. Bail it out before it goes anywhere.')}
    else notes.push('🌊 Your skiff rode out the gale on the buoy, bucking all night. You checked twice from the window.')}
  const outside=!(B.on==='trailer'&&B.at==='home'&&B.store==='garage'&&boatBay());   // an open skiff fills with rain anywhere but the garage bay
  if(rain&&outside&&!B.cover){const was=B.rain;B.rain=Math.min(100,B.rain+(storm?60:35));
    if(was<50&&B.rain>=50)notes.push(`🌧️ Rain has been filling the uncovered skiff (${boatWhere()}). Bail it out (or get a cover).`)}
  if(B.rain>=100&&outside){B.cond=Math.max(0,B.cond-2)}
  const exposed=B.at==='home'&&!(B.on==='trailer'&&B.store==='garage'&&boatBay());
  if(winter&&exposed&&(!B.cover||B.on!=='trailer'||dayKey()%2===0))B.cond=Math.max(0,B.cond-1);
}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up.apply(this,arguments);try{boatNight(where,notes,d)}catch(e){console.error(e)}return r}}
// ---- actions ----
function boatStoreActions(a,loc){
  if(visitorOn()||!boatOwn())return;boatFix();
  const B=S.boat,here=B.at===loc||(B.on==='trailer'&&boatTrailerLoc()===loc);
  if(loc==='home'||loc==='marina')a.push({cat:'ferry',ic:'🗂️',l:'Change where you keep the skiff',s:`Now: ${boatStoreOpts().find(o=>o.id===B.store).n.replace(/^\S+ /,'')}. It’s ${boatWhere()}.`,fn:boatStoreModal});
  if(loc==='home'&&B.at==='home'){
    if(B.on==='water'&&!B.swamped)a.push({cat:'ferry',ic:'🪵',l:'Haul the skiff up the beach',s:boatGaleSoon()?'A gale is coming. On the buoy it can swamp or sink. 20 min.':'Safe above the drift line. 20 min.',cls:boatGaleSoon()?'primary':'',fn:boatHaulBeach});
    if(B.on==='beach'&&!B.swamped&&boatDockOk())a.push({cat:'ferry',ic:'🛟',l:'Put the skiff back on the buoy',s:boatGaleSoon()?'A gale is still coming.':'15 min.',fn:boatBuoyBack});
    if(S.homeGas>0&&B.fuel<BOAT_TANK-0.2)a.push({cat:'fuel',ic:'⛽',l:'Fill the skiff’s tank from your shed gas',s:`${S.homeGas} gal stashed. Tank ${boatFuelBtn()}. The generator needs some too.`,fn:boatFuelHome});
  }
  if(here&&B.swamped)a.push({cat:'ferry',ic:'🪣',l:'Bail out the swamped skiff',s:'45 min with a bucket, then coax the outboard. It can’t go anywhere until you do.',cls:'primary',fn:boatBail});
  else if(here&&B.rain>=50)a.push({cat:'ferry',ic:'🪣',l:'Bail the rainwater out of the skiff',s:`It’s ${B.rain>=100?'full':'half full'} of rain. 15 min.${B.cover?'':` A cover ($${BOAT_COVER}) stops it.`}`,fn:boatBail});
  if((loc==='depot'||loc==='gas')&&!B.cover&&isOpen(loc))a.push({cat:'fuel',ic:'🧥',l:`Buy a boat cover for the skiff: $${BOAT_COVER}`,s:'Keeps the rain out while it sits, on the trailer or tied up.',dis:S.money<BOAT_COVER,fn:boatCoverBuy});
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{boatStoreActions(a,S.loc)}catch(e){console.error(e)}return a}}
{const _t=todoItems;todoItems=function(){const it=_t.apply(this,arguments);try{if(boatOwn()&&!visitorOn()){const B=S.boat;
  if(B.swamped)it.push({ok:false,fail:false,l:'Bail out the swamped skiff',s:`🪣 It’s ${boatWhere()}, full of water.`,urgent:true});
  else if(B.rain>=50)it.push({ok:false,fail:false,l:'Bail the rain out of the skiff',s:`🪣 It’s ${boatWhere()}, ${B.rain>=100?'full':'half full'} of rainwater.`,urgent:false});
  const home=boatHomeOk(B);if(!home&&!B.hitch)it.push({ok:false,fail:false,l:`Move the skiff to ${({slip:'its slip at the Riv',buoy:'your buoy',yard:'your yard',garage:'the garage bay'})[B.store]}`,s:`🗂️ You changed where you keep it. It’s ${boatWhere()}.`,urgent:false});
  if(B.on==='water'&&B.at==='home'&&boatGaleSoon())it.push({ok:false,fail:false,l:'Haul the skiff up the beach before the gale',s:'🌊 On the buoy, a gale can swamp or sink it.',urgent:true});
}}catch(e){}return it}}
// old saves: a 'trailer' boat loads as a 'yard' boat
if(typeof migrate==='function'){const _m=migrate;migrate=function(d){const r=_m.apply(this,arguments);try{if(r&&r.S&&r.S.boat&&boatMigrate(r.S.boat))r.notes.push('your skiff’s trailer is in your yard now')}catch(e){console.error(e)}return r}}
