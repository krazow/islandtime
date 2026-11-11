// ---- 🎟️ going out in Steilacoom (uses defFun from 40-fun.js): two places to eat, three things to do ----
// Real places: Topside Bar & Grill, the Bair Restaurant (in the old Bair Drug & Hardware), Steilacoom Pub & Grill,
// the Steilacoom Historical Museum and Sunnyside Beach Park. Hours are rough; prices are 2026 dollars.
const _stSeason=()=>{const s=typeof seasonId==='function'?seasonId():'fall';return s==='spring'||s==='summer'};
defFun({id:'st_topside',town:'Steilacoom',kind:'restaurant',name:'Topside Bar & Grill',ic:'🍺',
  desc:'A pub up the hill with a deck over the Sound. Fish and chips, Brussels sprouts, craft beer. Brunch on weekends.',
  pos:[0.2,0.3],hours:d=>d===0?null:d>=3?[510,1260]:[660,1260],
  acts:[
    {l:'Dinner on the deck',s:'Fish and chips and a view of the water. You can see the island from here.',min:75,cost:34,stress:-8,sat:1,done:'Fish and chips on the deck, with the Sound going gold below you'},
    {l:'One beer at the bar',s:'A craft pour and a stool. Nobody asks you about ferries.',min:45,cost:9,stress:-6,done:'A slow beer, and for once the ferry schedule is somebody else’s problem'}]});
defFun({id:'st_bair',town:'Steilacoom',kind:'restaurant',name:'The Bair (old drugstore soda fountain)',ic:'🥞',
  desc:'Breakfast and lunch in an 1895 drugstore with a 1908 soda fountain. Biscuits and gravy, milkshakes, Green River sodas.',
  pos:[0.3,0.4],hours:d=>d>=3?[480,840]:null,
  acts:[
    {l:'Breakfast at the counter',s:'Biscuits and gravy, coffee, and a very old marble counter.',min:60,cost:19,stress:-7,sat:1,done:'Biscuits and gravy under a hundred-year-old ceiling'},
    {l:'Milkshake at the soda fountain',s:'Not a meal. Absolutely a morale boost.',min:30,cost:8,stress:-5,done:'A milkshake at the same fountain they have used since 1908'}]});
defFun({id:'st_pub',town:'Steilacoom',kind:'fun',name:'Steilacoom Pub & Grill',ic:'🎤',
  desc:'The town pub: pool, a stage, and a calendar of karaoke, open mic and poker. Cash helps, nerve helps more.',
  pos:[0.4,0.4],hours:d=>(d===4||d===5)?[660,1560]:[660,1440],
  acts:[
    {l:'Play pool',s:'Free tables most nights. The house cue has a bend.',min:60,cost:6,stress:-8,done:'A few games of pool against a retired Navy cook who will not lose'},
    {l:'Open mic or karaoke night',s:'Cheer, sing, or hide. All accepted.',min:120,cost:18,stress:-12,done:'You clap too loudly for a stranger’s Fleetwood Mac. It was worth it'}]});
defFun({id:'st_museum',town:'Steilacoom',kind:'fun',name:'Steilacoom Historical Museum',ic:'🏛️',
  desc:'Territorial history, a pioneer orchard and the 1857 Orr house. Open weekends, April to October. Donations welcome.',
  pos:[0.5,0.5],hours:d=>(d>=5&&_stSeason())?[780,1020]:null,
  acts:[
    {l:'Tour the museum',s:'Old photographs, an old ferry or two, and a docent who has opinions.',min:75,cost:5,stress:-8,done:'You learn Steilacoom was here long before the ferry timetable'},
    {l:'Wander the orchard and grounds',s:'Heritage apple trees. Quiet.',min:40,cost:0,stress:-5,done:'A slow lap of the old orchard'}]});
defFun({id:'st_beach',town:'Steilacoom',kind:'fun',name:'Sunnyside Beach Park',ic:'🏖️',
  desc:'Town beach park on the shore: playground, picnic tables, driftwood, and trains that go by now and then. Parking is paid.',
  pos:[0.9,0.5],hours:()=>[360,1260],
  acts:[
    {l:'Walk the beach',s:'Cold water, wide sky, no signal worth mentioning.',min:60,cost:0,stress:-10,done:'You walk the beach until the day gets smaller'},
    {l:'Picnic by the water',s:'Bring your own lunch. Pay for parking.',min:90,cost:5,stress:-12,health:1,done:'A picnic on a log, the Sound doing its thing'}]});
