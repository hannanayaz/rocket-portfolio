
// ==========================================
// MAIN MODULE: Rocket Portfolio Launch
// ==========================================

import {
    setupCamera,
    setupLighting,
    createEarthGround
} from './js/environment.js';

import { createRocket } from './js/rocket.js';


/*
 * Import the keyboard setup and movement functions
 * from the separate rocket controls module.
 */
import {
    setupRocketControls,
    updateRocketControls
} from './js/controls.js';

// Get the HTML elements used to display the mission information.
const canvas = document.getElementById('game-canvas');
const missionStatus = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownOverlay = document.getElementById('countdown-overlay');

// Create the main Three.js scene.
const scene = new THREE.Scene();

// Enable the keyboard listeners for the rocket controls.
setupRocketControls();

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
let flameGroup = null;


// ==========================================
// SMOKE EFFECT: Soft clouds during liftoff
// ==========================================

const smokeParticles = [];
let smokeActive = false;

// Create reusable soft smoke particles around the launchpad.
function createSmokeEffect() {
    const smokeGeometry = new THREE.SphereGeometry(1, 12, 10);

    for (let i = 0; i < 55; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: i % 3 === 0 ? 0xbfc5ce : 0xe1e4e8,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });

        const particle = new THREE.Mesh(smokeGeometry, material);

        particle.visible = false;
        particle.scale.setScalar(0.5 + Math.random() * 0.9);

        scene.add(particle);

        smokeParticles.push({
            mesh: particle,
            velocity: new THREE.Vector3(),
            age: 0,
            lifetime: 2 + Math.random() * 2,
            delay: Math.random() * 2
        });
    }
}

// Activate smoke when the countdown begins.
function startSmokeEffect() {
    smokeActive = true;

    smokeParticles.forEach((particle) => {
        particle.age = -particle.delay;
        particle.mesh.visible = false;
    });
}

// Animate expanding, drifting, and fading smoke clouds.
function updateSmokeEffect(deltaTime) {
    if (!smokeActive) return;

    smokeParticles.forEach((particle) => {
        particle.age += deltaTime;

        // Wait briefly before emitting each new particle.
        if (particle.age < 0) return;

        // Recycle particles to maintain a continuous smoke effect.
        if (particle.age >= particle.lifetime) {
            particle.age = 0;
            particle.lifetime = 2 + Math.random() * 2;

            particle.mesh.position.set(
                rocket ? rocket.position.x + (Math.random() - 0.5) * 2 : -0.9,
                0.15 + Math.random() * 0.5,
                rocket ? rocket.position.z + (Math.random() - 0.5) * 2 : -0.6
            );

            particle.velocity.set(
                (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 1.2,
                (Math.random() - 0.5) * 1.5
            );

            particle.mesh.scale.setScalar(0.45 + Math.random() * 0.5);
            particle.mesh.visible = true;
        }

        const progress = particle.age / particle.lifetime;

        // Smoke rises slowly and spreads outward.
        particle.mesh.position.addScaledVector(
            particle.velocity,
            deltaTime
        );

        particle.velocity.x *= 0.995;
        particle.velocity.z *= 0.995;

        // Clouds grow as they rise, then fade away.
        const size = 0.6 + progress * 2.2;

        particle.mesh.scale.setScalar(size);

        particle.mesh.material.opacity =
            0.32 * Math.sin(Math.PI * progress);

        particle.mesh.visible = true;
    });
}


// Store the camera's original position.
const cameraStartPosition = camera.position.clone();

// Store the initial sky colour and the colour of deep space.
const skyColour = new THREE.Color(0xbde0fe);
const spaceColour = new THREE.Color(0x02030d);

// Create the stars and distant planet for the space journey.
const spaceObjects = createSpaceEnvironment();

// Prepare the smoke particles before the countdown begins.
createSmokeEffect();

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
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// SPACE ENVIRONMENT: Deep 3D starfield
// ==========================================

function createSpaceEnvironment() {
    const starCount = 10000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    // Spread stars through a large 3D volume.
    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 900;
        starPositions[i * 3 + 1] = 20 + Math.random() * 1000;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;

        starSizes[i] = 0.5 + Math.random() * 1.5;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
        'size',
        new THREE.BufferAttribute(starSizes, 1)
    );

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true,
        opacity: 0,
        sizeAttenuation: true,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Distant blue planet.
    const planetGeometry = new THREE.SphereGeometry(5, 32, 24);
    const planetMaterial = new THREE.MeshStandardMaterial({
        color: 0x3678d4,
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        opacity: 0
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(22, 88, -35);
    scene.add(planet);

    // Soft blue atmosphere.
    const atmosphereGeometry = new THREE.SphereGeometry(5.35, 32, 24);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x54aaff,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
    });

    const atmosphere = new THREE.Mesh(
        atmosphereGeometry,
        atmosphereMaterial
    );
    atmosphere.position.copy(planet.position);
    scene.add(atmosphere);

    return {
        stars,
        planet,
        atmosphere
    };
}

// ==========================================
// ENGINE FLAME: Create the rocket's exhaust
// ==========================================

function createEngineFlame() {
    // Create a group so both flame layers move with the rocket.
    flameGroup = new THREE.Group();

    // The outer flame is orange and points downward from the rocket.
    const outerGeometry = new THREE.ConeGeometry(0.32, 1.5, 12);
    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6500
    });

    engineFlame = new THREE.Mesh(outerGeometry, outerMaterial);
    engineFlame.rotation.z = Math.PI;
    engineFlame.position.y = -0.75;
    flameGroup.add(engineFlame);

    // Add a smaller yellow flame inside the orange flame.
    const innerGeometry = new THREE.ConeGeometry(0.18, 0.95, 12);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88
    });

    innerFlame = new THREE.Mesh(innerGeometry, innerMaterial);
    innerFlame.rotation.z = Math.PI;
    innerFlame.position.y = -0.6;
    flameGroup.add(innerFlame);

    // Attach the flame to the assembled rocket.
    rocket.add(flameGroup);

    // Add an orange light beneath the rocket to suggest engine glow.
    engineLight = new THREE.PointLight(0xff7700, 3, 5);
    engineLight.position.set(0, -0.5, 0);
    rocket.add(engineLight);

    // Keep the flame hidden until the launch begins.
    flameGroup.visible = false;
    engineLight.visible = false;

    return flameGroup;
}

// ==========================================
// COUNTDOWN: Start the mission with Spacebar
// ==========================================

function startCountdown() {
    if (countdownStarted || countdownRunning || countdownFinished) return;

    countdownStarted = true;
    countdownRunning = true;

    // Start smoke during the countdown, before the rocket rises.
    startSmokeEffect();

    missionStatus.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Preparing for launch...';

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

        // Show each number for one second and LIFTOFF for a little longer.
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

let launchStartY = 0;
let cameraOffsetStart = new THREE.Vector3();
let cameraOffsetEnd = new THREE.Vector3();

function beginRocketLaunch() {
    // Prevent the launch from starting more than once.
    if (!rocket || rocketLaunchActive) return;

    launchPending = false;
    rocketLaunchActive = true;

    // Create and show the engine flame.
    const flame = createEngineFlame();
    flame.visible = true;
    engineLight.visible = true;

    // Remember the rocket's starting height.
    launchStartY = rocket.position.y;

    // Calculate the camera's starting offset relative to the rocket.
    cameraOffsetStart.copy(cameraStartPosition).sub(rocket.position);

    // Move around to the opposite side of the rocket
    // while pulling back for a cinematic view.
    cameraOffsetEnd.set(8, -4, 28);

    missionStatus.textContent = 'STATUS: LIFTOFF — ROCKET ASCENDING';
    instructionText.textContent = 'Leaving the launch island...';
}

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
// ANIMATION: Launch, camera pullback and space transition
// ==========================================

const clock = new THREE.Clock();

// The rocket will travel farther than in the first launch milestone.
const launchSpeed = 6;
const launchDistance = 600;

function animate() {
    requestAnimationFrame(animate);

    // Get elapsed time for smooth animation.
    const deltaTime = Math.min(clock.getDelta(), 0.05);

    // Update the smoke clouds during countdown and liftoff.
    updateSmokeEffect(deltaTime);

    if (rocketLaunchActive && rocket) {
        // Move the rocket upward.

        // Read the keyboard input and calculate the current upward speed.
        const currentSpeed = updateRocketControls(
            rocket,
            deltaTime,
            launchSpeed
        );

        // Move the rocket upward at the calculated speed.
        rocket.position.y += currentSpeed * deltaTime;


        // Calculate the flight progress from 0 (start) to 1 (destination).
        const distanceTravelled = rocket.position.y - launchStartY;
        const progress = Math.min(distanceTravelled / launchDistance, 1);

        // Smooth the camera pullback instead of moving it abruptly.

        // Switch to the cinematic rear view after entering space.
        const transitionProgress = THREE.MathUtils.clamp(
            (progress - 0.72) / 0.18,
            0,
            1
        );

        const cameraProgress =
            transitionProgress * transitionProgress *
            (3 - 2 * transitionProgress);


        // Gradually move the camera farther away from the rocket.
        const cameraOffset = cameraOffsetStart.clone().lerp(
            cameraOffsetEnd,
            cameraProgress
        );



        // Orbit around the rocket while following its ascent.
        camera.position.copy(rocket.position).add(cameraOffset);

        // Keep the rocket near the centre of the camera view.
        const lookTarget = new THREE.Vector3(
            rocket.position.x,
            rocket.position.y + 1.5,
            rocket.position.z
        );

        // Gently pitch the rocket forward during the space transition.
        rocket.rotation.x = THREE.MathUtils.lerp(
            rocket.rotation.x,
            -0.45,
            cameraProgress
        );

        camera.lookAt(lookTarget);

        // Transition the blue sky gradually into deep space.
        const skyProgress = THREE.MathUtils.clamp(
            (progress - 0.12) / 0.65,
            0,
            1
        );

        const smoothSkyProgress =
            skyProgress * skyProgress * (3 - 2 * skyProgress);

        scene.background.copy(skyColour).lerp(
            spaceColour,
            smoothSkyProgress
        );

        // Let the stars appear during the journey into space.
        // Keep the planet hidden until the title-smash sequence
        // is implemented.
        spaceObjects.stars.material.opacity = smoothSkyProgress;
        spaceObjects.planet.material.opacity = 0;
        spaceObjects.atmosphere.material.opacity = 0;


        // Adjust engine flames and glow according to flight speed.
        if (engineFlame && innerFlame && engineLight) {
            const speedFactor = currentSpeed / launchSpeed;

            engineFlame.scale.y = speedFactor * (0.85 + Math.random() * 0.3);
            innerFlame.scale.y = speedFactor * (0.8 + Math.random() * 0.4);

            engineLight.intensity = 2.5 + speedFactor * 2.5;
        }


        // Stop this milestone after the rocket reaches the space destination.
        if (distanceTravelled >= launchDistance) {
            rocketLaunchActive = false;

            missionStatus.textContent = 'STATUS: SPACE REACHED';
            instructionText.textContent =
                'Welcome to space. Portfolio destinations are coming next.';
        }
    }

    // Render the current scene from the camera's point of view.
    renderer.render(scene, camera);
}

// Start the animation loop.
animate();
