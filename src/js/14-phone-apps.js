// ---------------- 📱 phone: apps (App Store, Clock, Island Group, retired-app cleanup) ----------------
// HOW TO ADD AN APP (plug-in pattern)
//   definePhoneApp({
//     id:'myapp', name:'My App', ic:'🧩', order:60,   // order sorts icons on the home screen
//     builtin:false,                                     // false = installable from the App Store, takes 1 of PHONE_SLOTS
//     size:'25 MB', desc:'One line for the App Store.',
//     badge:()=>0,                                       // number on the icon (0 = none)
//     view:arg=>'<p>html</p>'+phBtn('Do it',()=>{...},{sub:'detail',cls:'primary',dis:false}),
//   });
//   - Keep state in a lazily created sub-object of PH() (e.g. PH().myapp=PH().myapp||{}), so older saves just work.
//   - Anything that should happen while game time passes goes in phoneOnTime(fn).
//   - A phBtn handler that spends game time should do S.t+=n and then afterAction() (like actions on the main screen).
//   - Opening a game modal (modal(), jobModal() …) from inside the phone is fine: modals show above the phone.
// The other installable apps live in their own files (19-apps-travel.js, 20-apps-money.js, 21-apps-health.js …).
// An app that is taken out of the game goes in PHONE_RETIRED below, so old saves get their slots back.
const phEsc=s=>typeof esc==='function'?esc(s):String(s);
const phCard=(h,cls)=>`<div class="ph-card ${cls||''}">${h}</div>`;
const phNote=h=>`<p class="ph-note">${h}</p>`;

// ---- 🛍️ App Store (builtin) ----
let PH_STORE_MSG=null;   // {h,t}: the last install/remove result, shown until game time moves on (not saved)
const phStoreMsg=h=>{PH_STORE_MSG={h,t:S.t}};
function phoneStoreApps(){return PHONE_APPS.filter(a=>!a.builtin)}
function phoneStoreInstall(id){
  const a=phoneApp(id);if(!a)return false;
  if(phoneFree()<=0){phStoreMsg(`No room for ${a.name}: ${PHONE_SLOTS} of ${PHONE_SLOTS} slots used. Remove an app first.`);return false}
  const t0=S.t,ok=phoneInstall(id);if(!ok){phStoreMsg(`Couldn’t install ${a.name}.`);return false}
  const min=S.t-t0;
  phStoreMsg(`📲 ${a.ic} <b>${a.name}</b> installed in ${min} minute${min===1?'':'s'}${phoneSignal()===1?' (one bar on the island)':''}.`);
  afterAction();return true}
function phoneStoreRemove(id){const a=phoneApp(id);if(phoneUninstall(id))phStoreMsg(`🗑️ Removed ${a.name}. A slot is free.`)}
definePhoneApp({id:'store',name:'App Store',ic:'🛍️',builtin:true,order:90,desc:'Install up to 5 apps.',
  view(){
    const used=PH().apps.length,full=used>=PHONE_SLOTS,isl=phoneSignal()===1;
    const M=PH_STORE_MSG&&PH_STORE_MSG.t===S.t?PH_STORE_MSG:null;let h=M?phCard(M.h,/^📲|^🗑️/.test(M.h)?'ok':'warn'):'';
    h+=phCard(full?`<b>${used} of ${PHONE_SLOTS} slots used</b> — remove an app to install another.`
      :`<b>${used} of ${PHONE_SLOTS} slots used.</b> ${isl?'One bar on the island: an install takes about 6 minutes.':'Good signal: an install takes a minute.'}`,full?'warn':'');
    for(const a of phoneStoreApps()){const inst=phoneInstalled(a.id);
      h+=`<div class="ph-store"><span class="ph-sic">${a.ic}</span><div class="ph-sinfo"><b>${a.name}</b><span>${a.desc}</span><small>${a.size}${inst?' · installed':''}</small></div><div class="ph-sbtns">`+
        (inst?phBtn('Open',()=>phoneGo(a.id),{cls:'primary'})+phBtn('Remove',()=>phoneStoreRemove(a.id))
          :phBtn('Install',()=>phoneStoreInstall(a.id),{cls:full?'':'primary',dis:full,sub:full?'No free slot':isl?'~6 min':'~1 min'}))+`</div></div>`}
    return h}});

// ---- ⏰ Clock (builtin) ----
definePhoneApp({id:'clock',name:'Clock',ic:'⏰',builtin:true,order:30,desc:'Your alarms.',
  view(){const A=S.alarm;
    return `<div class="ph-big">${fmt(S.t)}</div><div style="text-align:center;color:var(--mute);margin-bottom:10px">${DAYS[day()]}</div>`+
      phCard(`🔌 <b>Plug-in clock:</b> ${A.plug.on?fmt(A.plug.time):'off'}<br>📱 <b>Phone alarm:</b> ${A.phone.on?fmt(A.phone.time):'off'}`)+
      phNote(`You’ll wake to: ${alarmTxt()}.`)+phBtn('⏰ Set alarms',()=>alarmModal(),{cls:'primary',sub:'The plug-in clock, your phone, or both as backups.'})}});

// ---- 📣 Island Group ----
// The Anderson Island community group: posting for help lives here (it used to be an action on the main screen).
// Your reputation sits on top; 15-economy.js appends the perks it unlocks. The last few replies are kept in PH().grpLog.
const GRP_LOG_MAX=3;
definePhoneApp({id:'group',name:'Island Group',ic:'📣',order:60,size:'38 MB',desc:'The Anderson Island community group. Ask neighbors for help.',
  badge:()=>PH().grpNew?1:0,
  view(){const P=PH(),c=COMM(),dk=dayKey(),pj=upJob('post'),r=S.rep||0;let h='';
    if(P.grpNew){h+=phCard('📣 New replies to your post.','ok');P.grpNew=false}
    h+=`<div class="ph-rep"><span>🤲</span><div><b>Island reputation: ${r}</b><small>${r>=8?'Half the island owes you a casserole.':r>=3?'People know your car. In a good way.':'Mostly known as “the one who moved into that house.”'}</small></div></div>`;
    h+=phNote('Lost dogs, ferry complaints, free firewood, and neighbors who show up.');
    h+=phCard(pj?`⏳ <b>Waiting for replies.</b> They should trickle in around ${fmt(pj.due)}.`:c.post===dk?'✅ <b>You posted today.</b> One post a day, or people start muting you.':'Nothing posted today.');
    h+=phBtn('📣 Post asking for help',()=>postModal(),{cls:'primary',dis:!!pj||c.post===dk||!phoneCan(),sub:pj||c.post===dk?'Once a day.':'10 min. Answers come in a few hours.'});
    const lg=P.grpLog||[];
    if(lg.length)h+=`<div class="ph-sub">Recent replies</div>`+lg.slice().reverse().map(e=>`<div class="ph-grp"><small>${DAYS[e.d]||''}</small>${e.s}</div>`).join('');
    h+=phNote('The more you help others, the better your odds.');
    return h}});
// light up the badge and keep the last few replies when they arrive (wraps the house module's handler)
if(typeof postReplies==='function'){const _postReplies=postReplies;postReplies=function(j){const n=S.log.length,r=_postReplies(j);
  if(S&&phoneInstalled('group')){const P=PH();P.grpNew=true;const e=S.log.slice(n).find(x=>/^📣/.test(x.s));
    if(e){P.grpLog=(P.grpLog||[]).concat({d:day(),s:e.s.replace(/^📣\s*/,'')}).slice(-GRP_LOG_MAX)}}
  return r}}

// ---- 🧹 retired apps ----
// Apps that were taken out of the game. An old save that still has one installed gets the slot back on load, and a note once.
const PHONE_RETIRED={ferry:'Ferry Alerts',jobs:'Job Hunt',flash:'Flashlight',notes:'Notes'};
function phoneRetire(st){const P=st&&st.ph;if(!P||!Array.isArray(P.apps))return [];
  const gone=P.apps.filter(id=>!phoneApp(id));if(!gone.length)return [];
  P.apps=P.apps.filter(id=>phoneApp(id));delete P.flash;
  return gone.map(id=>PHONE_RETIRED[id]||id)}
{const _adopt=adopt;adopt=function(d){const gone=d&&d.S?phoneRetire(d.S):[];
  if(gone.length){const t=`Some apps were retired in this update: ${andList(gone)}. Their slots are free again`;
    d.notes=(d.notes||[]).concat(t.replace(/^S/,'s'));d.S.log=d.S.log||[];d.S.log.push({t:d.S.t,s:`📱 ${t}.`})}
  return _adopt.apply(this,arguments)}}
