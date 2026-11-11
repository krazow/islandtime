// ---- ✨ memorable moments: 20 small, kind events with a choice, spread over the ferry, home, the road, the lake and the mainland ----
// Weighted by season and time of day, with a throttle so they never flood: at most 1 a day, 3 a week (2 on a short visit), each event once a week.
// Each one is a few lines and a choice (a little time, a little money, or just a moment). Never costs reputation. Eight offer a photo (to the album in 62-collections.js).
// State: S.mom = {d:{chapter:dayKey -> n}, w:{chapter:weekNo -> n}}  (lazy; old saves load fine)
// API: MOMENTS (list of ids) · momCapOk() · momDef(spec)
const MOM_WEEK=3, MOM_SHORT=2;
function MOM(){if(!S.mom||typeof S.mom!=='object')S.mom={};if(!S.mom.d)S.mom.d={};if(!S.mom.w)S.mom.w={};return S.mom}
const momCh=()=>(S.story&&S.story.ch)|0;
const momDk=()=>momCh()+':'+dayKey(), momWk=()=>momCh()+':'+(S.weekNo||0);
function momCapOk(){const M=MOM(),short=typeof visitorOn==='function'&&visitorOn()&&!(typeof regOn==='function'&&regOn());
  if((M.d[momDk()]||0)>=1)return false;
  if(short)return Object.values(M.w).reduce((a,b)=>a+b,0)<MOM_SHORT;
  return (M.w[momWk()]||0)<MOM_WEEK}
const momCount=()=>{const M=MOM();M.d[momDk()]=(M.d[momDk()]||0)+1;M.w[momWk()]=(M.w[momWk()]||0)+1};
const momIsle=at=>!!(L[at]&&L[at].side==='I'), momMain=at=>!!(L[at]&&L[at].side==='M');
const momNpc=()=>{try{const n=npcPick({kind:'bg',notJailed:true});return n||null}catch(e){return null}};
function momPhoto(c,id){if(!c.photo)return;if(typeof colPhotoAdd==='function')colPhotoAdd({k:id,ic:c.photo[1],t:c.photo[0],n:c.photo[2]||'',src:'moment'})}
const MOMENTS=[];
// spec: {id,ic,t,hook,at(ctx)->bool,base,sea:{season:weight},hrs:[[from,to],…],cond(ctx),body(ctx),ch(ctx)->[choice]}
// choice: {l,s,min,money,st,ph(phone %),pantry,rep,why,photo:[title,icon,note],say,fn()}  tripMid moments pause the trip and resume it when you choose
function momDef(sp){MOMENTS.push(sp.id);Object.assign(TILE_META,{[sp.id]:[sp.ic,sp.t,'good']});
  const hrs=ctx=>!sp.hrs||sp.hrs.some(h=>tod()>=h[0]&&tod()<h[1]);
  defEvent({id:sp.id,hook:sp.hook,priority:0,max:1,cooldown:0,
    cond:ctx=>!!S&&!S.over&&momCapOk()&&(!sp.at||sp.at(ctx))&&hrs(ctx)&&(!sp.cond||sp.cond(ctx))&&((sp.sea||{})[seasonId()]??1)>0,
    chance:ctx=>sp.base*((sp.sea||{})[seasonId()]??1),
    run(ctx){momCount();const mid=ctx.hook==='tripMid';
      const btns=sp.ch(ctx).map(c=>({l:c.l,s:c.s,dis:!!c.dis||!!(c.money&&S.money<c.money)||!!(c.pantry>0&&S.pantry<c.pantry),fn:()=>{
        if(c.money)money(-c.money);if(c.pantry)S.pantry+=-c.pantry;if(!mid&&c.min){S.t+=c.min;phoneTick()}if(c.ph)phoneUse(c.ph);
        if(c.st)adj('stress',c.st);if(c.say)say(c.say);if(c.rep)fstRep(c.rep,c.why||'a kind moment');momPhoto(c,sp.id+'@'+S.t);if(c.fn)c.fn();
        if(mid)ctx.finish(c.min||0)}}));
      modal(`${sp.ic} ${sp.t}`,sp.body(ctx),btns);
      return mid?{block:true}:{stop:true}}});
}
const momFerry=ctx=>ctx.from==='ferry';
const sea4=(f,w,sp,su)=>({fall:f,winter:w,spring:sp,summer:su});
const DAWN=[[360,600]], DAY=[[540,1080]], EVE=[[960,1260]], ALLDAY=[[420,1230]];

// ---------- on the ferry ----------
momDef({id:'mo_orcas',ic:'🐋',t:'Orcas off the bow',hook:'arrive',at:momFerry,base:0.12,sea:sea4(1,0.5,1.3,1.6),hrs:[[480,1140]],
  body:()=>'<p>Halfway across, somebody on the car deck shouts, and a whole boatload of people runs to the rail. Three tall black fins slice the water off the port side, a calf tucked tight against its mother.</p>',
  ch:()=>[{l:'Hurry to the rail and take a photo: 5 min',s:'Stress −8. A photo for your album.',min:5,st:-8,photo:['Orcas off the ferry','🐋','Three fins and a calf, off the port side'],say:'🐋 You get three fins and a calf in the frame before they dive. A stranger beside you is crying a little. So, you notice, are you.'},
    {l:'Just watch',s:'Stress −10.',st:-10,say:'🐋 You put the phone away and just watch. The whole boat goes quiet for the length of one breath, one exhale of spray.'},
    {l:'Tell the people in the cars behind you',s:'Reputation +1.',st:-4,rep:1,why:'shared an orca sighting on the ferry',say:'🐋 You knock on windows down the line. A kid in a minivan presses her whole face against the glass. It is the best thing you will do all week.'}]});
momDef({id:'mo_fog_horn',ic:'🌫️',t:'The horn in the fog',hook:'arrive',at:momFerry,base:0.14,sea:sea4(1.3,1.3,0.7,0),hrs:[[300,660]],cond:()=>!!(S.week&&S.week.fog&&S.week.fog[day()])||seasonId()!=='summer'&&tod()<600,
  body:()=>'<p>The fog is so thick you can’t see the bow. Every two minutes the ferry’s horn bellows, long, low, and the answer comes back, faint, from Ketron Island.</p><p>The deckhand next to you doesn’t seem worried. He seems to be counting.</p>',
  ch:()=>[{l:'Count the horn blasts with the deckhand: 5 min',s:'Stress −4.',min:5,st:-4,say:'🌫️ “Two minutes, give or take. That’s the law, and it’s also just nice,” he says. You count nine blasts before the landing appears out of the gray like a stage set.'},
    {l:'Stand at the rail and listen',s:'Stress −6.',st:-6,say:'🌫️ You close your eyes. Horn, silence, water, horn. Somewhere out there a bell buoy answers. You decide you’d be a worse person without this.'},
    {l:'Text your boss you might run late',s:'Phone battery. Stress +1.',ph:2,st:1,say:'📱 “Fog on the Sound,” you text. The reply comes in two seconds: “Say no more. Be careful.”'}]});
momDef({id:'mo_rainbow',ic:'🌈',t:'A double rainbow over the Sound',hook:'arrive',at:ctx=>momFerry(ctx)||ctx.at==='aiDock'||ctx.at==='stDock'||ctx.at==='lake',base:0.1,sea:sea4(1.3,1.2,1.4,0.1),hrs:[[720,1110]],
  body:()=>'<p>The rain just quit, the sun’s low and orange, and there it is: a rainbow arched from Ketron to the Nisqually flats. And, faint above it, a second one.</p>',
  ch:()=>[{l:'Take a photo: 5 min',s:'Stress −6. A photo for your album.',min:5,st:-6,photo:['Double rainbow over the Sound','🌈','Both arcs, end to end'],say:'🌈 You hold the phone steady and capture both arcs. It doesn’t do it justice, which is the point.'},
    {l:'Point it out to the kid in the next car',s:'Reputation +1.',min:2,st:-4,rep:1,why:'shared a double rainbow',say:'🌈 “Look up,” you say to the kid. “TWO?!” he yells. His dad rolls down the window just to see.'},
    {l:'Keep your eyes on the road',s:'Safe. A little sad.',st:-2,say:'🌈 You catch it in the mirror and let it go. Rainbows are like that.'}]});
momDef({id:'mo_rainier',ic:'🏔️',t:'The mountain is out',hook:'arrive',at:ctx=>momFerry(ctx)||ctx.at==='aiDock'||ctx.at==='stDock',base:0.1,sea:sea4(0.8,0.7,1,1.3),hrs:[[360,720]],
  body:()=>'<p>The clouds peel back and Mount Rainier appears, enormous and pink with morning, floating above the water like it was painted on the sky. Even the regulars stop looking at their phones.</p>',
  ch:()=>[{l:'Take a photo: 5 min',s:'Stress −6. A photo for your album.',min:5,st:-6,photo:['The mountain is out','🏔️','Rainier over the Sound, pink in the morning light'],say:'🏔️ You take the picture everyone on the island has taken a hundred times. It’s still yours.'},
    {l:'Let someone who needs it have the rail',s:'Stress −4. Reputation +1.',st:-4,rep:1,why:'shared the view of Rainier',say:'🏔️ You step back. A woman in scrubs, coming off a night shift, takes your spot and says “thank you” like you gave her a sandwich.'},
    {l:'Just keep going',s:'On with the day.',st:-1,say:'🏔️ You glance at it, and it glances back. “Later,” you think.'}]});
momDef({id:'mo_ferry_dog',ic:'🐕',t:'A dog in the ferry line',hook:'arrive',at:ctx=>ctx.at==='stDock'||ctx.at==='aiDock',base:0.09,sea:sea4(1,1,1,1.2),hrs:ALLDAY,
  body:()=>'<p>A golden retriever in the car next to yours has its whole head out the window, ears flapping, deeply, intensely certain that every single person in the ferry line is its best friend.</p>',
  ch:()=>[{l:'Say hi to the dog: 5 min',s:'Stress −5.',min:5,st:-5,say:'🐕 You get one lick and a very serious look. The owner shrugs: “He does that to everybody. He’s never wrong.”'},
    {l:'Chat with the owner: 10 min',s:'Stress −3. Reputation +1.',min:10,st:-3,rep:1,why:'chatted in the ferry line',say:'🐕 The owner commutes from the island every day and tells you which deckhand always gives the dog a treat. You will now be that person for a while.'},
    {l:'Wave through the window',s:'Free.',st:-1,say:'🐕 You wave. The dog waves back with its whole body.'}]});
momDef({id:'mo_sea_lion',ic:'🦭',t:'A sea lion on the dock',hook:'arrive',at:ctx=>ctx.at==='stDock'||ctx.at==='aiDock',base:0.08,sea:sea4(1.2,1.5,1,0.6),hrs:[[420,1140]],
  body:()=>'<p>There’s a sea lion on the float beside the ferry landing, big as a sofa and just as relaxed. A small crowd gathers. Someone has put out an orange cone, as if that’s going to help.</p>',
  ch:()=>[{l:'Watch from a respectful distance: 5 min',s:'Stress −6. A photo for your album.',min:5,st:-6,photo:['The sea lion on the float','🦭','Big as a sofa, deeply unbothered'],say:'🦭 You get a photo with a zoom, from a safe distance. The sea lion opens one eye, decides you’re not interesting, and closes it again.'},
    {l:'Tell the dock attendant so nobody gets too close',s:'Reputation +1.',min:3,st:-3,rep:1,why:'helped keep a sea lion safe',say:'🦭 The attendant radios somebody from the marine mammal volunteers. “Good call. Folks always want to pet them.”'},
    {l:'Keep walking',s:'Free.',st:-1,say:'🦭 You give it a respectful nod as you pass. It does not return the nod.'}]});
momDef({id:'mo_sunset',ic:'🌇',t:'Sunset at the terminal',hook:'arrive',at:ctx=>ctx.at==='stDock'||ctx.at==='aiDock',base:0.08,sea:sea4(1,0.8,1.1,1.4),hrs:[[1020,1230]],
  body:()=>'<p>The sky over Ketron is doing the thing where it goes from orange to pink to a purple you couldn’t get with a paint set. The boat sits at the dock, glowing.</p>',
  ch:()=>[{l:'Take a photo: 5 min',s:'Stress −5. A photo for your album.',min:5,st:-5,photo:['Sunset at the ferry landing','🌇','Orange to pink to purple, with the boat glowing'],say:'🌇 You frame the boat against the sky. Two other people have the same shot and nobody minds.'},
    {l:'Sit on the bench and watch it all: 20 min',s:'Stress −9.',min:20,st:-9,say:'🌇 You sit till the last color goes out. Somebody’s fiddle is playing from a parked truck. You’ve forgotten what you were rushing for.'},
    {l:'Glance and go',s:'Free.',st:-1,say:'🌇 You glance at it twice and tell yourself you’ll look longer tomorrow.'}]});
// ---------- at the lake ----------
momDef({id:'mo_eagles',ic:'🦅',t:'Eagles fighting over a fish',hook:'arrive',at:ctx=>ctx.at==='lake'||ctx.at==='aiDock'||ctx.at==='marina',base:0.12,sea:sea4(1.2,1,0.9,1),hrs:[[480,1080]],
  body:()=>'<p>A bald eagle drops out of a snag with a fish in its talons. A second eagle hits it from the side. The fish falls, they dive after it, and the whole thing ends in a screaming tumble over the water, three feet from the dock.</p>',
  ch:()=>[{l:'Watch the whole thing: 10 min',s:'Stress −7.',min:10,st:-7,say:'🦅 A third eagle, much smaller, swoops in and takes the fish that nobody was holding. The two big ones sit there in the trees, looking furious and embarrassed.'},
    {l:'Take a photo: 10 min',s:'Stress −4. A photo for your album.',min:10,st:-4,photo:['Eagles fighting over a fish','🦅','Talons, wings and a very surprised fish'],say:'📸 Most of your shots are a blur of wing. One is perfect: two eagles, locked, a fish between them, eyes wild.'},
    {l:'Leave them to it',s:'Free.',st:-1,say:'🦅 You back away. It’s their lake. You’re just visiting.'}]});
momDef({id:'mo_swim',ic:'🏊',t:'A warm afternoon at Lake Josephine',hook:'arrive',at:ctx=>ctx.at==='lake',base:0.3,sea:sea4(0.15,0,0.2,2.5),hrs:[[660,1110]],
  body:()=>'<p>The lake is warm and flat and green. A couple of kids are doing cannonballs off the dock, and a very old dog is swimming in slow, deliberate circles, grinning.</p>',
  ch:()=>[{l:'Jump in: 45 min',s:'Stress −12.',min:45,st:-12,say:'🏊 The water closes over your head and, for a second, nothing exists. You surface laughing and a kid yells “Ten out of ten!”'},
    {l:'Dip your feet: 15 min',s:'Stress −5.',min:15,st:-5,say:'🏊 You sit on the end of the dock with your feet in the water until the old dog comes over and lays its chin on your knee.'},
    {l:'Maybe next time',s:'Free.',st:0,say:'🏊 You watch the cannonballs. Next time.'}]});
// ---------- at home ----------
momDef({id:'mo_chainsaw',ic:'🪚',t:'Chainsaw at 7 AM',hook:'wake',at:()=>S.loc==='home',base:0.12,sea:sea4(1.5,1.4,0.5,0.3),hrs:[[300,600]],
  body:()=>'<p>You wake to the unmistakable snarl of a chainsaw, somewhere on the other side of the trees. It’s 7:00. It goes on and on, then stops, then starts again, with a thud that shakes the cups on the shelf.</p><p>A tree must have come down in the night.</p>',
  ch:()=>[{l:'Walk over with coffee: 30 min',s:'Stress −3. Firewood for your woodpile. Reputation +1.',min:30,st:-3,rep:1,why:'helped a neighbor with a downed tree',say:'🪚 Your neighbor’s tree is across the driveway, and he’s sawing it up in a hurry. You stack rounds for half an hour, and he insists you take a pickup bed’s worth.',fn:()=>{try{const U=UP();U.wood=Math.min(14,(U.wood||0)+3)}catch(e){}}},
    {l:'Pull the pillow over your head',s:'Stress +2.',st:2,say:'🪚 You lie there, counting thuds. By 7:40 you’re staring at the ceiling and giving up.'},
    {l:'Text the neighbor: “everything OK?”',s:'Phone battery.',ph:2,st:-1,say:'📱 “Tree down! All good. Sorry about the noise!” followed by a thumbs-up and a photo of a very large stump.'}]});
momDef({id:'mo_potluck',ic:'🕯️',t:'Potluck by candlelight',hook:'arrive',at:ctx=>ctx.at==='home',base:0.5,sea:sea4(1.2,1.5,0.8,0.4),hrs:[[960,1260]],cond:()=>powerOut(),
  body:()=>'<p>The power’s out, the road’s dark, and a lantern is bobbing up the lane. It’s a neighbor with a pot of something hot. “We’re doing a potluck at the Okafors’. Whatever’s in your fridge is going to go off anyway.”</p>',
  ch:()=>[{l:'Bring a dish: 90 min',s:'Uses a day of food. Stress −10. Friends +1.',min:90,pantry:1,st:-10,say:'🕯️ Eleven neighbors, six kinds of soup and a game of cards by lantern. Somebody plays a ukulele. When the lights come back on at ten, nobody wants to go home.',fn:()=>{try{const ids=Object.keys(S.friends||{});if(ids.length)friendPts(ids[Math.floor(Math.random()*ids.length)],1);else newNeighbor('you went to the candlelit potluck')}catch(e){}}},
    {l:'Lend your extension cord and a gallon of gas: 20 min',s:'Needs the generator at home. Reputation +3.',min:20,dis:!(S.gen==='home'&&S.homeGas>=1),st:-4,rep:3,why:'lent a generator at a potluck',say:'🔌 You run a cord across the fence. Three crockpots and a string of Christmas lights hum to life, and everybody cheers like you just invented fire.',fn:()=>{S.homeGas=Math.round((S.homeGas-1)*10)/10}},
    {l:'Stay in with a candle',s:'Quiet.',st:-2,say:'🕯️ You read by candlelight. Through the trees you can hear a ukulele and laughter. You’re fine. You’re mostly fine.'}]});
momDef({id:'mo_lost_dog',ic:'🐶',t:'A neighbor’s lost dog',hook:['wake','arrive'],at:ctx=>ctx.hook==='wake'?S.loc==='home':momIsle(ctx.at),base:0.07,sea:sea4(1,1,1,1.1),hrs:[[480,1110]],
  body:()=>{const n=momNpc(),nm=n?npcName(n.id):'A neighbor';window.__momDog={nm,dog:pick(['Biscuit','Moose','Pickles','Juno','Waffles'])};return `<p>${nm} is walking down the road with a leash in one hand, calling for <b>${window.__momDog.dog}</b>. Brown dog, one floppy ear, answers to cheese. Gone since breakfast.</p>`},
  ch:()=>[{l:'Search the lake trail together: 1 hour',s:'Stress −2. Reputation +2.',min:60,st:-2,rep:2,why:'helped find a neighbor’s lost dog',say:'🐶 You find the dog in a thicket by the lake, filthy, delighted and unrepentant. The neighbor sits down on a log and cries with relief. They press a jar of blackberry jam into your hands.',fn:()=>{try{S.pantry+=1}catch(e){}}},
    {l:'Post in the Island Group: 5 min',s:'Phone battery. Reputation +1.',min:5,ph:3,st:-1,rep:1,why:'posted about a lost dog',say:'📱 Within the hour, someone replies “He’s asleep on my porch!” The whole island chimes in with hearts. It’s the most unified the group’s been since the ferry levy.'},
    {l:'Keep an eye out as you go',s:'Free.',st:0,say:'🐶 You promise to keep a lookout. Later you spot him in a ditch, wagging. You wave the owner over. The reunion is a mess of tails.'}]});
// ---------- on the road (the trip pauses while you decide) ----------
momDef({id:'mo_fawn',ic:'🦌',t:'A doe and a fawn on Eckenstam-Johnson Road',hook:'tripMid',at:ctx=>momIsle(ctx.from),base:0.14,sea:sea4(0.8,0.4,1.4,1.4),hrs:[[330,540],[1020,1230]],
  body:()=>'<p>A doe steps out onto Eckenstam-Johnson Road, and behind her, on wobbly legs and impossibly long ears, a fawn. It still has its spots. The doe looks right at you.</p>',
  ch:()=>[{l:'Stop and wait: 8 min',s:'Stress −5.',min:8,st:-5,say:'🦌 You wait. The fawn trips over its own hooves and a tiny sneeze comes from the ferns. The doe leads it into the brush. You can finally breathe.'},
    {l:'Take a photo: 6 min',s:'Stress −3. A photo for your album.',min:6,st:-3,photo:['A doe and her fawn','🦌','Eckenstam-Johnson Road, early light'],say:'🦌 You hold the phone steady. The doe flicks an ear. The fawn looks directly at you, and the shot is perfect.'},
    {l:'Creep past slowly',s:'2 min.',min:2,st:-1,say:'🦌 You inch past at a walking pace. In the mirror, the fawn bounces after its mother.'}]});
momDef({id:'mo_king_tide',ic:'🌊',t:'King tide over the road',hook:'tripMid',at:ctx=>momIsle(ctx.from),base:0.12,sea:sea4(1,1.6,0.2,0),hrs:[[360,600],[1020,1200]],
  body:()=>'<p>It’s the highest tide of the year, and the Sound has crept up over the low stretch of road by the water. A neighbor’s kayak is sitting in the middle of the lane, like it’s parked there.</p><p>The water’s shallow. Probably.</p>',
  ch:()=>[{l:'Wait for it to drop: 20 min',s:'Stress −3. A photo for your album.',min:20,st:-3,photo:['King tide over the road','🌊','The Sound laps over the pavement by the water'],say:'🌊 You park and watch the Sound lap at the pavement. A heron stalks across the road with dignity. When the water drops a hand’s breadth, you go.'},
    {l:'Take the long way around: 12 min',s:'Free.',min:12,st:0,say:'🌊 You take the back road past the Historical Society. It’s longer, dry, and pretty.'},
    {l:'Drive through, slowly: 3 min',s:'Stress +3.',min:3,st:3,say:'🌊 You inch through at a walking pace, a bow wave in front of you. The car smells like the sea for the rest of the day.'}]});
momDef({id:'mo_lemonade',ic:'🍋',t:'A kid selling lemonade',hook:'tripMid',at:ctx=>momIsle(ctx.from),base:0.18,sea:sea4(0.1,0,0.3,2.5),hrs:[[600,1110]],
  body:()=>'<p>At the end of a gravel driveway: a folding table, a hand-lettered sign that says LEMONADE 50¢ (or WHAT YOU WANT), and a seven-year-old with a pitcher and the focus of a CEO.</p>',
  ch:()=>[{l:'Buy a cup: $2',s:'Stress −3.',min:3,money:2,st:-3,say:'🍋 “It’s mostly sugar,” the kid admits. It is. It’s perfect. You drink it standing in the road.'},
    {l:'Buy two and tip: $6',s:'Stress −5. Reputation +1.',min:5,money:6,st:-5,rep:1,why:'bought out a lemonade stand',say:'🍋 The kid counts the money twice, then looks at you like you’re a bank. “I’m saving for a drone,” they say.'},
    {l:'Wave and keep going',s:'Free.',st:0,say:'🍋 You wave. The kid waves back, already looking at the next car.'}]});
momDef({id:'mo_goat',ic:'🐐',t:'A goat holds up traffic',hook:'tripMid',at:ctx=>momIsle(ctx.from),base:0.09,sea:sea4(1,0.8,1.2,1.2),hrs:ALLDAY,
  body:()=>'<p>A brown-and-white goat is standing in the middle of the road, chewing. It looks at you with those horizontal eyes. It has absolutely no plans to move.</p>',
  ch:()=>[{l:'Wait it out: 6 min',s:'Stress −2.',min:6,st:-2,say:'🐐 You wait. The goat finishes whatever it was chewing, gives you a long look, and strolls off like it just remembered an appointment.'},
    {l:'Walk it back to its yard: 15 min',s:'Stress −3. Reputation +1.',min:15,st:-3,rep:1,why:'returned a wandering goat',say:'🐐 It follows you like a very rude dog. The owner flaps out of the house in slippers: “BERNARD! That’s the third time this week!” Thank-yous all around.'},
    {l:'Text the owner: 3 min',s:'Phone battery.',min:3,ph:2,st:-1,say:'📱 “Bernard’s out again!” you text. A minute later the owner’s truck pulls up. “He has a thing for the road,” she says.'}]});
momDef({id:'mo_honor_box',ic:'🥚',t:'The honor box',hook:'tripMid',at:ctx=>momIsle(ctx.from),base:0.12,sea:sea4(1,0.2,0.6,1.6),hrs:[[540,1110]],
  body:()=>'<p>A card table at the end of a driveway: a dozen eggs, a flat of tomatoes, a jar of dahlias and a coffee can with a sign. HONOR BOX. NO ONE’S WATCHING. (WE ARE A LITTLE.)</p>',
  ch:()=>[{l:'Buy a dozen eggs: $5',s:'A day of food.',min:3,money:5,pantry:-1,st:-2,say:'🥚 You drop five dollars in the can. The eggs are still warm. It is the best deal on the island.'},
    {l:'Tomatoes and dahlias: $9',s:'A day of food, and flowers for the table.',min:4,money:9,pantry:-1,st:-3,say:'🍅 You buy tomatoes and a fistful of dahlias. For the rest of the week, your kitchen smells like August.',fn:()=>{try{homeAdj(1)}catch(e){}}},
    {l:'Drive on',s:'Free.',st:0,say:'🥚 You wave at the empty driveway. It feels weird, a little, to leave without paying.'}]});
// ---------- on the mainland ----------
momDef({id:'mo_busker',ic:'🎻',t:'A fiddler at the terminal',hook:'arrive',at:ctx=>ctx.at==='stDock',base:0.1,sea:sea4(0.8,0.4,1.1,1.5),hrs:[[600,1230]],
  body:()=>'<p>A woman is playing the fiddle on the bench outside the Steilacoom terminal, an open case at her feet. She’s very good. A couple is dancing, badly, in the parking lot, and not caring.</p>',
  ch:()=>[{l:'Listen to a song and tip $3: 10 min',s:'Stress −6.',min:10,money:3,st:-6,say:'🎻 She plays something you almost know. When it’s over she nods at you like a duchess. You catch yourself humming it all the way to the dock.'},
    {l:'Dance, badly: 10 min',s:'Stress −8.',min:10,st:-8,say:'🎻 You don’t dance. You dance. A toddler claps. Nobody remembers this tomorrow, and it’s wonderful.'},
    {l:'Keep walking',s:'Free.',st:0,say:'🎻 The music follows you for half a block.'}]});
momDef({id:'mo_tourists',ic:'🧳',t:'Lost visitors at the ferry',hook:'arrive',at:ctx=>momMain(ctx.at)&&(ctx.at==='stDock'||ctx.at==='gas'),base:0.1,sea:sea4(0.6,0.3,0.9,2),hrs:[[540,1110]],
  body:()=>'<p>A family with a loaded-down minivan and Ohio plates is circling the Steilacoom terminal. “Excuse me! Does the boat go to Anderson Island, and is that… a bridge?” “No,” you say, “it is not a bridge.”</p>',
  ch:()=>[{l:'Explain how the ferry works: 3 min',s:'Reputation +1.',min:3,st:-1,rep:1,why:'helped lost ferry visitors',say:'🧳 You tell them about the fares, the last boat, and why you should never, ever miss it. The dad writes “10:50” on his hand.'},
    {l:'Walk them to the ticket booth: 10 min',s:'Stress −3. Reputation +2.',min:10,st:-3,rep:2,why:'walked visitors to the ferry',say:'🧳 You walk them to the booth. “You’re going to love it,” you say, and you mean it. The kids ask if there are bears.'},
    {l:'Point and wave',s:'Free.',st:0,say:'🧳 You point at the sign. The dad salutes you. You’re not sure why.'}]});
// ---------- on the island, anywhere ----------
momDef({id:'mo_blackberries',ic:'🫐',t:'Blackberries along the road',hook:'arrive',at:ctx=>momIsle(ctx.at)&&ctx.from!=='ferry'&&ctx.at!=='home',base:0.12,sea:sea4(0.5,0,0.1,2),hrs:[[600,1110]],
  body:()=>'<p>The blackberry brambles are loaded, fat and warm and purple, spilling over the fence by the road. The air smells like jam. Somebody has left a sign: PICK, DON’T TRESPASS.</p>',
  ch:()=>[{l:'Pick for half an hour',s:'A day of food. Stress −4. Purple hands.',min:30,pantry:-1,st:-4,say:'🫐 You come out with a full bucket, a scratched forearm and a purple grin. Dinner is cobbler.'},
    {l:'Eat a handful: 5 min',s:'Stress −2.',min:5,st:-2,say:'🫐 You eat them straight off the vine. They’re the best thing you’ve had all week.'},
    {l:'Leave them for the birds',s:'Free.',st:0,say:'🫐 Somebody’s getting cobbler. It’s not you. It’s fine.'}]});
