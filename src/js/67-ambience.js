// ---------------- 🌲 ambience, part 2: wind, woodstove, frogs, the ferry horn, a quiet night ----------------
// Builds on the synthesized ambience in 18-polish.js (pref 'amb': off | low | med, silent when 🔊 Sound is off or the page is
// hidden; no audio files, nothing to download; every call is guarded so a browser without AudioContext just stays quiet).
// What you hear follows the season, the weather, the place and the time of day (ambScene → AMB.want):
//   wind     in a gale (strong), a breeze on fall/winter days          stove   at home when it's cool, evenings and mornings
//   frogs    Lake Josephine on spring evenings (a few at home)         night   after 10 PM: no gulls, a hushed forest
//   horn     a distant ferry horn when a crossing ends and now and then at the docks
{const sc0=ambScene;ambScene=function(){const w=sc0.apply(this,arguments);
  Object.assign(w,{wind:0,stove:0,frogs:0,night:false,horn:false});
  try{const inGame=S&&!S.over&&!document.querySelector('.title,.end')&&L[S.loc];if(!inGame)return w;
    const sea=typeof seasonId==='function'?seasonId():'fall',m=tod(),night=m>=1320||m<300,eve=m>=1020&&m<1380;
    let storm=false;try{const st=S.week.storm;storm=!!(st&&S.t>=st.start&&S.t<st.end)||(stormNight(day())&&m>=1080)}catch(e){}
    w.night=night;
    w.wind=storm?1:(sea==='fall'||sea==='winter')&&!night?0.18:0;
    if(night&&w.rain<0.5){w.forest*=0.35}
    if(night)w.gulls=false;
    const home=S.loc==='home',cool=sea!=='summer';
    w.stove=home&&cool&&(eve||m<540||(S.up&&S.up.burned===dayKey()))?(sea==='winter'?1:0.7):0;
    w.frogs=sea==='spring'&&eve?(S.loc==='lake'?1:home?0.3:0):0;
    w.horn=w.gulls;
  }catch(e){}
  return w}}
function ambHorn(v){if(!AMB.on||!AMB.master)return false;const a=AMB.ctx;if(!a)return false;
  try{const t=a.currentTime,g=a.createGain(),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;g.connect(lp).connect(AMB.master);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.22*(v||1),t+0.12);g.gain.setValueAtTime(0.22*(v||1),t+1.1);g.gain.exponentialRampToValueAtTime(0.0001,t+1.9);
    [110,138.6,220].forEach((f,i)=>{const o=a.createOscillator(),og=a.createGain();o.type=i<2?'triangle':'sine';o.frequency.value=f;og.gain.value=i<2?0.5:0.15;o.connect(og).connect(g);o.start(t);o.stop(t+2)});
    AMB.horns=(AMB.horns|0)+1;return true}catch(e){return false}}
function ambBurst(kind){const a=AMB.ctx;if(!a||!AMB.master)return;
  try{const t=a.currentTime;
    if(kind==='crackle'&&AMB.stoveG){const s=a.createBufferSource();s.buffer=ambNoise(a);const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200+ambRnd()*2500;const g=a.createGain();
      const d=0.015+ambRnd()*0.05,v=0.1+ambRnd()*0.35;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
      s.connect(hp).connect(g).connect(AMB.stoveG);s.start(t,ambRnd()*1.5,d+0.05);s.stop(t+d+0.06)}
    else if(kind==='frog'&&AMB.frogG){const f=1900+ambRnd()*900,n=3+Math.floor(ambRnd()*6),step=0.055+ambRnd()*0.03,o=a.createOscillator(),g=a.createGain();
      o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0.0001,t);
      for(let i=0;i<n;i++){const u=t+i*step;g.gain.setValueAtTime(0.0001,u);g.gain.exponentialRampToValueAtTime(0.5,u+0.012);g.gain.exponentialRampToValueAtTime(0.0001,u+step*0.8);o.frequency.setValueAtTime(f*(1+0.04*(i%2)),u)}
      o.connect(g).connect(AMB.frogG);o.start(t);o.stop(t+n*step+0.1)}
  }catch(e){}}
function ambLoop2(){clearTimeout(AMB.x2T);AMB.x2T=null;if(!AMB.on)return;
  const w=AMB.want||{};
  AMB.x2T=setTimeout(()=>{if(!AMB.on)return;const w=AMB.want||{};
    if(w.stove>0&&ambRnd()<0.75)ambBurst('crackle');
    if(w.frogs>0&&ambRnd()<0.35*w.frogs+0.05)ambBurst('frog');
    if(w.horn&&ambRnd()<0.006)ambHorn(0.5);
    ambLoop2()},w.stove>0?110+ambRnd()*260:170+ambRnd()*300)}
{const st0=ambStart;ambStart=function(){const ok=st0.apply(this,arguments);if(!ok)return ok;
  try{const a=AMB.ctx,m=AMB.master;
    const wg=a.createGain();wg.gain.value=0;wg.connect(m);const wf=a.createBiquadFilter();wf.type='bandpass';wf.frequency.value=650;wf.Q.value=0.6;wf.connect(wg);ambLoop(a,wf,0.7);
    const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=0.13;lg.gain.value=260;lfo.connect(lg).connect(wf.frequency);lfo.start();AMB.srcs.push(lfo);AMB.wind=wg;
    AMB.stoveG=a.createGain();AMB.stoveG.gain.value=0;AMB.stoveG.connect(m);
    AMB.frogG=a.createGain();AMB.frogG.gain.value=0;AMB.frogG.connect(m);
    ambLoop2()}catch(e){console.error(e)}
  return ok}}
{const sp0=ambStop;ambStop=function(){clearTimeout(AMB.x2T);AMB.x2T=null;try{AMB.wind=AMB.stoveG=AMB.frogG=null}catch(e){}return sp0.apply(this,arguments)}}
{const up0=ambUpdate;ambUpdate=function(){const r=up0.apply(this,arguments);
  try{if(AMB.on&&AMB.master&&AMB.wind){const w=AMB.want;ambSet(AMB.wind.gain,w.wind*0.45);ambSet(AMB.stoveG.gain,w.stove*0.9);ambSet(AMB.frogG.gain,w.frogs*0.12);
    if(w.night)ambSet(AMB.gull.gain,0);if(!AMB.x2T)ambLoop2()}}catch(e){}
  return r};window.ambUpdate=ambUpdate}
// a distant horn when the boat comes in
{const c0=crossing;crossing=function(side,cap,cap2,done,sail){
  return c0.call(this,side,cap,cap2,function(){try{if(!sail)ambHorn(0.8)}catch(e){}return done.apply(this,arguments)},sail)}}
{const _s=ambState;ambState=function(){const o=_s.apply(this,arguments);return Object.assign(o,{horns:AMB.horns|0,wind:!!AMB.wind,layers:!!(AMB.stoveG&&AMB.frogG)})};window.ambState=ambState}
function ambSettingBtn(){const v=ambPref(),on=prefs().sound;
  return {l:`🌧️ Ambient sound: ${AMB_TXT[v]}`,s:on?'Rain, wind in storms, gulls and the ferry horn at the docks, a crackling woodstove at home when it’s cool, frogs at Lake Josephine on spring evenings, a hushed night. Tap to cycle Off → Low → Medium.':'Turn 🔊 Sound on to hear it. Tap to cycle Off → Low → Medium.',
    fn:()=>{setPref('amb',AMB_NEXT[v]);openSettings()}}}
