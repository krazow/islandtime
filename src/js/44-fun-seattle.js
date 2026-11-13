// ---- 🎟️ going out in Seattle: two restaurants (waterfront seafood, a late-night burger stand) + Pike Place Market, the Space Needle and MOPOP ----
// Uses defFun() from 40-fun.js. Seattle is a long drive from the Steilacoom ferry (about 45 miles of I-5), so for an islander it's a day out;
// for a visitor who lives in Seattle it's close to home. Hours are rough 2026 hours (d: 0 Mon … 6 Sun); prices are 2026 dollars.
// On the map these sit on the Seattle tab (50-map.js). pos is only a fallback: drives to and from Seattle are worked out below.
defFun({id:'sea_ivars',town:'Seattle',kind:'restaurant',name:'Ivar’s Acres of Clams (Pier 54)',ic:'🐚',
  desc:'Seattle’s waterfront seafood institution since 1938, on Pier 54 over Elliott Bay. Washington State ferries slide past the windows, and outside at the Fish Bar people still feed fries to the gulls.',
  pos:[9.6,23.2],
  hours:d=>[660,d===4||d===5?1380:1320],
  acts:[
    {l:'Cioppino and a view of the ferries',s:'A real sit-down seafood dinner. Counts as tonight’s food. Stress −8.',min:80,cost:48,stress:-8,sat:1,done:'You eat cioppino by the window while a big green-and-white state ferry backs out of Colman Dock. Nobody makes you line up for this one'},
    {l:'Fish ’n chips from the Fish Bar',s:'Walk-up window, eat outside. Counts as tonight’s food. Stress −5.',min:30,cost:18,stress:-5,sat:1,done:'Fish ’n chips at the outdoor Fish Bar. A gull watches every fry you eat, and you give it one'}]});

defFun({id:'sea_dicks',town:'Seattle',kind:'restaurant',name:'Dick’s Drive-In (Broadway)',ic:'🍔',
  desc:'The walk-up burger window on Capitol Hill, open since 1954 and open late (until 2 AM). A Deluxe, hand-cut fries and a hand-dipped shake, cheap and fast. A very different meal from the waterfront.',
  pos:[10.3,24.1],
  hours:()=>[630,1440],
  acts:[
    {l:'A Deluxe, fries and a shake',s:'Fast, cheap and filling. Counts as tonight’s food. Stress −5.',min:25,cost:12,stress:-5,sat:1,done:'A Dick’s Deluxe, a sleeve of fries and a chocolate shake, eaten standing up under the orange sign'},
    {l:'Just a shake',s:'Hand-dipped. Stress −3.',min:10,cost:4,stress:-3,done:'A hand-dipped vanilla shake on Broadway. It is gone in four minutes'}]});

defFun({id:'sea_pike',town:'Seattle',kind:'fun',name:'Pike Place Market',ic:'🐟',
  desc:'The public market above the waterfront, open since 1907: fishmongers throwing salmon, flower stalls, the first Starbucks, the Gum Wall, and the stairs down to the Overlook Walk. Free to wander. Closed Thanksgiving and Christmas.',
  pos:[9.6,23.4],
  hours:()=>[540,1080],
  acts:[
    {l:'Wander the market',s:'Free. Watch the fish fly. Stress −8.',min:90,cost:0,stress:-8,done:'You watch a whole salmon sail over the counter, buy nothing, and enjoy every minute of it'},
    {l:'Graze your way through: chowder, a piroshky, mini doughnuts',s:'Counts as tonight’s food. Stress −9.',min:75,cost:24,stress:-9,sat:1,done:'Chowder, a warm piroshky and a paper bag of tiny doughnuts. You are full and smell faintly of cinnamon'},
    {l:'Buy a bouquet at the flower stalls',s:'For the kitchen table. Stress −4.',min:20,cost:20,stress:-4,done:'An armful of flowers for twenty dollars. It will look great on the kitchen table, if it survives the trip'}]});

defFun({id:'sea_needle',town:'Seattle',kind:'fun',name:'Space Needle',ic:'🗼',
  desc:'The 1962 World’s Fair tower at Seattle Center, with a glass floor and floor-to-ceiling windows 520 feet up. On a clear day you can see Mount Rainier and, if you squint south, the water you cross every day. Tickets run about $35–55 by time of day.',
  pos:[9.4,24.1],
  hours:d=>[600,d===4||d===5?1320:1260],
  acts:[
    {l:'Go up to the top',s:'General admission about $49. Stress −10.',min:75,cost:49,stress:-10,done:'You stand on the glass floor 500 feet up and try not to look down, then look down anyway'},
    {l:'Go up at sunset',s:'Same ticket, better light. Stress −12.',min:90,cost:49,stress:-12,done:'The sun goes down behind the Olympics and the whole city turns gold. Worth every dollar'}]});

defFun({id:'sea_mopop',town:'Seattle',kind:'fun',name:'MOPOP (Museum of Pop Culture)',ic:'🎸',
  desc:'Frank Gehry’s crumpled red-and-gold building at Seattle Center, full of music, sci-fi, video games and horror. Hendrix and Nirvana guitars, a guitar sculpture two stories tall, and sound booths where you can play the drums. Open 10 AM to 5 PM daily.',
  pos:[9.4,24.2],
  hours:()=>[600,1020],
  acts:[
    {l:'See the whole museum',s:'Adult admission about $32. Stress −11.',min:150,cost:32,stress:-11,done:'Guitars, starships and a hallway of horror-movie props. You lose an hour in the sound lab playing drums badly'},
    {l:'Just the music galleries and the sound lab',s:'Same ticket, shorter visit. Stress −8.',min:80,cost:32,stress:-8,done:'You stand under the giant guitar sculpture, then play a song on a real stage with nobody listening'}]});

// ---- realistic drives to and from Seattle (I-5): about 45 miles and 55 minutes from Steilacoom with clear roads,
// 75–100 minutes in rush hour or Friday traffic. Trips inside Seattle are short city drives. Overrides dist() and the
// car/rideshare/bus options for any trip with one end in Seattle and the other elsewhere on the South Sound mainland.
const SEA_HOME_KEYS=['vhome','rwork','rmarket'];
function seaHere(k){const l=L[k];if(!l||l.side!=='M')return false;if(l.town==='Seattle')return true;
  return SEA_HOME_KEYS.includes(k)&&typeof visitorOn==='function'&&visitorOn()&&VS().home==='seattle'}
function seaLL(k){
  if(typeof MAPLL!=='undefined'&&MAPLL[k])return MAPLL[k];
  if(SEA_HOME_KEYS.includes(k)&&typeof visitorOn==='function'&&visitorOn()){const h=VS().home;
    if(typeof MAPHOMELL!=='undefined'&&MAPHOMELL[h]&&MAPHOMELL[h][k])return MAPHOMELL[h][k];
    if(typeof MAPCITY!=='undefined'&&MAPCITY[h])return MAPCITY[h]}
  return [47.160,-122.515]}   // anywhere else: Lakewood
function seaMiles(a,b){const p=seaLL(a),q=seaLL(b),dy=(p[0]-q[0])*69,dx=(p[1]-q[1])*69*Math.cos(p[0]*Math.PI/180);return Math.hypot(dx,dy)}
const SEA_FREEWAY=(a,b)=>Math.round(seaMiles(a,b)*1.3/55*60+8);     // road miles ≈ 1.3 × straight line, ~55 mph on I-5, plus city streets and parking
const SEA_CITY=(a,b)=>Math.round(seaMiles(a,b)*1.4/20*60+6);        // Seattle surface streets, ~20 mph
{const _d=dist;dist=function(a,b){
  if(a===b)return 0;
  try{const A=seaHere(a),B=seaHere(b);
    if(A&&B)return SEA_CITY(a,b);
    // a visitor's own commute (home, job, store) keeps the visitor drive model (38-visitor-travel.js), which has its own I-5 traffic and crashes
    if(SEA_HOME_KEYS.includes(a)||SEA_HOME_KEYS.includes(b))return _d(a,b);
    if((A||B)&&L[a].side==='M'&&L[b].side==='M')return SEA_FREEWAY(a,b)}catch(e){console.error(e)}
  return _d(a,b)}}
// I-5 traffic between the South Sound and Seattle: what WSDOT would tell you before you leave
function seaTraffic(north,t){
  const d=Math.floor(t/1440)%7,m=t%1440,wk=d<5;let x=5,why='moving at the speed limit';
  if(wk&&m>=360&&m<570){x=north?35:12;why=north?'slow with morning commuters into Seattle':'a little slow with morning traffic'}
  else if(wk&&m>=900&&m<1110){x=north?20:40;why=north?'slow with evening traffic':'slow with evening commuters heading south'}
  if(d===4&&m>=780&&m<1170&&!north&&x<45){x=45;why='jammed with Friday getaway traffic'}
  if(!wk&&m>=660&&m<1020&&x<12){x=12;why='busy with weekend traffic'}
  return {min:x,why,txt:x<=5?`WSDOT: I-5 ${north?'northbound':'southbound'} ${why}.`:`WSDOT: I-5 ${north?'northbound':'southbound'} ${why} through Tacoma and Federal Way, +${x} min`};
}
{const _to=travelOpts;travelOpts=function(dest){const o=_to(dest);try{
  const from=S.loc,A=seaHere(from),B=seaHere(dest);
  if(A===B||L[from].side!=='M'||!L[dest]||L[dest].side!=='M'||SEA_HOME_KEYS.includes(from)||SEA_HOME_KEYS.includes(dest))return o;
  const base=dist(from,dest),e=seaTraffic(B,S.t);
  for(const x of o){
    if(x.m==='car'&&!x.dis){x.min=base+e.min;x.l=`🚗 ${base}${e.min>5?'+'+e.min:''} min`;x.s=e.txt;x.traffic=e.min}
    else if(x.m==='ride'){const c=Math.round(25+base*1.1);x.min=base+e.min+8;x.cost=c;x.l=S.phone>0?`📱 Rideshare ${x.min}m · $${c}`:'📵 Rideshare (phone dead)';x.s=e.txt}
    else if(x.m==='walk'){x.dis=true;x.l='🚶 Too far to walk'}
    else if(x.m==='bus'){x.min=Math.round(base*1.5+25);x.cost=3;x.l=`🚌 Sound Transit express ${x.min}m · $3.00`;x.s='Express bus up I-5, then a short walk.'}}
}catch(e){console.error(e)}return o}}
