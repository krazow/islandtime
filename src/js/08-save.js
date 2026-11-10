// ---------------- save / app shell ----------------
const SAVE_KEY='islandtime.save', LEGACY_KEYS=['islandtime.save.v2','islandtime.save.v1'], BEST_KEY='islandtime.best';
let saveNotice='';
function store(){try{return window.localStorage}catch(e){return null}}
// Three save slots. Slot 1 is the original key (plus its legacy mirrors); slots 2 and 3 have their own keys.
const SLOT_KEY='islandtime.slot', SLOT_N=3;
function curSlot(){let n=1;try{n=parseInt(localStorage.getItem(SLOT_KEY)||'1',10)}catch(e){}return n>=1&&n<=SLOT_N?n:1}
function setSlot(n){try{localStorage.setItem(SLOT_KEY,String(n))}catch(e){}}
function slotKeys(n){n=n||curSlot();return n===1?[SAVE_KEY,...LEGACY_KEYS]:['islandtime.save.slot'+n]}
function packSave(){return {schema:SAVE_SCHEMA,app:APP_VERSION,S,uiNarr,tab,at:Date.now()}}
// The save is mirrored under the older key names so an older copy of the game (old install, cached phone app) still finds it.
function saveGame(){const ls=store();if(!ls||!S)return;const keys=slotKeys();
  try{if(S.over)keys.forEach(k=>ls.removeItem(k));else{const v=JSON.stringify(packSave());keys.forEach(k=>{try{ls.setItem(k,v)}catch(e){}})}}catch(e){}}
// Fill in anything an older (or newer) save is missing, without touching what it has.
function fillDefaults(obj,def){
  for(const k in def){
    if(obj[k]===undefined||obj[k]===null&&def[k]!==null&&typeof def[k]==='object'&&!Array.isArray(def[k])) obj[k]=JSON.parse(JSON.stringify(def[k]));
    else if(def[k]&&typeof def[k]==='object'&&!Array.isArray(def[k])&&obj[k]&&typeof obj[k]==='object') fillDefaults(obj[k],def[k]);
  }
  return obj;
}
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
// numeric dotted version compare: >0 when a is newer than b ('1.10.0' > '1.9.2')
const verCmp=(a,b)=>{const p=v=>String(v||'').split('.').map(n=>parseInt(n,10)||0),x=p(a),y=p(b);for(let i=0;i<Math.max(x.length,y.length);i++){const k=(x[i]||0)-(y[i]||0);if(k)return k}return 0};
let newerWarned='';
function migrate(d){
  if(!d||typeof d!=='object'||!d.S||typeof d.S!=='object') throw new Error('not an Island Time save');
  const from=d.schema||(d.S.cargo?2:1), x=d.S, notes=[];
  // v1 (game 1.1): loose gas/diesel cans instead of trade cargo
  if(from<2){
    x.cargo=x.cargo||{food:0,med:0,gas:0,diesel:0,drugs:0};
    if(x.canGal>0){x.cargo.gas+=Math.max(1,Math.round(x.canGal/5));notes.push('your gas can moved into trade cargo')}
    if(x.dieselCans>0){x.cargo.diesel+=Math.max(1,Math.round(x.dieselCans/5));notes.push('your diesel cans moved into trade cargo')}
    delete x.canGal;delete x.dieselCans;
  }
  fillDefaults(x,baseState());
  // 1.15: reputation went from 0..~10 to −100..+100
  if(from<7&&typeof x.rep==='number'&&x.rep>0){x.rep=Math.min(100,Math.round(x.rep*7.5));notes.push('island reputation moved to the new −100 to +100 scale')}
  if(from<7&&x.eco&&x.eco.perks){const P=x.eco.perks,M={3:20,5:35,8:60};for(const k in M)if(P[k]){P[M[k]]=true;delete P[k]}}
  // 1.4.2 -> 1.4.3: Pajama Mike was renamed Pajama Fred
  if(x.friends&&x.friends.mike){x.friends.fred=Object.assign(x.friends.mike,{name:'Pajama Fred'});delete x.friends.mike}
  if(x.ev){for(const k of ['count','last'])if(x.ev[k]&&x.ev[k].pajama_mike!=null){x.ev[k].pajama_fred=x.ev[k].pajama_mike;delete x.ev[k].pajama_mike}
    if(Array.isArray(x.ev.history))x.ev.history.forEach(h=>{if(h.id==='pajama_mike')h.id='pajama_fred'});
    if(Array.isArray(x.ev.force))x.ev.force=x.ev.force.map(i=>i==='pajama_mike'?'pajama_fred':i)}
  if(Array.isArray(x.log))x.log.forEach(e=>{if(typeof e.s==='string')e.s=e.s.replace(/Pajama Mike/g,'Pajama Fred').replace(/\bMike\b/g,'Fred')});
  if(Array.isArray(d.uiNarr))d.uiNarr=d.uiNarr.map(t=>typeof t==='string'?t.replace(/Pajama Mike/g,'Pajama Fred').replace(/\bMike\b/g,'Fred'):t);
  // core fields must be sane numbers
  x.t=num(x.t,330);x.cur=num(x.cur,Math.floor(x.t/1440));x.cur=Math.max(0,Math.min(6,x.cur));
  for(const k of ['money','pantry','carried','health','stress','job']) x[k]=num(x[k],baseState()[k]);
  if(!L[x.loc]){notes.push('a place from another version doesn’t exist here, so you’re back home');x.loc='home';}
  // cars
  if(!Array.isArray(x.cars)||!x.cars.length) x.cars=baseState().cars;
  if(x.phoneT<x.cur*1440)x.phoneT=x.t;
  // 1.7.0: one alarm {time,type} became two independent alarms
  if(x.alarm&&x.alarm.type){const t=num(x.alarm.time,330),ty=x.alarm.type;x.alarm={plug:{on:ty==='plug',time:t},phone:{on:ty==='phone',time:t}}}
  // before 1.5.0 every player had a generator at home; keep it
  if(from<5&&x.gen==null){x.gen='home';notes.push('you keep the generator you already had at home')}
  for(const id in x.friends){const f=x.friends[id];f.lvl=f.lvl||1;f.pts=f.pts||0}
  x.cars.forEach(c=>{c.tank=num(c.tank,c.diesel?20:c.id==='beat'?12:14);c.fuel=num(c.fuel,Math.min(8,c.tank));c.diesel=!!c.diesel;if(!L[c.loc])c.loc=L[x.loc].side==='I'?'home':'stDock';c.name=c.name||'Car'});
  // cargo: unknown goods from a newer version are kept but ignored
  for(const g in GOODS) x.cargo[g]=Math.max(0,num(x.cargo[g],0));
  // week: regenerate whatever is missing
  if(!DIFFS[x.diff])x.diff='normal';
  if(!seasonOk(x.season))x.season='fall'; // season
  const w=x.week&&typeof x.week==='object'?x.week:{}, fresh=genWeek(x.diff,x.season); // season
  if(!Array.isArray(w.b)) w.b=fresh.b;
  if(!Array.isArray(w.fog)) w.fog=fresh.fog;
  if(w.storm===undefined) w.storm=null;
  if(!Array.isArray(w.px)||w.px.length<7) w.px=fresh.px;
  w.px.forEach((o,i)=>{for(const g in GOODS) if(!o[g]) o[g]=fresh.px[i][g]});
  if(!Array.isArray(w.news)) w.news=fresh.news.map((n,i)=>i<x.cur?-1:n);
  if(typeof w.bingo!=='number'||!BINGO_FOR[w.bingo]) w.bingo=fresh.bingo;
  if(!Array.isArray(x.ev.force)) x.ev.force=[];
  w.news=w.news.map(n=>typeof n==='number'&&n<NEWS.length?n:-1);
  x.week=w;
  const newer=typeof d.app==='string'&&verCmp(d.app,APP_VERSION)>0?d.app:null;
  if(from>SAVE_SCHEMA&&!newer) notes.push(`this save is from a newer version (${d.app||'unknown'}). Anything this version doesn’t know about is kept but ignored`);
  else if(from<SAVE_SCHEMA) notes.push(`upgraded from an older version${d.app?' ('+d.app+')':''}`);
  return {schema:Math.max(from,SAVE_SCHEMA),app:d.app,S:x,uiNarr:Array.isArray(d.uiNarr)?d.uiNarr:[],tab:['act','ferry','todo','log'].includes(d.tab)?d.tab:'act',at:d.at,notes,newer};
}
function rawSave(n){const ls=store();if(!ls)return null;
  let best=null;
  for(const k of slotKeys(n)){const v=ls.getItem(k);if(!v)continue;let at=0;try{at=JSON.parse(v).at||0}catch(e){}
    if(!best||at>best.at)best={k,v,at}}
  return best}
function loadSave(n){
  const r=rawSave(n);if(!r)return null;
  try{const d=migrate(JSON.parse(r.v));return d.S.over?null:d}
  catch(e){try{const ls=store(),sn=n||curSlot();ls.setItem('islandtime.save.broken'+(sn>1?'.slot'+sn:''),r.v);slotKeys(sn).forEach(k=>ls.removeItem(k))}catch(_){}
    saveNotice='Your saved game couldn’t be read, so it was set aside. Start a new week.';return null}
}
function adopt(d){
  S=d.S;uiNarr=d.uiNarr;tab=d.tab;
  render();
  if(d.newer&&newerWarned!==d.newer){newerWarned=d.newer;modal('⚠️ Save from a newer version',`<p>This save is from Island Time ${esc(d.newer)}, newer than this copy (${APP_VERSION}). Update the game to keep everything: whatever this copy doesn’t know about is ignored, and may be lost once you keep playing here.</p>`,[{l:'Continue anyway',fn:()=>{}}])}
  if(d.notes&&d.notes.length) modal('Save loaded',`<p>Welcome back. Note: ${d.notes.join('; ')}.</p>`,[{l:'Continue',fn:()=>{}}]);
  if(S.t>=day()*1440+1410&&L[S.loc].side==='M') strandedModal();
}
function resumeGame(){const d=loadSave();if(!d)return titleScreen();
  try{adopt(d)}catch(e){saveNotice='That save couldn’t be loaded in this version.';titleScreen()}}
// ---- transfer codes: move a game between the web page, the phone app and Windows
function b64enc(str){return btoa(unescape(encodeURIComponent(str)))}
function b64dec(b){return decodeURIComponent(escape(atob(b)))}
function exportCode(){const d=rawSave();if(!d&&!S)return '';const obj=d?JSON.parse(d.v):packSave();return 'ISLANDTIME:'+b64enc(JSON.stringify(obj))}
window.openTransfer=()=>{
  const code=exportCode();
  modal('Transfer a saved game',`<p>Copy this code to move your week to another device or version (the web page, the phone app, or Windows).</p>
  ${code?`<textarea id="exp" readonly style="width:100%;height:70px;font-size:11px;border-radius:8px;border:1.5px solid var(--line);padding:6px">${code}</textarea>
  <button class="act" style="margin-top:6px" onclick="copyCode()"><span class="tx"><b id="cpl">📋 Copy code</b></span></button>`:'<p><i>No game in progress to export.</i></p>'}
  <p style="margin-top:12px">Or paste a code here to load it. It replaces your current save.</p>
  <textarea id="imp" oninput="window.IMPV=this.value" placeholder="ISLANDTIME:…" style="width:100%;height:70px;font-size:12px;border-radius:8px;border:1.5px solid var(--line);padding:6px"></textarea>
  <div id="imperr" style="color:var(--bad);font-size:13px"></div>`,
  [{l:'Load pasted code',fn:importCode},{l:'Close',fn:()=>{if(!S||S.over)titleScreen()}}]);
};
window.copyCode=async()=>{const t=document.getElementById('exp');t.select();try{await navigator.clipboard.writeText(t.value);document.getElementById('cpl').textContent='✅ Copied'}catch(e){document.getElementById('cpl').textContent='Selected: press Ctrl+C / Copy'}};
function importCode(){
  const raw=(window.IMPV||document.getElementById('imp')?.value||'').trim();window.IMPV='';
  try{
    const body=raw.replace(/^ISLANDTIME:/,'').replace(/\s+/g,'');
    const d=migrate(JSON.parse(b64dec(body)));
    if(d.S.over) throw new Error('that week is already over');
    setTimeout(()=>adopt(d),0);
  }catch(e){setTimeout(()=>{openTransfer();const el=document.getElementById('imperr');if(el)el.textContent=/already over/.test(e.message)?'That week is already finished.':'That code didn’t work. Make sure you copied all of it, starting with ISLANDTIME:';const i=document.getElementById('imp');if(i)i.value=raw},0)}
}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;const b=document.getElementById('installBtn');if(b)b.style.display='block'});
window.addEventListener('appinstalled',()=>{deferredInstall=null;const b=document.getElementById('installBtn');if(b)b.style.display='none'});
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.doInstall=async()=>{if(!deferredInstall)return;deferredInstall.prompt();try{await deferredInstall.userChoice}catch(e){}deferredInstall=null;const b=document.getElementById('installBtn');if(b)b.style.display='none'};
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});

