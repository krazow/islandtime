// ---- 🛢️ Dale's: a car battery, and he buys fuel. 🟨 Diesel in the shed. ----
// At Dale's (7 AM–9 PM, not while he's in jail, not on the tutorial's Monday):
//   • a new car battery, installed in the driveway (your car has to be here). Pricier than the mainland, but no ferry.
//   • he buys 5-gallon cans of gas and diesel from your cargo (he resells them), a few a day; each one adds to his stock.
// Diesel in the shed: buy a can at the Steilacoom gas station "for the shed", fill the truck's spare cans there, and take a can
// back out of the shed at home (gas already had all of these).
const DALE_BATTERY=189, DALE_BUY={gas:40,diesel:35}, DALE_BUY_MAX=4, DIESEL_CAN=Math.round(DIESEL_PRICE*5*100)/100;
const daleOpen=()=>{const m=tod();return m>=420&&m<1260&&!(typeof npcJailed==='function'&&npcJailed('dale'))&&!tradingLocked()};
const daleBatStock=()=>{const d=day();S.daleBat=S.daleBat||{};if(S.daleBat[d]===undefined)S.daleBat[d]=chWith('dalebat:'+d,()=>Math.random()<0.8?1:0);return S.daleBat[d]};
const daleBought=()=>{const d=day();S.daleBought=S.daleBought||{};return S.daleBought[d]||0};
function daleBattery(){const car=carHere();if(!car||!daleBatStock()||!canEssential(DALE_BATTERY))return;
  money(-DALE_BATTERY);S.daleBat[day()]=0;setCarBat(car,'ok');S.t+=20;S.stats.daleBattery=(S.stats.daleBattery||0)+1;
  if(S.hl&&S.hl.car)S.hl.car.last=dayKey();       // Ferry Hell's car trouble: a fresh battery buys you a few calm mornings
  say(`🔋 Dale pops the hood, swaps in a new battery from the stack behind his shed and hands you the old one “for the core charge, which I’m keeping.” ${DALE_BATTERY>165?`It’s ${$(DALE_BATTERY-165)} more than the mainland, and no ferry.`:''}`);
  afterAction()}
function daleSell(g){const c=S.cargo;if(!(c[g]>0)||daleBought()>=DALE_BUY_MAX)return;
  c[g]--;money(DALE_BUY[g]);S.daleBought[day()]=daleBought()+1;
  if(g==='gas'){const d=day();S.daleStock[d]=(S.daleStock[d]||0)+5}
  S.t+=10;S.stats.daleSold=(S.stats.daleSold||0)+1;
  say(g==='gas'?`🛢️ Dale sniffs the can, nods, and counts out ${$(DALE_BUY.gas)}. “Don’t tell me how it got here.” He’ll sell it on at ${$(DALE_PRICE)} a gallon.`
               :`🟨 “Diesel. The Hendersons’ tractor will be glad.” Dale counts out ${$(DALE_BUY.diesel)} for the can.`);
  afterAction()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(S.loc==='dale'&&daleOpen()){
    const car=carHere(),bs=daleBatStock(),bad=!!car&&carBat(car)!=='ok';
    a.push({ic:'🔋',l:`Buy a new car battery from Dale: ${$(DALE_BATTERY)}`,cls:bad?'primary':'',
      s:!car?'Bring the car: he installs it in the driveway.':!bs?'“Sold my last one Tuesday. Try tomorrow.”':bad?'No more morning jump-starts. Installed in 20 min, no ferry.':'Yours tests fine, but he’ll sell you one anyway. Installed in 20 min.',
      dis:!car||!bs||S.money<DALE_BATTERY,fn:daleBattery});
    const left=DALE_BUY_MAX-daleBought();
    for(const g of ['gas','diesel'])if(S.cargo[g]>0)a.push({ic:g==='gas'?'🛢️':'🟨',l:`Sell Dale a ${g} can: ${$(DALE_BUY[g])} (${S.cargo[g]} in cargo)`,
      s:left>0?`He buys up to ${DALE_BUY_MAX} cans a day (${left} more today).`:'“That’s all I can move today.”',dis:left<=0,fn:()=>daleSell(g)});
  }
  if(S.loc==='gas'&&tod()>=300&&tod()<1380){
    const room=cargoN()+S.carried<capNow();
    a.push({ic:'🟨',l:`Buy a 5-gal diesel can for the shed: ${$(DIESEL_CAN)}`,s:room?`${$(DIESEL_PRICE)}/gal. DOT can, upright and strapped: the ferry allows 2 in a vehicle.${S.cargo.diesel?` ${S.cargo.diesel} in cargo now.`:''}`:'No room to carry it.',
      dis:!room||S.money<DIESEL_CAN,fn:()=>{money(-DIESEL_CAN);S.cargo.diesel++;S.t+=8;say(`🟨 A yellow 5-gallon can of diesel, ${$(DIESEL_CAN)}. Store it in the shed when you get home.`);afterAction()}});
  }
  if(S.loc==='home'&&S.homeDiesel>=5&&cargoN()+S.carried<capNow())
    a.push({ic:'🟨',l:`Take a diesel can out of the shed (${S.homeDiesel} gal stored)`,s:'5 gal to carry: for a truck that ran dry somewhere, or to sell to Dale.',
      fn:()=>{S.homeDiesel=Math.round((S.homeDiesel-5)*10)/10;S.cargo.diesel++;S.t+=5;say('🟨 A can of diesel out of the shed.');afterAction()}});
}catch(e){console.error(e)}return a}}
