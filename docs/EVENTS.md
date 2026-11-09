# Island events framework

Life on Anderson Island isn't just the ferry. Non-ferry events (power outages, dead batteries, neighbors, bingo nights) run through a small framework in `index.html`. Search for `ISLAND EVENTS FRAMEWORK`.

## Defining an event

```js
defEvent({
  id: 'flat_tire',          // unique; used for cooldowns, chaining, saves and stats
  hook: 'tripMid',          // when it can happen (see below); can also be an array, e.g. ['arrive','bingo']
  chance: 0.035,            // number, or ctx => number, rolled each time the hook runs
  cond: ctx => ctx.mode === 'car',  // must be true for the event to fire, even when chained
  priority: 4,              // higher runs first
  max: 1,                   // times per week
  cooldown: 0,              // days before it can fire again
  run(ctx) {                // do the thing
    ctx.add(20); adj('stress', 6);
    say('🛞 Thump-thump-thump. A flat…');
    // return {block:true} to take over (show a choice, then call ctx.finish(extraMinutes))
    // return {stop:true} to stop lower-priority events on this hook
  }
});
```

## Hooks

| Hook | Runs | `ctx` |
|---|---|---|
| `arrive` | Just arrived somewhere: by road, or stepping off the ferry (`from:'ferry'`) | `at`, `from` |
| `night` | While going to bed. Results show in the night summary | `where` (`home`, `terminal`, `motel`), `notes[]` to add lines to the summary |
| `wake` | Start of a day, if you woke up at home | – |
| `tripStart` | Before an island trip leaves. Can block it (dead battery) | `from`, `to`, `mode`, `o` (travel option), `car` |
| `tripMid` | During an island trip | `from`, `to`, `mode`, `car`, `add(min)`, `finish(extraMin)` if blocking |
| `bingo` | Bingo night: once before game 1 (`stage:'start'`), and after games 1–3 (`stage:'between'`) | `stage`, `game` (games played so far), `cont()` to resume bingo if the event blocked |

## Acknowledgement tiles

Every time an event fires, a tile slides in at the top of the screen. It shows the event's icon and name, the day and time, and where it happened or what caused it (e.g. *Caused by: Power outage* for a chained event). Tap ✓ to acknowledge it, or it fades after 6.5 seconds. Up to 3 show at once and the rest wait their turn. Colors: red = trouble, green = good news, blue = island life.

Give a new event a tile by adding it to `TILE_META` (`id: [icon, title, 'bad'|'good'|'info'|'warn']`) or by setting `tile: [icon, title, kind]` in `defEvent`. You can also call `showTile(icon, title, subtitle, kind)` directly for moments outside the framework. The ferry uses it for rider alerts, full boats, gas-can busts and arrests.

## OK pop-ups

Events that don't open their own window (no choices) also get an **OK pop-up** with their narration. Several events from the same moment are combined into one pop-up ("2 things just happened"). Overnight events skip the pop-up because they're already listed in the "Good night" summary. Players can turn pop-ups off in ⚙️ Settings, and the tiles still show either way. This is handled by `eventPopup()`, which `fireHook` calls once per hook call.

## Frequency dials

`HOOK_SCALE` in `index.html` sets, for each hook, the chance that a hook call lets *any* event through. It's one roll per call, applied before per-event chances, and chained events are dropped when the roll fails. It's currently `{wake: 0.8}`, so 20% of mornings at home are event-free. Hooks not listed default to 1. Events marked `noScale: true` are exempt (the Wednesday bingo reminder is an announcement, not a random event).

## Chaining events

`chain(id)` guarantees an event fires the next time its hook runs, as long as its `cond` passes. This is how one event sets off others. For example, `power_outage` (night) calls `outageChain()`, which chains:

- `alarm_fail` (wake, 75%): you oversleep by 55–115 minutes
- `no_water` (wake, 60%): no well pump, no shower
- `garage_stuck` (wake, 35%): the first drive of the day takes 8 minutes longer
- `neighbor_ride` (wake, 45%, positive): you meet Sam, who drives you to the ferry
- `friend_coffee` (wake, if Sam is already a friend, 40%, positive)

Chains that don't fire by the end of that morning are dropped. `window.forceEvent(id)` chains an event from the console, which is handy for testing.

## Friends

`meet(id, name, how)` adds a friend to `S.friends`, and friends unlock things:

- **Sam** (new neighbor): rides to the ferry, jump-starts, outage coffee, and company at bingo
- **Walt** (American Legion): jump-starts and a free bingo card
- **Pajama Fred**: ferry tips, including heads-ups about upcoming breakdowns

## Current events

| Event | Hook | What happens |
|---|---|---|
| `power_outage` | night | Random outage (separate from storms). The generator saves the fridge, and it chains morning trouble |
| `starry` | night | Positive: no light pollution during an outage |
| `alarm_fail`, `no_water`, `garage_stuck` | wake | Outage fallout |
| `neighbor_ride`, `friend_coffee` | wake | Positive outage fallout, and how you meet Sam |
| `bingo_reminder` | wake | Wednesday: tonight's beneficiary |
| `dead_battery` | tripStart | Car won't start. Get a jump from Sam or Walt, knock on the neighbor's door, walk, or hitch. The battery stays weak until you replace it in Steilacoom |
| `garage_release`, `tree_down`, `flat_tire`, `deer`, `eagle` | tripMid | Time lost (or a nice moment) on the road |
| `stranded_neighbor` | tripMid | Help a Legion member jump his truck (meet Walt), or drive on |
| `phone_died` | wake (chained by outages) | Phone alarm users whose battery was at 8% or less when the power went out: no alarm, oversleep |
| `phone_saves` | wake (chained by outages) | Phone alarm users with battery: the alarm works through the outage |
| `slept_through` | wake | 7% chance with the phone alarm: you sleep through the gentle chime (20–45 min late) |
| `gen_saves` | wake (chained) | Your generator ran overnight: fridge, heat, water and phone charging all kept going |
| `school_bus`, `oro_bay` | tripMid | Stuck behind the school bus (weekday mornings and afternoons); the scenic way past Oro Bay |
| `garage_sale` | tripMid (weekends) | Buy a used generator, canned food or a battery pack |
| `fire_pancakes` | wake (Saturday) | Fire District #27 pancake breakfast |
| `museum`, `line_cookie` | arrive | Historical Society photos at the old store; a cookie in the ferry line |
| `pajama_fred` | arrive, bingo (between) | Pajama Fred, an island fixture in flannel pajama pants and slippers, asks for a cigarette at the ferry landing, the old store, the Riv, or between bingo games. Give him one (you can buy a pack at the Steilacoom gas station), say no, or spot him $2. Become friends and he passes along ferry tips, including real heads-ups about upcoming breakdowns. Up to 3 times a week |
| `table_taken` | bingo (start) | Only if you reserved a table: strangers are in it. Point out the reservation, squeeze in (maybe meet the Hendersons), or take the seat by the bathrooms |
| `no_seat` | bingo (start) | No reservation: a folding chair under the speaker |
| `bar_argument` | bingo (between) | Two guys arguing at the bar stop the game. Stay out, calm it down (easier with Walt), or pick a side |
| `order_late` | bingo (between) | Only if you ordered: the meal and/or drink is late. Wait, or flag down the server (maybe comped) |

Bingo events can delay the night (`S.bingo.delay` minutes, added to the 8:30 PM finish). Reserve a table by phone from anywhere on Wednesday before 6 PM. Order dinner and a drink ($24, counts as tonight's food), just a drink ($6), or nothing before game 1.

## Alarm, phone and generator

- **Alarms:** there are two independent alarms, each with its own on/off switch and time (4:45–8:00 AM). Set them at home, or anywhere after 7 PM. You wake at the **earliest alarm that actually goes off**. Waking earlier means less stress recovery, sleeping in means more.
  - 🔌 **Plug-in clock:** reliable, but a power outage resets it, and it can't wake you away from home.
  - 📱 **Phone alarm:** works anywhere and through outages if the battery lasts the night. There's a 7% chance you sleep through it.
  - **Backups:** with both on, an outage gives `phone_saves` (the phone wakes you), and sleeping through the phone gives `backup_alarm` (the clock catches you). You oversleep only when every alarm you set fails: `alarm_fail`, `phone_died` or `slept_through`. With no alarm set you get `no_alarm`.
  - **Decided at bedtime:** the outcome is worked out in `endDay` and passed to the wake hook with `chain()`, so it gets tiles and pop-ups. Old single-alarm saves are converted automatically.
- **Phone battery:** drains 4% an hour and charges 0.8% per minute in a car. It charges to 100% overnight at home if the power stays on (or the generator runs), and at a motel. The terminal outlet gives +35% overnight or +30% in 30 minutes. A dead phone means no rideshares and no calling the Riv.
- **Generator:** buy it at Home Depot in Lakewood ($649). You need your car to haul it, and it installs when that car reaches home. It runs on gas stashed in the shed: 2 gallons for a random outage night, 3 for a storm night, or 1 gallon to run it for an hour during a daytime outage. Saves from before 1.5.0 keep the generator they implicitly had.

## Running out of gas

- **Empty tank:** the car can't drive or be driven onto the ferry. With under 0.5 gallons it can board, but there's a 40% chance it stalls on the ramp at the other side and the deckhands push it off (+20 min, tank emptied).
- **Mainland:** call a mobile fuel delivery ($85 for 3 gallons, about 45 min, needs phone battery), or walk to the Steilacoom gas station, buy a can and pour it in.
- **Island (no gas station):**
  - Text **Sam**, who brings 5 gallons from your shed (or their own for $30).
  - Ask **Pajama Fred**, who shows up with a can "from a friend" ($65).
  - Fill a can from your shed at home and carry it to the car yourself.
  - Buy a can at Dale's.
- Gas cans are still banned on the ferry, full or empty.

## Friendships and favors

Friends have a level (1–3) based on points: 3 points for level 2, 6 for level 3. You earn points through favors (+2), shared bingo nights (+1) and helping events. A favor that expires costs −1. `friendPts(id, n)` adds points and announces level-ups with a tile.

- **Favors** come from the `favor_ask` wake event and are defined in `FAVORS`. Each one is a short errand: buy something somewhere and deliver it, or just go somewhere. It's due in two days, and the actions appear at the right location.
- **Perks** are defined in `PERKS`:
  - **Sam:** level 2 gives morning rides on request, level 3 brings groceries (`sam_groceries`).
  - **Walt:** level 2 is a job reference (+15% interview odds), level 3 is the Friday fish fry (`fish_fry`).
  - **Fred:** level 2 always passes on breakdown rumors, level 3 tops off your tank (`fred_topoff`).
  - **The Hendersons:** level 2 means weekend dinners (`henderson_dinner`).

## Jobs, month mode and the co-op

- `JOBS` defines the employers: Lakewood office, the Riv, the Tacoma hospital and the DuPont warehouse. Each has a location, hours, pay and workdays. Losing your job sets `S.emp = null`; you look for work, apply (`jobModal`), interview (`jobActions`) and get hired.
- **Month mode** (`S.mode = 'month'`): Sunday night calls `weekRollover()`, which resets weekly state, generates a new week and moves to `S.weekNo + 1`. The doctor's follow-up is every other week (`apptActive()`).
- **Co-op:** `S.coop.you` (your pledges) plus `S.coop.town` (neighbors, nightly). When that reaches `COOP_GOAL` the store reopens, with groceries and gas pumps (`coopActions`).

## Bingo at the Riv

Wednesday 6:00–8:00 PM at the Riv (Riviera restaurant), hosted by the American Legion. Each week's beneficiary is drawn from `BINGO_FOR`:
- Anderson Island Historical Society
- Pierce County Fire District #27
- Anderson Island Elementary Booster Club

It's four games with real 75-ball cards and calls (`bingoGame`). Pots are tuned so the house keeps a little, as charity bingo should. Times and pot sizes are game inventions.

## Player name

Any text can contain the token `{{name}}`. It's replaced with the player's current name (HTML-escaped) when it's displayed, by `render()`, `modal()`, `showTile()`, the title screen and the end screen. Stored text keeps the token, so changing your name in ⚙️ Settings updates every line already in the log. The name is saved with the week (`S.name`) and remembered between games (`localStorage['islandtime.name']`). The first new game asks for it.

## Saves

New state lives in `S.ev`, `S.friends`, `S.power`, `S.battery`, `S.bingo` and `S.week.bingo`. `migrate()` fills these in for older saves (save schema 4).

## House & upkeep events (1.10)

State lives in `S.up` (see `upInit()`); `upkeepNight()` advances it every night before the `night` hook fires, and `upkeepActions()` builds the 🏠/🌲 fold-outs at home. The Home meter is `S.home` (`homeAdj()`, `homeTier()`).

| id | hook | fires when |
|---|---|---|
| `leaky_roof` | night | roof moss ≥ 60 (×2 on rainy nights; more if Home is low) |
| `mice` | night | no traps set; more likely when Home is low |
| `mouse_caught` | night | traps set (flavor) |
| `black_mold` | night | condensation (`damp`) ≥ 4; then −1 health a night until scrubbed |
| `chimney_fire` | night | stove burned tonight and chimney unswept ≥ 21 days (worse with ash) |
| `crawl_flood` | night | rainy night and gutters ≥ 60% full |
| `limb_roof` | night | storm night and limbs over the roof ≥ 60 |
| `septic_backup` | night | septic ≥ 95% |
| `clogged_drain` | wake | low Home, or septic ≥ 75% |
| `well_quit` | wake | well pump unserviced > 45 days |
| `friend_dropin` | wake | weekend, you have friends; much likelier when Home is high |

Also: potholes multiply `flat_tire` from home (×2 / ×4), an unserviced generator can fail (`genFails()`), a maintained well makes `no_water` rarer, and outages that spoil food set `S.up.fridge`. Contractor visits are `S.up.jobs` (`UP_JOBS`), delayed by ferry outages like grocery delivery.

## Island life: community calendar and friend arcs

Search `island life: community calendar` in `index.html`. State: `S.cal` (community events: dayKey you attended each one, the week-mode bazaar roll `bzWk`/`bz`, and `chim` for the one-time chimney check) and `S.arcs` (`{sam,walt,hendersons}` each `{b: beats done, k: dayKey of last beat, h: times you helped}`, plus `day` = dayKey of the last beat of any arc). Both are in `baseState()`, so `migrate()` fills them in for old saves. Actions come from `lifeActions(a, loc)`, called in `actions()` next to `favorActions`.

**Community calendar** (`LIFE_CAL`; each has a wake notice with `noScale`, a tile, and an action at its place; before/after the window the action shows as disabled):

| id | hook | when | action |
|---|---|---|---|
| `veterans_day` | wake | month mode, week 2 Wed (Nov 11) | the Riv, 11:00–11:40 AM: 60 min, stress −6, Walt +2 (or meet Walt) |
| `craft_bazaar` | wake | Sat, month weeks 3–4; week mode 60% roll | Lake Josephine (clubhouse), 10 AM–3 PM: wreath $25 (Home +3, stress −4) or browse (stress −2); may meet `bev` |
| `lake_cleanup` | wake | Sun, month week 2; week mode always | Lake Josephine, 8–11 AM start: 120 min, stress −4, `S.rep+1` if it exists, a friend +2 (or meet the Hendersons) |
| `fire_drill` | wake | Thu, month week 3; week mode always | the old store (fire station), 5:30–6:30 PM start: 90 min, stress −3, health +2, Rusty +2 (or meet him), `S.up.chimney=0` once |
| `bev_bread` | wake | Bev is a close friend, 35% | +1 day of food |

New friend `bev` (Bev the knitter): level 2 takes $5 off the wreath, level 3 unlocks `bev_bread`.

**Friend arcs** (`arcReady(id)`): beat 1 once you know the friend (not the same morning you met); beat 2 at good friend or from week 3; beat 3 at close friend or in week 4. Beats are at least 2 days apart, and only one arc beat fires per day. Each beat is a modal; the beat counts when it fires, and "Not now" moves the story on without helping (`h` decides the finale's bonus).

| id | hook | beats |
|---|---|---|
| `arc_sam` | wake (60%) | scrape the skiff (1 h) · chip in $25 or sand (1 h) · launch day (1 h; if you helped: stress −10, +2 food) |
| `arc_walt` | arrive at the Riv, landing, old store, lake or home, 9 AM–8:30 PM (50%) | show Tyler around / suggest eagles · teach him to split wood (+4 nights of firewood) · Legion send-off ($10, dinner; helped twice: phone to 100%) |
| `arc_hendersons` | wake (60%; finale on weekends only) | address invitations (45 min) · $20 for the cake or bake (−1 food) · anniversary brunch (90 min, stress −12, +1 food; helped twice: Home +4) |
