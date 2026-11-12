// ---------------- 🏠 boat extras, part 3: the lot next door and the third garage bay ----------------
// For a player who owns a boat, the lot next to the cabin eventually comes up for sale (an Island Group post or a realtor sign):
// BX_LOT, a long-term savings goal (real small Anderson Island lots list for about $8,000–$45,000; e.g. 0.19 acre for $9,000, 0.2 acre for $25,000).
// Then a contractor builds a third garage bay (BX_BAY, 1–2 weeks; he comes over on the ferry, so an outage delays him, same as the cabin
// upgrades in 65-cabin.js). garageBay() is true once it's built; the boat-storage code (57-own-boat.js) offers 'garage' storage only then.
// A garaged boat doesn't wear between trips, can't be hit by a storm or stolen; servicing the outboard at home is cheaper than the marina;
// the shed holds more firewood. The garage card (69-garage.js) shows three slots: the cars and the boat.
const BX_LOT=15000, BX_BAY=12000, BX_HOME_SERVE=25, BX_WOOD_CAP=22;
function garageBay(){return !!(typeof S!=='undefined'&&S&&S.bx&&S.bx.bay)}
window.garageBay=garageBay;
const bxLotJob=()=>UP().jobs.find(j=>j.k==='bay');
const bxLotOk=()=>boatOwn()&&!S.over&&!S.challenge&&!visitorOn()&&S.mode!=='week';   // a one-week game can't finish a 1–2 week build
// ---- the listing ----
defEvent({id:'bx_lot',hook:'wake',priority:1,max:1,cooldown:0,chance:0.12,cond:()=>bxLotOk()&&S.loc==='home'&&!BX().lot.seen&&((S.weekNo||0)>=1||day()>=2),
  run(){const X=BX();X.lot.seen=true;
    say(S.ph&&S.friends&&Object.keys(S.friends).length&&Math.random()<0.5
      ?'🏘️ A post in the Anderson Island Group: “For sale, 0.2 acre, cleared and level, right next to you-know-who. $15,000 OBO. Septic approved.” You know exactly which lot. It’s next door.'
      :'🏘️ A realtor’s sign leans in the salal at the edge of your property: “FOR SALE 0.2 ACRE, $15,000.” The lot next door, cleared and level. Small island lots list for roughly $8,000 to $45,000, so that’s no bad price, if you had it.')}});
Object.assign(TILE_META,{bx_lot:['🏘️','The lot next door is for sale','info']});
function bxLotBuy(){if(S.money<BX_LOT)return;money(-BX_LOT);BX().lot.own=true;S.t+=60;phoneTick();
  say(`🏘️ A title company in Gig Harbor, a stack of paper and a pen on a chain. The lot next door is yours: ${bxD(BX_LOT)}. You walk its edges at dusk, trying out names for it.`);showTile('🏘️','You own the lot next door','Room for a third bay','good');afterAction()}
function bxBayBook(){if(S.money<BX_BAY||S.phone<=0)return;money(-BX_BAY);S.t+=20;phoneTick();
  const days=7+Math.floor(Math.random()*8),due=(day()+days)*1440+600;UP().jobs.push({k:'bay',due});
  say(`📱 You book the builder for a third garage bay: ${bxD(BX_BAY)}. The crew comes over on the ferry ${fmtAbs(due)}, if it’s running.`);afterAction()}
function bxBayDone(quiet){BX().bay=true;if(!quiet){say('🔨 The builder’s crew drops the last sheet of siding and rolls up the big door. A third bay: wide enough for a boat on a trailer, with a work bench. Your skiff can live at home now.');try{showTile('🏠','Third garage bay built','The skiff can live at home','good')}catch(e){}}}
UP_JOBS.bay={who:'building contractor',done:j=>bxBayDone()};
if(typeof storyAdvance==='function'){const _s=storyAdvance;storyAdvance=function(){try{if(S&&S.up)S.up.jobs=S.up.jobs.filter(j=>{if(j.k==='bay'){bxBayDone(true);return false}return true})}catch(e){console.error(e)}return _s.apply(this,arguments)}}
function bxHomeServe(){S.money>=BX_HOME_SERVE&&(money(-BX_HOME_SERVE),S.t+=40,phoneTick(),S.boat.cond=100,say('🔧 A new plug, fresh gear oil and a good clean of the carburetor on your own workbench, in your own bay. $25 and no marina mechanic’s hourly rate.'),afterAction())}
function bxWood(){const U=UP();S.t+=90;phoneTick();U.wood=Math.min(BX_WOOD_CAP,U.wood+8);U.woodOut=false;adj('stress',-2);say(`🪵 You split and stack a big load in the dry corner of the new bay. ${U.wood} nights of firewood.`);afterAction()}
function bxLotActions(a){
  if(S.loc!=='home'||!bxLotOk())return;const X=BX(),L2=X.lot;
  if(L2.seen&&!L2.own){const p=Math.min(100,Math.floor(Math.max(0,S.money)/BX_LOT*100));
    a.push({cat:'boatx',ic:'🏘️',l:`Buy the lot next door: ${bxD(BX_LOT)}`,s:`A savings goal. You have ${bxD(Math.max(0,S.money))} of ${bxD(BX_LOT)} (${p}%). Room for a third garage bay.`,dis:S.money<BX_LOT,fn:bxLotBuy})}
  if(L2.own&&!X.bay){const job=bxLotJob();
    a.push({cat:'boatx',ic:'🏗️',l:job?'Third garage bay: booked':`Build a third garage bay: ${bxD(BX_BAY)}`,s:job?`The builder comes over on the ferry ${fmtAbs(job.due)}.`:`A third bay for the skiff: no wear between trips, safe from storms and theft, a workbench for servicing it. 1–2 weeks.${S.phone<=0?' Your phone is dead.':''}`,dis:!!job||S.money<BX_BAY||S.phone<=0,fn:bxBayBook})}
  if(X.bay){
    if(bxHome()&&S.boat.cond<90)a.push({cat:'boatx',ic:'🔧',l:`Service the outboard at home: ${bxD(BX_HOME_SERVE)}`,s:'40 min at your own workbench. Cheaper than the marina.',dis:S.money<BX_HOME_SERVE,fn:bxHomeServe});
    const U=UP();if(U.wood<BX_WOOD_CAP-7&&typeof seasonStove==='function')a.push({cat:'boatx',ic:'🪵',l:`Stack a big load of firewood in the bay (${U.wood} nights)`,s:`1.5 hours. The bay holds up to ${BX_WOOD_CAP} nights (the shed alone holds 14).`,fn:bxWood})}
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{bxLotActions(a);
  // the garage card (69-garage.js): three slots once the bay is built
  if(garageBay()&&S.loc==='home'&&!visitorOn()){const g=a.find(x=>x&&(x.id==='garage'||/^Garage:/.test(x.l||'')));
    const sk=bxGaraged()?'⛵ skiff':'⛵ (bay free for the skiff)';
    if(g){g.l=g.l.replace(/\(\d+\/\d+\)\s*$/,'')+'· '+sk+' (3 bays)';g.s=(g.s||'')+' The third bay is built for the boat.'}
    else a.push({id:'garage',ic:'🏠',l:`Garage: ${sk} (3 bays)`,cat:'here',s:'A third bay, built for the boat.',dis:true})}
}catch(e){console.error(e)}return a}}
