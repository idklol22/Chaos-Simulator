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
}, { capture: true });

updateCount();

function scaledParams(sysParams, mult) {
  // Multiply only numeric params; leave others alone
  const out = {};
  for (const [k, v] of Object.entries(sysParams || {})) {
    out[k] = (typeof v === "number") ? (v * mult) : v;
  }
  return out;
}

function frame() {
  requestAnimationFrame(frame);

  const { speed, hyper, trail, dotSize } = uiCtl.read();
  controls.update();
  updateHudCamera();

  if (!uiCtl.paused) {
    const hyperMult = Math.max(0, hyper / 100); // 0..2
    const dtMult = hyperMult;
    const paramMult = hyperMult;

    const flowDtBase = 0.006;
    const flowDt = flowDtBase * dtMult;

    // with max speed=200 this can get much faster
    const flowSteps = Math.max(1, Math.floor(speed / 5));
    const mapIters  = Math.max(1, Math.floor(speed / 4));

    for (const p of particles) {
      const sys = SYSTEMS_BY_ID[p.sysId];
      if (!sys) continue;

      const P = scaledParams(p.params, paramMult);

      if (sys.kind === "flow") {
        for (let i = 0; i < flowSteps; i++) p.s = sys.step(p.s, flowDt, P);

        const pos = new THREE.Vector3(
          p.s.x * p.SCALE + p.offset.x,
          p.s.y * p.SCALE + p.offset.y,
          p.s.z * p.SCALE + p.offset.z
        );
        pushPoint(p, pos);
      } else {
        // For maps, interpret "hyper" as additional iterations
        for (let i = 0; i < Math.floor(mapIters * Math.max(0.25, hyperMult)); i++) {
          p.s = sys.stepMap(p.s, P);
        }

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
