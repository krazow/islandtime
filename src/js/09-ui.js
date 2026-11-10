// ---------------- UI ----------------
const app=document.getElementById('app');
function meter(v,good){const c=good?(v>60?'#8fd19e':v>30?'#f4d27a':'#ff8a70'):(v<40?'#8fd19e':v<70?'#f4d27a':'#ff8a70');return `<div class="meter"><i style="width:${v}%;background:${c}"></i></div>`}
function sceneSVG(){
  const m=tod(),side=L[S.loc].side,loc=S.loc;
  const sea=seasonId(),SR=SEA().sun,night=m<SR[0]||m>SR[1], dusk=(m>=SR[1]-90&&m<=SR[1]+30)||(m>=SR[0]-30&&m<=SR[0]+60); // season
  const sky=night?['#0e1d2b','#22384a']:dusk?['#6b7f95','#e6b48a']:sea==='summer'?['#7fb6d8','#dcedf0']:sea==='winter'?['#b7c6cf','#e9edef']:sea==='spring'?['#9fc3d4','#e4ecdf']:['#a9c3cc','#dfe6e1']; // season
  const foggy=S.week.fog[day()]&&m<660&&m>=360;
  const water=night?'#132d38':sea==='summer'?'#2b6f84':'#2c5f6e'; // season
  const tree=night?'#13261f':sea==='summer'?'#3b7a50':sea==='spring'?'#3a6f4c':'#2f5d4a',snow=sea==='winter'; // season
  const out=activeOutage();
  let fg='';
  if(side==='I'){
    for(let i=0;i<14;i++){const x=i*36+(i%2)*10-10,h=60+((i*37)%40);fg+=`<polygon points="${x},170 ${x+18},${170-h} ${x+36},170" fill="${tree}"/>`+(snow?`<polygon points="${x+11},${170-h*0.62} ${x+18},${170-h} ${x+25},${170-h*0.62}" fill="#f2f6f7" opacity=".9"/>`:'')} // season
    if(loc==='home') fg+=`<rect x="190" y="112" width="70" height="40" fill="#7a5a3c"/><polygon points="184,114 225,88 266,114" fill="#4a3426"/><rect x="216" y="128" width="16" height="24" fill="#3a2a1e"/><rect x="198" y="122" width="12" height="10" fill="${night?'#f7d77a':'#cfe0e6'}"/>`+(snow?'<polygon points="186,113 225,89 264,113 225,95" fill="#f4f7f8"/>':''); // season
    if(loc==='store') fg+=`<rect x="150" y="104" width="130" height="50" fill="#e8dcc0"/><rect x="146" y="98" width="138" height="10" fill="#8a3b22"/><text x="215" y="122" text-anchor="middle" font-size="11" font-family="DM Sans" font-weight="700" fill="#2f3a3a">GENERAL STORE</text><rect x="200" y="130" width="30" height="24" fill="#5a4a3a"/><rect x="196" y="126" width="38" height="10" fill="#b8402a" transform="rotate(-8 215 131)"/><text x="215" y="134" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="DM Sans" transform="rotate(-8 215 131)">CLOSED</text><rect x="300" y="128" width="14" height="26" fill="#ddd"/><rect x="298" y="124" width="18" height="12" fill="#8a8a8a" opacity=".8"/>`;
    if(loc==='dale') fg+=`<rect x="170" y="116" width="80" height="38" fill="#6d5a45"/><polygon points="164,118 210,96 256,118" fill="#4b4b4b"/><rect x="262" y="132" width="16" height="22" rx="3" fill="#b8402a"/><rect x="282" y="134" width="16" height="20" rx="3" fill="#c98a12"/><rect x="200" y="128" width="20" height="26" fill="#2d241b"/>`;
    if(loc==='food') fg+=`<rect x="160" y="108" width="120" height="46" fill="#d7c7a5"/><rect x="156" y="102" width="128" height="9" fill="#2f5d4a"/><rect x="175" y="120" width="30" height="18" fill="${night?'#f7d77a':'#cfe0e6'}"/><rect x="235" y="120" width="30" height="18" fill="${night?'#f7d77a':'#cfe0e6'}"/>`;
    if(loc==='legion') fg+=`<rect x="150" y="112" width="140" height="42" fill="#c9c1ad"/><polygon points="144,114 220,90 296,114" fill="#5a4a3a"/><rect x="208" y="128" width="22" height="26" fill="#5a4a3a"/><rect x="318" y="70" width="3" height="84" fill="#999"/><rect x="321" y="72" width="22" height="13" fill="#b23a3a"/><rect x="321" y="72" width="9" height="7" fill="#2c4a7a"/>`;
    if(loc==='lake') fg=`<ellipse cx="240" cy="150" rx="200" ry="22" fill="${water}"/>`+fg.replace(/170/g,'135')+`<path d="M300 60 q10 -6 20 0 q10 -6 20 0" stroke="#222" stroke-width="3" fill="none"/>`;
  } else {
    const b=[[10,50],[60,70],[120,40],[170,85],[230,55],[290,65],[350,45],[400,75],[440,50]];
    b.forEach(([x,h],i)=>{fg+=`<rect x="${x}" y="${170-h}" width="44" height="${h}" fill="${night?'#1a2730':'#5d6b70'}"/>`;if(night)for(let w=0;w<3;w++)fg+=`<rect x="${x+8+w*12}" y="${178-h}" width="6" height="6" fill="#f4d27a" opacity=".7"/>`});
  }
  if(loc==='gas') fg+=`<rect x="140" y="104" width="200" height="10" fill="#b8402a"/><rect x="160" y="114" width="8" height="40" fill="#ccc"/><rect x="312" y="114" width="8" height="40" fill="#ccc"/><rect x="215" y="130" width="16" height="24" fill="#eee"/><rect x="250" y="130" width="16" height="24" fill="#eee"/><rect x="0" y="154" width="480" height="16" fill="#4a4a48"/>`;
  const dock=(loc==='aiDock'||loc==='stDock');
  let ferry='';
  if(dock){
    fg=`<rect x="0" y="150" width="200" height="20" fill="#6b6b5f"/><rect x="170" y="140" width="50" height="10" fill="#7d7d70"/>`+(side==='I'?fg.replace(/<polygon[^>]*>/g,(p,i)=>i%3?'':p):'');
    if(!out) ferry=`<g class="bob"><rect x="230" y="122" width="170" height="22" rx="4" fill="#f4f1ea"/><rect x="230" y="138" width="170" height="8" fill="#2f5d4a"/><rect x="290" y="104" width="50" height="20" fill="#f4f1ea"/><rect x="295" y="108" width="40" height="7" fill="#2a3d45"/><rect x="310" y="92" width="8" height="14" fill="#e3642e"/></g>`;
    else ferry=`<text x="300" y="130" text-anchor="middle" font-size="13" font-weight="700" font-family="DM Sans" fill="#ffdfd6">NO BOAT</text>`;
  }
  const sf=(m-SR[0])/(SR[1]-SR[0]),smoke=sea==='summer'&&smokeDay(); // season
  const sun=night?`<circle cx="400" cy="34" r="12" fill="#f3efe0"/>`:`<circle cx="${80+sf*320}" cy="${50-Math.sin(sf*Math.PI)*25}" r="16" fill="${smoke?'#f08a3c':'#fbeaa8'}" opacity=".9"/>`; // season
  const rainier=(!night&&!foggy)?`<polygon points="300,95 360,50 372,58 380,52 440,95" fill="#c9d3dc"/><polygon points="345,62 360,50 372,58 380,52 395,64 380,62 370,66 358,60" fill="#fff"/>`:'';
  return `<svg viewBox="0 0 480 170" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
  <rect width="480" height="170" fill="url(#sk)"/>${sun}${rainier}<rect y="95" width="480" height="75" fill="${water}"/>
  <path d="M0 108 h480 M0 118 h480" stroke="#fff" stroke-opacity=".08"/>${ferry}${fg}${snow&&side==='I'&&!dock?'<rect class="snowline" y="163" width="480" height="7" fill="#eef3f4"/>':''}${smoke?'<rect width="480" height="170" fill="#c98a52" opacity=".35"/>':''}${foggy?'<rect width="480" height="170" fill="#e8ecea" opacity=".55"/>':''}</svg>`; // season
}
function hud(){
  const d=day();
  // season: the HUD date carries the season icon
  return `<div class="hud"><div class="hud-top"><div><div class="hud-day">${DAYS[d]}</div><div class="hud-sub">{{name}} · ${SEA().ic} ${dateTxt(d)} · ${S.story?storyWeekTxt(S):S.mode==='month'?`Week ${S.weekNo+1}/4`:`Day ${d+1} of 7`}</div></div><div style="display:flex;align-items:center;gap:10px"><div class="hud-time">${fmt(S.t)}</div><button class="gear phbtn" onclick="phoneOpen()" aria-label="Open your phone">📱${(()=>{const n=phoneBadgeTotal();return n?`<i class="ph-badge">${n>9?'9+':n}</i>`:''})()}</button><button class="gear" onclick="openSettings()" aria-label="Settings">⚙️</button></div></div>
  <div class="stats">
   <div class="stat"><small>Cash</small><b style="${S.money<0?'color:#ff8a70':''}">${S.money<0?'−':''}$${Math.abs(Math.round(S.money))}</b></div>
   <div class="stat"><small>Food</small><b>${S.pantry}${S.carried?'<span style="font-size:10px;opacity:.7">+'+S.carried+'</span>':''}d</b>${meter(Math.min(100,S.pantry*20),true)}</div>
   <div class="stat"><small>Health</small><b>${S.health}</b>${meter(S.health,true)}</div>
   <div class="stat"><small>Stress</small><b>${S.stress}</b>${meter(S.stress,false)}</div>
   <div class="stat"><small>Job</small><b>${S.emp?S.job:'none'}</b>${meter(S.emp?S.job:0,true)}</div>
   <div class="stat" title="Home condition"><small>Home</small><b>${S.home}</b>${meter(S.home,true)}</div>
  </div></div>`;
}
function render(){
  syncCoop();
  if(S.over) return;
  const loc=S.loc,out=activeOutage(),d=day();
  let h=hud();
  if(out) h+=`<div class="alertbar">🚨 Rider Alert: ferry service suspended (${out.cause}).</div>`;
  else if(powerOut()&&L[S.loc].side==='I') h+=`<div class="alertbar fog">⚡ Power out on the island since ${fmt(S.power.start)}.</div>`;
  else if(S.week.fog[d]&&tod()<660) h+=`<div class="alertbar fog">🌫️ Fog: morning sailings running ${S.week.fog[d]}+ min late.</div>`;
  else if(seasonAlert()) h+=`<div class="alertbar fog">${seasonAlert()}</div>`; // season
  h+=`<div class="scene">${sceneSVG()}<div class="place"><h2>${L[loc].ic} ${L[loc].name}</h2><div>${L[loc].desc}${L[loc].hours&&loc!=='work'?' · '+hoursTxt(loc):''}</div></div></div>`;
  h+=`<div class="content">${tab==='act'?actView():tab==='ferry'?ferryView():tab==='todo'?todoView():logView()}</div>`;
  const pending=todoItems().filter(x=>x.urgent).length;
  h+=`<nav class="tabs">${[['act','🧭','Here'],['ferry','⛴️','Ferry'],['todo','📋','To-do'],['log','📜','Log']].map(([k,i,l])=>`<button class="${tab===k?'on':''}" onclick="setTab('${k}')"><span class="ti">${i}</span>${l}${k==='todo'&&pending?'<span class="dot"></span>':''}${k==='ferry'&&out?'<span class="dot"></span>':''}</button>`).join('')}</nav>`;
  app.innerHTML=withName(h);
  phoneRender();
  achCheck();
  saveGame();
}
window.setTab=k=>{tab=k;render();window.scrollTo(0,0)};
let ACTS=[];
let UPK_OPEN={home:false,yard:false};
function actView(){
  ACTS=[];
  let h='';
  if(uiNarr.length) h+=`<div class="narr">${uiNarr.slice(-4).map(s=>'<p>'+s+'</p>').join('')}</div>`;
  const cars=S.cars.map(c=>`<span class="tag ${c.fuel<1.5?'bad':c.loc===S.loc?'good':''}">${c.diesel?'🛻':c.id==='isl'?'🚗':'🚙'} ${c.loc===S.loc?'here':'at '+L[c.loc].name.replace(' Ferry Landing',' landing').replace(' Ferry Terminal',' terminal')} · ⛽${c.fuel}/${c.tank}</span>`).join('');
  h+=`<div>${cars}${S.homeGas?`<span class="tag">🛢️ ${S.homeGas} gal in shed</span>`:''}${S.homeDiesel?`<span class="tag">🟨 ${S.homeDiesel} gal diesel in shed</span>`:''}${Object.keys(GOODS).filter(g=>S.cargo[g]).map(g=>`<span class="tag ${GOODS[g].law==='ok'?'':GOODS[g].law==='lim'?(S.cargo.diesel>2?'bad':'good'):'bad'}">${GOODS[g].ic} ${S.cargo[g]} ${g==='drugs'?'drug pkg':g==='food'?'food case':g==='med'?'med kit':g+' can'}${S.cargo[g]>1&&g!=='drugs'?'s':''}</span>`).join('')}${S.carried?`<span class="tag">🛍️ ${S.carried}d groceries in hand</span>`:''}${S.cooler?'<span class="tag">🧊 cooler</span>':''}${S.battery==='weak'?'<span class="tag bad">🔋 weak battery</span>':''}${S.cigs>0?`<span class="tag">🚬 ${S.cigs}</span>`:''}<span class="tag ${S.phone<20?'bad':''}">${S.phone>0?'📱':'📵'} ${S.phone}%</span>${S.gen?`<span class="tag ${S.gen==='home'?'good':''}">🔌 ${S.gen==='home'?'generator':'generator in car'}</span>`:''}${S.injury&&!S.injury.treated?'<span class="tag bad">🤕 sprained ankle</span>':''}</div>`;
  const acts=actions();
  h+=marketView();
  {const tv=tipView();h=tv+(tv?'':nextView(acts))+h;} // the guided tip covers the same ground, so one at a time
  const btn=a=>{const i=ACTS.push(a.fn)-1;return `<button class="act ${a.cls||''}" ${a.dis?'disabled':''} onclick="ACT(${i})"><span class="ic">${a.ic}</span><span class="tx"><b>${a.l}</b>${a.s?'<span>'+a.s+'</span>':''}</span></button>`};
  if(acts.length>4){
    const groups={};acts.forEach(a=>{const c=catOf(a);(groups[c]=groups[c]||[]).push(a)});
    const order=Object.keys(ACT_CATS).filter(c=>groups[c]).sort((x,y)=>(groups[y].some(a=>a.cls==='primary')?1:0)-(groups[x].some(a=>a.cls==='primary')?1:0));
    order.forEach(c=>{
      if(c==='home'||c==='yard'){const g=groups[c].slice().sort((x,y)=>(y.due&&!y.dis?1:0)-(x.due&&!x.dis?1:0)),n=g.filter(a=>a.due&&!a.dis).length;
        h+=`<details class="go upk" ${UPK_OPEN[c]?'open':''} ontoggle="UPK_OPEN['${c}']=this.open"><summary>${ACT_CATS[c]}${n?` · <span class="upk-n">${n} to do</span>`:' · all good'}</summary>`+g.map(a=>btn(Object.assign({},a,{cls:((a.cls||'')+(a.due&&!a.dis?' due':'')).trim()}))).join('')+'</details>';return}
      h+=`<div class="sect">${ACT_CATS[c]}</div>`+groups[c].map(btn).join('')});
  } else if(acts.length){h+='<div class="sect">Do something</div>'+acts.map(btn).join('')}
  const dests=Object.keys(L).filter(k=>k!==S.loc&&L[k].side===L[S.loc].side);
  const pOpen=prefs().goOpen,goOpen=pOpen===null||pOpen===undefined?acts.length<=5:pOpen;
  h+=`<details class="go" ${goOpen?'open':''} ontoggle="setPref('goOpen',this.open)"><summary>🧭 Go somewhere${L[S.loc].side==='I'?' on the island':' on the mainland'} (${dests.length})</summary>`;
  dests.forEach(k=>{
    const opts=travelOpts(k);
    h+=`<div class="dest compact"><div class="dn"><b>${L[k].ic} ${L[k].name}</b><span>${L[k].hours?hoursTxt(k):''}</span></div><div class="chips">${opts.map(o=>{const i=ACTS.push(()=>go(k,o))-1;return `<button class="chip" ${o.dis||(o.cost&&o.m==='bus'&&S.money<o.cost)?'disabled':''} onclick="ACT(${i})">${o.l}</button>`}).join('')}</div></div>`;
  });
  h+='</details>';
  if(L[S.loc].side==='I'&&S.loc!=='aiDock') h+=`<p class="small-note" style="color:var(--mute)">To reach the mainland, go to the ferry landing.</p>`;
  if(L[S.loc].side==='M'&&S.loc!=='stDock') h+=`<p class="small-note" style="color:var(--mute)">To get home, head back to the Steilacoom terminal.</p>`;
  return h;
}
window.ACT=i=>{uiNarr=[];sfx('tap');ACTS[i]&&ACTS[i]()};
// ---- "Next up": one suggestion pinned at the top of the Here tab (hide for today with ×) ----
let NEXT_FN=null;
function nextBoat(to,byTod){ // island → mainland appointment: which boat to catch
  if(L[S.loc].side!=='I'||!L[to]||L[to].side!=='M') return null;
  const r=planTrip(to,day()*1440+byTod,0);
  if(r.best) return {txt:`⛴️ ${fmt(r.best.dep)} boat, leave ${fmt(r.best.leave)}`,to,by:byTod};
  if(r.first) return {txt:`⛴️ ${fmt(r.first.dep)} boat gets you there ~${fmt(r.first.arrive)}`,to,by:byTod};
  return {txt:'check the ⛴️ planner',to,by:byTod};
}
function nextUp(acts){
  const d=day(),m=tod(),J=curJob();
  const meet=(ic,to,at,what)=>{
    const here=S.loc===to,b=here?null:nextBoat(to,at);
    const t=here?`${ic} You’re here. ${what} at <b>${fmt(at)}</b>`:m>at?`${ic} Running late: get to ${L[to].name} (${what.toLowerCase()} ${fmt(at)})`:`${ic} Be at ${L[to].name} by <b>${fmt(at)}</b>`;
    return {t:t+(b?' · '+b.txt:''),go:b?()=>{if(planTargets().includes(to)){PLAN.to=to;PLAN.by=at;PLAN.off=0}setTab('ferry')}:()=>setTab('todo')};
  };
  // (a) today's shift
  if(J&&J.days.includes(d)&&!S.worked[d]&&jobStarted(d)&&m<J.start+240) return meet('💼',J.loc,J.start,'Shift');
  // (b) interview today
  const I=S.interview;
  if(I&&I.day===d&&m<=I.time+20) return meet('📝',I.loc,I.time,'Interview');
  // (c) doctor's appointment today (arrive 2:00–2:45)
  if(apptActive()&&d===APPT_DAY&&!S.appt&&!S.apptMissed&&m<=885) return meet('🩺','clinic',870,'Appointment');
  // (d) the most urgent to-do item
  const dueHere=S.loc==='home'&&acts.some(a=>a.due&&!a.dis); // at home, the specific chore (f) beats the general upkeep item
  const u=todoItems().find(x=>x.urgent&&!x.ok&&!x.fail&&!/^Work:|^Interview:/.test(x.l)&&!(dueHere&&x.l==='House & yard upkeep'));
  if(u) return {t:`⚠️ <b>${u.l}</b> · ${u.s}`,go:()=>setTab('todo')};
  // (e) late evening at home
  if(S.loc==='home'&&m>=1260) return {t:`🛏️ Go to bed · alarm: ${alarmTxt()}`,go:()=>nextScroll('.sect,details.upk>summary',ACT_CATS.phone)};
  // (f) a due house or yard task
  if(S.loc==='home'){const a=acts.find(a=>a.due&&!a.dis&&(catOf(a)==='home'||catOf(a)==='yard'));
    if(a){const c=catOf(a);return {t:`${a.ic} Due at home: <b>${a.l}</b>`,go:()=>{UPK_OPEN[c]=true;render();
      nextScroll('details.upk>summary',ACT_CATS[c])}}}}
  return null; // (g) falls through to the player's own #1 priority
}
function nextScroll(sel,label){const el=[...document.querySelectorAll(sel)].find(x=>x.textContent.startsWith(label));
  el&&el.scrollIntoView({block:'start',behavior:document.documentElement.classList.contains('rm')?'auto':'smooth'})}
function nextView(acts){
  NEXT_FN=null;
  if(!S||S.over||S.nextHide===dayKey()) return '';
  const p=(S.prios||[]).find(q=>!q.done);
  let n=null;try{n=nextUp(acts)}catch(e){n=null}
  const pin=p?`📌 Your #1: ${esc(p.t)}`:'';
  if(!n&&p) n={t:pin,go:()=>setTab('todo'),pin:true};
  if(!n) return '';
  NEXT_FN=n.go;const two=p&&!n.pin;
  return `<div class="nextup${two?' two':''}" role="region" aria-label="Next up"><button class="nu-b" onclick="NEXT_GO()"><span class="nu-l"><span class="nu-k">Next up</span>${n.t}</span>${two?`<span class="nu-p" onclick="event.stopPropagation();setTab('todo')">${pin}</span>`:''}</button><button class="nu-x" aria-label="Hide Next up for today" title="Hide for today" onclick="NEXT_HIDE()">✕</button></div>`;
}
window.NEXT_GO=()=>{sfx('tap');NEXT_FN&&NEXT_FN()};
window.NEXT_HIDE=()=>{S.nextHide=dayKey();render()};
const ACT_CATS={work:'💼 Work & errands',ferry:'⛴️ Ferry & travel',trade:'🛒 Food & shopping',home:'🏠 Inside the house',yard:'🌲 Outside & property',fuel:'⛽ Fuel, car & power',phone:'📱 Phone & alarms',here:'🏡 Around here'};
function curJob(){return S&&S.emp?JOBS[S.emp]||null:null}
const dayList=ds=>ds.join()==='0,1,2,3,4'?'weekdays':ds.slice().sort((a,b)=>a-b).map(i=>DAYS[i].slice(0,3)).join(', ');
// ---- guided first day: one tip at a time, each shown once per game ----
const TIPS=[
  {id:'goal',when:()=>day()===0&&S.loc==='home'&&tod()<600,t:'👋 Welcome to the island, {{name}}! Today’s goal: get to work in Lakewood by <b>9:00</b>. Your car is here. Open <b>🧭 Go somewhere</b> below and drive to the <b>Anderson Island Ferry Landing</b>.'},
  {id:'dock',when:()=>S.loc==='aiDock',t:'⛴️ You have to be <b>in line 20 minutes before</b> a boat leaves, or you don’t board. Tap <b>Drive on the next sailing</b>. The ⛴️ Ferry tab has the schedule and a <b>trip planner</b>.'},
  {id:'mainland',when:()=>S.loc==='stDock'&&day()===0&&tod()<720,t:'🌆 Welcome to Steilacoom. Drive to <b>Work (Lakewood)</b>. After work, pick up groceries: your pantry only has a couple of days of food.'},
  {id:'work',when:()=>S.loc===(curJob()?curJob().loc:'work')&&(curJob()?curJob().days.includes(day()):day()<5)&&!S.worked[day()],t:'💼 Tap <b>Work a full shift</b>. The clock jumps to the end of your shift and you get paid.'},
  {id:'groceries',when:()=>L[S.loc].side==='M'&&S.worked[day()]&&S.pantry<=2&&!S.carried,t:'🛒 Groceries are cheaper over here: try the <b>Supermarket (Lakewood)</b>. Then head back to the Steilacoom terminal. Evening boats fill up with cars, so leave time.'},
  {id:'fuel',when:()=>L[S.loc].side==='M'&&carHere()&&carHere().fuel<6,t:'⛽ There’s <b>no gas on the island</b>, and gas cans are banned on the ferry. Fill up at the <b>Gas Station (Steilacoom)</b> while you’re over here.'},
  {id:'bed',when:()=>S.loc==='home'&&tod()>=1080,t:'🛏️ Before bed, set your <b>⏰ alarms</b>: the plug-in clock, your phone, or both as backups. Each night you eat a day of food from the pantry.'},
  {id:'trading',when:()=>!!MARKETS[S.loc]&&!tradingLocked(),t:'🛒 <b>Trading:</b> buy on the mainland, sell on the island for more. Watch the badges: gas cans and drugs are contraband on the ferry.'},
  {id:'storm',when:()=>S.week.storm&&S.week.storm.day===day(),t:'🌬️ A storm means power outages. A <b>generator</b> (Home Depot, Lakewood) plus gas stashed in your shed keeps the fridge, heat and phone going.'},
  {id:'home_low',when:()=>S.loc==='home'&&(S.home??70)<35,t:'🏚️ Your <b>Home</b> meter is low. A run-down house means worse sleep, more things breaking and fewer visitors. A <b>🧽 Deep clean</b> on a day off helps a lot. Too busy? <b>Call Gus</b> or <b>📣 post in the Island Group app</b> on your phone.'},
  {id:'home_meter',when:()=>S.loc==='home'&&(day()>=1||(S.home??70)<60),t:'🏠 The <b>Home</b> meter is how your house is holding up. Chores and repairs raise it; it slips a little every day. Keep it high for better sleep and cozy mornings. Settings ⚙️ has <b>📖 How your house works</b>.'},
  {id:'upkeep_due',when:()=>S.loc==='home'&&upAnyDue(),t:'🧰 Something around the house needs doing. Open <b>🏠 Inside the house</b> or <b>🌲 Outside &amp; property</b> below: jobs that are due are highlighted. Ignore them and they turn into events.'},
  {id:'phone_apps',when:()=>Object.keys(S.friends).length>0||day()>=1,t:'📱 <b>Your phone</b> (top right): text and call friends, set alarms, and install up to <b>5 apps</b> from the 🛍️ App Store, like ferry alerts or the island community group. One bar on the island makes installs slow.'},
  {id:'friends',when:()=>Object.keys(S.friends).length>0,t:'🤝 You made a friend! Friends help out with rides, jump-starts and gas, and they’ll ask favors too. See them in the 📋 To-do tab.'},
];
function tipsOn(){return prefs().tips}
function tradingLocked(){return tipsOn()&&day()===0&&!(S.tips&&S.tips.done)}
function tipView(){
  if(!tipsOn()||!S) return '';
  S.tips=S.tips||{seen:[]};
  const t=TIPS.find(x=>!S.tips.seen.includes(x.id)&&(()=>{try{return x.when()}catch(e){return false}})());
  if(!t) return '';
  return `<div class="tip">💡 ${t.t}<div class="tb"><button onclick="tipSeen('${t.id}')">Got it</button><button onclick="setPref('tips',false);render()">Turn off tips</button></div></div>`;
}
window.tipSeen=id=>{S.tips=S.tips||{seen:[]};if(!S.tips.seen.includes(id))S.tips.seen.push(id);render()};
function catOf(a){
  if(a.cat) return a.cat;
  const t=(a.l||'')+' '+(a.ic||'');
  if(/bingo|Bingo|🎱|🪧/.test(t)) return 'here';
  if(/sailing|ferry|water taxi|terminal|motel|Sleep in|beater|pickup|Can’t drive on|⛴️|🚨/i.test(t)) return 'ferry';
  if(/phone|alarm|Call the Riv|⏰/i.test(t)&&!/gas|fuel/i.test(t)) return 'phone';
  if(/gas|fuel|diesel|tank|car battery|Fill up|generator|Dale|for help|Sam to bring|🔌|🛢️|🟨|⛽/i.test(t)) return 'fuel';
  if(/shift|Work|appointment|Check in|prescription|ankle|Urgent|weekend|office|slot|Too late|medical|job|interview|💼|🩺|💊/i.test(t)) return 'work';
  if(/grocer|food|Buy |cigarettes|cooler|Takeout|delivery|pantry|bulk|🥫|🛒|📦|🍔/i.test(t)) return 'trade';
  return 'here';
}
// ---- trip planner ----
let PLAN={to:null,by:null,off:0};
window.planSet=(k,v)=>{PLAN[k]=k==='to'?v:Number(v);if(k==='to')PLAN.by=null;render()};
function planTargets(){return L[S.loc].side==='I'?['work','clinic','pharmacy','market','wholesale','depot','gas','urgent','office'].filter(k=>L[k]):['home','store','food','dale','lake']}
function defaultBy(to,off){
  const j=curJob();if(j&&to===j.loc) return j.start;
  if(to==='clinic') return 870;
  const now=off?480:tod()+90;return Math.min(1290,Math.ceil(now/30)*30);
}
// extra crossing minutes (the story's dry-dock relief boat adds 5); 27-story-ferry.js wraps it
function crossExtra(side,d,dep){return 0}
function planTrip(to,byAbs,off){
  const side=L[S.loc].side,dockFrom=side==='I'?'aiDock':'stDock',dockTo=side==='I'?'stDock':'aiDock';
  const startLoc=off&&side==='I'?'home':S.loc,toDock=startLoc===dockFrom?0:dist(startLoc,dockFrom);
  const drive=to===dockTo?0:dist(dockTo,to);
  const d=day()+off,dl=deps(side,d),earliest=off?d*1440+300:S.t;
  const opts=[];
  for(const dep of dl){const sl=sailing(side,d,dep,'drive',true);if(sl.cancel||sl.passenger)continue;
    const leave=sl.abs-20-toDock;if(leave<earliest)continue;
    const cx=crossExtra(side,d,dep),arrive=sl.abs+(sl.delay||0)+20+cx+(sl.ketron?10:0)+drive;
    opts.push({dep,abs:sl.abs,leave,inLine:sl.abs-20,arrive,dock:sl.abs+(sl.delay||0)+20+cx+(sl.ketron?10:0),ketron:sl.ketron,delay:sl.delay||0,why:sl.why,full:fullProb(side,d,dep)})} // season: why
  const ok=opts.filter(o=>o.arrive<=byAbs);
  return {best:ok[ok.length-1],safer:ok[ok.length-2],first:opts[0],toDock,drive,dockTo,startLoc};
}
function plannerView(){
  const t=planTargets();if(!PLAN.to||!t.includes(PLAN.to))PLAN.to=t[0];
  const off=PLAN.off||0;let by=PLAN.by;
  if(by==null){const j=curJob();if((j&&PLAN.to===j.loc)||PLAN.to==='clinic')by=defaultBy(PLAN.to,off);
    else{const f=planTrip(PLAN.to,(day()+off)*1440+1439,off).first;by=f?Math.min(1320,Math.ceil((f.arrive-(day()+off)*1440)/15)*15):defaultBy(PLAN.to,off)}}
  const times=[];for(let m=360;m<=1320;m+=15)times.push(m);
  let h=`<div class="plan"><h3>🧭 Trip planner</h3><div class="row2">Get to <select onchange="planSet('to',this.value)">${t.map(k=>`<option value="${k}" ${k===PLAN.to?'selected':''}>${L[k].name}</option>`).join('')}</select>
    by <select onchange="planSet('by',this.value)">${times.map(m=>`<option value="${m}" ${m===by?'selected':''}>${fmt(m)}</option>`).join('')}</select>
    <select onchange="planSet('off',this.value)"><option value="0" ${!off?'selected':''}>today</option><option value="1" ${off?'selected':''}>tomorrow</option></select></div>`;
  if(day()+off>6) return h+'<div class="res">The week ends Sunday night.</div></div>';
  const r=planTrip(PLAN.to,(day()+off)*1440+by,off),o=r.best;
  if(!o){const f=r.first;h+=`<div class="res"><span class="bad">❌ No boat gets you there by ${fmt(by)} ${off?'tomorrow':'today'}.</span>${f?`<br>Earliest: the <b>${fmt(f.dep)}</b> boat (leave ${r.startLoc==='home'?'home':'now'} by <b>${fmt(f.leave)}</b>) arrives at ${L[PLAN.to].name} about <b>${fmt(f.arrive)}</b>.`:''}</div></div>`;return h}
  const spare=(day()+off)*1440+by-o.arrive;
  // season: delays can be ice or a king tide, not just fog
  h+=`<div class="res">Take the <b>${fmt(o.dep)}</b> boat${o.ketron?' (via Ketron)':''}${o.delay?` <span class="warn">(${o.why?'delay':'fog'}: +${o.delay} min)</span>`:''}.<br>
    🚗 Leave ${r.startLoc===S.loc&&!off?'here':L[r.startLoc].name} by <b>${fmt(o.leave)}</b>${r.toDock?` (${r.toDock} min to the landing)`:''}<br>
    🕐 Be in line by <b>${fmt(o.inLine)}</b><br>
    ⛴️ Off the boat at ${L[r.dockTo].name.replace(' Ferry Terminal','').replace(' Ferry Landing','')} about <b>${fmt(o.dock)}</b><br>
    📍 At ${L[PLAN.to].name} about <b>${fmt(o.arrive)}</b> <span class="ok2">(${spare} min to spare)</span>
    ${o.full>=0.2?`<br><span class="warn">⚠️ ${Math.round(o.full*100)}% chance this boat is full of cars.${r.safer?` Safer: the <b>${fmt(r.safer.dep)}</b> (leave by ${fmt(r.safer.leave)}), or walk on.`:' Consider walking on.'}</span>`:''}
    ${(()=>{const c=carHere(),far=L[S.loc].side==='I'?'M':'I',farCar=S.cars.some(x=>L[x.loc].side===far);
      return !c&&!farCar?`<br><span class="warn">🚶 No car with you or waiting on the other side: allow extra time to walk${far==='M'?', bus or rideshare':' or hitch'}.</span>`:!c&&farCar?'<br><span style="font-size:12px;color:var(--mute)">Walk on; your car is waiting on the other side.</span>':''})()}
    <br><span style="font-size:12px;color:var(--mute)">Based on the schedule and alerts known right now. Breakdowns can still surprise you.</span></div></div>`;
  return h;
}
function ferryView(){
  const d=day(),out=activeOutage();
  const col=(side,deps)=>deps.map(dep=>{const s=sailing(side,d,dep,'walk',true);const abs=d*1440+dep;
    const past=abs<S.t;const st=s.cancel?`<span class="st x">CANCELED</span>`:s.passenger?`<span class="st p">PASS. ONLY</span>`:s.delay?`<span class="st d">+${s.delay} late</span>`:`<span class="st ok">${s.ketron?'via Ketron':'on time'}</span>`;
    return `<div class="row ${past?'past':''}"><span>${fmt(dep)}</span>${st}</div>`}).join('');
  let h=plannerView()+`<div class="board"><h3>⛴️ Today’s sailings · ${DAYS[d]}</h3><div style="font-size:12px;color:#9fc0c8">Status as of ${fmt(S.t)}. Things can change without warning.</div>
   <div class="cols"><div><div class="colh">Leave Anderson Is.</div>${col('I',deps('I',day()))}</div><div><div class="colh">Leave Steilacoom</div>${col('M',deps('M',day()))}</div></div></div>`;
  const alerts=S.week.b.filter(b=>b.start<=S.t).map(b=>`<p>🚨 <b>${fmtAbs(b.start)}</b>: service suspended, ${b.cause}. ${S.t>=b.end?`<span style="color:var(--good)">Restored ${fmtAbs(b.end)}.</span>`:'<b>No restoration estimate.</b>'}</p>`).join('');
  h+=`<div class="sect">Rider alerts</div><div class="rules">${alerts||'<p>No active alerts. Enjoy it while it lasts.</p>'}${d===0?'<p>⛽ Monday fuel run: 9:35 AM Steilacoom and 11:30 AM Anderson Island sailings canceled.</p>':''}${seasonFerryNote()}</div>`; // season
  h+=`<div class="sect">Fuel & the ferry (current situation)</div><div class="rules">
  <p>⛽ <b>No gas or diesel is sold on Anderson Island.</b> The General Store, the island’s only gas station, closed Feb 2, 2026. A food co-op hopes to reopen it and the pumps in 2027.</p>
  <p>🚫 <b>Gasoline:</b> allowed aboard only in a vehicle’s or boat’s own built-in tank. Spare gas cans, <b>full or empty</b>, are prohibited. County policy cites federal hazmat rules for ferries (49 CFR 176.76) and state law (RCW 9.91.025, unlawful transit conduct). Violators must dispose of the fuel and container, can be cited, and repeat offenders can be barred from the ferry.</p>
  <p>✅ <b>Exemptions the county allows:</b></p>
  <p>• <b>Diesel:</b> up to two 5-gallon DOT-approved containers in a vehicle, marked as diesel, sealed, upright and secured. A DOT-approved slip tank fastened in a pickup bed is also allowed.<br>• <b>Trailered boats:</b> two Coast Guard-approved outboard fuel tanks, up to 6 gallons each.<br>• <b>Propane:</b> up to two portable tanks (each ≤100 lb water capacity), shut off and secured, plus RV tanks.<br>• <b>Fuel runs:</b> tankers cross on Monday runs. With hazmat aboard, only essential personnel (crew and the tanker driver) may ride, so those sailings are closed to the public.</p>
  <p>⚖️ <b>Status:</b> Washington State Ferries carries gas cans under a federal hazmat special permit. Pierce County’s ferry has none. In January 2026 the island’s citizens’ advisory board petitioned to allow cans, and the Coast Guard reportedly signaled it might approve 2-gallon cans if the county applied. On Feb 28, 2026, the County Executive refused, citing about $250K in startup costs, $300–500K a year, and passenger capacity dropping from 325 to 16 on sailings carrying cans. As of mid-2026 the ban stands and the advisory board is still working on a permit approach.</p>
  <p class="small-note" style="color:var(--mute)">In the game, Dale and “smuggled gas” are fiction. Smuggling gas on a passenger ferry is illegal and a real fire hazard.</p></div>`;
  h+=`<div class="sect">Trading: what’s legal on the boat</div><div class="rules">
  <p>🥫🩹 <b>Food and medical supplies:</b> legal to buy, sell and carry.</p>
  <p>🟨 <b>Diesel:</b> two 5-gal DOT cans per vehicle. Extras, or diesel carried on foot, get left on the dock.</p>
  <p>🟥 <b>Gasoline cans:</b> legal to sell, banned on the ferry. Caught: $150 citation, can seized. Second time: barred from the ferry.</p>
  <p>📦 <b>Illicit drugs:</b> illegal everywhere. Caught at the ferry or by an undercover buyer: arrest, $750 bail, five hours lost, and a big hit to your job. A second arrest ends the game.</p>
  <p>Inspection odds go up with every contraband item you carry, and way up when the sheriff’s task force rides the boat. The neighbor’s sailboat isn’t inspected.</p></div>`;
  h+=`<div class="sect">How the ferry works</div><div class="rules">
  <p>🕐 <b>Be in line 20 minutes before departure</b>, cars and walk-ons alike, or you don’t board.</p>
  <p>💵 Fares are collected at Steilacoom only (round trip): ${$(fareCar())} with a car, ${$((typeof fareWalk==='function'?fareWalk():FARE_WALK))} on foot. Leaving the island is free.</p>
  <p>🚗 Commute-hour boats fill up with cars. Friday afternoon and Sunday evening are the worst. Walk-ons always fit.</p>
  <p>🔧 When the boat breaks down there’s no second boat this time of year. Long outages eventually get a passenger-only backup.</p>
  <p class="small-note" style="color:var(--mute)">This is a game schedule, inspired by the real Steilacoom–Anderson Island–Ketron route. For real sailings, check Pierce County’s ferry page.</p></div>`;
  return h;
}
function todoItems(){
  const d=day(),m=tod(),it=[];
  const J=curJob();
  if(J) J.days.slice().sort((a,b)=>a-b).filter(i=>jobStarted(i)).forEach(i=>it.push({ok:!!S.worked[i],fail:(i<d&&!S.worked[i])||(i===d&&m>=J.start+240&&!S.worked[i]),l:`Work: ${DAYS[i]}`,s:S.worked[i]?(S.late[i]?`Done, ${S.late[i]} min late`:'Done, on time'):`${fmt(J.start)}–${fmt(J.end)}, ${L[J.loc].name}`,urgent:i===d&&!S.worked[i]&&m<J.start+240}));
  else it.push({ok:false,fail:false,l:'Find a job',s:'🔎 Look for a job in the 💼 Gig Work app or on the bulletin board at the old store, then make the interview.',urgent:!S.interview});
  if(S.interview) it.push({ok:false,fail:false,l:`Interview: ${JOBS[S.interview.job].n}`,s:`${ivDay(S.interview)} ${fmt(S.interview.time)} at ${L[S.interview.loc].name}`,urgent:S.interview.day===d});
  if(apptActive()) it.push({ok:S.appt,fail:S.apptMissed||(d>APPT_DAY)||(d===APPT_DAY&&m>885&&!S.appt),l:'Doctor’s appointment',s:`${DAYS[APPT_DAY]} 2:30 PM, Medical Clinic (Tacoma). Arrive 2:00–2:45.`,urgent:d===2&&!S.appt&&m<=885});
  it.push({ok:S.rx,fail:false,l:'Pick up prescription refill',s:d<3?'Ready Thursday at the Lakewood pharmacy. Run out Saturday night.':'Ready now at the Lakewood pharmacy.',urgent:d>=3&&!S.rx});
  it.push({ok:S.pantry>=2,fail:false,l:'Keep the pantry stocked',s:`${S.pantry} day${S.pantry===1?'':'s'} at home${S.carried?`, ${S.carried} in hand`:''}. You eat 1 per night.`,urgent:S.pantry<1});
  const isl=S.cars.find(c=>c.id==='isl');
  it.push({ok:isl.fuel>=3,fail:false,l:`Keep gas in the ${isl.diesel?'truck':'island car'}`,s:`${isl.fuel}/${isl.tank} gal. No gas on the island: fill up on the mainland, or pay Dale.`,urgent:isl.fuel<1.5});
  if(stormKnown()) it.push({ok:genReady()&&S.homeGas>=3,fail:false,l:'Be ready for the storm',s:`${S.week.storm.day===d?`Gale today, from about ${fmt(S.week.storm.start)}`:`Gale tomorrow (${DAYS[S.week.storm.day]}): 🌦️ Tides & Weather saw it coming`}. You need a generator at home (Home Depot, Lakewood) and 3 gal stashed in the shed (${S.homeGas} now), or the fridge dies.`,urgent:S.week.storm.day===d&&S.homeGas<3});
  if(d<=2) it.push({ok:S.bingo.nights>0,fail:d===2&&tod()>=1200&&!S.bingo.nights,l:'Optional: Bingo at the Riv',s:`Wednesday 6:00 PM, American Legion. Benefits the ${BINGO_FOR[S.week.bingo]}.`,urgent:false});
  if(S.battery==='weak') it.push({ok:false,fail:false,l:'Replace the car battery',s:'Gas station in Steilacoom. Until then, mornings are a gamble.',urgent:false});
  {const U=UP(),due=[U.fridge&&'fridge',U.mold&&'mold',U.damp>=3&&'damp',U.ash>=3&&'ash',U.chimney>=21&&'chimney',U.wood<=1&&'firewood',U.septic>=75&&'septic',U.gutters>=60&&'gutters',U.limbs>=60&&'tree limbs',U.well>45&&'well',U.moss>=60&&'roof moss',U.pot>=60&&'potholes',S.gen==='home'&&U.genSvc>14&&'generator',U.propane<25&&'propane'].filter(Boolean);
   it.push({ok:!due.length,fail:false,l:'House & yard upkeep',s:due.length?`Needs attention: ${due.join(', ')}. See 🏠 and 🌲 at home.`:'Everything’s in good shape.',urgent:due.length>=3});}
  it.push({ok:S.home>=50,fail:false,l:'Keep the house in shape',s:`🏠 Home ${S.home}/100. It slips every day. Below ${HOME_LOW}: worse sleep, more breakdowns, fewer visitors. ${HOME_HIGH}+: better rest and cozy mornings.`,urgent:S.home<HOME_LOW});
  if(S.injury) it.push({ok:S.injury.treated,fail:false,l:'Get your ankle treated',s:'Urgent Care in DuPont, 8 AM–8 PM. Nothing on the island.',urgent:!S.injury.treated});
  hhTodo(it);
  return it;
}
// ---- my priorities: the player's own editable, ordered list (saved with the game) ----
const PRIO_MAX=15, PRIO_LEN=80;let PRIO_ED='';
function prioView(){
  const P=S.prios||[],open=P.filter(q=>!q.done).length;
  let rank=0;
  const rows=P.map((q,i)=>{const r=q.done?'✓':++rank;return `<div class="prio ${q.done?'done':''}"><span class="rk">${r}</span><span class="pt" onclick="prioToggle(${i})" title="Tap to mark done">${esc(q.t)}</span><span class="pb">
    <button aria-label="Move up" ${i===0?'disabled':''} onclick="prioMove(${i},-1)">▲</button><button aria-label="Move down" ${i===P.length-1?'disabled':''} onclick="prioMove(${i},1)">▼</button><button aria-label="Edit" onclick="prioEdit(${i})">✏️</button><button aria-label="Delete" onclick="prioDel(${i})">🗑️</button></span></div>`}).join('');
  return `<div class="sect">My priorities${P.length?` · ${open} open`:''}</div>`+
    (rows||'<div class="prio-empty">Your own list, in your order. Add anything, or tap 📌 on an item above. Tap an item to check it off.</div>')+
    (P.length<PRIO_MAX?`<div class="prio-add"><input id="prioIn" maxlength="${PRIO_LEN}" placeholder="Add a priority…" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();prioAdd(this.value,true)}"><button onclick="prioAdd(document.getElementById('prioIn').value,true)">Add</button></div>`:`<div class="prio-empty">That’s ${PRIO_MAX}: the most the list holds.</div>`)+
    (P.some(q=>q.done)?`<div class="prio-add"><button onclick="prioClear()">Clear checked-off items</button></div>`:'');
}
function prioSave(focus){render();if(focus)setTimeout(()=>{const i=document.getElementById('prioIn');i&&i.focus()},0)}
window.prioAdd=(t,focus)=>{t=String(t||'').replace(/\s+/g,' ').trim().slice(0,PRIO_LEN);if(!t)return;S.prios=S.prios||[];if(S.prios.length>=PRIO_MAX)return;
  S.prios.push({t,done:false});sfx&&sfx('info');prioSave(focus)};
window.prioToggle=i=>{const q=S.prios[i];if(!q)return;q.done=!q.done;
  if(q.done){S.prios.splice(i,1);S.prios.push(q)}else{S.prios.splice(i,1);const k=S.prios.findIndex(x=>x.done);S.prios.splice(k<0?S.prios.length:k,0,q)}prioSave()};
window.prioMove=(i,dir)=>{const P=S.prios,j=i+dir;if(j<0||j>=P.length)return;[P[i],P[j]]=[P[j],P[i]];prioSave()};
window.prioDel=i=>{S.prios.splice(i,1);prioSave()};
window.prioClear=()=>{S.prios=S.prios.filter(q=>!q.done);prioSave()};
window.prioEdit=i=>{const q=S.prios[i];if(!q)return;PRIO_ED=q.t;
  modal('✏️ Edit priority',`<input class="nm-in" id="prioEd" maxlength="${PRIO_LEN}" autocomplete="off" value="${esc(q.t)}" oninput="PRIO_ED=this.value" onkeydown="if(event.key==='Enter'){event.preventDefault();MBTN(0)}">`,[
    {l:'Save',fn:()=>{const v=String(PRIO_ED).replace(/\s+/g,' ').trim().slice(0,PRIO_LEN);if(v)q.t=v}},
    {l:'Cancel',fn:()=>{}}]);
  setTimeout(()=>{const e=document.getElementById('prioEd');if(e){e.focus();e.select()}},60)};
function todoView(){
  const fr=Object.values(S.friends);
  const P=S.prios||[];
  return `<div class="sect">This week</div>`+todoItems().map(x=>`<div class="todo"><span class="ck">${x.ok?'✅':x.fail?'❌':x.urgent?'⚠️':'⬜'}</span><div><b>${x.l}</b><span>${x.s}</span></div>${!x.ok&&!x.fail&&!P.some(q=>q.t===x.l&&!q.done)&&P.length<PRIO_MAX?`<button class="pin" title="Add to my priorities" onclick="prioAdd(${esc(JSON.stringify(x.l))})">📌</button>`:''}</div>`).join('')+
  prioView()+
  ((S.quests||[]).some(q=>!q.done)?`<div class="sect">Favors</div>`+S.quests.filter(q=>!q.done).map(q=>{const F=FAVORS[q.who];return `<div class="todo"><span class="ck">🙏</span><div><b>${S.friends[q.who]?S.friends[q.who].name.split(',')[0]:''}: ${F.t.split(' (')[0]}</b><span>${q.step==='buy'?`Buy it at ${L[F.at].name}`:q.step==='deliver'?`Deliver at ${L[F.back].name}`:`At ${L[F.at].name}`} · due ${DAYS[q.due]}</span></div></div>`}).join(''):'')+
  (fr.length?`<div class="sect">Island friends</div>`+Object.entries(S.friends).map(([id,f])=>`<div class="todo"><span class="ck">${'💛'.repeat(f.lvl||1)}</span><div><b>${typeof npcIc==='function'?npcIc(id):''}${f.name} · ${LVL_NAME[f.lvl||1]}</b><span>Met ${DAYS[f.day]}: ${f.how}.${(PERKS[id]||{})[(f.lvl||1)+1]?` Next: ${(PERKS[id]||{})[(f.lvl||1)+1]}`:''}</span></div></div>`).join(''):'')+
  `<div class="sect">Survive until Sunday night</div><div class="rules"><p>Out of cash? Ferry fares, rideshares, motels, groceries and your prescription go on the credit card (groceries and prescriptions up to $1,500), and it counts against your score.</p><p>Health 0: medevac off the island. Job 0: fired. Stress is everything.</p><p>Score: cash + health + job − stress, plus bonuses for not getting stranded.</p></div>`;
}
function logView(){return `<div class="log">${S.log.slice().reverse().map(e=>`<p><em>${DAYS[Math.floor(e.t/1440)].slice(0,3)} ${fmt(e.t)}</em>${e.s}</p>`).join('')}</div>`}

// ---------------- modal & crossing ----------------
let MB=[];
let MQ=[];
function modal(title,body,btns,noClose){
  if(document.getElementById('mbg')){MQ.push([title,body,btns,noClose]);return}
  MB=btns;
  const el=document.createElement('div');el.className='modal-bg';el.id='mbg';if(noClose)el.dataset.lock='1';
  el.innerHTML=withName(`<div class="modal"><h2>${title}</h2><div class="mb">${body}</div>${btns.map((b,i)=>`<button class="act ${i===0&&!b.dis?'primary':''}" ${b.dis?'disabled':''} onclick="MBTN(${i})"><span class="tx"><b>${b.l}</b>${b.s?'<span>'+b.s+'</span>':''}</span></button>`).join('')}</div>`);
  document.body.appendChild(el);
}
window.MBTN=i=>{if(MB[i]&&MB[i].dis)return;const el=document.getElementById('mbg');el&&el.remove();const f=MB[i]&&MB[i].fn;f&&f();
  if(!document.getElementById('mbg')&&MQ.length&&S&&!S.over){const q=MQ.shift();modal(...q)}
  if(S&&!S.over&&!document.querySelector('.title,.end'))render()};
function crossing(side,cap,cap2,done,sail){
  const el=document.createElement('div');el.className='cross';sfx(sail?'info':'horn');
  const rev=side==='M';
  const boat=sail?`<g><path d="M0 40 h70 l-10 14 h-50 z" fill="#f4f1ea"/><path d="M34 38 V-30 L70 34 Z" fill="#fff"/><path d="M32 36 V-10 L6 34 Z" fill="#e3e0d6"/></g>`
    :`<g><rect x="0" y="20" width="120" height="20" rx="4" fill="#f4f1ea"/><rect x="0" y="34" width="120" height="8" fill="#2f5d4a"/><rect x="42" y="4" width="36" height="17" fill="#f4f1ea"/><rect x="46" y="8" width="28" height="6" fill="#2a3d45"/><rect x="56" y="-8" width="7" height="12" fill="#e3642e"/></g>`;
  el.innerHTML=`<svg viewBox="0 0 480 260"><rect width="480" height="260" fill="#12313b"/><rect y="150" width="480" height="110" fill="#1d4b5a"/>
   <path d="M0 150 q40 -30 90 -20 l20 20z" fill="#2f5d4a"/><path d="M380 150 q50 -40 100 -25 v25z" fill="#2f5d4a"/>
   <text x="20" y="180" fill="#9fc0c8" font-size="12" font-family="DM Sans">${rev?'Anderson Is.':'Anderson Is.'}</text><text x="460" y="180" text-anchor="end" fill="#9fc0c8" font-size="12" font-family="DM Sans">${rev?'Steilacoom':'Steilacoom'}</text>
   <g transform="translate(40,${sail?100:110})"><g class="boat ${rev?'rev':''}"><g class="bob">${boat}</g></g></g>
   <path d="M0 200 h480 M0 222 h480" stroke="#fff" stroke-opacity=".08"/></svg>
   <div class="cap">${cap}</div><div class="cap2">${cap2}</div><div class="cap2" style="margin-top:18px">tap to skip</div>`;
  document.body.appendChild(el);
  let fin=false;const end=()=>{if(fin)return;fin=true;el.remove();done()};
  el.onclick=end;setTimeout(end,prefs().rm?900:2900);
}

