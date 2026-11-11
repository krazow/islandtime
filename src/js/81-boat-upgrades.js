// ---------------- 🚤 boat extras, part 4: upgrades at the marina, and a fair resale ----------------
// S.bx.up = {lights, fog, eng25}. Navigation lights: crossings after dark lose the darkness risk. Fog horn + handheld GPS: most of the
// fog risk goes away. A 25 hp outboard: about 30% faster, 35% more gas. Selling the skiff pays by condition, upgrades and use.
const BX_UPS=[
  {id:'lights',ic:'💡',n:'Navigation lights',c:85,min:30,d:'Red, green and a white stern light, wired to a battery. After dark you’re legal and visible: no more drift-log roulette.',say:'💡 Red and green on the bow, white on the stern, a little battery under the seat. You flip the switch twice just to see it.'},
  {id:'fog',ic:'📻',n:'Fog horn and handheld GPS',c:160,min:30,d:'A canister horn and a waterproof GPS. Fog still isn’t fun, but you stop losing the shoreline.',say:'📻 An air horn, a handheld GPS in a floating case and a laminated chart of the Narrows. You are now the person with a laminated chart.'},
  {id:'eng25',ic:'🚀',n:'25 hp outboard',c:2200,min:90,d:'Used but sound, with a trade-in on the old 15. About 30% faster across, but 35% more gas. (Still needs the boater card.)',say:'🚀 The mechanic bolts on a 25 hp four-stroke and sends you out for a test run. The bow lifts, the wake spreads, and the Sound is suddenly smaller.'}];
function bxUpBuy(id){const u=BX_UPS.find(x=>x.id===id);if(!u||BX().up[id]||S.money<u.c)return;money(-u.c);S.t+=u.min;phoneTick();BX().up[id]=true;if(id==='eng25')S.boat.cond=100;say(u.say);showTile(u.ic,u.n+' installed','Marina','good');afterAction()}
function bxUpActions(a){
  if(S.loc!=='marina'||!bxOk()||S.boat.at!=='marina')return;
  BX_UPS.forEach(u=>{const own=BX().up[u.id];a.push({cat:'boatx',ic:u.ic,l:own?`${u.n} ✓`:`${u.n}: ${bxD(u.c)}`,s:own?'Installed. '+u.d:u.d,dis:own||S.money<u.c,fn:()=>bxUpBuy(u.id)})})}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{bxUpActions(a)}catch(e){console.error(e)}return a}}
// no darkness risk with lights on
{const _c=boatConditions;boatConditions=function(){const r=_c.apply(this,arguments);try{if(bxOk()&&BX().up.lights)r.H=r.H.filter(h=>h.k!=='dark')}catch(e){}return r}}
// ---- resale ----
function bxSellValue(){const B=S.boat,X=BX();let p=900+B.cond*8;if(X.up.lights)p+=40;if(X.up.fog)p+=90;if(X.up.eng25)p+=1100;p-=Math.min(250,(B.trips||0)*6);return Math.max(500,Math.round(p/10)*10)}
boatSell=function(){const B=S.boat,p=bxSellValue(),ups=Object.keys(BX().up).filter(k=>BX().up[k]).length;
  modal('🚤 Sell the skiff?',`<p>A guy on the dock offers <b>${bxD(p)}</b> cash. ${B.cond<50?'He winces at the outboard.':'He looks the hull over and nods.'}${ups?` He reads your upgrades off like a checklist and adds a little for them.`:''}</p><p style="font-size:12px;color:var(--mute)">Based on condition (${Math.round(B.cond)}%)${ups?', your upgrades':''} and how many trips it’s made. Your boater card stays yours.</p>`,[
    {l:`Sell for ${bxD(p)}`,fn:()=>{money(p);const X=BX();X.up={};X.ins=false;X.insThru=-1;X.bought=-999;S.boat=null;boatSync();S.t+=20;say(`🚤 Handshake, cash, and an empty slip. ${p<2000?'You lost a little':'Not bad'} on the deal.`);afterAction()}},
    {l:'Keep it',fn:()=>{}}])};
