# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nandorp28/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nandorp28/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**GILDED EXCHANGE II** — crack the Crown Vault, lift the Jewels, vanish by van or helipad: 3 floors, 20 lifts, 6 guard kinds, 5 tools, laser grids, vent routes, 2 getaways.

A complete real-time top-down heist game that runs offline in a desktop browser from static files. Three floors of the Gilded Exchange (The Marble Lobby, The Gilded Gallery, The Crown Vault) in veined marble and gold inlay, each a room the thief crosses with guards sweeping vision cones, a hovering drone, wall cameras, laser tripwires, a loot target and an alarm meter — all visible in one frame. Read the cones before you move: patrolmen walk their beats, hounds smell you up close, wardens sweep wide arcs, sleuths hunt every noise, the Captain chases on any alarm, and the Drone glides its beat until an EMP stuns it. Hide in shadow pools to halve detection, crawl the vents to vanish entirely, sneak to halve it again, toss coins or wind up the decoy mouse to lure guards off their routes, smoke a cone, EMP a camera or a laser grid, lockpick a door. Loot earns tool charges — steal to stay equipped. Clear a floor without being spotted and the crew banks a $2,500 unseen bonus. At 100% alarm the vault locks down and every guard hunts. Synthesized WebAudio throughout — a walking bass line, a chime for every lift, a zap for every laser, a siren as the alarm climbs.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

WASD / arrows to move, Shift to sneak, click to toss a coin, Q smoke bomb, R EMP pulse, T decoy mouse, E (hold) lockpick, Space to start, P to pause, R to restart.

## Layout

- `game/index.html` — the page; one canvas, one module script
- `game/src/main.js` — game loop + state machine (title / play / caught / win / game over)
- `game/src/config.js` — tuning, palette, tool and guard-kind definitions
- `game/src/levels.js` — the 3 floor maps, patrol routes, laser grids, vents, line-of-sight
- `game/src/guards.js` — guard AI: patrol, suspicion, chase, investigate, drone stun
- `game/src/cameras.js` — camera sweeps and alarm detection
- `game/src/lasers.js` — laser tripwires and the alarm they raise
- `game/src/vents.js` — vent crawling: slow, unseen, under the lasers
- `game/src/player.js` — movement, sneaking, vent crawling, loot pickup, getaways
- `game/src/tools.js` — smoke, EMP, coin toss, decoy mouse, lockpick
- `game/src/render.js` — canvas renderer: the bank, the cones, the lasers, the HUD, the screens
- `game/src/shots.js` — staged peak moments for the screenshots (?shot=peak/vent/alarm/win)
- `game/src/audio.js` — synthesized WebAudio (no audio files)
- `game/src/input.js` — keyboard + mouse
- `main.ts` — the hand-in program: copies game/ + screenshots/ to /output, writes dossier.json
- `serve.ts` — tiny static server for local play-testing

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
