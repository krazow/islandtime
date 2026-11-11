// ---- 🎟️ going out on the mainland: restaurants and entertainment in Steilacoom, Lakewood and Tacoma ----
// SHARED HELPER for 41-fun-steilacoom.js, 42-fun-lakewood.js, 43-fun-tacoma.js. Each town file calls defFun() for
// its five real places (two restaurants of different kinds + three entertainment spots).
//   defFun({id, town:'Steilacoom'|'Lakewood'|'Tacoma', kind:'restaurant'|'fun', name, ic, desc, pos:[x,y],
//           hours:d=>[openMin,closeMin]|null (d = 0 Mon … 6 Sun), acts:[{l, s, min, cost, stress, health, sat}]})
//   pos: map position in the same units as MP in 00-data.js (≈ miles; the Steilacoom ferry terminal is [0,0],
//        Lakewood's supermarket [5,4], Hilltop Tacoma [10.5,4.5], downtown Tacoma ≈ [11,6]).
//   acts: what you can do there. min = minutes, cost = dollars, stress = change (negative = relaxing),
//         health = change, sat = days of food it counts as (a meal = 0 days, but it stops tonight's hunger: sat:1 marks a meal).
// Residents: an outing costs time and money and lowers stress (once per place per day for the stress part).
// Visitors: each different place you go out to adds to the visit score ("Out on the town", up to 5 places).
const FUN={};                                    // id -> definition
const FUN_VISIT_PTS=60, FUN_VISIT_MAX=5;
function defFun(f){
  FUN[f.id]=f;
  L[f.id]={name:f.name.includes(f.town)?f.name:`${f.name} (${f.town})`,side:'M',ic:f.ic,desc:f.desc,hours:f.hours,fun:true,town:f.town};
  MP[f.id]=f.pos;
}
const funLog=()=>{S.fun=S.fun||{days:{},went:{}};return S.fun};
function funDo(f,a){
  const F=funLog(),dk=dayKey(),key=f.id+':'+dk,first=!F.days[key];
  if(a.cost&&!canEssential(a.cost)){say('Your card is declined. Maybe another night.');return render()}
  if(a.cost)money(-a.cost);S.t+=a.min||60;
  if(first&&a.stress)adj('stress',a.stress);if(a.health)adj('health',a.health);
  if(a.sat){S.ateOut=day();S.ateOutAt=f.name;}                  // counts as a meal (06-day.js skips tonight's hunger when you ate out)
  F.days[key]=true;F.went[f.id]=(F.went[f.id]||0)+1;S.stats.outings=(S.stats.outings||0)+1;
  say(`${f.ic} ${a.done||a.l}${a.cost?` (−${$(a.cost)})`:''}.`);
  afterAction();
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  const f=FUN[S.loc];if(!f)return a;const h=f.hours?f.hours(day()):[0,1440],m=tod(),open=!!h&&m>=h[0]&&m<h[1];
  if(!open){a.push({ic:f.ic,l:`${f.name} is closed`,s:h?`Open ${fmt(h[0])}–${fmt(h[1]%1440)}.`:'Closed today.',dis:true});return a}
  for(const x of f.acts){const late=m+(x.min||60)>h[1]+30;
    a.push({ic:x.ic||f.ic,l:x.l+(x.cost?` — ${$(x.cost)}`:''),s:(x.s||'')+` ${x.min||60} min.`+(late?' Closing soon.':''),cat:'here',dis:late,fn:()=>funDo(f,x)})}
}catch(e){console.error(e)}return a}}
// visitors: going out on the mainland counts toward the visit
if(typeof visitScore==='function'){const _vs=visitScore;visitScore=function(){const r=_vs.apply(this,arguments);try{
  if(!visitorOn()||!S.fun)return r;const n=Math.min(FUN_VISIT_MAX,Object.keys(S.fun.went).filter(k=>FUN[k]).length);if(!n)return r;
  const p=n*FUN_VISIT_PTS;r.score+=p;r.parts=r.parts||{};r.parts.fun=p;r.lines.splice(r.lines.length-1,0,`🎟️ Out on the town: ${n} place${n===1?'':'s'} on the mainland (+${p})`);
  if(typeof visitorGrade==='function'){const g=visitorGrade(r.score);r.grade=g[0];r.title=g[1];r.blurb=g[2]}
}catch(e){console.error(e)}return r}}
