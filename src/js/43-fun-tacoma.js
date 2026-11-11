// ---- 🎟️ going out in Tacoma: two restaurants (waterfront seafood, Proctor Mexican) + the zoo, the glass museum and an art-house cinema ----
// Uses defFun() from 40-fun.js. Hours are rough 2026 hours (d: 0 Mon … 6 Sun); prices are 2026 dollars.
defFun({id:'tc_dukes',town:'Tacoma',kind:'restaurant',name:'Duke’s Seafood (Ruston Way)',ic:'🦪',
  desc:'Chowder and fish on the Tacoma waterfront, with a view of the water you just crossed. Nobody here is in a hurry, including the gulls.',
  pos:[9,10],
  hours:d=>[660,d===4||d===5?1380:1320],
  acts:[
    {l:'Chowder, fish and a window seat',s:'A real sit-down dinner. Counts as tonight’s food. Stress −8.',min:80,cost:42,stress:-8,sat:1,done:'You eat clam chowder and wild salmon while the light goes orange over Commencement Bay'},
    {l:'Chowder and a roll at the bar',s:'Small, warm, and over quickly. Stress −5.',min:40,cost:17,stress:-5,done:'A cup of chowder and a roll at the bar, and the tide keeps going on without you'},
    {l:'Walk the Ruston Way waterfront path',s:'Free. The path runs for miles. Stress −6.',min:45,cost:0,stress:-6,done:'You walk the waterfront path, past joggers, dogs and one very serious heron'}]});

defFun({id:'tc_cactus',town:'Tacoma',kind:'restaurant',name:'Cactus (Proctor)',ic:'🌮',
  desc:'Mexican plates and big margaritas in the Proctor District, where the sidewalks are wide and the farmers market is on Saturday. A very different meal from the waterfront.',
  pos:[9.5,8.5],
  hours:d=>[d>=5?600:660,1320],
  acts:[
    {l:'Tacos, rice and beans',s:'A full meal. Counts as tonight’s food. Stress −7.',min:60,cost:28,stress:-7,sat:1,done:'Two tacos, rice, beans and too many chips. You leave a good tip and a very clean plate'},
    {l:'Chips, guacamole and a drink',s:'Not dinner, but close. Stress −5.',min:35,cost:19,stress:-5,done:'Chips, guacamole and a lime-heavy drink at the bar. The island feels very far away'}]});

defFun({id:'tc_zoo',town:'Tacoma',kind:'fun',name:'Point Defiance Zoo & Aquarium',ic:'🦭',
  desc:'A zoo and an aquarium in a forested park at the north tip of Tacoma. Walruses, sharks and red wolves, none of whom have to catch a ferry. ZooLights runs in the evenings in December.',
  pos:[9,13],
  hours:()=>{const s=seasonId();return [540,s==='summer'?1080:s==='winter'?960:1020]},
  acts:[
    {l:'Walk the whole zoo',s:'Tickets about $25. Stress −12.',min:180,cost:25,stress:-12,done:'You see the walruses, the sharks and the red wolves, and you sit down twice'},
    {l:'Just the aquarium and the sea otters',s:'Same ticket, shorter day. Stress −8.',min:90,cost:25,stress:-8,done:'Jellyfish drift past in blue light. It is the calmest 90 minutes you have had in a while'}]});

defFun({id:'tc_glass',town:'Tacoma',kind:'fun',name:'Museum of Glass',ic:'🫧',
  desc:'On the Thea Foss Waterway, with a working Hot Shop where artists shape molten glass while you watch. Closed Monday and Tuesday. The galleries are being renovated until December 12, 2026.',
  pos:[11.3,6.6],
  hours:d=>d>=2?[600,1020]:null,
  acts:[
    {l:'Watch the Hot Shop and see the exhibits',s:'Adult ticket $18. Stress −10.',min:120,cost:18,stress:-10,done:'You watch a glowing blob become a bowl, and nobody on the team even looks nervous'},
    {l:'Sit and watch the Hot Shop',s:'Same ticket, lots of sitting. Stress −7.',min:50,cost:18,stress:-7,done:'You sit in the amphitheater and watch the glass team work, and for once you are not the busiest person in the room'}]});

defFun({id:'tc_grand',town:'Tacoma',kind:'fun',name:'The Grand Cinema',ic:'🎬',
  desc:'Downtown Tacoma’s nonprofit art-house cinema. Indie films, documentaries, and popcorn that comes with real butter. Open every day of the year, as the sign says.',
  pos:[11,6],
  hours:d=>[d<4?780:690,1380],
  acts:[
    {l:'See a film',s:'Adult ticket $13. Stress −10.',min:130,cost:13,stress:-10,done:'You see an indie film that is subtitled and mostly about a lighthouse. You enjoy it'},
    {l:'Film, popcorn and a soda',s:'Adult ticket $13 plus snacks. Stress −11.',min:135,cost:20,stress:-11,done:'A film, a big bucket of popcorn and a soda, in the dark where nobody can find you'}]});
