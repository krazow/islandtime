"use strict";
// ---------------- data ----------------
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
const DATES=['Nov 2','Nov 3','Nov 4','Nov 5','Nov 6','Nov 7','Nov 8'];
function dateTxt(d){try{const st=SEA().start; // season
  return new Date(st[0],st[1],st[2]+(S.weekNo||0)*7+d).toLocaleDateString('en-US',{month:'short',day:'numeric'})}catch(e){return DATES[d]}}
// 2026 Pierce County ferry, non-peak (one boat). piercecountywa.gov/8922/2026-Ferry-Schedule
const AI_DEPS=[315,380,455,535,605,670,765,915,995,1070,1140,1210,1310,1370];  // 5:15 6:20 7:35 8:55 10:05 11:10 12:45 3:15 4:35 5:50 7:00 8:10 9:50 10:50
const ST_DEPS=[285,345,425,500,570,635,730,885,955,1035,1105,1175,1275,1340];  // 4:45 5:45 7:05 8:20 9:30 10:35 12:10 2:45 3:55 5:15 6:25 7:35 9:15 10:20
const KETRON={I:[380,670,1210],M:[345,635,1175]};
// Two-boat days add the peak-season extra runs (in the game's summer: July 2–5)
const EXTRA_DEPS={I:[800,885,960,1040],M:[765,845,920,995]};
// Observed holidays (no Monday fuel run): from the 2026 schedule's holiday list
const FERRY_HOLIDAYS=['2026-01-19','2026-02-16','2026-05-25','2026-06-19','2026-07-03','2026-09-07','2026-11-11','2026-11-26','2026-11-27','2026-12-24','2026-12-25','2026-12-31','2027-01-01','2027-01-18'];
function gameDate(d){try{const st=SEA().start;return new Date(st[0],st[1],st[2]+(S.weekNo||0)*7+d)}catch(e){return new Date(2026,10,2+d)}}
function isoDate(dt){return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`}
function ferryHoliday(d){return FERRY_HOLIDAYS.includes(isoDate(gameDate(d)))}
function twoBoatDay(d){const t=isoDate(gameDate(d));return t>='2026-07-02'&&t<='2026-07-05'}
function deps(side,d){const b=side==='I'?AI_DEPS:ST_DEPS;return twoBoatDay(d)?[...b,...EXTRA_DEPS[side]].sort((x,y)=>x-y):b}
const FUEL_CANCEL={I:[670],M:[570]}; // Monday fuel run: the 11:10 from the island, the 9:30 from Steilacoom
// Fuel: real miles ÷ real mpg. Average speed by side (island back roads ~25 mph, mainland with I-5 ~32 mph);
// mpg by car (EPA: model-year 2022 light trucks averaged 23.4 mpg; an old Subaru and a tired beater do a bit worse/better).
const FUEL_MPH={I:25,M:32}, FUEL_MPG={isl:24,beat:22,diesel:18};
function fuelFor(car,min,side){side=side||((typeof L!=='undefined'&&L[S.loc])?L[S.loc].side:'I');const mpg=car&&car.diesel?FUEL_MPG.diesel:(car&&FUEL_MPG[car.id])||24;
  return min*FUEL_MPH[side]/60/mpg}
const FARE_CAR_NONPEAK=24.94, FARE_CAR_PEAK=33.86, FARE_WALK=8.14, FUEL_RATE=0.05, GAS_PRICE=4.59, DIESEL_PRICE=5.29, DALE_PRICE=12;
const GOODS={
  food:{n:'Food case',ic:'🥫',d:'Shelf-stable groceries, 3 days’ worth',base:{M:46,I:86},law:'ok'},
  med:{n:'Medical supplies',ic:'🩹',d:'First-aid kit, bandages, OTC cold & pain meds',base:{M:28,I:64},law:'ok'},
  gas:{n:'Gasoline, 5-gal can',ic:'🟥',d:'Legal to own. Banned on the ferry, full or empty',base:{M:30,I:68},law:'no-ferry'},
  diesel:{n:'Diesel, 5-gal DOT can',ic:'🟨',d:'Ferry allows 2 cans, in a vehicle only',base:{M:29,I:54},law:'lim'},
  drugs:{n:'Illicit drugs',ic:'📦',d:'A package. Illegal everywhere. Felony territory',base:{M:280,I:460},law:'illegal',vol:0.15,w:1,pen:{bail:750,hrs:5,days:2}},
  party:{n:'Party drugs',ic:'🎉',d:'Small bags. Cheap, and cheap is why people get careless',base:{M:60,I:110},law:'illegal',vol:0.25,w:0.7,pen:{bail:500,hrs:5,days:1}},
  pills:{n:'Pills',ic:'💊',d:'Prescription-type pills with no prescription behind them',base:{M:90,I:160},law:'illegal',vol:0.2,w:0.85,pen:{bail:600,hrs:5,days:1}},
  hard:{n:'Hard drugs',ic:'☠️',d:'The kind that fills the sheriff’s overdose reports. Heaviest charges',base:{M:400,I:700},law:'illegal',vol:0.3,w:1.4,pen:{bail:1000,hrs:9,days:3}},
  weed:{n:'Cannabis, 1 oz',ic:'🌿',d:'Legal for adults to buy at a licensed shop, up to one ounce. Reselling it unlicensed is the crime',base:{M:48,I:85},law:'weed',vol:0.2,w:0.6,pen:{bail:400,hrs:5,days:1}},
};
const DRUG_G=['drugs','party','pills','hard','weed'], WEED_LIMIT=1, WEED_RETAIL=62;
const MARKETS={
  wholesale:{goods:['food','med'],hours:[420,1260],who:'Wholesale counter'},
  gas:{goods:['gas','diesel'],hours:[300,1380],who:'Gas station'},
  motel:{goods:['drugs'],hours:[1080,1440],who:'A guy in a parked sedan',cop:0.5,res:0.03,crowd:0.6,spot:'a motel parking lot in Lakewood'},
  marina:{goods:['party','pills','weed'],hours:[660,1260],who:'Someone who keeps their hood up',cop:0.25,res:0.65,spot:'the Riv marina'},
  school:{goods:['drugs','pills','hard'],hours:[1080,1380],who:'A figure by a pickup, back lot',cop:0.35,res:0.6,spot:'the old schoolhouse back lot'},
  ponders:{goods:['drugs','party','pills','weed'],hours:[1080,1440],who:'A guy leaning on a car',cop:0.55,res:0.03,spot:'the lot behind a closed tire shop off Pacific Highway'},
  hilltop:{goods:['drugs','party','hard'],hours:[1080,1440],who:'Two people by a van',cop:0.5,res:0.02,spot:'an alley behind a shuttered storefront'},
  dispensary:{goods:['weed'],hours:[480,1320],who:'Licensed shop counter',legal:true},
  store:{goods:['food','med','diesel'],hours:[480,1200],who:'Island swap board (neighbors)'},
  dale:{goods:['gas','drugs'],hours:[420,1260],who:'Dale',cop:0.45,res:0.5,spot:'Dale’s place'},
};
const NEWS=[
  {t:'Island: the co-op potluck left everyone’s freezers full. Food is cheap on the swap board.',side:'I',g:'food',m:0.6},
  {t:'Mainland: the wholesale counter is running a bulk-food sale.',side:'M',g:'food',m:0.7},
  {t:'Island: a cold is going around and nobody has medicine left.',side:'I',g:'med',m:1.7},
  {t:'Mainland: diesel shortage at Lakewood stations.',side:'M',g:'diesel',m:1.6},
  {t:'Island: a contractor redoing a boat ramp is paying top dollar for diesel.',side:'I',g:'diesel',m:1.6},
  {t:'Island: gas is so scarce people are siphoning lawnmowers.',side:'I',g:'gas',m:1.4},
  {t:'Mainland: a dry spell on the street. Prices are up.',side:'M',g:'drugs',m:1.35},
  {t:'Island: a sheriff’s bust last week scared off the competition.',side:'I',g:'drugs',m:1.3},
  {t:'⚠️ Sheriff’s drug task force is riding the ferry today, with a K-9 unit. Inspections way up.',task:true},
];
const CAP_CAR=20, CAP_FOOT=6, APPT_DAY=3; // doctor's appointment is Thursday (bingo is Wednesday)
const JOBS={
  lakewood:{n:'Office job, Lakewood',loc:'work',start:540,end:1020,pay:170,days:[0,1,2,3,4],pitch:'9:00–5:00 weekdays. The 7:35 boat gets you there.'},
  riv:{n:'Line cook at the Riv',loc:'food',local:true,start:600,end:1080,pay:115,days:[1,2,3,4,5],pitch:'10:00–6:00, Tuesday–Saturday. On the island: no ferry, no gas money. Lower pay.'},
  tacoma:{n:'Records clerk, Tacoma hospital',loc:'office',start:510,end:990,pay:215,days:[0,1,2,3,4],pitch:'8:30–4:30 weekdays. Best pay, longest commute.'},
  dupont:{n:'Warehouse, DuPont (early shift)',loc:'whse',start:390,end:870,pay:185,days:[0,1,2,3,4],pitch:'6:30–2:30 weekdays. You need the 5:15 AM boat, but you’re home early.'},
  // listings change weekly (26-listings.js). season: only listed in those seasons; temp: laid off when the season ends;
  // coop: only once the co-op store is open; local: an island employer, so your island reputation matters; boat: you work on the ferry
  stocker:{n:'Holiday stocker, Lakewood supermarket',loc:'market',start:600,end:1080,pay:140,days:[2,3,4,5,6],season:['fall'],temp:true,pitch:'10:00–6:00, Wednesday–Sunday, through the holidays. Pallets, price guns and a lot of canned pumpkin. Temporary.'},
  deckhand:{n:'Ferry deckhand (summer)',loc:'aiDock',start:330,end:870,pay:195,days:[3,4,5,6,0],season:['summer'],temp:true,boat:true,pitch:'5:30 AM–2:30 PM, Thursday–Monday. You start at the island landing and work on the boat: no commute, no fares. Summer only.'},
  clerk:{n:'Clerk at the co-op store',loc:'store',start:540,end:960,pay:125,days:[0,1,3,4,5],coop:true,local:true,pitch:'9:00–4:00, Mon, Tue and Thu–Sat. On the island, at the store everyone chipped in to reopen. Lower pay, no ferry.'},
};
const COOP_GOAL=2500;
const DIFFS={
  easy:{n:'Islander',ic:'🌲',money:1250,major:0.5,minor:0.06,fog:0.3,storm:0.4,full:0.6,score:0.8,lv:{shelter:1,ferryWarn:60,jobGrace:2,firedGraceDays:7,wear:0.7,recover:1.3,deliverWrong:0.10,raccoon:1,rent:0,carTrouble:0,pantry:0,repLoss:0.5,fineMul:0.5},d:'More money, fewer breakdowns and storms, emptier boats. A warming shelter at the Legion in storms, ferry warnings an hour ahead, a forgiving boss, a house that wears slower, half the fines and reputation hits.'},
  normal:{n:'Normal',ic:'⛴️',money:850,major:0.9,minor:0.13,fog:0.45,storm:0.65,full:1,score:1,lv:{shelter:0,ferryWarn:0,jobGrace:0,firedGraceDays:0,wear:1,recover:1,deliverWrong:0.10,raccoon:1,rent:0,carTrouble:0,pantry:0,repLoss:1,fineMul:1},d:'The game as designed: November on Anderson Island. No extras either way.'},
  hard:{n:'Ferry Hell',ic:'🔥',money:650,major:1,major2:0.5,minor:0.2,fog:0.6,storm:0.85,full:1.6,score:1.25,lv:{shelter:0,ferryWarn:0,jobGrace:0,firedGraceDays:0,wear:1,recover:1,deliverWrong:0.20,raccoon:1.6,rent:1,carTrouble:1,pantry:1,repLoss:1.5,fineMul:1.5},d:'Summer crowds, constant breakdowns, tight money, weekly rent, car trouble, more lost packages and raccoons, no warming shelter. Fines and reputation hits are 50% steeper. If you go broke, the Legion hands out food. Score ×1.25.'},
};
// lv: what each level turns on. Read it with LV('key'): it falls back to Normal for anything missing.
const DF=()=>DIFFS[(typeof S!=='undefined'&&S&&S.diff)||'normal']||DIFFS.normal;
// fines and bail by level (Islander half, Ferry Hell half again): fineAmt(150) on Normal is $150
// places with nothing to do in this mode stay out of the travel list and the map: a visitor has no job, house projects or
// prescriptions; a Weekend regular works in their own city, not at the islander's jobs
const DEST_VISIT_HIDE=['work','office','whse','depot','wholesale','warehouse','pharmacy'], DEST_REG_HIDE=['work','office','whse'];
function destHidden(k){if(typeof visitorOn!=='function'||!visitorOn()||k===S.loc)return false;return (S.visitor.len==='regular'?DEST_REG_HIDE:DEST_VISIT_HIDE).includes(k)}
const fineAmt=x=>Math.round(x*(LV('fineMul')||1));
const LV=k=>{const v=(DF().lv||{})[k];return v===undefined?DIFFS.normal.lv[k]:v};
const CAUSES=['generator failure','propulsion control fault','steering hydraulic leak','no relief captain available (crew shortage)','transfer span stuck at the Steilacoom landing'];

const L={
  home:{name:'Home',side:'I',ic:'🏡',desc:'Your cedar cabin in the woods'},
  aiDock:{name:'Anderson Island Ferry Landing',side:'I',ic:'⛴️',desc:'Ferry landing, Anderson Island'},
  store:{name:'General Store (closed)',side:'I',ic:'🏚️',desc:'Closed since Feb 2026. The swap board out front is the island market'},
  dale:{name:'Dale’s Place',side:'I',ic:'🛢️',desc:'End of a gravel road. Has gas. Don’t ask.',hours:()=>[420,1260]},
  food:{name:'The Riv',side:'I',ic:'🍔',desc:'Riviera restaurant. Takeout, and Bingo on Wednesday nights',hours:()=>[660,1260]},
  legion:{name:'American Legion Hall',side:'I',ic:'🇺🇸',desc:'The Legion post. Veterans, coffee, and the holiday bazaar'},
  marina:{name:'The Riv marina',side:'I',ic:'⚓',desc:'Boats on the water, the Riv’s lot up the slope. Busy in summer, quiet otherwise',hours:()=>[660,1260]},
  school:{name:'Old Schoolhouse',side:'I',ic:'🏫',desc:'Eckenstam-Johnson Road. The island’s fitness center by day. The back lot is dark at night',hours:()=>[1080,1380]},
  lake:{name:'Lake Josephine',side:'I',ic:'🦅',desc:'Quiet water, tall firs, eagles'},
  stDock:{name:'Steilacoom Ferry Terminal',side:'M',ic:'⛴️',desc:'Mainland terminal, Steilacoom'},
  gas:{name:'Gas Station (Steilacoom)',side:'M',ic:'⛽',desc:'Fill up, or buy fuel by the can',hours:()=>[300,1380]},
  depot:{name:'Home Depot (Lakewood)',side:'M',ic:'🧰',desc:'Generators, gas cans, everything for island life',hours:()=>[360,1320]},
  office:{name:'Hospital Records Office (Tacoma)',side:'M',ic:'🏥',desc:'Records clerk job, starts 8:30',hours:d=>d<5?[420,1080]:null},
  whse:{name:'Warehouse (DuPont)',side:'M',ic:'🏗️',desc:'Early-shift warehouse job, starts 6:30',hours:d=>d<5?[330,1020]:null},
  wholesale:{name:'Wholesale & Supply (Lakewood)',side:'M',ic:'🏭',desc:'Buy and sell food and medical supplies in bulk',hours:()=>[420,1260]},
  ponders:{name:'Ponders Corner (Lakewood)',side:'M',ic:'🌃',desc:'A lot behind a closed tire shop off Pacific Highway. After dark',hours:()=>[1080,1440]},
  hilltop:{name:'Hilltop (Tacoma)',side:'M',ic:'🌆',desc:'An alley behind a shuttered storefront. After dark',hours:()=>[1080,1440]},
  dispensary:{name:'Licensed Cannabis Shop (Lakewood)',side:'M',ic:'🌿',desc:'Legal for adults: one ounce per sale',hours:()=>[480,1320]},
  motel:{name:'Motel Parking Lot (Lakewood)',side:'M',ic:'🅿️',desc:'After dark only. Deals that shouldn’t happen',hours:()=>[1080,1440]},
  work:{name:'Work (Lakewood)',side:'M',ic:'💼',desc:'Your 9-to-5. Clock in by 9:00',hours:d=>d<5?[420,1140]:null},
  market:{name:'Supermarket (Lakewood)',side:'M',ic:'🛒',desc:'Normal prices. Imagine that.',hours:()=>[360,1380]},
  pharmacy:{name:'Pharmacy (Lakewood)',side:'M',ic:'💊',desc:'Your refill is here',hours:d=>d===6?[600,1080]:[540,1260]},
  warehouse:{name:'Warehouse Club (Tacoma)',side:'M',ic:'📦',desc:'Bulk food. Needs a car.',hours:d=>d>=5?[570,1080]:[600,1230]},
  clinic:{name:'Medical Clinic (Tacoma)',side:'M',ic:'🩺',desc:'Your doctor. Weekdays only',hours:d=>d<5?[480,1020]:null},
  urgent:{name:'Urgent Care (DuPont)',side:'M',ic:'🚑',desc:'Walk-in care, 8 AM–8 PM',hours:()=>[480,1200]},
};
const DI={home:{aiDock:12,store:7,lake:6},aiDock:{store:6,lake:11},store:{lake:5},dale:{home:9,aiDock:14,store:8,lake:10,food:8},food:{home:7,aiDock:11,store:6,lake:2,marina:2},legion:{home:8,aiDock:9,store:4,lake:6,food:6,dale:9,marina:7,school:5},
  marina:{home:8,aiDock:10,store:7,lake:3,dale:9,school:7},school:{home:5,aiDock:9,store:4,lake:7,food:8,dale:8}};
const MP={office:[13,7.5],whse:[-3.5,-5],depot:[6.5,2],wholesale:[7.5,3.5],motel:[4,2.5],ponders:[7,0.5],hilltop:[10.5,4.5],dispensary:[5.5,3.2],gas:[1.5,1.5],stDock:[0,0],work:[6,3],market:[5,4],pharmacy:[6,5.5],warehouse:[12,6],clinic:[14,8],urgent:[-4,-6]};
// 2026 fares, round trip, collected at Steilacoom; vehicle fares are higher in peak season (the game's summer)
function fareCar(){return (typeof seasonId==='function'&&seasonId()==='summer')?FARE_CAR_PEAK:FARE_CAR_NONPEAK}
function dist(a,b){
  if(a===b) return 0;
  if(L[a].side==='I'){return (DI[a]&&DI[a][b])||(DI[b]&&DI[b][a])}
  const p=MP[a],q=MP[b];return Math.round(Math.hypot(p[0]-q[0],p[1]-q[1])*2.6+4);
}
const FLAVOR_MORNING=[
  'A heron stands motionless on the beach below the bluff.',
  'Rain ticks on the skylight. Classic November.',
  'Two deer are eating your neighbor’s roses again.',
  'The island is very quiet. You can hear the boat horn from across the water.',
  'Mt. Rainier is out this morning, pink with sunrise.',
  'Your phone shows one bar. It is always one bar.',
];
const GOSSIP=[
  'Bulletin board: “AI FOOD CO-OP — member meeting Thursday. Help us reopen the store & the pumps in 2027!”',
  'Bulletin board: “REMINDER: gas cans, FULL OR EMPTY, are not allowed on the ferry. Don’t make the deckhands confiscate yours.”',
  'Someone’s note: “Going to the mainland Tues — can pick up groceries for 2 households. Call me.”',
  'A flyer for an island grocery delivery service. Hand-drawn ferry logo.',
  'Bulletin board: “Lost: red gas can. No questions asked.” Ha. Sure.',
  'Marge says the Friday afternoon line was backed up past the store last week.',
  'Someone’s selling firewood at the end of their driveway again. Honor box.',
  'The guy from the Riviera swears he saw an orca off Oro Bay.',
  'Rumor is the county wants to raise fares again. Groans all around.',
  'Everyone agrees: if you need a doctor, plan it like a moon landing.',
];

