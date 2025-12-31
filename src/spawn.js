import { neonColor, makeNeonTrail, pushPoint } from "./trails.js";

export const MAX_PARTICLES = 350;
export const AIR_DEPTH = 54 * 1.7;

const SPAWN_JITTER_RADIUS = 2.2;

export function clickToAirPoint({ THREE, raycaster, camera }, ev) {
  const mouse = new THREE.Vector2(
    (ev.clientX / innerWidth) * 2 - 1,
    -(ev.clientY / innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const planePoint = camera.position.clone().addScaledVector(forward, AIR_DEPTH);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(forward, planePoint);

  const hit = new THREE.Vector3();
  const ok = raycaster.ray.intersectPlane(plane, hit);
  return ok ? hit : null;
}

function jitterPoint(THREE, base) {
  const a = Math.random() * Math.PI * 2;
  const r = SPAWN_JITTER_RADIUS * Math.sqrt(Math.random());
  return base.clone().add(new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 0.6, Math.sin(a) * r));
}

export function spawnOneAt(ctx, worldPoint, dotSize, system) {
  const { THREE, scene, particles } = ctx;
  if (particles.length >= MAX_PARTICLES) return false;

  const spawnPoint = jitterPoint(THREE, worldPoint);

  const color = neonColor(THREE);
  const maxPoints = 35000;
  const trailObj = makeNeonTrail({ THREE, scene, maxPoints, color, dotSize });

  const s0 = system.init();
  const SCALE = system.scale ?? 2.0;

  const first = new THREE.Vector3(
    (s0.x ?? 0) * SCALE,
    (s0.y ?? 0) * SCALE,
    (s0.z ?? 0) * SCALE
  );

  const offset = new THREE.Vector3().subVectors(spawnPoint, first);

  const particle = {
    sysId: system.id,
    kind: system.kind,
    params: system.params ?? {},
    s: { x: s0.x ?? 0, y: s0.y ?? 0, z: s0.z ?? 0 },
    SCALE,
    offset,
    color,
    ...trailObj
  };

  // Start the trail/head at the jittered spawn position
  pushPoint(particle, spawnPoint);

  particles.push(particle);
  return true;
}
