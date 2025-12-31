import * as THREE from "three";
import { makeScene } from "./scene.js";
import { makeUI } from "./ui.js";
import { applyTrailWindow, disposeTrail, pushPoint } from "./trails.js";
import { clickToAirPoint, spawnOneAt, MAX_PARTICLES } from "./spawn.js";
import { SYSTEMS, SYSTEMS_BY_ID } from "./systems.js";

const { scene, camera, renderer, controls } = makeScene();
const raycaster = new THREE.Raycaster();

const particles = [];
const uiCtl = makeUI({ systems: SYSTEMS });

let tick = 0;

function updateCount() {
  uiCtl.ui.countText.textContent = `Particles: ${particles.length} / ${MAX_PARTICLES}`;
}

function updateHudCamera() {
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);
  uiCtl.ui.camText.textContent =
    `x: ${camPos.x.toFixed(2)} y: ${camPos.y.toFixed(2)} z: ${camPos.z.toFixed(2)}`;

  const t = controls.target;
  uiCtl.ui.targetText.textContent =
    `x: ${t.x.toFixed(2)} y: ${t.y.toFixed(2)} z: ${t.z.toFixed(2)}`;
}

function fitCameraToParticles(fitOffset = 1.25) {
  const box = new THREE.Box3().makeEmpty();
  const v = new THREE.Vector3();

  for (const p of particles) {
    const arr = p.geometry?.attributes?.position?.array;
    if (!arr) continue;

    // p.count is the number of points currently written in your trail
    const max = Math.max(0, (p.count ?? 0) * 3);
    for (let i = 0; i < max; i += 3) {
      v.set(arr[i], arr[i + 1], arr[i + 2]);
      box.expandByPoint(v);
    }
  }

  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);
  controls.update();

  const maxSize = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  let distance = (maxSize / 2) / Math.tan(fov / 2);
  distance *= fitOffset;

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  camera.position.copy(center).addScaledVector(dir, -distance);

  camera.near = Math.max(0.01, distance / 1000);
  camera.far = Math.max(2000, distance * 10);
  camera.updateProjectionMatrix();
}

uiCtl.ui.zoomIn.addEventListener("click", () => {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  camera.position.addScaledVector(forward, 10.0);
  controls.update();
});

uiCtl.ui.clear.addEventListener("click", () => {
  for (const p of particles) disposeTrail({ scene }, p);
  particles.length = 0;
  updateCount();
  uiCtl.clearSelection();
});

const fitBtn = document.getElementById("fit");
if (fitBtn) fitBtn.addEventListener("click", () => fitCameraToParticles(1.35)); // [web:495]

// Spawn on scene click (capture so OrbitControls can't swallow it)
renderer.domElement.addEventListener(
  "pointerdown",
  (ev) => {
    if (ev.target instanceof Element && ev.target.closest("#hud")) return;
    if (uiCtl.armedSpawnCount == null) return;

    ev.preventDefault();
    ev.stopPropagation();

    const base = clickToAirPoint({ THREE, raycaster, camera }, ev);
    if (!base) return;

    const sys = SYSTEMS_BY_ID[uiCtl.activeSystemId];
    if (!sys) return;

    const remaining = MAX_PARTICLES - particles.length;
    const n = Math.min(uiCtl.armedSpawnCount, remaining);

    const { dotSize } = uiCtl.read();
    for (let i = 0; i < n; i++) {
      const ok = spawnOneAt({ THREE, scene, particles }, base.clone(), dotSize, sys);
      if (!ok) break;
    }

    uiCtl.clearSelection();
    updateCount();
  },
  { capture: true }
);

updateCount();

function frame() {
  requestAnimationFrame(frame);
  tick++;

  const { speed, trail, dotSize } = uiCtl.read();
  const activeSystemId = uiCtl.activeSystemId;
  const activeParams = uiCtl.readParams(); // per-parameter sliders for selected system

  controls.update();
  updateHudCamera();

  if (!uiCtl.paused) {
    const flowDtBase = 0.006;

    // Your slider now goes to 200; these scalings keep it controllable.
    const flowSteps = Math.max(1, Math.floor(speed / 5));
    const mapIters = Math.max(1, Math.floor(speed / 4));

    for (const p of particles) {
      const sys = SYSTEMS_BY_ID[p.sysId];
      if (!sys) continue;

      // Apply live sliders to particles of currently selected system
      const P = p.sysId === activeSystemId ? activeParams : p.params;

      if (sys.kind === "flow") {
        const dt = sys.preferredDt ?? flowDtBase;
        const thin = sys.preferredThin ?? 1;

        for (let i = 0; i < flowSteps; i++) p.s = sys.step(p.s, dt, P);

        // thinning (MATLAB-like look for Thomas)
        if (tick % thin === 0) {
          const pos = new THREE.Vector3(
            p.s.x * p.SCALE + p.offset.x,
            p.s.y * p.SCALE + p.offset.y,
            p.s.z * p.SCALE + p.offset.z
          );
          pushPoint(p, pos);
        }
      } else {
        for (let i = 0; i < mapIters; i++) p.s = sys.stepMap(p.s, P);

        const pos = new THREE.Vector3(
          p.s.x * p.SCALE + p.offset.x,
          p.s.y * p.SCALE + p.offset.y,
          0 + p.offset.z
        );
        pushPoint(p, pos);
      }

      p.head.material.size = dotSize * 0.06;
      applyTrailWindow(p, trail);
    }
  }

  renderer.render(scene, camera);
}

frame();
