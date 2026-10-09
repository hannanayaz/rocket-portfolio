// ==========================================
// MAIN CONTROLLER (Importing from ./js subfolder)
// ==========================================
import { setupCamera, setupLighting, createEarthGround } from './js/environment.js';
import { createRocket } from './js/rocket.js';

const canvas = document.getElementById('game-canvas');
const scene = new THREE.Scene();

// Setup isometric camera and soft earth lighting
const camera = setupCamera();
setupLighting(scene);

// Build Earth, trees, and launch holding tower
const earth = createEarthGround(scene);

// Build and dock the Rocket on the pad
const rocket = createRocket(scene);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Window resize listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();