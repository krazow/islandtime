// ---------------- 🚤 your own boat: a used skiff between the Riv marina and Sunnyside ----------------
// Buy a used aluminum skiff at the Riv marina ($2,500). Keep it in a slip at the marina ($90 a month) or on a trailer at
// home (free, but launching and hauling out adds 20 minutes a trip). Cross yourself between the island (the Riv marina)
// and the mainland (the public dock and boat launch at Sunnyside Beach, Steilacoom; Saltar's Point is the next beach over).
// It's a way around a canceled sailing, not a free shortcut: 25–40 minutes, a gallon or so of gas each way (there's none on
// the island except Dale's, $12 a gallon), and you arrive without your car. The car stays wherever it is.
// Risks: a storm or small craft advisory (refused), fog, chop, darkness and a low tide at the launch (your call, with
// consequences), and an outboard that quits. Residents only: visitors take the ferry.
//   S.boat = {own, store:'slip'|'trailer', at:'marina'|'sunny', fuel (gal), cond (0..100), trips, paidThru (dayKey)}
const BOAT_PRICE=2500, BOAT_SLIP=90, BOAT_TANK=6, BOAT_GAL=1.2, BOAT_TRIP=[25,40];
const BOAT_SUNNY={name:'Sunnyside Beach boat launch (Steilacoom)',side:'M',ic:'🛶',desc:'The public dock and boat launch at Sunnyside Beach Park, a short walk from Saltar’s Point. A ramp, a float and a lot of mud at low tide'};
Object.defineProperty(L,'sunny',{value:BOAT_SUNNY,enumerable:false,configurable:true,writable:true});   // hidden from the travel list until you own a boat
MP.sunny=[-0.9,0.9];
const boatOwn=()=>!!(typeof S!=='undefined'&&S&&S.boat&&S.boat.own);
function boatSync(){try{Object.defineProperty(L,'sunny',{value:BOAT_SUNNY,enumerable:boatOwn()&&!visitorOn(),configurable:true,writable:true})}catch(e){}}
{const _r=render;render=function(){boatSync();return _r.apply(this,arguments)}}
const boatGal=g=>Math.round(g*10)/10;
function boatFuelBtn(){const B=S.boat;return `${boatGal(B.fuel)}/${BOAT_TANK} gal`}
// ---- tides: ~12.4 h cycle; "low" for about a quarter of it
function boatPhase(off){return (((dayKey()*1440+tod()+(off||0))%745)+745)%745/745}
function boatLow(off){const p=boatPhase(off);return p>=0.38&&p<0.62}
function boatTideWait(){return Math.max(5,Math.ceil((0.62-boatPhase())*745))}
// ---- conditions right now ----
function boatConditions(dest){
  const d=day(),m=tod(),st=S.week&&S.week.storm,sea=seasonId(),mul=sea==='summer'?0.5:sea==='winter'?1.3:1,r=wxR(d,'skiff'),H=[];let refuse=null;
  if(st&&S.t>=st.start-360&&S.t<st.end)refuse='a gale is coming in: the marina’s flags are standing straight out and there’s a small craft advisory up and down the Sound.';
  else if(r<0.06*mul)refuse='there’s a small craft advisory today: steep chop and 25-knot gusts. A skiff has no business out there.';
  else if(r<0.2*mul)H.push({k:'choppy',t:'🌊 Choppy: a stiff southwest breeze and whitecaps in the middle of the Sound. Slower, wetter, thirstier.'});
  if(S.week&&S.week.fog&&S.week.fog[d]&&m<660)H.push({k:'fog',t:'🌫️ Fog: you can hear the ferry horn but not see the ferry. No radar on a skiff.'});
  if(!seasonLite(m)||!seasonLite(m+BOAT_TRIP[1]))H.push({k:'dark',t:'🌙 Dark: no real nav lights, drift logs, and the Coast Guard would say don’t.'});
  const low=dest==='sunny'||S.loc==='sunny'?boatLow():false;
  if(low)H.push({k:'low',t:'🪨 Low tide: the Sunnyside ramp is mud flats for a hundred feet.'});
  return {refuse,H,low};
}
function boatForecastTxt(){
  const c=boatConditions('sunny');
  return c.refuse?'⛔ '+c.refuse.charAt(0).toUpperCase()+c.refuse.slice(1):c.H.length?c.H.map(h=>h.t).join('<br>'):'☀️ Calm: light wind, flat water, good visibility.';
}
// ---- crossing ----
function boatNeed(){return BOAT_GAL}
function boatDest(){return S.loc==='marina'?'sunny':'marina'}
function boatCross(){
  const B=S.boat,dest=boatDest(),c=boatConditions(dest),toMain=dest==='sunny',need=boatNeed();
  const head=`<p>${toMain?'From the Riv marina to Sunnyside Beach in Steilacoom.':'From the Sunnyside launch back to the Riv marina.'} About ${BOAT_TRIP[0]}–${BOAT_TRIP[1]} minutes, ~${need} gallons of gas. Your car stays where it is.</p>`;
  const wx=`<p style="font-size:13px">${c.refuse?'⛔ '+c.refuse.charAt(0).toUpperCase()+c.refuse.slice(1):c.H.length?c.H.map(h=>h.t).join('<br>'):'☀️ Calm water, a light breeze, good visibility.'}</p>`;
  const stat=`<p style="font-size:12px;color:var(--mute)">Tank ${boatFuelBtn()} · outboard ${B.cond>=70?'running well':B.cond>=40?'a bit rough':'ailing'}${B.store==='trailer'?' · trailer: +20 min to launch':''}.</p>`;
  if(B.fuel<need)return modal('🚤 Out of gas',head+`<p>The tank has ${boatFuelBtn()}. That’s not enough to get across.</p>`+stat,[{l:'OK',fn:()=>{}}]);
  if(cargoN()>0||!canWalkCarry())return modal('🚤 Too much to carry',head+`<p>A skiff is for you and a backpack. ${cargoN()>0?'Leave the cargo for the ferry.':'Those groceries need the car deck.'}</p>`,[{l:'OK',fn:()=>{}}]);
  if(c.refuse)return modal('🚤 Not today',head+wx,[{l:'OK, ferry it is',fn:()=>{}}]);
  const risky=c.H.filter(h=>h.k!=='low');
  const go=opt=>()=>boatGo(dest,opt);
  const base={choppy:risky.some(h=>h.k==='choppy'),fog:risky.some(h=>h.k==='fog'),dark:risky.some(h=>h.k==='dark')};
  const btns=[];
  if(c.low){const w=boatTideWait();btns.push({l:`Wait for the tide (about ${w} min)`,s:'Time passes; the water comes back up the ramp.',fn:()=>{S.t+=w;phoneTick();say('🌊 You sit on a driftwood log and watch the tide come back in, one inch at a time.');afterAction()}});
    btns.push({l:risky.length?'Go anyway: drag it through the mud':'Drag it through the mud',s:'+20 min, stress +4, ruined boots.',fn:go(Object.assign({},base,{low:true}))})}
  else btns.push({l:risky.length?'Go anyway':'Cast off',s:risky.length?'On your own head.':`About ${BOAT_TRIP[0]}–${BOAT_TRIP[1]} min.`,fn:go(base)});
  btns.push({l:'Not now',fn:()=>{}});
  modal('🚤 Cross in your skiff',head+wx+stat,btns);
}
function boatGo(dest,opt){
  const B=S.boat,notes=[];let min=BOAT_TRIP[0]+Math.floor(Math.random()*(BOAT_TRIP[1]-BOAT_TRIP[0]+1))+(opt.choppy?8:0)+(B.store==='trailer'?20:0),gal=boatNeed()+(opt.choppy?0.4:0);
  if(opt.low){min+=20;adj('stress',4);notes.push('🪨 The skiff scrapes the whole ramp. You end up ankle-deep in cold mud, dragging it the last hundred feet.')}
  if(opt.dark&&Math.random()<0.3){min+=30;B.cond=Math.max(0,B.cond-25);adj('stress',8);notes.push('🪵 In the dark you clip a drift log. A bang, a long scrape and a very quiet few minutes. The skiff is still afloat, but the outboard sounds worse.')}
  if(opt.fog&&Math.random()<0.3){min+=35;adj('stress',8);notes.push('🌫️ In the fog you lose the shoreline and steer by the ferry horn and your own stubbornness. You wander a long while before the beach shows up.')}
  if(opt.choppy&&Math.random()<0.3){adj('health',-2);adj('stress',5);S.phone=Math.max(0,S.phone-25);notes.push('🌊 A wave comes over the bow. You arrive soaked, with a damp phone.')}
  B.fuel=boatGal(Math.max(0,B.fuel-gal));
  const mech=Math.random()<0.07+(B.cond<60?0.12:0)+(B.cond<30?0.15:0);
  const fin=(extra,more)=>boatArrive(dest,min+extra,notes.concat(more||[]));
  if(!mech)return fin(0);
  const tow=S.friends.sam;
  modal('🔧 The outboard quits',`<p>Midway across, the outboard coughs, surges and dies. Silence, slapping water, and a tug pulling you toward the Narrows. The ferry is somewhere behind you.</p>`,[
    {l:'Yank the pull cord',s:'20 min. Probably.',fn:()=>{if(Math.random()<0.65){B.cond=Math.max(0,B.cond-8);fin(20,['🔧 On the ninth pull it catches, runs rough and settles. You don’t say a word until you’re tied up.'])}else{adj('stress',6);adj('health',-1);fin(90,['🔧 It won’t catch. You row the last mile with the little oars, and you’ll feel it tomorrow.'])}}},
    {l:'Row it in',s:'70 min of effort. Stress +4.',fn:()=>{adj('stress',4);adj('health',-1);fin(70,['🚣 You row with one eye on the tide. It’s humbling and a good workout.'])}},
    tow?{l:'Text Sam: “Can you come get me?”',s:'Sam’s sailboat. About 40 min. Free, but you owe him.',fn:()=>{friendPts('sam',1);adj('stress',2);fin(40,['⛵ Sam appears under sail, takes your line and tows you in without saying anything about the engine. You owe him a favor.'])}}:{l:'Call the tow service',s:'$150, 45 min.',fn:()=>{money(-150);fin(45,['⚓ A tow boat tows you in. $150, and a bored guy named Dwayne.'])}},
    ]);
}
function boatArrive(dest,min,notes){
  const B=S.boat,toMain=dest==='sunny';
  crossing(toMain?'I':'M','Across the Sound in your skiff',`${min} minutes · ${L[dest].name}`,()=>{
    S.t+=min;phoneTick();B.cond=Math.max(0,B.cond-2);B.trips=(B.trips||0)+1;B.at=dest;S.loc=dest;S.stats.boatTrips=(S.stats.boatTrips||0)+1;
    say(toMain?`🚤 You tie up at the Sunnyside float in ${min} minutes. Your car is still on the island.`:`🚤 The Riv marina comes up out of the haze. ${min} minutes, and the car is exactly where you left it.`);
    notes.forEach(n=>say(n));
    afterAction()},true);
}
// ---- buying, fuel, service, selling ----
function boatBuy(){
  modal('🚤 A used skiff, $2,500',`<p>A hand-lettered sign on the marina board: <b>14-ft aluminum skiff, 15 hp outboard, 6-gal tank. Runs great. Don’t ask about 2019.</b> A dent in the bow, a seat that’s been replaced twice, and a trailer if you want it.</p><p style="font-size:13px;color:var(--mute)">It’s no car ferry: ${BOAT_TRIP[0]}–${BOAT_TRIP[1]} minutes across, about ${BOAT_GAL} gallons each way, and no crossing in storms, fog, chop or the dark. Gas is only at Dale’s on the island. Where do you keep it?</p>`,[
    {l:`Rent a slip at the Riv marina: $${(BOAT_PRICE+BOAT_SLIP).toLocaleString()}`,s:`$${BOAT_PRICE.toLocaleString()} for the boat plus $${BOAT_SLIP} a month moorage (the first month now).`,dis:S.money<BOAT_PRICE+BOAT_SLIP,fn:()=>boatBought('slip')},
    {l:`Keep it on the trailer: $${BOAT_PRICE.toLocaleString()}`,s:'No moorage fee, but launching and hauling out adds 20 min each trip.',dis:S.money<BOAT_PRICE,fn:()=>boatBought('trailer')},
    {l:'Not now',fn:()=>{}}]);
}
function boatBought(store){
  money(-BOAT_PRICE-(store==='slip'?BOAT_SLIP:0));S.t+=30;phoneTick();
  S.boat={own:true,store,at:'marina',fuel:3,cond:70,trips:0,paidThru:dayKey()+28};adj('stress',-3);boatSync();
  say(`🚤 Cash on the hood of a truck, a signature on a bill of sale, and you own a boat. ${store==='slip'?`You’re in a slip at the Riv marina ($${BOAT_SLIP} a month).`:'It’s on a trailer at the Riv ramp.'} The seller left 3 gallons of gas in the tank.`);
  showTile('🚤','You own a boat','A used skiff at the Riv marina','good');afterAction();
}
function boatFuelHome(){const B=S.boat,g=boatGal(Math.min(S.homeGas,BOAT_TANK-B.fuel));S.homeGas=boatGal(S.homeGas-g);B.fuel=boatGal(B.fuel+g);S.t+=10;phoneTick();say(`⛽ You pour ${g} gallon${g===1?'':'s'} from the shed stash into the skiff’s tank (${boatFuelBtn()}).`);afterAction()}
function boatServe(){money(-60);S.t+=30;phoneTick();S.boat.cond=100;say('🔧 New plug, fresh gas-line filter and a quick lesson from the marina’s mechanic. The outboard purrs.');afterAction()}
function boatSell(){const B=S.boat,p=Math.round(900+B.cond*8);modal('🚤 Sell the skiff?',`<p>A guy on the dock offers <b>$${p.toLocaleString()}</b> cash. ${B.cond<50?'He winces at the outboard.':'He looks the hull over and nods.'}</p>`,[{l:`Sell for $${p.toLocaleString()}`,fn:()=>{money(p);S.boat=null;boatSync();S.t+=20;say(`🚤 Handshake, cash, and an empty slip. ${p<2000?'You lost a little':'Not bad'} on the deal.`);afterAction()}},{l:'Keep it',fn:()=>{}}]);}
function boatMoorage(){
  const B=S.boat;if(!boatOwn()||B.store!=='slip')return;
  if(dayKey()>=B.paidThru){money(-BOAT_SLIP);B.paidThru+=28;say(`⚓ The month’s moorage at the Riv marina: $${BOAT_SLIP}, charged to your card.`)}
}
{const _e=endDay;endDay=function(){try{boatMoorage()}catch(e){console.error(e)}return _e.apply(this,arguments)}}
// the boat spends the night at the public float: a note on the hull
defEvent({id:'boat_overnight',hook:'night',priority:2,max:2,chance:0.45,cond:()=>boatOwn()&&S.boat.at==='sunny'&&S.boat.store==='slip',
  run(ctx){money(-35);ctx.notes.push('🚤 A Steilacoom parks officer left a $35 overnight-moorage notice on your skiff at the Sunnyside float. The public dock is for day use.')}});
Object.assign(TILE_META,{boat_overnight:['🚤','Moorage notice at Sunnyside','bad']});
if(typeof storyHooks!=='undefined')storyHooks.push({id:'boat',chapterStart(ch,notes){if(ch>0&&boatOwn()){const B=S.boat;B.paidThru=28;if(B.store==='slip'){money(-BOAT_SLIP);notes&&notes.push(`⚓ A new month of moorage at the Riv marina: $${BOAT_SLIP}.`)}}}});
// ---- actions ----
function boatActions(a,loc){
  if(visitorOn())return;
  const B=S.boat,own=boatOwn();
  if(loc==='marina'){
    if(!own)a.push({cat:'ferry',ic:'🚤',l:'Look at the used skiff for sale: $2,500',s:'A hand-lettered sign on the marina board. 14 ft, 15 hp, runs great.',fn:boatBuy});
    else{
      const out=typeof activeOutage==='function'&&activeOutage();
      if(B.at==='marina')a.push({cat:'ferry',ic:'🚤',l:'Take the skiff across to Sunnyside',s:`${BOAT_TRIP[0]}–${BOAT_TRIP[1]} min, ~${BOAT_GAL} gal. Tank ${boatFuelBtn()}.${out?' The ferry’s down: this is the way around.':''}`,cls:out?'primary':'',fn:boatCross});
      else a.push({cat:'ferry',ic:'🚤',l:'Your skiff is at Sunnyside',s:'You left it at the public float on the mainland.',dis:true});
      if(B.at==='marina'){
        if(S.homeGas>0&&B.fuel<BOAT_TANK-0.2)a.push({cat:'fuel',ic:'⛽',l:'Fill the skiff’s tank from your shed gas',s:`${S.homeGas} gal stashed. Tank ${boatFuelBtn()}. The generator needs some too.`,fn:boatFuelHome});
        if(B.cond<90)a.push({cat:'fuel',ic:'🔧',l:'Service the outboard: $60',s:'30 min with the marina mechanic. Fewer breakdowns.',dis:S.money<60,fn:boatServe});
        a.push({cat:'ferry',ic:'🌤️',l:'Check the marine forecast',s:'The flag, the chalkboard, and the guy who’s always on the dock.',fn:()=>{S.t+=5;modal('🌤️ Marine forecast',`<p>${boatForecastTxt()}</p>`+(boatLow()?'<p style="font-size:13px">Tide is low right now.</p>':'<p style="font-size:13px">Tide is '+(boatLow(120)?'dropping to a low in a couple of hours.':'not low.')+'</p>'),[{l:'OK',fn:()=>{}}])}});
        a.push({cat:'ferry',ic:'💵',l:'Sell the skiff',s:'A guy on the dock is always interested.',fn:boatSell});
      }
    }
  }
  if(loc==='sunny'&&own){
    if(B.at==='sunny')a.push({cat:'ferry',ic:'🚤',l:'Take the skiff home to the Riv marina',s:`${BOAT_TRIP[0]}–${BOAT_TRIP[1]} min, ~${BOAT_GAL} gal. Tank ${boatFuelBtn()}.${B.store==='slip'?' Don’t leave it overnight: the float is for day use.':''}`,cls:'primary',fn:boatCross});
    else a.push({cat:'ferry',ic:'🚤',l:'Your skiff is at the Riv marina',s:'You left it on the island.',dis:true});
  }
  if(loc==='gas'&&own&&B.at==='sunny'&&B.fuel<BOAT_TANK-0.2){const g=boatGal(BOAT_TANK-B.fuel),c=Math.round(g*GAS_PRICE);a.push({cat:'fuel',ic:'⛽',l:`Fill the skiff’s portable tank: $${c}`,s:`${g} gal at $${GAS_PRICE}/gal. It’s at the launch; carry the tank up. You can’t take it on the ferry.`,dis:S.money<c,fn:()=>{money(-c);B.fuel=BOAT_TANK;S.t+=20;phoneTick();say(`⛽ You lug the red marine tank up from the Sunnyside float and fill it: ${g} gal, $${c}.`);afterAction()}})}
  if(loc==='dale'&&own&&B.at==='marina'&&B.fuel<BOAT_TANK-0.2&&isOpen('dale')){const g=Math.min(3,boatGal(BOAT_TANK-B.fuel)),c=Math.round(g*DALE_PRICE);a.push({cat:'fuel',ic:'⛽',l:`Buy ${g} gal for the skiff: $${c}`,s:`$${DALE_PRICE}/gal into your gas can, poured in at the marina.`,dis:S.money<c,fn:()=>{money(-c);B.fuel=boatGal(B.fuel+g);S.t+=10;phoneTick();say(`⛽ Dale fills a red can, no questions. ${g} gal for the skiff, $${c}.`);afterAction()}})}
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{boatActions(a,S.loc)}catch(e){console.error(e)}return a}}
