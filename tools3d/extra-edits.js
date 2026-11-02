// hangar: prefer the real 3D model when there is one; settings: 3D on/off
module.exports = rep => {
  rep(`function build3dShip(sh, open, animate) {
  if (hgSetShip(sh, open, animate)) {`, `function build3dShip(sh, open, animate) {
  if (G3.hangarSet(sh, open, animate)) { $('scPad').classList.add('gl'); $('scShip3d').innerHTML = ''; return; }
  G3.hangarOff();
  if (hgSetShip(sh, open, animate)) {`);
  rep(`  if (HG.ok) hgDraw(yaw);
  requestAnimationFrame(spin3d);`, `  if (G3.hangarActive()) G3.hangarDraw(yaw); else if (HG.ok) hgDraw(yaw);
  requestAnimationFrame(spin3d);`);
  rep(`<label class="setRow"><span><strong>Titreşim</strong></span><input type="checkbox" class="sw" id="setVib"></label>`,
    `<label class="setRow"><span><strong>Titreşim</strong></span><input type="checkbox" class="sw" id="setVib"></label>
      <label class="setRow"><span><strong>3D görünüm</strong></span><input type="checkbox" class="sw" id="set3d"></label>`);
  rep(`$('setVib').addEventListener('change', e => {`,
    `$('set3d').addEventListener('change', e => {
  try { localStorage.setItem('yorunge-3d', e.target.checked ? '1' : '0'); } catch (err) {}
  if (e.target.checked) { if (!G3.enable(true)) e.target.checked = false; } else G3.enable(false);
});
$('setVib').addEventListener('change', e => {`);
  rep(`$('setSound').checked = !muted; $('setVib').checked = vibOn;`,
    `$('setSound').checked = !muted; $('setVib').checked = vibOn; $('set3d').checked = want3d() && !G3.failed; $('set3d').disabled = !!G3.failed;`);
  rep(`"Titreşim": [`, `"3D görünüm": ["3D view", "3D-Ansicht", "Vue 3D", "Vista 3D", "Vista 3D", "Visualização 3D", "3D-вид", "عرض ثلاثي الأبعاد", "3D表示", "3D 보기", "3D 视图", "3D दृश्य", "Tampilan 3D", "Widok 3D"], "Titreşim": [`);
};
// in 3D the far planets are real spheres below the rail, so the painted ones step aside
const prev = module.exports;
module.exports = rep => { prev(rep); rep('  if (farLayer) ctx.drawImage(farLayer, ', '  if (farLayer && !(G3.on && path)) ctx.drawImage(farLayer, '); };
// ---- audio: one mixer with a limiter (no clipping when sounds stack), voice ducking, gapless music loops ----
const prevAudio = module.exports;
module.exports = rep => {
  prevAudio(rep);
  rep('function ensureAudio() {', `// mixer: every sound goes to its bus -> master -> limiter -> speakers
let AB = null;
function audioBus(kind) {
  if (!AB) {
    const lim = actx.createDynamicsCompressor();
    lim.threshold.value = -12; lim.knee.value = 8; lim.ratio.value = 12; lim.attack.value = .002; lim.release.value = .18;
    const master = actx.createGain(); master.gain.value = .92; master.connect(lim); lim.connect(actx.destination);
    const mk = v => { const g = actx.createGain(); g.gain.value = v; g.connect(master); return g; };
    AB = { master, sfx: mk(.78), voice: mk(1), music: mk(.85) };
  }
  return AB[kind];
}
// the announcer briefly pulls music and effects down so the words come through clearly
function duck(sec) {
  if (!AB) return; const t = actx.currentTime;
  AB.music.gain.cancelScheduledValues(t); AB.sfx.gain.cancelScheduledValues(t);
  AB.music.gain.setTargetAtTime(.38, t, .04); AB.sfx.gain.setTargetAtTime(.5, t, .04);
  AB.music.gain.setTargetAtTime(.85, t + sec, .25); AB.sfx.gain.setTargetAtTime(.78, t + sec, .2);
}
// decoded MP3s carry encoder silence at both ends; loop only the real audio so the seam is inaudible
function loopPoints(buf) {
  const d = buf.getChannelData(0), th = 1e-3; let s = 0, e = d.length - 1;
  while (s < d.length && Math.abs(d[s]) < th) s++;
  while (e > s && Math.abs(d[e]) < th) e--;
  return [s / buf.sampleRate, (e + 1) / buf.sampleRate];
}
function ensureAudio() {`);
  rep('  src.connect(g).connect(actx.destination); src.start();\n  return true;',
    "  src.connect(g).connect(audioBus(k.startsWith('v_') ? 'voice' : 'sfx')); src.start();\n  return true;");
  rep('  o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + .02);', "  o.connect(g).connect(audioBus('sfx')); o.start(t0); o.stop(t0 + dur + .02);");
  rep('  src.connect(bp).connect(g).connect(actx.destination); src.start(t0); src.stop(t0 + dur + .02);', "  src.connect(bp).connect(g).connect(audioBus('sfx')); src.start(t0); src.stop(t0 + dur + .02);");
  rep('  musicBus.connect(lp); lp.connect(actx.destination); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(actx.destination);',
    "  const mb = audioBus('music'); musicBus.connect(lp); lp.connect(mb); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(mb);");
  rep('      src.connect(g).connect(actx.destination); src.start(); musTracks[k] = g;',
    "      const [ls, le] = loopPoints(src.buffer); src.loopStart = ls; src.loopEnd = le;\n      src.connect(g).connect(audioBus('music')); src.start(0, ls); musTracks[k] = g;");
  rep('  const go = () => { const t = performance.now(); if (t - lastVoice < 650) return; if (play(k, .95)) lastVoice = t; };',
    '  const go = () => { const t = performance.now(); if (t - lastVoice < 650) return; if (play(k, .95)) { lastVoice = t; duck(SBUF[k].duration + .15); } };');
};
