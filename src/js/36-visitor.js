// ---- 🧳 visitor mode: play a visit to Anderson Island instead of living there ----
// SHARED CONTRACT (other visitor files rely on these names; extend, don't rename):
//   visitorOn()          true while the current game is a visit (S.visitor is set)
//   VS()                 the visit state, S.visitor, with missing fields filled in (old saves / partial states)
//   VISIT_LENS[len]      the three visit lengths
//   VISIT_HOMES[home]    where the visitor lives on the mainland (drive to the Steilacoom ferry, I-5 traffic weight)
//   VSIGHTS              places to see on the island; loc = a key of L (some are added by 37-visitor-sights.js)
//   L.home               during a visit = the rental cabin on the island (the core file renames it on screen)
//   L.vhome              during a visit = the visitor's own home on the mainland (added by 38-visitor-travel.js)
// Files: 36 core (lengths, rental, budget, end of visit, title screen, guide, saves) · 37 sights + scoring + visitor
//        reputation · 38 travel (home → dock, I-5 traffic, packed food, missing the last boat) · 39 visitor phone.
const VISIT_LENS={
  day:    {n:'Day trip', ic:'☀️', nights:0, d:'Saturday. Catch a morning boat over, see what you can, and make the last boat home.'},
  weekend:{n:'Weekend',  ic:'🏕️', nights:2, d:'Friday evening to Sunday. Two nights in a rental cabin.'},
  week:   {n:'A week',   ic:'🌲', nights:6, d:'Monday to Sunday in a rental cabin. Time to see it all, and to run out of groceries.'},
};
const VISIT_HOMES={
  seattle:{n:'Seattle', ic:'🏙️', mi:55, i5:1,    d:'About 55 miles up I-5. The worst traffic.'},
  tacoma: {n:'Tacoma',  ic:'🌉', mi:15, i5:0.5,  d:'About 15 miles. A short drive, some I-5 traffic.'},
  olympia:{n:'Olympia', ic:'🏛️', mi:25, i5:0.35, d:'About 25 miles south. Lighter traffic.'},
};
const VSIGHTS=[
  {id:'lake',   loc:'lake',   n:'Lake Josephine',           ic:'🦅'},
  {id:'farm',   loc:'farm',   n:'Johnson Farm museum',      ic:'🚜'},
  {id:'andys',  loc:'andys',  n:'Andy’s Wild Wood Park',    ic:'🌳'},
  {id:'jacobs', loc:'jacobs', n:'Jacobs Point',             ic:'🌊'},
  {id:'riv',    loc:'food',   n:'Dinner at the Riv',        ic:'🍔'},
  {id:'legion', loc:'legion', n:'An event at the Legion',   ic:'🇺🇸'},
];
const visitorOn=()=>!!(typeof S!=='undefined'&&S&&S.visitor);
function vsInit(len,home){return {len:len||'weekend',home:home||'tacoma',budget:0,spent:0,photos:{},seen:{},rep:0,packed:0,
  rental:{in:null,out:null,checkedIn:false,checkedOut:false},done:false,result:null}}
function VS(){if(!S.visitor)return null;const v=S.visitor,d=vsInit(v.len,v.home);
  for(const k in d){if(v[k]===undefined)v[k]=d[k];else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&typeof v[k]==='object')for(const j in d[k])if(v[k][j]===undefined)v[k][j]=d[k][j]}
  return v}
