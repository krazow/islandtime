// ---------------- 🚙 the skiff's trailer: hitches, towing, launching and hauling out, and the ferry fare (1.22) ----------------
// A car tows the trailer once it has a hitch (c.hitch; $250 installed at the Steilacoom gas station or Home Depot). The diesel
// pickup has a factory receiver and tows easily; the Subaru can tow a 14-ft skiff (and drinks more doing it); the beater can't.
// S.boat.hitch = id of the car the trailer is hitched to (the boat, if it's on the trailer, goes wherever that car goes), or null
// with S.boat.trLoc = where the unhitched trailer is parked ('home', 'marina' (the Riv lot), 'sunny' (the Sunnyside lot)).
// Launch or haul out at the Riv ramp or Sunnyside: +20 min, and a low tide leaves the ramp too shallow (wait, or come back).
// Driving onto the ferry with the trailer hitched pays the vehicle-length fare (car + trailer) instead of the car fare.
const HITCH_PRICE=250, BOAT_RAMP_MIN=20, TRAILER_FT={loaded:17,empty:14};
// 2026 Pierce County fares by vehicle length incl. trailer: [max length (exclusive), non-peak, peak]
const TOW_BANDS=[[30,49.35,67.73],[40,77.96,107.10]];
function carCanTow(c){if(!c)return false;if(c.tow!==undefined)return !!c.tow;return c.id!=='beat'}
function carHasHitch(c){return !!c&&(!!c.hitch||!!c.diesel)}
function carLenFt(c){return c&&c.len?c.len:c&&c.diesel?19:15}
const towCar=c=>!!c&&boatOwn()&&S.boat.hitch===c.id;
function towLen(c){return carLenFt(c)+(S.boat.on==='trailer'?TRAILER_FT.loaded:TRAILER_FT.empty)}
function towFareBase(c){const L2=towLen(c),peak=typeof seasonId==='function'&&seasonId()==='summer';
  if(L2<=22)return null;const b=TOW_BANDS.find(b=>L2<b[0])||TOW_BANDS[TOW_BANDS.length-1];return {len:L2,fare:peak?b[2]:b[1],band:b===TOW_BANDS[0]?'over 22 to under 30 ft':'30 to under 40 ft'}}
// the fare: keep any multiplier (the Story levy) the car fare carries
{const _f=fareCar;fareCar=function(){const f=_f.apply(this,arguments);try{const c=carHere();if(towCar(c)){const t=towFareBase(c),plain=(typeof seasonId==='function'&&seasonId()==='summer')?FARE_CAR_PEAK:FARE_CAR_NONPEAK;
  if(t)return Math.round(t.fare*(f/plain)*100)/100}}catch(e){console.error(e)}return f}}
// a ferry-pass car ticket covers a car, not a car and a trailer: pay at the booth
if(typeof fpUseRide==='function'){const _u=fpUseRide;fpUseRide=function(mode){if(mode==='drive'&&towCar(carHere()))return false;return _u.apply(this,arguments)}}
{const _b=board;board=function(side,s,mode){try{const c=carHere();if(mode==='drive'&&towCar(c)){const t=towFareBase(c);
  say(`🚤 With the ${S.boat.on==='trailer'?'skiff':'empty trailer'} in tow you’re about ${t?t.len:towLen(c)} feet long${side==='M'&&t?`: the ${t.band} fare, ${$(fareCar())}`:', and leaving the island is free'}. The deckhand waves you to the outside lane.`)}}catch(e){console.error(e)}
  return _b.apply(this,arguments)}}
// towing burns more fuel
{const _f=fuelFor;fuelFor=function(car){const g=_f.apply(this,arguments);try{if(towCar(car))return g*(car.diesel?1.2:1.4)}catch(e){}return g}}
// ---- moving the car and the trailer together (island legs: home ⇄ the Riv) ----
function boatTowDrive(car,dest){const m=dist(S.loc,dest)+5;S.t+=m;phoneTick();car.fuel=Math.max(0,Math.round((car.fuel-fuelFor(car,m))*100)/100);car.loc=dest;S.loc=dest;S.boat.lastLoc=dest;return m}
// launch / haul at the ramp here (marina or sunny), with the tide check; then() runs after
function boatRamp(kind,then){
  const B=S.boat,where=S.loc==='marina'?'the Riv ramp':'the Sunnyside ramp',done=()=>{
    S.t+=BOAT_RAMP_MIN;phoneTick();
    if(kind==='launch'){let bail='';if(B.rain>=50){S.t+=15;B.rain=0;bail=' First you bail out the rainwater.'}
      B.on='water';B.at=S.loc;say(`🚤 You back the trailer down ${where} until the skiff floats off, tie it to the float and park the ${carShortName(boatTrailerCar())} and the empty trailer.${bail}`)}
    else{B.on='trailer';B.at=S.loc;say(`🚤 You back the trailer down ${where}, winch the skiff onto the bunks and pull it up dripping.`)}
    if(then)then();else afterAction()};
  if(!boatLow())return done();
  const w=boatTideWait();
  modal('🪨 The ramp’s too shallow',`<p>Low tide: the end of ${where} is mud. The trailer wheels would hit the mud before the skiff ${kind==='launch'?'floats off':'floats on'}.</p>`,[
    {l:`Wait for the tide (about ${w} min)`,s:'The water comes back up the ramp.',fn:()=>{S.t+=w;phoneTick();say('🌊 You wait in the car with the radio on while the tide comes back up the ramp.');done()}},
    {l:'Come back later',s:kind==='launch'?'The skiff stays on the trailer.':'The skiff stays in the water.',fn:()=>afterAction()}]);
}
function boatTowLaunch(){const car=carHere(),B=S.boat,g=B.store==='garage'&&boatBay()?5:0;
  B.hitch=car.id;B.lastLoc='home';S.t+=g;const m=boatTowDrive(car,'marina');
  say(`🚙 You hitch the skiff to the ${carShortName(car)}${g?', back it out of the garage bay':''} and tow it down to the Riv ramp (${m} min).${car.diesel?'':' The Subaru labors up the hill but gets there.'}`);
  boatRamp('launch')}
function boatHaulHome(){const car=carHere(),B=S.boat;B.hitch=car.id;
  boatRamp('haul',()=>{const m=boatTowDrive(car,'home');B.hitch=null;B.trLoc='home';B.lastLoc=null;B.at='home';
    if(S.carried>0){S.pantry+=S.carried;say(`You unload ${S.carried} day${S.carried>1?'s':''} of groceries into the pantry.`);S.carried=0}
    say(`🚙 You tow the skiff home (${m} min) and back it ${B.store==='garage'&&boatBay()?'into the garage’s third bay':'into the yard'}.`);afterAction()})}
function boatHaulHere(){const car=carHere();S.boat.hitch=car.id;S.boat.lastLoc=S.loc;boatRamp('haul')}
function boatHitch(){const car=carHere(),B=S.boat;B.hitch=car.id;B.lastLoc=S.loc;S.t+=10;phoneTick();
  say(`🚙 You hitch the ${B.on==='trailer'?'skiff':'empty trailer'} to the ${carShortName(car)}: chains crossed, lights checked. ${B.on==='trailer'?'Wherever the car goes, the skiff goes, ferry included (at the long-vehicle fare).':''}`);afterAction()}
function boatUnhitch(){const B=S.boat;B.hitch=null;B.trLoc=S.loc;B.lastLoc=null;S.t+=10;phoneTick();
  say(`🚙 You unhitch the ${B.on==='trailer'?'skiff on its trailer':'empty trailer'} and leave it in ${S.loc==='sunny'?'the Sunnyside lot':S.loc==='marina'?'the Riv lot':'the yard'}.`);afterAction()}
function hitchBuy(car){money(-HITCH_PRICE);car.hitch=true;S.t+=45;phoneTick();say(`🔩 A tow hitch on the ${carShortName(car)}, wired for trailer lights: $${HITCH_PRICE} installed. ${car.id==='isl'?'Rated for a small boat trailer. The skiff will do.':''}`);afterAction()}
// ---- actions ----
function boatTowActions(a,loc){
  if(visitorOn())return;
  const car=carHere();
  if((loc==='gas'||loc==='depot')&&car&&!carHasHitch(car)&&isOpen(loc)){
    if(carCanTow(car))a.push({cat:'fuel',ic:'🔩',l:`Tow hitch for the ${carShortName(car)}: $${HITCH_PRICE} installed`,s:`45 min. Tows a boat trailer${boatOwn()?' (your skiff)':''}. Per car.`,dis:S.money<HITCH_PRICE,fn:()=>hitchBuy(car)});
    else if(boatOwn())a.push({cat:'fuel',ic:'🔩',l:`Tow hitch for the ${carShortName(car)}`,s:'Not on this one: the old Corolla has no towing rating and a tired transmission.',dis:true});
  }
  if(!boatOwn())return;boatFix();
  const B=S.boat,tl=boatTrailerLoc(),hitchedHere=!!car&&towCar(car),why=!car?'No car here to tow it.':!carCanTow(car)?`The ${carShortName(car)} can’t tow.`:!carHasHitch(car)?`The ${carShortName(car)} needs a tow hitch ($${HITCH_PRICE} at the Steilacoom gas station or Home Depot).`:'';
  const tide=boatLow()?' Low tide right now: the ramp may be too shallow.':'';
  // at home: tow it to the Riv and launch, or hitch up and take it along
  if(loc==='home'&&B.on==='trailer'&&B.at==='home'){
    a.push({cat:'ferry',ic:'🚙',l:'Tow the skiff to the Riv ramp and launch',s:why||`The car and the skiff go together: about ${dist('home','marina')+5+BOAT_RAMP_MIN} min.${B.rain>=50?' Bail it first (+15 min).':''}${tide}`,dis:!!why||B.swamped,fn:boatTowLaunch});
    if(!hitchedHere&&!why)a.push({cat:'ferry',ic:'🔗',l:`Hitch the skiff to the ${carShortName(car)} and take it with you`,s:'For a launch at Sunnyside: tow it on the ferry (the long-vehicle fare from Steilacoom).',dis:!!why,fn:boatHitch});
  }
  // the Riv or Sunnyside ramp
  if(loc==='marina'||loc==='sunny'){
    if(B.on==='trailer'&&hitchedHere)a.push({cat:'ferry',ic:'🚤',l:`Launch the skiff at ${loc==='marina'?'the Riv ramp':'Sunnyside'}`,s:`${BOAT_RAMP_MIN} min to back it down and float it off.${tide}`,cls:'primary',dis:B.swamped,fn:()=>boatRamp('launch')});
    if(B.on==='water'&&B.at===loc&&car&&!why&&(hitchedHere||(!B.hitch&&tl===loc))){
      if(loc==='marina')a.push({cat:'ferry',ic:'🚙',l:'Haul out and tow it home',s:`${BOAT_RAMP_MIN} min at the ramp, then home to ${B.store==='garage'&&boatBay()?'the garage bay':'the yard'}.${tide}`,fn:boatHaulHome});
      a.push({cat:'ferry',ic:'🚙',l:loc==='marina'?'Haul it out onto the trailer':'Haul out at Sunnyside',s:`${BOAT_RAMP_MIN} min. Then it travels with the ${carShortName(car)}${loc==='sunny'?', on the ferry too':''}.${tide}`,fn:boatHaulHere});
    }
    if(hitchedHere)a.push({cat:'ferry',ic:'🅿️',l:`Unhitch the ${B.on==='trailer'?'skiff':'empty trailer'} and leave it in ${loc==='sunny'?'the Sunnyside lot':'the Riv lot'}`,s:'You can come back for it with any car that has a hitch.',fn:boatUnhitch});
    else if(!B.hitch&&tl===loc&&car&&!why)a.push({cat:'ferry',ic:'🔗',l:`Hitch the ${B.on==='trailer'?'skiff':'empty trailer'} to the ${carShortName(car)}`,s:'10 min.',fn:boatHitch});
  }
  // the skiff is in the water somewhere and the empty trailer is at home: take the trailer to go get it
  if(loc==='home'&&(B.store==='yard'||B.store==='garage')&&B.on!=='trailer'&&B.at!=='home'&&!B.hitch&&tl==='home'&&car)a.push({cat:'ferry',ic:'🔗',l:`Hitch the empty trailer to the ${carShortName(car)}`,s:why||`To haul the skiff out: it’s ${boatWhere()}.`,dis:!!why,fn:boatHitch});
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{boatTowActions(a,S.loc)}catch(e){console.error(e)}return a}}
