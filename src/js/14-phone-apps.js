// ---------------- 📱 phone: apps (App Store, Clock, installable apps) ----------------
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
// Each app below is a small self-contained block; the five installable ones are PLACEHOLDERS for the real apps.
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

// ---- 📣 Island Group (PLACEHOLDER — replace with the real app) ----
// The Anderson Island community group: posting for help lives here now (it used to be an action on the main screen).
definePhoneApp({id:'group',name:'Island Group',ic:'📣',order:60,size:'38 MB',desc:'The Anderson Island community group. Ask neighbors for help.',
  badge:()=>PH().grpNew?1:0,
  view(){const P=PH(),c=COMM(),dk=dayKey(),pj=upJob('post');let h='';
    if(P.grpNew){h+=phCard('📣 New replies to your post. (See what happened in your log.)','ok');P.grpNew=false}
    h+=phNote('Lost dogs, ferry complaints, free firewood, and neighbors who show up.');
    h+=phCard(pj?`⏳ <b>Waiting for replies.</b> They should trickle in around ${fmt(pj.due)}.`:c.post===dk?'✅ <b>You posted today.</b> One post a day, or people start muting you.':'Nothing posted today.');
    h+=phBtn('📣 Post asking for help',()=>postModal(),{cls:'primary',dis:!!pj||c.post===dk||!phoneCan(),sub:pj||c.post===dk?'Once a day.':'10 min. Answers come in a few hours.'});
    h+=phNote(`Island reputation: ${S.rep||0}. The more you help others, the better your odds.`);
    return h}});
// light up the badge when replies arrive (wraps the house module's handler)
if(typeof postReplies==='function'){const _postReplies=postReplies;postReplies=function(j){const r=_postReplies(j);if(S&&phoneInstalled('group'))PH().grpNew=true;return r}}

// ---- ⛴️ Ferry Alerts (PLACEHOLDER — replace with the real app) ----
function phoneSailings(side,n){   // the next n sailings you could still make from this side (known outages only)
  const deps=side==='I'?AI_DEPS:ST_DEPS,out=[];
  for(let d=day();d<day()+3&&out.length<n;d++)for(const dep of deps){if(out.length>=n)break;
    const s=sailing(side,d,dep,'walk',true);if(S.t>s.abs-20||s.cancel)continue;out.push(s)}
  return out}
function phoneLastBoat(side){const deps=side==='I'?AI_DEPS:ST_DEPS;
  for(let i=deps.length-1;i>=0;i--){const s=sailing(side,day(),deps[i],'walk',true);if(s.cancel)continue;return s.abs>=S.t-20?s:null}return null}
definePhoneApp({id:'ferry',name:'Ferry Alerts',ic:'⛴️',order:61,size:'22 MB',desc:'Next sailings, rider alerts and fog delays.',
  badge:()=>activeOutage()?1:0,
  view(){const side=L[S.loc].side,from=side==='I'?'Anderson Island':'Steilacoom',d=day();let h='';
    const known=S.week.b.filter(b=>b.start<=S.t&&b.end>S.t);
    for(const b of known)h+=phCard(`🚨 <b>Rider alert:</b> ferry service suspended (${phEsc(b.cause)}).`,'warn');
    if(S.week.fog[d]&&tod()<660)h+=phCard(`🌫️ <b>Fog:</b> morning sailings running ${S.week.fog[d]}+ min late.`,'warn');
    if(!known.length&&!(S.week.fog[d]&&tod()<660))h+=phCard('✅ No alerts right now.','ok');
    const nx=phoneSailings(side,3);
    h+=`<div class="ph-sub">Next sailings from ${from}</div>`;
    h+=nx.length?nx.map(s=>`<div class="ph-li"><b>${fmtAbs(s.abs)}</b><span>${s.passenger?'🚶 passenger-only backup boat':s.delay?`🌫️ ~${s.delay} min late`:'on time'}</span></div>`).join(''):'<div class="ph-li"><span>No sailings found.</span></div>';
    const lb=phoneLastBoat(side);
    h+=phCard(lb?`🌙 <b>Last boat tonight:</b> ${fmt(lb.dep)} from ${from}${lb.passenger?' (passenger-only)':''}.`:`🌙 <b>No more boats from ${from} tonight.</b>`);
    h+=phNote('Be in line 20 minutes before a boat leaves.');
    return h}});

// ---- 🔎 Job Hunt (PLACEHOLDER — replace with the real app) ----
definePhoneApp({id:'jobs',name:'Job Hunt',ic:'🔎',order:62,size:'55 MB',desc:'Job listings on the mainland. Set up interviews.',
  badge:()=>!S.emp&&!S.interview?1:0,
  view(){const J=curJob(),I=S.interview;let h='';
    h+=phCard(J?`💼 You work as <b>${J.n}</b>.`:'💼 You’re out of work.',J?'':'warn');
    if(I)h+=phCard(`📝 <b>Interview:</b> ${JOBS[I.job].n}, ${DAYS[I.day]} ${fmt(I.time)} at ${L[I.loc].name}.`);
    h+=phBtn('🔎 Browse job listings',()=>jobModal(),{cls:'primary',sub:J?'Switching jobs means quitting.':'Find something and set up an interview.'});
    return h}});

// ---- 🔦 Flashlight (PLACEHOLDER — replace with the real app) ----
// On: drains about 1% battery per 10 game minutes. In a power outage at home, switching it on once calms you a little.
const FL=()=>{const P=PH();P.flash=P.flash||{on:false,t:0,acc:0,out:-1};return P.flash};
function phoneFlash(on){const f=FL();if(on===f.on)return;f.on=on;f.t=S.t;f.acc=0;
  if(on){if(powerOut()&&S.loc==='home'&&f.out!==S.power.start){f.out=S.power.start;adj('stress',-3);say('🔦 You flick on the phone’s flashlight. The dark house feels a little less spooky.')}
    else say('🔦 Flashlight on.')}
  else say('🔦 Flashlight off.')}
phoneOnTime(()=>{const f=S&&S.ph&&S.ph.flash;if(!f||!f.on)return;
  if(Math.floor(f.t/1440)!==day()){f.on=false;f.t=S.t;f.acc=0;return}   // you slept: it got switched off
  const el=S.t-f.t;if(el<=0)return;f.t=S.t;f.acc+=el/10;const n=Math.floor(f.acc);
  if(n>0){f.acc-=n;phoneUse(n)}
  if(!phoneCan()){f.on=false;say('🔦 The flashlight drained your phone. It’s dead.')}});
definePhoneApp({id:'flash',name:'Flashlight',ic:'🔦',order:63,size:'4 MB',desc:'A light for power outages and dark driveways. Uses battery.',
  badge:()=>FL().on?1:0,
  view(){const f=FL();
    return `<div class="ph-flash ${f.on?'on':''}">🔦</div>`+
      phBtn(f.on?'Turn off':'Turn on',()=>phoneFlash(!f.on),{cls:'primary',sub:'Uses about 1% battery every 10 minutes.'})+
      (powerOut()&&L[S.loc].side==='I'?phNote('⚡ The island’s power is out.'):'')}});

// ---- 📝 Notes (PLACEHOLDER — replace with the real app) ----
// Shows the same list as "My priorities" in the 📋 To-do tab (S.prios).
const NOTE_TPL=['Buy groceries on the mainland','Fill up with gas in Steilacoom','Charge my phone','Pay rent','Call Gus about the house','Catch an earlier boat'];
definePhoneApp({id:'notes',name:'Notes',ic:'📝',order:64,size:'12 MB',desc:'Your priorities list, in your pocket.',
  view(){const P=S.prios||[],full=P.length>=PRIO_MAX;let h='';
    h+=P.length?P.map((q,i)=>`<button class="ph-row ph-todo ${q.done?'done':''}" onclick="prioToggle(${i})"><span class="ph-ck">${q.done?'☑':'☐'}</span><b>${phEsc(q.t)}</b></button>`).join('')
      :phNote('No notes yet. Same list as “My priorities” in the 📋 To-do tab.');
    if(full)h+=phNote(`That’s ${PRIO_MAX}: the most the list holds.`);
    else{h+=`<div class="prio-add ph-add"><input id="phNoteIn" maxlength="${PRIO_LEN}" placeholder="New note…" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();prioAdd(this.value)}"><button onclick="prioAdd(document.getElementById('phNoteIn').value)">Add</button></div>`;
      h+=`<div class="ph-sub">Quick add</div>`+NOTE_TPL.filter(t=>!P.some(q=>q.t===t)).slice(0,4).map(t=>phBtn('＋ '+t,()=>prioAdd(t))).join('')}
    if(P.some(q=>q.done))h+=phBtn('Clear checked-off notes',()=>prioClear());
    return h}});
