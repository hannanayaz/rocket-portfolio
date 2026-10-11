// ==========================================
// MAIN MODULE: Rocket Portfolio Launch
// ==========================================

// Import the environment setup and rocket creation functions.
import {
    setupCamera,
    setupLighting,
    createEarthGround
} from './js/environment.js';

import { createRocket } from './js/rocket.js';

// Get the HTML elements used to display the mission information.
const canvas = document.getElementById('game-canvas');
const missionStatus = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownOverlay = document.getElementById('countdown-overlay');

// Create the main Three.js scene.
const scene = new THREE.Scene();

// Set up the camera, lighting, and Earth launch environment.
const camera = setupCamera();
setupLighting(scene);
createEarthGround(scene);

// Store the assembled rocket and launch state.
let rocket = null;
let countdownStarted = false;
let countdownFinished = false;
let countdownRunning = false;
let rocketLaunchActive = false;
let launchPending = false;

// Variables for the engine flame and its light.
let engineFlame = null;
let innerFlame = null;
let engineLight = null;

// Store the starting camera position so we can follow the rocket smoothly.
const cameraStartPosition = camera.position.clone();

// Load the five rocket models and assemble them into one rocket group.
createRocket(scene, (loadedRocket) => {
    rocket = loadedRocket;

    // If the countdown finished before the rocket loaded, launch it now.
    if (launchPending) {
        beginRocketLaunch();
    }
});

// Set up the WebGL renderer.
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Adjust the camera and renderer when the browser window changes size.
// This listener is intentionally included only once.
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// ENGINE FLAME: Create the rocket's exhaust
// ==========================================

function createEngineFlame() {
    // Create a group so both flame layers move with the rocket.
    const flameGroup = new THREE.Group();

    // The outer flame is orange and points downward from the rocket.
    const outerGeometry = new THREE.ConeGeometry(0.22, 0.9, 10);
    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6500
    });

    engineFlame = new THREE.Mesh(outerGeometry, outerMaterial);
    engineFlame.rotation.z = Math.PI;
    engineFlame.position.y = -0.45;
    flameGroup.add(engineFlame);

    // Add a smaller yellow flame inside the orange flame.
    const innerGeometry = new THREE.ConeGeometry(0.12, 0.55, 10);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88
    });

    innerFlame = new THREE.Mesh(innerGeometry, innerMaterial);
    innerFlame.rotation.z = Math.PI;
    innerFlame.position.y = -0.35;
    flameGroup.add(innerFlame);

    // Attach the flame to the assembled rocket.
    // It will move automatically whenever the rocket moves.
    rocket.add(flameGroup);

    // Add an orange light beneath the rocket to suggest engine glow.
    engineLight = new THREE.PointLight(0xff7700, 3, 5);
    engineLight.position.set(0, -0.5, 0);
    rocket.add(engineLight);

    // Keep the flame hidden until the launch begins.
    flameGroup.visible = false;
    engineLight.visible = false;

    // Return the group so we can control its visibility.
    return flameGroup;
}

// ==========================================
// COUNTDOWN: Start the mission with Spacebar
// ==========================================

// Start the countdown only once.
function startCountdown() {
    if (countdownStarted || countdownRunning || countdownFinished) return;

    countdownStarted = true;
    countdownRunning = true;

    missionStatus.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Preparing for launch...';

    // Display the countdown numbers and the liftoff message.
    const sequence = ['3', '2', '1', 'LIFTOFF!'];
    let index = 0;

    countdownOverlay.style.display = 'flex';

    function showNext() {
        // Once the countdown finishes, begin the actual launch.
        if (index >= sequence.length) {
            countdownOverlay.style.display = 'none';
            countdownRunning = false;
            countdownFinished = true;

            startRocketLaunch();
            return;
        }

        countdownOverlay.textContent = sequence[index];
        index++;

        // Show each number for one second and give LIFTOFF a little longer.
        setTimeout(showNext, index === 4 ? 1200 : 1000);
    }

    showNext();
}

// ==========================================
// LIFTOFF: Start moving the rocket upward
// ==========================================

function startRocketLaunch() {
    // If the rocket models are still loading, wait until they are ready.
    if (!rocket) {
        launchPending = true;
        missionStatus.textContent = 'STATUS: PREPARING ROCKET';
        instructionText.textContent = 'Loading rocket systems...';
        return;
    }

    beginRocketLaunch();
}

function beginRocketLaunch() {
    // Prevent the launch from starting more than once.
    if (!rocket || rocketLaunchActive) return;

    launchPending = false;
    rocketLaunchActive = true;

    // Create the engine flame when the rocket is ready to launch.
    const flameGroup = createEngineFlame();
    flameGroup.visible = true;
    engineLight.visible = true;

    missionStatus.textContent = 'STATUS: LIFTOFF — ROCKET ASCENDING';
    instructionText.textContent = 'Rocket launching!';

    // Remember the rocket's starting height for the animation.
    launchStartY = rocket.position.y;
}

// Store the rocket's launch starting height.
let launchStartY = 0;

// ==========================================
// KEYBOARD: Listen for the Spacebar
// ==========================================

window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;

    // Prevent the page from scrolling when Spacebar is pressed.
    event.preventDefault();

    if (!event.repeat) {
        startCountdown();
    }
});

// ==========================================
// ANIMATION: Move the rocket and follow it
// ==========================================

// Use a clock so movement remains smooth on different computers.
const clock = new THREE.Clock();

// Control the rocket's upward speed and travel distance.
const launchSpeed = 3.5;
const launchDistance = 15;

function animate() {
    requestAnimationFrame(animate);

    // Get the time elapsed since the previous frame.
    const deltaTime = Math.min(clock.getDelta(), 0.05);

    // Move the rocket upward after the countdown finishes.
    if (rocketLaunchActive && rocket) {
        const previousY = rocket.position.y;

        rocket.position.y += launchSpeed * deltaTime;

        // Calculate how far the rocket has travelled since liftoff.
        const distanceTravelled = rocket.position.y - launchStartY;

        // Move the camera by the same amount to follow the rocket.
        const movement = rocket.position.y - previousY;
        camera.position.y += movement;

        // Keep the rocket in view as it climbs.
        camera.lookAt(
            rocket.position.x,
            rocket.position.y + 1.5,
            rocket.position.z
        );

        // Animate the flame slightly to make the exhaust feel alive.
        if (engineFlame && innerFlame) {
            const flicker = 0.85 + Math.random() * 0.3;

            engineFlame.scale.set(1, flicker, 1);
            innerFlame.scale.set(1, 0.8 + Math.random() * 0.4, 1);

            // Vary the engine glow during flight.
            engineLight.intensity = 2.5 + Math.random() * 1.5;
        }

        // Stop this launch sequence after the rocket travels far enough.
        if (distanceTravelled >= launchDistance) {
            rocketLaunchActive = false;

            missionStatus.textContent = 'STATUS: ASCENDING INTO SPACE';
            instructionText.textContent =
                'Launch complete. Space exploration is coming next.';
        }
    }

    // Render the current scene from the camera's point of view.
    renderer.render(scene, camera);
}

// Start the animation loop.
animate();
