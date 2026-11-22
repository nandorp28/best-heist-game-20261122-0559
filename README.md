# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nandorp28/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nandorp28/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**GILDED EXCHANGE** — crack the vault, lift the Crown Jewels, vanish in the getaway van: 3 floors, 6 vaults of loot, 5 guard kinds, 4 tools, 2 getaways.

A complete real-time top-down heist game that runs offline in a desktop browser from static files. Three floors of the Gilded Exchange (The Marble Lobby, The Gilded Gallery, The Crown Vault), each a room the thief crosses with guards sweeping vision cones, wall cameras, a loot target and an alarm meter — all visible in one frame. Read the cones before you move: patrolmen walk their beats, hounds smell you up close, wardens sweep wide arcs, sleuths hunt every noise, and the Captain chases on any alarm. Hide in shadow pools to halve detection, sneak to halve it again, toss coins to lure guards off their routes, smoke a cone, EMP a camera, lockpick a door. Loot earns tool charges — steal to stay equipped. At 100% alarm the vault locks down and every guard hunts. Synthesized WebAudio throughout — a walking bass line, a chime for every lift, a siren as the alarm climbs.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

WASD / arrows to move, Shift to sneak, click to toss a coin, Q smoke bomb, R EMP pulse, E (hold) lockpick, Space to start, P to pause, R to restart.

## Layout

- `game/index.html` — the page; one canvas, one module script
- `game/src/main.js` — game loop + state machine (title / play / caught / win / game over)
- `game/src/config.js` — tuning, palette, tool and guard-kind definitions
- `game/src/levels.js` — the 3 floor maps, patrol routes, line-of-sight
- `game/src/guards.js` — guard AI: patrol, suspicion, chase, investigate
- `game/src/cameras.js` — camera sweeps and alarm detection
- `game/src/player.js` — movement, collision, loot pickup, getaway
- `game/src/tools.js` — smoke, EMP, coin toss, lockpick
- `game/src/render.js` — canvas renderer: the bank, the cones, the HUD, the screens
- `game/src/shots.js` — staged peak moments for the screenshots (?shot=peak/shadow/alarm/win)
- `game/src/audio.js` — synthesized WebAudio (no audio files)
- `game/src/input.js` — keyboard + mouse
- `main.ts` — the hand-in program: copies game/ + screenshots/ to /output, writes dossier.json
- `serve.ts` — tiny static server for local play-testing

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
