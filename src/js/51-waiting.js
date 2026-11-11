// ---- ⏩ less waiting (51-waiting.js) ----
// 1) at a ferry landing, "⏩ Wait for the 2:15 boat (35 min)": one tap skips ahead and boards (it reuses waitFerry, so outages, fog and full boats still apply).
// 2) a heads-up 60 and 20 minutes before the last sailing of the night from your side, when you're away from the terminal and need that boat to get home.
const lbMin=n=>n>=60?`${Math.floor(n/60)} h${n%60?' '+n%60+' min':''}`:`${n} min`;
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(S.over||(S.loc!=='aiDock'&&S.loc!=='stDock'))return a;
  const side=L[S.loc].side,car=carHere(),d=day();
  const kD=car&&car.fuel>=0.1?findNext(side,'drive',true):null,kW=findNext(side,'walk',true);
  let s=null,mode=null;
  if(kD&&kD.d===d){s=kD;mode='drive'}else if(kW&&kW.d===d&&canWalkCarry()){s=kW;mode='walk'}
  if(!s)return a;
  const min=Math.max(0,Math.round(s.abs-S.t)),late=s.delay?` It’s running ${s.delay} min late.`:'';
  const item={ic:'⏩',cat:'ferry',l:`Wait for the ${fmt(s.dep)} boat (${lbMin(min)})`,s:`Skips ahead and boards. ${mode==='drive'?'Drive on with your car':'Walk on'}${s.passenger?' (passenger-only boat)':''}${side==='M'?' · '+fareTxt(mode):''}.${late}`,fn:()=>waitFerry(mode)};
  const i=a.map((x,j)=>/^Walk on the next sailing/.test(x.l||'')?j:-1).filter(j=>j>=0)[0];
  if(i===undefined)return a;
  a.splice(i+1,0,item);
}catch(e){console.error(e)}return a}}

// who needs which side tonight: the island for a resident, the mainland for a day-tripper or a visitor on their last day, none when it doesn't matter
function lbHomeSide(){
  if(typeof visitorOn!=='function'||!visitorOn())return 'I';
  const V=VS(),d=day();
  if(V.len==='regular')return (d>=4&&d<=5)?null:'M';
  if(V.len==='day'||d>=V.last)return 'M';
  const R=V.rental;return R&&R.checkedIn&&!R.checkedOut?'I':null;
}
function lbLastSailing(side,d){
  let best=null;
  for(const dep of deps(side,d)){const s=sailing(side,d,dep,'walk',true);if(s.cancel)continue;if(!best||s.abs>best.abs)best=s}
  return best;
}
phoneOnTime(()=>{try{
  if(!S||S.over||!S.week||!L[S.loc]||!phoneCan())return;
  const need=lbHomeSide(),side=L[S.loc].side;
  if(!need||side===need||(side!=='I'&&side!=='M'))return;
  const dock=side==='I'?'aiDock':'stDock';if(S.loc===dock)return;
  const d=day(),last=lbLastSailing(side,d);if(!last)return;
  const left=Math.round(last.abs-S.t);if(left<=0||left>60)return;
  const lvl=left<=20?20:60,W=S.lbWarn=S.lbWarn||{},key=`${S.weekNo||0}:${d}:${side}`;
  if(W[key]!=null&&W[key]<=lvl)return;
  // Easy mode's outage heads-up (34-easy-help.js) already covers a boat that's about to be cancelled
  if((S.easyWarn||[]).some(k=>{const p=String(k).split(':');return +p[0]===(S.weekNo||0)&&+p[1]>=S.t-30&&+p[1]<=last.abs+20}))return;
  W[key]=lvl;const ks=Object.keys(W);if(ks.length>12)delete W[ks[0]];
  const home=need==='I'?'home':'off the island',tm=dist(S.loc,dock),ld=fmt(last.dep%1440);
  phoneNotify('⏰',`Last boat ${home}: ${ld}`,`${left} min. You’re ${tm} min from the ${side==='I'?'landing':'terminal'}.`);
  say(`📱 ⏰ <b>Last boat ${home} tonight</b> (${fmt(S.t)}): the ${ld} sailing leaves in ${left} minutes. You’re about ${tm} min from the ${side==='I'?'ferry landing':'Steilacoom terminal'}, and you need to be in line 20 minutes early. After it, ${need==='I'?'you’re on the mainland until morning':'there’s no way off the island until morning'}.`);
}catch(e){console.error(e)}});
