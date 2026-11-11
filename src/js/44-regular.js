// ---- 📅 Weekend regular: a month living on the mainland, working weekdays, spending weekends on the island ----
// A visit mode (S.visitor is set, VS().len==='regular') that is also a month (S.mode==='month', 4 weeks, S.weekNo 0..3).
// Files: 44 core (state, start, city places and commute, the job, rent, bills, chores, paycheck, vacation days, the month's end)
//        45 weekends (rental per weekend, hosts, stranded nights, the boss, invitations, friends) · 46 goal (the house, endings,
//        the handoff to a resident game, the Visit app, to-do list)
// State: VS().reg = {city, wk..., pend (pay waiting for Friday), vac (vacation days left), rent{}, bills{}, chores{}, W{this weekend}, ...}
// API: regOn() · REG() · REG_CITIES · REG_GOAL · regNew(home,diff,season) · regCityHere() · regRentOwed() · regLose(kind,title,sub)
const REG_WEEKS=4, REG_VAC=5;
const REG_GOAL={money:4000,rep:40,friends:3}, REG_DOWN=3500;
const REG_START={easy:3000,normal:2600,hard:2200};          // savings you begin the month with
const REG_CITIES={
  seattle:{n:'Seattle', rent:450,commute:40,jobs:['r_sea','r_sea2'],noisy:0.22,theft:0.04,home:'a small apartment',lord:'Mr. Park, your landlord',util:62,
    d:'A small apartment, $450 a week. The best pay, the worst commute and a noisy upstairs neighbor.'},
  tacoma: {n:'Tacoma',  rent:325,commute:20,jobs:['r_tac','r_tac2'],noisy:0.04,theft:0.05,home:'a rented house',lord:'Darlene, your landlord',util:95,
    d:'A rented house, $325 a week. A short commute and a short drive to the ferry.'},
  olympia:{n:'Olympia', rent:300,commute:15,jobs:['r_oly','r_oly2'],noisy:0.1,theft:0.03,home:'a duplex',lord:'Ed, your landlord',util:78,
    d:'One side of a duplex, $300 a week. Steady state-office hours and lighter traffic.'}};
const REG_BILLS={
  phone:{ic:'📱',n:'Phone',who:'your phone carrier',amt:()=>55,fee:10,coll:25,w:0,d:3},
  util:{ic:'💡',n:'Utilities',who:'City Light & Water',amt:()=>(REG_CITIES[VS().home]||REG_CITIES.tacoma).util,fee:12,coll:30,w:1,d:2},
  ins:{ic:'🚗',n:'Car insurance',who:'Evergreen Mutual',amt:()=>88,fee:15,coll:35,w:2,d:1}};
const REG_RENT_LATE=25, REG_RENT_EVICT=3;
JOBS.r_sea={n:'Office job, downtown Seattle',loc:'rwork',start:510,end:1020,pay:215,days:[0,1,2,3,4],reg:'seattle',pitch:'8:30–5:00 weekdays. The best pay in the region and the worst commute.'};
JOBS.r_sea2={n:'Warehouse, SoDo (Seattle)',loc:'rwork',start:390,end:900,pay:180,days:[0,1,2,3,4],reg:'seattle',pitch:'6:30–3:00 weekdays. Early start, lighter traffic, lower pay.'};
JOBS.r_tac={n:'Records clerk, Tacoma hospital',loc:'rwork',start:510,end:990,pay:195,days:[0,1,2,3,4],reg:'tacoma',pitch:'8:30–4:30 weekdays. A short commute.'};
JOBS.r_tac2={n:'Dispatch clerk, Port of Tacoma',loc:'rwork',start:420,end:930,pay:180,days:[0,1,2,3,4],reg:'tacoma',pitch:'7:00–3:30 weekdays. You’re home before the rush.'};
JOBS.r_oly={n:'Clerk, state office (Olympia)',loc:'rwork',start:480,end:990,pay:185,days:[0,1,2,3,4],reg:'olympia',pitch:'8:00–4:30 weekdays. Steady hours, steady pay, every day the same.'};
JOBS.r_oly2={n:'Bookstore, downtown Olympia',loc:'rwork',start:600,end:1110,pay:150,days:[0,1,2,3,4],reg:'olympia',pitch:'10:00–6:30 weekdays. Slow mornings, lower pay.'};
const regOn=()=>{try{return visitorOn()&&S.visitor.len==='regular'}catch(e){return false}};
const regCity=()=>REG_CITIES[(typeof VS==='function'&&VS()&&VS().home)||'tacoma']||REG_CITIES.tacoma;
function regInit(home){return {city:home||'tacoma',pend:0,paidWk:-1,vac:REG_VAC,vacDays:{},sick:{},hadJob:true,
  rent:{wk:-1,owed:0,strikes:0,fees:0,evict:false},bills:{},mail:0,mailRead:0,chores:{dishes:0,laundry:0,trash:0},cityFood:0,swapped:false,
  W:{on:false,done:false,n:0,rep0:0,money0:0,friends0:0,host:null,invDone:false},weekends:0,hist:[],start:0,earplugs:false,
  goalAt:-1,offered:false,house:null,inv:null,bossAt:{},cw:{},texted:{},
  st:{earned:0,rent:0,bills:0,cabin:0,vacUsed:0,sickDays:0,missed:0,stranded:0,bossAnswered:0,bossIgnored:0,early:0,lateFees:0,theft:0,noisy:0,hosted:0,dinners:0,events:0,help:0}}}
function REG(){const V=VS();if(!V.reg)V.reg=regInit(V.home);return fillDefaults(V.reg,regInit(V.home))}
const regWk=()=>S.weekNo||0;
const regDk=()=>regWk()*7+day();

// ======== the city: where you live, work and shop (places exist only in this mode) ========
const REG_LOCS=['rwork','rmarket'];
L.rwork={ic:'💼',get side(){return regOn()?'M':'X'},
  get name(){const J=curJob()||(S&&S.interview&&JOBS[S.interview.job]);return J?J.n:'Your workplace'},
  get desc(){const J=curJob();return J?`Your job in ${regCity().n}. Clock in by ${fmt(J.start)}.`:'Where you work.'},
  hours:d=>d<5?[360,1230]:null};
L.rmarket={ic:'🛒',get side(){return regOn()?'M':'X'},
  get name(){return `Supermarket & gas (${regCity().n})`},desc:'Close to home, normal prices. Gas pumps out front and a pharmacy counter in the back.',hours:()=>[360,1380]};
const _rgDist=dist;
dist=function(a,b){
  if(a===b)return 0;
  const ra=REG_LOCS.includes(a),rb=REG_LOCS.includes(b);
  if(!ra&&!rb)return _rgDist(a,b);
  const x=ra?a:b,o=ra?b:a;
  if(REG_LOCS.includes(o))return 9;
  if(o==='vhome')return x==='rwork'?regCity().commute:6;
  return _rgDist('vhome',o)+(x==='rmarket'?2:0);       // work and the market sit about where home does, as far as the ferry goes
};
{const _t=vtTraffic;vtTraffic=function(from,to){const r=_t.apply(this,arguments);
  try{if(regOn()&&(REG_LOCS.includes(from)||REG_LOCS.includes(to))){r.txt=r.min<=5?`Traffic: ${r.why}.`:`Traffic: ${r.why}, +${r.min} min`}}catch(e){}return r}}
{const _r=vtTrafficRoll;vtTrafficRoll=function(from,to){
  if(regOn()&&(REG_LOCS.includes(from)||REG_LOCS.includes(to))){const e=vtTraffic(from,to,S.t);
    if(Math.random()<0.012*vtHome().i5)return {min:25+Math.floor(Math.random()*25),crash:true};
    return {min:Math.round(e.min*(0.5+Math.random())),crash:false}}
  return _r.apply(this,arguments)}}
const regTrip=(from,dest)=>regOn()&&(REG_LOCS.includes(from)||REG_LOCS.includes(dest));
// coming home with groceries stocks the pantry
{const _go=go;go=function(dest,o){const from=S.loc,r=_go.apply(this,arguments);
  try{if(regOn()&&S.loc==='vhome'&&from!=='vhome'&&S.carried>0){const n=S.carried;S.pantry+=n;S.carried=0;say(`🛒 You unload ${n} day${n>1?'s':''} of food into the pantry.`);render()}}catch(e){console.error(e)}return r}}

// ======== starting the month ========
function regNew(home,diff,season){
  home=VISIT_HOMES[home]?home:'tacoma';
  newGame(diff,'month',season);
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();
  const V=S.visitor=vsInit('regular',home),R=V.reg=regInit(home),C=REG_CITIES[home];
  V.budget=REG_START[S.diff]||REG_START.normal;R.start=V.budget;V.rentalCost=0;
  Object.assign(S,{emp:C.jobs[0],job:70,interview:null,rx:false,appt:false,apptMissed:false,injury:null,injuryRolled:true,pantry:3,carried:0,home:85,homeLow:false,homeGas:0,homeDiesel:0,gen:null,delivery:null,prios:[]});
  S.empStart=0;vCabin();
  S.money=V.budget;
  S.cars=[{id:'isl',name:'Your car',loc:'vhome',fuel:12,tank:14,diesel:false}];
  S.loc='vhome';S.cur=0;S.t=390;S.phoneT=S.t;S.phone=100;
  S.alarm={plug:{on:false,time:420},phone:{on:true,time:420}};
  uiNarr=[];S.log=[];S.ev.force=[];
  regWeekInit();
  const H=VISIT_HOMES[home];
  say(`📅 <b>Weekend regular.</b> Monday, ${fmt(S.t)}. You live in ${H.n}, in ${C.home}. The job is here. The island is for weekends.`);
  say(`💵 You start the month with ${$(S.money)} in savings. Rent is ${$(C.rent)} a week, due Sunday.`);
  startDay();
  S.log=S.log.filter(e=>!/^🏠 Rent/.test(String(e.s)));uiNarr=uiNarr.filter(x=>!/^🏠 Rent/.test(String(x)));
  regIntroModal();
  try{showTile('📅','Weekend regular',`${H.n} · week 1 of ${REG_WEEKS}`,'info')}catch(e){}
  saveGame();
}
window.regNew=regNew;
function regIntroModal(){const V=VS(),C=regCity(),H=VISIT_HOMES[V.home];
  const jobs=C.jobs.map(k=>({l:`${JOBS[k].n}: ${$(JOBS[k].pay)}/day`,s:`${JOBS[k].pitch} Commute ${C.commute} min.`,fn:()=>{S.emp=k;S.job=70;say(`💼 Your job: <b>${JOBS[k].n}</b>, ${fmt(JOBS[k].start)}–${fmt(JOBS[k].end)}.`);render()}}));
  modal(`📅 Your month: ${H.ic} ${H.n}`,`<p>You live in ${H.n} and work weekdays. Friday evening you catch the boat. Sunday you’re back on the mainland for work. Four weeks, and the island has to <i>want</i> you.</p>
    <ul><li>💰 <b>Save ${$(REG_GOAL.money)}</b> after rent and bills.</li><li>🤝 <b>Island reputation ${REG_GOAL.rep}+</b>: be the person who helps.</li><li>👥 <b>${REG_GOAL.friends} island friends.</b></li></ul>
    <p>Do all three and a house comes up in the Island Group. Rent (${$(C.rent)}) is due every Sunday night, paychecks land on Fridays, and you have <b>${REG_VAC} vacation days</b> for a Friday or Monday off.</p><p>Pick your job:</p>`,
    jobs.concat([{l:'Keep the first one',fn:()=>{}}]));}
// the Monday morning wake-up in a month with a job: fresh week state for the weekend visit
function regWeekInit(){const V=VS(),R=REG();
  V.arr=4;V.last=6;V.nights=2;V.rate=VISIT_RATE.regular;V.islandAt=null;V.packed=0;V.asked=undefined;V.endT=null;V.done=false;V.result=null;V.texts=V.texts||[];
  V.rental={in:4*1440+VCHECK_IN,out:6*1440+VCHECK_OUT,checkedIn:false,checkedOut:false,inAt:null,outAt:null,trash:false,late:false,hosted:null};
  R.W={on:false,done:false,n:regWk(),rep0:V.rep,money0:null,friends0:Object.keys(S.friends||{}).length,host:null,invDone:false,spent:0};
  R.inv=null}

// ======== week and day rollovers ========
{const _wr=weekRollover;weekRollover=function(notes){const r=_wr.apply(this,arguments);try{if(regOn()){regWeekInit();S.rx=false;
  notes.push(`🗓️ A new week in ${regCity().n}. Week ${regWk()+1} of ${REG_WEEKS}.`)}}catch(e){console.error(e)}return r}}
{const _sd=startDay;startDay=function(){const r=_sd.apply(this,arguments);try{if(regOn()&&!S.over)regMorning()}catch(e){console.error(e)}return r}}
function regMorning(){const R=REG(),d=day(),dk=regDk(),J=curJob(),C=regCity();
  if(d===0)say(`🏙️ Monday in ${C.n}. ${J?`Work starts at ${fmt(J.start)}. `:''}Week ${regWk()+1} of ${REG_WEEKS}: ${REG_VAC-R.vac} vacation day${REG_VAC-R.vac===1?'':'s'} used, ${R.vac} left.`);
  if(R.vacDays[dk]&&J&&J.days.includes(d)&&!S.worked[d]){regVacApply(dk)}
  if(d===4)say('📅 Friday. Paycheck at 5:00 PM. Catch an evening boat if you want the weekend: the last one off the mainland is at 10:20 PM.');
}
function regVacApply(dk){const R=REG(),d=day(),J=curJob();if(!J)return;S.worked[d]=true;S.late[d]=0;R.pend+=J.pay;R.st.vacUsed++;
  say(`🏖️ A paid vacation day. ${$(J.pay)} on Friday’s paycheck all the same.`)}
function regVacCan(){const R=REG(),d=day(),J=curJob(),m=tod();return !!J&&R.vac>0&&J.days.includes(d)&&(d===0||d===4)&&!S.worked[d]&&!R.vacDays[regDk()]&&m<J.start+240&&jobStarted(d)}
function regVacTake(){const R=REG(),d=day(),J=curJob();if(!regVacCan())return;R.vac--;R.vacDays[regDk()]=true;S.t+=5;phoneTick();
  S.worked[d]=true;S.late[d]=0;R.pend+=J.pay;R.st.vacUsed++;adj('stress',-4);
  say(`🏖️ You email the boss: a vacation day. (${R.vac} left of ${REG_VAC}.) Paid, and it feels illegal.`);afterAction()}
function regVacTomorrow(){const R=REG(),d=day(),J=curJob();if(!J||R.vac<=0||d!==3||!J.days.includes(4)||R.vacDays[regWk()*7+4])return;
  R.vac--;R.vacDays[regWk()*7+4]=true;S.t+=5;phoneTick();say(`🏖️ Friday is a vacation day. (${R.vac} left of ${REG_VAC}.) You can catch an early boat.`);afterAction()}
function regSickCan(){const J=curJob(),d=day();return !!J&&J.days.includes(d)&&d<5&&!S.worked[d]&&S.health<45&&!REG().sick[regDk()]&&tod()<J.start+240}
function regSick(){const R=REG(),d=day();if(!regSickCan())return;R.sick[regDk()]=true;R.st.sickDays++;S.worked[d]=true;S.late[d]=0;S.t+=10;phoneTick();adj('job',-2);adj('health',4);adj('stress',-3);
  say('🤒 You call in sick. No pay for the day, and your boss sounds more tired than you do.');afterAction()}

// ======== the job: paychecks, early Friday exit, commute stress ========
function workPay(v){money(v)}
{const _w=workPay;workPay=function(v){if(regOn()){const R=REG();R.pend+=v;R.st.earned+=v;return}return _w.apply(this,arguments)}}
function regPaycheck(force){if(!regOn()||S.over)return;const R=REG(),d=day();
  if(R.paidWk===regWk())return;
  if(!(d>4||(d===4&&(tod()>=1020||force))))return;
  R.paidWk=regWk();const amt=Math.round(R.pend);R.pend=0;
  if(amt>0){money(amt);say(`💵 <b>Paycheck:</b> ${$(amt)} direct-deposited.`);try{phoneNotify('💵','Paycheck',$(amt))}catch(e){}}
  else say('💵 Payday, and the check is $0. You didn’t work this week.')}
{const _w=workActions;workActions=function(a,d,m){const r=_w.apply(this,arguments);
  try{if(regOn()){const J=curJob();
    if(d===4&&J&&!S.worked[d]&&jobStarted(d)&&J.days.includes(4)&&m>=J.start&&m<780){
      const pay=Math.round(J.pay*0.55),cut=d*1440+780;
      a.push({ic:'⛴️',l:'Leave work early for the boat (1:00 PM)',s:`Pay ${$(pay)}. Boss won’t love it (job −6). Beat the Friday getaway traffic.`,fn:()=>{const R=REG(),late=Math.max(0,m-J.start);
        S.worked[d]=true;S.late[d]=late;S.t=Math.max(S.t,cut);workPay(pay);adj('job',-6);adj('stress',2);R.st.early++;
        say('⛴️ “Doctor’s appointment,” you tell the boss, with an island in your eyes. You’re out the door at 1:00.');afterAction()}})}}}catch(e){console.error(e)}
  return r}}

// ======== rent (every difficulty in this mode) ========
const regRentOwed=()=>{const R=REG();return (R.rent.wk<regWk()?regCity().rent:0)+R.rent.owed};
function regRentPay(){const R=REG(),amt=regRentOwed(),nm=regCity().lord.split(',')[0];if(!amt||!phoneCan())return;
  money(-amt);const late=R.rent.owed>0;R.rent.owed=0;R.rent.wk=regWk();R.rent.strikes=0;R.rent.evict=false;R.st.rent+=amt;S.t+=5;phoneTick();adj('stress',late?-4:-1);
  say(late?`🏠 You pay ${nm} ${$(amt)}: the back rent and the late fee. “Thank you. Really.”`:`🏠 Rent paid: ${$(amt)} to ${nm}. A roof for another week.`);afterAction()}
function regRentNight(notes,d){
  if(d!==6)return;
  const R=REG(),wk=regWk(),C=regCity(),nm=C.lord.split(',')[0];
  if(R.rent.wk>=wk&&!R.rent.owed){R.rent.strikes=0;return}
  if(R.rent.wk<wk){R.rent.owed+=C.rent;R.rent.wk=wk}
  R.rent.owed+=REG_RENT_LATE;R.rent.fees+=REG_RENT_LATE;R.rent.strikes++;S.stats.lateBills=(S.stats.lateBills||0)+1;R.st.lateFees+=REG_RENT_LATE;
  if(R.rent.strikes===1){adj('stress',4);notes.push(`🏠 📱 Text from ${nm}: “Rent didn’t come through this week. I added the ${$(REG_RENT_LATE)} late fee. You owe ${$(R.rent.owed)} now.”`)}
  else if(R.rent.strikes===2){adj('stress',12);notes.push(`🏠 ⚠️ An envelope on your door: <b>NOTICE TO PAY RENT OR VACATE</b>. ${$(R.rent.owed)} owed. ${nm} wrote on it in pen: “Please. By Sunday.”`)}
  else{R.rent.evict=true;adj('stress',20);notes.push(`🏠 Three Sundays without rent. ${nm} has filed for eviction.`)}}
// ======== bills: statements come by mail; pay online or mail a check ========
const regBillDue=k=>REG_BILLS[k].w*7+REG_BILLS[k].d;
const RB=k=>{const b=REG().bills;return b[k]||(b[k]={paid:false,late:0,fees:0,check:-1})};
const regBillAmt=k=>REG_BILLS[k].amt();
const regBillOwed=k=>regBillAmt(k)+RB(k).fees;
const regBillsOpen=()=>Object.keys(REG_BILLS).filter(k=>!RB(k).paid&&RB(k).check<0&&regDk()>=regBillDue(k)-6);
const regBillsUnpaid=()=>Object.keys(REG_BILLS).filter(k=>!RB(k).paid);
const regBillTxt=k=>{const dd=regBillDue(k)-regDk();return dd<0?`${-dd} day${dd===-1?'':'s'} late`:dd===0?'due today':dd===1?'due tomorrow':`due ${DAYS[regBillDue(k)%7]}`};
function regBillPay(k,how){const b=RB(k),B=REG_BILLS[k],amt=regBillOwed(k),R=REG();
  if(how==='online'){money(-amt);b.paid=true;R.st.bills+=amt;S.t+=5;phoneTick();adj('stress',-1);say(`${B.ic} Paid ${B.who}: ${$(amt)}, online.`)}
  else{money(-(amt+0.78));b.check=regDk()+2;R.st.bills+=amt;S.t+=10;say(`✉️ A check for ${$(amt)} to ${B.who} goes in the mailbox. It should arrive in two days${regDk()+2>regBillDue(k)?', which is after it’s due':''}.`)}}
function regBillsModal(){const ks=regBillsOpen(),ph=phoneCan(),opts=[];
  ks.forEach(k=>{const B=REG_BILLS[k];
    opts.push({l:`${B.ic} Pay ${B.n.toLowerCase()} online: ${$(regBillOwed(k))}`,s:`${B.who}, ${regBillTxt(k)}. 5 min.${ph?'':' Your phone is dead.'}`,dis:!ph,fn:()=>{regBillPay(k,'online');afterAction()}});
    opts.push({l:`✉️ Mail a check for the ${B.n.toLowerCase()} bill`,s:`2 days to get there${regDk()+2>regBillDue(k)?': it’ll arrive late':''}. 10 min.`,fn:()=>{regBillPay(k,'mail');afterAction()}})});
  if(ks.length>1&&ph)opts.unshift({l:`💻 Pay them all online: ${$(ks.reduce((s,k)=>s+regBillOwed(k),0))}`,s:`${ks.length} bills, 5 minutes each.`,fn:()=>{ks.forEach(k=>regBillPay(k,'online'));afterAction()}});
  modal('🧾 Bills',`<p>The bills come by mail while you’re on the island. Late means a fee, and after two weeks, collections.</p>${ks.length?'':'<p><i>Nothing due right now.</i></p>'}`,opts.concat([{l:'Not now',fn:()=>{}}]))}
function regBillsNight(notes,dk){
  for(const k in REG_BILLS){const b=RB(k),B=REG_BILLS[k],due=regBillDue(k);if(b.paid)continue;
    if(b.check>=0&&b.check<=dk){b.paid=true;continue}
    if(dk<due)continue;
    b.late++;if(b.late===1){S.stats.lateBills=(S.stats.lateBills||0)+1;REG().st.lateFees+=B.fee;
      if(b.check>=0){money(-B.fee);notes.push(`${B.ic} Your check to ${B.who} is still in the mail, and they don’t care: ${$(B.fee)} late fee.`)}
      else{b.fees+=B.fee;notes.push(`${B.ic} The ${B.n.toLowerCase()} bill was due and you didn’t pay it. ${B.who} adds a ${$(B.fee)} late fee.`)}adj('stress',3)}
    else if(b.late>=14&&b.check<0){const amt=regBillOwed(k)+B.coll;money(-amt);b.paid=true;adj('stress',2);notes.push(`${B.ic} ${B.who} sent the bill to collections and charged your card ${$(amt)} with a ${$(B.coll)} fee on top.`)}}}
// ======== the mailbox: it fills up while you’re away ========
function regMailHere(){return REG().mail}
function regReadMail(){const R=REG(),n=R.mail,open=regBillsOpen();S.t+=8;R.mail=0;R.mailRead=regDk();
  const lines=[];for(const k of open){const B=REG_BILLS[k];lines.push(`${B.ic} A statement from ${B.who}: <b>${$(regBillOwed(k))}</b>, ${regBillTxt(k)}.`)}
  const junk=['🍕 A pizza flyer for a place that closed in March.','🗳️ A glossy mailer about a ballot measure you can’t vote on.','📰 A catalog of heated socks.','💌 A postcard from your sister: “Come visit!”'];
  for(let i=0;i<Math.min(3,Math.max(0,n-lines.length));i++)lines.push(junk[(regDk()+i)%junk.length]);
  say(`📬 You sort ${n} piece${n===1?'':'s'} of mail.`);
  modal('📬 The mailbox',lines.length?lines.map(l=>`<p>${l}</p>`).join(''):'<p>Nothing but a coupon for oil changes.</p>',[{l:'OK',fn:()=>{}}]);afterAction()}
// ======== chores at home: light, but they add up ========
const REG_CHORES={dishes:{ic:'🍽️',l:'Do the dishes',min:20,st:-1,n:'The sink is full.',done:'Dishes done. The sink gleams.'},laundry:{ic:'🧺',l:'Do a load of laundry',min:45,st:-1,n:'The hamper is a mountain.',done:'Laundry done, folded and put away. Nobody is more surprised than you.'},trash:{ic:'🗑️',l:'Take out the trash',min:10,st:0,n:'The bin is overflowing.',done:'Trash out to the curb.'}};
function regChoreDo(k){const R=REG(),c=REG_CHORES[k];R.chores[k]=0;S.t+=c.min;adj('stress',c.st);regHomeCalc();say(`${c.ic} ${c.done}`);afterAction()}
function regHomeCalc(){const R=REG(),c=R.chores;S.home=clamp(Math.round(92-c.dishes*8-c.laundry*5-c.trash*6),0,100)}
// ======== the night in the city ========
function regNight(where,notes,d){
  const R=REG(),C=regCity(),dk=regDk();
  // mail piles up (none on Sundays)
  if(d!==6)R.mail++;
  // bills and rent
  regBillsNight(notes,dk);regRentNight(notes,d);
  // chores pile up faster when you’re home
  const home=where==='vhome',inc=home?1:0.3;
  for(const k in R.chores)R.chores[k]=Math.min(5,Math.round((R.chores[k]+inc*(k==='laundry'?0.6:1))*10)/10);
  regHomeCalc();
  if(home){adj('stress',-nightRec(6));
    if(S.home<40){adj('stress',4);notes.push('🏠 The place is a mess and it’s hard to relax. Dishes, laundry, trash: a few chores would help.')}}
  // nuisances: the neighbor and the porch
  if(home&&Math.random()<C.noisy*(R.earplugs?0.4:1)){R.st.noisy++;adj('stress',6);adj('health',-1);notes.push(where==='vhome'&&C===REG_CITIES.seattle?'🔊 The upstairs neighbor drags furniture until 1 AM. You stare at the ceiling. You don’t sleep well.':'🔊 Somebody’s party goes until 1 AM next door. You don’t sleep well.')}
  const away=where!=='vhome'&&d>=4;
  if((away||Math.random()<0.25)&&Math.random()<C.theft*(away?2:1)){const loss=S.money>200?38:0;
    if(loss){money(-loss);R.st.theft++;adj('stress',4);notes.push(`📦 A package you ordered was stolen off the porch. A replacement from the store comes to ${$(loss)}.`)}}
  // the phone charges overnight at home
  if(home)S.phone=100;
}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up.apply(this,arguments);try{if(regOn())regNight(where,notes,d)}catch(e){console.error(e)}return r}}
{const _ed=endDay;endDay=function(where){
  if(!regOn()||S.over)return _ed.apply(this,arguments);
  const d=day(),wasEmp=!!S.emp,R=REG(),at=S.loc;
  try{regPaycheck(true)}catch(e){console.error(e)}
  let r=_ed.apply(this,arguments);
  try{if(S.over)return r;
    const car=S.cars[0];
    {
      if(where==='vhome'){S.loc='vhome';if(car&&car.loc!=='vhome'&&car.loc!=='stDock')car.loc='vhome'}
      else if(L[at]&&L[at].side==='I'&&where!=='home'){S.loc='aiDock'}}
    if(wasEmp&&!S.emp&&!S.over){return regLose('fired','You’re fired',`Your boss has run out of patience. Without the paycheck there’s no rent, no cabin and no island. The month ends here.`)}
    if(R.rent.evict&&!S.over){return regLose('evicted','Evicted',`Three Sundays without rent. ${regCity().lord.split(',')[0]} is apologetic, a friend helps you load the boxes, and the island will have to wait.`)}
    render()}catch(e){console.error(e)}
  return r}}

// ======== the city home and the supermarket: actions ========
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);if(!regOn()||S.over)return a;
  try{return regActions(a)}catch(e){console.error(e);return a}}}
function regActions(a){const loc=S.loc,d=day(),m=tod(),R=REG(),C=regCity(),J=curJob(),out=[];
  const mainland=L[loc]&&L[loc].side==='M';
  for(const x of a){ // the visitor's "sleep in your own bed" is replaced below; packing food only on Thursday and Friday
    if(/^Sleep in your own bed/.test(x.l||''))continue;
    if(/^(Pack food|Pack a lunch)/.test(x.l||'')&&!(d===3||d===4))continue;
    out.push(x)}
  if(loc==='vhome'){
    out.push({cat:'phone',ic:'⏰',l:`Alarm: ${alarmTxt()}`,s:'Tap to change the time. Your phone is the alarm in the city.',fn:alarmModal});
    if(S.phone<90)out.push({cat:'phone',ic:'🔋',l:`Charge your phone (${S.phone}%)`,s:'45 minutes on the charger: +60%.',fn:()=>{S.t+=45;phoneTick();S.phone=Math.min(100,S.phone+60);say('🔋 Phone charged up.');afterAction()}});
    out.push({cat:'home',ic:'🛏️',l:m>=1080?'Go to bed':'Turn in early',s:`Ends the day. Eats 1 day of food (pantry: ${S.pantry}). Alarm: ${alarmTxt()}.`,cls:m>=1260?'primary':'',fn:()=>endDay('vhome')});
    if(m<1260){const rn=U_REST(),gain=[8,5,3][rn]??1;out.push({cat:'home',ic:'☕',l:'Rest for an hour',s:`Stress −${gain}.${rn>=2?' Diminishing returns.':''}`,fn:()=>{S.t+=60;adj('stress',-gain);S.rest={k:dayKey(),n:rn+1};say('You put your feet up and watch the rain on the window.');afterAction()}})}
    for(const k in REG_CHORES){const c=REG_CHORES[k],lv=R.chores[k];
      out.push({cat:'home',ic:c.ic,l:`${c.l}${lv>=3?' (piling up)':''}`,s:`${c.min} min.${lv>=3?` ${c.n}`:' Not urgent.'}`,due:lv>=3,dis:lv<0.5,fn:()=>regChoreDo(k)})}
    out.push({cat:'home',ic:'📬',l:R.mail?`Check the mail (${R.mail} piece${R.mail===1?'':'s'})`:'Check the mail',s:R.mail?'Statements, flyers and a postcard, probably. 8 min.':'Nothing new.',dis:!R.mail,fn:regReadMail});
    const owed=regRentOwed();
    out.push({cat:'phone',ic:'🏠',l:`Pay rent: ${$(owed)}`,due:d>=5||R.rent.owed>0,s:owed?`${C.lord.split(',')[0]}, due Sunday night. 5 min on your phone.`:'Paid for this week.',dis:!owed||!phoneCan()||!canEssential(owed),fn:regRentPay});
    const open=regBillsOpen();
    out.push({cat:'phone',ic:'🧾',l:open.length?`Pay bills (${open.length} due)`:'Pay bills',s:open.length?open.map(k=>`${REG_BILLS[k].n} ${$(regBillOwed(k))}, ${regBillTxt(k)}`).join(' · '):'Nothing due right now.',dis:!open.length,fn:regBillsModal});
    if(d===3&&J&&R.vac>0&&!R.vacDays[regWk()*7+4])out.push({cat:'work',ic:'🏖️',l:`Take tomorrow (Friday) off: vacation day (${R.vac} left)`,s:'Paid. A long weekend on the island.',fn:regVacTomorrow});
  }
  if(L[loc]&&L[loc].side!=='X'&&J){
    if(regVacCan())out.push({cat:'work',ic:'🏖️',l:`Take today off: vacation day (${R.vac} left)`,s:`Paid. 5 min to email the boss. ${d===0?'Monday':'Friday'} off.`,fn:regVacTake});
    if(regSickCan())out.push({cat:'work',ic:'🤒',l:'Call in sick',s:'Not feeling well enough to work. No pay today, job −2.',fn:regSick})}
  if(loc==='rmarket'&&isOpen('rmarket')){
    const car=!!carHere(),cap=14-S.carried;
    [[1,13],[3,36],[5,58],[7,78]].forEach(([n,c])=>out.push({cat:'trade',ic:'🛒',l:`Buy ${n} day${n>1?'s':''} of groceries: $${c}`,s:`The city price: cheap. ${S.pantry} in the pantry${S.carried?`, ${S.carried} in the car`:''}.`,dis:!canEssential(c)||n>cap||(!car&&S.carried+n>4),fn:()=>{money(-c);S.carried+=n;S.stats.food+=n;S.t+=12+n*3;say(`🛒 Groceries: ${n} day${n>1?'s':''} for $${c}. Home, and it all goes in the pantry.`);afterAction()}}));
    const car2=carHere();
    if(car2){const need=Math.round((car2.tank-car2.fuel)*10)/10;
      out.push({cat:'fuel',ic:'⛽',l:`Fill up the tank: $${Math.round(need*GAS_PRICE)}`,s:`${need} gal at $${GAS_PRICE}/gal. Tank ${car2.fuel}/${car2.tank}.`,cls:need>=4?'primary':'',dis:need<0.5||S.money<need*GAS_PRICE,fn:()=>{money(-need*GAS_PRICE);car2.fuel=car2.tank;S.t+=10;say(`⛽ Full tank: ${need} gallons for $${Math.round(need*GAS_PRICE)}.`);afterAction()}})}
    out.push({cat:'work',ic:'💊',l:S.rx?'Prescription picked up ✓':'Pick up prescription: $15 copay',s:S.rx?'':d>=2?'Ready at the pharmacy counter.':'Not ready until Wednesday.',dis:S.rx||d<2||!canEssential(15),fn:()=>{money(-15);S.rx=true;S.t+=15;adj('stress',-3);say('💊 Refill in hand, before the weekend.');afterAction()}});
    if(!R.earplugs)out.push({cat:'trade',ic:'🎧',l:'Buy earplugs: $12',s:'Fewer sleepless nights with the neighbors.',dis:S.money<12,fn:()=>{money(-12);R.earplugs=true;S.t+=5;say('🎧 A box of foam earplugs. The ceiling will have to drag its furniture without you.');afterAction()}});
  }
  return out}
