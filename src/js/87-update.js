// ---- ⬆️ Updates for copies that can't update themselves (87-update.js) ----
// The website (and the app installed from it) is always the latest version. Two copies are not:
//   • the Windows app, which the launcher opens from the files it installed (…/game/index.html?app=win)
//   • the single-file offline version (Island-Time-offline.html)
// On a file:// copy, when online, the game reads version.json from the website (written by tools/build.py at every build).
//   Windows app online  → hand over to the live website in the same window, bringing every saved game, setting and badge
//                         along once (in the URL fragment, which never leaves the computer). The launcher keeps the
//                         installed copy current in the background for offline play (windows/launcher).
//   offline file, or the hand-over isn't possible → "Island Time X is out" with a download button, Later, and Skip this version.
// The hand-over arrives at the website as #itmove=…, which importMoved() reads. Settings has "⬆️ Check for updates: On/Off".
const UPD_SITE='https://krazow.github.io/islandtime/', UPD_URL=UPD_SITE+'version.json';
const UPD_SKIP='islandtime.updSkip', UPD_LATER='islandtime.updLater', UPD_MOVED='islandtime.movedToWeb', UPD_PREF='islandtime.updCheck';
const UPD_MAXHASH=1500000;   // stay under browsers' URL limits; bigger hand-overs fall back to the download notice
const updLocal=()=>location.protocol==='file:';
const updWin=()=>/[?&]app=win\b/.test(location.search);
const updOn=()=>{try{return localStorage.getItem(UPD_PREF)!=='off'}catch(e){return true}};
let updInfo=null, updAsked=false;
async function updFetch(){
  if(!updLocal()||typeof fetch!=='function')return null;
  try{const ctl=typeof AbortController==='function'?new AbortController():null,tm=setTimeout(()=>ctl&&ctl.abort(),4000);
    const r=await fetch(UPD_URL+'?t='+Date.now(),{cache:'no-store',signal:ctl&&ctl.signal});clearTimeout(tm);
    if(!r.ok)return null;const j=await r.json();return j&&typeof j.version==='string'?j:null}catch(e){return null}}
// every key the game keeps, for the one-time move to the website
function updPack(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&/^islandtime/i.test(k)&&k!==UPD_MOVED)o[k]=localStorage.getItem(k)}}catch(e){}return o}
const updB64=s=>btoa(unescape(encodeURIComponent(s))), updUnB64=s=>decodeURIComponent(escape(atob(s)));
function updHandOver(){let hash='';
  try{if(localStorage.getItem(UPD_MOVED)!=='1'){const data=updPack();if(Object.keys(data).length){hash='#itmove='+updB64(JSON.stringify({v:1,from:APP_VERSION,data}));
      if(hash.length>UPD_MAXHASH)return false}}}catch(e){return false}
  try{saveGame()}catch(e){}
  try{if(hash)localStorage.setItem(UPD_MOVED,'1')}catch(e){}
  location.replace(UPD_SITE+'?app=win'+hash);return true}
// the website side: take in what the Windows app brought. Nothing already here is overwritten; a save that would land
// on a slot in use goes to a free slot of the same group (Islander 1-3, Visitor 4-6), or is kept aside if there's none.
function importMoved(){const m=/#itmove=([^&]+)/.exec(location.hash||'');if(!m)return null;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  let d=null;try{d=JSON.parse(updUnB64(m[1]))}catch(e){return {err:true}}
  if(!d||typeof d.data!=='object')return {err:true};
  const ls=store();if(!ls)return {err:true};
  const slotOf=k=>k===SAVE_KEY||LEGACY_KEYS.includes(k)?1:(/^islandtime\.save\.slot(\d)$/.exec(k)||[])[1]|0;
  let saves=0,kept=0,aside=0;const best={},used=[];
  for(const k in d.data){const v=d.data[k];if(typeof v!=='string')continue;const n=slotOf(k);
    if(!n){if(ls.getItem(k)==null){ls.setItem(k,v);kept++}continue}
    let at=0;try{at=JSON.parse(v).at||0}catch(e){}if(!best[n]||at>best[n].at)best[n]={v,at}}   // slot 1 has mirror keys: keep the newest
  for(const n of Object.keys(best).map(Number).sort()){const v=best[n].v;
    let to=rawSave(n)||used.includes(n)?(n>=4?[4,5,6]:[1,2,3]).find(x=>!rawSave(x)&&!used.includes(x))||0:n;
    if(to){used.push(to);slotKeys(to).forEach(x=>ls.setItem(x,v));saves++}else{ls.setItem('islandtime.save.moved.slot'+n,v);aside++}}
  return {saves,kept,aside,from:d.from}}
function updNotice(j){if(updAsked||!j||verCmp(j.version,APP_VERSION)<=0)return;
  let skip=null,later=0;try{skip=localStorage.getItem(UPD_SKIP);later=+localStorage.getItem(UPD_LATER)||0}catch(e){}
  if(skip===j.version||Date.now()<later)return;
  updAsked=true;const win=updWin(),url=win?(j.installer||UPD_SITE+'install.html'):(j.offline||UPD_SITE+'install.html');
  modal('⬆️ A new version of Island Time',`<p><b>Island Time ${esc(j.version)}</b> is out${j.title?`: ${esc(j.title)}`:''}. You have ${esc(APP_VERSION)}.</p>
    <p>${win?'Download and run the new installer. It installs over this one and <b>keeps your saved games</b> (don’t uninstall first).':'Download the new file and <b>save it over this one</b>, in the same place, so your saved games stay with it. To be safe, copy each game first with 🔁 Transfer a saved game.'}</p>
    <p style="font-size:13px;color:var(--mute)">Or play the latest version any time at <a href="${UPD_SITE}" target="_blank" rel="noopener">krazow.github.io/islandtime</a>.</p>`,[
    {l:`⬇️ Download ${esc(j.version)}`,s:win?'Island-Time-Setup.exe':'Island-Time-offline.html',fn:()=>{try{window.open(url,'_blank','noopener')}catch(e){location.href=url}}},
    {l:'Later',s:'Ask again tomorrow.',fn:()=>{try{localStorage.setItem(UPD_LATER,String(Date.now()+864e5))}catch(e){}}},
    {l:'Skip this version',s:`Don’t ask about ${esc(j.version)} again.`,fn:()=>{try{localStorage.setItem(UPD_SKIP,j.version)}catch(e){}}}])}
async function updCheck(){if(!updLocal()||!updOn())return;
  const j=await updFetch();updInfo=j;if(!j)return;
  if(updWin()&&!(typeof S!=='undefined'&&S&&!S.over)&&updHandOver())return;   // the Windows app: on to the website (only from the title, never mid-game)
  if(document.querySelector('.title'))updNotice(j)}
window.updCheck=updCheck;window.importMoved=importMoved;
// Settings: ⬆️ Check for updates (only shown where it does something: a downloaded copy)
{const _o=openSettings;openSettings=function(){const r=_o.apply(this,arguments);try{if(!updLocal())return r;const b=document.querySelector('#mbg .modal');if(!b)return r;
  const close=[...b.querySelectorAll('button.act')].find(x=>/^Close$/.test(x.textContent.trim()));if(!close)return r;
  const n=document.createElement('button');n.className='act';n.id='updPref';n.innerHTML=`<span class="tx"><b>⬆️ Check for updates: ${updOn()?'On':'Off'}</b><span>${updOn()?'When you start, see if a newer version is out. Tap to turn off.':'Off. Tap to check for new versions again.'}</span></span>`;
  n.onclick=()=>{try{localStorage.setItem(UPD_PREF,updOn()?'off':'on')}catch(e){}const el=document.getElementById('mbg');if(el)el.remove();openSettings()};
  close.parentNode.insertBefore(n,close)}catch(e){console.error(e)}return r}}
// at load: bring in a hand-over, then check
{const r=importMoved();if(r)setTimeout(()=>{titleScreen();
  if(r.err)return modal('⚠️ Couldn’t bring your games over','<p>The Windows app tried to bring your saved games to the website version, but they couldn’t be read. They’re still in the app’s offline copy: use 🔁 Transfer a saved game there to move them.</p>',[{l:'OK',fn:()=>{}}]);
  if(r.saves||r.aside)modal('🧳 Your games came along',`<p>The Island Time app now opens the latest version from the website when you’re online. ${r.saves?`<b>${r.saves} saved game${r.saves>1?'s':''}</b> moved over, with your name, settings and badges.`:''}${r.aside?` ${r.aside} game${r.aside>1?'s':''} couldn’t fit in a free slot and ${r.aside>1?'were':'was'} kept aside.`:''}</p><p style="font-size:13px;color:var(--mute)">Offline, the app opens its own copy, which updates itself in the background.</p>`,[{l:'Great',fn:()=>{}}])},0)}
setTimeout(()=>{updCheck()},updWin()?50:1200);
