import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

// Create a scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// SUN
const sunScaledRadius = 5; // this will help in calculations
const sunGeometry = new THREE.SphereGeometry(sunScaledRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// directional light coming from the sun
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);


// PLANETS
const planets = [
  {
    name: 'mercury',
    color: 0xb2b2b2,
    rotationDays: 88,
    distanceFromSun: 58,
    realRadius: 2439.7
  },
  {
    name: 'venus',
    color: 0xe1c16e,
    rotationDays: 224,
    distanceFromSun: 108,
    realRadius: 6051.8
  },
  {
    name: 'earth',
    color: 0x2e8b57,
    rotationDays: 365,
    distanceFromSun: 150,
    realRadius: 6371
  },
  {
    name: 'mars',
    color: 0xb7410e,
    rotationDays: 687,
    distanceFromSun: 228,
    realRadius: 3389.5
  },
  {
    name: 'jupiter',
    color: 0xd9a066,
    rotationDays: 4333,
    distanceFromSun: 778,
    realRadius: 69911
  },
  {
    name: 'saturn',
    color: 0xf4c542,
    rotationDays: 10759,
    distanceFromSun: 1433,
    realRadius: 58232
  },
  {
    name: 'uranus',
    color: 0x70a4ff,
    rotationDays: 30687,
    distanceFromSun: 2870,
    realRadius: 25362
  },
  {
    name: 'neptune',
    color: 0x2b65ec,
    rotationDays: 60190,
    distanceFromSun: 4500,
    realRadius: 24622
  }
];

const planetMeshes = [];

const sunRadius = 696340; // sun radius in km

// normal circle geometry fills the circle, we need a ring
function createOrbit(radius) {
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  return orbitLine;
}

// place planets in scene
planets.forEach(planet => {
  // normalize planet values (distance from sun, rotation speed, etc)
  //
  // speed -> lets say 365 days is 3.65*2=7.3 seconds
  const speed = (planet.rotationDays * 7.3) / 365;
  // Rotation speeds (based on 2π / period)
  const rotationSpeed = (2 * Math.PI) / speed;
  // Distance from sun (normalized)
  const drawDistance = (planet.distanceFromSun / 5) + 1 + sunScaledRadius;
  // scale planet radius
  const radius = (planet.realRadius / sunRadius) * 50;

  console.log(
    planet.name,
    "rotationSpeed: " + rotationSpeed,
    "distance: " + drawDistance,
    "radius: " + radius
  );

  const planetGeometry = new THREE.SphereGeometry(radius, 32, 32 );
  const planetMaterial = new THREE.MeshBasicMaterial( { color: planet.color } );
  const planetMesh = new THREE.Mesh( planetGeometry, planetMaterial );
  planetMesh.position.set(drawDistance, 0, 0);
  scene.add(planetMesh);

  planetMeshes.push({ mesh: planetMesh, rotationSpeed: rotationSpeed, drawDistance: drawDistance, radius: radius });

  // draw orbit
  const orbitMesh = createOrbit(drawDistance);
  scene.add(orbitMesh);
});

// for asteroid and kupier belt
function createBelt(beltConfig) {
  const drawDistanceMin = (beltConfig.distanceFromSunMin / 5) + 1 + sunScaledRadius;
  const drawDistanceMax = (beltConfig.distanceFromSunMax / 5) + 1 + sunScaledRadius;

  const asteroidGroup = new THREE.Group();

  for (let i = 0; i < beltConfig.count; i++) {
    const angle = Math.random() * Math.PI * 2;  // Random angle around the Sun
    const distance = THREE.MathUtils.lerp(drawDistanceMin, drawDistanceMax, Math.random());
    const height = (Math.random() - 0.5) * 10;  // Random height offset for thickness

    const asteroidGeometry = new THREE.SphereGeometry(Math.random() * beltConfig.scaleMultiplier, 8, 8);
    const asteroidMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    });

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    // Position asteroid along a circular orbit with slight vertical variation
    asteroid.position.set(Math.cos(angle) * distance, height, Math.sin(angle) * distance);
    asteroidGroup.add(asteroid);
  }

  return asteroidGroup;
}

const asteroidBelt = {
  distanceFromSunMin: 300,
  distanceFromSunMax: 400,
  count: 5000,
  scaleMultiplier: 0.2
};
const asteroidBeltMesh = createBelt(asteroidBelt);
scene.add(asteroidBeltMesh);

const kupierBelt = {
  distanceFromSunMin: 4800,
  distanceFromSunMax: 7000,
  count: 5000,
  scaleMultiplier: 0.5
};
const kupierBeltMesh = createBelt(kupierBelt);
scene.add(kupierBeltMesh);

// default camera position
camera.position.z = 20;

// setup controls
const controls = new OrbitControls(camera, renderer.domElement);

// animation loop
function animate() {
  const time = performance.now() / 1000; // seconds

  // any updates to the scene, camera, or objects go here
  planetMeshes.forEach(planet => {
    planet.mesh.position.x = Math.cos(time * planet.rotationSpeed) * planet.drawDistance;
    planet.mesh.position.z = Math.sin(time * planet.rotationSpeed) * planet.drawDistance;
  });

  controls.update();

	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
