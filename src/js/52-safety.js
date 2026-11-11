// ---- 🛡️ "Are you sure?" prompts (52-safety.js) ----
// For choices that can't be undone and are likely mistakes: leaving your car behind, walking on after the last car boat, going to bed hungry
// when food is within reach, missing a visit's last boat home, buying the house in Weekend regular. Settings can turn them all off (pref safeOff).
const SAFE={skip:false};
const safeOn=()=>prefs().safeOff!==true;
function safeAsk(title,body,yes,fn){
  if(!safeOn()){fn();return}
  modal(title,body,[{l:'↩️ Go back',s:'Nothing changes.',fn:()=>{}},{l:yes,fn}]);
}
const safeSkip=f=>function(){SAFE.skip=true;try{return f.apply(this,arguments)}finally{SAFE.skip=false}};

// 1) walking on and leaving your car behind (and 2) after the last car sailing)
{const _w=waitFerry;waitFerry=function(mode){
  try{
    if(mode==='walk'&&!SAFE.skip&&safeOn()&&!S.over){
      const car=carHere(),side=L[S.loc].side;
      if(car&&car.fuel>=0.1&&canWalkCarry()&&!S.cars.some(c=>L[c.loc]&&L[c.loc].side!==side)&&!(typeof boatWaitingFar==='function'&&boatWaitingFar(side))&&!(typeof visitorOn==='function'&&visitorOn()&&VS().bike)){
        const kD=findNext(side,'drive',true),gone=!kD||kD.d>day(),there=side==='I'?'the mainland':'the island',where=L[S.loc].name.replace(' Ferry Terminal',' terminal').replace(' Ferry Landing',' landing');
        return safeAsk(gone?'🌙 The last car sailing has gone':'🚗 Leave your car behind?',
          `<p>${gone?'There are no more boats that take cars tonight. ':''}If you walk on, your car stays parked at the ${where}. You’d have no car on ${there}, and nothing there to get you around.</p><p>${gone?'The next car sailing is '+(kD?DAYS[kD.d]+' at '+fmt(kD.dep):'a way off')+'.':'Drive on instead if you’ll need the car.'}</p>`,
          'Walk on, leave the car',safeSkip(()=>_w.call(this,mode)));
      }}
  }catch(e){console.error(e)}
  return _w.apply(this,arguments)}}
// the "No more car sailings tonight" window already says it: its Walk on button is the confirmation
{const _m=modal;modal=function(title,body,btns,noClose){
  try{if(/No more car sailings tonight/.test(title)&&btns&&btns[0]&&!btns[0]._safe){const f=btns[0].fn;btns[0]._safe=1;btns[0].fn=safeSkip(f)}}catch(e){}
  return _m.apply(this,arguments)}}

// 3) travel: ride/walk/bus/hitch with a car here that could drive you, and a visit's last boat home
{const _g=go;go=function(dest,o){
  try{
    if(o&&!o._ok&&!o.midDone&&!o.started&&safeOn()&&!S.over&&L[dest]){
      const car=carHere(),from=S.loc,side=L[from].side,safeGo=()=>_g.call(this,dest,Object.assign({},o,{_ok:true}));
      if(car&&['ride','walk','bus','hitch'].includes(o.m)&&L[dest].side===side&&car.fuel>=fuelFor(car,dist(from,dest)||0)&&car.fuel>=0.1){
        return safeAsk('🚗 Leave your car behind?',`<p>Your car is right here with enough gas, and you’d go to ${L[dest].name} without it. It stays parked at ${L[from].name}, and you’ll need a way back to it.</p>`,'Go without the car',safeGo)}
      if(typeof visitorOn==='function'&&visitorOn()&&!regOn()&&vFinalDay()&&side==='I'&&L[dest].side==='I'){
        const last=lbLastSailing('I',day());
        if(last){const must=last.abs-20,toDock=a=>a==='aiDock'?0:(dist(a,'aiDock')||0);
          if(S.t+toDock(from)<=must&&S.t+(o.min||0)+toDock(dest)>must)
            return safeAsk('⛴️ You’d miss the last boat home',`<p>It’s the last day of your visit. The last boat off the island is the <b>${fmt(last.dep%1440)}</b> (be in line by ${fmt(must%1440)}). Going to ${L[dest].name} takes about ${o.min} minutes, and getting back to the landing takes longer. You’d be stuck on the island.</p>`,'Go anyway',safeGo)}}
    }
  }catch(e){console.error(e)}
  return _g.apply(this,arguments)}}

// 4) going to bed hungry, or sleeping through a visit's last boat
function safeFood(){
  if(S.pantry>0||(S.carried||0)>0||S.ateOut===day())return null;
  const o=[],m=tod(),here=L[S.loc].side;
  try{if(here==='I'&&L.food&&L.food.side==='I'&&S.money>=27&&isOpen('food',S.t+(dist(S.loc,'food')||0)+5))o.push('takeout at the Riv ($27)')}catch(e){}
  try{if(here==='I'&&typeof pantryOn==='function'&&pantryOn()&&pantryBroke()&&!pantryUsed()&&m+(dist(S.loc,'legion')||0)<PANTRY_OPEN[1]&&m>=PANTRY_OPEN[0])o.push('the Legion food pantry (free)')}catch(e){}
  try{if(here==='M'&&typeof regOn==='function'&&regOn()&&L.rmarket&&S.money>=20&&isOpen('rmarket',S.t+10))o.push('the supermarket near home')}catch(e){}
  return o.length?o:null;
}
function safeBoatLeft(){
  try{if(!visitorOn()||regOn()||!vFinalDay()||L[S.loc].side!=='I')return null;
    const last=lbLastSailing('I',day());return last&&S.t<last.abs?last:null}catch(e){return null}
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(!safeOn()||S.over)return a;
  a.forEach(x=>{
    if(!x.fn||x.dis)return;
    const bed=/^(Go to bed|Turn in early|Sleep in your own bed)/.test(x.l||''),camp=/^Sleep (in your car|on the bench)/.test(x.l||'')||bed,f=x.fn;
    if(!camp)return;
    x.fn=function(){
      const fo=bed?safeFood():null,bo=safeBoatLeft();
      const go2=()=>{ if(bo)return safeAsk('⛴️ Skip the last boat home?',`<p>It’s the last day of your visit. The last boat off the island is the <b>${fmt(bo.dep%1440)}</b>, and it hasn’t left yet. If you end the day here, you miss it.</p>`,'Stay on the island',()=>f.apply(this,arguments));return f.apply(this,arguments)};
      if(fo)return safeAsk('🍽️ Go to bed hungry?',`<p>The pantry is empty, so you’d go to bed hungry (health −15, stress +10). You can still get food: ${fo.join(', ')}.</p>`,'Go to bed hungry',go2);
      return go2()};
  });
}catch(e){console.error(e)}return a}}

// 5) buying the house (Weekend regular): it ends the month
if(typeof regBuy==='function'){const _b=regBuy;regBuy=function(){
  if(SAFE.skip||!safeOn()||S.over)return _b.apply(this,arguments);
  const self=this;
  return safeAsk('🏡 Buy the house?',`<p>You’d put <b>${$(regDown())}</b> down on the cedar house and move to the island for good. <b>That ends your month</b> and there’s no taking it back.</p>`,`Yes, buy it for ${$(regDown())}`,safeSkip(()=>_b.apply(self,[])))}}

// ⚙️ Settings row
{const _t=tutSettingRows;tutSettingRows=function(){
  return [{l:`🛡️ “Are you sure?” prompts: ${safeOn()?'On':'Off'}`,s:safeOn()?'Asks first before choices you can’t undo, like leaving your car behind or going to bed hungry. Tap to turn off.':'No confirmations. Tap to turn them back on.',fn:()=>{setPref('safeOff',safeOn());openSettings()}},..._t.apply(this,arguments)]}}
