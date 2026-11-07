# Island events framework

Life on Anderson Island isn't just the ferry. Non-ferry events (power outages, dead batteries, neighbors, bingo nights) run through a small framework in `index.html`. Search for `ISLAND EVENTS FRAMEWORK`.

## Defining an event

```js
defEvent({
  id: 'flat_tire',          // unique; used for cooldowns, chaining, saves and stats
  hook: 'tripMid',          // when it can happen (see below)
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
| `night` | While going to bed. Results show in the night summary | `where` (`home`, `terminal`, `motel`), `notes[]` to add lines to the summary |
| `wake` | Start of a day, if you woke up at home | – |
| `tripStart` | Before an island trip leaves. Can block it (dead battery) | `from`, `to`, `mode`, `o` (travel option), `car` |
| `tripMid` | During an island trip | `from`, `to`, `mode`, `car`, `add(min)`, `finish(extraMin)` if blocking |

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

## Bingo at the Riv

Wednesday 6:00–8:00 PM at the Riv (Riviera restaurant), hosted by the American Legion. Each week's beneficiary is drawn from `BINGO_FOR`:
- Anderson Island Historical Society
- Pierce County Fire District #27
- Anderson Island Elementary Booster Club

It's four games with real 75-ball cards and calls (`bingoGame`). Pots are tuned so the house keeps a little, as charity bingo should. Times and pot sizes are game inventions.

## Saves

New state lives in `S.ev`, `S.friends`, `S.power`, `S.battery`, `S.bingo` and `S.week.bingo`. `migrate()` fills these in for older saves (save schema 4).
