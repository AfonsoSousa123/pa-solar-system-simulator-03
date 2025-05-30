import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./style.css";

const clock = new THREE.Clock(); // Create a clock to track time
const textureLoader = new THREE.TextureLoader();
let maxPlanets = 10;
const moons = []; // array global de luas
let simulationSpeed = 100;

/**
 * @description This is the main entry point for the PA Solar System Simulator.
 */
document.querySelector("#app").innerHTML = `
  <div>
    <h1>PA Solar System Simulator</h1>
    
    <div class="container">
      <div id="canvas-container">
        <canvas
          id="canvas" 
          width="800" 
          height="800"
        ></canvas>
      </div>
      <div id="controls-container">
      <div class="tabs">
        <button class="tab-button" data-tab="tab1">Controls</button>
        <button class="tab-button" data-tab="tab2">Edition</button>
      </div>
      <div class="column">
      <div class="tab-content" id="tab1">
        <div class="instructions">
            <button id="toggle-music" class="white-bg">Pause/Play Music</button>
            <button id="start" class="white-bg">Mouse Control</button>
            <hr>
            <h2>Simulation KeyBinds</h2>
            <ul>
              <li><b>W</b>, <b>A</b>, <b>S</b>, <b>D</b> — Movement Keys</li>
              <li><b>Q</b>, <b>R</b> — Up / Down</li>
              <li><b>Mouse</b> — Look Around</li>
              <li><b>Shift + Movement Keys</b> — Moves Faster</li>
              <li><b>Click in "Mouse Control"</b> — Activate the Mouse Control (FPS like)</li>
              <li><b>ESC</b> — Exit the Mouse Control Mode</li>
            </ul>
        </div>
        <div class="speed-control">
          <label>Simulation Speed:</label>
          <input type="number" id="sim-speed" min="0.1" max="1000" step="0.1" value="100" >
          <span>º/s</span>
        </div>
        <div class="card">
          <button id="add-planet">Add Planet</button>
          <button id="add-enterprise">Add Enterprise</button>
          <button id="add-lucrehulk">Add Lucrehulk</button>
          <button id="add-star-destroyer">Add Star Destroyer</button>
          <button id="add-enterprise-e">Add Enterprise E</button>
          <button id="add-deathstar">Add Death Star</button>
          <select id="planet-dropdown"></select>
          <button id="add-moon" style="margin-left: 10px;">Add Moon</button>
        </div>
        <div class="card">
          <input type="color" id="comet-color" value="#ffffff" title="Cor do Cometa">
          <select id="comet-direction">
            <option value="cw">Clockwise</option>
            <option value="ccw">Counter-Clockwise</option>
          </select>
          <button id="add-comet">Add Comet</button>
        </div>
      </div>
        <div class="tab-content" id="tab2">
            <h2>Editing Controls</h2>
            <div class="controls">
            <label for="object-dropdown">Select an object:</label>
            <select id="object-dropdown"></select>
            <button onclick="removeObject()">Remove Object</button>
            <p>After editing an object, press the ENTER key to apply changes.</p>
            <input type="number" id="orbit-speed" placeholder="Orbit Speed (0-2)" onchange="changeOrbitSpeed(this.value)">
            <input type="number" id="resize-scale" placeholder="Resize (0-5)" onchange="resizeObject(this.value)">
            <input type="number" id="rotation-x" placeholder="Rotation X" onchange="editRotation(this.value, 0, 0)">
            <input type="number" id="rotation-y" placeholder="Rotation Y" onchange="editRotation(0, this.value, 0)">
            <input type="number" id="rotation-z" placeholder="Rotation Z" onchange="editRotation(0, 0, this.value)">
            <input type="text" id="texture-path" placeholder="Texture Path" onchange="editTexture(this.value)">
            <input type="number" id="sun-intensity" placeholder="Intensity of the Sun" onchange="changeSunLightIntensity(this.value)">
            </div>
      </div>
    </div>
  </div>
`;

// ------------------------------------- BEGIN SETUP SCENE, CAMERA, AND RENDERER -------------------------------------
/**
 * @description Initializes the scene, camera, and renderer for the solar system simulation.
 */
const scene = new THREE.Scene();
const starTexture = textureLoader.load("/textures/stars.jpg");

const skyGeo = new THREE.SphereGeometry(500, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide,
  depthWrite: false,
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(
    75,
    1, // Aspect ratio 1 for square canvas of 800x800
    0.1,
    1000,
);
camera.position.set(0, 30, 0); // acima do sistema solar
camera.lookAt(0, 0, 0); // a olhar para o Sol (centro)

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});
renderer.setSize(800, 800); // fixed size 800x800 pixels
// ------------------------------------- END SETUP SCENE, CAMERA, AND RENDERER -------------------------------------

// ------------------------------------- BEGIN CONTROLS FOR MOVEMENT AND MOUSE LOOK -------------------------------------
/**
 * @description Initializes PointerLockControls for mouse look and movement in the solar system simulation.
 */
const controls = new PointerLockControls(camera, renderer.domElement);
document.getElementById("start").addEventListener("click", () => {
  controls.lock();

  // Resume AudioContext se necessário
  if (audio.context && audio.context.state === "suspended") {
    audio.context.resume();
  }

  // Play da música se ainda não estiver a tocar
  if (audio.paused) {
    audio.play().catch((err) => console.warn("Erro ao iniciar áudio:", err));
  }
});
// Add the controls to the scene
// Movement variables
let normalSpeed = 0.05;
let sprintSpeed = 0.15;
let moveSpeed = normalSpeed;
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Shift") moveSpeed = sprintSpeed;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Shift") moveSpeed = normalSpeed;
});
//------------------------------------- END CONTROLS FOR MOVEMENT AND MOUSE LOOK -------------------------------------

//----------------------------------------- BEGIN LIGHTING AND SUN -----------------------------------
// Add lighting to see the textures
const ambientLight = new THREE.AmbientLight(0x333333, 3);
scene.add(ambientLight);

// Add the Sun with emissive material using MeshPhongMaterial
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunTexture = textureLoader.load("/textures/sun.jpg");
const sunMaterial = new THREE.MeshPhongMaterial({
  map: sunTexture,
  emissive: 0xffaa00,
  emissiveMap: sunTexture,
  emissiveIntensity: 1.5,
  shininess: 10,
  specular: 0x111111,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Add a glow effect around the Sun
const glowGeometry = new THREE.SphereGeometry(2.3, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffdd00,
  transparent: true,
  opacity: 0.1,
  side: THREE.BackSide,
});
const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(sunGlow);

// Add a point light to simulate sunlight
const sunLight = new THREE.PointLight(0xffffff, 80, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);
// --------------------------------- END LIGHTING AND SUN -----------------------------------

const planets = [
  {
    name: "Mercury",
    size: 0.2,
    distance: 3,
    color: 0xaaaaaa,
    speed: 0.02,
    texture: "textures/mercury.jpg",
    rotationSpeed: 0.05,
    a: 3, // semi-eixo maior
    b: 2.4, // semi-eixo menor
  },
  {
    name: "Venus",
    size: 0.4,
    distance: 5,
    color: 0xffcc00,
    speed: 0.015,
    texture: "textures/venus.jpg",
    rotationSpeed: 0.02,
    a: 5, // semi-eixo maior
    b: 4, // semi-eixo menor
  },
  {
    name: "Earth",
    size: 0.5,
    distance: 7,
    color: 0x0000ff,
    speed: 0.01,
    texture: "textures/earth.jpg",
    rotationSpeed: 0.03,
    a: 7, // semi-eixo maior
    b: 5.6, // semi-eixo menor
  },
  {
    name: "Mars",
    size: 0.3,
    distance: 9,
    color: 0xff0000,
    speed: 0.008,
    texture: "textures/mars.jpg",
    rotationSpeed: 0.025,
    a: 9, // semi-eixo maior
    b: 7.2, // semi-eixo menor
  },
  {
    name: "Jupiter",
    size: 1.0,
    distance: 12,
    color: 0xffa500,
    speed: 0.005,
    texture: "textures/jupiter.jpg",
    rotationSpeed: 0.04,
    a: 12, // semi-eixo maior
    b: 9.6, // semi-eixo menor
  },
  {
    name: "Saturn",
    size: 0.9,
    distance: 15,
    color: 0xffff00,
    speed: 0.004,
    texture: "textures/saturn.jpg",
    rotationSpeed: 0.038,
    a: 15, // semi-eixo maior
    b: 12, // semi-eixo menor
  },
  {
    name: "Uranus",
    size: 0.7,
    distance: 18,
    color: 0x00ffff,
    speed: 0.003,
    texture: "textures/uranus.jpg",
    rotationSpeed: 0.03,
    a: 18, // semi-eixo maior
    b: 14.4, // semi-eixo menor
  },
  {
    name: "Neptune",
    size: 0.7,
    distance: 21,
    color: 0x0000ff,
    speed: 0.002,
    texture: "textures/neptune.jpg",
    rotationSpeed: 0.032,
    a: 21, // semi-eixo maior
    b: 16.8, // semi-eixo menor
  },
];

//Add Moon
// Preencher o dropdown com os nomes dos planetas
const planetDropdown = document.getElementById("planet-dropdown");
planets.forEach((planet, idx) => {
  const option = document.createElement("option");
  option.value = idx;
  option.textContent = planet.name;
  planetDropdown.appendChild(option);
});

const moonsPerPlanet = {};

document.getElementById("add-moon").addEventListener("click", () => {
  const planetIdx = document.getElementById("planet-dropdown").value;
  if (!planetMeshes[planetIdx]) return;

  // Inicializa contador se necessário
  if (!moonsPerPlanet[planetIdx]) moonsPerPlanet[planetIdx] = 0;

  if (moonsPerPlanet[planetIdx] >= 3) {
    alert("This planet already has 3 moons!");
    return;
  }
  const randomIndex = Math.floor(Math.random() * planetTextures.length);
  const texturePath = planetTextures[randomIndex];

  addMoon({
    parentPlanetMesh: planetMeshes[planetIdx].mesh,
    orbitRadius: 0.8, // igual à da Terra
    speed: 0.001, // igual à da Terra
    texturePath,
    rotationSpeed: 0.015, // valor fixo (exemplo: média do padrão)
  });

  moonsPerPlanet[planetIdx]++;
});

//End add Moon

//add comet

const comets = [];

document.getElementById("add-comet").addEventListener("click", () => {
  const colorInput = document.getElementById("comet-color").value;
  const direction = document.getElementById("comet-direction").value;

  const color = new THREE.Color(colorInput);

  // Parâmetros da órbita
  const orbitRadius = 16 + Math.random() * 12;
  const excentricity = 0.5 + Math.random() * 0.4;
  const inclination = (Math.random() * Math.PI) / 2;
  const speed = (direction === "cw" ? 1 : -1) * (0.002 + Math.random() * 0.001);
  const angle = Math.random() * Math.PI * 2;

  // Núcleo do cometa - removi textura para garantir visibilidade da cor
  const cometMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const cometGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);

  const cometLight = new THREE.PointLight(color, 3, 15);
  cometLight.add(cometMesh);

  // Cauda com shader material
  // (mesmo código, só trocar o uniform para o novo objeto THREE.Color)
  const tailPoints = [];
  const tailOpacity = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    tailPoints.push(new THREE.Vector3(-t * 2, 0.4 * t, -1.2 * t));
    tailOpacity.push(1 - t);
  }

  const curve = new THREE.CatmullRomCurve3(tailPoints);
  const points = curve.getPoints(50);
  const tailGeometry = new THREE.BufferGeometry().setFromPoints(points);

  const alphaArray = new Float32Array(tailOpacity.length);
  for (let i = 0; i < tailOpacity.length; i++) {
    alphaArray[i] = tailOpacity[i];
  }
  tailGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphaArray, 1));

  const tailMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: color }, // passa o THREE.Color aqui
    },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(color, vAlpha * 0.3);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const tailMesh = new THREE.Line(tailGeometry, tailMaterial);
  tailMesh.rotation.x = Math.PI;
  cometLight.add(tailMesh);

  // Partículas
  const particleCount = 100;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = Math.random() * 0.5;
    positions[i * 3 + 2] = -Math.random() * 2;
  }
  particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
  );

  const particlesMaterial = new THREE.PointsMaterial({
    color: color,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  cometLight.add(particleSystem);
