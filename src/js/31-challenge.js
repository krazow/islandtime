// ---------------- weekly challenge: one seeded week everybody plays ----------------
// API (the challenge UI codes against these names):
//   challengeWeekId(date)  ISO week id, Monday-based, local time: '2026-W46'
//   challengeSpec(id)      {id,seed,season,diff:'normal',mode:'week'}
//   challengeStart(id)     starts that week, sets S.challenge={id,seed,season,diff}, returns it
//   challengeOn()          is the current game a challenge?
//   challengeResult()      {id,score,money,grade,title,workdays,stranded,rep,over,lost}: the end-screen numbers
//
// Determinism. While a challenge game is running (S.challenge set, game not over), Math.random is replaced by
// chRand(), a mulberry32 PRNG whose stream is chosen by a key and reseeded from hash(seed|key) whenever the key changes:
//   'init'            the starting state (baseState: the house's starting condition)
//   'week:<n>'        genWeek(): ferry breakdowns, fog, storm, the week's prices and news, the season's week plan
//   'day:<dayKey>'    startDay(): the morning's rolls (injury, flavor text)
//   'night:<dayKey>'  endDay(): the night's rolls (storm outage chain, slept-through alarm, co-op town pledges, wake time away)
//   'dale:<day>'      Dale's daily diesel/gas stock
//   't:<week>:<S.t>'  everything else: each roll is keyed by the game clock minute it happens at
// Guarantee: the starting state and the week plan (breakdowns, weather, storm, prices, news, bingo night) are identical
// for every player of the same id, whatever they do. Mornings, nights and Dale's stock draw from per-day streams, so
// they don't depend on how many rolls happened earlier that day. Any other roll (ferry full, island events, phone
// messages…) is keyed by the minute it happens at: players who do the same thing at the same time get the same roll.
// Limits: rolls still depend on the game state (an event that only fires at home only rolls if you're home), and two
// different actions at the same minute share that minute's stream, so their order matters. The stream position is
// saved in S.chRng, so a save/reload doesn't change what comes next.
// The real Math.random (whatever it was when the challenge began) comes back when the challenge game ends, or when
// a normal game is started or loaded (chSync); chRand also hands it back by itself if it's called outside a challenge.
const CH={real:null,lock:[],pending:null};
const CH_SEAS=['fall','winter','spring','summer'];
function chHash(s){let h=0x811c9dc5;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}
  h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0}
function chActive(){return typeof S!=='undefined'&&!!S&&!!S.challenge&&!S.over}
function chRand(){
  if(!chActive()){chSync();return (CH.real||Math.random)()}
  const R=S.chRng||(S.chRng={k:null,a:0}),L_=CH.lock;
  const k=L_.length?L_[L_.length-1].k:'t:'+(S.weekNo|0)+':'+S.t;
  if(R.k!==k){R.k=k;R.a=chHash(S.challenge.seed+'|'+k)}
  R.a=(R.a+0x6D2B79F5)>>>0;let t=R.a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;
}
// Install or remove the seeded Math.random to match the current game.
function chSync(){
  const on=chActive();
  if(on&&Math.random!==chRand){CH.real=Math.random;Math.random=chRand;CH.lock=[]}
  else if(!on&&Math.random===chRand){Math.random=CH.real;CH.lock=[]}
}
// Run fn on its own stream (no-op outside a challenge). The clock stream picks up where it was afterwards.
function chWith(key,fn){
  if(!chActive()||Math.random!==chRand)return fn();
  const R=S.chRng||(S.chRng={k:null,a:0});CH.lock.push({k:key,k0:R.k,a0:R.a});
  try{return fn()}finally{const e=CH.lock.pop();if(S&&S.chRng&&e){S.chRng.k=e.k0;S.chRng.a=e.a0}}
}
// newGame()'s fresh state. A pending challenge (set by challengeStart) builds it on the 'init' stream (the house's
// starting condition is random), so S.challenge is set before genWeek runs; a normal new game turns the seeding off.
function chBase(){
  const p=CH.pending;CH.pending=null;
  if(!p){S=null;chSync();return baseState()}
  S={challenge:p,chRng:{k:null,a:0},weekNo:0,t:330,over:false};chSync();
  const st=chWith('init',()=>baseState());st.challenge=p;st.chRng=S.chRng;return st;
}
// streams for the week plan, mornings and nights
{const wrap=(f,key)=>function(){return chWith(key(),()=>f.apply(this,arguments))};
  genWeek=wrap(genWeek,()=>'week:'+((S&&S.weekNo)||0));
  startDay=wrap(startDay,()=>'day:'+dayKey());
  endDay=wrap(endDay,()=>'night:'+dayKey());}

// ISO week (Monday start, week 1 holds the year's first Thursday) of the local calendar date
function challengeWeekId(date=new Date()){
  const t=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/864e5,dow=(new Date(t*864e5).getUTCDay()+6)%7,thu=t-dow+3;
  const y=new Date(thu*864e5).getUTCFullYear(),w=1+Math.floor((thu-Date.UTC(y,0,1)/864e5)/7);
  return y+'-W'+String(w).padStart(2,'0');
}
// Monday of an ISO week id, in days since 1970-01-01 (null if it isn't one)
function chMonday(id){const m=/^(\d{4})-W(\d{2})$/.exec(String(id||''));if(!m)return null;const y=+m[1],w=+m[2];if(w<1||w>53)return null;
  const j4=Date.UTC(y,0,4)/864e5,dow=(new Date(j4*864e5).getUTCDay()+6)%7;return j4-dow+(w-1)*7}
function challengeSpec(id){
  id=String(id||challengeWeekId());const mon=chMonday(id);
  // weeks since the Monday 1970-01-05, so the rotation runs straight across new year
  let season=mon==null?'fall':CH_SEAS[(((mon-4)/7)%4+4)%4];
  if(typeof seasonOk==='function'&&!seasonOk(season))season='fall';
  return {id,seed:chHash('islandtime-challenge|'+id),season,diff:'normal',mode:'week'};
}
function challengeStart(id=challengeWeekId()){
  const sp=challengeSpec(id);
  CH.pending={id:sp.id,seed:sp.seed,season:sp.season,diff:sp.diff};
  try{newGame(sp.diff,sp.mode,sp.season)}finally{CH.pending=null}
  return S.challenge;
}
function challengeOn(){return typeof S!=='undefined'&&!!S&&!!S.challenge}
function challengeResult(){
  if(!challengeOn())return null;
  const E=S.ending,sc=E?E.score:scoreOf(),g=E?[E.grade,E.title]:gradeOf(sc);
  return {id:S.challenge.id,score:sc,money:Math.round(S.money),grade:g[0],title:g[1],workdays:S.stats.workdays||0,
    stranded:S.stats.stranded||0,rep:repVal(),over:!!S.over,lost:!!(E&&E.lost)};
}
