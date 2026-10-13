
// ==========================================
// MAIN MODULE: Rocket Portfolio Launch
// ==========================================

import {
    setupCamera,
    setupLighting,
    createEarthGround
} from './js/environment.js';

import { createRocket } from './js/rocket.js';

import {
    createClouds,
    updateClouds,
    getCloudClearanceHeight
} from './js/clouds.js';

import {
    setupRocketControls,
    updateRocketControls
} from './js/controls.js';

const canvas = document.getElementById('game-canvas');
const missionStatus = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownOverlay = document.getElementById('countdown-overlay');

const scene = new THREE.Scene();
setupRocketControls();

const camera = setupCamera();
setupLighting(scene);
createEarthGround(scene);

let rocket = null;
let countdownStarted = false;
let countdownFinished = false;
let countdownRunning = false;
let rocketLaunchActive = false;
let launchPending = false;

let engineFlame = null;
let innerFlame = null;
let engineLight = null;
let flameGroup = null;

// ==========================================
// SMOKE EFFECT
// ==========================================

const smokeParticles = [];
let smokeActive = false;

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

function startSmokeEffect() {
    smokeActive = true;

    smokeParticles.forEach(particle => {
        particle.age = -particle.delay;
        particle.mesh.visible = false;
    });
}

function updateSmokeEffect(deltaTime) {
    if (!smokeActive) return;

    smokeParticles.forEach(particle => {
        particle.age += deltaTime;

        if (particle.age < 0) return;

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

        particle.mesh.position.addScaledVector(
            particle.velocity,
            deltaTime
        );

        particle.velocity.x *= 0.995;
        particle.velocity.z *= 0.995;

        particle.mesh.scale.setScalar(0.6 + progress * 2.2);
        particle.mesh.material.opacity =
            0.32 * Math.sin(Math.PI * progress);

        particle.mesh.visible = true;
    });
}

// ==========================================
// SCENE, CLOUDS AND SPACE
// ==========================================

const cameraStartPosition = camera.position.clone();

const skyColour = new THREE.Color(0xbde0fe);
const spaceColour = new THREE.Color(0x02030d);

function createSpaceEnvironment() {
    const starCount = 10000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

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

    return { stars, planet, atmosphere };
}

const spaceObjects = createSpaceEnvironment();
createClouds(scene);
createSmokeEffect();

// ==========================================
// ROCKET LOADING
// ==========================================

createRocket(scene, loadedRocket => {
    rocket = loadedRocket;

    if (launchPending) {
        beginRocketLaunch();
    }
});

// ==========================================
// RENDERER
// ==========================================

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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// ENGINE FLAME
// ==========================================

function createEngineFlame() {
    flameGroup = new THREE.Group();

    const outerGeometry = new THREE.ConeGeometry(0.32, 1.5, 12);
    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6500
    });

    engineFlame = new THREE.Mesh(outerGeometry, outerMaterial);
    engineFlame.rotation.z = Math.PI;
    engineFlame.position.y = -0.75;
    flameGroup.add(engineFlame);

    const innerGeometry = new THREE.ConeGeometry(0.18, 0.95, 12);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88
    });

    innerFlame = new THREE.Mesh(innerGeometry, innerMaterial);
    innerFlame.rotation.z = Math.PI;
    innerFlame.position.y = -0.6;
    flameGroup.add(innerFlame);

    rocket.add(flameGroup);

    engineLight = new THREE.PointLight(0xff7700, 3, 5);
    engineLight.position.set(0, -0.5, 0);
    rocket.add(engineLight);

    flameGroup.visible = false;
    engineLight.visible = false;

    return flameGroup;
}

// ==========================================
// COUNTDOWN
// ==========================================

function startCountdown() {
    if (countdownStarted || countdownRunning || countdownFinished) return;

    countdownStarted = true;
    countdownRunning = true;

    startSmokeEffect();

    missionStatus.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Preparing for launch...';

    const sequence = ['3', '2', '1', 'LIFTOFF!'];
    let index = 0;

    countdownOverlay.style.display = 'flex';

    function showNext() {
        if (index >= sequence.length) {
            countdownOverlay.style.display = 'none';
            countdownRunning = false;
            countdownFinished = true;
            startRocketLaunch();
            return;
        }

        countdownOverlay.textContent = sequence[index];
        index++;

        setTimeout(showNext, index === 4 ? 1200 : 1000);
    }

    showNext();
}

// ==========================================
// LAUNCH AND CINEMATIC CAMERA
// ==========================================

let launchStartY = 0;
let cameraOffsetStart = new THREE.Vector3();
let cameraOffsetEnd = new THREE.Vector3();
let cameraTransition = 0;

function startRocketLaunch() {
    if (!rocket) {
        launchPending = true;
        missionStatus.textContent = 'STATUS: PREPARING ROCKET';
        instructionText.textContent = 'Loading rocket systems...';
        return;
    }

    beginRocketLaunch();
}

function beginRocketLaunch() {
    if (!rocket || rocketLaunchActive) return;

    launchPending = false;
    rocketLaunchActive = true;
    cameraTransition = 0;

    const flame = createEngineFlame();
    flame.visible = true;
    engineLight.visible = true;

    launchStartY = rocket.position.y;

    // Preserve the existing launch camera angle before transitioning.
    cameraOffsetStart.copy(cameraStartPosition).sub(rocket.position);

    // Destination: behind the rocket, with a small side angle.
    cameraOffsetEnd.set(3, -3, 26);

    missionStatus.textContent = 'STATUS: LIFTOFF — ROCKET ASCENDING';
    instructionText.textContent = 'Leaving the launch island...';
}

window.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;

    event.preventDefault();

    if (!event.repeat) {
        startCountdown();
    }
});

// ==========================================
// ANIMATION
// ==========================================

const clock = new THREE.Clock();

const launchSpeed = 10;
const launchDistance = 600;

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.05);

    updateSmokeEffect(deltaTime);

    if (rocketLaunchActive && rocket) {
        const currentSpeed = updateRocketControls(
            rocket,
            deltaTime,
            launchSpeed
        );

        rocket.position.y += currentSpeed * deltaTime;

        const distanceTravelled = rocket.position.y - launchStartY;
        const progress = THREE.MathUtils.clamp(
            distanceTravelled / launchDistance,
            0,
            1
        );

        // Clouds fade individually as the rocket passes them.
        const cloudsCleared = updateClouds(rocket.position.y);

        // Start the camera move only after the final cloud is cleared.
        const cameraMoveStartY =
            launchStartY + getCloudClearanceHeight() + 16;

        const cameraMoveProgress = THREE.MathUtils.clamp(
            (rocket.position.y - cameraMoveStartY) / 65,
            0,
            1
        );

        const smoothCameraProgress =
            cameraMoveProgress * cameraMoveProgress *
            (3 - 2 * cameraMoveProgress);

        if (cloudsCleared) {
            cameraTransition = Math.max(
                cameraTransition,
                smoothCameraProgress
            );
        }

        const cameraOffset = cameraOffsetStart.clone().lerp(
            cameraOffsetEnd,
            cameraTransition
        );

        const desiredCameraPosition = rocket.position.clone().add(
            cameraOffset
        );

        camera.position.lerp(
            desiredCameraPosition,
            1 - Math.exp(-2.5 * deltaTime)
        );

        // Aim slightly above the rocket's centre to keep its nose in view.
        const lookTarget = rocket.position.clone();
        lookTarget.y += 1.5;
        camera.lookAt(lookTarget);

        // Transition from the blue sky into deep space.
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

        spaceObjects.stars.material.opacity = smoothSkyProgress;

        // Keep the planet hidden until the portfolio sequence is added.
        spaceObjects.planet.material.opacity = 0;
        spaceObjects.atmosphere.material.opacity = 0;

        if (engineFlame && innerFlame && engineLight) {
            const speedFactor = currentSpeed / launchSpeed;

            engineFlame.scale.y =
                speedFactor * (0.85 + Math.random() * 0.3);

            innerFlame.scale.y =
                speedFactor * (0.8 + Math.random() * 0.4);

            engineLight.intensity = 2.5 + speedFactor * 2.5;
        }

        if (distanceTravelled >= launchDistance) {
            rocketLaunchActive = false;

            missionStatus.textContent = 'STATUS: SPACE REACHED';
            instructionText.textContent =
                'Welcome to space. Portfolio destinations are coming next.';
        }
    }

    renderer.render(scene, camera);
}

animate();
