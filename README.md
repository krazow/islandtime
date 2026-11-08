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
index.html              the whole game (HTML/CSS/JS, no dependencies)
sw.js, manifest.webmanifest, icons/   installable offline web app (PWA)
fonts/                  Fraunces heading font + its license (SIL OFL 1.1)
offline/IslandTime-offline.html       single-file offline build (generated)
tools/build-offline.py  regenerates the offline file from index.html
windows/                Windows installer source (Go) + build.sh
screenshots/
```

**After editing `index.html`:**
1. Run `python3 tools/build-offline.py` to refresh the offline file.
2. Bump `VERSION` in `sw.js` so installed apps update.
3. Bump `APP_VERSION` in `index.html`.
4. If the save format changes, bump `SAVE_SCHEMA` and add a step to `migrate()`.

**Windows installer:** `windows/build.sh` builds it from any OS. It needs Go 1.21+ and Python 3 with Pillow.

**Releases:** push a tag such as `git tag v1.3.2 && git push origin v1.3.2`. The [Release workflow](.github/workflows/release.yml) builds the offline file, the Windows installer and the web-app zip, then publishes them as a GitHub Release.

## Credits

Fraunces font © The Fraunces Project Authors, used under the [SIL Open Font License 1.1](fonts/Fraunces-OFL.txt). Body text uses DM Sans from Google Fonts when online, otherwise your system font.
