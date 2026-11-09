// ---------------- 📱 apps: health (Telehealth) ----------------
// 🩺 Telehealth: video visits with a doctor. Needs real signal: the mainland (4 bars) or the Riv's Wi-Fi.
// On the island's one bar the video freezes on your own face. One visit a day: 20 min, $25 copay, battery.
//   - 💊 renew the prescription: mail-order (+$15 for the meds), lands in your mailbox at 1 PM the next day.
//     Saves the pharmacy trip, not the copay. Wednesday to Saturday only (the refill is due Thursday).
//   - 😮‍💨 stress advice (stress −6) · 🤒 run-down advice (health +3)
//   - 🤕 the ankle: no visit, no charge, just “go to Urgent Care”. It doesn't replace the Thursday checkup either.
// State: PH().tele = {visit: dayKey of today's visit, mail: dayKey the refill arrives (-1 = none), msg: {h,t}}
const TELE_COPAY=25, TELE_RX=15, TELE_MIN=20, TELE_BAT=8, TELE_MAIL=780;   // mail comes at 1 PM
const TELE=()=>{const P=PH();P.tele=P.tele||{visit:-1,mail:-1};return P.tele};
const teleWifi=()=>S.loc==='food';                                          // the Riv: the Wi-Fi password is taped to the register
const teleOK=()=>phoneSignal()>=4||teleWifi();
const teleMsg=(h,k)=>{TELE().msg={h,k,t:S.t}};
function teleRxWhy(){const d=day(),T=TELE();
  if(S.rx)return 'Already have this week’s refill.';
  if(T.mail>=0)return 'Already in the mail.';
  if(d<2)return 'Too early: the refill isn’t due until Thursday.';
  if(d>5)return 'Too late for this week.';
  return ''}
function teleCall(){   // try to connect; false on one bar
  if(teleOK())return true;
  S.t+=5;phoneUse(2);
  teleMsg('📶 Connecting… Connecting… the video freezes on your own face. One bar won’t carry a doctor. Try the mainland, or the Riv’s Wi-Fi.','warn');
  say('📶 You try a video visit on one bar. The picture freezes on your own face, mid-blink. Call dropped.');
  afterAction();return false}
function teleVisit(kind){
  const T=TELE(),dk=dayKey();
  const cost=TELE_COPAY+(kind==='rx'?TELE_RX:0);
  if(T.visit===dk||!phoneCan()||S.phone<TELE_BAT+2||(kind==='rx'&&teleRxWhy())||!canEssential(cost))return false;
  if(!teleCall())return false;
  T.visit=dk;money(-cost);phoneUse(TELE_BAT);S.t+=TELE_MIN;
  const where=teleWifi()?'from a corner booth at the Riv':'from your car';
  if(kind==='rx'){T.mail=dk+1;
    say(`🩺 A video visit ${where}. The doctor renews your prescription in ninety seconds and spends the rest asking if you’re “getting outside.” It’s going out by mail: in your box tomorrow afternoon. $${cost} with the meds.`);
    teleMsg(`💊 <b>Prescription renewed.</b> It’s in the mail: your box, tomorrow around ${fmt(TELE_MAIL)}. No pharmacy run.`,'ok')}
  else if(kind==='stress'){adj('stress',-6);
    say(`🩺 A video visit ${where}. You describe your commute. The doctor goes quiet, then teaches you a breathing exercise “for the ferry line.” It sort of works. Stress −6.`);
    teleMsg('😮‍💨 <b>Breathe in for four, out for six.</b> Stress −6.','ok')}
  else{adj('health',3);
    say(`🩺 A video visit ${where}. Fluids, sleep, “maybe a vegetable.” You were hoping for something more dramatic. Health +3.`);
    teleMsg('🤒 <b>Fluids, sleep, a vegetable.</b> Health +3.','ok')}
  afterAction();return true}
function teleAnkle(){
  if(!phoneCan()||!S.injury||S.injury.treated)return false;
  if(!teleCall())return false;
  S.t+=5;phoneUse(1);
  teleMsg('🤕 The nurse takes one look at your ankle on camera. “That’s an Urgent Care thing. DuPont, 8 to 8. Don’t walk on it.” No charge for being told.','warn');
  say('🤕 Telehealth can’t wrap an ankle through a phone. “Urgent Care in DuPont,” the nurse says. No charge.');
  afterAction();return true}
// the refill lands in your mailbox (no phone needed: it's the mail)
function teleMailCheck(){const P=S&&S.ph,T=P&&P.tele;if(!T||!(T.mail>=0))return;
  const dk=dayKey();if(dk<T.mail||(dk===T.mail&&tod()<TELE_MAIL))return;
  T.mail=-1;if(S.rx)return;S.rx=true;
  say('📬 Your prescription came in the mail. A padded envelope, slightly damp. One less ferry.');
  phoneNotify('📬','Prescription in the mailbox','Mail-order refill from Telehealth')}
phoneOnTime(teleMailCheck);
// a new week (month mode) starts clean
if(typeof weekRollover==='function'){const _wr=weekRollover;weekRollover=function(){const P=S&&S.ph;if(P&&P.tele)P.tele.mail=-1;return _wr.apply(this,arguments)}}
// the To-do item knows the refill is in the mail
if(typeof todoItems==='function'){const _ti=todoItems;todoItems=function(){const it=_ti.apply(this,arguments),T=S&&S.ph&&S.ph.tele;
  if(T&&T.mail>=0&&!S.rx){const x=it.find(i=>/prescription/.test(i.l||''));if(x){x.s=`In the mail from Telehealth: your box, ${T.mail>dayKey()?'tomorrow':'today'} around ${fmt(TELE_MAIL)}.`;x.urgent=false}}
  return it}}

definePhoneApp({id:'telehealth',name:'Telehealth',ic:'🩺',order:66,size:'64 MB',desc:'Video visits with a doctor. Needs real signal: the mainland, or the Riv’s Wi-Fi.',
  badge:()=>{const d=day(),T=TELE();return d>=3&&d<=5&&!S.rx&&T.mail<0&&T.visit!==dayKey()?1:0},
  view(){const T=TELE(),dk=dayKey(),ok=teleOK(),done=T.visit===dk,inj=S.injury&&!S.injury.treated,bat=S.phone>=TELE_BAT+2;let h='';
    const M=T.msg&&T.msg.t===S.t?T.msg:null;if(M)h+=phCard(M.h,M.k);
    h+=phCard(ok?(teleWifi()?'📶 <b>On the Riv’s Wi-Fi.</b> The password is taped to the register. Video works, mostly.':'📶 <b>Four bars.</b> Video works.')
      :'📶 <b>One bar.</b> Video visits need the mainland, or the Riv’s Wi-Fi.',ok?'ok':'warn');
    if(T.mail>=0)h+=phCard(`📬 Your refill is in the mail: ${T.mail>dk?'tomorrow':'today'} around ${fmt(TELE_MAIL)}.`);
    if(done)h+=phNote('One visit a day. The doctor has other people’s commutes to hear about.');
    const vis=(l,k,sub,dis)=>phBtn(l,()=>teleVisit(k),{cls:k==='rx'?'primary':'',dis:done||dis||!bat,sub:done?'One visit a day.':!bat?'Not enough battery for 20 minutes of video.':sub});
    const rw=teleRxWhy(),rc=TELE_COPAY+TELE_RX;
    h+=`<div class="ph-sub">Start a video visit · ${TELE_MIN} min · $${TELE_COPAY} copay</div>`;
    h+=vis('💊 Renew my prescription','rx',rw||(day()===5?`$${rc} with the meds. By mail: lands Sunday, after tonight.`:`$${rc} with the meds. By mail, in your box tomorrow. No pharmacy run.`),!!rw||!canEssential(rc));
    h+=vis('😮‍💨 I’m stressed out','stress','Advice. Stress −6.',!canEssential(TELE_COPAY));
    h+=vis('🤒 I feel run down','health','Advice. Health +3.',!canEssential(TELE_COPAY));
    if(inj)h+=phBtn('🤕 My ankle',()=>teleAnkle(),{sub:'A quick look on camera. No charge.'});
    h+=phNote(`Doesn’t replace your in-person checkup${apptActive()?` (${DAYS[APPT_DAY]} 2:30 PM)`:''}: they can’t take your blood pressure through a phone. Can’t treat injuries either.`);
    return h}});
