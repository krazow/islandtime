// ---- ⛴️ Start a new game: one button on the title screen, then pick the game mode (84-new-game.js) ----
// Replaces "Start a new week" / "Start Monday". Each mode goes on to its own questions (length, season, home city, difficulty).
window.startRegular=()=>{const go=()=>visitHomeModal(home=>diffModal(k=>{S=null;visitorNew('regular',home,k);tab='act';render()}));
  if(!profileName())nameModal({first:true,then:go});else go()};
function newGameModal(){
  const has=f=>typeof window[f]==='function'||typeof globalThis[f]==='function';
  const opts=[
    {l:'🏝️ Live on the island',s:'Work in Lakewood, keep food in the pantry and gas in the car. A week, a month, or a whole year in story mode.',fn:()=>startNewWeek()},
    {l:'🧳 Visit the island',s:'A day trip, a weekend or a week from Seattle, Tacoma or Olympia. See the sights and catch the last boat home.',fn:()=>startVisit()},
    {l:'🏙️ Weekend regular',s:'A month with a city job, every weekend on the island. Save up and you might move over.',fn:()=>startRegular()}];
  if(has('chStartModal'))opts.push({l:'🏆 Weekly challenge',s:'The same week for everyone. Share your code and compare scores.',fn:()=>chStartModal()});
  if(has('dailyStartModal'))opts.push({l:'☀️ Daily challenge',s:'Today’s one-day game, the same for everyone.',fn:()=>dailyStartModal()});
  opts.push({l:'Never mind',fn:()=>{}});
  const d=loadSave();
  modal('⛴️ Start a new game',`<p>Choose how you want to play.${d?' Your saved game stays in its save slot; a new game uses the current slot.':''}</p>`,opts);
}
window.newGameModal=newGameModal;
// the title-screen button(s): "Start a new game", and the separate Visit button goes (it's one of the modes now)
function ngTitle(){const t=document.querySelector('.title .body');if(!t)return;
  t.querySelectorAll('button[onclick="startNewWeek()"]').forEach(b=>{b.setAttribute('onclick','newGameModal()');b.textContent=b.classList.contains('big')?'Start a new game ⛴️':'⛴️ Start a new game'});
  const v=t.querySelector('#visitBtn');if(v)v.remove()}
{const _ts=titleScreen;titleScreen=function(){const r=_ts.apply(this,arguments);try{ngTitle()}catch(e){console.error(e)}return r}}
ngTitle();
