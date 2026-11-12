// ---- 🏠 the cabin's garage, and choosing which car to drive ----
// The cabin has a two-car garage. Cars parked at home are garaged (up to GARAGE_CAP): on cold or dark mornings a garaged car's
// battery is half as likely to leave you stranded (the island Subaru's dead battery, and Ferry Hell's car trouble).
// When two cars are where you are (usually both at the cabin, after bringing the mainland beater over), you choose which one
// to drive: S.drive remembers the pick, and carHere() returns it. Everything that drives, fuels or loads "the car here" follows.
const GARAGE_CAP=2;
const carsHere=()=>S.cars.filter(c=>c.loc===S.loc);
const garaged=c=>!!c&&c.loc==='home'&&!visitorOn()&&S.cars.filter(x=>x.loc==='home').indexOf(c)<GARAGE_CAP;
{const _ch=carHere;carHere=function(){const here=carsHere();if(here.length>1&&S.drive){const c=here.find(c=>c.id===S.drive);if(c)return c}return _ch.apply(this,arguments)}}
const carShort=c=>c.name.replace(/^.*\(|\)$/g,'').replace(/^old /,'');   // "Island car (old Subaru)" -> "Subaru"
function driveChoose(id){const c=S.cars.find(c=>c.id===id);if(!c)return;S.drive=id;say(`🔑 You grab the keys to the ${carShort(c)}.`);render()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  const here=carsHere();
  if(here.length>1){const cur=carHere();
    for(const c of here)if(c!==cur)a.push({ic:'🔑',l:`Take the ${carShort(c)} instead`,cat:'here',
      s:`You’re set to drive the ${carShort(cur)}. ${c.diesel?'Diesel':'Gas'}: ${c.fuel}/${c.tank} gal${S.loc==='home'?' · both in the garage':''}.`,fn:()=>driveChoose(c.id)})}
  if(S.loc==='home'&&!visitorOn()){const g=S.cars.filter(c=>c.loc==='home');
    a.push({id:'garage',ic:'🏠',l:`Garage: ${g.length?g.map(c=>`${c.diesel?'🛻':c.id==='isl'?'🚗':'🚙'} ${carShort(c)}`).join(' · '):'empty'} (${Math.min(g.length,GARAGE_CAP)}/${GARAGE_CAP})`,cat:'here',
      s:g.length?'Out of the weather: cold mornings are half as hard on the battery.':'Room for two cars. Out of the weather, easier on batteries.',dis:true})}
}catch(e){console.error(e)}return a}}
// a garaged car starts better on cold, dark mornings
for(const e of EV)if(e.id==='dead_battery'||e.id==='hl_battery'){const ch=e.chance;
  e.chance=ctx=>{const p=typeof ch==='function'?ch(ctx):ch;const c=(ctx&&ctx.car)||carHere();return garaged(c)&&(ctx&&ctx.from?ctx.from==='home':S.loc==='home')?p*0.5:p}}
