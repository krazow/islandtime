// ---------------- 📱 apps: travel (⛴️ Ferry Pass, 🚗 Island Rides, 🌦️ Tides & Weather) ----------------
// Three installable apps (plug-in pattern from 14-phone-apps.js). State: PH().fp, PH().wx, S.ev.flags.irides.
// Ferry Pass: next sailings (known outages only), rider alerts, the last boat, 10-ride ticket books (used where fares
//   are charged: Steilacoom; see the // apps hook in board(), 02-ferry.js), and push alerts the moment an outage is known.
// Island Rides: a neighbor drives you to or from the island ferry landing. Adds a 🚗 option to the travel chips (wraps
//   travelOpts() and go(), like the 🤝 Ride with Sam option).
// Tides & Weather: a forecast built only from what genWeek() already rolled (no Math.random here), plus a tide table.
const apEsc=s=>typeof esc==='function'?esc(s):String(s);
const apCard=(h,cls)=>`<div class="ph-card ${cls||''}">${h}</div>`;
const apNote=h=>`<p class="ph-note">${h}</p>`;
const apLi=(a,b,cls)=>`<div class="ph-li ${cls||''}"><b>${a}</b><span>${b}</span></div>`;

// ================= ⛴️ Ferry Pass =================
const FP_BOOK={car:{n:'Vehicle + driver',ic:'🚗',fare:()=>FARE_CAR},walk:{n:'Passenger (walk-on)',ic:'🚶',fare:()=>FARE_WALK}};
const FP_RIDES=10,FP_OFF=0.25,FP_MAX=30;
const fpPrice=k=>Math.round(FP_BOOK[k].fare()*FP_RIDES*(1-FP_OFF)*100)/100;
function FP(){const P=PH();const f=P.fp=P.fp||{};f.car=f.car||0;f.walk=f.walk||0;f.seen=f.seen||[];return f}
function fpBuy(k){const f=FP(),p=fpPrice(k);if(S.money<p||f[k]+FP_RIDES>FP_MAX||!phoneCan())return false;
  money(-p);S.stats.fares+=p;f[k]+=FP_RIDES;S.t+=1;phoneUse(1);
  say(`🎟️ Ferry Pass: bought a 10-crossing ${k==='car'?'vehicle + driver':'walk-on'} book for ${$(p)}. ${f[k]} ride${f[k]===1?'':'s'} on your phone.`);
  afterAction();return true}
// Called from board() where the fare is charged. true = a ride from the book paid for this crossing.
function fpUseRide(mode){if(!S||!phoneInstalled('ferrypass'))return false;const f=FP(),k=mode==='drive'?'car':'walk';
  if(!(f[k]>0))return false;
  if(!phoneCan()){say('🪫 Your ferry tickets are on a dead phone. The ticket booth wants cash. You pay full fare.');return false}
  f[k]--;S.stats.fpRides=(S.stats.fpRides||0)+1;
  say(`🎟️ The booth scans your phone. One ${k==='car'?'vehicle':'walk-on'} ride used, ${f[k]} left.${f[k]===0?' That was the last one in the book.':''}`);
  return true}
function fpSailings(side,n){const deps=side==='I'?AI_DEPS:ST_DEPS,out=[];
  for(let d=day();d<day()+3&&out.length<n;d++)for(const dep of deps){if(out.length>=n)break;
    const s=sailing(side,d,dep,'walk',true);if(S.t>s.abs-20||s.cancel)continue;out.push(s)}
  return out}
function fpLastBoat(side){const deps=side==='I'?AI_DEPS:ST_DEPS;
  for(let i=deps.length-1;i>=0;i--){const s=sailing(side,day(),deps[i],'walk',true);if(s.cancel)continue;return s.abs>=S.t-20?s:null}return null}
const fpKey=b=>`${S.weekNo}:${b.start}`;
// push alerts: the first moment a breakdown is known (S.t has passed its start), once per outage, phone closed or not
phoneOnTime(()=>{if(!S||!S.week||!phoneInstalled('ferrypass')||!phoneCan())return;const f=FP();
  for(const b of S.week.b){if(b.start>S.t||b.end<=S.t)continue;const k=fpKey(b);if(f.seen.includes(k))continue;
    f.seen.push(k);if(f.seen.length>24)f.seen.splice(0,f.seen.length-24);
    if((S.loc==='aiDock'||S.loc==='stDock')&&S.t===b.start)continue;   // you’re standing in the line: waitFerry() already told you
    const cause=b.cause[0].toUpperCase()+b.cause.slice(1);
    phoneNotify('⛴️','Ferry Pass: sailings suspended',cause);
    say(`📱 ⛴️ <b>Ferry Pass</b> (${fmt(S.t)}): rider alert, sailings suspended: ${apEsc(b.cause)}. No estimate yet. Your phone knew before the ferry line did.`);
  }});
definePhoneApp({id:'ferrypass',name:'Ferry Pass',ic:'⛴️',order:65,size:'26 MB',desc:'Sailings, rider alerts, push alerts for outages, and 10-ride ticket books at 25% off.',
  badge:()=>activeOutage()?1:0,
  view(){const side=L[S.loc].side,from=side==='I'?'Anderson Island':'Steilacoom',d=day(),f=FP();let h='';
    const known=S.week.b.filter(b=>b.start<=S.t&&b.end>S.t);
    for(const b of known)h+=apCard(`🚨 <b>Rider alert:</b> service suspended (${apEsc(b.cause)}). The county hasn’t said when it’ll be back.`,'warn');
    const fog=S.week.fog[d]&&tod()<660;
    if(fog)h+=apCard(`🌫️ <b>Fog:</b> morning sailings running ${S.week.fog[d]}+ min late.`,'warn');
    const sa=typeof seasonAlert==='function'?seasonAlert():'';
    if(sa&&!/smoke/i.test(sa))h+=apCard(sa,'warn');
    if(!known.length&&!fog&&!sa)h+=apCard('✅ No alerts right now. Enjoy it.','ok');
    h+=`<div class="ph-sub">Next sailings from ${from}</div>`;
    const nx=fpSailings(side,3);
    h+=nx.length?nx.map(s=>apLi(fmtAbs(s.abs),s.passenger?'🚶 passenger-only backup boat':s.delay?`${s.why&&/ice|Snow/i.test(s.why)?'🧊':s.why&&/tide/i.test(s.why)?'🌊':'🌫️'} ~${s.delay} min late`:'on time')).join(''):apLi('—','No sailings found.');
    const lb=fpLastBoat(side);
    h+=apCard(lb?`🌙 <b>Last boat tonight:</b> ${fmt(lb.dep)} from ${from}${lb.passenger?' (passenger-only)':''}.`:`🌙 <b>No more boats from ${from} tonight.</b>`);
    h+=`<div class="ph-sub">Ticket books</div>`;
    h+=apCard(`🎟️ <b>On your phone:</b> ${FP_BOOK.car.ic} ${f.car} vehicle ride${f.car===1?'':'s'} · ${FP_BOOK.walk.ic} ${f.walk} walk-on ride${f.walk===1?'':'s'}`,'fp-books');
    for(const k of ['car','walk']){const p=fpPrice(k),full=f[k]+FP_RIDES>FP_MAX,poor=S.money<p;
      h+=phBtn(`${FP_BOOK[k].ic} 10 × ${FP_BOOK[k].n}: ${$(p)}`,()=>fpBuy(k),{dis:full||poor,
        sub:full?`You already have ${f[k]}. That’s plenty.`:poor?`You have ${$(S.money)}.`:`${$(FP_BOOK[k].fare()*FP_RIDES)} at the booth. ${Math.round(FP_OFF*100)}% off.`})}
    h+=apNote('Fares are collected in Steilacoom only (leaving the island is free), so a ride is used there. A dead phone means paying cash.');
    h+=apNote('🔔 Push alerts are on: you’ll hear about an outage the minute the county posts it. Be in line 20 minutes before a boat leaves.');
    return h}});

// ================= 🚗 Island Rides =================
// S.ev.flags.irides = {at: pickup time, until: offer expires, cost, who: NEIGHBORS index}. Cleared weekly with the other flags.
const IR=()=>S.ev.flags.irides||null;
function irOpen(m){m=m==null?tod():m;return m>=300&&m<1380}   // no drivers 11 PM–5 AM
function irLive(){const R=IR();return !!R&&S.t<R.until&&L[S.loc].side==='I'}
function irCarWhy(){const c=S.cars.find(x=>x.id==='isl')||S.cars[0],here=carHere();
  if(here&&here.fuel<1)return '⛽ Your car is out of gas.';
  if(S.battery==='weak'||S.battery==='dead')return '🔋 Your car battery is a gamble.';
  if(!here&&c&&L[c.loc]&&L[c.loc].side==='M')return '🚗 Your car is on the mainland.';
  if(!here)return '🚗 Your car isn’t here.';
  return '';}
function irDriver(i){const N=typeof NEIGHBORS!=='undefined'?NEIGHBORS:[['marta','Marta, from up the road','']];return N[((i%N.length)+N.length)%N.length]}
function irRequest(){
  if(L[S.loc].side!=='I'||!phoneCan()||!irOpen()||irLive())return false;
  const m=tod(),late=m<420||m>=1260;
  const wait=10+Math.floor(Math.random()*21)+(late?15+Math.floor(Math.random()*16):0);
  const cost=8+Math.floor(Math.random()*5),who=Math.floor(Math.random()*64);
  S.t+=2;phoneUse(1);   // one bar: the request takes a couple of minutes to go through
  S.ev.flags.irides={at:S.t+wait,until:S.t+wait+60,cost,who};
  const D=irDriver(who),nm=D[1].split(',')[0];
  say(`🚗 Island Rides: <b>${apEsc(nm)}</b> can pick you up around ${fmt(S.t+wait)} for $${cost}. Look for the 🚗 option when you go somewhere.`);
  afterAction();return true}
function irCancel(){if(!IR())return;delete S.ev.flags.irides;say('🚗 You cancel the ride. Somewhere a neighbor turns the car back off.')}
// the travel option: to the landing from anywhere on the island, or from the landing to anywhere on the island
{const _travelOpts=travelOpts;travelOpts=function(dest){const o=_travelOpts(dest);   // apps: Island Rides
  try{if(irLive()&&L[dest]&&L[dest].side==='I'&&(dest==='aiDock'||S.loc==='aiDock')){const R=IR(),base=dist(S.loc,dest);
    o.unshift({m:'irides',l:`🚗 Island Rides ${base}m${R.at>S.t?' · '+fmt(R.at):''} · $${R.cost}`,min:base,cost:R.cost,dis:S.money<R.cost})}}catch(e){console.error(e)}
  return o}}
{const _go=go;go=function(dest,o){   // apps: Island Rides
  if(o&&o.m==='irides'&&!o.midDone&&!o.started){const R=IR();
    if(!R||S.t>=R.until){say('🚗 Your Island Rides driver gave up and went home.');return afterAction()}
    const wait=Math.max(0,R.at-S.t);S.t+=wait;S.stats.waited+=wait;delete S.ev.flags.irides;
    const D=irDriver(R.who),nm=D[1].split(',')[0];
    say(`🚗 ${wait?`After ${wait} minutes, `:''}${apEsc(nm)} pulls up in a dusty minivan${wait?'':' right on time'}. $${R.cost}, Venmo, and a full update on the island’s septic politics on the way.`);
    adj('stress',-2);
    if(!S.friends[D[0]]&&Math.random()<0.2)meet(D[0],D[1],'drove you through Island Rides');
    else if(S.friends[D[0]]&&Math.random()<0.3)friendPts(D[0],1);
    o=Object.assign({},o,{min:dist(S.loc,dest)})}
  return _go(dest,o)}}
definePhoneApp({id:'rides',name:'Island Rides',ic:'🚗',order:66,size:'31 MB',desc:'A neighbor drives you to or from the ferry landing. $8–12. No drivers 11 PM–5 AM.',
  badge:()=>irLive()&&IR().at<=S.t?1:0,
  view(){const R=IR(),isl=L[S.loc].side==='I';let h='';
    if(!isl)return apCard('🌉 <b>Island Rides only works on Anderson Island.</b> Over here, it’s 📱 Rideshare like everybody else.','warn')+apNote('Back on the island, request a ride to or from the ferry landing.');
    if(irLive()){const D=irDriver(R.who),nm=apEsc(D[1].split(',')[0]);
      h+=apCard(R.at>S.t?`⏳ <b>${nm}</b> is on the way: pickup around <b>${fmt(R.at)}</b>, $${R.cost}.`:`🚗 <b>${nm}</b> is here, idling in the driveway. Ride offer good until ${fmt(R.until)}.`,'ok');
      h+=apNote(`Tap the 🚗 Island Rides option ${S.loc==='aiDock'?'next to where you’re going':'next to the ferry landing'} under 🧭 Go somewhere.`);
      h+=phBtn('Cancel the ride',()=>irCancel(),{sub:'No charge. Island karma takes a small hit.'});
      return h}
    if(R&&S.t>=R.until)delete S.ev.flags.irides;
    const why=irCarWhy();if(why)h+=apCard(why,'warn');
    h+=apNote('Neighbors with cars and free time. Rides go to the ferry landing, or from the landing to anywhere on the island.');
    if(!irOpen()){h+=apCard('🌙 <b>No drivers 11 PM–5 AM.</b> Everyone on this island is asleep, or pretending to be.','warn');
      h+=phBtn('🚗 Request a ride',()=>{},{dis:true,sub:'Try again at 5 AM.'});return h}
    const m=tod(),late=m<420||m>=1260;
    h+=phBtn('🚗 Request a ride',()=>irRequest(),{cls:'primary',sub:`$8–12. Pickup in ${late?'25–60':'10–30'} min${late?' (it’s early/late: fewer drivers)':''}. One bar, so the request takes a couple of minutes.`});
    return h}});

// ================= 🌦️ Tides & Weather =================
// Deterministic per week/day (FNV hash), so looking at the forecast never moves the game’s Math.random() sequence.
function wxR(d,k){let h=2166136261;for(const c of `${S.weekNo}|${seasonId()}|${d}|${k}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h/4294967296}
const wxN=(d,k,a,b)=>a+Math.floor(wxR(d,k)*(b-a+1));
function WX(){const P=PH();return P.wx=P.wx||{}}
function wxStorm(d){const st=S.week.storm;if(!st)return null;const a=d*1440+360,b=(d+1)*1440;   // a gale during this day (6 AM–midnight)?
  if(st.start<b&&st.end>a)return {first:st.day===d,start:st.start,end:st.end};return null}
// one day of forecast. rel = days from today: 0–1 = full detail, 2+ = lower confidence
function wxDay(d){const s=seasonId(),X=seaX(),rel=d-day(),sure=rel<=1,w=[];
  let hi,lo,rain,ic,sum;
  if(s==='winter'){hi=wxN(d,'hi',36,44);lo=wxN(d,'lo',28,34);rain=10*wxN(d,'rain',3,8)}
  else if(s==='summer'){hi=wxN(d,'hi',71,82);lo=wxN(d,'lo',52,58);rain=10*wxN(d,'rain',0,1)}
  else{hi=wxN(d,'hi',45,53);lo=wxN(d,'lo',36,43);rain=10*wxN(d,'rain',4,9)}
  ic=rain>=70?'🌧️':rain>=40?'🌦️':s==='summer'?'☀️':'⛅';sum=rain>=70?'Rain':rain>=40?'Showers':s==='summer'?'Sunny':'Cloudy';
  const g=wxStorm(d);
  if(g){rain=100;ic='🌬️';sum=sure?'Gale':'Windy, maybe a gale';
    w.push(sure?(g.first?`🌬️ <b>Gale warning</b> from about ${fmt(g.start)}: gusts to 55 mph. Expect the ferry to stop and the power to go out.`:`🌬️ <b>Gale continues</b> until about ${fmtAbs(g.end)}.`)
      :'🌬️ A big Pacific system may arrive around here. Low confidence: check back.')}
  if(s==='winter'){
    if(X.snow===d){ic='❄️';sum=sure?'Snow':'Snow possible';hi=Math.min(hi,34);w.push(sure?'❄️ <b>Snow</b> overnight, ice underneath. Slick roads all day, a slow ferry ramp.':'❄️ Snow possible. Low confidence.')}
    else if(sure&&X.ice&&X.ice[d])w.push(`🧊 <b>Ice on the ferry ramp</b> before 10 AM: early boats ~${X.ice[d]} min late. Icy roads until late morning.`);
    if(X.cold&&X.cold[d]){lo=wxN(d,'cold',19,24);if(sure)w.push(`🥶 <b>Hard freeze tonight</b>, low ${lo}°. Drip the faucets if the heat might go out.`)}
    if(X.tide&&X.tide.day===d)w.push(`🌊 <b>King tide</b> peaking around ${fmt(X.tide.start+75)}: the Oro Bay road floods and ferry loading slows.`);
  }
  if(s==='summer'){
    if(X.smoke===d){hi=wxN(d,'hot',86,92);rain=0;ic=sure?'🔥':'🌫️';sum=sure?'Smoke & heat':'Haze possible';
      w.push(sure?`🔥 <b>Wildfire smoke and heat</b>, ${hi}°: air quality unhealthy. Outdoor work can wait.`:'🌫️ Smoke possible, depending on the wind east of the mountains.')}
    else if(hi>=80)w.push(`🥵 Warm one: ${hi}°. Water the garden early.`);
    if(X.fourth===d)w.push('🎆 Fourth of July: clear for fireworks at 10 PM.');
  }
  if(sure&&S.week.fog[d])w.push(`🌫️ <b>Fog</b> in the morning: boats before 11 AM ~${S.week.fog[d]} min late.`);
  return {d,rel,sure,hi,lo,rain,ic,sum,w}}
// tides: two highs and two lows a day, about 50 minutes later each day; anchored to the king tide when there is one
function wxTides(d){const X=seaX(),T=X.tide,out=[],P=745;
  const anchor=T?T.start+75:Math.floor(wxR(-1,'tide')*P);
  const n0=Math.floor((d*1440-anchor)/P)-1;
  for(let n=n0;n<n0+5;n++){const hiT=anchor+n*P,loT=hiT+372;
    for(const [t,isHi] of [[hiT,true],[loT,false]]){if(t<d*1440||t>=(d+1)*1440)continue;
      const king=isHi&&!!T&&t>=T.start&&t<T.end;
      const ft=king?15.6:isHi?(n%2?8.6:11.4)+wxR(d,'h'+n)*1.4:(n%2?4.2:-0.8)+wxR(d,'l'+n)*1.6;
      out.push({t,hi:isHi,king,ft:Math.round(ft*10)/10})}}
  return out.sort((a,b)=>a.t-b.t)}
const wxTideTxt=d=>wxTides(d).map(x=>`<span class="wx-tide${x.king?' wx-king':''}">${x.king?'🌊 KING ':''}${x.hi?'High':'Low'} ${fmt(x.t)} ${x.ft.toFixed(1)} ft</span>`).join('');
// warnings worth a buzz the evening before (and tonight’s freeze)
function wxTomorrowWarn(){const d=day();const out=[];
  if(d<6){const X=seaX(),st=S.week.storm;
    if(st&&st.day===d+1)out.push(['🌬️','Gale tomorrow',`From about ${fmt(st.start)}. Fuel the generator, fill the water jugs, charge everything.`]);
    if(seasonId()==='winter'){
      if(X.snow===d+1)out.push(['❄️','Snow tomorrow','Ice under it. Leave early or don’t leave.']);
      else if(X.ice&&X.ice[d+1])out.push(['🧊','Ice on the ramp tomorrow',`Early boats ~${X.ice[d+1]} min late.`]);
      if(X.tide&&X.tide.day===d+1)out.push(['🌊','King tide tomorrow',`Around ${fmt(X.tide.start+75)}. The Oro Bay road floods.`]);}
    if(seasonId()==='summer'&&X.smoke===d+1)out.push(['🔥','Smoke tomorrow','Unhealthy air. Plan indoor things.']);
  }
  const X=seaX();if(seasonId()==='winter'&&X.cold&&X.cold[d])out.push(['🥶','Hard freeze tonight','Drip the faucets if the heat might go out.']);
  return out}
phoneOnTime(()=>{if(!S||!S.week||!phoneInstalled('weather')||!phoneCan()||tod()<1080)return;const W=WX(),k=dayKey();if(W.eve===k)return;W.eve=k;
  const ws=wxTomorrowWarn();if(!ws.length)return;W.alert=k;
  {const d=day(),st=S.week.storm,X=seaX();   // remember which bad nights you were warned about (🌦️ Weather-wise)
    if(st&&st.day===d+1)W.warn=k+1;else if(seasonId()==='winter'&&X.cold&&X.cold[d])W.warn=k}
  phoneNotify(ws[0][0],'Tides & Weather: '+ws.map(x=>x[1]).join(' · '),ws[0][2]);
  say(`📱 🌦️ <b>Tides & Weather</b>: ${ws.map(x=>`${x[0]} ${x[1]}. ${x[2]}`).join(' ')}`)});
// 🌦️ Weather-wise: a gale or a hard freeze spent at home, warned about the evening before
{const _up=upkeepNight;upkeepNight=function(where,notes,d){try{const W=S.ph&&S.ph.wx;
  if(W&&W.warn===dayKey()&&where==='home'&&(stormNight(d)||(typeof coldNight==='function'&&coldNight(d))))S.stats.wxWise=(S.stats.wxWise||0)+1}catch(e){}
  return _up.apply(this,arguments)}} // apps
definePhoneApp({id:'weather',name:'Tides & Weather',ic:'🌦️',order:67,size:'18 MB',desc:'Forecast a day ahead of the island grapevine, tide tables, and a buzz the evening before bad weather.',
  badge:()=>{const W=S.ph&&S.ph.wx;return W&&W.alert===dayKey()&&W.seen!==dayKey()?1:0},
  view(){const d=day(),W=WX();W.seen=dayKey();let h='';
    const card=(x,lbl)=>`<div class="wx-day${x.w.length?' wx-warn':''}"><div class="wx-top"><span class="wx-ic">${x.ic}</span><div><b>${lbl}</b><span>${x.sum} · ${x.hi}° / ${x.lo}° · ${x.rain}% rain</span></div></div>${x.w.map(t=>`<p>${t}</p>`).join('')}</div>`;
    h+=card(wxDay(d),`Today, ${DAYS[d]}`);
    h+=`<div class="wx-tides"><small>Tides at Steilacoom</small>${wxTideTxt(d)}</div>`;
    if(d<6){h+=card(wxDay(d+1),`Tomorrow, ${DAYS[d+1]}`);h+=`<div class="wx-tides"><small>Tides tomorrow</small>${wxTideTxt(d+1)}</div>`}
    else h+=apNote('Next week’s forecast isn’t out yet. The models are still arguing.');
    if(d+2<=6){h+=`<div class="ph-sub">Later this week · lower confidence</div>`;
      for(let i=d+2;i<=6;i++){const x=wxDay(i);h+=apLi(`${x.ic} ${DAYS[i].slice(0,3)}`,`${x.sum} · ${x.hi}°/${x.lo}°${x.w.some(t=>/King tide/.test(t))?' · 🌊 king tide':''}`,x.w.length?'wx-low warn':'wx-low')}}
    h+=apNote('🔔 You’ll get a buzz the evening before a gale, snow, ice, a king tide or smoke. Tides are math, so those are exact. The rest is the Pacific Northwest.');
    return h}});
