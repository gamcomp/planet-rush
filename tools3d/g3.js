// ---------- 3D play field (three.js) ----------
// The game logic stays 2D (world x,y). The 3D layer lays that world on a tilted floor:
// world (x, y) -> 3D (x, height, y). Track, hole and effects are painted into a texture on the floor;
// planets, shots and the ship are real 3D objects above it.
const G3 = (() => {
  const T = window.T3;
  const api = { on: false, failed: !T };
  if (!T) return api;
  const TILT = 32 * Math.PI / 180, FOV = 30, BALL_Y = R;
  const SHIP_ROT = window.SHIP3D_ROT || {};
  let renderer = null, scene, camera, glc, topc, topx, wcv, wctx, wtex, floor, shadowFloor, sun;
  let ballGeo, ballMats = [], inst = [], shotMeshes = [], curBall, nxtBall, shipRoot, bankG, shipHolder, engineGlow, engineLight;
  let wk = 1, vis = false, shipId = null, shipLen = 1, shipTail = -40, loadingId = null;
  const shipCache = {};
  const ray = new T.Raycaster(), ndc = new T.Vector2(), aimPlane = new T.Plane(new T.Vector3(0, 1, 0), -BALL_Y), hitV = new T.Vector3();
  const m4 = new T.Matrix4(), q = new T.Quaternion(), v3 = new T.Vector3(), sc3 = new T.Vector3(), ax = new T.Vector3(), pv = new T.Vector3();

  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  // Planet maps for the 3D balls: the art textures (lava, gas giant, forest, ocean, storm, ice), graded
  // darker and more saturated so the colours stay apart on a busy track. Rebuilt once the art has loaded.
  function gradedPlanetCanvas(ci) {
    const src = makePlanetTex(ci, 512 / (4 * R)); // two copies side by side; keep one
    const w = src.width / 2, h = src.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0, w, h, 0, 0, w, h);
    const SAT = [1.25, 1.3, 1.35, 1.3, 1.3, 1.0][ci] || 1.25, GAM = [1.15, 1.2, 1.25, 1.2, 1.2, 1.45][ci] || 1.2;
    try {
      const id = g.getImageData(0, 0, w, h), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], gg = d[i + 1], b = d[i + 2];
        const l = r * .299 + gg * .587 + b * .114;
        r = l + (r - l) * SAT; gg = l + (gg - l) * SAT; b = l + (b - l) * SAT;
        d[i] = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, GAM);
        d[i + 1] = 255 * Math.pow(Math.max(0, Math.min(255, gg)) / 255, GAM);
        d[i + 2] = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, GAM);
      }
      g.putImageData(id, 0, 0);
    } catch (e) {}
    return c;
  }
  const texHasArt = [];
  function setBallTexture(mat, ci) {
    if (mat.map) mat.map.dispose();
    const tex = new T.CanvasTexture(gradedPlanetCanvas(ci));
    tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.RepeatWrapping; tex.anisotropy = 4;
    mat.map = tex;
    const lava = ci === 0;
    mat.emissive.setHex(lava ? 0xffffff : 0x000000); mat.emissiveMap = lava ? tex : null; mat.emissiveIntensity = lava ? 0.3 : 0;
    mat.needsUpdate = true;
    texHasArt[ci] = !!IMG['tex' + ci];
  }

  // ---- level scenery: 3D rail walls, a real gravity well, deep-space planets and stars ----
  let levelFor = null, trackG, wellG, wellTex, decorG, starPts, lowShadow, basePos = null, decorSpots = [];
  function stripGeo(pts, y0, y1) {
    const pos = [], idx = [];
    pts.forEach(([x, z]) => { pos.push(x, y0, z, x, y1, z); });
    for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function ribbonGeo(L, Rr, y) {
    const pos = [], idx = [];
    for (let i = 0; i < L.length; i++) pos.push(L[i][0], y, L[i][1], Rr[i][0], y, Rr[i][1]);
    for (let i = 0; i < L.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function clearGroup(g) { while (g.children.length) { const c = g.children.pop(); if (c.geometry) c.geometry.dispose(); } }
  const wallMat = () => new T.MeshStandardMaterial({ color: 0x1a2036, metalness: 0.75, roughness: 0.38, side: T.DoubleSide, envMapIntensity: 0.9 });
  function buildTrack3d() {
    clearGroup(trackG);
    const half = (D + 10) / 2 + 1.5, L = [], Rr = [];
    for (let i = 0; i < path.n; i += 4) {
      const j = Math.min(i, path.n - 2), a = Math.atan2(path.y[j + 1] - path.y[j], path.x[j + 1] - path.x[j]);
      const nx = -Math.sin(a), nz = Math.cos(a), x = path.x[i], z = path.y[i];
      L.push([x + nx * half, z + nz * half]); Rr.push([x - nx * half, z - nz * half]);
    }
    const wm = wallMat(), glow = new T.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
    for (const side of [L, Rr]) {
      const w = new T.Mesh(stripGeo(side, -1, -15), wm); w.castShadow = true; w.renderOrder = -3; trackG.add(w);
      const e = new T.Mesh(stripGeo(side, -2.5, -4.2), glow); e.renderOrder = -3; trackG.add(e);
    }
    // invisible slab between the walls: it only casts the rail's shadow down into space
    const cap = new T.Mesh(ribbonGeo(L, Rr, -2), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    cap.castShadow = true; trackG.add(cap);
  }
  function wellTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    for (let y = 0; y < 256; y++) {
      const t = y / 255; // 0 = rim, 1 = deep
      const col = t < .35 ? [255, 170 - t * 200, 80] : t < .7 ? [190 - (t - .35) * 300, 60, 200] : [40 * (1 - t), 10, 60 * (1 - t)];
      g.fillStyle = `rgba(${col.map(Math.round).join(',')},${(1 - t * .55).toFixed(3)})`; g.fillRect(0, y, 256, 1);
    }
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 40; i++) { // spiral dark lanes
      const x = Math.random() * 256; g.strokeStyle = `rgba(0,0,0,${(.25 + Math.random() * .4).toFixed(2)})`; g.lineWidth = 4 + Math.random() * 10;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 40, 90, x + 80, 170, x + 140, 256); g.stroke();
      g.beginPath(); g.moveTo(x - 256, 0); g.bezierCurveTo(x - 216, 90, x - 176, 170, x - 116, 256); g.stroke();
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping; return t;
  }
  function buildWell() {
    clearGroup(wellG);
    if (!wellTex) wellTex = wellTexture();
    const cone = new T.Mesh(new T.CylinderGeometry(46, 3, 170, 64, 8, true),
      new T.MeshBasicMaterial({ map: wellTex, side: T.BackSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    cone.position.set(hole[0], -86, hole[1]); cone.renderOrder = -3; wellG.add(cone);
    const dark = new T.Mesh(new T.CylinderGeometry(40, 2, 150, 48, 1, true), new T.MeshBasicMaterial({ color: 0x000000, side: T.BackSide, transparent: true, opacity: .55, depthWrite: false }));
    dark.position.set(hole[0], -95, hole[1]); dark.renderOrder = -4; wellG.add(dark);
  }
  function decorTexture(ci, hue, br = .55) {
    const src = IMG['tex' + ci]; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#20243a'; g.fillRect(0, 0, 512, 256);
    // muted and hue-shifted so a backdrop planet never reads as a ball colour
    if (src) { g.filter = `hue-rotate(${hue}deg) saturate(.45) brightness(${br})`; g.drawImage(src, 0, 0, 512, 256); g.filter = 'none'; }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function buildDecor() {
    clearGroup(decorG); decorSpots = [];
    const SPOTS = [[.1, .88, .86, .2], [.88, .17, .16, .74], [.9, .86, .12, .2], [.12, .14, .86, .78], [.88, .9, .14, .16]];
    const sp = SPOTS[levelIdx % SPOTS.length], gi = [1, 4, 3, 1, 4][levelIdx % 5];
    const giant = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ map: decorTexture(gi, (150 + levelIdx * 53) % 360), roughness: .8, metalness: 0 }));
    giant.rotation.z = .25; decorG.add(giant);
    if (levelIdx % 2) {
      const rg = new T.RingGeometry(1.35, 2.15, 96), rc = document.createElement('canvas'); rc.width = 256; rc.height = 4;
      const g = rc.getContext('2d'); for (let x = 0; x < 256; x++) { const a = (.25 + .35 * Math.abs(Math.sin(x * .19)) * (x % 23 < 3 ? .2 : 1)) * (1 - Math.abs(x - 128) / 160); g.fillStyle = `rgba(210,200,255,${a.toFixed(3)})`; g.fillRect(x, 0, 1, 4); }
      const rt = new T.CanvasTexture(rc); rt.colorSpace = T.SRGBColorSpace;
      // map the stripe radially: RingGeometry uv.x runs across, so use the radial distance instead
      const uv = rg.attributes.uv, p = rg.attributes.position;
      for (let i = 0; i < uv.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - 1.35) / .8, .5); }
      const ring = new T.Mesh(rg, new T.MeshStandardMaterial({ map: rt, transparent: true, side: T.DoubleSide, depthWrite: false, roughness: .9 }));
      ring.rotation.x = -Math.PI / 2 + .45; ring.rotation.y = .3; giant.add(ring);
    }
    const moon = new T.Mesh(new T.SphereGeometry(1, 32, 24), new T.MeshStandardMaterial({ map: decorTexture(5, 200, .33), roughness: .95, metalness: 0 }));
    decorG.add(moon);
    decorSpots = [[giant, sp[0], sp[1], 135, -520], [moon, sp[2], sp[3], 38, -380]];
    placeDecor();
  }
  function placeDecor() {
    for (const [m, fx, fy, r, depth] of decorSpots) {
      ndc.set(fx * 2 - 1, -(fy * 2 - 1)); ray.setFromCamera(ndc, camera);
      const pl = new T.Plane(new T.Vector3(0, 1, 0), -depth);
      if (ray.ray.intersectPlane(pl, hitV)) { m.position.copy(hitV); m.scale.setScalar(r); }
    }
  }
  function buildStars() {
    const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -700 + Math.random() * (W + 1400); pos[i * 3 + 1] = -150 - Math.random() * 1500; pos[i * 3 + 2] = -1100 + Math.random() * (H + 1600);
      const w = .55 + Math.random() * .45; col[i * 3] = w; col[i * 3 + 1] = w; col[i * 3 + 2] = Math.min(1, w + .15);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    starPts = new T.Points(g, new T.PointsMaterial({ size: 2.2, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .85, depthWrite: false, map: glowTexture(), blending: T.AdditiveBlending }));
    starPts.renderOrder = -5; scene.add(starPts);
  }
  function rebuildLevel() {
    levelFor = path;
    buildTrack3d(); buildWell(); buildDecor();
    const tint = (WORLD_TINT[(level && level.w || 0) % WORLD_TINT.length] || '200,200,255').split(',').map(v => +v / 255);
    starPts.material.color.setRGB(.6 + tint[0] * .4, .6 + tint[1] * .4, .6 + tint[2] * .4);
  }
  api.debugScene = () => ({ track: trackG && trackG.children.length, well: wellG && wellG.children.length, decor: decorSpots.length, art: texHasArt.slice() });

  function init() {
    glc = document.createElement('canvas'); glc.id = 'game3d'; glc.setAttribute('aria-hidden', 'true');
    topc = document.createElement('canvas'); topc.id = 'gameTop'; topc.setAttribute('aria-hidden', 'true');
    cv.after(glc); glc.after(topc);
    try {
      renderer = new T.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { glc.remove(); topc.remove(); api.failed = true; return false; }
    topx = topc.getContext('2d');
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
    camera = new T.PerspectiveCamera(FOV, 1, 10, 6000);

    scene.add(new T.HemisphereLight(0xc8d4ff, 0x1a1430, 0.55));
    sun = new T.DirectionalLight(0xfff2e0, 2.4);
    sun.position.set(W / 2 - 420, 760, H / 2 - 520); sun.target.position.set(W / 2, 0, H / 2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008;
    Object.assign(sun.shadow.camera, { left: -W * 0.85, right: W * 0.85, top: H * 0.8, bottom: -H * 0.8, near: 100, far: 2400 });
    scene.add(sun, sun.target);
    const rim = new T.DirectionalLight(0x7f9dff, 0.9); rim.position.set(W / 2 + 500, 300, H / 2 + 600); scene.add(rim);

    // floor: the 2D world painted into a texture
    wcv = document.createElement('canvas'); wctx = wcv.getContext('2d');
    wtex = new T.CanvasTexture(wcv); wtex.colorSpace = T.SRGBColorSpace; wtex.anisotropy = 4;
    floor = new T.Mesh(new T.PlaneGeometry(W + TM * 2, H + TM * 2),
      new T.MeshBasicMaterial({ map: wtex, transparent: true, depthWrite: false, toneMapped: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, H / 2); floor.renderOrder = -2;
    scene.add(floor);
    shadowFloor = new T.Mesh(new T.PlaneGeometry(W + TM * 2, H + TM * 2), new T.ShadowMaterial({ opacity: 0.5 }));
    shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.set(W / 2, 0.3, H / 2); shadowFloor.receiveShadow = true; shadowFloor.renderOrder = -1;
    scene.add(shadowFloor);
    // a second, deep shadow catcher: the rail and planets throw their shadow down into space
    lowShadow = new T.Mesh(new T.PlaneGeometry(W * 4, H * 4), new T.ShadowMaterial({ opacity: 0.38 }));
    lowShadow.rotation.x = -Math.PI / 2; lowShadow.position.set(W / 2, -60, H / 2); lowShadow.receiveShadow = true; lowShadow.renderOrder = -4;
    scene.add(lowShadow);
    trackG = new T.Group(); wellG = new T.Group(); decorG = new T.Group(); scene.add(trackG, wellG, decorG);
    buildStars();

    // planets: one instanced mesh per colour, textured with the game's own planet maps
    ballGeo = new T.SphereGeometry(R, 32, 20);
    PAL.forEach((p, ci) => {
      // not tone-mapped: keep deep, saturated colours; only the lava world glows a little
      const mat = new T.MeshStandardMaterial({ roughness: 0.55, metalness: 0.0, envMapIntensity: 0.12, toneMapped: false });
      setBallTexture(mat, ci);
      ballMats.push(mat);
      const im = new T.InstancedMesh(ballGeo, mat, 512); im.count = 0; im.castShadow = true; im.frustumCulled = false;
      inst.push(im); scene.add(im);
    });
    curBall = new T.Mesh(ballGeo, ballMats[0]); curBall.castShadow = true; scene.add(curBall);
    nxtBall = new T.Mesh(ballGeo, ballMats[0]); nxtBall.castShadow = true; scene.add(nxtBall);

    // ship rig: root (position + aim) -> bank -> holder (normalised model)
    shipRoot = new T.Group(); bankG = new T.Group(); shipHolder = new T.Group();
    shipRoot.add(bankG); bankG.add(shipHolder); scene.add(shipRoot);
    engineGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    engineGlow.scale.set(30, 30, 1); bankG.add(engineGlow);
    engineLight = new T.PointLight(0xff9a50, 2.5, 140, 1.6); bankG.add(engineLight);
    api.ready = true;
    return true;
  }

  // Bring any model into the ship frame: nose along +X, wings flat, length = 1, pivot at the sprite's cx
  // The generated models come out standing up (the art is a top view read as a side view):
  // lay them flat, put the long axis on X, then apply the per-ship turn found by calibration
  // ([flip about the nose axis, half-turns about the vertical]; every ship so far needs [0, 1]).
  function normaliseShip(obj, SH) {
    const b0 = new T.Box3().setFromObject(obj).getSize(new T.Vector3());
    if (b0.y > Math.min(b0.x, b0.z)) { if (b0.x >= b0.z) obj.rotation.x = Math.PI / 2; else obj.rotation.z = Math.PI / 2; }
    obj.updateMatrixWorld(true);
    const b1 = new T.Box3().setFromObject(obj).getSize(new T.Vector3());
    if (b1.z > b1.x) obj.rotation.y = Math.PI / 2;
    const r = SHIP_ROT[SH.id] || [0, 1];
    const turn = new T.Group(); turn.add(obj);
    turn.rotation.order = 'YXZ'; turn.rotation.set(r[0] * Math.PI, r[1] * Math.PI, 0);
    turn.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(turn), size = box.getSize(new T.Vector3());
    const wrap = new T.Group(); wrap.add(turn);
    const len = size.x || 1;
    turn.position.set(-(box.min.x + SH.cx * len), -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
    wrap.scale.setScalar(1 / len);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) o.material.envMapIntensity = 1.1; } });
    return { node: wrap, tail: -SH.cx };
  }
  api.normaliseShip = normaliseShip;
  function b64ToBuf(dataUri) {
    const s = atob(dataUri.slice(dataUri.indexOf(',') + 1)), u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }
  api.loadShip = function (SH) {
    if (shipCache[SH.id]) return Promise.resolve(shipCache[SH.id]);
    const src = window.SHIP3D && window.SHIP3D[SH.id];
    if (!src) return Promise.resolve(null);
    return new Promise(res => {
      new T.GLTFLoader().parse(b64ToBuf(src), '', g => { const n = normaliseShip(g.scene, SH); shipCache[SH.id] = n; res(n); }, () => res(null));
    });
  };
  api.shipModel = SH => shipCache[SH.id] || null;
  function useShip(SH) {
    if (shipId === SH.id) return !!shipCache[SH.id];
    const c = shipCache[SH.id];
    if (!c) { if (loadingId !== SH.id) { loadingId = SH.id; api.loadShip(SH).then(() => { loadingId = null; }); } return false; }
    while (shipHolder.children.length) shipHolder.remove(shipHolder.children[0]);
    shipHolder.add(c.node.clone()); shipId = SH.id; shipTail = c.tail;
    return true;
  }
  api.shipReady = () => api.on && !!(shipCache[shipOf().id]) && (shipId === shipOf().id || useShip(shipOf()));

  // ---- camera framing: fit the tilted floor into the same box the 2D field used ----
  function project(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x + 1) / 2 * cw, (1 - v3.y) / 2 * ch]; }
  api.layout = function () {
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(dpr, 2)); renderer.setSize(cw, ch, false);
    topc.width = Math.round(cw * dpr); topc.height = Math.round(ch * dpr);
    camera.aspect = cw / ch; camera.clearViewOffset();
    const bw = W * scale, bh = H * scale, cx = W / 2, cz = H / 2;
    const corners = [[0, 0], [W, 0], [0, H], [W, H]];
    let lo = 200, hi = 8000, bb = null;
    for (let it = 0; it < 40; it++) {
      const d = (lo + hi) / 2;
      camera.position.set(cx, Math.cos(TILT) * d, cz + Math.sin(TILT) * d); camera.lookAt(cx, 0, cz); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, z] of corners) { const p = project(x, 0, z); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      bb = [x0, x1, y0, y1];
      if (x1 - x0 > bw || y1 - y0 > bh) lo = d; else hi = d;
    }
    // shift the picture so the floor sits where the 2D field would have been
    const dx = (offX + bw / 2) - (bb[0] + bb[1]) / 2, dy = (offY + bh / 2) - (bb[2] + bb[3]) / 2;
    camera.setViewOffset(cw, ch, -dx, -dy, cw, ch); camera.updateProjectionMatrix();
    camera.updateMatrixWorld(); basePos = camera.position.clone();
    if (decorSpots.length) placeDecor();
    wk = Math.max(1, Math.min(lowQ ? 1.25 : 2, scale * dpr));
    wcv.width = Math.round((W + TM * 2) * wk); wcv.height = Math.round((H + TM * 2) * wk);
    wtex.dispose(); wtex.image = wcv; wtex.needsUpdate = true;
  };
  api.debugProject = (x, h, y) => project(x, h, y); // test hooks: world point -> CSS pixels
  api.debugBall = i => { const b = balls[Math.min(balls.length - 1, i)]; if (!b) return null; const p = ballPos(b); return { world: p.map(Math.round), screen: project(p[0], BALL_Y, p[1]).map(Math.round) }; };
  api.screenToWorld = function (clientX, clientY) {
    ndc.set(clientX / cw * 2 - 1, -(clientY / ch) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(aimPlane, hitV)) return [(clientX - offX) / scale, (clientY - offY) / scale];
    return [hitV.x, hitV.z];
  };

  function setVisible(v) { if (v === vis) return; vis = v; glc.style.display = topc.style.display = v ? 'block' : 'none'; }
  api.hide = () => setVisible(false);
  api.topCtx = () => topx;

  function placeBall(im, i, x, y, h, s, roll, ang) {
    const dx = Math.cos(ang), dz = Math.sin(ang);
    ax.set(dz, 0, -dx); q.setFromAxisAngle(ax, roll / R);
    v3.set(x, h, y); sc3.set(s, s, s); m4.compose(v3, q, sc3); im.setMatrixAt(i, m4);
  }
  function setSingle(mesh, c, x, y, h, s, roll, ang) {
    mesh.visible = true; mesh.material = ballMats[c];
    const dx = Math.cos(ang), dz = Math.sin(ang);
    ax.set(dz, 0, -dx); mesh.quaternion.setFromAxisAngle(ax, roll / R);
    mesh.position.set(x, h, y); mesh.scale.setScalar(s);
  }

  // black-backed art (drawn with 'lighter' over the dark 2D field) needs real alpha on the transparent floor
  const keyed = new Map();
  function keyBlack(img) {
    if (keyed.has(img)) return keyed.get(img);
    const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    try {
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const a = Math.max(d[i], d[i + 1], d[i + 2]);
        if (a === 0) { d[i + 3] = 0; continue; }
        d[i] = d[i] * 255 / a; d[i + 1] = d[i + 1] * 255 / a; d[i + 2] = d[i + 2] * 255 / a; d[i + 3] = a * d[i + 3] / 255;
      }
      g.putImageData(id, 0, 0);
    } catch (e) { keyed.set(img, img); return img; }
    keyed.set(img, c); return c;
  }
  // paint the 2D world (minus planets and ship) onto the floor texture
  function paintWorld() {
    const bh0 = IMG.bh; if (bh0) IMG.bh = keyBlack(bh0);
    const main = ctx; ctx = wctx;
    wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.clearRect(0, 0, wcv.width, wcv.height);
    wctx.setTransform(wk, 0, 0, wk, TM * wk, TM * wk);
    if (trackLayer) ctx.drawImage(trackLayer, -TM, -TM, W + TM * 2, H + TM * 2);
    drawTrackFX(); drawHole(); drawShots(); drawAim(); drawShooter(); drawBeamsAndVortex(1 / 60); drawFX();
    ctx = main; if (bh0) IMG.bh = bh0;
    wtex.needsUpdate = true;
  }

  api.frame = function (shx, shy) {
    if (!renderer) return;
    setVisible(true);
    if (levelFor !== path) rebuildLevel();
    for (let ci = 0; ci < ballMats.length; ci++) if (!texHasArt[ci] && IMG['tex' + ci]) setBallTexture(ballMats[ci], ci);
    if (wellTex) wellTex.offset.x = (time * .09) % 1, wellTex.offset.y = -(time * .25) % 1;
    decorG.children.forEach((m, i) => { m.rotation.y = time * (i ? .05 : .02); });
    paintWorld();
    // planets on the track
    const counts = inst.map(() => 0);
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]; if (b.s + b.off < -R) continue;
      const p = ballPos(b), sv = b.s + b.off, [s] = ballLook(b), c = b.c;
      if (counts[c] >= 512) continue;
      placeBall(inst[c], counts[c]++, p[0], p[1], BALL_Y * s, s, sv + i * 7, tanAt(sv));
    }
    inst.forEach((im, c) => { im.count = counts[c]; im.instanceMatrix.needsUpdate = true; });
    // flying shots
    let si = 0;
    for (const s of shots) {
      if (s.special) continue;
      let m = shotMeshes[si];
      if (!m) { m = new T.Mesh(ballGeo, ballMats[0]); m.castShadow = true; scene.add(m); shotMeshes.push(m); }
      setSingle(m, s.c, s.x, s.y, BALL_Y, 1, time * 60, Math.atan2(s.vy, s.vx)); si++;
    }
    for (; si < shotMeshes.length; si++) shotMeshes[si].visible = false;
    // ship
    const SH = shipOf(), ok = api.shipReady();
    shipRoot.visible = ok; curBall.visible = nxtBall.visible = false;
    if (ok) {
      const len = shipW(SH, IMG[SH.key] || { width: 1, height: 1 }), hover = Math.sin(time * 2.1);
      shipRoot.position.set(sx - Math.cos(aimA) * recoil * 4, BALL_Y + 4 + hover * 1.6, sy - Math.sin(aimA) * recoil * 4);
      shipRoot.rotation.set(0, -aimA, 0);
      bankG.rotation.set(-shipFx.bank * 0.9, 0, 0);
      shipHolder.scale.setScalar(len * (1 + hover * .012));
      const tailX = shipTail * len - 4;
      engineGlow.position.set(tailX, 0, 0);
      const fl = .8 + .2 * Math.sin(time * 37) + recoil * .6;
      engineGlow.scale.set(26 * fl, 26 * fl, 1);
      engineGlow.material.color.setRGB(...SH.flame.split(',').map(v => +v / 255));
      engineLight.position.set(tailX - 6, 2, 0); engineLight.color.copy(engineGlow.material.color); engineLight.intensity = 2 + recoil * 3;
      // planet in the socket and the one at the muzzle
      setSingle(nxtBall, nxt, sx, sy, BALL_Y + 4 + 11 + hover * 1.6, SH.socket * (1 + swapAnim * .4), time * 6, 0);
      if (!(armed && currentSpec())) {
        const mm = MUZZLE - swapAnim * 12;
        setSingle(curBall, cur, sx + Math.cos(aimA) * mm, sy + Math.sin(aimA) * mm, BALL_Y, 1, time * 6, aimA);
      }
    }
    // a slow drift of the camera gives the deep layers parallax (aiming reads the live camera, so it stays exact)
    if (basePos) {
      const sw = reduceMotion ? 0 : 1;
      camera.position.set(basePos.x + (Math.sin(time * .23) * 7 + shx * .6) * sw, basePos.y, basePos.z + (Math.cos(time * .19) * 5 + shy * .6) * sw);
      camera.updateMatrixWorld();
    }
    renderer.render(scene, camera);
    // power-up marks stay readable on top of the 3D planets
    topx.setTransform(1, 0, 0, 1, 0, 0); topx.clearRect(0, 0, topc.width, topc.height);
    const main = ctx; ctx = topx;
    for (const b of balls) {
      if (!b.sp || b.s + b.off < -R) continue;
      const [s] = ballLook(b); if (s <= .8) continue;
      const p = ballPos(b), a = project(p[0], BALL_Y * 2, p[1]), e = project(p[0] + 10, BALL_Y * 2, p[1]);
      const k = (e[0] - a[0]) / 10 * dpr;
      topx.setTransform(k, 0, 0, k, a[0] * dpr - p[0] * k, a[1] * dpr - p[1] * k);
      drawPowerMark(b.sp, p[0], p[1]);
    }
    // the level banner floats above the planets: map world -> screen with the floor's local affine
    const o = project(W / 2, 0, H / 2), ex = project(W / 2 + 10, 0, H / 2), ey = project(W / 2, 0, H / 2 + 10);
    const a = (ex[0] - o[0]) / 10 * dpr, b = (ex[1] - o[1]) / 10 * dpr, c = (ey[0] - o[0]) / 10 * dpr, d = (ey[1] - o[1]) / 10 * dpr;
    topx.setTransform(a, b, c, d, o[0] * dpr - a * W / 2 - c * H / 2, o[1] * dpr - b * W / 2 - d * H / 2);
    drawBanner();
    topx.setTransform(1, 0, 0, 1, 0, 0);
    ctx = main;
  };
  // ---- hangar: the selected ship's real model on the platform (own renderer on its own canvas) ----
  const HGR = { r: null, scene: null, cam: null, holder: null, spin: null, glow: null, light: null, sh: null, open: true, swapT: 1, t0: performance.now() };
  function hangarInit() {
    if (HGR.r) return true;
    const pad = $('scPad'); if (!pad) return false;
    const c = document.createElement('canvas'); c.className = 'scGL'; c.id = 'scGL3'; c.setAttribute('aria-hidden', 'true');
    pad.appendChild(c);
    try { HGR.r = new T.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); } catch (e) { c.remove(); return false; }
    const r = HGR.r; r.setClearColor(0, 0); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    const s = HGR.scene = new T.Scene();
    s.environment = new T.PMREMGenerator(r).fromScene(new T.RoomEnvironment(), 0.04).texture;
    s.add(new T.HemisphereLight(0xcfd8ff, 0x1a1430, 0.6));
    const key = new T.DirectionalLight(0xfff2e0, 2.6); key.position.set(-1.2, 3, -1); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 1.2, bottom: -1.2, near: .1, far: 8 }); key.shadow.bias = -0.002;
    s.add(key); const rim = new T.DirectionalLight(0x7f9dff, 1.2); rim.position.set(1.5, 1, 2); s.add(rim);
    const floorS = new T.Mesh(new T.CircleGeometry(1.4, 48), new T.ShadowMaterial({ opacity: 0.45 }));
    floorS.rotation.x = -Math.PI / 2; floorS.receiveShadow = true; s.add(floorS);
    HGR.spin = new T.Group(); HGR.holder = new T.Group(); HGR.spin.add(HGR.holder); s.add(HGR.spin);
    HGR.glow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    HGR.spin.add(HGR.glow);
    HGR.light = new T.PointLight(0xff9a50, 1.5, 2, 1.5); HGR.spin.add(HGR.light);
    HGR.cam = new T.PerspectiveCamera(32, 1, .05, 20);
    return true;
  }
  api.hangarSet = function (sh, open, animate) {
    if (!want3d() || !(window.SHIP3D && window.SHIP3D[sh.id]) || !hangarInit()) return false;
    HGR.sh = sh; HGR.open = open; if (animate && !reduceMotion) HGR.swapT = 0;
    api.loadShip(sh).then(n => {
      if (!n || HGR.sh !== sh) return;
      while (HGR.holder.children.length) HGR.holder.remove(HGR.holder.children[0]);
      const m = n.node.clone(); HGR.holder.add(m);
      HGR.tail = n.tail;
    });
    $('scGL').style.display = 'none'; $('scGL3').style.display = '';
    return true;
  };
  api.hangarOff = function () { if (HGR.r) { $('scGL3').style.display = 'none'; $('scGL').style.display = ''; } HGR.sh = null; };
  api.hangarActive = () => !!(HGR.r && HGR.sh);
  api.hangarDraw = function (yawDeg) {
    const c = $('scGL3'), pad = $('scPad'); if (!c || !HGR.sh) return;
    const Wp = pad.clientWidth, Hp = pad.clientHeight, dp = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(Wp * dp) || c.height !== Math.round(Hp * dp)) { HGR.r.setPixelRatio(dp); HGR.r.setSize(Wp, Hp, false); }
    const t = (performance.now() - HGR.t0) / 1000;
    if (HGR.swapT < 1) HGR.swapT = Math.min(1, HGR.swapT + 1 / 36);
    const k = HGR.swapT, eb = k >= 1 ? 1 : 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
    const lift = (reduceMotion ? .26 : .27 - .04 * Math.cos(t * TAU / 3)) + (1 - eb) * .6;
    HGR.spin.position.y = lift; HGR.spin.rotation.y = -yawDeg * Math.PI / 180;
    HGR.holder.scale.setScalar(.95 * (.4 + .6 * eb));
    const fl = (HGR.sh.flame || '255,150,70').split(',').map(v => +v / 255);
    HGR.glow.visible = HGR.light.visible = HGR.open;
    HGR.glow.position.set((HGR.tail || -.4) * .95 - .05, 0, 0);
    const f = .85 + .15 * Math.sin(t * 37); HGR.glow.scale.set(.32 * f, .32 * f, 1);
    HGR.glow.material.color.setRGB(fl[0], fl[1], fl[2]); HGR.light.color.setRGB(fl[0], fl[1], fl[2]); HGR.light.position.copy(HGR.glow.position);
    HGR.r.toneMappingExposure = HGR.open ? 1.1 : 0.12; // locked ships show as dark silhouettes
    const cam = HGR.cam; cam.aspect = Wp / Hp;
    const dist = Math.max(2.6, 2.2 / Math.min(1, cam.aspect));
    cam.position.set(0, Math.sin(.95) * dist, Math.cos(.95) * dist); cam.lookAt(0, .18, 0);
    cam.setViewOffset(Wp, Hp, 0, -Hp * .08, Wp, Hp); cam.updateProjectionMatrix();
    HGR.r.render(HGR.scene, cam);
  };
  api.enable = function (v) {
    if (v && !renderer && !init()) { api.on = false; return false; }
    api.on = !!v && !!renderer;
    if (!api.on && glc) setVisible(false);
    if (api.on) { api.layout(); useShip(shipOf()); }
    try { localStorage.setItem('yorunge-3d', api.on ? '1' : '0'); } catch (e) {}
    return api.on;
  };
  return api;
})();
