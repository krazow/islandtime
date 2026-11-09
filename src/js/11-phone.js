// ---------------- 📱 phone: core (screen, app system, timers) ----------------
// Plug-in files (12-phone-messages.js, 13-phone-calls.js, 14-phone-apps.js) register apps with definePhoneApp().
// State lives in S.ph (created lazily, so older saves just work). Each plug-in keeps its own sub-object.
const PHONE_SLOTS=5;
const PHONE_APPS=[];          // {id,name,ic,builtin,desc,size,badge(),view(arg),order}
const PH_TIMERS=[];           // functions run from processTimed() while the game clock moves
let PH_OPEN=false, PH_NAV=[{app:null,arg:null}], PH_ACTS=[];
function PH(){S.ph=S.ph||{};const p=S.ph;p.apps=p.apps||[];p.inst=p.inst||{};return p}
function definePhoneApp(a){const i=PHONE_APPS.findIndex(x=>x.id===a.id);const app=Object.assign({builtin:false,size:'40 MB',order:50,badge:()=>0,desc:''},a);if(i>=0)PHONE_APPS[i]=app;else PHONE_APPS.push(app);PHONE_APPS.sort((x,y)=>x.order-y.order)}
function phoneApp(id){return PHONE_APPS.find(a=>a.id===id)}
function phoneOnTime(fn){PH_TIMERS.push(fn)}
function phoneSignal(){return L[S.loc].side==='I'?1:4}           // the island's famous one bar
function phoneCan(){return S.phone>0}
function phoneUse(pct){phoneTick();S.phone=Math.max(0,Math.round(S.phone-pct))}   // battery cost of using it
function phoneInstalled(id){const a=phoneApp(id);return !!a&&(a.builtin||PH().apps.includes(id))}
function phoneFree(){return PHONE_SLOTS-PH().apps.length}
// install takes time: one bar of signal on the island makes it slow
function phoneInstall(id){const a=phoneApp(id),P=PH();if(!a||a.builtin||P.apps.includes(id))return false;if(P.apps.length>=PHONE_SLOTS||!phoneCan())return false;
  const min=phoneSignal()===1?6:1;S.t+=min;phoneUse(1);P.apps.push(id);P.inst[id]=(P.inst[id]||0)+1;
  say(`📲 Installed <b>${a.name}</b>.${min>1?' One bar of signal on the island: it took '+min+' minutes.':''}`);return true}
function phoneUninstall(id){const P=PH();const i=P.apps.indexOf(id);if(i<0)return false;P.apps.splice(i,1);say(`🗑️ Removed ${phoneApp(id).name} from your phone.`);return true}
function phoneBadgeTotal(){if(!S)return 0;return PHONE_APPS.filter(a=>phoneInstalled(a.id)).reduce((n,a)=>{try{return n+(a.badge()||0)}catch(e){return n}},0)}
// a notification: a tile now, and the badge tells the rest
function phoneNotify(ic,title,sub){if(!phoneCan())return;showTile(ic,title,sub||'','info');try{sfx('info')}catch(e){}}
// buttons inside the phone register their handlers here (like ACTS for the main screen)
function phBtn(label,fn,opt){opt=opt||{};const i=PH_ACTS.push(fn)-1;return `<button class="ph-btn ${opt.cls||''}" ${opt.dis?'disabled':''} onclick="PHA(${i})">${label}${opt.sub?`<small>${opt.sub}</small>`:''}</button>`}
window.PHA=i=>{const f=PH_ACTS[i];if(!f)return;f();if(S&&!S.over){render()}};
window.phoneOpen=(app,arg)=>{if(!S||S.over)return;PH_OPEN=true;PH_NAV=[{app:null,arg:null}];if(app)PH_NAV.push({app,arg});phoneRender()};
window.phoneClose=()=>{PH_OPEN=false;const el=document.getElementById('phoneUI');el&&el.remove();if(S&&!S.over)render()};
window.phoneGo=(app,arg)=>{PH_NAV.push({app,arg});phoneRender()};
window.phoneBack=()=>{if(PH_NAV.length>1)PH_NAV.pop();phoneRender()};
window.phoneHome=()=>{PH_NAV=[{app:null,arg:null}];phoneRender()};
function phoneScreen(){
  const top=PH_NAV[PH_NAV.length-1];
  if(!phoneCan()) return `<div class="ph-dead"><div style="font-size:40px">🪫</div><b>Battery dead</b><span>Charge it at home, in the car, or at the outlet by the vending machines in the Steilacoom terminal.</span></div>`;
  if(top.app){const a=phoneApp(top.app);if(!a||!phoneInstalled(a.id)){PH_NAV.pop();return phoneScreen()}
    let body='';try{body=a.view(top.arg)}catch(e){body=`<p>Something went wrong in ${a.name}.</p>`;console.error(e)}
    return `<div class="ph-bar"><button class="ph-back" onclick="phoneBack()" aria-label="Back">‹</button><b>${a.ic} ${a.name}</b><span></span></div><div class="ph-body">${body}</div>`}
  const icon=a=>{const n=(()=>{try{return a.badge()||0}catch(e){return 0}})();return `<button class="ph-app" onclick="phoneGo('${a.id}')"><span class="ph-ic">${a.ic}${n?`<i class="ph-badge">${n>9?'9+':n}</i>`:''}</span><span class="ph-nm">${a.name}</span></button>`};
  const built=PHONE_APPS.filter(a=>a.builtin),mine=PH().apps.map(phoneApp).filter(Boolean);
  const empty=Array.from({length:PHONE_SLOTS-mine.length},()=>`<button class="ph-app ph-empty" onclick="${phoneApp('store')?"phoneGo('store')":''}" aria-label="Empty app slot"><span class="ph-ic">＋</span><span class="ph-nm">Empty</span></button>`);
  return `<div class="ph-body ph-home"><div class="ph-grid">${built.map(icon).join('')}</div><div class="ph-sect">Your apps · ${mine.length}/${PHONE_SLOTS}</div><div class="ph-grid">${mine.map(icon).join('')}${empty.join('')}</div></div>`;
}
function phoneRender(){
  if(!PH_OPEN||!S||S.over){const el=document.getElementById('phoneUI');el&&el.remove();return}
  PH_ACTS=[];
  let el=document.getElementById('phoneUI'),fresh=!el;
  if(!el){el=document.createElement('div');el.id='phoneUI';el.className='ph-bg';el.addEventListener('click',e=>{if(e.target===el)phoneClose()});document.body.appendChild(el)}
  const bars=phoneSignal(),bat=S.phone;
  el.innerHTML=withName(`<div class="ph${fresh?' ph-anim':''}" role="dialog" aria-label="Your phone"><div class="ph-status"><span>${fmt(S.t)}</span><span>${'▮'.repeat(bars)}<span style="opacity:.3">${'▮'.repeat(4-bars)}</span> ${L[S.loc].side==='I'?'AI':'5G'} · ${bat<=15?'🪫':'🔋'}${bat}%</span></div>
    <div class="ph-screen">${phoneScreen()}</div>
    <div class="ph-nav"><button onclick="phoneHome()" aria-label="Home screen">⌂ Home</button><button onclick="phoneClose()" aria-label="Put the phone away">✕ Put away</button></div></div>`);
}
// called from processTimed(): plug-ins deliver replies, calls etc. on game time
function phoneTimed(){for(const f of PH_TIMERS){try{f()}catch(e){console.error(e)}}}
// ---- shared rules for Messages and Calls ----
// Is a friend reachable right now? 'asleep' (10:30 PM–6:30 AM), 'busy' (sometimes), or 'ok'.
function phoneFriendAvail(id){const m=tod();if(m>=1350||m<390)return 'asleep';const f=S.friends[id];if(!f)return 'none';
  const k=`${id}:${dayKey()}:${Math.floor(m/120)}`;let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;   // stable per 2-hour block
  return (h%100)<(f.lvl>=3?8:f.lvl>=2?15:22)?'busy':'ok'}
// Being in touch builds friendships, but only once per friend per day (texting and calling share this).
function phoneSocial(id,n){const P=PH();P.social=P.social||{};if(P.social[id]===dayKey())return false;P.social[id]=dayKey();friendPts(id,n||1);return true}
// Ask Sam for a ride to the ferry landing (from home, morning). Returns 'yes' | 'no' | 'not-now'.
function phoneAskRide(){const P=PH();if(!S.friends.sam||S.loc!=='home'||tod()>=630)return 'not-now';
  if(P.rideAsk===dayKey())return S.ev.flags.samRide===day()?'yes':'no';P.rideAsk=dayKey();
  const lv=flv('sam'),ok=Math.random()<(lv>=3?0.95:lv>=2?0.85:0.5);
  if(ok){S.ev.flags.samRide=day();return 'yes'}S.ev.flags.samNo=day();return 'no'}
