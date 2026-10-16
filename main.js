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

// ==========================================
// SETTINGS
// ==========================================

const TARGET_TILT_DEGREES = 90;
const SPEED_MULTIPLIER = 2.5;
const TILT_SPEED = 3.0;
const FLAME_OFFSET_Y = 0;

const BACKGROUND_STAR_COUNT = 9000;
const BACKGROUND_STAR_SIZE = 2.6;

console.log('main.js BUILD v6 loaded');

// ==========================================
// SCENE SETUP
// ==========================================

const canvas = document.getElementById('game-canvas');
const missionStatus = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownOverlay = document.getElementById('countdown-overlay');

const scene = new THREE.Scene();

const skyColour = new THREE.Color(0xbde0fe);
const spaceColour = new THREE.Color(0x02030d);

scene.background = skyColour.clone();

setupRocketControls();

const camera = setupCamera();

camera.far = Math.max(camera.far, 2000);
camera.updateProjectionMatrix();

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

const cameraStartPosition = camera.position.clone();

// ==========================================
// SMOKE EFFECT
// ==========================================

const smokeParticles = [];
let smokeActive = false;
let smokeStopping = false;

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
    smokeStopping = false;

    smokeParticles.forEach(particle => {
        particle.age = -particle.delay;
        particle.mesh.visible = false;
    });
}

function updateSmokeEffect(deltaTime) {
    if (!smokeActive) return;

    let anyVisible = false;

    smokeParticles.forEach(particle => {
        particle.age += deltaTime;

        if (particle.age < 0) return;

        if (particle.age >= particle.lifetime) {
            if (smokeStopping) {
                particle.mesh.visible = false;
                particle.mesh.material.opacity = 0;
                particle.age = -9999;
                return;
            }

            particle.age = 0;
            particle.lifetime = 2 + Math.random() * 2;

            particle.mesh.position.set(
                (rocket ? rocket.position.x : -0.9) +
                (Math.random() - 0.5) * 2,
                0.15 + Math.random() * 0.5,
                (rocket ? rocket.position.z : -0.6) +
                (Math.random() - 0.5) * 2
            );

            particle.velocity.set(
                (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 1.2,
                (Math.random() - 0.5) * 1.5
            );

            particle.mesh.scale.setScalar(0.45 + Math.random() * 0.5);
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
        anyVisible = true;
    });

    if (smokeStopping && !anyVisible) {
        smokeActive = false;
    }
}

// ==========================================
// SPACE ENVIRONMENT: SMALL BACKGROUND STARS
// ==========================================

function createSoftDotTexture() {
    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = canvasTexture.height = 64;

    const context = canvasTexture.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);

    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvasTexture);
}

function createSpaceEnvironment() {
    const starPositions = new Float32Array(
        BACKGROUND_STAR_COUNT * 3
    );

    const temporaryVector = new THREE.Vector3();

    for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
        do {
            temporaryVector.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            );
        } while (
            temporaryVector.lengthSq() > 1 ||
            temporaryVector.lengthSq() < 0.0001
        );

        temporaryVector.normalize().multiplyScalar(
            400 + Math.random() * 100
        );

        starPositions[i * 3] = temporaryVector.x;
        starPositions[i * 3 + 1] = temporaryVector.y;
        starPositions[i * 3 + 2] = temporaryVector.z;
    }

    const starGeometry = new THREE.BufferGeometry();

    starGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        map: createSoftDotTexture(),
        alphaTest: 0.01,
        size: BACKGROUND_STAR_SIZE,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.frustumCulled = false;
    scene.add(stars);

    // Planet remains hidden until the portfolio sequence is built.
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
    planet.visible = false;
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
    atmosphere.visible = false;
    scene.add(atmosphere);

    return {
        stars,
        planet,
        atmosphere
    };
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
    flameGroup.position.y = FLAME_OFFSET_Y;

    const outerHeight = 1.5;
    const outerGeometry = new THREE.ConeGeometry(0.32, outerHeight, 16);

    outerGeometry.rotateX(Math.PI);
    outerGeometry.translate(0, -outerHeight / 2, 0);

    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6500,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });

    engineFlame = new THREE.Mesh(outerGeometry, outerMaterial);
    flameGroup.add(engineFlame);

    const innerHeight = 0.95;
    const innerGeometry = new THREE.ConeGeometry(0.18, innerHeight, 16);

    innerGeometry.rotateX(Math.PI);
    innerGeometry.translate(0, -innerHeight / 2, 0);

    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
    });

    innerFlame = new THREE.Mesh(innerGeometry, innerMaterial);
    flameGroup.add(innerFlame);

    rocket.add(flameGroup);

    engineLight = new THREE.PointLight(0xff7700, 3, 8);
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
    if (countdownStarted || countdownRunning || countdownFinished) {
        return;
    }

    countdownStarted = true;
    countdownRunning = true;

    startSmokeEffect();

    missionStatus.textContent = 'STATUS: COUNTDOWN INITIATED (build v6)';
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

let launchStartPosition = new THREE.Vector3();
let cameraOffsetStart = new THREE.Vector3();
let cameraOffsetEnd = new THREE.Vector3();
let cameraTransition = 0;

const rocketCentreOffset = new THREE.Vector3();
const rocketCentre = new THREE.Vector3();

let currentTilt = 0;

const targetTilt = THREE.MathUtils.degToRad(
    TARGET_TILT_DEGREES
);

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
    currentTilt = 0;

    rocket.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(rocket);
    box.getCenter(rocketCentreOffset).sub(rocket.position);

    const flame = createEngineFlame();
    flame.visible = true;
    engineLight.visible = true;

    launchStartPosition.copy(rocket.position);

    cameraOffsetStart.copy(cameraStartPosition).sub(rocket.position);
    cameraOffsetEnd.set(0, 5, 24);

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

let spaceProgress = 0;
let starFade = 0;

const flyDirection = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.05);

    updateSmokeEffect(deltaTime);

    if (rocketLaunchActive && rocket) {
        const controlsSpeed = updateRocketControls(
            rocket,
            deltaTime,
            launchSpeed
        );

        const currentSpeed = Math.max(
            Number.isFinite(controlsSpeed)
                ? controlsSpeed
                : launchSpeed,
            launchSpeed * 0.6
        ) * SPEED_MULTIPLIER;

        const heightGained =
            rocket.position.y - launchStartPosition.y;

        const cloudsCleared = updateClouds(rocket.position.y);

        // Cinematic camera transition after clearing the clouds.
        const distanceNow = rocket.position.distanceTo(
            launchStartPosition
        );

        const cameraMoveStartDistance =
            getCloudClearanceHeight() + 16;

        const cameraMoveProgress = THREE.MathUtils.clamp(
            (distanceNow - cameraMoveStartDistance) / 65,
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

        // Tip the rocket forward after the camera begins moving behind it.
        const desiredTilt =
            cloudsCleared && cameraTransition > 0.3
                ? targetTilt
                : 0;

        currentTilt +=
            (desiredTilt - currentTilt) *
            (1 - Math.exp(-TILT_SPEED * deltaTime));

        rocket.rotation.set(-currentTilt, 0, rocket.rotation.z);

        // Move in the direction the rocket is pointing.
        flyDirection.set(
            0,
            Math.cos(currentTilt),
            -Math.sin(currentTilt)
        );

        rocket.position.addScaledVector(
            flyDirection,
            currentSpeed * deltaTime
        );

        const distanceTravelled = rocket.position.distanceTo(
            launchStartPosition
        );

        const progress = THREE.MathUtils.clamp(
            distanceTravelled / launchDistance,
            0,
            1
        );

        if (heightGained > 12) {
            smokeStopping = true;
        }

        // Keep the rocket's body centre in view as it tilts.
        rocketCentre
            .copy(rocketCentreOffset)
            .applyQuaternion(rocket.quaternion)
            .add(rocket.position);

        const cameraOffset = cameraOffsetStart.clone().lerp(
            cameraOffsetEnd,
            cameraTransition
        );

        const desiredCameraPosition = rocketCentre.clone().add(
            cameraOffset
        );

        camera.position.lerp(
            desiredCameraPosition,
            1 - Math.exp(-5 * deltaTime)
        );

        camera.lookAt(rocketCentre);

        // Transition the sky from blue to deep space.
        const skyProgress = THREE.MathUtils.clamp(
            (progress - 0.04) / 0.25,
            0,
            1
        );

        spaceProgress =
            skyProgress * skyProgress * (3 - 2 * skyProgress);

        // Fade in only the small round background stars.
        const starRaw = THREE.MathUtils.clamp(
            (progress - 0.12) / 0.30,
            0,
            1
        );

        starFade = starRaw * starRaw * (3 - 2 * starRaw);

        scene.background.copy(skyColour).lerp(
            spaceColour,
            spaceProgress
        );

        if (spaceProgress > 0.6) {
            missionStatus.textContent = 'STATUS: ENTERING SPACE';
            instructionText.textContent =
                'Flying forward to the portfolio planets...';
        }

        // Engine flame animation.
        if (engineFlame && innerFlame && engineLight) {
            const flameSpeedFactor = Math.max(
                currentSpeed / launchSpeed,
                0.3
            );

            engineFlame.scale.y =
                flameSpeedFactor * (0.85 + Math.random() * 0.3);

            engineFlame.scale.x =
                engineFlame.scale.z = 0.9 + Math.random() * 0.2;

            innerFlame.scale.y =
                flameSpeedFactor * (0.55 + Math.random() * 0.2);

            innerFlame.scale.x = innerFlame.scale.z = 0.6;

            engineLight.intensity =
                2.5 + flameSpeedFactor * 2.5;
        }

        if (distanceTravelled >= launchDistance) {
            rocketLaunchActive = false;

            missionStatus.textContent = 'STATUS: SPACE REACHED';
            instructionText.textContent =
                'Welcome to space. Portfolio destinations are coming next.';
        }
    }

    // The background stars follow the camera.
    // No streaks, no star trails, and no radial warp-speed effect.
    spaceObjects.stars.position.copy(camera.position);
    spaceObjects.stars.material.opacity = starFade;

    renderer.render(scene, camera);
}

animate();