// Re-applies every 3D edit to a clean copy of index.html (safe string splicing, no $-patterns).
const fs = require('fs');
const S = __dirname;
const [, , src, dst] = process.argv;
let h = fs.readFileSync(src, 'utf8');
function rep(a, b) {
  const parts = h.split(a);
  if (parts.length !== 2) throw new Error('anchor count ' + (parts.length - 1) + ': ' + a.slice(0, 80));
  h = parts[0] + b + parts[1];
}
rep('#game{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair}',
  '#game{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair}\n#game3d,#gameTop{position:fixed;inset:0;width:100%;height:100%;display:none;pointer-events:none}');
rep("const ctx = cv.getContext('2d');", "let ctx = cv.getContext('2d'); // swapped to the 3D floor canvas while it is painted");
rep('  makeSprites(); makeNebula(); makeVignette(); if (path) makeTrackLayer();',
  "  makeSprites(); makeNebula(); makeVignette(); if (path) makeTrackLayer();\n  if (typeof G3 !== 'undefined' && G3.on) G3.layout();");
rep('    drawShadow(s.x, s.y, 1, 1);\n    drawPlanet(s.c, s.x, s.y, 1, time * 60, Math.atan2(s.vy, s.vx));',
  '    if (G3.on) continue; // the planet itself is a 3D sphere\n    drawShadow(s.x, s.y, 1, 1);\n    drawPlanet(s.c, s.x, s.y, 1, time * 60, Math.atan2(s.vy, s.vx));');
rep('  const hover = Math.sin(time * 2.1);\n  if (simg0) {',
  '  const hover = Math.sin(time * 2.1);\n  const g3s = G3.on && G3.shipReady(); // 3D model draws the ship; the floor keeps only the base ring\n  if (simg0 && !g3s) {');
rep('  } else {\n    ctx.save(); ctx.translate(sx + 6, sy + 9); ctx.scale(1.25, 1.25); ctx.globalAlpha = .7;',
  '  } else if (!g3s) {\n    ctx.save(); ctx.translate(sx + 6, sy + 9); ctx.scale(1.25, 1.25); ctx.globalAlpha = .7;');
rep('  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill();\n  ctx.rotate(aimA); ctx.translate(-recoil * 4, 0);',
  '  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill();\n  if (g3s) {\n    if (armed && currentSpec()) { const mm = MUZZLE - swapAnim * 12; drawSpecialOrb(currentSpec().id, Math.cos(aimA) * mm, Math.sin(aimA) * mm, 1, false); }\n    ctx.restore(); return;\n  }\n  ctx.rotate(aimA); ctx.translate(-recoil * 4, 0);');
rep('function toWorld(e) { return [(e.clientX - offX) / scale, (e.clientY - offY) / scale]; }',
  'function toWorld(e) { return G3.on && path ? G3.screenToWorld(e.clientX, e.clientY) : [(e.clientX - offX) / scale, (e.clientY - offY) / scale]; }');
rep(`  if (path) {
    if (trackLayer) ctx.drawImage(trackLayer, -TM, -TM, W + TM * 2, H + TM * 2);
    drawTrackFX();
    if (!lowQ) drawLens();
    drawHole(); drawBalls(); drawShots(); drawAim(); drawShooter(); drawBeamsAndVortex(1 / 60); drawFX(); drawBanner();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawDust(px, py);
  if (vignette) ctx.drawImage(vignette, 0, 0);
  if (whiteFlash > 0) { ctx.fillStyle = \`rgba(255,244,225,\${Math.min(.55, whiteFlash).toFixed(3)})\`; ctx.fillRect(0, 0, cv.width, cv.height); }
}`, `  const in3d = G3.on && !!path;
  if (in3d) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    G3.frame(shx, shy);
  } else {
    if (G3.on) G3.hide();
    if (path) {
      if (trackLayer) ctx.drawImage(trackLayer, -TM, -TM, W + TM * 2, H + TM * 2);
      drawTrackFX();
      if (!lowQ) drawLens();
      drawHole(); drawBalls(); drawShots(); drawAim(); drawShooter(); drawBeamsAndVortex(1 / 60); drawFX(); drawBanner();
    }
  }
  // dust, vignette and flashes sit above everything (above the 3D layer too)
  const main = ctx; if (in3d) ctx = G3.topCtx();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawDust(px, py);
  if (vignette) ctx.drawImage(vignette, 0, 0);
  if (whiteFlash > 0) { ctx.fillStyle = \`rgba(255,244,225,\${Math.min(.55, whiteFlash).toFixed(3)})\`; ctx.fillRect(0, 0, cv.width, cv.height); }
  ctx = main;
}`);
rep('  cur = (Math.random() * level.colors) | 0; nxt = (Math.random() * level.colors) | 0;\n  if (cw) makeNebula();\n}',
  '  cur = (Math.random() * level.colors) | 0; nxt = (Math.random() * level.colors) | 0;\n  if (cw) makeNebula();\n  if (!G3.ready && !G3.failed && want3d()) G3.enable(true); // 3D starts with the first level, once the art is loaded\n  if (G3.on) G3.loadShip(shipOf());\n}');
rep('balls.forEach(b => b.s += d); } }, startLevel };', 'balls.forEach(b => b.s += d); } }, startLevel, get g3() { return G3; } };');
// extra source-level edits kept in a side file (appended by later steps)
if (fs.existsSync(S + '/extra-edits.js')) require(S + '/extra-edits.js')(rep);

const g3 = fs.readFileSync(S + '/g3.js', 'utf8') + '\nfunction want3d() { try { return localStorage.getItem("yorunge-3d") !== "0"; } catch (e) { return true; } }\n\n';
rep('// ---------- loop ----------', g3 + '// ---------- loop ----------');
const lib = fs.readFileSync(S + '/t3.min.js', 'utf8');
if (lib.includes('</script')) throw new Error('lib contains </script');
const models = JSON.parse(fs.readFileSync(S + '/models.json', 'utf8')); // { id: path-to-glb }
const rot = fs.existsSync(S + '/rot.json') ? fs.readFileSync(S + '/rot.json', 'utf8') : '{}';
let data = 'window.SHIP3D_ROT=' + rot + ';window.SHIP3D={';
data += Object.entries(models).map(([id, p]) => JSON.stringify(id) + ':"data:model/gltf-binary;base64,' + fs.readFileSync(p).toString('base64') + '"').join(',');
data += '};';
const mc = '<script type="text/plain" id="mainCode">';
rep(mc, '<script id="t3lib">/* three.js r170 + GLTFLoader + RoomEnvironment (MIT License) */\n' + lib + '\n</script>\n<script id="ship3dData">' + data + '</script>\n' + mc);
fs.writeFileSync(dst, h);
console.log('written', (h.length / 1e6).toFixed(2), 'MB, models:', Object.keys(models).join(','));
