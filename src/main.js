import * as THREE from "three";
import { rk4 } from "./chen.js";
import { makeScene } from "./scene.js";
import { makeUI } from "./ui.js";
import { applyTrailWindow, disposeTrail, pushPoint } from "./trails.js";
import { clickToAirPoint, spawnOneAt, MAX_PARTICLES } from "./spawn.js";

const { scene, camera, renderer, controls } = makeScene();
const raycaster = new THREE.Raycaster();

const particles = [];
const uiCtl = makeUI();

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

renderer.domElement.addEventListener("pointerdown", (ev) => {
  if (ev.target.closest && ev.target.closest("#hud")) return;
  if (uiCtl.armedSpawnCount == null) return;

  const base = clickToAirPoint({ THREE, raycaster, camera }, ev);
  if (!base) return;

  const remaining = MAX_PARTICLES - particles.length;
  const n = Math.min(uiCtl.armedSpawnCount, remaining);

  const { dotSize } = uiCtl.read();
  for (let i = 0; i < n; i++) {
    const ok = spawnOneAt({ THREE, scene, particles }, base.clone(), dotSize);
    if (!ok) break;
  }

  uiCtl.clearSelection();
  updateCount();
});

updateCount();

function frame() {
  requestAnimationFrame(frame);

  const { speed, trail, dotSize } = uiCtl.read();
  controls.update();
  updateHudCamera();

  if (!uiCtl.paused) {
    const dt = 0.006;
    const steps = Math.max(1, Math.floor(speed / 7));

    for (const p of particles) {
      for (let i = 0; i < steps; i++) p.s = rk4(p.s, dt);

      const pos = new THREE.Vector3(
        p.s.x * p.SCALE + p.offset.x,
        p.s.y * p.SCALE + p.offset.y,
        p.s.z * p.SCALE + p.offset.z
      );

      pushPoint(p, pos);
      p.head.material.size = dotSize * 0.06;
      applyTrailWindow(p, trail);
    }
  }

  renderer.render(scene, camera);
}

frame();
