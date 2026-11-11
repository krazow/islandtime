// ---- 📅 Weekend regular: the island gets to know you at its own pace ----
// In a Weekend regular month, island reputation can rise at most REG_REP_WEEK points a week (helping out, dinners, friend
// stories, moments, houseguest manners all count). Losses are never capped. Reaching the goal's 40 therefore takes about three
// weekends however busy you are, and new ways to earn reputation can't make the month trivial.
const REG_REP_WEEK=15;
{const _v=vrepAdd;vrepAdd=function(n,why){
  try{if(typeof regOn==='function'&&regOn()&&n>0){const R=REG(),wk=regWk();
    if(!R.repWk||R.repWk.wk!==wk)R.repWk={wk,got:0,told:false};
    const room=REG_REP_WEEK-R.repWk.got;
    if(room<=0){if(!R.repWk.told){R.repWk.told=true;say('🤲 People noticed. Islanders are slow to warm up, though: that’s as far as this week takes you.')}return 0}
    n=Math.min(n,room);const d=_v.call(this,n,why);if(d>0)R.repWk.got+=d;return d}}catch(e){console.error(e)}
  return _v.apply(this,arguments)}}
