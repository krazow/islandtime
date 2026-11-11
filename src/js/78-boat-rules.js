// ---------------- 🚤 boat extras, part 1: what the skiff carries, and the Boater Education Card ----------------
// State: S.bx (lazy; old saves just work; it rides along from chapter to chapter, because storyAdvance keeps unknown keys):
//   {card, bought (bxAbs day), reg (calendar year), hull (season key), winter, ins, insThru, idle, up:{lights,fog,eng25}, beat:{}, lot:{seen,own}, bay, outDk}
// Cargo: a private boat may carry what the ferry bans. Up to two 5-gallon gas cans, a cooler and a few bags of groceries go aboard.
// Washington requires a Boater Education Card to run a motor of 15 hp or more (anyone born after Jan 1, 1955). The bill of sale or
// course certificate stands in for a card for 60 days; the card is good for life. Running without one risks a marine patrol ticket ($87).
// Other files: 79 registration/winterizing/insurance, 80 the lot and the third garage bay, 81 upgrades and resale, 82 fun and friends.
const BX_CARD_FEE=10, BX_GRACE=60, BX_TICKET=87, BX_REGFINE=50;
const bxAbs=()=>((S.story&&S.story.ch)||0)*90+dayKey();    // a day count that keeps going across story chapters
function bxYear(){try{return gameDate(day()).getFullYear()}catch(e){return 2026}}
function bxSeasonKey(){return ((S.story&&S.story.ch)||0)+':'+seasonId()}
const bxD=n=>'$'+Math.round(n).toLocaleString('en-US');
function BX(){
  if(!S.bx||typeof S.bx!=='object')S.bx={card:false,bought:-999,reg:-1,hull:'',winter:false,ins:false,insThru:-1,idle:0,up:{},beat:{},lot:{seen:false,own:false},bay:false,outDk:-9};
  const X=S.bx;if(!X.up)X.up={};if(!X.beat)X.beat={};if(!X.lot)X.lot={seen:false,own:false};
  if(boatOwn()&&X.bought<=-999){X.bought=bxAbs();X.reg=bxYear();X.hull=bxSeasonKey();X.winter=seasonId()==='winter'}
  return X}
const bxOk=()=>boatOwn()&&!visitorOn()&&!!S&&!S.over;
const bxCardLeft=()=>BX_GRACE-(bxAbs()-BX().bought);
const bxCardOk=()=>BX().card||bxCardLeft()>0;
const bxRegOk=()=>BX().reg===bxYear();
// ---- the crossing: cargo allowed, and the notes under the forecast ----
function bxCargoOk(){const c=S.cargo||{};for(const k in c)if(k!=='gas'&&c[k]>0)return false;return (c.gas||0)<=2}
function bxCrossNote(){
  const X=BX(),L2=[],g=(S.cargo&&S.cargo.gas)||0;
  if(g>0)L2.push(`🛢️ ${g} gas can${g>1?'s':''} aboard. The ferry bans them; a private boat can carry up to two.`);
  if(S.cooler&&S.carried>0)L2.push('🧊 The cooler rides under the middle seat with your groceries.');
  if(!X.card){if(bxCardLeft()>0)L2.push(`🪪 No boater card yet: your bill of sale covers you for ${bxCardLeft()} more day${bxCardLeft()===1?'':'s'}.`);
    else L2.push(`⚠️ No Boater Education Card, and the 60 days are up. Marine patrol writes ${bxD(fineAmt(BX_TICKET))} tickets. (The online course is at home.)`)}
  if(!bxRegOk())L2.push('⚠️ Your boat registration has lapsed: the decal is out of date.');
  if(typeof bxFouled==='function'&&bxFouled())L2.push('🐚 The hull is fouled with barnacles and slime: slower and thirstier.');
  if(X.up.lights)L2.push('💡 Navigation lights: you’re legal after dark.');
  if(X.up.fog)L2.push('📻 Fog horn and handheld GPS on the seat.');
  return L2.length?`<p style="font-size:12px;color:var(--mute)">${L2.join('<br>')}</p>`:''}
// the modal is wrapped for the duration of boatCross only, so the note lands under the forecast
{const _c=boatCross;boatCross=function(){
  if(!bxOk())return _c.apply(this,arguments);
  const gas=((S.cargo&&S.cargo.gas)||0)>0&&bxCargoOk(),_n=cargoN,_m=modal;
  if(gas)cargoN=()=>0;
  modal=function(t,b,btns,nc){if(/Cross in your skiff/.test(t))b+=bxCrossNote();return _m.call(this,t,b,btns,nc)};
  try{return _c.apply(this,arguments)}finally{cargoN=_n;modal=_m}}}
// choppy water with gas cans aboard: ride it out or lighten the load
{const _g=boatGo;boatGo=function(dest,opt){
  opt=Object.assign({},opt);
  if(bxOk()&&opt.choppy&&!opt.bxAsked&&S.cargo&&S.cargo.gas>0){
    return modal('🌊 Chop, with gas cans aboard',`<p>Whitecaps out in the middle of the Sound, and ${S.cargo.gas} red can${S.cargo.gas>1?'s':''} sliding around the floorboards. Every slap of the bow sends them sideways.</p>`,[
      {l:'Slow down and ride it out',s:'+10 min. The cans stay put.',fn:()=>{S.t+=10;phoneTick();say('🌊 You throttle back and take the chop at an angle. Slower, drier, and the cans stay wedged against your legs.');boatGo(dest,Object.assign(opt,{bxAsked:true}))}},
      {l:'Toss a can over the side',s:'Lighter and steadier, but 5 gallons of gas are gone, and it’s no good for the Sound.',fn:()=>{S.cargo.gas--;adj('stress',2);repAdd(-1,'tossed a gas can into the Sound');say('🛢️ You heave a full can over the side. It bobs away, glug, glug, and you try not to watch it go.');boatGo(dest,Object.assign(opt,{bxAsked:true}))}}])}
  if(bxOk()&&opt.fog&&BX().up.fog&&Math.random()<0.7){opt.fog=false;say('📻 The GPS blinks a little blue arrow through the gray and you sound the horn every two minutes. You never lose the shore.')}
  return _g.call(this,dest,opt)}}
// an outboard that takes more gas and goes faster, a fouled hull that does the opposite
{const _n=boatNeed;boatNeed=function(){let g=_n.apply(this,arguments);if(bxOk()){if(BX().up.eng25)g*=1.35;if(typeof bxFouled==='function'&&bxFouled())g*=1.15}return Math.round(g*100)/100}}
// ---- patrol, on arrival ----
{const _a=boatArrive;boatArrive=function(dest,min,notes){
  notes=notes||[];
  if(bxOk()){const X=BX();
    if(X.up.eng25)min=Math.max(15,Math.round(min*0.7));
    if(typeof bxFouled==='function'&&bxFouled())min+=6;
    if(!bxCardOk()&&Math.random()<0.15){const f=fineAmt(BX_TICKET);money(-f);adj('stress',5);repAdd(-2,'ran a boat without a Boater Education Card');S.stats.boatTix=(S.stats.boatTix||0)+1;
      notes.push(`🚨 A WDFW marine patrol boat pulls alongside. “Boater card?” You don’t have one. A ${bxD(f)} ticket, and a polite lecture about the free online course.`)}
    else if(!bxRegOk()&&Math.random()<0.12){const f=fineAmt(BX_REGFINE);money(-f);adj('stress',3);
      notes.push(`🚨 A Pierce County sheriff’s marine unit eyes your lapsed registration decal. A ${bxD(f)} ticket.`)}
    if((S.cargo&&S.cargo.gas>0)&&min>0)notes.push(`🛢️ The gas can${S.cargo.gas>1?'s':''} made it across without a spill.`)}
  return _a.call(this,dest,min,notes)}}
// ---- the course ----
function bxCourse(){
  if(S.money<BX_CARD_FEE)return;
  modal('🪪 Boater Education course',`<p>The state-approved online course: modules on right-of-way, nav lights, life jackets and Puget Sound currents, then a multiple-choice exam. About two hours, then a $${BX_CARD_FEE} card fee. The card is good for life.</p><p style="font-size:13px;color:var(--mute)">Washington requires it for anyone born after January 1, 1955 to run a motor of 15 hp or more. The first offense is $87.</p>`,[
    {l:`Take the course and exam: $${BX_CARD_FEE}`,s:'2 hours at home with the laptop and a pot of tea.',dis:S.money<BX_CARD_FEE||!!powerOut(),fn:()=>{
      money(-BX_CARD_FEE);S.t+=120;phoneTick();BX().card=true;adj('stress',-2);
      say('🪪 Two hours, a lot of arrows pointing at a lot of buoys, and a 92% on the exam. A temporary certificate prints out, and the plastic card follows in the mail. Good for life.');showTile('🪪','Boater Education Card','Good for life','good');afterAction()}},
    {l:'Not now',fn:()=>{}}])}
function bxRulesActions(a,loc){
  if(!bxOk())return;
  if(loc==='home'&&!BX().card)a.push({cat:'boatx',ic:'🪪',l:`Take the boater education course: $${BX_CARD_FEE}`,s:bxCardLeft()>0?`Two hours, once, for life. Your bill of sale covers ${bxCardLeft()} more day${bxCardLeft()===1?'':'s'}.`:'Two hours, once, for life. Your 60 days are up: without the card, crossings risk an $87 ticket.',dis:S.money<BX_CARD_FEE||!!powerOut(),fn:bxCourse});
  if(loc==='home'&&BX().card&&boatOwn())a.push({cat:'boatx',ic:'🪪',l:'Boater Education Card ✓',s:'Good for life. It lives in the glove box, in a sandwich bag.',dis:true});
  if((loc==='marina'||loc==='sunny')&&S.cargo&&S.cargo.gas>0&&S.boat.at===loc&&S.boat.fuel<BOAT_TANK-4.9)a.push({cat:'boatx',ic:'🛢️',l:'Pour a gas can into the skiff’s tank',s:`5 gal into the ${BOAT_TANK}-gal tank (${boatFuelBtn()}).`,fn:()=>{S.cargo.gas--;S.boat.fuel=boatGal(Math.min(BOAT_TANK,S.boat.fuel+5));S.t+=10;phoneTick();say('⛽ You tip a red can into the outboard tank with a funnel and a steady hand.');afterAction()}});
}
Object.assign(ACT_CATS,{boatx:'🚤 Your boat'});
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{bxRulesActions(a,S.loc)}catch(e){console.error(e)}return a}}
// a new boat: the bill of sale starts the 60-day clock; a registration comes with it
{const _b=boatBought;boatBought=function(){const r=_b.apply(this,arguments);try{const X=BX();X.bought=bxAbs();X.reg=bxYear();X.hull=bxSeasonKey();X.winter=seasonId()==='winter';X.idle=0}catch(e){console.error(e)}return r}}
