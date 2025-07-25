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

  scene.add(cometLight);

  comets.push({
    light: cometLight,
    tail: tailMesh,
    particles: particleSystem,
    angle,
    orbitRadius,
    speed,
    inclination,
    excentricity,
    directionSign: direction === "cw" ? 1 : -1,
  });
});

//end comet

// Create planets and their orbits
const planetMeshes = [];
planets.forEach((planet) => {
  const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);

  planet.a = planet.distance;
  planet.b = planet.distance * 0.8;

  // Load the texture for the planet
  const planetTexture = textureLoader.load(planet.texture);

  // Create a MeshPhongMaterial for the planet
  const planetMaterial = new THREE.MeshPhongMaterial({
    map: planetTexture,
    shininess: 5,
  });

  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  planetMesh.position.x = planet.distance;
  scene.add(planetMesh);

  if (planet.name === "Saturn") {
    const ringInnerRadius = planet.size * 1.2;
    const ringOuterRadius = planet.size * 2.0;

    // Carrega a textura dos anéis
    const ringTexture = textureLoader.load("/textures/ring_saturn.png");
    ringTexture.wrapS = THREE.RepeatWrapping;
    ringTexture.wrapT = THREE.ClampToEdgeWrapping;

    const ringMaterial = new THREE.MeshPhongMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      alphaMap: ringTexture, // Usa a mesma textura para transparência
      emissive: 0xcccccc,
      emissiveIntensity: 0.3,
      specular: 0x111111,
      shininess: 30,
    });

    const segments = 256;
    const ringGeometry = new THREE.RingGeometry(
        ringInnerRadius,
        ringOuterRadius,
        segments,
    );

    // Ajusta o mapeamento UV para exibir a textura radialmente
    const uvAttribute = ringGeometry.attributes.uv;
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);

      // Converte coordenadas UV para coordenadas polares
      const radius = v; // Mantém a distância radial
      const angle = u * Math.PI * 2; // Converte u para ângulo

      // Mapeia a textura radialmente
      uvAttribute.setXY(i, u, v);

      // Alternativa para texturas que precisam de ajuste diferente:
      uvAttribute.setXY(i, angle / (Math.PI * 2), radius);
    }

    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2; // Rotaciona para ficar no plano XY
    ringMesh.rotation.z = (-26.7 * Math.PI) / 180; // Inclinação característica de Saturno
    planetMesh.add(ringMesh);

    // Adiciona um círculo preto para cobrir o centro dos anéis
    const centerCover = new THREE.Mesh(
        new THREE.CircleGeometry(ringInnerRadius * 0.82, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    centerCover.rotation.x = Math.PI / 2;
    planetMesh.add(centerCover);
  }

  const ellipsePoints = [];
  const numPoints = 128;
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = planet.a * Math.cos(angle);
    const z = planet.b * Math.sin(angle);
    ellipsePoints.push(new THREE.Vector3(x, 0, z));
  }
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  //orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  planetMeshes.push({
    mesh: planetMesh,
    speed: planet.speed,
    distance: planet.distance, // ainda usado para órbitas
    a: planet.distance, // semi-eixo maior
    b: planet.distance * 0.8, // semi-eixo menor
    rotationSpeed: planet.rotationSpeed,
    orbitLine: orbitLine,
  });
});

const planetTextures = [
  "textures/ceres_fictional.jpg",
  "textures/eris_fictional.jpg",
  "textures/haumea_fictional.jpg",
  "textures/makemake_fictional.jpg",
  "textures/moon.jpg",
];

// -------------------------------------- BEGIN ADD PLANET FUNCTION --------------------------------------
/**
 * @description Adds a planet to the solar system with specified size, distance, and speed.
 * @param size
 * @param distance
 * @param speed
 */
function addPlanet({
                     size = 0.4,
                     distance = 5 + planetMeshes.length * 2,
                     speed = 0.01,
                   } = {}) {
  if (planetMeshes.length >= maxPlanets) {
    alert("10 Planet limit reached!");
    return;
  }
  const randomIndex = Math.floor(Math.random() * planetTextures.length);
  const texturePath = planetTextures[randomIndex];

  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const texture = textureLoader.load(texturePath);
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);

  const initialAngle = Math.random() * Math.PI * 2;
  mesh.position.x = Math.cos(initialAngle) * distance;
  mesh.position.z = Math.sin(initialAngle) * distance;
  mesh.rotation.y = Math.random() * Math.PI * 2;

  scene.add(mesh);

  // Consistente: órbita elíptica com pontos calculados via for loop
  const ellipsePoints = [];
  const numPoints = 128;
  const a = distance;
  const b = distance * 0.8;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = a * Math.cos(angle);
    const z = b * Math.sin(angle);
    ellipsePoints.push(new THREE.Vector3(x, 0, z));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbitLine);

  planetMeshes.push({
    mesh,
    speed,
    distance,
    angle: initialAngle,
    rotationSpeed: 0.02 + Math.random() * 0.03,
    a: distance,
    b: distance * 0.8,
    orbitLine: orbitLine,
  });
}

document.getElementById("add-planet").addEventListener("click", () => {
  addPlanet({
    size: 0.3 + Math.random() * 0.5, // random size between 0.3 and 0.8
    distance: 8 + planetMeshes.length * 2, // distance based on number of planets
    speed: 0.005 + Math.random() * 0.01, // speed between 0.005 and 0.015
  });
});
// -------------------------------------- END ADD PLANET FUNCTION --------------------------------------

// --------------------------------------- BEGIN ADD MOON FUNCTION --------------------------------------
/**
 * @description Adds a moon to a specified planet with given parameters.
 * @param parentPlanetMesh
 * @param size
 * @param orbitRadius
 * @param speed
 * @param texturePath
 */
function addMoon({
                   parentPlanetMesh,
                   size = 0.1,
                   orbitRadius,
                   speed,
                   texturePath,
                 }) {
  let moonCount = 0;

  const baseSpacing = 0.4; // distância mínima entre órbitas
  orbitRadius = 1.0 + moonCount * baseSpacing + Math.random() * 0.2;
  speed = 0.001 + Math.random() * 0.008;

  // Random texture selection
  const randomIndex = Math.floor(Math.random() * planetTextures.length);
  texturePath = planetTextures[randomIndex];

  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const texture = textureLoader.load(texturePath);
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const moonMesh = new THREE.Mesh(geometry, material);

  scene.add(moonMesh);

  moons.push({
    mesh: moonMesh,
    parent: parentPlanetMesh,
    angle: Math.random() * Math.PI * 2,
    orbitRadius,
    speed,
    rotationSpeed: 0.01 + Math.random() * 0.02,
  });
  updateObjectDropdown();
  moonCount++;
}

// ------------------------------------- END ADD MOON FUNCTION --------------------------------------

// ------------------------------------ BEGIN ADD ENTERPRISE ----------------------------------------
// Load the Enterprise model
const gltfLoader = new GLTFLoader();

let enterprise = null;
let enterpriseOrbitAngle = 0;
const enterpriseOrbitRadius = 0.9; // pequena órbita à volta de Vénus
const enterpriseOrbitSpeed = 0.001; // velocidade da órbita da Enterprise

/**
 * @description Adds the Enterprise model to the scene and sets its initial position and scale.
 */
function addEnterprise() {
  if (enterprise) {
    alert("Enterprise already added!");
    return;
  }

  gltfLoader.load("/models/u.s.s._enterprise_ncc-1701.glb", (gltf) => {
    enterprise = gltf.scene;
    enterprise.scale.set(0.02, 0.02, 0.02);
    scene.add(enterprise);
  });
}

document.getElementById("add-enterprise").addEventListener("click", () => {
  addEnterprise();
});

// ------------------------------------ END ADD ENTERPRISE ----------------------------------------

// ------------------------------------ BEGIN ADD ENTERPRISE E ----------------------------------------

let enterpriseE = null;
let enterpriseEOrbitAngle = 0;
const enterpriseEOrbitRadius = 1.2;
const enterpriseEOrbitSpeed = 0.0008;
const enterpriseEInclination = Math.PI / 5;

/**
 * @description Adds the Enterprise E model to the scene and sets its initial position and scale.
 * @return {void}
 */
function addEnterpriseE() {
  if (enterpriseE) {
    alert("Enterprise E already added!");
    return;
  }

  gltfLoader.load("/models/star_trek_uss_enterprise-e.glb", (gltf) => {
    enterpriseE = gltf.scene;
    enterpriseE.scale.set(0.003, 0.003, 0.003);
    scene.add(enterpriseE);
  });
}

document.getElementById("add-enterprise-e").addEventListener("click", () => {
  addEnterpriseE();
});

// ------------------------------------- END ADD ENTERPRISE E ----------------------------------------

// ------------------------------------ BEGIN ADD LUCREHULK ----------------------------------------
let lucrehulk = null;
let lucrehulkOrbitAngle = 0;
const lucrehulkOrbitRadius = 1.8; // raio da órbita em torno de Júpiter
const lucrehulkOrbitSpeed = 0.0006; // velocidade orbital
const lucrehulkInclination = Math.PI / 10; // inclinação da órbita (~18°)

/**
 * @description Adds the Lucrehulk model to the scene and sets its initial position and scale.
 * @return {void}
 */
function addLucrehulk() {
  if (lucrehulk) {
    alert("Lucrehulk already added!");
    return;
  }

  gltfLoader.load(
      "/models/lucrehulk.glb",
      (gltf) => {
        lucrehulk = gltf.scene;
        lucrehulk.scale.set(0.03, 0.03, 0.03); // Escala reduzida compatível com Júpiter
        scene.add(lucrehulk);
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar a Lucrehulk:", error);
      },
  );
}

document.getElementById("add-lucrehulk").addEventListener("click", () => {
  addLucrehulk();
});
// ------------------------------------ END ADD LUCREHULK ----------------------------------------

// ------------------------------------ BEGIN ADD STAR DESTROYER ----------------------------------------
let starDestroyer = null;
let starDestroyerOrbitAngle = 0;
const starDestroyerOrbitRadius = 0.3; // distância pequena para orbitar Mercúrio
const starDestroyerOrbitSpeed = 0.0005; // velocidade orbital
const starDestroyerInclination = Math.PI / 8; // ~22.5 graus

/**
 * @description Adds the Star Destroyer model to the scene and sets its initial position and scale.
 */
function addStarDestroyer() {
  if (starDestroyer) {
    alert("Star Destroyer already added!");
    return;
  }

  gltfLoader.load(
      "/models/star_destroyer.glb",
      (gltf) => {
        starDestroyer = gltf.scene;
        starDestroyer.scale.set(0.015, 0.015, 0.015); // scale reduced
        scene.add(starDestroyer);
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar o Star Destroyer:", error);
      },
  );
}

document.getElementById("add-star-destroyer").addEventListener("click", () => {
  addStarDestroyer();
});

// ------------------------------------ END ADD STAR DESTROYER ----------------------------------------
//----------------------------------tabs
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
    document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

// Ativar o primeiro separador por padrão
document.querySelector(".tab-button").classList.add("active");
document.querySelector(".tab-content").classList.add("active");

// ------------------------------------ BEGIN ADD DEATH STAR ----------------------------------------
let deathStar = null;
let deathStarAngle = 0;
const deathStarOrbitRadius = 1.2; // distância à volta de Marte
const deathStarSpeed = 0.0004;
const deathStarScale = 0.003; // escala reduzida para a Death Star

/**
 * @description Adds the Death Star model to the scene and sets its initial position and scale.
 */
function addDeathStar() {
  if (deathStar) {
    alert("Star Destroyer already added!");
    return;
  }

  gltfLoader.load(
      "/models/death_star.glb",
      (gltf) => {
        deathStar = gltf.scene;
        deathStar.scale.set(deathStarScale, deathStarScale, deathStarScale);
        scene.add(deathStar);
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar a Death Star:", error);
      },
  );
}

document.getElementById("add-deathstar").addEventListener("click", () => {
  addDeathStar();
});
// ------------------------------------ END ADD DEATH STAR ----------------------------------------

// ------------------------------------ BEGIN BACKGROUND MUSIC ------------------------------------
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load(
  "/music/Star Citizen Soundtrack StarEngine.mp3",
  function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();

    showMusicCredits();
  },
);

document.getElementById("toggle-music").addEventListener("click", () => {
  if (sound.isPlaying) {
    sound.pause();
  } else {
    sound.play();
  }
});

/**
 * @description Displays the music credits on the screen for a limited time.
 */
function showMusicCredits() {
  const credits = document.createElement("div");
  credits.innerHTML = `
    Música: <em>StarEngine Menu Version</em> — Pedro Macedo Camacho ft Lara Ausensi
  `;
  credits.id = "music-credits";
  credits.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 15%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    font-size: 12px;
    font-family: sans-serif;
    padding: 8px 12px;
    border-radius: 6px;
    opacity: 0;
    transition: opacity 2s ease;
    z-index: 1000;
  `;
  document.body.appendChild(credits);

  // Fade in
  setTimeout(() => {
    credits.style.opacity = "1";
  }, 100);

  // Fade out e remover
  setTimeout(() => {
    credits.style.opacity = "0";
    setTimeout(() => credits.remove(), 2000); // remove after fade out
  }, 10000); // mostra durante 10 segundos
}
// ------------------------------------ END BACKGROUND MUSIC ------------------------------------

// ------------------------------------ BEGIN ANIMATE FUNCTION ------------------------------------
document.getElementById("sim-speed").addEventListener("input", (e) => {
  let value = parseFloat(e.target.value);

  // If the value is NaN or less than or equal to 0, set it to 100
  if (isNaN(value) || value <= 0) {
    value = 100;
  }
  // If the value is greater than 10000, set it to 10000
  if (value > 10000) {
    value = 10000;
  }

  e.target.value = value;
  simulationSpeed = value;
});

// ------------------------------------ BEGIN drop down list edit FUNCTION ------------------------------------
/**
 * @description Update the dropdown list with the current objects in the scene.
 */
function updateObjectDropdown() {
  const dropdown = document.getElementById("object-dropdown");
  dropdown.innerHTML = '<option value="">Select an Object</option>';

  // Adiciona planetas
  planetMeshes.forEach((planet, index) => {
    const planetName =
      index < planets.length
        ? planets[index].name
        : `Additional Planet ${index - planets.length + 1}`;
    const option = document.createElement("option");
    option.value = `planet-${index}`;
    option.textContent = `Planet: ${planetName}`;
    dropdown.appendChild(option);
  });

  // Adiciona luas
  moons.forEach((moon, index) => {
    let parentName = "Unknown";
    const parentIndex = planetMeshes.findIndex((p) => p.mesh === moon.parent);
    if (parentIndex !== -1) {
      parentName =
        parentIndex < planets.length
          ? planets[parentIndex].name
          : `Additional Planet ${parentIndex - planets.length + 1}`;
    }
    const option = document.createElement("option");
    option.value = `moon-${index}`;
    option.textContent = `Moon of ${parentName}`;
    dropdown.appendChild(option);
  });

  // Adiciona o Sol
  const sunOption = document.createElement("option");
  sunOption.value = "sun";
  sunOption.textContent = "Sun";
  dropdown.appendChild(sunOption);
}

/**
 * @description Removes an object (planet) from the scene based on its type and index.
 */
function removeObject() {
  const dropdown = document.getElementById("object-dropdown");
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    alert("Please select an object to remove");
    return;
  }

  if (selectedValue.startsWith("planet-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    removePlanet(index);
  } else if (selectedValue.startsWith("moon-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    removeMoon(index);
  } else if (selectedValue === "sun") {
    alert("Cannot remove the Sun!");
  }

  // Atualiza a lista de objetos após remoção
  updateObjectDropdown();
}

/**
 * @description Removes a planet from the scene based on its index.
 * @param index
 */
function removePlanet(index) {
  if (index >= 0 && index < planetMeshes.length) {
    // Remove o planeta da cena
    scene.remove(planetMeshes[index].mesh);

    // Remove a linha de órbita
    if (planetMeshes[index].orbitLine) {
      scene.remove(planetMeshes[index].orbitLine);
    }

    // Remove todas as luas associadas a este planeta
    for (let i = moons.length - 1; i >= 0; i--) {
      if (moons[i].parent === planetMeshes[index].mesh) {
        scene.remove(moons[i].mesh);

        // Remove a linha de órbita da lua (se existir)
        if (moons[i].orbitLine) {
          scene.remove(moons[i].orbitLine);
        }

        moons.splice(i, 1);
      }
    }

    // Remove o planeta do array
    planetMeshes.splice(index, 1);

    // Remove modelos especiais associados a planetas específicos
    if (index === 0 && starDestroyer) {
      scene.remove(starDestroyer);
      starDestroyer = null;
    } else if (index === 1 && enterprise) {
      scene.remove(enterprise);
      enterprise = null;
    } else if (index === 2 && enterpriseE) {
      scene.remove(enterpriseE);
      enterpriseE = null;
    } else if (index === 3 && deathStar) {
      scene.remove(deathStar);
      deathStar = null;
    } else if (index === 4 && lucrehulk) {
      scene.remove(lucrehulk);
      lucrehulk = null;
    }
  }
}

/**
 * @description Removes a moon from the scene based on its index.
 * @param index
 */
function removeMoon(index) {
  if (index >= 0 && index < moons.length) {
    scene.remove(moons[index].mesh);
    moons.splice(index, 1);
  }
}

// Atualize o event listener do botão de remover para chamar a nova função
document
  .querySelector("button[onclick='removeObject()']")
  .addEventListener("click", removeObject);

/**
 * @description Changes the speed of the orbit for the selected object in the dropdown.
 * @param {number|string} speed - The new orbit speed (can be a number or string from input)
 */
function changeOrbitSpeed(speed) {
  // Convert the input to a number (in case it comes as string)
  const newSpeed = parseFloat(speed);

  // Check if the conversion resulted in a valid number
  if (isNaN(newSpeed)) {
    alert("Please enter a valid number for the orbital speed");
    return;
  }

  // Define os limites de velocidade
  const minSpeed = 0.001; // Velocidade mínima
  const maxSpeed = 2; // Velocidade máxima (como solicitado)

  // Limita a velocidade entre os valores mínimo e máximo
  const clampedSpeed = Math.max(minSpeed, Math.min(newSpeed, maxSpeed));

  // Se o valor inserido for maior que o máximo, mostra um aviso
  if (newSpeed > maxSpeed) {
    alert(
      `The maximum allowed orbital speed is ${maxSpeed}. The object has been set to this value.`,
    );
  }

  const dropdown = document.getElementById("object-dropdown");
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    alert("Please select an object first");
    return;
  }

  if (selectedValue.startsWith("planet-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (planetMeshes[index]) {
      planetMeshes[index].speed = clampedSpeed;
    }
  } else if (selectedValue.startsWith("moon-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (moons[index]) {
      moons[index].speed = clampedSpeed;
    }
  } else if (selectedValue === "sun") {
    alert("It's not possible to change the Sun's orbital speed!");
  }
}

// Adiciona event listener para o Enter no campo de velocidade orbital
document.getElementById("orbit-speed").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    changeOrbitSpeed(e.target.value);
    e.target.value = ""; // Limpa o campo após aplicar
  }
});

/**
 * @description Resizes the selected object (planet or moon) based on the scale factor provided.
 * @param {number|string} scale - The new scale value (can be a number or string from input)
 */
function resizeObject(scale) {
  // Convert the input to a number (in case it comes as string)
  const newScale = parseFloat(scale);

  // Check if the conversion resulted in a valid number
  if (isNaN(newScale)) {
    alert("Please enter a valid number for the scale");
    return;
  }

  // Define os limites mínimo e máximo de escala
  const minScale = 0.1;
  const maxScale = 5;

  // Limita a escala entre os valores mínimo e máximo
  const clampedScale = Math.max(minScale, Math.min(newScale, maxScale));

  // Se o valor inserido for maior que o máximo, mostra um aviso
  if (newScale > maxScale) {
    alert(
      `The maximum allowed scale is ${maxScale}. The object has been set to this value.`,
    );
  }

  const dropdown = document.getElementById("object-dropdown");
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    alert("Please select an object first");
    return;
  }

  if (selectedValue.startsWith("planet-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (planetMeshes[index]) {
      planetMeshes[index].mesh.scale.set(
        clampedScale,
        clampedScale,
        clampedScale,
      );
    }
  } else if (selectedValue.startsWith("moon-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (moons[index]) {
      moons[index].mesh.scale.set(clampedScale, clampedScale, clampedScale);
    }
  } else if (selectedValue === "sun") {
    alert("It's not possible to resize the Sun!");
  }
}

// Adiciona event listener para o Enter no campo de redimensionamento
document.getElementById("resize-scale").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    resizeObject(e.target.value);
    e.target.value = ""; // Limpa o campo após aplicar
  }
});

/**
 * @description Edits the rotation of the selected object based on the provided x, y, and z rotation values.
 */
function editRotation() {
  const dropdown = document.getElementById("object-dropdown");
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    alert("Please select an object first");
    return;
  }

  // Obter valores dos campos de input e converter para números
  const rotationX =
    parseFloat(document.getElementById("rotation-x").value) || 0;
  const rotationY =
    parseFloat(document.getElementById("rotation-y").value) || 0;
  const rotationZ =
    parseFloat(document.getElementById("rotation-z").value) || 0;

  if (selectedValue.startsWith("planet-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (planetMeshes[index]) {
      planetMeshes[index].mesh.rotation.set(rotationX, rotationY, rotationZ);
    }
  } else if (selectedValue.startsWith("moon-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (moons[index]) {
      moons[index].mesh.rotation.set(rotationX, rotationY, rotationZ);
    }
  } else if (selectedValue === "sun") {
    sun.rotation.set(rotationX, rotationY, rotationZ);
    sunGlow.rotation.set(rotationX, rotationY, rotationZ); // Rotaciona também o glow do Sol
  }
}

// Adiciona event listeners para os campos de rotação
document.getElementById("rotation-x").addEventListener("change", editRotation);
document.getElementById("rotation-y").addEventListener("change", editRotation);
document.getElementById("rotation-z").addEventListener("change", editRotation);

// Adiciona suporte para pressionar Enter
document.getElementById("rotation-x").addEventListener("keypress", (e) => {
  if (e.key === "Enter") editRotation();
});
document.getElementById("rotation-y").addEventListener("keypress", (e) => {
  if (e.key === "Enter") editRotation();
});
document.getElementById("rotation-z").addEventListener("keypress", (e) => {
  if (e.key === "Enter") editRotation();
});

/**
 * @description Edits the texture of the selected planet or moon based on the provided texture path.
 * @param {string} texturePath - Path to the new texture image
 */
function editTexture(texturePath) {
  // Verifica se o caminho foi fornecido
  if (!texturePath || texturePath.trim() === "") {
    alert("Por favor insira um caminho válido para a textura");
    return;
  }

  const dropdown = document.getElementById("object-dropdown");
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    alert("Por favor selecione um objeto primeiro");
    return;
  }

  // Função para aplicar a textura a um material
  const applyTexture = (material, path) => {
    textureLoader.load(
      path,
      (texture) => {
        // Mantém as propriedades existentes do material
        material.map = texture;
        material.needsUpdate = true;
        alert("Texture applied successfully!");
      },
      undefined, // Progress callback (opcional)
      (error) => {
        console.error("Error loading texture:", error);
        alert(`Error loading texture: ${error.message}`);
      },
    );
  };

  if (selectedValue.startsWith("planet-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (planetMeshes[index]) {
      applyTexture(planetMeshes[index].mesh.material, texturePath);

      // Atualiza também os anéis de Saturno se for o caso
      if (
        planets[index]?.name === "Saturn" &&
        planetMeshes[index].mesh.children[0]
      ) {
        textureLoader.load(texturePath, (texture) => {
          planetMeshes[index].mesh.children[0].material.map = texture;
          planetMeshes[index].mesh.children[0].material.needsUpdate = true;
        });
      }
    }
  } else if (selectedValue.startsWith("moon-")) {
    const index = parseInt(selectedValue.split("-")[1]);
    if (moons[index]) {
      applyTexture(moons[index].mesh.material, texturePath);
    }
  } else if (selectedValue === "sun") {
    alert("It's not possible to change the Sun's texture!");
  }
}

// Adiciona event listener para o Enter no campo de textura
document.getElementById("texture-path").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    editTexture(e.target.value);
    e.target.value = ""; // Limpa o campo após aplicar
  }
});

// Adiciona sugestões de texturas disponíveis
const availableTextures = [
  "textures/mercury.jpg",
  "textures/venus.jpg",
  "textures/earth.jpg",
  "textures/mars.jpg",
  "textures/jupiter.jpg",
  "textures/saturn.jpg",
  "textures/uranus.jpg",
  "textures/neptune.jpg",
  "textures/moon.jpg",
  "textures/ceres_fictional.jpg",
  "textures/eris_fictional.jpg",
  "textures/haumea_fictional.jpg",
  "textures/makemake_fictional.jpg",
];

// Preenche um datalist com sugestões (opcional)
const textureDatalist = document.createElement("datalist");
textureDatalist.id = "texture-suggestions";
availableTextures.forEach((texture) => {
  const option = document.createElement("option");
  option.value = texture;
  textureDatalist.appendChild(option);
});
document.getElementById("texture-path").parentNode.appendChild(textureDatalist);
document
  .getElementById("texture-path")
  .setAttribute("list", "texture-suggestions");

/**
 * @description Changes the intensity of the sun light in the scene with validation and limits.
 * @param {number|string} intensity - The new light intensity (0-100)
 */
function changeSunLightIntensity(intensity) {
  // Convert input to number
  const newIntensity = parseFloat(intensity);

  // Validate input
  if (isNaN(newIntensity)) {
    alert("Please enter a valid number for the sun intensity (0-100)");
    return;
  }

  // Define intensity limits
  const minIntensity = 0;
  const maxIntensity = 150; // Maximum allowed intensity
  const recommendedMax = 100; // Recommended maximum

  // Clamp the intensity value
  const clampedIntensity = Math.max(
    minIntensity,
    Math.min(newIntensity, maxIntensity),
  );

  // Warn if exceeding recommended maximum
  if (newIntensity > recommendedMax) {
    if (
      !confirm(
        `The recommended maximum intensity is ${recommendedMax}. Are you sure you want to set it to ${clampedIntensity}?` +
          "\n\nThis may cause performance issues or visual artifacts." +
          "\n\nClick OK to proceed, or Cancel to keep the previous value.",
      )
    ) {
      return; // User canceled
    }
  }

  // Apply intensity changes
  if (sunLight) {
    sunLight.intensity = clampedIntensity;

    // Also adjust sun glow effect proportionally
    if (sunGlow.material) {
      sunGlow.material.opacity = 0.1 * (clampedIntensity / 100);
      sunGlow.material.needsUpdate = true;
    }

    // Update the input field to show clamped value
    document.getElementById("sun-intensity").value = clampedIntensity;

    // Visual feedback
    const intensityElement = document.createElement("div");
    intensityElement.textContent = `Intensidade do Sol: ${clampedIntensity.toFixed(1)}`;
    intensityElement.style.position = "absolute";
    intensityElement.style.top = "20px";
    intensityElement.style.right = "20px";
    intensityElement.style.backgroundColor = "rgba(0,0,0,0.7)";
    intensityElement.style.color = "white";
    intensityElement.style.padding = "5px 10px";
    intensityElement.style.borderRadius = "5px";
    intensityElement.style.zIndex = "1000";
    document.body.appendChild(intensityElement);

    // Remove feedback after 2 seconds
    setTimeout(() => {
      intensityElement.remove();
    }, 2000);
  }
}

// Add event listeners
document.getElementById("sun-intensity").addEventListener("change", (e) => {
  changeSunLightIntensity(e.target.value);
});

document.getElementById("sun-intensity").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    changeSunLightIntensity(e.target.value);
  }
});

// Set initial placeholder with current intensity
if (sunLight) {
  document.getElementById("sun-intensity").placeholder =
    `Atual: ${sunLight.intensity}`;
}

// Inicializa a drop-down
updateObjectDropdown();
// -------------------------------------- END ANIMATE FUNCTION ------------------------------------

// ------------------------------------ BEGIN ANIMATE FUNCTION ------------------------------------
const animatedModels = [];

/**
 * @description Adds a model to the animated models array with its mesh, direction, and speed.
 * @return {void}
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Get the time elapsed since the last frame
  const degToRad = Math.PI / 180;

  animatedModels.forEach((item) => {
    item.mesh.position.add(item.direction.clone().multiplyScalar(item.speed));
  });

  planetMeshes.forEach((planet) => {
    // A velocidade base do planeta (planet.speed) é o fator relativo do planeta
    // simulationSpeed é em graus/segundo, converte para radianos/segundo
    const angularSpeed = simulationSpeed * degToRad; // rad/s

    // Atualiza o ângulo orbital
    if (planet.angle === undefined) planet.angle = 0;
    planet.angle += planet.speed * angularSpeed * delta;

    // Calcula posição elíptica
    const x = planet.a * Math.cos(planet.angle);
    const z = planet.b * Math.sin(planet.angle);

    planet.mesh.position.set(x, 0, z);

    // Rotação do planeta sobre o próprio eixo (opcional)
    planet.mesh.rotation.y += planet.rotationSpeed * angularSpeed * delta;
  });

  // Enterprise orbit around Venus
  if (enterprise && planetMeshes[1]) {
    const venus = planetMeshes[1].mesh;
    enterpriseOrbitAngle += enterpriseOrbitSpeed;

    // Inclinação do plano orbital (em radianos)
    const inclination = Math.PI / 6; // 30 graus

    // Cálculo da órbita inclinada
    const x =
      venus.position.x + Math.cos(enterpriseOrbitAngle) * enterpriseOrbitRadius;
    const z =
      venus.position.z + Math.sin(enterpriseOrbitAngle) * enterpriseOrbitRadius;
    const y =
      venus.position.y +
      Math.sin(enterpriseOrbitAngle) *
        enterpriseOrbitRadius *
        Math.sin(inclination);

    // Atualiza a posição da nave
    enterprise.position.set(x, y, z);

    // Rotaciona a nave para apontar na direção do movimento
    const nextAngle = enterpriseOrbitAngle + 0.01;
    const nextX =
      venus.position.x + Math.cos(nextAngle) * enterpriseOrbitRadius;
    const nextZ =
      venus.position.z + Math.sin(nextAngle) * enterpriseOrbitRadius;
    const nextY =
      venus.position.y +
      Math.sin(nextAngle) * enterpriseOrbitRadius * Math.sin(inclination);

    const target = new THREE.Vector3(nextX, nextY, nextZ);
    enterprise.lookAt(target); // faz a nave apontar para a próxima posição na órbita
  }

  if (enterpriseE && planetMeshes[2]) {
    const earth = planetMeshes[2].mesh;
    enterpriseEOrbitAngle += enterpriseEOrbitSpeed;
    const x =
      earth.position.x +
      Math.cos(enterpriseEOrbitAngle) * enterpriseEOrbitRadius;
    const z =
      earth.position.z +
      Math.sin(enterpriseEOrbitAngle) * enterpriseEOrbitRadius;
    const y =
      earth.position.y +
      Math.sin(enterpriseEOrbitAngle) *
        enterpriseEOrbitRadius *
        Math.sin(enterpriseEInclination);

    // Atualiza a posição da nave Enterprise E
    enterpriseE.position.set(x, y, z);

    const nextAngle = enterpriseEOrbitAngle + 0.01;
    const nextX =
      earth.position.x + Math.cos(nextAngle) * enterpriseEOrbitRadius;
    const nextZ =
      earth.position.z + Math.sin(nextAngle) * enterpriseEOrbitRadius;
    const nextY =
      earth.position.y +
      Math.sin(nextAngle) *
        enterpriseEOrbitRadius *
        Math.sin(enterpriseEInclination);
    enterpriseE.lookAt(new THREE.Vector3(nextX, nextY, nextZ));
  }

  // Lucrehulk orbita Júpiter (índice 4)
  if (lucrehulk && planetMeshes[4]) {
    const jupiter = planetMeshes[4].mesh;
    lucrehulkOrbitAngle += lucrehulkOrbitSpeed;

    const x =
      jupiter.position.x + Math.cos(lucrehulkOrbitAngle) * lucrehulkOrbitRadius;
    const z =
      jupiter.position.z + Math.sin(lucrehulkOrbitAngle) * lucrehulkOrbitRadius;
    const y =
      jupiter.position.y +
      Math.sin(lucrehulkOrbitAngle) *
        lucrehulkOrbitRadius *
        Math.sin(lucrehulkInclination);

    lucrehulk.position.set(x, y, z);

    // Orientar a estação na direção do movimento
    const nextAngle = lucrehulkOrbitAngle + 0.01;
    const nextX =
      jupiter.position.x + Math.cos(nextAngle) * lucrehulkOrbitRadius;
    const nextZ =
      jupiter.position.z + Math.sin(nextAngle) * lucrehulkOrbitRadius;
    const nextY =
      jupiter.position.y +
      Math.sin(nextAngle) *
        lucrehulkOrbitRadius *
        Math.sin(lucrehulkInclination);

    lucrehulk.lookAt(new THREE.Vector3(nextX, nextY, nextZ));
  }

  // Star Destroyer orbita Mercúrio (índice 0)
  if (starDestroyer && planetMeshes[0]) {
    const mercury = planetMeshes[0].mesh;
    starDestroyerOrbitAngle -= starDestroyerOrbitSpeed;

    const x =
      mercury.position.x +
      Math.cos(starDestroyerOrbitAngle) * starDestroyerOrbitRadius;
    const z =
      mercury.position.z +
      Math.sin(starDestroyerOrbitAngle) * starDestroyerOrbitRadius;
    const y =
      mercury.position.y +
      Math.sin(starDestroyerOrbitAngle) *
        starDestroyerOrbitRadius *
        Math.sin(starDestroyerInclination);

    starDestroyer.position.set(x, y, z);

    // Orientar o modelo
    const nextAngle = starDestroyerOrbitAngle + 0.01;
    const nextX =
      mercury.position.x + Math.cos(nextAngle) * starDestroyerOrbitRadius;
    const nextZ =
      mercury.position.z + Math.sin(nextAngle) * starDestroyerOrbitRadius;
    const nextY =
      mercury.position.y +
      Math.sin(nextAngle) *
        starDestroyerOrbitRadius *
        Math.sin(starDestroyerInclination);

    starDestroyer.lookAt(new THREE.Vector3(nextX, nextY, nextZ));
  }

  // Death Star orbita Marte (índice 3)
  if (deathStar && planetMeshes[3]) {
    const mars = planetMeshes[3].mesh;
    deathStarAngle += deathStarSpeed;

    const x = mars.position.x + Math.cos(deathStarAngle) * deathStarOrbitRadius;
    const z = mars.position.z + Math.sin(deathStarAngle) * deathStarOrbitRadius;
    const y = mars.position.y;

    deathStar.position.set(x, y, z);

    // Fazer a Death Star apontar para a frente da órbita
    const nextAngle = deathStarAngle + 0.01;
    const nextX = mars.position.x + Math.cos(nextAngle) * deathStarOrbitRadius;
    const nextZ = mars.position.z + Math.sin(nextAngle) * deathStarOrbitRadius;
    const target = new THREE.Vector3(nextX, y, nextZ);
    deathStar.lookAt(target);
  }

  // Update moon positions
  moons.forEach((moon) => {
    moon.angle += moon.speed;
    const parent = moon.parent.position;
    moon.mesh.position.x = parent.x + Math.cos(moon.angle) * moon.orbitRadius;
    moon.mesh.position.z = parent.z + Math.sin(moon.angle) * moon.orbitRadius;

    moon.mesh.rotation.y += moon.rotationSpeed * delta;
  });

  // Reset direção
  direction.set(0, 0, 0);

  // Definir movimentos baseados nas teclas pressionadas
  direction.z = Number(keys.w) - Number(keys.s); // frente/trás
  direction.x = Number(keys.d) - Number(keys.a); // direita/esquerda
  direction.y = Number(keys.r) - Number(keys.q); // cima/baixo
  direction.normalize();

  // Obter vetor "frente" baseado na orientação da câmara
  const frontVector = new THREE.Vector3();
  controls.getDirection(frontVector);
  frontVector.y = 0;
  frontVector.normalize();

  // Obter vetor lateral (direita)
  const sideVector = new THREE.Vector3();
  sideVector.crossVectors(frontVector, camera.up).normalize(); // corrigido aqui!

  // Vetor final de movimento
  const moveVector = new THREE.Vector3();
  moveVector
    .addScaledVector(frontVector, direction.z)
    .addScaledVector(sideVector, direction.x)
    .addScaledVector(new THREE.Vector3(0, 1, 0), direction.y); // movimento vertical

  // Aplicar movimento à posição da câmara
  controls.object.position.addScaledVector(moveVector, moveSpeed);

  comets.forEach((comet) => {
    comet.angle += comet.speed;
    const a = comet.orbitRadius;
    const b = comet.orbitRadius * comet.excentricity;
    const x = a * Math.cos(comet.angle);
    const z = b * Math.sin(comet.angle);
    const y = Math.sin(comet.angle) * a * Math.sin(comet.inclination);

    comet.light.position.set(x, y, z);

    // Calcule o próximo ponto da órbita para orientar a cauda
    const nextAngle = comet.angle + 0.01 * comet.directionSign;
    const nextX = a * Math.cos(nextAngle);
    const nextZ = b * Math.sin(nextAngle);
    const nextY = Math.sin(nextAngle) * a * Math.sin(comet.inclination);

    // A cauda aponta para trás do movimento (do núcleo para o ponto anterior)
    const tailDirection = new THREE.Vector3(
      x - nextX,
      y - nextY,
      z - nextZ,
    ).normalize();
    comet.tail.lookAt(comet.tail.position.clone().add(tailDirection));
  });

  renderer.render(scene, camera);
}
animate();
// ------------------------------------ END ANIMATE FUNCTION ------------------------------------