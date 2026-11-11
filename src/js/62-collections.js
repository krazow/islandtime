// ---- 📒 collections across games: a photo album, a crossing log and an island bingo card ----
// Stored in localStorage under 'islandtime.collections', so they survive new games, save slots, deletes and the end of a week (they are not part of any save).
// Shape: {v:1, photos:[{k,ic,t,n,src,at,sea,when}], cross:{n,first,best,bestAt,recent:[{at,to}],ms:[milestones reached]}, bingo:{squareId:{at}}, met:{id:true}}
// API: colGet() · colPhotoAdd(p) · colCross(to) · colBingoMark(id) · colLines() · COL_SQUARES · colPhotos() · colStats()
// Feeds (all wrappers, nothing in the core files changed): ferry arrivals → crossings; event history → squares; afterAction → state squares;
//   meet/friendPts → friends squares; vPhoto (visitor sights) and the new moments/stories → the album.
const COL_KEY='islandtime.collections', COL_PHOTO_CAP=200;
const COL_MS=[10,25,50,100,200,300,400,500,600,700,800,900,1000];
// 25 squares: 5 rows of 5 (nature · sky and weather · the ferry · community · people and places)
const COL_SQUARES=[
  {id:'orcas',ic:'🐋',t:'Orcas',d:'See orcas from the ferry.'},{id:'eagles',ic:'🦅',t:'Eagles',d:'Watch eagles at the lake, the dock or on the road.'},{id:'fawn',ic:'🦌',t:'Fawn',d:'Meet a deer on the road, or a doe and her fawn.'},{id:'sea_lion',ic:'🦭',t:'Sea lion',d:'Find a sea lion on the dock.'},{id:'rainier',ic:'🏔️',t:'Rainier',d:'See the mountain come out.'},
  {id:'rainbow',ic:'🌈',t:'Rainbow',d:'See a double rainbow over the Sound.'},{id:'fog',ic:'🌫️',t:'Foghorn',d:'Hear the ferry’s horn in thick fog.'},{id:'king_tide',ic:'🌊',t:'King tide',d:'Meet a king tide over the road.'},{id:'storm',ic:'⛈️',t:'Storm',d:'Survive a night of gale-force wind.'},{id:'outage',ic:'🔦',t:'Power out',d:'Live through a power outage.'},
  {id:'first_ride',ic:'⛴️',t:'First ride',d:'Ride the ferry once.'},{id:'last_boat',ic:'🌙',t:'Last boat',d:'Catch the last boat home, after 10:30 PM.'},{id:'rides_10',ic:'🔟',t:'10 rides',d:'Ride the ferry 10 times, in all your games.'},{id:'rides_100',ic:'💯',t:'100 rides',d:'Ride the ferry 100 times, in all your games.'},{id:'terminal',ic:'🪑',t:'Terminal night',d:'Spend a stranded night at the Steilacoom terminal.'},
  {id:'bingo_attend',ic:'🎱',t:'Bingo night',d:'Play bingo at the Riv.'},{id:'bingo_win',ic:'🏆',t:'Bingo win',d:'Win money at bingo.'},{id:'potluck',ic:'🕯️',t:'Potluck',d:'Go to a potluck during a power outage.'},{id:'lost_dog',ic:'🐶',t:'Lost dog',d:'Help look for a neighbor’s lost dog.'},{id:'lemonade',ic:'🍋',t:'Lemonade',d:'Buy lemonade from a kid at the road.'},
  {id:'five_friends',ic:'🤝',t:'Five friends',d:'Meet Walt, Sam, Bev, Rusty and the Hendersons (in any games).'},{id:'story_done',ic:'📖',t:'Story told',d:'See one of your friends’ stories through to the end.'},{id:'close_friend',ic:'💛',t:'Close friend',d:'Become a close friend of someone on the island.'},{id:'riv_dinner',ic:'🍔',t:'Dinner at the Riv',d:'Eat dinner at the Riv.'},{id:'farm',ic:'🚜',t:'Johnson Farm',d:'Visit the Johnson Farm museum.'}];
const COL_EVENTS={mo_orcas:'orcas',mo_eagles:'eagles',eagle:'eagles',mo_fawn:'fawn',deer:'fawn',mo_sea_lion:'sea_lion',mo_rainier:'rainier',mo_rainbow:'rainbow',mo_fog_horn:'fog',mo_king_tide:'king_tide',power_outage:'outage',mo_potluck:'potluck',mo_lost_dog:'lost_dog',mo_lemonade:'lemonade'};
const COL_FIVE=['walt','sam','bev','rusty','hendersons'];
let colRaw=null,colCache=null;
function colNorm(o){o=o&&typeof o==='object'&&!Array.isArray(o)?o:{};
  if(!Array.isArray(o.photos))o.photos=[];if(!o.cross||typeof o.cross!=='object')o.cross={};const X=o.cross;
  X.n=Math.max(0,X.n|0);if(!X.first)X.first=null;X.best=Math.max(0,X.best|0);if(!X.bestAt)X.bestAt=null;if(!Array.isArray(X.recent))X.recent=[];if(!Array.isArray(X.ms))X.ms=[];
  if(!o.bingo||typeof o.bingo!=='object'||Array.isArray(o.bingo))o.bingo={};if(!o.met||typeof o.met!=='object'||Array.isArray(o.met))o.met={};o.v=1;return o}
function colGet(){let raw=null;try{raw=localStorage.getItem(COL_KEY)}catch(e){}
  if(colCache&&raw===colRaw)return colCache;let o=null;try{o=raw?JSON.parse(raw):null}catch(e){}colCache=colNorm(o);colRaw=raw;return colCache}
function colPut(c){let s;try{s=JSON.stringify(c)}catch(e){return false}try{localStorage.setItem(COL_KEY,s);colRaw=s;colCache=c;return true}catch(e){colCache=c;colRaw=null;return false}}
const colDate=iso=>{try{return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}catch(e){return ''}};
const colToday=()=>new Date().toISOString();

// ---- the photo album ----
function colPhotoAdd(p){if(!p||!p.t)return false;const c=colGet();
  let sea='',when='';try{if(S){sea=seasonId();when=`${DAYS[day()]} ${fmt(S.t)}`}}catch(e){}
  c.photos.push({k:String(p.k||p.t),ic:p.ic||'📸',t:String(p.t),n:String(p.n||''),src:p.src||'photo',at:colToday(),sea,when});
  if(c.photos.length>COL_PHOTO_CAP)c.photos.splice(0,c.photos.length-COL_PHOTO_CAP);
  colPut(c);return true}
const colPhotos=()=>colGet().photos;

// ---- the crossing log ----
function colCross(to){const c=colGet(),X=c.cross;X.n++;const now=colToday();if(!X.first)X.first=now;
  X.recent.unshift({at:now,to:to==='I'?'I':'M'});X.recent=X.recent.slice(0,8);
  if(S){const dk=dayKey();if(!S.colDay||S.colDay.k!==dk)S.colDay={k:dk,n:0};S.colDay.n++;if(S.colDay.n>X.best){X.best=S.colDay.n;X.bestAt=now}}
  const hit=COL_MS.filter(m=>X.n>=m&&!X.ms.includes(m));hit.forEach(m=>X.ms.push(m));colPut(c);
  hit.forEach(m=>{try{showTile(m>=100?'💯':'⛴️',`${m} ferry rides`,m>=100?'A hundred crossings. You’re practically crew.':'A milestone in your crossing log.','good');if(S&&!S.over)say(`⛴️ Crossing log: <b>${m} ferry rides</b>${m>=100?' 💯':''}.`)}catch(e){}});
  colBingoMark('first_ride');if(X.n>=10)colBingoMark('rides_10');if(X.n>=100)colBingoMark('rides_100');
  return X.n}

// ---- the island bingo card ----
function colLines(c){c=c||colGet();const on=i=>!!c.bingo[COL_SQUARES[i].id],L=[];
  for(let r=0;r<5;r++){if([0,1,2,3,4].every(k=>on(r*5+k)))L.push('row'+r);if([0,1,2,3,4].every(k=>on(k*5+r)))L.push('col'+r)}
  if([0,1,2,3,4].every(k=>on(k*6)))L.push('d1');if([0,1,2,3,4].every(k=>on(k*4+4)))L.push('d2');return L}
function colBingoMark(id){const sq=COL_SQUARES.find(s=>s.id===id);if(!sq)return false;const c=colGet();if(c.bingo[id])return false;
  const before=colLines(c).length;c.bingo[id]={at:colToday()};colPut(c);const n=Object.keys(c.bingo).length,lines=colLines(c).length;
  try{if(S&&!S.over){showTile('🎱',`Island bingo: ${sq.t}`,`Square ${n} of 25 on your card`,'good');
    if(lines>before)setTimeout(()=>{try{showTile('🎉',n===25?'BLACKOUT! The whole card':'BINGO!','A line on your island bingo card','good')}catch(e){}},400)}}catch(e){}
  return true}
const colStats=()=>{const c=colGet();return {photos:c.photos.length,cross:c.cross.n,squares:Object.keys(c.bingo).length,lines:colLines(c).length}};

// ---- wiring ----
{const _f=fireHook;fireHook=function(hook,ctx){const n0=S&&S.ev&&S.ev.history?S.ev.history.length:0;
  try{if(hook==='arrive'&&ctx&&ctx.from==='ferry'){colCross(ctx.at==='aiDock'?'I':'M');
      if(ctx.at==='aiDock'&&tod()>=1350)colBingoMark('last_boat')}
    if(hook==='night'&&typeof stormNight==='function'&&S.week&&stormNight(day()))colBingoMark('storm')}catch(e){console.error(e)}
  const r=_f.apply(this,arguments);
  try{if(S&&S.ev&&S.ev.history)for(const h of S.ev.history.slice(n0)){const q=COL_EVENTS[h.id];if(q)colBingoMark(q)}}catch(e){console.error(e)}
  return r}}
{const _a=afterAction;afterAction=function(){try{if(S&&!S.over){const B=S.bingo||{};if(B.nights>0)colBingoMark('bingo_attend');if(B.won>0)colBingoMark('bingo_win');
  if(typeof powerOut==='function'&&powerOut())colBingoMark('outage');
  if(S.loc==='food'&&S.ateOut===day())colBingoMark('riv_dinner');if(S.loc==='farm')colBingoMark('farm');
  if(S.friends&&Object.values(S.friends).some(f=>(f.lvl||1)>=3))colBingoMark('close_friend')}}catch(e){console.error(e)}
  return _a.apply(this,arguments)}}
{const _e=endDay;endDay=function(where){try{if(where==='terminal')colBingoMark('terminal')}catch(e){}return _e.apply(this,arguments)}}
function colMet(){try{const c=colGet();let ch=false;for(const id of COL_FIVE)if(S.friends&&S.friends[id]&&!c.met[id]){c.met[id]=true;ch=true}
  if(ch)colPut(c);if(COL_FIVE.every(id=>c.met[id]))colBingoMark('five_friends')}catch(e){console.error(e)}}
{const _m=meet;meet=function(){const r=_m.apply(this,arguments);colMet();return r}}
{const _p=friendPts;friendPts=function(id){const r=_p.apply(this,arguments);try{if(flv(id)>=3)colBingoMark('close_friend')}catch(e){}return r}}
// visitor sights: each photo goes into the album
if(typeof vPhoto==='function'){const _v=vPhoto;vPhoto=function(s){const r=_v.apply(this,arguments);try{const v=VS(),great=v.photoQ&&v.photoQ[s.id]===2;
  colPhotoAdd({k:'sight_'+s.id+'@'+S.t,ic:s.ic,t:s.n,n:great?(V_PHOTO[s.id]&&V_PHOTO[s.id].why||'At just the right moment'):'A fine photo from the visit',src:'sight'});
  }catch(e){console.error(e)}return r}}
