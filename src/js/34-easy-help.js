// ---------------- 🌲 Easy-level helpers ----------------
// Everything here reads LV(): Normal and Hard have these at 0/1 so nothing below does anything for them.
// State (all lazy, so old saves load): S.shelter {d,coffee}, S.easyWarn [outage keys], S.easyLate {job:n}, S.wearCarry, S.shelterTxt.

// ---- A. the warming shelter at the Legion ----
let SHELTER_NOW=false;                       // true only while endDay() runs for a sheltered night
const shelterNow=()=>SHELTER_NOW;
// Would tonight be cold at home? An outage or gale night, no fueled generator, and (outside the gale) no firewood.
function shelterCold(d){
  if(!LV('shelter')||!S||!S.week)return false;
  const gale=!!stormNight(d),story=typeof siPowerTonight==='function'&&siPowerTonight(d);
  if(!gale&&!story&&!powerOut())return false;
  const fueled=genReady()&&S.homeGas>=(gale?3:2);
  const wood=(UP().wood||0)>0&&!gale;
  return !fueled&&!wood;
}
const shelterOn=()=>!!(LV('shelter')&&S.shelter&&S.shelter.d===day());
function shelterGo(){
  S.shelter={d:day(),coffee:false};S.loc='legion';S.t+=20;
  say('🇺🇸 You pull on your coat and walk over to the Legion hall. The post has opened it as a warming shelter: a roaring woodstove, folding cots along the wall, an urn of coffee, and Walt handing out blankets like a man who’s been waiting years for this.');
  afterAction();
}
function shelterSleep(){
  const text=S.loc==='legion';S.shelter=S.shelter||{d:day()};S.shelter.d=day();
  endDay(text?'legion':'home');
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(LV('shelter')){const d=day(),m=tod();
    if(S.loc==='home'&&m>=900&&shelterCold(d)){
      const i=a.findIndex(x=>/^Go to bed|^Turn in early/.test(x.l));
      const row={ic:'🇺🇸',l:'Go to the warming shelter at the Legion',s:'Easy: the Legion hall is open tonight with a woodstove, cots, and coffee. Warm, so no cold-night health damage. 20 minutes.',cls:'primary',fn:shelterGo};
      if(i>=0)a.splice(i,0,row);else a.push(row)}
    if(S.loc==='legion'&&shelterOn()){
      const C=S.shelter;
      a.push({ic:'☕',l:C.coffee?'Had your coffee ✓':'Coffee from the urn',s:C.coffee?'Strong and free.':'15 minutes by the woodstove. Stress −5.',dis:C.coffee,fn:()=>{C.coffee=true;S.t+=15;adj('stress',-5);say('☕ Burnt, hot and free. A man in a camouflage cap tells you the same story about the 1996 ice storm twice. You don’t mind.');afterAction()}});
      a.push({ic:'🛏️',l:m>=1080?'Sleep at the warming shelter':'Turn in early at the shelter',s:'Ends the day. Warm, outlets for your phone, and no cold night.',cls:m>=1260?'primary':'',fn:shelterSleep});
    }}
}catch(e){console.error(e)}return a}}
// an islander's text, once a day when a cold night is coming
phoneOnTime(()=>{try{if(!LV('shelter')||!S||!S.week||!phoneCan())return;const d=day();
  if(tod()<840||S.shelterTxt===dayKey()||!shelterCold(d))return;
  S.shelterTxt=dayKey();if(!S.friends.walt)meet('walt','Walt, from the Legion','he texted about the warming shelter');const id='walt';
  const x='Legion hall is open tonight as a warming shelter. Woodstove, cots, coffee, outlets. Come on over if the house gets cold. - Walt';
  {const T=msgPush(id,0,x);T.u++}
  phoneNotify('🇺🇸','Walt: warming shelter at the Legion','Open tonight. Woodstove, cots, coffee.');
  say('📱 🇺🇸 A text from Walt: “Legion hall is open tonight as a warming shelter. Woodstove, cots, coffee, outlets. Come on over.”')}catch(e){console.error(e)}});
{const _e=endDay;endDay=function(where){
  const dd=day();
  const sheltered=LV('shelter')&&S.shelter&&S.shelter.d===dd&&(where==='legion'||(where==='home'&&S.t>=dd*1440+1410));
  if(!sheltered&&where==='legion')where='motel';   // not a shelter night: the old rules
  if(!sheltered)return _e.apply(this,arguments);
  S.loc='home';SHELTER_NOW=true;
  try{_e.call(this,'home')}finally{SHELTER_NOW=false}
  if(S&&!S.over){S.phone=100;S.shelter=null;render()}};}
{const _u=upkeepNight;upkeepNight=function(where,notes,d){
  if(!SHELTER_NOW)return _u.apply(this,arguments);
  const r=_u.call(this,'legion',notes,d);
  notes.push('🇺🇸 You slept at the Legion warming shelter: warm, a cot, coffee in the morning, and your phone on the charger. The cold stayed outside.');
  return r}}

// ---- B. ferry warnings ----
phoneOnTime(()=>{try{const w=LV('ferryWarn');if(!w||!S||!S.week||!S.week.b||!phoneCan())return;
  const Wk=S.easyWarn=S.easyWarn||[],side=L[S.loc].side,d=day();
  for(const b of S.week.b){
    if(b.start<=S.t||b.start-S.t>w)continue;
    const key=`${S.weekNo}:${b.start}`;if(Wk.includes(key))continue;
    const hit=deps(side,d).some(dep=>{const s=sailing(side,d,dep,'walk',false);return s.cancel&&s.b===b&&s.abs>S.t-20});
    if(!hit)continue;
    Wk.push(key);if(Wk.length>24)Wk.splice(0,Wk.length-24);
    const cause=b.cause[0].toUpperCase()+b.cause.slice(1);
    phoneNotify('⛴️',`Ferry heads-up: sailings stop at ${fmt(b.start%1440)}`,cause);
    say(`📱 ⛴️ <b>Ferry heads-up</b> (${fmt(S.t)}): sailings are expected to be suspended at ${fmt(b.start%1440)} (${b.cause}). Easy mode: the county gave you ${Math.round(b.start-S.t)} minutes’ warning. Catch a boat now if you can.`);
  }}catch(e){console.error(e)}});

// ---- C. a forgiving job ----
{const _w=workActions;workActions=function(a,d,m){
  const n0=a.length;_w.apply(this,arguments);
  try{const G=LV('jobGrace'),J=curJob();if(!G||!J||!S.emp)return;
    const lateBy=Math.max(0,m-J.start);if(lateBy<=0)return;
    const exc=typeof weatherExcuse==='function'&&weatherExcuse(d);
    const pen=exc?(lateBy<=30?0:-3):(lateBy<=30?-4:-10);if(pen>=0)return;
    const L0=S.easyLate=S.easyLate||{},used=L0[S.emp]||0;if(used>=G)return;
    const left=G-used-1;
    for(let i=n0;i<a.length;i++){const x=a[i];if(!x||!x.fn||!/^Work/.test(x.l))continue;
      const f=x.fn;
      x.s=x.s.replace(/\(job −\d+/,`(Easy: forgiven, ${left} left`);
      x.fn=function(){L0[S.emp]=(L0[S.emp]||0)+1;GRACE_PEN=pen;try{return f.apply(this,arguments)}finally{GRACE_PEN=0}};
    }
  }catch(e){console.error(e)}}}
let GRACE_PEN=0;
// ---- C/E. adj(): the lateness penalty is refunded once, and the job can't hit zero in the first days at a job ----
{const _adj=adj;adj=function(k,v){
  if(k==='job'&&GRACE_PEN&&v<0){v-=GRACE_PEN;GRACE_PEN=0}
  const r=_adj.call(this,k,v);
  if(k==='job'&&S&&S.emp&&LV('firedGraceDays')>0&&S.job<1&&day()!==undefined&&dayKey()-(S.empStart||0)<LV('firedGraceDays'))S.job=1;
  return r}}
// ---- E. the house wears down more slowly (fractions carry over so it averages out) ----
{const _h=homeAdj;homeAdj=function(v){const w=LV('wear');
  if(w!==1&&v<0){const t=v*w+(S.wearCarry||0),n=Math.round(t);S.wearCarry=Math.round((t-n)*1000)/1000;v=n}
  return _h.call(this,v)}}
// nightly recovery (used by endDay in 06-day.js): ×LV('recover'), identity at 1
const nightRec=v=>Math.round(v*LV('recover'));
