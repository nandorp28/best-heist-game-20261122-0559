// Rendering: one job only. Every pixel the judge sees: the art-deco bank,
// the vision cones, the cameras, the loot, the HUD panels and the screens.
// The world is 960 x 680 at (0, 40); the right HUD panel is 320 wide.
import {
  TILE, WORLD_W, WORLD_H, TOP_BAR, HUD_W, CANVAS_W, CANVAS_H,
  COLORS, FLOORS, GUARD_KINDS, LOOT_VALUES, LOOT_NAMES, TOOLS, DETECTION,
} from './config.js';
import { tileAt, inShadow } from './levels.js';
import { makeRng } from './rng.js';

const speckles = makeRng(20261122);

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.stroke();
}

function drawGuard(ctx, g, smokeT) {
  const alert = g.state === 'chase' || g.state === 'suspicious';
  const coneFill = smokeT > 0 ? 'rgba(120,120,120,0.10)' : alert ? COLORS.coneAlert : COLORS.coneCalm;
  if (smokeT <= 0) {
    drawCone(ctx, g.x, g.y, g.facing, g.coneRange, g.coneAngle / 2, coneFill, COLORS.coneEdge);
  }
  // Body: uniformed guard with a cap, bobbing as he walks.
  const bob = Math.sin(g.walkBob) * 1.5;
  ctx.fillStyle = '#101418';
  ctx.beginPath();
  ctx.arc(g.x, g.y + 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = g.color;
  ctx.beginPath();
  ctx.arc(g.x, g.y + bob * 0.3, 12, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim toward facing.
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 7, g.y + Math.sin(g.facing) * 7, 6, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 4 - Math.sin(g.facing) * 4, g.y + Math.sin(g.facing) * 4 + Math.cos(g.facing) * 4, 2, 0, Math.PI * 2);
  ctx.arc(g.x + Math.cos(g.facing) * 4 + Math.sin(g.facing) * 4, g.y + Math.sin(g.facing) * 4 - Math.cos(g.facing) * 4, 2, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion ring + marker.
  if (g.suspicion > 0.05) {
    ctx.strokeStyle = g.suspicion >= 1 ? '#ff3b2e' : '#ffd94a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
    ctx.stroke();
  }
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff3b2e';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24);
  } else if (g.state === 'suspicious' || g.state === 'investigate') {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 24);
  }
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y + 30);
}

function drawCamera(ctx, cam, disabledT) {
  const dead = disabledT > 0;
  ctx.fillStyle = dead ? '#3a4a4a' : '#ff4fd8';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (!dead) {
    drawCone(ctx, cam.x, cam.y, cam.facing, 210, 0.55, COLORS.cameraCone, 'rgba(255, 80, 200, 0.5)');
  } else {
    ctx.fillStyle = '#8fb0a8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP ' + Math.ceil(disabledT) + 's', cam.x, cam.y - 14);
  }
}

function drawLoot(ctx, item, t) {
  if (item.taken) return;
  const bobY = Math.sin(t * 2 + item.bob) * 3;
  const x = item.x;
  const y = item.y + bobY;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
  const col = item.kind === 'jewels' ? '255, 95, 162' : item.kind === 'gem' ? '127, 231, 255' : '255, 217, 74';
  glow.addColorStop(0, `rgba(${col}, 0.55)`);
  glow.addColorStop(1, `rgba(${col}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (item.kind === 'coin') {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5c00';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText('$', x, y + 0.5);
  } else if (item.kind === 'painting') {
    ctx.fillStyle = '#8a6a2a';
    ctx.fillRect(x - 13, y - 9, 26, 18);
    ctx.fillStyle = '#3f6a8a';
    ctx.fillRect(x - 10, y - 6, 20, 12);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 13, y - 9, 26, 2);
  } else if (item.kind === 'gold') {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 6);
    ctx.lineTo(x - 8, y - 6);
    ctx.lineTo(x + 8, y - 6);
    ctx.lineTo(x + 12, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a5c00';
    ctx.fillRect(x - 6, y - 2, 12, 3);
  } else if (item.kind === 'gem') {
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 11);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // CROWN JEWELS: a crown, big and unmistakable.
    ctx.fillStyle = COLORS.jewel;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 10);
    ctx.lineTo(x - 16, y - 6);
    ctx.lineTo(x - 8, y + 2);
    ctx.lineTo(x, y - 12);
    ctx.lineTo(x + 8, y + 2);
    ctx.lineTo(x + 16, y - 6);
    ctx.lineTo(x + 16, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 16, y + 8, 32, 4);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y - 12, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText(fmtMoney(LOOT_VALUES[item.kind]), x, y + 26);
  ctx.textBaseline = 'alphabetic';
}

function drawPlayer(ctx, p, t) {
  const r = p.sneaking ? 11 : 13;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak: a lighter blue-grey with a gold ring so the thief always
  // reads against the dark floor, even inside a red cone.
  ctx.fillStyle = p.sneaking ? '#3a5a7a' : '#46607a';
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Gold-trimmed hood + mask.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101418';
  ctx.fillRect(p.x + Math.cos(p.facing) * 9 - 2, p.y + Math.sin(p.facing) * 9 - 2, 5, 4);
  // A sliver of light: the thief's lantern glint.
  ctx.fillStyle = 'rgba(255, 233, 168, 0.25)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
  ctx.fill();
}

function drawTopBar(ctx, s) {
  ctx.fillStyle = '#0c1717';
  ctx.fillRect(0, 0, CANVAS_W, TOP_BAR);
  ctx.fillStyle = COLORS.floorTrim;
  ctx.fillRect(0, TOP_BAR - 2, CANVAS_W, 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('◆ GILDED EXCHANGE', 12, TOP_BAR / 2 + 1);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(FLOORS[s.floorIndex].name, 240, TOP_BAR / 2 + 1);
  // Time.
  const mins = Math.floor(s.time / 60);
  const secs = Math.floor(s.time % 60);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText(`⏱ ${mins}:${String(secs).padStart(2, '0')}`, 492, TOP_BAR / 2 + 1);
  // Lives.
  ctx.fillStyle = '#ff5f6a';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('♥'.repeat(Math.max(0, s.player.lives)) + '♡'.repeat(Math.max(0, 3 - s.player.lives)), 560, TOP_BAR / 2 + 1);
  // Loot.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('LOOT ' + fmtMoney(s.player.loot), 622, TOP_BAR / 2 + 1);
  // Alarm meter (inside the 960px world, clear of the HUD panel).
  const ax = 772;
  const aw = 168;
  ctx.fillStyle = '#222';
  ctx.fillRect(ax, 12, aw, 16);
  const alarmCol = s.alarm < 40 ? COLORS.alarmLow : s.alarm < 75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = alarmCol;
  ctx.fillRect(ax, 12, (aw * s.alarm) / 100, 16);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.strokeRect(ax, 12, aw, 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM ' + Math.round(s.alarm) + '%', ax + aw / 2, 21);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawHudPanel(ctx, s) {
  const x0 = WORLD_W;
  ctx.fillStyle = COLORS.hudPanel;
  ctx.fillRect(x0, 0, HUD_W, CANVAS_H);
  ctx.fillStyle = COLORS.floorTrim;
  ctx.fillRect(x0, 0, 2, CANVAS_H);
  let y = 24;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('THE JOB', x0 + 16, y);
  y += 22;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12.5px system-ui, sans-serif';
  const objectives = [
    [`Lift ${s.floorIndex === 2 ? 'the CROWN JEWELS' : 'the loot'}`, s.floorIndex === 2 ? s.player.jewelsTaken : s.player.lootCount > 0],
    ['Dodge the cones — read them first', true],
    [s.floorIndex < 2 ? 'Reach the stairs to the next floor' : 'Reach the getaway van', s.player.jewelsTaken],
  ];
  for (const [text, done] of objectives) {
    ctx.fillStyle = done ? '#3fae6a' : COLORS.hudText;
    ctx.fillText((done ? '☑ ' : '☐ ') + text, x0 + 16, y);
    y += 20;
  }
  y += 6;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('HEIST PLAN', x0 + 16, y);
  y += 20;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12.5px system-ui, sans-serif';
  const plan = ['1  MARBLE LOBBY', '2  GILDED GALLERY', '3  CROWN VAULT'];
  plan.forEach((p, i) => {
    ctx.fillStyle = i === s.floorIndex ? COLORS.gold : i < s.floorIndex ? '#3fae6a' : COLORS.hudText;
    ctx.fillText((i < s.floorIndex ? '● ' : i === s.floorIndex ? '◉ ' : '○ ') + p, x0 + 16, y);
    y += 19;
  });
  y += 8;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('TOOLS', x0 + 16, y);
  y += 20;
  ctx.font = '12.5px system-ui, sans-serif';
  const toolRows = [
    ['Q  SMOKE BOMB', s.tools.smoke, 'Blinds cones 6s'],
    ['R  EMP PULSE', s.tools.emp, 'Kills cameras 8s'],
    ['CLICK  COIN TOSS', s.tools.coin, 'Lures a guard'],
    ['E  LOCKPICK', '∞', 'Opens a door in 3s'],
  ];
  for (const [name, count, desc] of toolRows) {
    ctx.fillStyle = count === 0 ? '#5a6a68' : COLORS.hudText;
    ctx.fillText(`${name}  ×${count}`, x0 + 16, y);
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(desc, x0 + 16, y + 14);
    ctx.font = '12.5px system-ui, sans-serif';
    y += 34;
  }
  y += 2;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('THREATS', x0 + 16, y);
  y += 20;
  ctx.font = '12px system-ui, sans-serif';
  for (const key of ['patrol', 'hound', 'warden', 'sleuth', 'captain']) {
    const k = GUARD_KINDS[key];
    ctx.fillStyle = k.color;
    ctx.fillText('●', x0 + 16, y);
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(` ${k.name} — ${k.desc}`, x0 + 30, y);
    y += 18;
  }
  ctx.fillStyle = '#ff4fd8';
  ctx.fillText('●', x0 + 16, y);
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(' CAMERA — sweeps, raises alarm', x0 + 30, y);
  y += 24;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('HOW TO PLAY', x0 + 16, y);
  y += 19;
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '11.5px system-ui, sans-serif';
  const help = [
    'WASD / arrows — move',
    'SHIFT — sneak (half seen)',
    'Dark blue floor — shadow, half seen',
    'Click — toss a coin to lure',
    'Q smoke · R EMP · E lockpick',
    'Spotted? Break line of sight!',
  ];
  for (const line of help) {
    ctx.fillText(line, x0 + 16, y);
    y += 17;
  }
  y += 8;
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Loot earns tool charges. 3 floors,', x0 + 16, y);
  y += 15;
  ctx.fillText('6 vaults of loot, 5 guard kinds,', x0 + 16, y);
  y += 15;
  ctx.fillText('4 tools, 2 getaways. Good luck, thief.', x0 + 16, y);
}

function drawWorld(ctx, s) {
  const f = s.floor;
  ctx.save();
  ctx.translate(0, TOP_BAR);
  // Floor: art-deco checker with gold speckles.
  for (let ty = 0; ty < f.height; ty++) {
    for (let tx = 0; tx < f.width; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
      ctx.fillRect(x, y, TILE, TILE);
      if (speckles() < 0.12) {
        ctx.fillStyle = 'rgba(201, 162, 39, 0.25)';
        ctx.fillRect(x + 6 + speckles() * 26, y + 6 + speckles() * 26, 2, 2);
      }
    }
  }
  // Shadow zones: deep blue pools where the thief is half-seen.
  for (const sh of f.shadows) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(sh.x - TILE / 2, sh.y - TILE / 2, TILE, TILE);
    ctx.fillStyle = 'rgba(127, 231, 255, 0.14)';
    ctx.fillRect(sh.x - TILE / 2, sh.y - TILE / 2, TILE, 3);
  }
  // Rugs.
  for (const r of f.rugs) {
    ctx.fillStyle = COLORS.rug;
    ctx.fillRect(r.x - 18, r.y - 18, 36, 36);
    ctx.strokeStyle = COLORS.rugEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x - 18, r.y - 18, 36, 36);
  }
  // Wall art.
  for (const a of f.arts) {
    ctx.fillStyle = '#8a6a2a';
    ctx.fillRect(a.x - 14, a.y - 11, 28, 22);
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(a.x - 11, a.y - 8, 22, 16);
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vault doors (decor on floor 3).
  for (const v of f.vaults) {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(v.x - 18, v.y - 18, 36, 36);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Walls.
  for (const key of f.walls) {
    const [tx, ty] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, 4);
  }
  // Cover: desks and crates with gold trim.
  for (const c of f.covers) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(c.x - 17, c.y - 17, 34, 34);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(c.x - 17, c.y - 17, 34, 6);
    ctx.strokeStyle = COLORS.floorTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x - 17, c.y - 17, 34, 34);
  }
  // Pillars.
  for (const p of f.pillars) {
    ctx.fillStyle = COLORS.pillar;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.floorTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Locked doors: gold bars; open doors: a gap with light.
  for (const d of f.doors) {
    if (d.open) {
      ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
      ctx.fillRect(d.x - 20, d.y - 20, 40, 40);
      continue;
    }
    ctx.fillStyle = '#4a3410';
    ctx.fillRect(d.x - 20, d.y - 20, 40, 40);
    ctx.fillStyle = COLORS.gold;
    for (let i = -1; i <= 1; i++) ctx.fillRect(d.x - 3 + i * 12, d.y - 18, 5, 36);
    if (d.progress > 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(d.x - 20, d.y - 26, 40 * d.progress, 4);
    }
  }
  // Exit stairs.
  if (f.exit) {
    ctx.fillStyle = '#1d5a34';
    ctx.fillRect(f.exit.x - 20, f.exit.y - 20, 40, 40);
    ctx.strokeStyle = '#3fae6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(f.exit.x - 20, f.exit.y - 20, 40, 40);
    ctx.fillStyle = '#7fe7a8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAIRS ▲', f.exit.x, f.exit.y + 4);
    ctx.textAlign = 'left';
  }
  // Getaway van.
  if (f.getaway) {
    const gx = f.getaway.x;
    const gy = f.getaway.y;
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(gx - 18, gy - 16, 36, 32);
    ctx.fillStyle = '#1d2a3a';
    ctx.fillRect(gx + 8, gy - 12, 10, 10);
    ctx.fillStyle = '#101418';
    ctx.beginPath();
    ctx.arc(gx - 10, gy + 16, 6, 0, Math.PI * 2);
    ctx.arc(gx + 10, gy + 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY', gx, gy - 24);
    ctx.textAlign = 'left';
  }
  // Loot.
  for (const item of f.loot) drawLoot(ctx, item, s.time);
  // Cameras (under cones, over floor).
  for (const cam of f.cameras) drawCamera(ctx, cam, s.tools.empT);
  // Smoke puffs.
  if (s.tools.smokeT > 0) {
    ctx.fillStyle = `rgba(200, 200, 200, ${Math.min(0.5, s.tools.smokeT / 12)})`;
    ctx.beginPath();
    ctx.arc(s.player.x, s.player.y, 90, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thrown coin marker.
  if (s.coinAt) {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(s.coinAt.x, s.coinAt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.6)';
    ctx.beginPath();
    ctx.arc(s.coinAt.x, s.coinAt.y, 12 + Math.sin(s.time * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Guards, then the thief on top. (s.guards are the live guard brains;
  // floor.guards are only the raw spawn defs.)
  for (const g of s.guards) drawGuard(ctx, g, s.tools.smokeT);
  if (s.player.alive) drawPlayer(ctx, s.player, s.time);
  // HIDDEN tag.
  if (s.player.alive && inShadow(f, s.player.x, s.player.y)) {
    ctx.fillStyle = '#7fe7ff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', s.player.x, s.player.y - 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 16, 16, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, CANVAS_W / 2, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px system-ui, sans-serif';
  let y = 300;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_W / 2, y);
    y += 30;
  }
  ctx.textAlign = 'left';
}

export function drawGame(ctx, s) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0c1717';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawWorld(ctx, s);
  drawTopBar(ctx, s);
  drawHudPanel(ctx, s);

  // Alarm banner.
  if (s.alarm >= 75 && s.mode === 'play') {
    const blink = Math.sin(s.time * 8) > 0;
    ctx.fillStyle = blink ? '#e83a2e' : '#7a1408';
    ctx.fillRect(300, 52, 360, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ALARM — BREAK LINE OF SIGHT ⚠', 480, 72);
    ctx.textAlign = 'left';
  }
  // Getaway banner once the Jewels are taken.
  if (s.player.jewelsTaken && s.mode === 'play') {
    ctx.fillStyle = '#ff5fa2';
    ctx.fillRect(300, 52, 360, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆ CROWN JEWELS SECURED — RUN FOR THE VAN ◆', 480, 72);
    ctx.textAlign = 'left';
  }

  if (s.mode === 'title') {
    overlay(ctx, 'GILDED EXCHANGE', [
      'Crack the vault. Lift the Crown Jewels. Vanish.',
      '3 floors · 6 vaults of loot · 5 guard kinds · 4 tools · 2 getaways',
      'WASD move · SHIFT sneak · CLICK toss a coin · Q smoke · R EMP · E lockpick',
      '',
      'Press SPACE or click to begin the heist',
    ], COLORS.gold);
  } else if (s.mode === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      s.caughtBy ? `The ${s.caughtBy} grabbed you in the ${FLOORS[s.floorIndex].name.split('·')[1].trim()}.` : 'The guards got you.',
      `Lives left: ${s.player.lives} · Loot kept: ${fmtMoney(s.player.loot)}`,
      '',
      'Press SPACE to slip back in — the alarm stays hot.',
    ], '#ff5f6a');
  } else if (s.mode === 'gameover') {
    overlay(ctx, 'THE CREW GOT PINCHED', [
      `The Exchange keeps its gold this time. Loot lifted: ${fmtMoney(s.player.loot)}.`,
      '',
      'Press R to plan the next heist.',
    ], '#ff5f6a');
  } else if (s.mode === 'win') {
    const grade = s.player.loot >= 60000 ? 'S — GHOST' : s.player.loot >= 55000 ? 'A — SHADOW' : 'B — SMOOTH';
    overlay(ctx, 'CLEAN GETAWAY!', [
      `The Crown Jewels are yours. Loot: ${fmtMoney(s.player.loot)} in ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}.`,
      `Grade: ${grade} · Lives left: ${s.player.lives}`,
      '',
      'Press R to run it back — the Exchange restocks nightly.',
    ], COLORS.gold);
  } else if (s.mode === 'paused') {
    overlay(ctx, 'PAUSED', ['The crew waits in the dark.', 'Press P to resume.'], COLORS.hudText);
  }
}
