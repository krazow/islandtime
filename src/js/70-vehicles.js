// ---- 🚗 each vehicle's own parts (1.22): tires (battery helpers live next to carHere in 01-core.js) ----
// A flat puts that car on its donut spare (car.spare='on'). Until it gets a new tire, a second flat means a tow.
// New tires: the Steilacoom gas station (Les Schwab-style mount and balance, 40 min) for the car that's here.
const TIRE_PRICE=140;
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  const car=carHere();
  if(S.loc==='gas'&&car&&carMech(car).spare==='on'&&tod()>=300&&tod()<1380)
    a.push({ic:'🛞',l:`New tire for the ${carShortName(car)}: ${$(TIRE_PRICE)}`,s:'Off the donut, back on four real tires. 40 min.',cls:'primary',dis:!canEssential(TIRE_PRICE),
      fn:()=>{money(-TIRE_PRICE);car.spare='ok';S.t+=40;phoneTick();say(`🛞 A new tire on the ${carShortName(car)}, and the donut goes back under the floor.`);afterAction()}});
}catch(e){console.error(e)}return a}}
{const _t=todoItems;todoItems=function(){const it=_t.apply(this,arguments);try{
  S.cars.filter(c=>carMech(c).spare==='on').forEach(c=>it.push({ok:false,fail:false,l:`Get a new tire for the ${carShortName(c)}`,s:`🛞 It’s on the donut. Another flat means a tow. Gas station in Steilacoom: ${$(TIRE_PRICE)}.`,urgent:false}));
}catch(e){}return it}}
