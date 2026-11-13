// ---- ✨ What's new (83-whats-new.js) ----
// A "What's new" button on the title screen (and in the update pop-up) lists what changed in each release, newest first, and plays that
// release's what's-new video. Videos live on the game's website (tour/), so they need internet; offline the window says so.
// EVERY RELEASE: add an entry at the top of WHATSNEW (v, date, title, items) and its video (tour/whatsnew-<v>.mp4).
const WN_SITE='https://krazow.github.io/islandtime/',WN_TUTORIAL='tour/IslandTime-tutorial.mp4';   // the how-to-play video tutorial (subtitled)
const WHATSNEW=[
  {v:'1.23.0',date:'Nov 13, 2026',title:'Islander or Visitor, right from the start',video:'tour/whatsnew-1.23.0.mp4',items:[
    'The title screen has a card for each way to play: 🏝️ Islander and 🧳 Visitor, each with its own Continue, Start a new game and Saves.',
    'Three save slots for each, six in all. Your saved games were sorted onto the right card when you updated; nothing was lost.',
    'Visitors get their own difficulty levels: 🌤️ Easy Sunday (more money, light I-5 traffic, no crashes, a heads-up before the last boat), 📸 Tourist (the visit as designed) and 🌧️ Missed the Boat (a tighter budget, fuller boats and more fog, heavier traffic, no last-boat warning).',
    'Islanders keep Normal and Ferry Hell; the easy level is now called 🌲 Old-timer, so it doesn’t clash with the Islander card.',
    'The top of the screen always shows which way you’re playing and at what level, like “🧳 Visitor · 📸 Tourist”.',
    'A weekend regular who buys the house moves to an Islander slot on their own. Challenges always go in an Islander slot.']},
  {v:'1.22.3',date:'Nov 13, 2026',title:'Start a new game, and a day out in Seattle',video:'tour/whatsnew-1.22.3.mp4',items:[
    'The title screen’s Start a new week button is now Start a new game.',
    'It asks how you want to play: live on the island (a week, a month or story mode), visit the island, be a weekend regular, or take the weekly or daily challenge.',
    'The separate Visit the island button is gone; it’s one of the choices now.',
    'Going out in Seattle: Ivar’s Acres of Clams on the waterfront, Dick’s Drive-In on Capitol Hill, Pike Place Market, the Space Needle and MOPOP. It’s a real I-5 drive from the Steilacoom ferry: about 55 minutes with clear roads, closer to an hour and a half in rush hour or Friday traffic. They’re on a new Seattle map tab. A visitor who lives in Seattle also drives about an hour to the ferry now, not 76 minutes.',
    'Fixed: visitors staying at the rental cabin were warned about the “last boat home” to the island. Their home is on the mainland, so the warning now says “last boat back to the island”.']},
  {v:'1.22.2',date:'Nov 12, 2026',title:'A video tutorial',video:WN_TUTORIAL,items:[
    'A subtitled video tutorial that walks through the whole game: starting out, the screen, the ferry, work and money, food and gas, the phone, your house, friends, vehicles, the boat, visiting, and how a game ends.',
    'Watch it from this window, or at krazow.github.io/islandtime/tour.',
    'The older demo videos are retired in favour of the tutorial.']},
  {v:'1.22.1',date:'Nov 12, 2026',title:'Real maps, and this window',items:[
    'The tappable maps are drawn from real shorelines: Anderson Island has its true outline (Amsterdam Bay, Oro Bay, Yoman Point), and the mainland map runs from DuPont to Point Defiance.',
    'Every place sits where it really is: the ferry landing, the old store, the schoolhouse, Lake Josephine, Florence Lake, and the restaurants and shops on the mainland.',
    'Visitors from Seattle or Olympia get a third map tab for their home city, on its real shoreline.',
    'On the mainland map both landings are in view, so you can watch the boat cross the whole way.',
    'A What’s new button on the title screen.']},
  {v:'1.22.0',date:'Nov 11, 2026',title:'A fleet of your own',items:[
    'Every car has its own battery, spare tire and trouble history; a Your vehicles card shows them all.',
    'Car storage: the mainland beater waits at the Steilacoom terminal ($8 a night), Weekend regulars bring their city car when they move in, and you can sell or trade cars back.',
    'Boat ownership: keep the skiff in a slip, on a trailer in your yard or on your mooring buoy; tow it, register it, upgrade it, fish and crab from it, and buy the lot next door for a third garage bay.',
    'The Monday fuel run is a propane tanker (there’s no gas station on the island).',
    'Late on the mainland with a low tank, you can fill up and drive home.']},
  {v:'1.21.0',date:'Nov 11, 2026',title:'More to do, and a map',items:[
    'A tappable map of the island and the mainland.',
    'Fishing, crabbing, blackberry picking and a playable bingo card; friend storylines; 20 memorable moments.',
    'Your own skiff, cabin upgrades, holidays, a daily challenge and a two-car garage.']},
  {v:'1.20.0',date:'Nov 11, 2026',title:'Weekend regular',items:[
    'Live on the mainland with a city job and rent, spend every weekend on the island, and save up to move over.',
    'The rental cabin costs what Anderson Island Airbnbs average by season.']},
  {v:'1.19.0',date:'Nov 11, 2026',title:'Visit the island',items:[
    'Visitor mode: a day trip, a weekend or a week from Seattle, Tacoma or Olympia. Beat I-5 traffic and catch the last boat home.',
    'Going out: 15 real restaurants and attractions in Steilacoom, Lakewood and Tacoma.']},
  {v:'1.18.0',date:'Nov 10, 2026',title:'Difficulty levels that mean something',items:[
    'Islander, Normal and Ferry Hell now change money, breakdowns, rent, the boss and the weather; the Legion food pantry helps on Hard.']},
  {v:'1.17.0',date:'Nov 10, 2026',title:'Island reputations and a weekly challenge',items:[
    'Every islander has a reputation and acts on their own; real fuel use by miles and mpg; one seeded week everyone can compare.']},
  {v:'1.16.0',date:'Nov 10, 2026',title:'Story mode and spring',items:[
    'A year on the island in four chapters: the ferry levy, the storm of the decade and the co-op store. Plus spring, and job listings that change.']},
  {v:'1.15.0',date:'Nov 9, 2026',title:'Island delivery and reputation',items:[
    'Mail and packages come to your porch, the Island Group sorts out lost packages, and island reputation runs from −100 to +100.']},
  {v:'1.14.0',date:'Nov 9, 2026',title:'Eight phone apps',items:[
    'Ferry Pass, Island Rides, Tides & Weather, the credit union, gig work and more; a guided first week; a feedback button.']},
];
function wnVideoHTML(e){
  if(!e.video)return '';
  const online=typeof navigator==='undefined'||navigator.onLine!==false;
  const src=WN_SITE+e.video;
  return `<div class="wnvid">${online?`<video controls playsinline preload="metadata" poster="${WN_SITE}tour/tutorial-poster.jpg" src="${src}" onerror="this.parentNode.innerHTML='<p class=small-note>📶 The video needs an internet connection. Watch it later at krazow.github.io/islandtime/tour</p>'"></video>`
    :`<p class="small-note">📶 The ${esc(e.v)} video needs an internet connection. Watch it later at krazow.github.io/islandtime/tour</p>`}</div>`;
}
function wnItems(e){return `<ul class="wnlist">${e.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`}
function whatsNew(){
  const [cur,...old]=WHATSNEW;
  let h=`<p class="wnhead"><b>${esc(cur.v)}</b> · ${esc(cur.date)} · ${esc(cur.title)}</p>`+wnVideoHTML(cur)+wnItems(cur);
  if(cur.video!==WN_TUTORIAL)h=`<details class="wnv"><summary>🎓 Watch the tutorial (how to play)</summary>${wnVideoHTML({v:'tutorial',video:WN_TUTORIAL})}</details>`+h;
  if(old.length)h+=`<details class="wnold"><summary>Earlier releases</summary>${old.map(e=>`<p class="wnhead"><b>${esc(e.v)}</b> · ${esc(e.date)} · ${esc(e.title)}</p>${e.video?`<details class="wnv"><summary>▶ Watch the ${esc(e.v)} video</summary>${wnVideoHTML(e)}</details>`:''}${wnItems(e)}`).join('')}</details>`;
  modal('✨ What’s new in Island Time',h,[{l:'Close',fn:()=>{try{const ls=store();ls&&ls.setItem('islandtime-wn-seen',APP_VERSION)}catch(e){}const d=document.querySelector('#wnBtn .wndot');if(d)d.remove()}}]);
}
window.WHATSNEW_OPEN=whatsNew;
// the title-screen button, just above Save slots (the title is first drawn before this module loads, so add it now too)
function wnInject(){try{const b=document.querySelector('.title .body button[onclick="slotsModal()"]');
  if(b&&!document.getElementById('wnBtn')){let seen=null;try{const ls=store();seen=ls&&ls.getItem('islandtime-wn-seen')}catch(e){}
    b.insertAdjacentHTML('beforebegin',`<button id="wnBtn" class="ghost" onclick="WHATSNEW_OPEN()">✨ What’s new in ${esc(APP_VERSION)}${seen===APP_VERSION?'':' <span class="wndot">new</span>'}</button>`)}}catch(e){console.error(e)}}
{const _ts=titleScreen;titleScreen=function(){const r=_ts.apply(this,arguments);wnInject();return r}}
wnInject();
{const st=document.createElement('style');st.textContent=`.wnvid video{width:100%;border-radius:10px;background:#000;margin:4px 0 8px}.wnlist{margin:4px 0 10px;padding-left:18px}.wnlist li{margin:3px 0}.wnhead{margin:10px 0 2px}.wnold summary,.wnv summary{cursor:pointer;font-weight:700;margin:8px 0}.wndot{background:#e3642e;color:#fff;border-radius:8px;padding:1px 6px;font-size:11px;margin-left:4px}`;document.head.appendChild(st)}
