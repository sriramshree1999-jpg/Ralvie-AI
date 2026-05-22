/* ============================================================
   Ralvie AI Frontdesk — 3D voice visuals (Three.js / WebGL)
   1) Hero  : full-bleed animated AI voice waveform field.
   2) Result: interactive voice-reactive sphere (drag to rotate).
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   HERO — full-bleed AI voice waveform background
   ============================================================ */
function startHero() {
  const host = document.getElementById('hero-canvas');
  if (!host) return;
  try {
    initHeroVoice(host);
  } catch (err) {
    console.warn('Ralvie hero scene unavailable:', err);
    host.classList.add('no-webgl');
  }
}

function initHeroVoice(host) {
  let w = host.clientWidth || window.innerWidth;
  let h = host.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);

  const world = new THREE.Group();
  world.position.y = -0.25;
  scene.add(world);

  // ---- waveform lines (the "voice") ----
  const SEG = 200;
  const SPAN = 11;
  const WAVE_CFG = [
    { y: 0.0,   z: 0.0,  amp: 1.10, op: 0.82, col: 0xc4b6ff, spd: 0.27 },
    { y: 0.62,  z: -1.3, amp: 0.70, op: 0.40, col: 0x8d86ff, spd: 0.22 },
    { y: -0.62, z: -1.3, amp: 0.70, op: 0.40, col: 0x8d86ff, spd: 0.32 },
    { y: 1.25,  z: -2.8, amp: 0.46, op: 0.20, col: 0x645efb, spd: 0.17 },
    { y: -1.25, z: -2.8, amp: 0.46, op: 0.20, col: 0x645efb, spd: 0.40 },
  ];
  const waves = WAVE_CFG.map((cfg) => {
    const pos = new Float32Array(SEG * 3);
    for (let i = 0; i < SEG; i++) {
      pos[i * 3]     = -SPAN + (i / (SEG - 1)) * SPAN * 2;
      pos[i * 3 + 1] = cfg.y;
      pos[i * 3 + 2] = cfg.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: cfg.col, transparent: true, opacity: cfg.op,
    }));
    world.add(line);
    return { cfg, line, pos };
  });

  // ---- expanding voice rings ----
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1.0, 96),
      new THREE.MeshBasicMaterial({ color: 0x8f7fff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    world.add(ring);
    rings.push({ ring, life: i / 6 });
  }

  // ---- soft central glow (voice source) ----
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x6a5cff, transparent: true, opacity: 0.16, side: THREE.BackSide })
  );
  world.add(glow);

  // ---- ambient particles ----
  const pN = w < 600 ? 700 : 1500;
  const ppos = new Float32Array(pN * 3);
  for (let i = 0; i < pN; i++) {
    ppos[i * 3]     = (Math.random() - 0.5) * 28;
    ppos[i * 3 + 1] = (Math.random() - 0.5) * 17;
    ppos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({
    color: 0x9c8fff, size: 0.04, sizeAttenuation: true,
    transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(particles);

  // ---- post-processing ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.82, 0.7, 0.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- interaction ----
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, energy: 0, tEnergy: 0 };
  if (!REDUCE) {
    window.addEventListener('pointermove', (e) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      ptr.tEnergy = 1;
    });
    window.addEventListener('pointerdown', () => { ptr.tEnergy = 1.9; });
  }

  function resize() {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  function waveY(cfg, x, t, cursorX, energy) {
    const e = 1 + energy * 0.5;
    let y = cfg.y;
    y += Math.sin(x * 0.55 + t * cfg.spd) * 0.55 * cfg.amp * e;
    y += Math.sin(x * 1.40 - t * cfg.spd * 1.25) * 0.28 * cfg.amp * e;
    y += Math.sin(x * 3.30 + t * cfg.spd * 0.70) * 0.12 * cfg.amp * e;
    const d = x - cursorX;
    y += Math.sin(t * 2.2) * 0.5 * cfg.amp * energy * Math.exp(-(d * d) / 3.2);
    return y;
  }

  const clock = new THREE.Clock();
  let running = false;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const t = clock.elapsedTime;
    clock.getDelta();

    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;
    ptr.tEnergy *= 0.96;
    ptr.energy += (ptr.tEnergy - ptr.energy) * 0.08;

    world.rotation.y = ptr.x * 0.12;
    world.rotation.x = ptr.y * 0.08;

    const cursorX = ptr.x * SPAN;
    waves.forEach((W) => {
      const p = W.pos;
      for (let i = 0; i < SEG; i++) {
        p[i * 3 + 1] = waveY(W.cfg, p[i * 3], t, cursorX, ptr.energy);
      }
      W.line.geometry.attributes.position.needsUpdate = true;
    });

    rings.forEach((R) => {
      R.life += 0.0013;
      if (R.life > 1) R.life -= 1;
      R.ring.scale.setScalar(0.3 + R.life * 6.5);
      R.ring.material.opacity = Math.sin(R.life * Math.PI) * 0.2 * (1 + ptr.energy);
    });

    glow.scale.setScalar(1 + Math.sin(t * 0.75) * 0.12 + ptr.energy * 0.35);
    particles.rotation.y += 0.0006;

    composer.render();
  }

  function run() { if (!running) { running = true; clock.getDelta(); frame(); } }

  if (REDUCE) {
    composer.render();
  } else {
    new IntersectionObserver((en) => {
      en[0].isIntersecting ? run() : (running = false);
    }, { threshold: 0 }).observe(host);
  }
}

/* ============================================================
   COVERAGE — interactive voice-reactive sphere
   ============================================================ */
function startVoice() {
  const host = document.getElementById('voice-canvas');
  if (!host) return;
  try {
    initVoiceSphere(host);
  } catch (err) {
    console.warn('Ralvie voice sphere unavailable:', err);
    host.classList.add('no-webgl');
  }
}

function initVoiceSphere(host) {
  let w = host.clientWidth || 420;
  let h = host.clientHeight || 420;
  const R = 1.05;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0.2, 5.2);
  camera.lookAt(0, 0, 0);

  const sphere = new THREE.Group();
  sphere.rotation.x = 0.3;
  scene.add(sphere);

  // central pulsing core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(R * 0.8, 2),
    new THREE.MeshStandardMaterial({
      color: 0x140f3a, emissive: 0x4b41e1, emissiveIntensity: 1.2,
      roughness: 0.35, metalness: 0.4, flatShading: true,
    })
  );
  sphere.add(core);

  // faint wire shell
  sphere.add(new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 0.86, 2)),
    new THREE.LineBasicMaterial({ color: 0x8f7fff, transparent: true, opacity: 0.16 })
  ));

  // soft inner glow
  sphere.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x6a5cff, transparent: true, opacity: 0.06, side: THREE.BackSide })
  ));

  // ---- radial voice bars over the sphere ----
  const BAR_N = w < 480 ? 440 : 760;
  const dirs = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < BAR_N; i++) {
    const y = 1 - (i / (BAR_N - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    dirs.push(new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad));
  }
  const barPos = new Float32Array(BAR_N * 6);
  const barCol = new Float32Array(BAR_N * 6);
  const cIn = new THREE.Color(0x4b41e1);
  const cOut = new THREE.Color(0xd5ccff);
  for (let i = 0; i < BAR_N; i++) {
    barCol.set([cIn.r, cIn.g, cIn.b, cOut.r, cOut.g, cOut.b], i * 6);
  }
  const barGeo = new THREE.BufferGeometry();
  barGeo.setAttribute('position', new THREE.BufferAttribute(barPos, 3));
  barGeo.setAttribute('color', new THREE.BufferAttribute(barCol, 3));
  const bars = new THREE.LineSegments(barGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.95,
  }));
  sphere.add(bars);

  function setBars(t) {
    const p = barPos;
    for (let i = 0; i < BAR_N; i++) {
      const d = dirs[i];
      const wave = Math.sin(t * 0.7 + d.y * 5.0)
                 + Math.sin(t * 0.48 - d.x * 4.0) * 0.6
                 + Math.sin(t * 0.92 + d.z * 3.0) * 0.4;
      const len = 0.06 + 0.34 * (0.5 + 0.25 * wave);
      const o = i * 6;
      p[o]     = d.x * R;         p[o + 1] = d.y * R;         p[o + 2] = d.z * R;
      p[o + 3] = d.x * (R + len); p[o + 4] = d.y * (R + len); p[o + 5] = d.z * (R + len);
    }
    barGeo.attributes.position.needsUpdate = true;
  }

  // ---- equatorial sound rings ----
  const eqRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.012, 8, 130),
      new THREE.MeshBasicMaterial({ color: 0x9c8fff, transparent: true, opacity: 0 })
    );
    ring.rotation.x = Math.PI / 2;
    sphere.add(ring);
    eqRings.push({ ring, life: i / 3 });
  }

  // lights
  scene.add(new THREE.AmbientLight(0x6b66b0, 0.8));
  const pl = new THREE.PointLight(0x9c72ff, 42, 22);
  pl.position.set(3, 2, 4);
  scene.add(pl);

  // post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.78, 0.62, 0.02);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- drag to rotate ----
  let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0;
  if (!REDUCE) {
    host.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      velY = (e.clientX - lastX) * 0.006;
      velX = (e.clientY - lastY) * 0.006;
      sphere.rotation.y += velY;
      sphere.rotation.x = THREE.MathUtils.clamp(sphere.rotation.x + velX, -0.85, 0.95);
      lastX = e.clientX; lastY = e.clientY;
    });
    const end = () => { dragging = false; };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    host.addEventListener('pointerleave', end);
  }

  function resize() {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let running = false;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const t = clock.elapsedTime;
    clock.getDelta();

    if (!dragging) {
      velY *= 0.95; velX *= 0.9;
      sphere.rotation.y += velY + 0.0006;
      sphere.rotation.x += velX;
      sphere.rotation.x += (0.3 - sphere.rotation.x) * 0.02;
    }

    setBars(t);
    core.rotation.y += 0.0011;
    core.rotation.x += 0.00045;
    core.material.emissiveIntensity = 1.0 + Math.sin(t * 0.7) * 0.4;
    core.scale.setScalar(1 + Math.sin(t * 0.7) * 0.05);

    eqRings.forEach((E) => {
      E.life += 0.0016;
      if (E.life > 1) E.life -= 1;
      E.ring.scale.setScalar(1 + E.life * 1.35);
      E.ring.material.opacity = Math.sin(E.life * Math.PI) * 0.4;
    });

    composer.render();
  }

  function run() { if (!running) { running = true; clock.getDelta(); frame(); } }

  if (REDUCE) {
    setBars(0);
    composer.render();
  } else {
    new IntersectionObserver((en) => {
      en[0].isIntersecting ? run() : (running = false);
    }, { threshold: 0.05 }).observe(host);
  }
}

/* ---------- boot ---------- */
function boot() {
  startHero();
  startVoice();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
