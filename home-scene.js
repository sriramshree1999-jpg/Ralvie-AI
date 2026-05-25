/* ============================================================
   Ralvie AI — Home page hero 3D scene (light theme)
   A floating glassmorphic cluster: central icosahedron + torus
   + orbiting gradient spheres. Cursor parallax + soft bloom.
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function startHomeHero() {
  const host = document.getElementById('home-hero-canvas');
  if (!host) return;
  try {
    initHomeHero(host);
  } catch (err) {
    console.warn('Ralvie home hero unavailable:', err);
    host.classList.add('no-webgl');
  }
}

function initHomeHero(host) {
  let w = host.clientWidth || 480;
  let h = host.clientHeight || 480;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0.1, 5.6);
  camera.lookAt(0, 0, 0);

  // ---- environment (gives the glass nice reflections) ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const world = new THREE.Group();
  scene.add(world);

  // ---- central glass icosahedron ----
  const coreGeo = new THREE.IcosahedronGeometry(1.05, 1);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xe7e1ff,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.7,
    thickness: 0.6,
    ior: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.15,
    iridescence: 0.6,
    iridescenceIOR: 1.3,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  world.add(core);

  // soft wireframe overlay on the core to add structure
  const coreEdges = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.06, 1)),
    new THREE.LineBasicMaterial({ color: 0x9c72ff, transparent: true, opacity: 0.25 })
  );
  world.add(coreEdges);

  // ---- torus ring ----
  const torusGeo = new THREE.TorusGeometry(1.85, 0.04, 18, 220);
  const torusMat = new THREE.MeshPhysicalMaterial({
    color: 0xc6b9ff,
    metalness: 0.9,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = 1.2;
  torus.rotation.y = 0.4;
  world.add(torus);

  // a second, finer ring at a different tilt
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.015, 12, 220),
    new THREE.MeshPhysicalMaterial({ color: 0xff9fc4, metalness: 0.9, roughness: 0.2 })
  );
  ring2.rotation.x = 0.4;
  ring2.rotation.z = 0.8;
  world.add(ring2);

  // ---- orbiting gradient spheres ----
  const ORBITERS = [
    { color: 0x9c72ff, r: 2.05, tilt: new THREE.Euler(0.6, 0.2, 0.0),  speed: 0.30, phase: 0.0,        size: 0.15 },
    { color: 0xff8db5, r: 2.4,  tilt: new THREE.Euler(-0.3, 0.9, 0.4), speed: 0.22, phase: Math.PI*0.6, size: 0.18 },
    { color: 0x6f9fff, r: 1.9,  tilt: new THREE.Euler(1.1, -0.4, 0.0), speed: 0.36, phase: Math.PI*1.2, size: 0.12 },
    { color: 0xb795ff, r: 2.55, tilt: new THREE.Euler(0.2, 0.6, -0.6), speed: 0.18, phase: Math.PI*0.3, size: 0.13 },
  ];
  const orbiters = ORBITERS.map((cfg) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.size, 28, 28),
      new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.55,
        metalness: 0.4,
        roughness: 0.18,
        clearcoat: 1.0,
      })
    );
    const quat = new THREE.Quaternion().setFromEuler(cfg.tilt);
    world.add(mesh);
    return { mesh, quat, ...cfg };
  });

  // ---- ambient particles (small, drifting) ----
  const pN = w < 520 ? 320 : 700;
  const ppos = new Float32Array(pN * 3);
  for (let i = 0; i < pN; i++) {
    const r = 3 + Math.random() * 4.5;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    ppos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    ppos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    ppos[i * 3 + 2] = r * Math.cos(ph);
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({
    color: 0xc4b6ff,
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(particles);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 5, 6);
  scene.add(key);
  const violet = new THREE.PointLight(0x9c72ff, 28, 22);
  violet.position.set(-3, 2, 3);
  scene.add(violet);
  const pink = new THREE.PointLight(0xff8db5, 22, 22);
  pink.position.set(3, -2, 2);
  scene.add(pink);

  // ---- post-processing ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.6, 0.18);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- cursor parallax ----
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!REDUCE) {
    window.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left - r.width / 2) / r.width) * 2;
      ptr.ty = ((e.clientY - r.top - r.height / 2) / r.height) * 2;
    });
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
  const tmpV = new THREE.Vector3();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // parallax
    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;
    world.rotation.y = ptr.x * 0.45;
    world.rotation.x = ptr.y * 0.25;

    // gentle core motion
    core.rotation.x += dt * 0.18;
    core.rotation.y += dt * 0.22;
    coreEdges.rotation.copy(core.rotation);

    // torus spin
    torus.rotation.z += dt * 0.25;
    ring2.rotation.y -= dt * 0.35;

    // orbiters
    orbiters.forEach((o) => {
      const a = o.phase + t * o.speed;
      tmpV.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0).applyQuaternion(o.quat);
      o.mesh.position.copy(tmpV);
    });

    // particles slow drift
    particles.rotation.y += dt * 0.04;
    particles.rotation.x += dt * 0.02;

    composer.render();
  }

  function run() {
    if (!running) { running = true; clock.getDelta(); frame(); }
  }

  if (REDUCE) {
    composer.render();
  } else {
    new IntersectionObserver((en) => {
      en[0].isIntersecting ? run() : (running = false);
    }, { threshold: 0 }).observe(host);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startHomeHero);
} else {
  startHomeHero();
}
