// ---- 📅 Weekend regular: a long weekend (a vacation Monday spent on the island) ----
// On Sunday, on the island, you can take Monday off (a vacation day) and stay another night: one more night at the cabin
// (if you haven't checked out) or with the friend who's hosting you. Monday you check out by 11 AM and take a boat home;
// the weekend ends when you're back on the mainland, and this week's own Friday rental is waiting as usual.
// State: REG().long = {wk: the week the weekend started, W: that weekend, rental: this week's fresh rental while you're away}
function regLongCan(){const R=REG(),V=VS(),Rn=vRental(),J=curJob();
  return regOn()&&!!J&&day()===6&&L[S.loc].side==='I'&&R.vac>0&&R.W.on&&!R.W.done&&!R.long&&J.days.includes(0)&&
    !R.vacDays[(regWk()+1)*7]&&regWk()<REG_WEEKS-1&&!!Rn&&!Rn.checkedOut&&(Rn.checkedIn||!!Rn.hosted)}
function regLongTake(){const R=REG(),V=VS(),Rn=vRental();if(!regLongCan())return;
  const cost=Rn.hosted?0:(V.rate||0);if(cost&&!canEssential(cost)){say('Your card won’t cover another night at the cabin.');return render()}
  R.vac--;R.vacDays[(regWk()+1)*7]=true;R.long={wk:regWk()};S.t+=5;phoneTick();
  if(cost){money(-cost);R.st.cabin=(R.st.cabin||0)+cost}
  Rn.out+=1440;                      // check-out moves to Monday 11 AM (rebased to the new week at the rollover)
  adj('stress',-4);
  say(`🏖️ You email the boss: Monday is a vacation day (${R.vac} left of ${REG_VAC}). ${Rn.hosted?`${Rn.hosted.name.split(',')[0]} says the spare room is yours another night.`:`One more night at the cabin: ${$(cost)}.`} Check-out is Monday at ${fmt(VCHECK_OUT)}.`);
  afterAction()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(regLongCan()){const Rn=vRental(),V=VS();a.push({cat:'phone',ic:'🏖️',l:`Take Monday off and stay another night (vacation day, ${REG().vac} left)`,
    s:Rn.hosted?'Paid day off. Your host has room. Back on Monday.':`Paid day off. One more night at the cabin: ${$(V.rate||0)}.`,fn:regLongTake})}
}catch(e){console.error(e)}return a}}
// the new week starts while you're still on the island: keep the weekend going, set this week's rental aside
{const _wi=regWeekInit;regWeekInit=function(){const R=REG(),V=VS();
  if(!R.long||R.long.wk!==regWk()-1)return _wi.apply(this,arguments);
  const W=R.W,Rn=V.rental;
  const r=_wi.apply(this,arguments);
  R.long.rental=V.rental;R.long.W=R.W;            // this week's fresh weekend, for after you get home
  R.W=W;V.rental=Rn;Rn.in-=7*1440;Rn.out-=7*1440;if(Rn.inAt!=null)Rn.inAt-=7*1440;
  V.last=0;                                       // check-out and the last boat are today (Monday)
  return r}}
// home on Monday: close the long weekend, then put this week's own weekend in place
{const _we=regWeekendEnd;regWeekendEnd=function(){const R=REG(),V=VS();const r=_we.apply(this,arguments);
  try{if(R.long&&R.long.W&&R.long.wk===regWk()-1){V.rental=R.long.rental;R.W=R.long.W;V.last=6;R.long=null}}catch(e){console.error(e)}return r}}
{const _t=regTick;regTick=function(){const R=REG();
  try{if(R.long&&R.long.W&&day()===0&&L[S.loc].side==='M'&&R.W.on&&!R.W.done){regWeekendEnd()}}catch(e){console.error(e)}
  return _t.apply(this,arguments)}}
