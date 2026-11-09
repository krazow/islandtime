# ⛴️ Island Time

**A week of living on Anderson Island, Washington.** There's no bridge. One small county ferry connects your island home to your job, the grocery store, the gas pump and your doctor. Survive Monday through Sunday despite fog, full boats, breakdowns, a closed General Store and no gasoline on the island.

![Gameplay](screenshots/gameplay-1.png)

## Play

| How | What to do |
|---|---|
| 🌐 **In a browser** | Open **https://krazow.github.io/islandtime/** on any phone or computer. |
| 📴 **Offline, no install** | Download [`offline/IslandTime-offline.html`](offline/IslandTime-offline.html) (or grab it from [Releases](../../releases)) and double-click it. It's one file with everything inside, so it needs no internet or server. |
| 📱 **As a phone app** | Open the browser link. **Android:** tap *Install as an app* on the title screen. **iPhone:** Share → *Add to Home Screen*. It works offline after the first visit. |
| 🪟 **Windows** | Download `IslandTime-Setup.exe` from [Releases](../../releases). Installs per-user, no admin needed. Windows SmartScreen may warn about an unrecognized app (it isn't code-signed): *More info → Run anyway*. |

## The game

- **Work** in Lakewood Monday–Friday. Clock in by 9:00, and the 7:45 boat is the only one that gets you there.
- **Ferry:** be in line 20 minutes early. Fog delays, commute boats fill up, Monday fuel runs cancel sailings, and breakdowns can strand you for a day or more. Then there's the neighbor's sailboat water taxi, the passenger-only backup boat, or a night in the Steilacoom terminal.
- **Food:** the island's only store closed in February 2026. Shop on the mainland, order delivery, or get takeout.
- **Gas:** there's none on the island, and gas cans are banned on the ferry. Drive over to fill up, pay Dale $12 a gallon, switch to diesel (two DOT cans are legal), or risk smuggling.
- **Medical:** make Thursday's doctor's appointment in Tacoma, pick up your prescription, and treat that sprained ankle.
- **Weather:** a November gale can knock out the power. Keep generator gas in the shed.
- **Island life:** power outages that reset your alarm clock and kill the well pump, dead car batteries with no tow truck on the island, trees down on the road, and neighbors who become friends (and give you rides). Wednesday night is **Bingo at the Riv**, hosted by the American Legion, with proceeds benefiting the Anderson Island Historical Society, Pierce County Fire District #27 or the Anderson Island Elementary Booster Club. Adding new events is easy: see [docs/EVENTS.md](docs/EVENTS.md).
- **Trading:** import food, medical supplies and fuel to the island and sell at island prices, which spike when the ferry is down. Or take a much bigger risk with illicit drugs, where a deputy's K-9 on the car deck or an undercover buyer means arrest.

### New in 1.8
- **Difficulty:** 🌲 *Islander* (easier), ⛴️ *Normal*, or 🔥 *Ferry Hell* (summer tourists, constant breakdowns, score ×1.25).
- **One week or a whole month:** the month carries everything over, week to week. Help the islanders raise $2,500 and the old store reopens as the **AI Food Co-op**, with groceries and gas pumps on the island.
- **Jobs:** getting fired no longer ends the game. Hunt for work on your phone or the bulletin board, interview, and get hired. Options: line cook at the Riv (no ferry!), a Tacoma records clerk (best pay), or an early warehouse shift in DuPont.
- **Friendships grow:** friends level up (💛 → 💛💛💛) through favors you do for them, and they ask favors back. Perks include Sam's morning rides, Walt's job references, a Legion fish fry, and the Hendersons' pot roast.
- **Ferry trip planner** (⛴️ tab): pick where you need to be and by when. It tells you which boat to take, when to leave, when to be in line, and whether that boat tends to fill up.
- **Guided first day:** tips walk you through Monday. Trading and Dale unlock on Tuesday (or turn tips off).
- **Cleaner screens:** actions are grouped (Work, Ferry, Food, Fuel, Phone, Around here), and "Go somewhere" folds away.
- **More island life:** the school bus, a garage sale, Fire District #27's pancake breakfast, the Historical Society, Oro Bay, cookies in the ferry line. Eagle and Pajama Fred appearances are toned down.
- **Daily review** in the night summary: money, crossings, ferry waits and events.
- **Sound** (synthesized ferry horn and chimes) and **accessibility** options: larger text, high contrast, reduce motion.
- The doctor's appointment moved to **Thursday**, so Wednesday is just bingo night.

### 1.11.1: under the hood
- The game's code is now organized into modules in `src/` and built into the single `index.html` with `tools/build.py`. Nothing changes for players; the automated tests check that `index.html` always matches `src/`.

### New in 1.11: island help, Next up, island life, achievements
**Island help for your house**

- 🧰 **Gus, the island handyman.** Call him from home (🌲 Outside & property). Pay $90 cash, 5 gallons of gas from your shed, or 2 days of groceries, and he fixes the 3 jobs that need it most. He lives on the island, so ferry outages can’t stop him. Island time can: sometimes he shows up a day late.
- 💛 **Gus becomes a friend.** Keep calling him and he gives you the friends rate ($60), then starts doing your dishes and laundry too.
- 📣 **Post in the Anderson Island community group.** Once a day, ask for help with a specific job or general help around the house. Replies come in a few hours: a neighbor might show up, lend you a tool, flood your phone with twelve replies, argue in the comments, or try to sell you gutter guards.
- 🤲 **Help a neighbor.** Spend an hour (8 AM–7 PM) helping someone from the group. It lowers your stress and builds your island reputation. More reputation and more friends mean better odds when you ask for help, and you might make new friends along the way.
- 🛠️ **Community work parties.** Help enough people and neighbors may show up on a weekend morning with ladders and a pie to fix your two worst jobs.
- 💡 **New tips** explain the Home meter, the 🏠/🌲 upkeep lists and what to do when your house is run down.
- 📖 **How your house works**, a new page in Settings ⚙️, explains the Home meter, chores, maintenance, ferry-bound contractors, Gus, the community group and reputation.

**Next up**
- New **Next up** card at the top of the 🧭 Here tab: one suggestion for what to do now: today's shift, an interview, the doctor's appointment, your most urgent to-do, bedtime (with your alarm), or a house chore that's due.
- Commuting from the island? Next up names the boat to catch and when to leave. Tap it to open the ⛴️ trip planner, already filled in.
- Your own #1 priority from the 📋 To-do tab shows as a second line ("📌 Your #1: …").
- Tap a house chore suggestion to open the right 🏠/🌲 list. Tap ✕ to hide the card for the rest of the day.

**More life on the island**

- 🇺🇸 **Veterans Day, Wednesday Nov 11** (month mode): the American Legion holds a ceremony at 11:00 AM by the flagpole outside the Riv. Show up and you’ll leave calmer, and closer to Walt (or finally meet him).
- 🎄 **Holiday craft bazaar** at the community clubhouse by Lake Josephine, Saturdays in weeks 3 and 4 (and some Saturdays in a one-week game). Buy a cedar wreath for your door (Home +3) or just browse for fudge. You might meet Bev, who knits, has opinions, and grows far too much zucchini.
- 🗑️ **Lake cleanup day**: grab a bag at Lake Josephine on a Sunday morning and work your way around to Lake Florence. Two hours, one lawn chair, nine golf balls, and a friend working the bag next to you.
- 🚒 **Fire District #27 drill**: a Thursday night drill at the station by the old store. Roll some hose, get a little healthier, meet Rusty in an unexpected outfit, and the volunteers check your chimney on the way home.
- ⛵ **Sam’s boat project**: a $200 wooden skiff with “character.” Help scrape, sand or chip in, and be there when she (probably) floats.
- 🧢 **Walt’s grandson**: Tyler is over from Tacoma and lives on his phone. Show him the eagles, teach him the woodpile, and come to the Legion send-off.
- 💍 **The Hendersons’ fiftieth**: invitations, a cake situation, and an anniversary brunch with a fiddle.
- Friend stories unfold over the month as friendships grow, one small choice at a time. “Not now” is always an option. The island remembers, gently.

**Achievements and save slots**
- 🏆 **Achievements.** Earn 16 achievements for island milestones, such as never getting stranded, sweeping the chimney before it's a fire risk, winning at bingo, making a close friend, or surviving Ferry Hell. They're saved on your device and carry over to every new game and save slot. See them in ⚙️ Settings → 🏆 Achievements, where locked ones tell you how to earn them. The end screen lists any you earned that game.
- 💾 **Three save slots.** Keep up to three games going at once. On the title screen, tap 💾 Save slots to continue, start a new game in, or delete each slot. While you play, ⚙️ Settings → 💾 Save slot lets you switch slots, and your current week is saved first. Your existing save is now slot 1, so nothing is lost.
- Continue, Start a new week, Exit and transfer codes all use your current slot.

**Reliability**
- Loading a save made by a newer version of Island Time (on this device, or from a pasted transfer code) now loads everything it can and shows a one-time warning naming both versions, so you know to update the game before you lose anything.
- Added an automated test suite (Playwright, Chromium) that checks the title screen, new week and month games, every tab, save and reload, upgrading old saves, the priorities list, house upkeep, the end-of-week screen, the newer-save warning, and a 1,500-step robot playthrough. It runs on every push and pull request.

### 1.10.1 fixes
- **Resting has diminishing returns:** the first hour of rest in a day takes −8 stress, then −5, −3, and −1 after that, so you can't sit at home and grind stress to zero.
- **Mice leave your last day of food alone**, so they can't send you to bed hungry.
- **Small phones with extra-large text:** the stat bar wraps into two rows instead of pushing the Home tile off-screen.

### New in 1.10: your house
- **🏠 Home meter** (0–100, next to Job): it slips every day, more on workdays, in busy weeks, and after storms and outages. Below 35 you sleep worse, the house breaks down more, and friends visit less. At 75+ you rest better, wake to cozy mornings, and earn up to +180 points at the end.
- **Inside the house** (fold-out at home): daily chores (dishes, laundry, sweeping up cedar needles, making the bed) that pile up when skipped; a deep clean on your day off; fridge cleanout after an outage; wiping condensation to stop **black mold**; woodstove ash, chimney sweeping (or a **chimney fire** and a visit from Fire District #27) and splitting firewood; mouse traps from Home Depot; and septic pump-outs.
- **Outside & property:** clear the gutters (or the crawlspace floods in heavy rain), trim the limbs over the roof yourself (risky) or hire a tree crew, service the well pump (fewer "no water" mornings), treat roof moss (or the roof leaks), fill driveway potholes (or get flat tires), service the generator (or it may not start in an outage), and order propane.
- **Contractors ride the ferry:** the septic truck, tree crew and propane truck come over the next day, and get stuck on the mainland when the ferry is down.
- Outdoor work is daylight-only (7 AM–5 PM). The To-do tab lists whatever needs attention.

### New in 1.9
- **My priorities** (📋 To-do tab): your own editable, ordered list under "This week". Add anything, tap 📌 on a weekly task to pin it, reorder with ▲▼, edit ✏️, delete 🗑️, and tap an item to check it off. Saved with your game.

### 1.8.1 fixes
- **Month mode is survivable:** waiting for boats is less stressful, days off actually restore you, burnout costs less, and after week 1 the ankle injury is an occasional mishap instead of a near-certainty every week.
- **Stuck at the terminal:** tapping "Drive on" after the last boat now shows a clear "No more boats tonight" pop-up instead of silently adding stress each time.
- Event tiles show the day and time; the planner notes when your car is on the other side; the Monday tip isn't shown twice.

Score is based on cash, health, job standing and stress, with bonuses and penalties. Grades run from *Born & Raised Islander* down to *Moving Back to the Mainland*.

![Trading](screenshots/trading.png)

## Saves

- Progress saves automatically in your browser or app.
- **Compatible across versions in both directions:** saves from 1.1, 1.2 and 1.3 upgrade automatically, and newer saves still load in older copies.
- **🔁 Transfer a saved game** on the title screen gives you a code to move your week between the web, phone and Windows versions.

## What's real and what isn't

The **ferry schedule, prices and characters (including Dale) are made up**. These things are real as of mid-2026:
- The Anderson Island General Store, the island's only grocery and gas station, closed Feb 2, 2026. A food co-op hopes to reopen it in 2027.
- Pierce County ferry policy prohibits gasoline cans, full or empty, citing 49 CFR 176.76 and RCW 9.91.025. It allows limited diesel (two 5-gal DOT containers per vehicle), propane, and outboard tanks on trailered boats.
- Fuel tankers cross on dedicated runs where only essential personnel may ride.

Smuggling gasoline onto a passenger ferry is illegal and a genuine fire hazard. Check [Pierce County's ferry schedule](https://www.piercecountywa.gov/8922) and [ferry FAQs](https://www.piercecountywa.gov/7406/Ferry-FAQs) for real sailings and rules.

Sources: [Pierce County hazardous liquids policy](https://www.piercecountywa.gov/DocumentCenter/View/154831/100103-Prohibited-Hazardous-Liquids-Aboard-Ferries) · [Anderson Island store closure resources](https://www.anderson-island.org/storeclosure.php) · [KNKX on the store closing](https://www.knkx.org/business/2026-02-10/anderson-island-grocery-store-gas-station-closes)

## Project layout

```
src/                    the game's source: edit here
  shell.html            page skeleton (placeholders for styles and code)
  style.css             all styles
  js/00-data.js …       the code, in load order: data, core/settings, ferry engine,
  js/10-endings.js      events framework, house, island events, day cycle, location
                        actions, saves, UI (Next up, tips, planner, priorities), endings
index.html              the whole game as one file, built from src/ (commit it: GitHub Pages serves it)
tools/build.py          builds index.html from src/  (--check: fail if out of date)
tests/                  Playwright test suite: npm test  (runs on every push)
sw.js, manifest.webmanifest, icons/   installable offline web app (PWA)
fonts/                  Fraunces heading font + its license (SIL OFL 1.1)
offline/IslandTime-offline.html       single-file offline build (generated)
tools/build-offline.py  regenerates the offline file from index.html
windows/                Windows installer source (Go) + build.sh
screenshots/
```

**After editing the game (in `src/`):**
1. Run `python3 tools/build.py` to rebuild `index.html`, then `python3 tools/build-offline.py` to refresh the offline file.
2. Run the tests: `npm test` (or `node tests/run.js` with Playwright installed).
3. Bump `VERSION` in `sw.js` so installed apps update, and `APP_VERSION` in `src/js/01-core.js`.
4. If the save format changes, bump `SAVE_SCHEMA` and add a step to `migrate()` (in `src/js/08-save.js`).

Don't edit `index.html` directly: the next build overwrites it, and the Tests workflow fails if it doesn't match `src/`.

**Windows installer:** `windows/build.sh` builds it from any OS. It needs Go 1.21+ and Python 3 with Pillow.

**Releases:** push a tag such as `git tag v1.3.2 && git push origin v1.3.2`. The [Release workflow](.github/workflows/release.yml) builds the offline file, the Windows installer and the web-app zip, then publishes them as a GitHub Release.

## Credits

Fraunces font © The Fraunces Project Authors, used under the [SIL Open Font License 1.1](fonts/Fraunces-OFL.txt). Body text uses DM Sans from Google Fonts when online, otherwise your system font.
