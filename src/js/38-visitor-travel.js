// ---- 🧳 visitor mode: travel (home → Steilacoom, I-5 traffic, packed food, bikes, missing the last boat) ----
// Everything here does nothing unless visitorOn(). L.vhome is the visitor's own place on the mainland.
L.vhome={side:'M',ic:'🏠',
  get name(){const h=visitorOn()&&VISIT_HOMES[VS().home];return h?`Your place (${h.n})`:'Your place'},
  get desc(){return visitorOn()&&VS().len==='regular'?`Home in ${VISIT_HOMES[VS().home].n}: ${REG_CITIES[VS().home].home}. Chores, mail, bills and a bed. Pack your food on Thursday or Friday, then drive to the Steilacoom ferry.`:'Home, on the mainland. Pack your food and your bike here, then drive to the Steilacoom ferry.'}};
const VT_FOOD_PER_DAY=8;
function vtHome(){return VISIT_HOMES[VS().home]||VISIT_HOMES.tacoma}
function vtDriveMin(){return Math.round(vtHome().mi*60/45+3)}          // mi at ~45 mph plus ramps and parking
function vtMiles(min){return min*45/60}
function vtFuel(car,min){return fuelFor(car,vtMiles(min)*60/FUEL_MPH.M,'M')}   // real miles, not game-minutes
const _vtDist=dist;
dist=function(a,b){
  if(a===b) return 0;
  if(a!=='vhome'&&b!=='vhome') return _vtDist(a,b);
  const o=a==='vhome'?b:a,base=vtDriveMin();
  return o==='stDock'?base:base+Math.round(_vtDist('stDock',o)*0.4);
};
// ---- I-5 traffic: expected delay (what WSDOT tells you before you leave) and the roll on the road ----
function vtTraffic(from,to,t){
  const h=vtHome(),d=Math.floor(t/1440)%7,m=t%1440,toFerry=from==='vhome';
  const rushAM=d<5&&m>=390&&m<540,rushPM=d<5&&m>=900&&m<1110,fri=d===4&&m>=780&&m<1200;
  const summerSat=seasonId()==='summer'&&d===5&&toFerry&&m>=420&&m<=900;
  let x=4,why='moving at the speed limit';
  if(rushAM){x=22;why='slow with morning commuters'}
  if(rushPM){x=25;why='slow with evening commuters'}
  if(fri&&x<28){x=28;why='slow with Friday getaway traffic'}
  if(summerSat&&x<20){x=20;why='slow with summer ferry traffic'}
  const min=Math.round(x*h.i5);
  const dir=toFerry===(VS().home!=='olympia')?'southbound':'northbound';
  const where=VS().home==='seattle'?'through the Tacoma Dome':'through JBLM';
  return {min,why,txt:min<=5?`WSDOT: I-5 ${dir} ${why}.`:`WSDOT: I-5 ${dir} ${why} ${where}, +${min} min`};
}
function vtTrafficRoll(from,to){
  const e=vtTraffic(from,to,S.t),i5=vtHome().i5;
  if(Math.random()<0.04+0.06*i5) return {min:30+Math.floor(Math.random()*31),crash:true};
  return {min:Math.round(e.min*(0.5+Math.random())),crash:false};
}
const vtTrip=(from,dest)=>visitorOn()&&(from==='vhome'||dest==='vhome'||(typeof regTrip==='function'&&regTrip(from,dest)));
const _vtTravelOpts=travelOpts;
travelOpts=function(dest){
  const o=_vtTravelOpts(dest);
  if(!visitorOn()) return o;
  const from=S.loc,side=L[from].side,car=carHere(),vs=VS();
  if(vtTrip(from,dest)){
    const base=dist(from,dest),e=vtTraffic(from,dest,S.t),need=car?vtFuel(car,base):0;
    const i=o.findIndex(x=>x.m==='car'),opt=car&&car.fuel>=need?{m:'car',l:`🚗 ${base}${e.min>5?'+'+e.min:''} min`,min:base+e.min,s:e.txt,traffic:e.min}:car?lowGasOpt(car,side):null;
    if(i>=0)o.splice(i,1);
    if(opt)o.unshift(opt);
    if(opt&&opt.dis&&!o.some(x=>x.m==='ride')){const c=Math.round(8+base*0.8);o.push({m:'ride',l:S.phone>0?`📱 Rideshare ${base+8}m · $${c}`:'📵 Rideshare (phone dead)',min:base+8,cost:c,dis:S.phone<=0})}
    const r=o.find(x=>x.m==='ride');if(r){r.min=base+8+e.min;r.s=e.txt}
  }
  if(side==='I'&&!car){ // on foot on the island: nearby places only; a bike reaches everything
    const b=dist(from,dest),inj=S.injury&&!S.injury.treated?1.5:1,near=b<=9||dest==='aiDock'||dest==='home';
    const w=o.find(x=>x.m==='walk');if(w&&!near){w.dis=true;w.l=`🚶 ${w.min} min (too far)`}
    if(vs.bike){const bm=Math.round(b*2*inj);o.splice(w?o.indexOf(w)+1:o.length,0,{m:'bike',l:`🚲 ${bm} min`,min:bm})}
  }
  return o;
};
const _vtGo=go;
go=function(dest,o){
  const from=S.loc;
  if(!(vtTrip(from,dest)&&(o.m==='car'||o.m==='ride'))) return _vtGo(dest,o);
  const car=carHere(),base=dist(from,dest),tr=vtTrafficRoll(from,dest);
  if(o.cost) money(-o.cost);
  const min=base+(o.m==='ride'?8:0)+tr.min;
  S.t+=min;phoneTick();S.phone=Math.min(100,S.phone+Math.round(min*0.8));
  if(car&&o.m==='car'){car.loc=dest;car.fuel=Math.max(0,Math.round((car.fuel-vtFuel(car,base))*100)/100);
    if(car.fuel<1.5&&car.fuel>0)say(`⛽ The low-fuel light is on in the ${car.name.split(' (')[0].toLowerCase()}. ${car.fuel} gallons left.`);
    if(car.fuel===0)say('⛽ The engine coughs and dies as you pull in. Totally empty.')}
  if(tr.crash){adj('stress',10);say(`🚨 A crash on I-5 backs traffic up for miles. You sit for ${tr.min} extra minutes, watching brake lights and the clock.`)}
  else if(tr.min>=10){adj('stress',Math.min(8,Math.round(tr.min/6)));say(`I-5 is slow: ${tr.min} extra minutes. The drive takes ${min} minutes.`)}
  else say(`You drive to ${L[dest].name}. ${min} minutes.`);
  S.loc=dest;fireHook('arrive',{at:dest,from});afterAction();
};
// ---- actions: packing food, the bike, bed at home, a packed lunch, no boat tonight ----
function vtPack(n){const vs=VS(),fromP=(typeof regOn==='function'&&regOn())?Math.min(n,S.pantry):0;S.pantry-=fromP;money(-VT_FOOD_PER_DAY*(n-fromP));S.carried+=n;vs.packed+=n;S.cooler=true;S.t+=10*n;
  say(n>1?`🧊 You fill the cooler: ${n} days of sandwiches, fruit and snacks.`:'🥪 You pack a lunch: a sandwich, an apple and a bag of chips.');afterAction()}
function vtHostAsk(){
  const vs=VS();vs.asked=day();S.t+=20;
  const p=vs.rep>=0?Math.min(0.85,0.4+vs.rep/50):0;
  if(Math.random()<p){
    modal('🏡 Somebody answered',`<p>You post in the Island Group: “Missed the last boat, any chance of a couch?” Within ten minutes a stranger writes back: <b>“We have a spare room. Come on over. Do you like dogs?”</b></p><p>Anderson Island is like that.</p>`,[{l:'Go to bed',fn:()=>endDay('host')}],true);
  } else {
    adj('stress',6);say(vs.rep<0?'📱 You post in the Island Group. Nobody answers. Word gets around about visitors who litter.':'📱 You post in the Island Group. A few thumbs-up, one “sorry, full house,” and no offers.');
    afterAction();
  }
}
function vtRideOffer(){return !!(visitorOn()&&VS().rep>=10&&Math.random()<0.5)}
const _vtActions=actions;
actions=function(){
  const a=_vtActions();
  if(!visitorOn()) return a;
  const vs=VS(),loc=S.loc,m=tod(),len=VISIT_LENS[vs.len]||VISIT_LENS.weekend;
  if(loc==='vhome'){
    const left=Math.max(0,len.nights+1-vs.packed);
    if(vs.len==='day'){
      a.push({cat:'ferry',ic:'🥪',l:`Pack a lunch — $${VT_FOOD_PER_DAY}`,s:'There’s no store on the island. Or skip it and eat at the Riv.',dis:left<1||S.money<VT_FOOD_PER_DAY,fn:()=>vtPack(1)});
    } else {
      [...new Set([1,Math.min(3,left),left])].filter(n=>n>=1&&n<=left).forEach(n=>a.push({cat:'ferry',ic:'🧊',l:`Pack food: cooler with ${n} day${n>1?'s':''} — $${VT_FOOD_PER_DAY*n}`,s:`The island store is closed. ${vs.packed}/${len.nights+1} days packed. Eaten from the cooler at night; at the cabin it goes in the pantry.`,dis:S.money<VT_FOOD_PER_DAY*n||S.carried+n>14,fn:()=>vtPack(n)}));
    }
    a.push({cat:'ferry',ic:'🚲',l:vs.bike?'Leave your bike at home':'Bring your bike',s:vs.bike?'It’s on the rack right now.':'Walk-ons can roll it aboard: faster than walking on the island.',fn:()=>{vs.bike=!vs.bike;say(vs.bike?'🚲 You strap your bike to the rack.':'🚲 The bike stays in the garage.');render()}});
    if(m>=1140) a.push({cat:'ferry',ic:'🛏️',l:'Sleep in your own bed',s:'Ends the day.',cls:'danger',fn:()=>endDay('vhome')});
  }
  if(L[loc].side==='I'&&vs.len==='day'&&S.carried>0&&loc!=='home') a.push({cat:'trade',ic:'🥪',l:'Eat your packed lunch',s:'30 min. Stress −3.',fn:()=>{S.carried--;S.t+=30;adj('stress',-3);adj('health',1);say('🥪 You eat your packed lunch on a log, watching the water.');afterAction()}});
  if(loc==='aiDock'){
    const car=carHere(),kD=car?findNext('I','drive',true):null,kW=findNext('I','walk',true);
    const noBoat=(!car||!kD||kD.d>day())&&(!kW||kW.d>day()||!canWalkCarry());
    const cabin=vs.rental&&vs.rental.checkedIn&&!vs.rental.checkedOut;
    if(noBoat&&!cabin){
      a.push({cat:'ferry',ic:car?'🚗':'🪑',l:car?'Sleep in your car at the landing':'Sleep on the bench at the landing',s:'There are no hotels on the island. Free. Not comfortable. Ends the day.',cls:'danger',fn:()=>endDay('terminal')});
      a.push({cat:'ferry',ic:'📱',l:'Ask in the Island Group for a place to stay',s:vs.asked===day()?'You already asked tonight.':'20 min. An islander might host you.',dis:vs.asked===day()||S.phone<=0,fn:vtHostAsk});
    }
  }
  return a;
};
const _vtStranded=strandedModal;
strandedModal=function(){
  if(visitorOn()&&S.loc==='vhome') return modal('It’s late','<p>You’re home. Time to turn in.</p>',[{l:'🛏️ Sleep in your own bed',fn:()=>endDay('vhome')}],true);
  return _vtStranded();
};
