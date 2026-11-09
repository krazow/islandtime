// ---------------- 📘 the guided first week + 💬 in-game feedback ----------------
// The guide replaces the old first-day TIPS (09-ui.js) in place: same tip box, same S.tips.seen, same
// "Got it" / "Turn off tips". Old ids are reused where a step covers the same ground, so older saves
// never see a lesson twice. One step at a time; after "Got it" the next one waits until the clock moves,
// so the Next up card gets a turn and the guide never stacks up. Nothing here touches Math.random.

// ======== 1. the guided week ========
const TUT_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Weekend','Weekend'];
const tutSide=()=>L[S.loc].side;
const tutFriends=()=>Object.keys(S.friends||{}).length;
const tutJob=()=>curJob();
const tutJobLoc=()=>tutJob()?tutJob().loc:'work';
// season notes tacked onto a step (empty in fall)
function tutSea(o){const s=seasonId();return o[s]?' '+o[s]:''}
const GUIDE=[
  // ---- Monday: the commute, work, groceries and gas, getting home ----
  {id:'goal',g:0,when:()=>day()===0&&S.loc==='home'&&tod()<600,
    t:()=>`👋 Welcome to the island, {{name}}. Work is on the mainland at <b>${fmt(tutJob()?tutJob().start:540)}</b>, and the island is on the wrong side of the water: open <b>🧭 Go somewhere</b> and drive to the <b>Ferry Landing</b>.`+tutSea({winter:'Ice on the ramp makes early boats late, so leave early.'})},
  {id:'dock',g:0,when:()=>S.loc==='aiDock',
    t:()=>'⛴️ Be <b>in line 20 minutes before</b> your boat leaves or you don’t board (the commuter boat is the <b>7:45</b>, so 7:25). The ⛴️ Ferry tab has the schedule and a trip planner that does the math.'+tutSea({winter:'🧊 On icy mornings the crew sands the ramp first; nobody hurries.',summer:'☀️ In summer, tourists with kayaks fill the car deck: walk on if the line looks long.'})},
  {id:'mainland',g:0,when:()=>S.loc==='stDock'&&!S.worked[day()]&&tod()<720,
    t:()=>`🌆 Steilacoom: civilization, with traffic lights. Drive to <b>${L[tutJobLoc()].name}</b> and clock in on time; your boss has heard every ferry excuse.`},
  {id:'work',g:0,when:()=>!!tutJob()&&S.loc===tutJobLoc()&&tutJob().days.includes(day())&&!S.worked[day()],
    t:'💼 Tap <b>Work a full shift</b>. The clock jumps to the end of your shift and you get paid, which is the whole point of the boat ride.'},
  {id:'groceries',g:0,when:()=>tutSide()==='M'&&!!S.worked[day()]&&S.pantry<=3&&!S.carried,
    t:'🛒 Groceries live over here now: the <b>Supermarket (Lakewood)</b> has normal prices. Your pantry has a couple of days left, and the island store has been closed since February.'},
  {id:'fuel',g:0,when:()=>tutSide()==='M'&&!!carHere()&&carHere().fuel<6,
    t:'⛽ There’s <b>no gas on the island</b>, and gas cans are banned on the ferry. Fill up at the <b>Gas Station (Steilacoom)</b> while you’re on this side.'},
  {id:'gohome',g:0,when:()=>S.loc==='stDock'&&!!S.worked[day()],
    t:()=>'🌙 Evening boats fill up with commuters. If yours is full of cars, walk on or catch the next one; the gulls don’t mind waiting with you.'+tutSea({summer:'Summer Fridays and Sundays are the worst.'})},
  {id:'bed',g:0,when:()=>S.loc==='home'&&tod()>=1080,
    t:'🛏️ Before bed, set your <b>⏰ alarms</b>: the plug-in clock, your phone, or both. Each night you eat a day of food from the pantry.'},
  // ---- winter: drip the faucets (any freezing night at home) ----
  {id:'winter_drip',g:-1,when:()=>seasonId()==='winter'&&S.loc==='home'&&(tod()>=900&&coldNight(day())||tod()>=1080),
    t:'🚰 Winter rule: on freezing nights, <b>drip the faucets</b> (🏠 Inside the house). Moving water doesn’t freeze; a burst pipe costs $280 and a morning in the crawlspace.'},
  // ---- Tuesday: your phone, friends, trading ----
  {id:'phone_apps',g:1,when:()=>day()>=1,
    t:'📱 <b>Your phone</b> (top right) texts, calls and sets alarms. The 🛍️ App Store has <b>5 slots</b>: install apps for the ferry, money or groceries, and choose carefully, because one bar on the island makes installs slow.'},
  {id:'friends',g:1,when:()=>day()>=1&&tutFriends()>0,
    t:'🤝 You have an island friend. <b>Text them</b> from 📱 Messages once a day: friends give rides, jump-starts and gas, and they’ll ask favors back.'},
  {id:'trading',g:1,when:()=>!!MARKETS[S.loc]&&!tradingLocked(),
    t:'🛒 <b>Trading is open:</b> buy on the mainland, sell on the island for more. Gas cans and drugs are contraband on the ferry, and the deckhands do look.'},
  // ---- Wednesday: bingo, island friends ----
  {id:'bingo',g:2,when:()=>day()===2&&tod()>=840&&!S.bingo.nights,
    t:()=>`🎱 Tonight is <b>Bingo at the Riv</b>, 6 PM, run by the American Legion for the ${BINGO_FOR[S.week.bingo]}. Half the island shows up, which makes it the best place to meet people.`},
  {id:'meet',g:2,when:()=>day()>=2&&tutSide()==='I'&&S.loc!=='aiDock'&&!tutFriends(),
    t:'🌲 Islanders warm up slowly. The Riv, bingo, the swap board at the old store and the lake are where friends get made; nobody gets made on the 7:45.'},
  // ---- Thursday: the doctor's appointment and prescription ----
  {id:'doctor',g:3,when:()=>apptActive()&&day()===APPT_DAY&&!S.appt&&!S.apptMissed&&tod()<840,
    t:'🩺 Doctor today: <b>2:30 PM at the Medical Clinic (Tacoma)</b>, check in 2:00–2:45. Set the ⛴️ trip planner to the clinic and it picks the boat.'},
  {id:'rx',g:3,when:()=>day()>=3&&!S.rx&&tutSide()==='M',
    t:'💊 Your prescription refill is ready at the <b>Pharmacy (Lakewood)</b>. You run out Saturday night, and the island doesn’t have a pharmacy. Or a store.'},
  // ---- Friday & the weekend: the house, Gus and the group, a day off ----
  {id:'home_meter',g:4,when:()=>S.loc==='home'&&(day()>=4||(S.home??70)<50||(day()>=1&&upAnyDue())),
    t:'🏠 The <b>Home</b> meter is your house holding up: it slips daily, and chores and repairs raise it. Jobs that are due light up in <b>🏠 Inside the house</b> and <b>🌲 Outside &amp; property</b> below.'},
  {id:'bills',g:4,when:()=>S.loc==='home'&&day()>=4,
    t:'🧾 The bills come whether the ferry runs or not. Pay online from your phone in five minutes, or mail a check two days ahead and hope.'},
  {id:'gus',g:4,when:()=>S.loc==='home'&&(day()>=4||(S.home??70)<35),
    t:'🧰 Too much to fix? <b>Call Gus</b> (📱 Phone → Island numbers), or ask the island community group from your phone. Help arrives on island time.'},
  {id:'dayoff',g:5,when:()=>day()>=5&&tod()<720&&!(tutJob()&&tutJob().days.includes(day())),
    t:()=>'☕ A day off: no boat to catch. Rest, deep clean, see friends or pick up a weekend shift; just remember the Sunday evening boats are packed.'+tutSea({winter:'Keep the woodstove fed.',summer:'Water the garden first.'})},
  // ---- any day, when it happens ----
  {id:'storm',g:-1,when:()=>!!S.week.storm&&S.week.storm.day===day(),
    t:'🌬️ A storm means power outages. A <b>generator</b> (Home Depot, Lakewood) plus gas stashed in your shed keeps the fridge, heat and phone going.'},
  {id:'home_low',g:-1,when:()=>S.loc==='home'&&(S.home??70)<35,
    t:'🏚️ Your <b>Home</b> meter is low: worse sleep, more things breaking, fewer visitors. A <b>🧽 Deep clean</b> on a day off is the big reset.'},
];
// ids folded into the guide (older saves may have them; nothing shows them now)
const TUT_FOLDED=['upkeep_due'];
TIPS.splice(0,TIPS.length,...GUIDE);
function tutState(){S.tips=S.tips||{seen:[]};S.tips.seen=S.tips.seen||[];return S.tips}
function tutNext(){
  if(!tipsOn()||!S||S.over) return null;
  const T=tutState();
  if(T.at===S.t) return null;   // just dismissed one: the next waits for the clock to move
  return TIPS.find(x=>!T.seen.includes(x.id)&&!TUT_FOLDED.includes(x.id)&&(()=>{try{return !!x.when()}catch(e){return false}})())||null;
}
tipView=function(){
  const t=tutNext();if(!t) return '';
  const txt=typeof t.t==='function'?(()=>{try{return t.t()}catch(e){return ''}})():t.t;if(!txt) return '';
  const g=t.g>=0?TUT_DAYS[t.g]:'Heads up';
  return `<div class="tip" role="note" aria-label="Guided week tip"><div class="tut-k">📘 Guided week · ${g}</div>${txt}<div class="tb"><button onclick="tipSeen('${t.id}')">Got it</button><button onclick="setPref('tips',false);render()">Turn off tips</button></div></div>`;
};
window.tipSeen=id=>{const T=tutState();if(!T.seen.includes(id))T.seen.push(id);T.at=S.t;render()};
function tutReplay(){S.tips={seen:[]};if(!prefs().tips)setPref('tips',true);tab='act';say('📘 The guided week starts over. Tips will pop up as you go.')}
// rows for ⚙️ Settings (01-core.js openSettings)
function tutSettingRows(inGame){
  const rows=[];
  if(inGame) rows.push({l:'📘 Replay the guided week',s:'Shows this game’s tips again, from where you are now.',fn:()=>{tutReplay()}});
  rows.push({l:'💬 Send feedback',s:'Report a bug, share an idea, or tell us what felt unfair.',fn:()=>feedbackOpen()});
  return rows;
}

// ======== 2. 💬 feedback ========
const FB_REPO='https://github.com/krazow/islandtime/issues/new';
const FB_MAX=6000, FB_TEXT=2000;
const FB_TYPES={bug:'Bug',idea:'Idea',unfair:'Something felt unfair'};
let FB={type:'bug',text:'',name:false,from:null};
function fbInGame(){return typeof S!=='undefined'&&!!S&&!!S.week&&!!L[S.loc]}
function fbSummary(){
  const lines=[`Version: ${APP_VERSION}`];
  if(fbInGame()){
    const D=DF(),d=day();
    lines.push(`Season: ${seasonId()} · Difficulty: ${S.diff} (${D.n}) · Mode: ${S.mode}${S.mode==='month'?` (week ${(S.weekNo||0)+1}/4)`:''}`);
    lines.push(`When: ${DAYS[d]} ${fmt(S.t)} (day ${d+1})${S.over?' · game over':''}`);
    lines.push(`Location: ${L[S.loc].name}`);
    lines.push(`Stats: cash $${Math.round(S.money)} · food ${S.pantry}d · health ${S.health} · stress ${S.stress} · job ${S.emp?S.job:'none'} · home ${S.home??70}`);
    lines.push(`Friends: ${Object.keys(S.friends||{}).length}`);
    if(typeof PH==='function'&&typeof phoneApp==='function'){let a=[];try{a=PH().apps.map(id=>{const p=phoneApp(id);return p?p.name:id})}catch(e){}lines.push(`Phone apps: ${a.length?a.join(', '):'none'}`)}
  } else lines.push('Game: none in progress');
  lines.push(`Browser: ${navigator.userAgent}`);
  if(FB.name) lines.push(`Player name: ${currentName()}`);
  return lines.join('\n');
}
// code-point safe trim (never splits an emoji, which would break encodeURIComponent)
function fbCut(s,n){const a=Array.from(s);return a.length<=n?s:a.slice(0,Math.max(0,n)).join('')}
function fbTitle(){const t=FB.text.replace(/\s+/g,' ').trim();return `[${FB_TYPES[FB.type]}] ${t?fbCut(t,60)+(Array.from(t).length>60?'…':''):`Feedback from Island Time ${APP_VERSION}`}`}
function fbBody(text){return `**Type:** ${FB_TYPES[FB.type]}\n\n**What happened / what you’d like:**\n${text||'(no description)'}\n\n---\n**Game summary**\n\`\`\`\n${fbSummary()}\n\`\`\`\n`}
function fbReport(){return `${fbTitle()}\n\n${fbBody(FB.text.trim())}`}
function fbURL(){
  const title=fbTitle(),make=t=>`${FB_REPO}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(fbBody(t))}`;
  let text=FB.text.trim(),url=make(text);
  // too long for a URL: trim the player's text first (the summary is what we need most), then everything
  while(url.length>FB_MAX&&text.length){const over=url.length-FB_MAX;text=fbCut(text,Math.max(0,Array.from(text).length-Math.max(20,Math.ceil(over/3))));url=make(text+' …(truncated: use Copy report for the full text)')}
  if(url.length>FB_MAX){url=url.slice(0,FB_MAX);url=url.replace(/%[0-9A-Fa-f]?$/,'')}
  return url;
}
function fbUpdate(){
  const a=document.getElementById('fbLink'),r=document.getElementById('fbReport');
  if(a)a.href=fbURL();
  if(r)r.value=fbReport();
  const n=document.getElementById('fbCount');if(n)n.textContent=`${Array.from(FB.text).length}/${FB_TEXT}`;
}
window.fbSet=(k,v)=>{if(k==='text')v=fbCut(String(v||''),FB_TEXT);FB[k]=v;fbUpdate()};
window.fbCopy=()=>{
  const r=document.getElementById('fbReport'),msg=document.getElementById('fbMsg'),txt=fbReport();
  const show=t=>{if(msg)msg.textContent=t;try{a11yAnnounce(t)}catch(e){}};
  const fallback=()=>{if(r){r.value=txt;r.focus();r.select();try{r.setSelectionRange(0,txt.length)}catch(e){}}
    let ok=false;try{ok=document.execCommand&&document.execCommand('copy')}catch(e){ok=false}
    show(ok?'✅ Copied.':'Selected: press Ctrl+C (or long-press → Copy) to copy the report.')};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>show('✅ Copied. Paste it anywhere.'),fallback);return}}catch(e){}
  fallback();
};
function feedbackOpen(){
  FB={type:FB.type||'bug',text:'',name:false};
  const types=Object.keys(FB_TYPES).map(k=>`<label class="fb-type"><input type="radio" name="fbType" value="${k}" ${k===FB.type?'checked':''} onchange="fbSet('type','${k}')"> ${{bug:'🐞',idea:'💡',unfair:'⚖️'}[k]} ${FB_TYPES[k]}</label>`).join('');
  modal('💬 Send feedback',`<div class="fb"><div class="fb-types" role="radiogroup" aria-label="Kind of feedback">${types}</div>
    <label class="fb-lab" for="fbText">What happened? <span id="fbCount" class="fb-n">0/${FB_TEXT}</span></label>
    <textarea id="fbText" class="fb-text" rows="4" maxlength="${FB_TEXT}" placeholder="A sentence or two is plenty." oninput="fbSet('text',this.value)"></textarea>
    <label class="fb-chk"><input type="checkbox" id="fbName" onchange="fbSet('name',this.checked)"> Include my in-game name</label>
    <label class="fb-lab" for="fbReport">Report (added automatically, nothing personal)</label>
    <textarea id="fbReport" class="fb-rep" rows="6" readonly></textarea>
    <div class="fb-btns"><a id="fbLink" class="fb-gh" target="_blank" rel="noopener" href="${FB_REPO}">🐙 Open a GitHub issue</a><button type="button" class="fb-copy" onclick="fbCopy()">📋 Copy report</button></div>
    <p id="fbMsg" class="fb-msg" aria-live="polite"></p>
    <p class="fb-note">The GitHub page opens in a new tab; you need a free GitHub account to post. No account? Copy the report and send it however you like.</p></div>`,
    [{l:'Close',fn:()=>{}}]);
  fbUpdate();
}
window.feedbackOpen=feedbackOpen;
// a small link on the end screen
{const _endScreen=endScreen;
  endScreen=function(){
    const r=_endScreen.apply(this,arguments);
    try{const end=document.querySelector('.end');
      if(end&&!document.getElementById('fbEnd')){const p=document.createElement('p');p.className='fb-end';
        p.innerHTML='<button type="button" id="fbEnd" class="linkbtn" onclick="feedbackOpen()">💬 Send feedback</button>';end.appendChild(p)}}catch(e){console.error(e)}
    return r};}
