"use strict";
// ---------------- data ----------------
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];
const DATES=['Nov 2','Nov 3','Nov 4','Nov 5','Nov 6','Nov 7','Nov 8'];
function dateTxt(d){try{const st=SEA().start; // season
  return new Date(st[0],st[1],st[2]+(S.weekNo||0)*7+d).toLocaleDateString('en-US',{month:'short',day:'numeric'})}catch(e){return DATES[d]}}
const AI_DEPS=[315,390,465,540,615,690,765,840,915,990,1065,1140,1215,1290];
const ST_DEPS=[350,425,500,575,650,725,800,875,950,1025,1100,1175,1250,1325];
const KETRON={I:[690,1215],M:[575,950,1175]};
const FUEL_CANCEL={I:[690],M:[575]}; // Monday fuel run
const FARE_CAR=26.5, FARE_WALK=6.25, FUEL_RATE=0.05, GAS_PRICE=4.59, DIESEL_PRICE=5.29, DALE_PRICE=12;
const GOODS={
  food:{n:'Food case',ic:'🥫',d:'Shelf-stable groceries, 3 days’ worth',base:{M:46,I:86},law:'ok'},
  med:{n:'Medical supplies',ic:'🩹',d:'First-aid kit, bandages, OTC cold & pain meds',base:{M:28,I:64},law:'ok'},
  gas:{n:'Gasoline, 5-gal can',ic:'🟥',d:'Legal to own. Banned on the ferry, full or empty',base:{M:30,I:68},law:'no-ferry'},
  diesel:{n:'Diesel, 5-gal DOT can',ic:'🟨',d:'Ferry allows 2 cans, in a vehicle only',base:{M:29,I:54},law:'lim'},
  drugs:{n:'Illicit drugs',ic:'📦',d:'A package. Illegal everywhere. Felony territory',base:{M:280,I:460},law:'illegal'},
};
const MARKETS={
  wholesale:{goods:['food','med'],hours:[420,1260],who:'Wholesale counter'},
  gas:{goods:['gas','diesel'],hours:[300,1380],who:'Gas station'},
  motel:{goods:['drugs'],hours:[1080,1440],who:'A guy in a parked sedan',sting:0.06},
  store:{goods:['food','med','diesel'],hours:[480,1200],who:'Island swap board (neighbors)'},
  dale:{goods:['gas','drugs'],hours:[420,1260],who:'Dale',sting:0.1},
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
  lakewood:{n:'Office job, Lakewood',loc:'work',start:540,end:1020,pay:170,days:[0,1,2,3,4],pitch:'9:00–5:00 weekdays. The 7:45 boat gets you there.'},
  riv:{n:'Line cook at the Riv',loc:'food',start:600,end:1080,pay:115,days:[1,2,3,4,5],pitch:'10:00–6:00, Tuesday–Saturday. On the island: no ferry, no gas money. Lower pay.'},
  tacoma:{n:'Records clerk, Tacoma hospital',loc:'office',start:510,end:990,pay:215,days:[0,1,2,3,4],pitch:'8:30–4:30 weekdays. Best pay, longest commute.'},
  dupont:{n:'Warehouse, DuPont (early shift)',loc:'whse',start:390,end:870,pay:185,days:[0,1,2,3,4],pitch:'6:30–2:30 weekdays. You need the 5:15 AM boat, but you’re home early.'},
};
const COOP_GOAL=2500;
const DIFFS={
  easy:{n:'Islander',ic:'🌲',money:1250,major:0.5,minor:0.06,fog:0.3,storm:0.4,full:0.6,score:0.8,d:'More money, fewer breakdowns and storms, emptier boats. For learning the island.'},
  normal:{n:'Normal',ic:'⛴️',money:850,major:0.9,minor:0.13,fog:0.45,storm:0.65,full:1,score:1,d:'The game as designed: November on Anderson Island.'},
  hard:{n:'Ferry Hell',ic:'🔥',money:650,major:1,major2:0.5,minor:0.2,fog:0.6,storm:0.85,full:1.6,score:1.25,d:'Summer tourists pack every boat, the boat breaks down constantly, and money is tight. Score ×1.25.'},
};
const DF=()=>DIFFS[(typeof S!=='undefined'&&S&&S.diff)||'normal']||DIFFS.normal;
const CAUSES=['generator failure','propulsion control fault','steering hydraulic leak','no relief captain available (crew shortage)','transfer span stuck at the Steilacoom landing'];

const L={
  home:{name:'Home',side:'I',ic:'🏡',desc:'Your cedar cabin in the woods'},
  aiDock:{name:'Anderson Island Ferry Landing',side:'I',ic:'⛴️',desc:'Ferry landing, Anderson Island'},
  store:{name:'General Store (closed)',side:'I',ic:'🏚️',desc:'Closed since Feb 2026. The swap board out front is the island market'},
  dale:{name:'Dale’s Place',side:'I',ic:'🛢️',desc:'End of a gravel road. Has gas. Don’t ask.',hours:()=>[420,1260]},
  food:{name:'The Riv',side:'I',ic:'🍔',desc:'Riviera restaurant. Takeout, and Bingo on Wednesday nights',hours:()=>[660,1260]},
  lake:{name:'Lake Josephine',side:'I',ic:'🦅',desc:'Quiet water, tall firs, eagles'},
  stDock:{name:'Steilacoom Ferry Terminal',side:'M',ic:'⛴️',desc:'Mainland terminal, Steilacoom'},
  gas:{name:'Gas Station (Steilacoom)',side:'M',ic:'⛽',desc:'Fill up, or buy fuel by the can',hours:()=>[300,1380]},
  depot:{name:'Home Depot (Lakewood)',side:'M',ic:'🧰',desc:'Generators, gas cans, everything for island life',hours:()=>[360,1320]},
  office:{name:'Hospital Records Office (Tacoma)',side:'M',ic:'🏥',desc:'Records clerk job, starts 8:30',hours:d=>d<5?[420,1080]:null},
  whse:{name:'Warehouse (DuPont)',side:'M',ic:'🏗️',desc:'Early-shift warehouse job, starts 6:30',hours:d=>d<5?[330,1020]:null},
  wholesale:{name:'Wholesale & Supply (Lakewood)',side:'M',ic:'🏭',desc:'Buy and sell food and medical supplies in bulk',hours:()=>[420,1260]},
  motel:{name:'Motel Parking Lot (Lakewood)',side:'M',ic:'🅿️',desc:'After dark only. Deals that shouldn’t happen',hours:()=>[1080,1440]},
  work:{name:'Work (Lakewood)',side:'M',ic:'💼',desc:'Your 9-to-5. Clock in by 9:00',hours:d=>d<5?[420,1140]:null},
  market:{name:'Supermarket (Lakewood)',side:'M',ic:'🛒',desc:'Normal prices. Imagine that.',hours:()=>[360,1380]},
  pharmacy:{name:'Pharmacy (Lakewood)',side:'M',ic:'💊',desc:'Your refill is here',hours:d=>d===6?[600,1080]:[540,1260]},
  warehouse:{name:'Warehouse Club (Tacoma)',side:'M',ic:'📦',desc:'Bulk food. Needs a car.',hours:d=>d>=5?[570,1080]:[600,1230]},
  clinic:{name:'Medical Clinic (Tacoma)',side:'M',ic:'🩺',desc:'Your doctor. Weekdays only',hours:d=>d<5?[480,1020]:null},
  urgent:{name:'Urgent Care (DuPont)',side:'M',ic:'🚑',desc:'Walk-in care, 8 AM–8 PM',hours:()=>[480,1200]},
};
const DI={home:{aiDock:12,store:7,lake:6},aiDock:{store:6,lake:11},store:{lake:5},dale:{home:9,aiDock:14,store:8,lake:10,food:8},food:{home:7,aiDock:11,store:6,lake:2}};
const MP={office:[13,7.5],whse:[-3.5,-5],depot:[6.5,2],wholesale:[7.5,3.5],motel:[4,2.5],gas:[1.5,1.5],stDock:[0,0],work:[6,3],market:[5,4],pharmacy:[6,5.5],warehouse:[12,6],clinic:[14,8],urgent:[-4,-6]};
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

