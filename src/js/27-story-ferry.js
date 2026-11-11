// ---- 📖 story mode: the ferry levy vote and the boat's trip to dry dock ----
// Only in story games (S.story exists, set up by 26-story.js). Every wrapper below returns the old value untouched,
// and makes no Math.random() calls, when there's no story, so week and month games are exactly as before.
// State: S.story.ferry (support, vote, limits); flags: S.story.flags.levy = 'pass'|'fail', S.story.flags.drydock = true.
//  Beat 1, "Keep the Boat Running": chapter 0 (summer) is the campaign; chapter 1 (fall) week 0 is the vote,
//    Tuesday Nov 3 (day 1), results at 8 PM. Pass: fares −10%, crew-shortage outages rare. Fail: fares +10%, an extra outage roll a week.
//  Beat 2, dry dock: chapter 1 weeks 1–2 the regular boat is at the shipyard and the relief boat fills in.
const sfOn=()=>typeof S!=='undefined'&&!!(S&&S.story);
const sfCh=()=>typeof S!=='undefined'&&S&&S.story?S.story.ch:-1;
const SF_START=48, SF_VOTE_DAY=1, SF_RESULT_AT=1200, SF_CREW='no relief captain available (crew shortage)', SF_ENGINE='the relief boat’s one engine is acting up';
function sfF(){const st=S.story;if(!st.flags)st.flags={};if(!st.ferry)st.ferry={support:SF_START,vote:null,sig:-1,share:'',flyers:false,talk:'',against:'',morn:'',dockOn:false,acts:0};return st.ferry}
const sfFlags=()=>S.story.flags||(S.story.flags={});
const sfWk=()=>`${sfCh()}:${S.weekNo||0}`;
// reputation decides how far your word carries: +50% for an island regular, half for someone people talk about
function sfRepMul(){const r=typeof repVal==='function'?repVal():0;return r>=60?1.5:r<=-20?0.5:1}
function sfGain(base){const g=Math.round(Math.abs(base)*sfRepMul());return Math.max(1,g)*Math.sign(base)}
function sfSupport(base,why){const F=sfF(),g=sfGain(base);F.support=clamp(F.support+g,0,100);if(g>0)F.acts=(F.acts||0)+1;
  say(`📣 ${why} Levy support ${g>0?'+':'−'}${Math.abs(g)}: about <b>${Math.round(F.support)}%</b> now.${sfRepMul()>1?' People listen to you.':sfRepMul()<1?' Your name doesn’t help much.':''}`);return g}
const sfPct=()=>Math.round(sfF().support);
// ---- phases ----
const sfCampaign=()=>sfOn()&&sfCh()===0;
const sfVoting=()=>sfOn()&&sfCh()===1&&(S.weekNo||0)===0&&day()<=SF_VOTE_DAY&&!sfFlags().levy;
// the levy's effects: from the day after the vote through chapter 3
function sfLevy(){if(!sfOn())return null;const lv=sfFlags().levy;if(!lv)return null;const ch=sfCh();
  return ch>=2||(ch===1&&((S.weekNo||0)*7+day())>SF_VOTE_DAY)?lv:null}
function sfFareMul(){const lv=sfLevy();return lv==='pass'?0.9:lv==='fail'?1.1:1}
const sfDock=()=>sfOn()&&sfCh()===1&&(S.weekNo===1||S.weekNo===2);

// ---- fares: ±10% after the vote ----
function fareWalk(){const m=sfFareMul();return m===1?FARE_WALK:Math.round(FARE_WALK*m*100)/100}
{const _fareCar=fareCar;fareCar=function(){const f=_fareCar.apply(this,arguments),m=sfFareMul();return m===1?f:Math.round(f*m*100)/100}}

// ---- the week: crew-shortage outages after the vote; the relief boat's engine during dry dock ----
function sfMinorOutage(w,d,cause,len){const start=d*1440+Math.floor(6*60+Math.random()*12*60);
  if(w.b.some(x=>start<x.end+120&&start>x.start-240))return false;
  w.b.push({start,end:start+len,cause});return true}
function sfLevyWeek(w,from){from=from||0;const lv=sfFlags().levy;if(!w||!lv||w.sfLevy)return w;w.sfLevy=lv;
  if(lv==='pass') w.b=w.b.filter(b=>b.start<from||b.cause!==SF_CREW||Math.random()<0.2);   // a relief crew on call: most shortages never happen
  else if(Math.random()<0.5){const d0=Math.max(0,Math.ceil(from/1440));if(d0<7){const d=d0+Math.floor(Math.random()*(7-d0));sfMinorOutage(w,d,SF_CREW,90+Math.floor(Math.random()*150))}}
  return w}
// one cancelled midday round trip on about one day in ten: Steilacoom 10:35/AI 11:10, or Steilacoom 12:10/AI 12:45
function sfDockWeek(w){if(!w||w.sfDock)return w;w.sfDock=true;
  for(let d=0;d<7;d++) if(Math.random()<0.1){const win=Math.random()<0.5?[630,675]:[725,770],start=d*1440+win[0],end=d*1440+win[1];
    if(!w.b.some(x=>start<x.end&&end>x.start)) w.b.push({start,end,cause:SF_ENGINE,dock:true})}
  return w}
function sfWeek(w){if(!sfOn()||!w)return w;try{if(sfFlags().levy&&(sfCh()>=2||(sfCh()===1&&(S.weekNo||0)>0)))sfLevyWeek(w);if(sfDock())sfDockWeek(w)}catch(e){console.error(e)}return w}
// genWeek(diff) from newGame/weekRollover; a call with an explicit season is the save loader filling gaps: leave it alone
{const _genWeek=genWeek;genWeek=function(diff,sea){const w=_genWeek.apply(this,arguments);return sea===undefined?sfWeek(w):w}}

// ---- the relief boat: fuller car decks, slower crossings ----
{const _fullProb=fullProb;fullProb=function(side,d,dep){const p=_fullProb.apply(this,arguments);return sfDock()?Math.min(0.95,p*1.8):p}}
{const _cx=crossExtra;crossExtra=function(side,d,dep){return _cx.apply(this,arguments)+(sfDock()?5:0)}}
{const _crossing=crossing;crossing=function(side,cap,cap2,done,sail){
  if(!sail&&sfDock()){const d0=done;cap=String(cap).replace(/^Crossing/,'Crossing on the relief boat');cap2=cap2+' · +5 min, she’s slower';done=()=>{S.t+=5;d0()}}
  return _crossing.call(this,side,cap,cap2,done,sail)}}
{const _note=seasonFerryNote;seasonFerryNote=function(){let t=_note.apply(this,arguments);if(!sfOn())return t;
  if(sfDock()) t+=`<p>🛠️ <b>The regular boat is at the shipyard</b> for its required inspection, through ${S.weekNo===1?'next':'this'} Sunday. The smaller relief boat is running the route: room for far fewer cars, about 5 minutes slower each way, and her one engine sometimes cancels a midday sailing. <b>Walk-ons always fit: walk on if you can.</b></p>`;
  const lv=sfLevy();if(lv) t+=`<p>🗳️ <b>Ferry levy ${lv==='pass'?'passed':'failed'}:</b> fares are ${lv==='pass'?'10% lower':'10% higher'} (${$(fareCar())} with a car, ${$(fareWalk())} on foot).${lv==='pass'?' A relief crew is on call, so crew-shortage cancellations are rare.':' Crews are still short-handed.'}</p>`;
  return t}}
{const _alert=seasonAlert;seasonAlert=function(){const a=_alert.apply(this,arguments);if(a||!sfDock())return a;
  return '🛠️ Dry dock: the relief boat is running. Car decks fill fast. Walk on if you can.'}}

// ---- the vote ----
function sfVoteModal(how){const F=sfF();
  const cast=(v,txt)=>()=>{F.vote=v;F.votedHow=how;S.t+=10;
    say(v==='none'?`🗳️ You ${how==='mail'?'mail':'drop off'} your ballot with the ferry levy left blank. Some questions you sit out.`:`🗳️ You mark <b>${txt}</b> on the ferry levy and ${how==='mail'?'walk the envelope out to the mailbox at the end of the driveway. Postmarked in time.':'slide the envelope into the drop box outside the old store.'}`);
    afterAction()};
  modal('🗳️ Your ballot','<p><b>Pierce County Proposition 1, “Keep the Boat Running”:</b> a small property-tax levy to pay for ferry crews and a relief boat.</p>'+
    '<p><b>Supporters say:</b> fewer sailings cancelled because there’s no relief captain, and a second boat on standby when this one breaks.</p>'+
    '<p><b>Opponents say:</b> it’s a tax on every property owner in the county, most of whom will never ride this boat, and the county should fix its budget first.</p>'+
    '<p>Results Tuesday at 8 PM.</p>',
    [{l:'Vote yes',s:'For the levy.',fn:cast('yes','YES')},{l:'Vote no',s:'Against the levy.',fn:cast('no','NO')},{l:'Leave it blank',s:'Turn in the rest of the ballot.',fn:cast('none','')},{l:'Not yet',fn:()=>{}}])}
function sfResult(notes){if(!sfOn()||sfFlags().levy)return;const F=sfF();
  const v=F.vote==='yes'?1:F.vote==='no'?-1:0,score=F.support+v+(Math.random()*12-6),pass=score>=50;
  sfFlags().levy=pass?'pass':'fail';F.score=Math.round(score*10)/10;
  const yes=clamp(score,20,80).toFixed(1);
  const msg=pass?`🗳️ <b>Election night: the ferry levy passes</b> with ${yes}% yes. Starting tomorrow, fares are 10% lower, and the county starts hiring relief crews so a missing captain doesn’t cancel a whole morning.`
    :`🗳️ <b>Election night: the ferry levy fails</b> with ${yes}% yes. Starting tomorrow, fares go up 10% to cover crew overtime, and the county says the crew shortage isn’t going anywhere.`;
  if(Array.isArray(notes))notes.push(msg);else say(msg);
  try{showTile('🗳️',pass?'Ferry levy passes':'Ferry levy fails',`${yes}% yes · fares ${pass?'−':'+'}10% from tomorrow`,'info')}catch(e){}
  try{if(S.weekNo===0&&sfCh()===1)sfLevyWeek(S.week,(day()+1)*1440)}catch(e){}}

// ---- clock checks: 8 PM election results ----
phoneOnTime(function sfTimed(){if(!sfOn()||S.over)return;
  if(sfCh()===1&&(S.weekNo||0)===0&&!sfFlags().levy&&(day()>SF_VOTE_DAY||(day()===SF_VOTE_DAY&&tod()>=SF_RESULT_AT))) sfResult(null)});

// ---- mornings: the dry dock starts and ends, and election reminders ----
function sfMorning(){if(!sfOn()||S.over)return;const F=sfF(),k=sfWk()+':'+day();if(F.morn===k)return;F.morn=k;const ch=sfCh(),wk=S.weekNo||0,d=day();
  if(ch===1&&wk===0&&d===0&&!F.vote) say('🗳️ The ferry levy is on the ballot. Drop it in the island drop box at the old store by 8 PM tomorrow, or mail it from home today.');
  if(ch===1&&wk===0&&d===1&&!F.vote) say('🗳️ <b>Election Day.</b> The island drop box at the old store closes at 8 PM.');
  if(sfDock()&&!F.dockOn){F.dockOn=true;
    say('🛠️ <b>The regular boat went to the shipyard</b> for its required inspection. For two weeks the smaller relief boat runs the route: far fewer cars per sailing, about 5 minutes slower, and one tired engine. Walk-ons always fit.');
    try{showTile('🛠️','The relief boat is running','Two weeks of dry dock · walk on if you can','warn')}catch(e){}}
  if(F.dockOn&&!sfDock()&&!sfFlags().drydock&&(ch>1||(ch===1&&wk>=3))) sfDockEnd(null);
}
function sfDockEnd(notes){const F=sfF();if(sfFlags().drydock)return;sfFlags().drydock=true;F.dockOn=true;
  const msg='⛴️ <b>The boat is back</b> from the shipyard: fresh bottom paint, a passed inspection, and room for cars again.';
  if(Array.isArray(notes))notes.push(msg);else say(msg);
  try{showTile('⛴️','The boat is back','Dry dock is over','good')}catch(e){}}
{const _startDay=startDay;startDay=function(){const r=_startDay.apply(this,arguments);try{sfMorning()}catch(e){console.error(e)}return r}}
// ---- nights: results if you went to bed early on Election Day; dry dock heads-ups ----
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up.apply(this,arguments);try{if(sfOn()&&sfCh()===1){const wk=S.weekNo||0;
  if(wk===0&&d===SF_VOTE_DAY&&!sfFlags().levy) sfResult(notes);
  if(wk===0&&d===6) notes.push('🛠️ Tomorrow the regular boat goes to the shipyard. The relief boat takes over for two weeks: plan to walk on.');
  if(wk===2&&d===6) notes.push('🛠️ The regular boat is due back from the shipyard tomorrow.');
}}catch(e){console.error(e)}return r}}

// ---- actions: the campaign (chapter 0) and the ballot (chapter 1, week 0) ----
function sfActions(a,loc){const F=sfF(),m=tod(),dk=sfWk()+':'+day(),wk=sfWk();
  if(sfCampaign()){
    if(loc==='aiDock'||loc==='stDock') a.push({cat:'here',ic:'📋',l:'Gather signatures in the ferry line',s:F.sig===dk?'Done for today. The line has heard your pitch.':`30 min with a clipboard for “Keep the Boat Running,” the ferry levy. Support +${sfGain(3)} (once a day).`,dis:F.sig===dk,
      fn:()=>{F.sig=dk;S.t+=30;sfSupport(3,'You work the car line with a clipboard. Some people sign, some roll their windows up.');afterAction()}});
    const riv=loc==='food'&&isOpen('food');
    if(!F.flyers&&loc==='food'){const bbq=typeof fourthDay==='function'&&fourthDay()&&m>=660&&m<900,eve=riv&&m>=1020;
      if(bbq||eve) a.push({cat:'here',ic:'📄',l:bbq?'Hand out levy flyers at the Legion BBQ':'Hand out levy flyers at the Riv',s:`30 min. Support +${sfGain(4)} (once).`,
        fn:()=>{F.flyers=true;S.t+=30;sfSupport(4,bbq?'You hand flyers to everyone in the burger line. A few end up as napkins.':'You leave flyers on the tables at the Riv and answer questions at the bar.');afterAction()}});}
    if(riv||loc==='store'){const where=loc==='food'?'the regulars at the Riv':'people at the bulletin board';
      a.push({cat:'here',ic:'💬',l:'Talk ferry levy with the regulars',s:F.talk===wk?'You’ve made your case this week.':`20 min with ${where}. Support +${sfGain(2)} (once a week).`,dis:F.talk===wk,
        fn:()=>{F.talk=wk;S.t+=20;sfSupport(2,`You talk ferry levy with ${where}. “If it means a relief captain, maybe.”`);afterAction()}});
      a.push({cat:'here',ic:'🗯️',l:'Argue against the ferry levy',s:F.against===wk?'You’ve said your piece this week.':`20 min. Support −${sfGain(2)} (once a week). Not everyone wants another tax.`,dis:F.against===wk,
        fn:()=>{F.against=wk;S.t+=20;sfSupport(-2,'You point out that most of the county will never ride this boat. A couple of heads nod.');afterAction()}});
    }
  }
  if(sfVoting()&&!F.vote){
    if(loc==='store'&&!(day()===SF_VOTE_DAY&&m>=SF_RESULT_AT)) a.push({cat:'here',ic:'🗳️',l:'Drop your ballot in the island drop box',s:`10 min. The ferry levy is on it. ${day()===SF_VOTE_DAY?'Closes 8 PM tonight.':'Due by 8 PM tomorrow.'}`,cls:'primary',fn:()=>sfVoteModal('box')});
    if(loc==='home'&&day()===0) a.push({cat:'here',ic:'✉️',l:'Mail your ballot',s:'10 min. Mailed today, it’s postmarked in time.',fn:()=>sfVoteModal('mail')});
  }
}
{const _actions=actions;actions=function(){const a=_actions.apply(this,arguments);try{if(sfOn())sfActions(a,S.loc)}catch(e){console.error(e)}return a}}
{const _todo=todoItems;todoItems=function(){const it=_todo.apply(this,arguments);try{if(sfOn()){const F=sfF();
  if(sfCampaign()){const wk=sfWk(),dk=wk+':'+day(),left=[F.sig!==dk&&'signatures in the ferry line (today)',F.share!==wk&&'share it in 📣 Island Group',F.talk!==wk&&'talk with the regulars at the Riv or the old store',!F.flyers&&'flyers at the Riv'].filter(Boolean);
    it.push({ok:false,fail:false,l:'Optional: the ferry levy campaign',s:`🗳️ “Keep the Boat Running” is polling around <b>${sfPct()}%</b>. It needs 50% in November. ${left.length?'Still open: '+left.join(', ')+'.':'You’ve done what you can this week.'}`,urgent:false})}
  if(sfOn()&&sfCh()===1&&(S.weekNo||0)===0&&day()<=SF_VOTE_DAY){const done=!!F.vote,lv=sfFlags().levy;
    it.push({ok:done,fail:!done&&!!lv,l:'Vote on the ferry levy',s:done?(F.vote==='none'?'Ballot in, levy left blank.':`Ballot in (${F.vote}). Results Tuesday 8 PM.`):lv?'The polls closed.':'Drop box at the old store until 8 PM Tuesday, or mail it from home Monday.',urgent:!done&&!lv&&day()===SF_VOTE_DAY}) }
}}catch(e){console.error(e)}return it}}
// ---- 📣 Island Group: share the campaign (chapter 0) ----
function sfShare(){if(!phoneCan())return;const F=sfF();F.share=sfWk();S.t+=10;phoneTick();phoneUse(2);
  sfSupport(2,'You share the “Keep the Boat Running” page in the Island Group. Forty comments by dinner, about half of them about a dog.');afterAction()}
{const g=phoneApp('group');if(g){const v=g.view;g.view=function(arg){const body=v.apply(this,arguments);if(!sfCampaign())return body;
  const F=sfF(),done=F.share===sfWk();
  const x=`<div class="ph-sub">🗳️ Keep the Boat Running</div>`+phCard(`The ferry levy campaign is polling around <b>${sfPct()}%</b>.`)+
    phBtn('📣 Share the campaign',()=>sfShare(),{dis:done||!phoneCan(),sub:done?'Shared this week.':`10 min. Support +${sfGain(2)} (once a week).`});
  const k=body.indexOf('<div class="ph-rep">');return k<0?x+body:body.slice(0,k)+x+body.slice(k)}}}

// ---- the story framework's hook ----
const STORY_FERRY_HOOK={id:'ferry',
  chapterStart(ch,notes){if(!sfOn())return;const put=s=>{if(Array.isArray(notes))notes.push(s);else say(s)};const F=sfF();
    if(ch===0){put('🗳️ <b>Keep the Boat Running.</b> A county levy for ferry crews and a relief boat is headed for the November ballot. Supporters want fewer cancellations; opponents don’t want another property tax for a boat most of the county never rides. Help the campaign, argue against it, or ignore it: see the 📋 To-do list.');
      try{showTile('🗳️','The ferry levy campaign',`Polling around ${sfPct()}% · vote in November`,'info')}catch(e){}}
    if(ch===1){put(`🗳️ The ferry levy vote is <b>Tuesday, November 3</b>. Polls have it around ${sfPct()}%. Drop box at the old store, or mail it from home Monday.`);
      put('🛠️ Heads up: the boat goes to the shipyard for two weeks starting <b>Monday the 9th</b>. A smaller relief boat fills in.')}
    if(ch>=2){const lv=sfFlags().levy;if(lv&&ch===2)put(lv==='pass'?'⛴️ The levy money is in: fares are 10% lower and a relief captain is on call.':'⛴️ Fares are still 10% higher since the levy failed, and the crew shortage hasn’t gone away.')}
    try{sfWeek(S.week)}catch(e){}},
  chapterEnd(ch,notes){if(!sfOn())return;const put=s=>{if(Array.isArray(notes))notes.push(s);else say(s)};
    if(ch===0) put(`🗳️ The ferry levy heads into the fall polling around ${sfPct()}%.`);
    if(ch===1){if(!sfFlags().levy)sfResult(notes);sfDockEnd(notes)}},
  ending(flags){flags=flags||{};const L2=[];const F=(typeof S!=='undefined'&&S&&S.story&&S.story.ferry)||{};
    if(flags.levy==='pass') L2.push(`⛴️ The ferry levy passed. Fares came down a little, and a missing captain no longer cancels the morning boats.${F.acts?' Somewhere in a county file is a petition with your handwriting on it.':''}`);
    else if(flags.levy==='fail') L2.push(`⛴️ The ferry levy failed. Fares went up, and some mornings there’s still no relief captain. The campaign says it’ll be back in two years.`);
    if(flags.drydock) L2.push('🛠️ The boat came back from the shipyard in November with fresh paint. Nobody misses the relief boat.');
    return L2}};
if(typeof storyHooks!=='undefined')storyHooks.push(STORY_FERRY_HOOK);
window.STORY_FERRY_HOOK=STORY_FERRY_HOOK;
