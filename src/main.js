import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import "./style.css";

const clock = new THREE.Clock(); // Create a clock to track time

document.querySelector("#app").innerHTML = `
  <div>
    <h1>PA Solar System Simulator</h1>
    <div id="container">
      <canvas id="canvas"></canvas>
    </div>
    <button id="start">Click to Start</button>
  </div>
`;

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);

// PointerLockControls for mouse navigation
const controls = new PointerLockControls(camera, renderer.domElement);
document.getElementById("start").addEventListener("click", () => {
  controls.lock();
});

// Movement variables
const moveSpeed = 0.1;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const keys = { w: false, a: false, s: false, d: false, q: false, r: false };

// Event listeners for keyboard input
document.addEventListener("keydown", (event) => {
  if (event.key === "w") keys.w = true;
  if (event.key === "a") keys.a = true;
  if (event.key === "s") keys.s = true;
  if (event.key === "d") keys.d = true;
  if (event.key === "q") keys.q = true;
  if (event.key === "r") keys.r = true;
});
document.addEventListener("keyup", (event) => {
  if (event.key === "w") keys.w = false;
  if (event.key === "a") keys.a = false;
  if (event.key === "s") keys.s = false;
  if (event.key === "d") keys.d = false;
  if (event.key === "q") keys.q = false;
  if (event.key === "r") keys.r = false;
});

// Add the Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  emissive: 0xffff00,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Define planet data (size, distance from the Sun, color, and orbit speed)
const planets = [
  { name: "Mercury", size: 0.2, distance: 3, color: 0xaaaaaa, speed: 0.02 },
  { name: "Venus", size: 0.4, distance: 5, color: 0xffcc00, speed: 0.015 },
  { name: "Earth", size: 0.5, distance: 7, color: 0x0000ff, speed: 0.01 },
  { name: "Mars", size: 0.3, distance: 9, color: 0xff0000, speed: 0.008 },
  { name: "Jupiter", size: 1.0, distance: 12, color: 0xffa500, speed: 0.005 },
  { name: "Saturn", size: 0.9, distance: 15, color: 0xffff00, speed: 0.004 },
  { name: "Uranus", size: 0.7, distance: 18, color: 0x00ffff, speed: 0.003 },
  { name: "Neptune", size: 0.7, distance: 21, color: 0x0000ff, speed: 0.002 },
];

// Create planets and their orbits
const planetMeshes = [];
planets.forEach((planet) => {
  const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
  const planetMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  planetMesh.position.x = planet.distance;
  scene.add(planetMesh);
  planetMeshes.push({
    mesh: planetMesh,
    speed: planet.speed,
    distance: planet.distance,
  });

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
    new THREE.Path()
      .absarc(0, 0, planet.distance, 0, Math.PI * 2)
      .getPoints(64),
  );
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Get the time elapsed since the last frame

  // Update planet positions
  planetMeshes.forEach((planet) => {
    const angle = (planet.speed * clock.elapsedTime) % (Math.PI * 2); // Calculate angle
    planet.mesh.position.x = Math.cos(angle) * planet.distance;
    planet.mesh.position.z = Math.sin(angle) * planet.distance;
  });

  // Update movement direction
  direction.set(0, 0, 0);
  if (keys.w) direction.z -= 1;
  if (keys.s) direction.z += 1;
  if (keys.a) direction.x -= 1;
  if (keys.d) direction.x += 1;
  if (keys.q) direction.y -= 1;
  if (keys.r) direction.y += 1;

  direction.normalize();
  velocity.copy(direction).multiplyScalar(moveSpeed);
  controls.object.position.add(velocity);

  renderer.render(scene, camera);
}
animate();
