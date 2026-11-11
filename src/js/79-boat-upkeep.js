// ---------------- 🚤 boat extras, part 2: registration, winterizing, the hull, insurance, and the weather ----------------
// Registration: $40 a calendar year (a lapse risks a $50 ticket when you cross). Winterizing the outboard: do it yourself (1 h, $15 of
// stabilizer, antifreeze and fogging oil) or the marina ($120); an unwinterized outboard can crack in a hard freeze. A slip boat grows
// a fouled hull each season ($60 to clean). Insurance is $15 a month and covers storm damage and theft at Sunnyside (a $50 deductible).
const BX_REG=40, BX_WINT=15, BX_WINT_MARINA=120, BX_HULL=60, BX_INS=15, BX_DEDUCT=50;
const bxGaraged=()=>boatOwn()&&S.boat.store==='garage';
const bxHome=()=>boatOwn()&&(S.boat.at==='home'||(typeof boatAtHome==='function'&&boatAtHome()));
const bxFouled=()=>boatOwn()&&!bxGaraged()&&S.boat.store==='slip'&&BX().hull!==bxSeasonKey();
const bxColdSeason=()=>seasonId()==='winter'||(seasonId()==='fall'&&(S.weekNo||0)>=2);
const bxInsured=()=>BX().ins;
function bxReg(){if(S.money<BX_REG)return;money(-BX_REG);S.t+=10;phoneTick();BX().reg=bxYear();say(`🪪 You renew the boat registration online: ${bxD(BX_REG)}, and a new decal comes in the mail for the bow.`);afterAction()}
function bxWinter(marina){const c=marina?BX_WINT_MARINA:BX_WINT;if(S.money<c)return;money(-c);S.t+=marina?30:60;phoneTick();BX().winter=true;
  say(marina?'🔧 The marina mechanic drains the lower unit, fogs the cylinders and tops up the antifreeze. $120, and he writes the date on a tag.':'🔧 Stabilizer in the tank, fogging oil in the cylinders, fresh gear oil, and the cooling passages flushed with antifreeze. An hour with a YouTube video on the phone, and you feel competent.');afterAction()}
function bxHullClean(){if(S.money<BX_HULL)return;money(-BX_HULL);S.t+=45;phoneTick();BX().hull=bxSeasonKey();say('🐚 A diver scrapes a season of barnacles and green slime off the hull. $60, and the skiff feels ten pounds lighter.');afterAction()}
function bxInsure(on){const X=BX();if(on){if(S.money<BX_INS)return;money(-BX_INS);X.ins=true;X.insThru=bxAbs()+28;S.t+=10;phoneTick();say(`📄 Boat insurance: ${bxD(BX_INS)} a month. It covers storm damage and theft at the public float, less a ${bxD(BX_DEDUCT)} deductible.`)}
  else{X.ins=false;X.insThru=-1;say('📄 You cancel the boat insurance.')}afterAction()}
function bxUpkeepActions(a,loc){
  if(!bxOk())return;const X=BX(),B=S.boat,here=(loc==='marina'&&B.at==='marina')||(loc==='home'&&bxHome());
  if(loc==='home'||loc==='marina'){
    if(!bxRegOk())a.push({cat:'boatx',ic:'🪪',l:`Renew the boat registration: ${bxD(BX_REG)}`,s:`Lapsed. A lapsed decal risks a ${bxD(fineAmt(BX_REGFINE))} ticket when you cross.`,dis:S.money<BX_REG,fn:bxReg});
    else if(loc==='home')a.push({cat:'boatx',ic:'🪪',l:'Boat registration ✓',s:`Current through ${bxYear()}. Renews yearly: ${bxD(BX_REG)}.`,dis:true,fn:()=>{}});
  }
  if(here&&!X.winter&&(seasonId()==='fall'||seasonId()==='winter')){
    a.push({cat:'boatx',ic:'🧊',l:`Winterize the outboard yourself: ${bxD(BX_WINT)}`,s:'1 hour. Stabilizer, fogging oil, antifreeze. A hard freeze can crack an unwinterized outboard.',dis:S.money<BX_WINT,fn:()=>bxWinter(false)});
    if(loc==='marina')a.push({cat:'boatx',ic:'🔧',l:`Have the marina winterize it: ${bxD(BX_WINT_MARINA)}`,s:'30 min of your time; they do it right.',dis:S.money<BX_WINT_MARINA,fn:()=>bxWinter(true)});
  }
  if(here&&X.winter&&(seasonId()==='fall'||seasonId()==='winter')&&loc==='home')a.push({cat:'boatx',ic:'🧊',l:'Outboard winterized ✓',s:'Ready for the freeze.',dis:true,fn:()=>{}});
  if(loc==='marina'&&B.at==='marina'&&B.store==='slip')a.push({cat:'boatx',ic:'🐚',l:bxFouled()?`Clean the hull: ${bxD(BX_HULL)}`:'Hull is clean ✓',s:bxFouled()?'A diver scrapes the season’s growth off. A fouled hull is slower and burns more gas.':'Cleaned this season. A slip boat grows slime each season.',dis:!bxFouled()||S.money<BX_HULL,fn:bxHullClean});
  if(loc==='marina'||loc==='home')a.push({cat:'boatx',ic:'📄',l:X.ins?'Cancel the boat insurance':`Insure the boat: ${bxD(BX_INS)} a month`,s:X.ins?`Insured: storm damage and theft at Sunnyside are covered (${bxD(BX_DEDUCT)} deductible).`:'Covers storm damage and theft at Sunnyside, less a $50 deductible.',dis:!X.ins&&S.money<BX_INS,fn:()=>bxInsure(!X.ins)});
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{bxUpkeepActions(a,S.loc)}catch(e){console.error(e)}return a}}
// ---- the nights: monthly insurance, idle wear ----
{const _e=endDay;endDay=function(){try{
  if(bxOk()){const X=BX();
    if(X.ins&&bxAbs()>=X.insThru){money(-BX_INS);X.insThru+=28;say(`📄 The month’s boat insurance: ${bxD(BX_INS)}.`)}
    if(!bxGaraged()){X.idle=(X.idle||0)+1;const every=S.boat.store==='slip'||S.boat.store==='buoy'?2:3;if(X.idle>=every){X.idle=0;S.boat.cond=Math.max(0,S.boat.cond-1)}}}}catch(e){console.error(e)}return _e.apply(this,arguments)}}
// a gale: a boat in a slip or on a buoy can take a beating
const bxStormNight=()=>!!(S.week&&S.week.storm&&S.week.storm.day===day());
defEvent({id:'bx_storm',hook:'night',priority:2,max:99,chance:0.6,cond:()=>bxOk()&&!bxGaraged()&&bxStormNight(),
  run(ctx){const X=BX(),B=S.boat,cost=bxInsured()?fineAmt(BX_DEDUCT):fineAmt(250);money(-cost);B.cond=Math.max(0,B.cond-25);adj('stress',4);
    ctx.notes.push(bxInsured()?`⛈️ The gale slammed your skiff against the pilings. The insurance adjuster approves the repair: just the ${bxD(cost)} deductible.`:`⛈️ The gale slammed your skiff against the pilings, cracked a seat and bent the prop. The repair is ${bxD(cost)}, and the outboard isn’t the same.`)}});
// theft at the public float
defEvent({id:'bx_theft',hook:'night',priority:2,max:99,chance:0.1,cond:()=>bxOk()&&S.boat.at==='sunny'&&!bxGaraged(),
  run(ctx){const cost=bxInsured()?fineAmt(BX_DEDUCT):fineAmt(450);money(-cost);S.boat.cond=Math.min(S.boat.cond,60);adj('stress',6);
    ctx.notes.push(bxInsured()?`🚨 Somebody walked off with your outboard at the Sunnyside float overnight. The insurance covers a replacement; you pay the ${bxD(cost)} deductible.`:`🚨 Somebody walked off with your outboard at the Sunnyside float overnight. A used replacement is ${bxD(cost)}, out of pocket.`)}});
// a hard freeze for an unwinterized outboard
defEvent({id:'bx_freeze',hook:'night',priority:2,max:99,chance:0.22,cond:()=>bxOk()&&!bxGaraged()&&!BX().winter&&bxColdSeason()&&!bxStormNight(),
  run(ctx){const cost=fineAmt(180);money(-cost);S.boat.cond=Math.max(0,S.boat.cond-35);adj('stress',4);
    ctx.notes.push(`🥶 A hard freeze overnight. Water left in the outboard’s cooling passages froze and cracked a fitting: ${bxD(cost)} at the marina, and it runs rougher. Winterizing would have prevented it.`)}});
// a nudge: registration and winterizing
defEvent({id:'bx_nudge',hook:'wake',priority:1,max:99,cooldown:3,chance:0.5,cond:()=>bxOk()&&S.loc==='home'&&(!bxRegOk()||(!BX().winter&&bxColdSeason())||bxFouled()),
  run(){const X=BX(),m=[];
    if(!bxRegOk())m.push('📬 A notice from the state: your boat registration has expired. Renew it online ($40).');
    if(!X.winter&&bxColdSeason())m.push('🧊 The first frost is on the roof. Time to winterize the outboard before the freeze.');
    if(bxFouled())m.push('🐚 The skiff’s hull is getting fouled in the slip. A cleaning is $60 at the marina.');
    say(m[0])}});
Object.assign(TILE_META,{bx_storm:['⛈️','The gale hit your boat','bad'],bx_theft:['🚨','Outboard stolen','bad'],bx_freeze:['🥶','Outboard froze','bad'],bx_nudge:['📬','Boat upkeep','info']});
if(typeof storyHooks!=='undefined')storyHooks.push({id:'boatx',chapterStart(ch,notes){try{if(!bxOk()||ch<1)return;const X=BX();
  if(seasonId()==='spring')X.winter=false;
  if(X.ins){X.insThru=bxAbs()+28;money(-BX_INS);notes&&notes.push(`📄 A new month of boat insurance: ${bxD(BX_INS)}.`)}
  X.idle=0}catch(e){console.error(e)}}});
