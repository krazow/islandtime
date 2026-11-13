// ---- 🎟️ going out in Seattle: two restaurants (waterfront seafood, a late-night burger stand) + Pike Place Market, the Space Needle and MOPOP ----
// Uses defFun() from 40-fun.js. Seattle is a long drive from the Steilacoom ferry (about 35 miles), so for an islander it's a day out;
// for a visitor who lives in Seattle it's close to home. Hours are rough 2026 hours (d: 0 Mon … 6 Sun); prices are 2026 dollars.
// On the map these sit on the Seattle tab (50-map.js). pos is in drive-time miles (dist() in 00-data.js), so it's squeezed to
// give about 70 minutes from the Steilacoom ferry, roughly I-5 without a jam.
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
