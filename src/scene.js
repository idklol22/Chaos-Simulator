import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function makeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.Fog(0x05070a, 18, 240);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 3000);
  camera.position.set(-250.23, 62.67, 23.10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, -2.8, 0);
  controls.minDistance = 6;
  controls.maxDistance = 900;
  controls.update();

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
