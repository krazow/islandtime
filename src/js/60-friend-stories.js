// ---- 📖 stories for your friends: a short storyline for five named islanders ----
// Walt (the Legion roof), Sam (chickens and a fox), Bev (hats for the ferry crew), Rusty (selling the Riv), the Hendersons (museum photos, reunion).
// Each story is 4 beats. A beat arrives as a text from the friend and as an event (a window with a choice that costs time, money or effort).
// Pacing: one story beat a day, at least 2 days apart per story (a day in Weekend regular), and gated by how well you know them:
//   beat 1 the day after you meet · beat 2 good friend or week 2 · beat 3 good friend + week 2, or close friend · beat 4 close friend or week 3 (and good friend).
// Every choice moves the story on (declining is fine and never costs reputation); the more you pitch in, the better the ending.
// A story you pitched in on twice or more ends with a lasting perk: Rusty’s free coffee, Sam’s eggs, Bev’s crew wave, Walt’s shingle, the Henderson photo wall.
// State: S.fst = {day, perks:{id:true}, used:{key:dayKey}, id:{b:beats done, k:dayKey of the last beat, h:times you pitched in, sent:beat texted, done}}  (lazy; old saves load fine)
// API: FST() · fstStory(id) · fstReady(id,hook) · fstRun(id) · FSTORIES
const FST_IDS=['walt','sam','bev','rusty','hendersons'];
function FST(){if(!S.fst||typeof S.fst!=='object')S.fst={};const F=S.fst;if(F.day==null)F.day=-9;if(!F.perks)F.perks={};if(!F.used)F.used={};
  for(const id of FST_IDS)if(!F[id]||typeof F[id]!=='object')F[id]={b:0,k:-9,h:0,sent:-1,done:false};return F}
const fstGap=(a,dk)=>a>dk?99:dk-a;      // a day stamp from a past chapter (story mode starts the clock over) counts as long ago
function fstRep(n,why){if(!n)return 0;try{return visitorOn()?(typeof vrepAdd==='function'?vrepAdd(n,why):0):repAdd(n,why)}catch(e){return 0}}
function fstText(id,x,unread){if(!S.friends[id]||typeof msgPush!=='function')return;try{const T=msgPush(id,0,x);if(unread){T.u++;phoneNotify('💬',msgFirst(id),x.length>70?x.slice(0,68)+'…':x)}}catch(e){console.error(e)}}
function fstPerk(id,ic,title,sub){FST().perks[id]=true;showTile(ic,title,sub,'good');say(`${ic} <b>${title}</b> ${sub}`)}

// a choice spec: {l,s,min,money,pantry,phone,st,hp,pts,rep,no(decline),say,txt(their reply),fn(A)}; h counts as pitching in unless no:true
const FSTORIES={
  walt:{ic:'🇺🇸',t:'The Legion roof',beats:[
    {at:'legion',txt:'Roof over the bingo hall is leaking into the buckets again. The committee is calling it “the Bucket Situation.” Could use a hand Saturday. – Walt',
     title:'The Bucket Situation',body:'<p>Walt meets you at the Legion door with a ladder under one arm. Inside, nine buckets are catching a drip that plays, roughly, “Anchors Aweigh.”</p><p>“Roof’s older than I am,” he says. “And I’m older than I am.”</p>',ch:[
      {l:'Hold the ladder: 90 min',s:'Stress −2. Walt +1.',min:90,st:-2,pts:1,say:'🇺🇸 You hold a ladder for an hour and a half while Walt shouts “Little left! Your OTHER left!” from the eaves. The tarp goes on. Mostly.',txt:'Tarp is holding. You’re a good ladder. – Walt'},
      {l:'Chip in $15 for tarps',s:'Walt +1.',money:15,pts:1,say:'🇺🇸 Fifteen dollars of blue tarp, at the island’s only hardware shelf. Walt writes your name on the donation jar in marker.',txt:'Blue tarp! The roof now looks like a swimming pool. A dry one. – Walt'},
      {l:'Not now',s:'He understands.',no:true,say:'🇺🇸 “Sure, sure,” Walt says. “The buckets and I will manage.”',txt:'No worries. Buckets are fine. Sort of. – Walt'}]},
    {at:'food',txt:'Roof raffle! Legion needs prizes and people to sell tickets. Prize list so far: a jar of Bev’s jam and a very large zucchini. – Walt',
     title:'The roof raffle',body:'<p>“We’re raffling off a quilt,” Walt says. “And the zucchini. Don’t ask about the zucchini.”</p><p>Tickets are a dollar. The roof costs a bit more.</p>',ch:[
      {l:'Sell tickets for an hour',s:'Reputation +2. Walt +1.',min:60,st:-1,pts:1,rep:2,why:'sold roof raffle tickets for the Legion',say:'🎟️ You work the line at the Riv with a coffee can and a smile. Forty-one dollars in an hour. Rusty buys six tickets out of what he calls “spite.”',txt:'$41 from you alone. The zucchini goes to Dale. – Walt'},
      {l:'Donate $20 as a prize',s:'Walt +2.',money:20,pts:2,say:'🎟️ Your twenty becomes a “Dinner at the Riv for two” prize. Walt reads your name out loud twice, which is how you know it matters.',txt:'Your prize sold out first. – Walt'},
      {l:'Not now',s:'Maybe next time.',no:true,say:'🎟️ “Sure,” Walt says, tucking the ticket roll away. “There’s always the zucchini.”',txt:'We’ll get by. Zucchini ticket sales are brisk. – Walt'}]},
    {at:'legion',txt:'Roofer’s quote came in: $4,200. We have $3,600. I did not sleep. – Walt',
     title:'The quote',body:'<p>Walt unfolds the estimate on the bingo table. $4,200. The Legion jar says $3,600.</p><p>“Six hundred dollars short,” he says. “I’ve fought wars with better odds. Well. Similar odds.”</p>',ch:[
      {l:'Pledge $40',s:'Walt +2.',money:40,pts:2,say:'🇺🇸 Your forty goes in the jar. Walt doesn’t say thank you. He salutes, badly, and then pretends he was scratching his eyebrow.',txt:'The jar is $120 closer. Thank you. Doesn’t cover how much I mean it. – Walt'},
      {l:'Call roofers around for a better price: 45 min',s:'Uses phone battery. Walt +1, reputation +1.',min:45,phone:6,pts:1,rep:1,why:'found the Legion a better roof quote',say:'📱 Three calls, one callback, and a roofer in Spanaway who “used to go to the island as a kid.” He knocks $350 off.',txt:'$350 OFF. Where do you find these people?? – Walt'},
      {l:'Not now',s:'He’ll think of something.',no:true,say:'🇺🇸 “I’ll sell the zucchini,” Walt mutters. You’re not sure he’s joking.',txt:'I’ll figure it out. Always do. – Walt'}]},
    {at:'legion',txt:'Roof day is Saturday. Hammer, hat, sunscreen. Legion lunch afterward. – Walt',
     title:'Roof day',body:'<p>The whole hall is out front with ladders, nail bags and a cooler. Walt hands out hard hats, one of which says WALT’S ACTUAL HARD HAT and is the only one that fits.</p>',ch:[
      {l:'Work the roof crew: 3 hours',s:'Health −2, stress −4. Walt +2, reputation +5.',min:180,hp:-2,st:-4,pts:2,rep:5,why:'helped raise the Legion roof',say:'🔨 A day of shingles, sunburn and a lunch of sloppy joes eaten on the lawn. By four the last row is on, and half the Legion is crying about it.',txt:'It does not leak!!! Not even a little. Get over here, there’s pie. – Walt'},
      {l:'Bring lunch: 40 min',s:'Uses a day of food. Walt +1, reputation +2.',min:40,pantry:1,pts:1,rep:2,why:'fed the Legion roof crew',say:'🥪 Two grocery bags of sandwiches. The crew eats like they invented lunch.',txt:'The sandwiches were the highlight. Don’t tell the roofer. – Walt'},
      {l:'Come by to cheer: 20 min',s:'Walt +1.',min:20,pts:1,say:'📣 You stand in the parking lot and clap. Walt claims it counts.',txt:'We could hear the clapping from the ridge. – Walt'}],
     end:{perk:['walt','🏠','Your shingle','is nailed above the Legion door, with your name in Walt’s block capitals. At the Legion you can sit under it any time.']}}]},
  sam:{ic:'🐔',t:'Chickens and a fox',beats:[
    {at:'lake',txt:'Henrietta is missing. So is Gladys. The coop door was OPEN. I did NOT open it. 🐔',
     title:'Two hens short',body:'<p>Sam is at the road in rubber boots, holding an empty feed scoop like evidence. “Two hens. Gone. And the latch was lifted from the outside.”</p><p>The woods behind his place are big, damp and full of ferns.</p>',ch:[
      {l:'Search the woods with Sam: 1 hour',s:'Stress −2. Sam +1.',min:60,st:-2,pts:1,say:'🐔 You find both hens in a salmonberry thicket, offended but unhurt, and a single orange tuft of fur on the coop wire. Sam looks at it for a long time.',txt:'FOUND THEM. Gladys bit me. I deserved it. 🐔'},
      {l:'Drop off a roll of chicken wire: $12',s:'Sam +1.',money:12,pts:1,say:'🐔 You leave a roll of chicken wire on his porch with a sticky note: “For the coop.” Sam texts a photo of Henrietta inspecting it.',txt:'Henrietta approves. She turned around three times. 🐔'},
      {l:'Not now',s:'Sorry, Sam.',no:true,say:'🐔 “It’s okay,” Sam says. “They’ll turn up. Probably. Hens are good at that.”',txt:'They turned up. One was in the BARN. 🐔'}]},
    {at:'home',txt:'It’s a FOX. I saw it. Orange, polite-looking, completely unashamed. It is winning. Can you help me think? 🦊',
     title:'The fox',body:'<p>“I saw it at dusk,” Sam says. “Sitting on my woodpile. Looking at me. Not scared. <i>Disappointed</i> in me.”</p><p>The hens are already in for the night. Sam has a lawn chair and a thermos.</p>',ch:[
      {l:'Keep watch with Sam: 2 hours',s:'Stress +2. Sam +2.',min:120,st:2,pts:2,say:'🦊 Two hours of lawn chairs and whispered chicken history. The fox never shows. Sam says that’s because you’re both too interesting.',txt:'Didn’t see it, but I felt it watching. Thank you for sitting with me. 🦊'},
      {l:'Buy a motion light: $18',s:'Sam +1.',money:18,pts:1,say:'💡 A motion light by the coop door. The first thing it catches is Sam, in his bathrobe, at 2 AM.',txt:'The light works. It caught me in my robe. Don’t look at the footage. 🦊'},
      {l:'Not now',s:'He’ll manage.',no:true,say:'🦊 “Fair,” Sam says. “I’ll just sit out here and glare.”',txt:'I glared. The fox glared back. Stalemate. 🦊'}]},
    {at:'lake',txt:'Found the den. Under my neighbor’s shed. There are KITS. I don’t know how to feel. 🦊🦊🦊',
     title:'The den',body:'<p>“Three kits,” Sam whispers, at dawn, pointing at the crawlspace under a shed. “The fox isn’t a villain. She’s a mom. A mom who steals from <i>my</i> mom-adjacent chickens.”</p>',ch:[
      {l:'Watch the den at dawn: 45 min',s:'Stress −4. Sam +2.',min:45,st:-4,pts:2,say:'🦊 Three kits tumble out into the first light, tripping over each other. You and Sam don’t say a word for forty minutes.',txt:'Best morning I’ve had in months. Thanks for coming. 🦊'},
      {l:'Help fox-proof the coop: $25 of hardware cloth',s:'Sam +2.',money:25,pts:2,say:'🔧 Hardware cloth under the run, a better latch, a skirt of wire. Sam leaves a pile of table scraps by the shed. “Peace treaty.”',txt:'Fort Knox. Fox-tested! She tried it and went home. 🦊'},
      {l:'Not now',s:'Another time.',no:true,say:'🦊 “I get it,” Sam says. “It’s a lot of fox.”',txt:'We’ll sort it out. The fox and I understand each other. 🦊'}]},
    {at:'home',txt:'COOP-WARMING SATURDAY. New hens. NEW HENS. Come meet them. Bring nothing. Bring yourself. 🐣',
     title:'The new hens',body:'<p>Sam has a banner. The banner says WELCOME TO THE NEW COOP. There are four chicks in a cardboard box under a heat lamp and one is already trying to escape.</p>',ch:[
      {l:'Go to the coop-warming: 45 min',s:'Stress −8. Sam +2, reputation +3.',min:45,st:-8,pts:2,rep:3,why:'celebrated Sam’s new coop with him',say:'🐣 You hold a chick the size of a lemon. Sam names her after you. It’s the nicest thing anyone has done on this island all week.',txt:'She’s officially named. There’s a certificate. I made it. 🐣'},
      {l:'Send a congratulations text: 5 min',s:'Sam +1.',min:5,phone:2,pts:1,say:'📱 “CONGRATS ON THE CHICKS,” you text. Sam replies with eleven chicken emojis.',txt:'🐔🐔🐔🐔🐔🐔🐔🐔🐔🐔🐔'}],
     end:{perk:['sam','🥚','Sam’s eggs','Every few days, a carton of eggs shows up on your porch: “Henrietta says hi.”']}}]},
  bev:{ic:'🧶',t:'Hats for the ferry crew',beats:[
    {at:'store',txt:'Do you know how many people crew the ferry? Fourteen. It’s September-ish and I’ve decided each of them gets a hand-knit hat for Christmas. This is going to be a lot of yarn. 🧶',
     title:'Fourteen hats',body:'<p>Bev has her notebook open to a page titled FERRY CREW (14) and a list of head sizes she has mostly guessed from afar. “They stand outside in all weather,” she says. “Nobody knits for them. I’m starting early.”</p>',ch:[
      {l:'Chip in $18 for yarn',s:'Bev +1.',money:18,pts:1,say:'🧶 Your eighteen dollars becomes nine skeins of navy and one of defiant orange. “For the captain,” Bev says.',txt:'The yarn is HERE. The orange one is Captain’s. Don’t tell anyone. 🧶'},
      {l:'Wind yarn into balls for an hour',s:'Stress −3. Bev +1.',min:60,st:-3,pts:1,say:'🧶 An hour with your arms out and a skein looped over your wrists, hearing about the Great Knitting Circle Feud of 2019.',txt:'You are the best yarn holder in the county. 🧶'},
      {l:'Not now',s:'Good luck, Bev.',no:true,say:'🧶 “Oh, I’ve got plenty,” Bev says, bringing a bag of yarn into view that was not visible before.',txt:'I’m fine! Casting on number three. 🧶'}]},
    {at:'store',txt:'My hands are doing the thing again. Arthritis. Slowed me down. Seven hats so far. Seven to go. Could you help? 🧶',
     title:'Seven to go',body:'<p>“Seven down,” Bev says, rubbing her wrists. “Seven to go. And the deadline doesn’t care about my hands.”</p>',ch:[
      {l:'Learn to knit a hat band: 1 hour',s:'Stress −2. Bev +2.',min:60,st:-2,pts:2,say:'🧶 You knit eleven rows of a hat band that looks like a map of a flooded county. Bev says it’s “full of character” and uses it as a pot holder.',txt:'Your hat band is now on my fridge. 🧶'},
      {l:'Bring a thermos of soup',s:'Uses a day of food. Bev +1.',pantry:1,min:20,pts:1,say:'🍲 You drop a thermos of soup at her door. Bev eats it while knitting, one hand for the spoon, the other for the needles.',txt:'Soup + knitting = productivity. Eight hats! 🧶'},
      {l:'Not now',s:'Of course.',no:true,say:'🧶 “I’ll manage,” Bev says. “I always do.”',txt:'Twelve cups of tea and eight hats. We’re fine. 🧶'}]},
    {at:'aiDock',txt:'The deckhand Corey has a REALLY big head. I need his size without him knowing. Ideas? 🧶',
     title:'Corey’s head',body:'<p>“I can’t knit a hat for a man whose head I can’t measure,” Bev says. “I tried while he was handing me my ticket. He wouldn’t hold still.”</p>',ch:[
      {l:'Get Corey’s size at the dock: 15 min',s:'Stress −1. Bev +2.',min:15,st:-1,pts:2,say:'📏 You ask Corey to “try on a hat for science.” He wears it for the whole sailing and refuses to give it back. Size: large. Very large.',txt:'He’s a 24-incher! Glorious. I owe you. 🧶'},
      {l:'Text Corey a measuring tape selfie challenge',s:'Phone battery. Bev +1.',phone:5,min:5,pts:1,say:'📱 Corey sends a measuring-tape selfie from the car deck. He’s grinning.',txt:'This works too. A little less dignified. 🧶'},
      {l:'Not now',s:'Another time.',no:true,say:'🧶 “I’ll make it big and hope,” Bev says.',txt:'Made it big. It’ll stretch. 🧶'}]},
    {at:'aiDock',txt:'DELIVERY DAY! Hats are blocked and bagged. Meet me at the dock before the 3:30? 🎄',
     title:'Hat delivery',body:'<p>Bev has fourteen hats in a laundry basket, each tagged with a name in her tight handwriting. The crew is lined up on the car deck, trying not to look like they’re lined up.</p>',ch:[
      {l:'Help hand them out: 40 min',s:'Stress −6. Bev +2, reputation +4.',min:40,st:-6,pts:2,rep:4,why:'helped deliver hats to the ferry crew',say:'🎄 Fourteen deckhands in fourteen hats. The captain’s is orange. He wears it all the way across, and the horn gets blown twice for no reason.',txt:'I cried on the car deck. In front of the Coast Guard. Worth it. 🎄'},
      {l:'Carry the basket on your next crossing: 10 min',s:'Bev +1, reputation +1.',min:10,pts:1,rep:1,why:'delivered Bev’s hats',say:'🧺 You carry a basket of hats aboard. By the time you get off, three crew members are already wearing theirs.',txt:'Delivered! The crew says thank you. Tell Bev’s friend thank you. (That’s you.) 🎄'}],
     end:{perk:['bev','🧶','The crew remembers','Sometimes a deckhand tips a knit hat to you as you roll off the ferry, and it lifts your mood.']}}]},
  rusty:{ic:'🍺',t:'Selling the Riv',beats:[
    {at:'food',txt:'Guy from Gig Harbor came by with an offer for the Riv. Condos, he said. CONDOS. Come by when you can. – Rusty',
     title:'An offer',body:'<p>Rusty’s behind the bar polishing the same glass for the fourth time. “Fella came in a nice jacket,” he says. “Offered a lot. Said the building’s got ‘potential.’ I said it’s got a ceiling. He laughed.”</p><p>He didn’t sound like he was joking.</p>',ch:[
      {l:'Sit at the bar and listen: 45 min, $14 burger',s:'Stress −2. Rusty +1.',min:45,money:14,st:-2,pts:1,say:'🍔 Forty-five minutes, a burger and a very honest account of what a winter at the Riv does to a man’s books.',txt:'Thanks for listening. Most folks just order. – Rusty'},
      {l:'Text him you’d miss it: 5 min',s:'Rusty +1.',min:5,phone:2,pts:1,say:'📱 “Don’t sell,” you text. He answers: “It’s not that easy.” Then: “…thanks.”',txt:'You’re not wrong. Haven’t decided. – Rusty'},
      {l:'Not now',s:'Hope it works out.',no:true,say:'🍺 “It’s fine,” Rusty says. “It’s not fine. But it’s fine.”',txt:'Not your problem. Thanks anyway. – Rusty'}]},
    {at:'food',txt:'Going over the books tonight. Winter’s thin. Might need a second pair of eyes. – Rusty',
     title:'The books',body:'<p>Rusty spreads a shoebox of receipts across the bar. “Summer pays for winter,” he says. “Except when it doesn’t.”</p>',ch:[
      {l:'Go over the numbers with him: 90 min',s:'Stress −1. Rusty +2.',min:90,st:-1,pts:2,say:'📒 You find a $400-a-month ice machine lease nobody’s read since 2016. Rusty stares at it, then laughs for a full minute.',txt:'The ice machine. THE ICE MACHINE. Cancelled. – Rusty'},
      {l:'Eat at the Riv twice this week: $28',s:'Rusty +1.',money:28,pts:1,say:'🍔 Two dinners at the Riv. It isn’t a rescue, but he writes your order on the “regulars” board for the first time.',txt:'Saw you in twice. Don’t tell the cook, he’s insufferable now. – Rusty'},
      {l:'Not now',s:'Sorry.',no:true,say:'🍺 “No worries,” Rusty says. “I’ll just keep staring at it.”',txt:'Still staring. – Rusty'}]},
    {at:'food',txt:'Folks heard I might sell. Somebody put up a flyer. “Save the Riv night” Saturday?? I did NOT approve this. – Rusty',
     title:'Save the Riv night',body:'<p>There’s a flyer on the Riv’s door in thick marker: SAVE THE RIV, SATURDAY 6 PM. FOOD, MUSIC, NO TALKING ABOUT CONDOS. Rusty swears he didn’t write it.</p>',ch:[
      {l:'Help organize it: 2 hours, $15 for supplies',s:'Rusty +2, reputation +3.',min:120,money:15,st:-2,pts:2,rep:3,why:'helped throw the Save the Riv night',say:'🎶 A fiddle, a keg, folding tables, and somebody’s grandma running a raffle. By eight o’clock the Riv has never been so full.',txt:'Never seen it so packed. People brought casseroles. To a bar. – Rusty'},
      {l:'Spread the word on the ferry: 20 min',s:'Rusty +1, reputation +1.',min:20,pts:1,rep:1,why:'spread the word about the Riv',say:'📣 You tell everyone in line. Even the people from Tacoma. They say they’ll “try to come over.”',txt:'Heard you were telling people. Appreciate it. – Rusty'},
      {l:'Not now',s:'Another time.',no:true,say:'🍺 “It’ll be fine without you,” Rusty says. “Might be a little less fine.”',txt:'Went okay. Not great. Okay. – Rusty'}]},
    {at:'food',txt:'Made a decision. Come by. First one’s on me. – Rusty',
     title:'The decision',body:'<p>The bar is quiet. Rusty has taken the SOLD sign out of a drawer, looked at it, and put it back.</p><p>“Turns out you can’t sell a place with four hundred license plates on the wall,” he says. “They’re not mine. They’re everybody’s.”</p>',ch:[
      {l:'Raise a glass with him: 1 hour',s:'Stress −8. Rusty +2, reputation +4.',min:60,st:-8,pts:2,rep:4,why:'was there the night Rusty kept the Riv',say:'🍺 One round, then another, then coffee. At closing Rusty slides you a laminated card that says FIRST ONE’S ON ME, FOREVER. He signs it with a flourish.',txt:'Not selling. For now. Thanks for being around. – Rusty'},
      {l:'Stop in for a quick coffee: 15 min',s:'Rusty +1, reputation +1.',min:15,st:-2,pts:1,rep:1,why:'stopped in on Rusty',say:'☕ You drink a cup of coffee at the bar. Rusty tells you it’s on the house, and that he’s keeping the place.',txt:'Keeping it. Don’t go telling people I’m sentimental. – Rusty'}],
     end:{perk:['rusty','☕','Rusty’s free coffee','is yours at the Riv: every day you drop in, the first cup is on the house.']}}]},
  hendersons:{ic:'🥧',t:'Photos and a reunion',beats:[
    {at:'farm',txt:'Don found a shoebox of old photographs in the barn loft! 1940s. The museum needs them sorted and labeled before they fall apart. Could you help? – Ruth',
     title:'The shoebox',body:'<p>Ruth sets a dusty shoebox on the farm’s picnic table. Inside are curled black-and-white photos: boys on a hay wagon, a woman with a very large cabbage, the first ferry.</p><p>“Nobody wrote names on the back,” she says. “Except Aunt June. In pencil. In 1952.”</p>',ch:[
      {l:'Sort and label photos: 90 min',s:'Stress −3. Hendersons +1.',min:90,st:-3,pts:1,say:'📷 You work out three people from one jacket and a nose. Ruth makes tea and cries a little at a photo of her father with a pig.',txt:'You’re a wonder. The pig has a name now: Duchess. – Ruth'},
      {l:'Scan photos on your phone: 40 min',s:'Uses phone battery. Hendersons +1.',min:40,phone:10,pts:1,say:'📱 You scan the whole shoebox with the camera app. The phone gets warm. Ruth reads each caption aloud as if they’re old friends.',txt:'Don says it’s witchcraft. Thank you, dear. – Ruth'},
      {l:'Not now',s:'Another day.',no:true,say:'🥧 “Oh, they’ve waited seventy years,” Ruth says. “They can wait.”',txt:'We’ll get to them. Slowly. – Ruth'}]},
    {at:'farm',txt:'The museum would like photos of the old tools for the display. Do you have a steady hand? Don’s hand shakes now. – Ruth',
     title:'Tools of the farm',body:'<p>On the barn’s long bench: a cream separator, a hay knife, a hand-cranked cherry pitter and a saw that is, Don says, “older than the dirt.”</p><p>The museum wants pictures for a display.</p>',ch:[
      {l:'Photograph the old tools: 45 min',s:'Stress −3. Hendersons +1. Adds a photo to your album.',min:45,st:-3,pts:1,photo:['The old tools at the Johnson Farm','🚜','Henderson barn bench, golden afternoon light'],say:'📸 Forty-three photos of a saw. You pick the best one. Don says it makes the saw look “almost dignified.”',txt:'The saw is famous now. – Ruth'},
      {l:'Chip in $15 for frames',s:'Hendersons +1.',money:15,pts:1,say:'🖼️ Fifteen dollars of secondhand frames from the swap board. Ruth hangs the first photo crooked on purpose, “for authenticity.”',txt:'Frames hung! Don says they’re crooked. They’re not. – Ruth'},
      {l:'Not now',s:'Sorry.',no:true,say:'🥧 “You’re busy,” Ruth says kindly. “Island people always are.”',txt:'Next time. – Ruth'}]},
    {at:'farm',txt:'FAMILY REUNION is the second Saturday. Forty-one relatives. Three of them are not speaking. I need help. – Ruth',
     title:'The reunion',body:'<p>“Forty-one Hendersons,” Ruth says. “Counting the dog. Counting the baby. The ones from Spokane won’t fit in the guest room, and that’s fine, because the ones from Spokane will bring a ham.”</p>',ch:[
      {l:'Make a dish for the potluck: 45 min',s:'Uses a day of food. Hendersons +2.',min:45,pantry:1,pts:2,say:'🍲 Your casserole has no name. It’s gone in eleven minutes. Ruth asks for the recipe and you have to confess you made it up.',txt:'Your casserole was the first to go. I want the recipe. – Ruth'},
      {l:'Help set up the barn: 90 min',s:'Stress −2. Hendersons +2.',min:90,st:-2,pts:2,say:'🪑 Chairs from the Legion, tables from the fire hall, bunting from somebody’s 4th of July. The barn has never looked so loved.',txt:'The barn looks like a movie. Thank you, dear. – Ruth'},
      {l:'Not now',s:'Next time.',no:true,say:'🥧 “We’ll manage,” Ruth says. “Spokane will bring a ham.”',txt:'We’ll manage. We always do. – Ruth'}]},
    {at:'farm',txt:'Reunion day! Gates open noon. Come and meet the family. You’re in the photo whether you like it or not. – Ruth',
     title:'The family photo',body:'<p>Forty-one Hendersons, a dog and a baby are lined up on the barn steps. Don is trying to set the camera timer. It beeps. He says “It’s witchcraft.”</p><p>“You,” Ruth says, pointing at you. “Front row. We’re not taking it without you.”</p>',ch:[
      {l:'Go to the reunion: 2 hours',s:'Stress −10. Hendersons +2, reputation +4, a photo for your album.',min:120,st:-10,pts:2,rep:4,why:'was part of the Henderson family photo',pantry:-2,photo:['The Henderson reunion portrait','🥧','Forty-one Hendersons, a dog, a baby and you in the front row'],say:'📸 “Say pie!” You do. Forty-three faces, and you’re standing next to a very proud old farmer. Ruth sends you home with enough ham for three days.',txt:'The photo came out. You look like family. Because you are. – Ruth'},
      {l:'Drop by with a card: 20 min',s:'Hendersons +1, reputation +1.',min:20,pts:1,rep:1,why:'dropped in on the Henderson reunion',say:'💌 You hand Ruth a card and get a plate of cake the size of a hubcap.',txt:'The card is on the mantel. Come next year. – Ruth'}],
     end:{perk:['hendersons','🖼️','The Henderson photo wall','has a frame with your face in it at the Johnson Farm. Visit any time.']}}]},
};
window.FSTORIES=FSTORIES;
const fstStory=id=>FSTORIES[id];
const fstTitle=id=>`${FSTORIES[id].ic} ${FSTORIES[id].t}`;

// ---- when is a beat ready? ----
function fstReady(id){const F=FST(),A=F[id],f=S.friends[id],S0=FSTORIES[id];if(!S0||!f||A.done||A.b>=S0.beats.length)return false;
  try{if(typeof npcJailed==='function'&&npcJailed(id))return false}catch(e){}
  const dk=dayKey(),reg=typeof regOn==='function'&&regOn(),lv=flv(id),wk=S.weekNo||0;
  if(fstGap(F.day,dk)<1||(S.arcs&&S.arcs.day===dk))return false;
  if(fstGap(A.k,dk)<(reg?1:2))return false;
  const met=f.day!==day()||wk>0||(f.day==null);
  switch(A.b){case 0:return met;case 1:return lv>=2||wk>=1;case 2:return lv>=3||(lv>=2&&wk>=1);default:return lv>=3||(lv>=2&&wk>=2)}}

// ---- run a beat: a window with a choice ----
function fstApply(id,A,c,beat){
  if(c.money&&S.money<c.money)return false;if(c.pantry>0&&S.pantry<c.pantry)return false;
  if(c.money)money(-c.money);if(c.pantry)S.pantry+=-c.pantry;if(c.min){S.t+=c.min;phoneTick()}if(c.phone)phoneUse(c.phone);
  if(c.st)adj('stress',c.st);if(c.hp)adj('health',c.hp);
  if(!c.no)A.h++;
  if(c.pts)friendPts(id,c.pts);if(c.rep)fstRep(c.rep,c.why||'helped a friend');
  if(c.say)say(c.say);
  if(c.photo&&typeof colPhotoAdd==='function')colPhotoAdd({k:'fst_'+id+'_'+(A.b+1),ic:c.photo[1],t:c.photo[0],n:c.photo[2],src:'story'});
  if(c.txt)fstText(id,c.txt,true);
  A.b++;A.k=dayKey();FST().day=dayKey();
  if(A.b>=FSTORIES[id].beats.length){A.done=true;const e=beat.end;
    if(e&&e.perk&&A.h>=2){fstPerk(e.perk[0],e.perk[1],e.perk[2],e.perk[3])}
    else say(`${FSTORIES[id].ic} ${FSTORIES[id].t}: that’s the end of that story. It ended well anyway.`);
    showTile(FSTORIES[id].ic,`${FSTORIES[id].t}: the end`,A.h>=2&&e&&e.perk?'A lasting thanks':'','good');
    try{if(typeof colBingoMark==='function')colBingoMark('story_done')}catch(er){}}
  return true}
function fstRun(id){const F=FST(),A=F[id],S0=FSTORIES[id],beat=S0.beats[A.b];if(!beat)return;
  if(A.sent!==A.b){fstText(id,beat.txt,false);A.sent=A.b}
  const n=A.b+1,tot=S0.beats.length;
  modal(`${S0.ic} ${beat.title}`,`<p style="font-size:12px;color:var(--mute);margin:0 0 6px">${S0.t} · part ${n} of ${tot}</p>${beat.body}`,
    beat.ch.map(c=>({l:c.l,s:c.s,dis:!!((c.money&&S.money<c.money)||(c.pantry>0&&S.pantry<c.pantry)),fn:()=>{fstApply(id,A,c,beat)}})));
}
// ---- the events (one per friend so each gets its own tile) ----
const fstSide=at=>L[at]&&L[at].side==='I';
FST_IDS.forEach(id=>{const S0=FSTORIES[id];
  Object.assign(TILE_META,{['fst_'+id]:[S0.ic,S0.t,'info']});
  defEvent({id:'fst_'+id,hook:['wake','arrive'],priority:3,max:4,cooldown:0,
    chance:ctx=>{const A=S.fst&&S.fst[id],b=A&&FSTORIES[id].beats[A.b];if(ctx.hook==='wake')return 0.5;return b&&ctx.at===b.at?0.85:0.3},
    cond:ctx=>{if(!S||S.over||!S.friends[id])return false;if(ctx.hook==='wake'){if(S.loc!=='home')return false}else{if(!fstSide(ctx.at))return false;const m=tod();if(m<420||m>1230)return false}
      return fstReady(id)},
    run(ctx){fstRun(id);return {stop:true}}});
});
// the night before: a friend texts that they’d like a hand (the window itself comes the next time you’re out and about)
defEvent({id:'fst_text',hook:'night',priority:1,max:3,chance:0.6,cond:()=>FST_IDS.some(id=>S.friends[id]&&fstReady(id)&&FST()[id].sent!==FST()[id].b),
  run(ctx){const id=FST_IDS.find(i=>S.friends[i]&&fstReady(i)&&FST()[i].sent!==FST()[i].b),A=FST()[id],beat=FSTORIES[id].beats[A.b];fstText(id,beat.txt,false);A.sent=A.b;
    const m=`📱 ${msgFirst(id)} texted: “${beat.txt.length>90?beat.txt.slice(0,88)+'…':beat.txt}”`;if(ctx&&ctx.notes)ctx.notes.push(m);else say(m);try{MSG().th[id].u++}catch(e){}return {}}});
TILE_META.fst_text=['📱','A friend texted','info'];

// ---- lasting perks ----
// Sam’s eggs: every few days on the porch
defEvent({id:'fst_eggs',hook:'wake',priority:1,max:3,cooldown:3,chance:0.45,cond:()=>S.loc==='home'&&!!(S.fst&&S.fst.perks&&S.fst.perks.sam),
  run(){adj('stress',-3);if(!visitorOn())S.pantry+=1;say('🥚 A carton of eggs on the porch, tied with baling twine. The note says: “Henrietta says hi. – Sam”.')}});
TILE_META.fst_eggs=['🥚','Eggs from Sam','good'];
// Bev’s hats: a deckhand tips one to you
defEvent({id:'fst_crew',hook:'arrive',priority:1,max:4,cooldown:1,chance:0.3,cond:ctx=>ctx.from==='ferry'&&!!(S.fst&&S.fst.perks&&S.fst.perks.bev),
  run(){adj('stress',-3);say(pick(['🧶 A deckhand tips a navy hat to you as you roll off the ramp. It fits him like it was knitted for him. Because it was.','🧶 Corey gives you a two-finger salute from the car deck, pulling down his very large hat.','🧶 The captain, in a bright orange knit hat, blows the horn twice as you step off. You’re fairly sure that’s for you.']))}});
TILE_META.fst_crew=['🧶','The crew waves','good'];
// places that remember you
const FST_PERKACTS=[
  {perk:'rusty',loc:'food',key:'cof',ic:'☕',l:'Rusty’s free coffee',s:'10 min. On the house. Stress −3, once a day.',min:10,st:-3,say:'☕ Rusty slides a mug across the bar without looking up. “First one’s on me.” It’s a good first one.',pts:0},
  {perk:'walt',loc:'legion',key:'shg',ic:'🏠',l:'Sit under your shingle',s:'10 min. Stress −3, once a day.',min:10,st:-3,say:'🇺🇸 You sit on the Legion bench under the shingle with your name on it. Walt brings coffee. Neither of you says anything for ten good minutes.',pts:0},
  {perk:'hendersons',loc:'farm',key:'wal',ic:'🖼️',l:'Visit the Henderson photo wall',s:'10 min. Stress −3, once a day.',min:10,st:-3,say:'🖼️ There you are: front row, between a toddler and a pig. Ruth has labeled it “Our favorite neighbor” in pencil. You look at it longer than you meant to.',pts:0}];
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{const F=S&&S.fst;if(F&&F.perks){const dk=dayKey();
  for(const p of FST_PERKACTS){if(!F.perks[p.perk]||S.loc!==p.loc)continue;if(L[p.loc].hours&&!isOpen(p.loc))continue;const done=F.used[p.key]===dk;
    a.push({ic:p.ic,l:p.l,s:done?'You’ve had your fill today.':p.s,cat:'here',dis:done,fn:()=>{F.used[p.key]=dk;S.t+=p.min;phoneTick();adj('stress',p.st);say(p.say);afterAction()}})}}}catch(e){console.error(e)}return a}}
