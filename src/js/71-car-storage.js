// ---- 🚗 1.22 car-storage fixes: moving with your city car, selling/swapping the island cars, Monday propane ----
const CAR_SELL_BEATER=350, CAR_SELL_CITY=2500, TRUCK_BACK=600;
// 2. Weekend regular move-in: your city car comes with you (fuel, battery, spare), parked at home. Choice: sell it for $2,500 and use the old Subaru.
{const _rs=regStartResident;
  const wrapped=function(){
    let old=null,city='Tacoma';
    try{const c=S.cars&&S.cars.find(c=>c.id==='isl');if(c){carMech(c);old={fuel:c.fuel,tank:c.tank,diesel:!!c.diesel,bat:c.bat,spare:c.spare};city=(VISIT_HOMES[(S.visitor||{}).home]||{n:'Tacoma'}).n}}catch(e){console.error(e)}
    const r=_rs.apply(this,arguments);
    try{if(old){
      const car=S.cars.find(c=>c.id==='isl');
      if(car){Object.assign(car,{name:`Your car (${city})`,loc:'home',fuel:old.fuel,tank:old.tank,diesel:old.diesel,bat:old.bat,spare:old.spare});S.battery=old.bat;S.cityCarKept=true}
      modal('🚗 Your car',`<p>Your ${esc(city)} car made the move with you and is parked at the cabin (${old.fuel} of ${old.tank} gal${old.bat==='weak'?', battery a little tired':''}).</p><p>You can keep it, or sell it now for ${$(CAR_SELL_CITY)} toward the down payment and the moving truck, and drive the old island Subaru that came with the house.</p>`,[
        {l:'Keep my car',s:'It becomes your island car.',fn:()=>{}},
        {l:`Sell it for ${$(CAR_SELL_CITY)}`,s:'Take the old Subaru instead.',fn:()=>{
          const i=S.cars.findIndex(c=>c.id==='isl');if(i<0)return;
          S.cars[i]={id:'isl',name:'Island car (old Subaru)',loc:'home',fuel:4.5,tank:14,diesel:false,bat:'ok',spare:'ok'};
          S.battery='ok';S.cityCarKept=false;money(CAR_SELL_CITY);say(`💵 A buyer from Gig Harbor hands you ${$(CAR_SELL_CITY)} for your ${esc(city)} car. The old Subaru is in the garage, smelling faintly of the last owner’s dog.`);render()}}]);
    }}catch(e){console.error(e)}
    return r};
  regStartResident=wrapped;window.regStartResident=wrapped}
// 3. selling and swapping cars at the Steilacoom terminal (islanders only)
function carSellBeater(){const i=S.cars.findIndex(c=>c.id==='beat');if(i<0)return;S.cars.splice(i,1);if(S.drive==='beat')S.drive=null;money(CAR_SELL_BEATER);S.t+=30;phoneTick();say(`💵 A guy from the lot next door looks it over, sighs, and hands you ${$(CAR_SELL_BEATER)} cash for the Corolla. You’re out $350 on the deal, and one fewer set of keys.`);afterAction()}
function carTruckBack(){const c=S.cars.find(c=>c.id==='isl');if(!c)return;Object.assign(c,{name:'Island car (old Subaru)',diesel:false,tank:14,fuel:Math.min(c.fuel,14)});if(c.spare===undefined)carMech(c);money(TRUCK_BACK);S.t+=60;phoneTick();say(`🚗 The dealer takes the diesel pickup and hands over an old Subaru wagon with a ${$(TRUCK_BACK)} check on top: he likes the truck more than you did. (It costs ${$(1400-TRUCK_BACK)} net to have tried diesel.)`);afterAction()}
{const _d=dockActions;dockActions=function(a,side){const r=_d.apply(this,arguments);try{
  if(side==='M'&&!visitorOn()){const m=tod(),open=m>=360&&m<=1200,beat=S.cars.find(c=>c.id==='beat'),isl=S.cars.find(c=>c.id==='isl');
    if(beat&&beat.loc==='stDock')a.push({ic:'💵',l:`Sell the mainland beater: $${CAR_SELL_BEATER}`,s:`Bought at $700; a lot guy gives you about half back. ${open?'':'Lots are closed right now.'}`,dis:!open,fn:carSellBeater});
    if(isl&&isl.loc==='stDock'&&isl.diesel)a.push({ic:'🚗',l:`Trade the diesel pickup back for an old Subaru: +$${TRUCK_BACK}`,s:`The dealer pays ${$(TRUCK_BACK)} on the swap (you paid $1,400 for the truck). Back to gas, and back to Dale’s prices.`,dis:!open,fn:carTruckBack})}
}catch(e){console.error(e)}return r}}
// the garage and "take the other car" tolerate a car that has disappeared
{const _a=actions;actions=function(){if(S.drive&&!S.cars.some(c=>c.id===S.drive))S.drive=null;return _a.apply(this,arguments)}}
// 5. propane arrives on the Monday run
const PROPANE_HOUR=13*60;   // the tanker is on the Monday run; the truck reaches the cabin early afternoon
function propaneDue(){return (day()===0&&tod()<9*60?0:7)*1440+PROPANE_HOUR}
{const _us=upSchedule;upSchedule=function(k,cost,what){if(k!=='propane')return _us.apply(this,arguments);
  money(-cost);S.t+=10;phoneTick();const due=propaneDue();UP().jobs.push({k,due});
  say(`📱 ${what} Propane comes over on the Monday fuel run (the tanker rides the ferry): ${due<1440?'today':'next Monday'}, early afternoon, if the ferry cooperates.`);afterAction()}}
// 4. a gas can poured into the skiff, wherever the skiff is (the shed gas is only for a boat at home, see 57-own-boat.js)
function boatPourCan(){const B=S.boat,room=boatGal(BOAT_TANK-B.fuel),g=boatGal(Math.min(5,room));if(!(S.cargo.gas>0)||g<=0)return;S.cargo.gas--;B.fuel=boatGal(B.fuel+g);S.t+=10;phoneTick();say(`⛽ You pour ${g} gallon${g===1?'':'s'} from your gas can into the skiff’s tank (${boatFuelBtn()})${g<5?'. The tank’s full; the rest of the can goes into the bilge-pump-and-spill-kit bucket on the dock, so it’s used up':''}.`);afterAction()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(!visitorOn()&&boatOwn()){const B=S.boat,here=(S.loc==='marina'&&B.at==='marina')||(S.loc==='gas'&&B.at==='sunny');
    if(here&&S.cargo.gas>0&&B.fuel<BOAT_TANK-0.2)a.push({cat:'fuel',ic:'⛽',l:'Pour a gas can into the skiff',s:`You’re carrying ${S.cargo.gas} can${S.cargo.gas===1?'':'s'}. Tank ${boatFuelBtn()}.`,fn:boatPourCan})}
}catch(e){console.error(e)}return a}}
