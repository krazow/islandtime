// ---- 🎟️ going out in Lakewood: two restaurants + three places to unwind (helper: 40-fun.js) ----
// Real places, hours/prices checked late 2026 and rounded. Positions in miles from the Steilacoom ferry [0,0].
defFun({id:'lw_yis',town:'Lakewood',kind:'restaurant',name:'Yi’s Korean Beef Soup (Lakewood)',ic:'🍲',pos:[6.6,4.9],
  desc:'Ox-bone broth that has been simmering since before you woke up. A South Tacoma Way classic. Open daily.',
  hours:()=>[510,1260],
  acts:[
    {l:'Seolleongtang with rice and kimchi',s:'The milky beef-bone soup. Counts as dinner.',min:55,cost:18,stress:-6,sat:1,done:'You finish the whole bowl, add the rice, and then the kimchi juice. Dinner is handled'},
    {l:'Soup, seafood pancake and dumplings to share',s:'Counts as dinner, with leftovers in your head.',min:75,cost:36,stress:-9,sat:1,done:'Too much food, perfectly arranged. You waddle out warm and unbothered'}]});
defFun({id:'lw_hess',town:'Lakewood',kind:'restaurant',name:'Hess Bakery & Deli (Lakewood)',ic:'🥨',pos:[5.9,3.4],
  desc:'German bakery and deli with pretzels, house-baked bread and a shelf of imported mustard. Closes at 5, firmly. Tuesday–Saturday.',
  hours:d=>d>=1&&d<=4?[540,1020]:d===5?[540,960]:null,
  acts:[
    {l:'Deli sandwich on house bread, plus a pretzel',s:'Counts as a meal. The bread does the work.',min:35,cost:13,stress:-4,sat:1,done:'A sandwich on bread that has opinions, and a warm pretzel for the road. Lunch is handled'},
    {l:'Pretzel, coffee and a window seat',s:'Not a meal, but a decent pause.',min:30,cost:7,stress:-5,done:'You people-watch over a pretzel for half an hour. Nobody needs anything from you'}]});
defFun({id:'lw_playhouse',town:'Lakewood',kind:'fun',name:'Lakewood Playhouse',ic:'🎭',pos:[5.4,3.6],
  desc:'A small, long-running community stage. Real actors, folding-chair intimacy, no phones. Shows Friday–Sunday.',
  hours:d=>d===4||d===5?[1110,1380]:d===6?[780,1020]:null,
  acts:[
    {l:'See the show',s:'Adult ticket, about two and a half hours with intermission.',min:150,cost:35,stress:-12,done:'The lights go down, the island stops existing for a couple of hours. Worth every dollar'},
    {l:'See the show on a senior/student/military ticket',s:'The discount ticket, if you qualify.',min:150,cost:25,stress:-12,done:'Same show, cheaper seat. Standing ovation optional, tears free'}]});
defFun({id:'lw_lakewold',town:'Lakewood',kind:'fun',name:'Lakewold Gardens',ic:'🌷',pos:[6.4,5.4],
  desc:'Ten acres of European-style garden on Gravelly Lake. Quiet enough to hear a rhododendron think. Open fewer days in the cold months.',
  hours:d=>{const s=seasonId();return (s==='summer'||s==='spring')?(d>=2?[600,1020]:null):(d===4||d===5?[600,960]:null)},
  acts:[
    {l:'Stroll the gardens',s:'Adult admission.',min:90,cost:12,stress:-12,health:1,done:'You wander paths that someone has loved for decades. Your shoulders come down from around your ears'},
    {l:'A quick lap and a sit by the water',s:'Adult admission.',min:40,cost:12,stress:-7,done:'A short lap, a bench, and a view of the lake. Not nothing'}]});
defFun({id:'lw_fsp',town:'Lakewood',kind:'fun',name:'Fort Steilacoom Park',ic:'🌲',pos:[3.4,3.0],
  desc:'Hundreds of acres of prairie, woods and a lake, free and open dawn to dusk. Dogs have a whole section. Nobody asks you for anything.',
  hours:()=>{const s=seasonId();return s==='summer'?[330,1290]:s==='spring'?[390,1200]:s==='fall'?[420,1080]:[450,1000]},
  acts:[
    {l:'Walk the loop around Lake Waughop',s:'Free. About a mile.',min:40,cost:0,stress:-10,health:1,done:'A slow lap around the lake, ducks included. Free and annoyingly effective'},
    {l:'Wander the prairie trails',s:'Free. A long one.',min:100,cost:0,stress:-15,health:1,done:'Open sky, gravel underfoot and nobody to answer to. You come back lighter'},
    {l:'Sit on a bench and watch the dogs',s:'Free.',min:30,cost:0,stress:-6,done:'Twenty dogs, zero opinions about your life. Restorative'}]});
