import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function makeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);

  // Fog farther away
  scene.fog = new THREE.Fog(0x05070a, 200, 2000);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 3000);

  // REQUIRED: start away from the target so zoom has a distance to change
  camera.position.set(0, 0, 140);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  controls.target.set(0, 0, 0);
  controls.minDistance = 0.05;
  controls.maxDistance = 1500;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.1;
  controls.update(); // sync controls with the camera+target [web:203]

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(2, 6, 3);
  scene.add(sun);

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  });

  return { THREE, scene, camera, renderer, controls };
}
