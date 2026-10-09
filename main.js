// ==========================================
// 1. SCENE & CAMERA SETUP
// ==========================================
const canvas = document.getElementById('game-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Start with camera focused on the rocket on the launch pad
camera.position.set(0, -2, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// 2. LIGHTING
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 1.3);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

// ==========================================
// 3. 3D ROCKET ASSEMBLY
// ==========================================
const rocketGroup = new THREE.Group();

// Fuselage
const bodyGeo = new THREE.CylinderGeometry(0.5, 0.7, 3, 32);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
rocketGroup.add(body);

// Nose cone
const noseGeo = new THREE.ConeGeometry(0.5, 1.2, 32);
const noseMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2 });
const nose = new THREE.Mesh(noseGeo, noseMat);
nose.position.y = 2.1;
rocketGroup.add(nose);

// Fins
const finGeo = new THREE.BoxGeometry(0.1, 0.8, 0.8);
const leftFin = new THREE.Mesh(finGeo, noseMat);
leftFin.position.set(-0.7, -1, 0);
rocketGroup.add(leftFin);

const rightFin = new THREE.Mesh(finGeo, noseMat);
rightFin.position.set(0.7, -1, 0);
rocketGroup.add(rightFin);

// Engine nozzle
const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.5, 16);
const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
nozzle.position.y = -1.6;
rocketGroup.add(nozzle);

// Initial position resting on the launch pad
rocketGroup.position.set(0, 0, 0);
scene.add(rocketGroup);

// ==========================================
// 4. 3D LAUNCH PAD (Platform)
// ==========================================
const padGroup = new THREE.Group();

// Concrete Base Disc
const platformGeo = new THREE.CylinderGeometry(3.5, 4.0, 0.8, 32);
const platformMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.8 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -2.2;
padGroup.add(platform);

// Glowing Launch Ring
const ringGeo = new THREE.TorusGeometry(2.2, 0.08, 16, 64);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = -1.78;
padGroup.add(ring);

scene.add(padGroup);

// ==========================================
// 5. STARFIELD
// ==========================================
const starCount = 1500;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 100;
    starPositions[i + 1] = (Math.random() - 0.5) * 140;
    starPositions[i + 2] = (Math.random() - 0.5) * 60;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 });
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// ==========================================
// 6. STATE MACHINE & CONTROLS
// ==========================================
const STATES = { PRE_LAUNCH: 'PRE_LAUNCH', COUNTDOWN: 'COUNTDOWN', IN_FLIGHT: 'IN_FLIGHT' };
let currentState = STATES.PRE_LAUNCH;

const keys = { ArrowUp: false, ArrowLeft: false, ArrowRight: false };
const statusText = document.getElementById('mission-status');
const instructionText = document.getElementById('instruction-text');
const countdownEl = document.getElementById('countdown-overlay');

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && currentState === STATES.PRE_LAUNCH) {
        startCountdown();
    }
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function startCountdown() {
    currentState = STATES.COUNTDOWN;
    statusText.textContent = 'STATUS: COUNTDOWN INITIATED';
    instructionText.textContent = 'Hold tight for ignition!';

    let count = 3;
    countdownEl.textContent = count;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else if (count === 0) {
            countdownEl.textContent = 'LIFTOFF!';
        } else {
            clearInterval(timer);
            countdownEl.textContent = '';
            currentState = STATES.IN_FLIGHT;
            statusText.textContent = 'STATUS: IN FLIGHT';
            instructionText.innerHTML = 'Use <b>Left/Right</b> to Steer | Hold <b>Up Arrow</b> to Boost';
        }
    }, 1000);
}

// ==========================================
// 7. ANIMATION LOOP
// ==========================================
let velocityX = 0;

function animate() {
    requestAnimationFrame(animate);

    if (currentState === STATES.PRE_LAUNCH || currentState === STATES.COUNTDOWN) {
        // Gentle hovering / idle vibration on the pad
        if (currentState === STATES.COUNTDOWN) {
            rocketGroup.position.x = (Math.random() - 0.5) * 0.08; // Pre-launch engine rumble
        }
    } else if (currentState === STATES.IN_FLIGHT) {
        // Drop the launchpad down away from view
        if (padGroup.position.y > -50) {
            padGroup.position.y -= 0.3;
        }

        // Steering
        if (keys.ArrowLeft) velocityX = -0.12;
        else if (keys.ArrowRight) velocityX = 0.12;
        else velocityX *= 0.88;

        rocketGroup.position.x += velocityX;
        if (rocketGroup.position.x > 8) rocketGroup.position.x = 8;
        if (rocketGroup.position.x < -8) rocketGroup.position.x = -8;

        rocketGroup.rotation.z = -velocityX * 2.5;

        // Star streaming
        const starCoords = starField.geometry.attributes.position.array;
        const flightSpeed = keys.ArrowUp ? 1.0 : 0.3;

        for (let i = 1; i < starCount * 3; i += 3) {
            starCoords[i] -= flightSpeed;
            if (starCoords[i] < -70) starCoords[i] = 70;
        }
        starField.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

animate();